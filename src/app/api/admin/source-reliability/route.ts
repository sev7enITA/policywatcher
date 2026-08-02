import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { db } from '@/lib/db';
import { buildAcquisitionKey } from '@/lib/sourceReliability';
import {
  buildReturnedRemediationSummary,
  deriveNextRemediationAction,
  remediationReasonLabel,
  REMEDIATION_RETURN_LIMIT,
  safeSourceReference,
  sortRemediationIssues,
} from '@/lib/sourceRemediation';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || !session.role) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const [policies, scanRuns, remediationIssues, remediationIssueCount, publicPolicyCount, historicalReferenceCount] = await Promise.all([
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
        orderBy: { lastDetectedAt: 'desc' },
        take: REMEDIATION_RETURN_LIMIT,
      }),
      db.sourceRemediationIssue.count(),
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
      .map(([retrievalKey, entries]) => {
        const source = safeSourceReference(retrievalKey);
        return {
          retrievalKey: `${source.host}${source.path}`,
          records: entries.map((entry) => ({
            policyId: entry.id,
            company: entry.company.name,
            policy: entry.name,
            jurisdiction: entry.jurisdiction,
            status: entry.dataStatus,
          })),
        };
      });

    const policyById = new Map(policies.map((policy) => [policy.id, policy]));
    const issues = sortRemediationIssues(remediationIssues).map((issue) => {
      let affectedPolicyIds: string[] = [];
      try {
        affectedPolicyIds = JSON.parse(issue.affectedPolicyIdsJson) as string[];
      } catch {
        affectedPolicyIds = [];
      }
      const affectedPolicies = affectedPolicyIds
        .map((id) => policyById.get(id))
        .filter(Boolean);
      const source = safeSourceReference(issue.sourceUrl);
      const mostRecent = (values: Array<Date | null>) => values
        .filter((value): value is Date => Boolean(value))
        .sort((left, right) => right.getTime() - left.getTime())[0]?.toISOString() || null;
      return {
        id: issue.id,
        retrievalKey: `${source.host}${source.path}`,
        status: issue.status,
        reasonCode: issue.reasonCode,
        totalFailures: issue.totalFailures,
        consecutiveFailures: issue.consecutiveFailures,
        firstDetectedAt: issue.firstDetectedAt,
        lastDetectedAt: issue.lastDetectedAt,
        recoveredAt: issue.recoveredAt,
        resolvedAt: issue.resolvedAt,
        suggestedAction: issue.suggestedAction,
        sourceHost: source.host,
        sourcePath: source.path,
        sourceHref: source.href,
        reasonLabel: remediationReasonLabel(issue.reasonCode),
        lastCheckAt: mostRecent(affectedPolicies.map((policy) => policy!.lastCheckDate)),
        lastSuccessfulCheckAt: mostRecent(affectedPolicies.map((policy) => policy!.lastSuccessfulCheckDate)),
        affectedPolicies: affectedPolicies.map((policy) => ({
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
      remediationSummary: buildReturnedRemediationSummary(issues, remediationIssueCount),
      nextAction: deriveNextRemediationAction(issues),
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
    const body = await request.json() as { issueId?: string; status?: string };
    const issueId = body.issueId?.trim();
    if (!issueId || issueId.length > 100 || !['Open', 'Resolved'].includes(body.status || '')) {
      return NextResponse.json({ error: 'issueId and status Open|Resolved are required' }, { status: 400 });
    }
    const existing = await db.sourceRemediationIssue.findUnique({ where: { id: issueId } });
    if (!existing) {
      return NextResponse.json({ error: 'Remediation issue not found.', code: 'issue_not_found' }, { status: 404 });
    }
    if (body.status === 'Resolved' && existing.status !== 'Recovered') {
      return NextResponse.json({
        error: 'Only a recovered issue can be closed.',
        code: 'issue_not_recovered',
        currentStatus: existing.status,
        allowedTransition: 'Recovered -> Resolved',
      }, { status: 409 });
    }
    if (body.status === 'Open' && existing.status !== 'Resolved') {
      return NextResponse.json({
        error: 'Only a resolved issue can be reopened.',
        code: 'issue_not_resolved',
        currentStatus: existing.status,
        allowedTransition: 'Resolved -> Open',
      }, { status: 409 });
    }
    const issue = await db.sourceRemediationIssue.update({
      where: { id: issueId },
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
