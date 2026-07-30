import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { db } from '@/lib/db';
import { buildAcquisitionKey } from '@/lib/sourceReliability';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || !session.role) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const [policies, scanRuns, remediationIssues, publicPolicyCount, historicalReferenceCount] = await Promise.all([
      db.policy.findMany({
        select: {
          id: true,
          name: true,
          jurisdiction: true,
          url: true,
          retrievalUrl: true,
          dataStatus: true,
          lastCheckDate: true,
          lastSuccessfulCheckDate: true,
          company: { select: { name: true, slug: true } },
        },
        orderBy: [{ company: { name: 'asc' } }, { name: 'asc' }, { jurisdiction: 'asc' }],
      }),
      db.scanRun.findMany({ orderBy: { startedAt: 'desc' }, take: 20 }),
      db.sourceRemediationIssue.findMany({
        orderBy: [{ status: 'asc' }, { lastDetectedAt: 'desc' }],
        take: 100,
      }),
      db.policy.count({ where: { snapshots: { some: { publicEvidence: true } } } }),
      db.historicalSourceReference.count(),
    ]);

    const groups = new Map<string, typeof policies>();
    for (const policy of policies) {
      const key = buildAcquisitionKey(policy.retrievalUrl || policy.url);
      groups.set(key, [...(groups.get(key) || []), policy]);
    }
    const duplicateGroups = [...groups.entries()]
      .filter(([, entries]) => entries.length > 1)
      .map(([retrievalKey, entries]) => ({
        retrievalKey,
        records: entries.map((entry) => ({
          policyId: entry.id,
          company: entry.company.name,
          policy: entry.name,
          jurisdiction: entry.jurisdiction,
          status: entry.dataStatus,
        })),
      }));

    const policyById = new Map(policies.map((policy) => [policy.id, policy]));
    const issues = remediationIssues.map((issue) => {
      let affectedPolicyIds: string[] = [];
      try {
        affectedPolicyIds = JSON.parse(issue.affectedPolicyIdsJson) as string[];
      } catch {
        affectedPolicyIds = [];
      }
      return {
        ...issue,
        affectedPolicies: affectedPolicyIds
          .map((id) => policyById.get(id))
          .filter(Boolean)
          .map((policy) => ({
            id: policy!.id,
            company: policy!.company.name,
            policy: policy!.name,
            jurisdiction: policy!.jurisdiction,
          })),
      };
    });

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      role: session.role,
      inventory: {
        policyRecords: policies.length,
        uniqueRetrievalKeys: groups.size,
        duplicateRetrievalGroups: duplicateGroups.length,
        publicEvidencePolicies: publicPolicyCount,
        withheldPolicies: Math.max(0, policies.length - publicPolicyCount),
        historicalReferences: historicalReferenceCount,
        duplicateGroups,
      },
      scanRuns: scanRuns.map((run) => ({
        ...run,
        metrics: (() => {
          try {
            return run.metricsJson ? JSON.parse(run.metricsJson) : null;
          } catch {
            return null;
          }
        })(),
      })),
      remediationIssues: issues,
      boundary:
        'Historical references remain ineligible for change detection. Remediation suggestions never authorize bypassing provider access controls.',
    });
  } catch (error) {
    console.error('[Source Reliability API] Failed:', error);
    return NextResponse.json({ error: 'Source reliability data is temporarily unavailable.' }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  try {
    const body = await request.json() as { retrievalKey?: string; status?: string };
    const retrievalKey = body.retrievalKey?.trim();
    if (!retrievalKey || !['Open', 'Resolved'].includes(body.status || '')) {
      return NextResponse.json({ error: 'retrievalKey and status Open|Resolved are required' }, { status: 400 });
    }
    const issue = await db.sourceRemediationIssue.update({
      where: { retrievalKey },
      data: body.status === 'Resolved'
        ? { status: 'Resolved', resolvedAt: new Date() }
        : { status: 'Open', resolvedAt: null },
    });
    return NextResponse.json({ issue });
  } catch (error) {
    console.error('[Source Reliability API] Update failed:', error);
    return NextResponse.json({ error: 'Unable to update remediation state.' }, { status: 500 });
  }
}
