import { after, NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { createConfiguredPolicy } from '@/lib/configuredPolicy';
import { db } from '@/lib/db';
import { discoverPolicySources } from '@/lib/policyDiscovery';
import { getErrorMessage } from '@/lib/safeErrors';

// Discovery can legitimately take a few minutes when the fallback retrieval
// layers are needed. Hosts that enforce route limits can use this hint.
export const maxDuration = 300;

interface DiscoveryJobState {
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt: string | null;
  candidateCount: number;
  error: string | null;
}

const globalDiscovery = globalThis as typeof globalThis & {
  policyDiscoveryJobs?: Map<string, DiscoveryJobState>;
};

const discoveryJobs =
  globalDiscovery.policyDiscoveryJobs || new Map<string, DiscoveryJobState>();
globalDiscovery.policyDiscoveryJobs = discoveryJobs;

function validateCompanyWebsite(rawUrl: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(rawUrl).protocol);
  } catch {
    return false;
  }
}

async function runDiscoveryJob(company: { id: string; name: string; website: string }) {
  try {
    const results = await discoverPolicySources(company);
    const existingPolicies = await db.policy.findMany({
      where: { companyId: company.id },
      select: { type: true, jurisdiction: true, url: true },
    });
    const existingKeys = new Set(
      existingPolicies.map((policy) => `${policy.type}|${policy.jurisdiction}|${policy.url}`)
    );
    let candidateCount = 0;

    for (const candidate of results) {
      const policyKey = `${candidate.type}|${candidate.jurisdiction}|${candidate.url}`;
      if (existingKeys.has(policyKey)) continue;

      const unique = {
        companyId_url_type_jurisdiction: {
          companyId: company.id,
          url: candidate.url,
          type: candidate.type,
          jurisdiction: candidate.jurisdiction,
        },
      };
      await db.policyDiscoveryCandidate.upsert({
        where: unique,
        create: {
          companyId: company.id,
          name: candidate.name,
          type: candidate.type,
          url: candidate.url,
          jurisdiction: candidate.jurisdiction,
          confidence: candidate.confidence,
          discoverySource: candidate.discoverySource,
          retrievalSource: candidate.retrievalSource,
          reason: candidate.reason,
          diagnosticsJson: JSON.stringify(candidate.diagnostics),
        },
        update: {
          name: candidate.name,
          confidence: candidate.confidence,
          discoverySource: candidate.discoverySource,
          retrievalSource: candidate.retrievalSource,
          reason: candidate.reason,
          diagnosticsJson: JSON.stringify(candidate.diagnostics),
        },
      });
      candidateCount++;
    }

    discoveryJobs.set(company.id, {
      status: 'completed',
      startedAt: discoveryJobs.get(company.id)?.startedAt || new Date().toISOString(),
      completedAt: new Date().toISOString(),
      candidateCount,
      error: null,
    });
  } catch (error) {
    console.error(`[Policy Discovery] ${company.name}:`, error);
    discoveryJobs.set(company.id, {
      status: 'failed',
      startedAt: discoveryJobs.get(company.id)?.startedAt || new Date().toISOString(),
      completedAt: new Date().toISOString(),
      candidateCount: 0,
      error: getErrorMessage(error),
    });
  }
}

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const companyId = request.nextUrl.searchParams.get('companyId')?.trim();
  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required.' }, { status: 400 });
  }

  let candidates;
  try {
    candidates = await db.policyDiscoveryCandidate.findMany({
      where: { companyId },
      orderBy: [{ status: 'asc' }, { confidence: 'desc' }, { createdAt: 'desc' }],
    });
  } catch (error) {
    console.error('[Policy Discovery] Unable to read discovery storage:', error);
    return NextResponse.json(
      {
        error: 'Policy discovery storage is unavailable. Apply the policy-discovery database migration, then retry.',
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    candidates,
    job: discoveryJobs.get(companyId) || null,
    role: session.role,
  });
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const companyId = typeof body.companyId === 'string' ? body.companyId.trim() : '';
  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required.' }, { status: 400 });
  }

  const currentJob = discoveryJobs.get(companyId);
  if (currentJob?.status === 'running') {
    return NextResponse.json({ error: 'Discovery is already running.', job: currentJob }, { status: 409 });
  }

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, website: true },
  });
  if (!company) {
    return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
  }
  if (!validateCompanyWebsite(company.website)) {
    return NextResponse.json({ error: 'Company website must be a valid HTTP(S) URL.' }, { status: 400 });
  }

  try {
    await db.policyDiscoveryCandidate.count({ where: { companyId: company.id } });
  } catch (error) {
    console.error('[Policy Discovery] Storage readiness check failed:', error);
    return NextResponse.json(
      {
        error: 'Policy discovery storage is unavailable. Apply the policy-discovery database migration, then retry.',
      },
      { status: 503 }
    );
  }

  const state: DiscoveryJobState = {
    status: 'running',
    startedAt: new Date().toISOString(),
    completedAt: null,
    candidateCount: 0,
    error: null,
  };
  discoveryJobs.set(company.id, state);

  // Keep the discovery work attached to the request lifecycle. A detached
  // promise can be discarded by managed Node hosting as soon as the 202
  // response is sent, which left new companies permanently without results.
  after(async () => {
    await runDiscoveryJob(company);
  });

  return NextResponse.json({ success: true, job: state }, { status: 202 });
}

export async function PATCH(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  const actorRole = session.role || 'admin';

  const body = await request.json();
  const candidateId = typeof body.candidateId === 'string' ? body.candidateId.trim() : '';
  const decision = body.decision === 'approve' || body.decision === 'reject'
    ? body.decision
    : null;
  if (!candidateId || !decision) {
    return NextResponse.json(
      { error: 'candidateId and decision (approve or reject) are required.' },
      { status: 400 }
    );
  }

  const candidate = await db.policyDiscoveryCandidate.findUnique({
    where: { id: candidateId },
    include: { company: { select: { name: true } } },
  });
  if (!candidate) {
    return NextResponse.json({ error: 'Discovery candidate not found.' }, { status: 404 });
  }

  if (decision === 'reject') {
    const rejected = await db.$transaction(async (tx) => {
      const updated = await tx.policyDiscoveryCandidate.update({
        where: { id: candidate.id },
        data: {
          status: 'Rejected',
          reviewedAt: new Date(),
          reviewedByRole: actorRole,
        },
      });
      await tx.adminReviewLog.create({
        data: {
          actorRole,
          action: 'policy_discovery_rejected',
          targetType: 'PolicyDiscoveryCandidate',
          targetId: candidate.id,
          targetLabel: `${candidate.company.name} / ${candidate.name}`,
          oldValue: 'Proposed',
          newValue: 'Rejected',
          metadataJson: JSON.stringify({ url: candidate.url, confidence: candidate.confidence }),
        },
      });
      return updated;
    });
    return NextResponse.json({ success: true, candidate: rejected });
  }

  const existingPolicy = await db.policy.findUnique({
    where: {
      companyId_type_jurisdiction: {
        companyId: candidate.companyId,
        type: candidate.type,
        jurisdiction: candidate.jurisdiction,
      },
    },
  });
  if (existingPolicy) {
    return NextResponse.json(
      {
        error: `A ${candidate.type}/${candidate.jurisdiction} policy already exists for this company.`,
        policyId: existingPolicy.id,
      },
      { status: 409 }
    );
  }

  const result = await db.$transaction(async (tx) => {
    const policy = await createConfiguredPolicy(tx, {
      companyId: candidate.companyId,
      name: candidate.name,
      type: candidate.type,
      url: candidate.url,
      jurisdiction: candidate.jurisdiction,
    });
    const approved = await tx.policyDiscoveryCandidate.update({
      where: { id: candidate.id },
      data: {
        status: 'Approved',
        reviewedAt: new Date(),
        reviewedByRole: actorRole,
        createdPolicyId: policy.id,
      },
    });
    await tx.adminReviewLog.create({
      data: {
        actorRole,
        action: 'policy_discovery_approved',
        targetType: 'PolicyDiscoveryCandidate',
        targetId: candidate.id,
        targetLabel: `${candidate.company.name} / ${candidate.name}`,
        oldValue: 'Proposed',
        newValue: 'Approved',
        metadataJson: JSON.stringify({
          url: candidate.url,
          confidence: candidate.confidence,
          createdPolicyId: policy.id,
        }),
      },
    });
    return { policy, candidate: approved };
  });

  return NextResponse.json({ success: true, ...result });
}
