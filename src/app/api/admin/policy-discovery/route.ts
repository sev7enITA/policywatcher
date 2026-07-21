import { after, NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { createConfiguredPolicy } from '@/lib/configuredPolicy';
import { db } from '@/lib/db';
import {
  readDiscoveryJob,
} from '@/lib/policyDiscoveryJobs';
import {
  runPolicyDiscoveryJob,
  startPolicyDiscovery,
} from '@/lib/policyDiscoveryWorkflow';
import { readJsonObject } from '@/lib/requestBody';

// Discovery can legitimately take a few minutes when the fallback retrieval
// layers are needed. Hosts that enforce route limits can use this hint.
export const maxDuration = 300;

function validateCompanyWebsite(rawUrl: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(rawUrl).protocol);
  } catch {
    return false;
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
  let job;
  try {
    [candidates, job] = await Promise.all([
      db.policyDiscoveryCandidate.findMany({
        where: { companyId },
        orderBy: [{ status: 'asc' }, { confidence: 'desc' }, { createdAt: 'desc' }],
      }),
      readDiscoveryJob(db, companyId),
    ]);
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
    job,
    role: session.role,
  });
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await readJsonObject(request);
  const companyId = typeof body?.companyId === 'string' ? body.companyId.trim() : '';
  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required.' }, { status: 400 });
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
    await Promise.all([
      db.policyDiscoveryCandidate.count({ where: { companyId: company.id } }),
      db.policyDiscoveryJob.count({ where: { companyId: company.id } }),
    ]);
  } catch (error) {
    console.error('[Policy Discovery] Storage readiness check failed:', error);
    return NextResponse.json(
      {
        error: 'Policy discovery storage is unavailable. Apply the policy-discovery database migration, then retry.',
      },
      { status: 503 }
    );
  }

  const claimed = await startPolicyDiscovery(company);
  if (!claimed.claimed) {
    return NextResponse.json(
      { error: 'Discovery is already running.', job: claimed.job },
      { status: 409 }
    );
  }

  // Keep the discovery work attached to the request lifecycle. A detached
  // promise can be discarded by managed Node hosting as soon as the 202
  // response is sent, which left new companies permanently without results.
  after(async () => {
    await runPolicyDiscoveryJob(company, claimed.runToken);
  });

  return NextResponse.json({ success: true, job: claimed.job }, { status: 202 });
}

export async function PATCH(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  const actorRole = session.role || 'admin';

  const body = await readJsonObject(request);
  const candidateId = typeof body?.candidateId === 'string' ? body.candidateId.trim() : '';
  const decision = body?.decision === 'approve' || body?.decision === 'reject'
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
