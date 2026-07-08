/**
 * Public Source Suspensions API
 *
 * Exposes sanitized suspension metadata for policy sources whose current data
 * is not publishable. It intentionally does not return policy text, diffs,
 * scores, summaries, or AI-generated analysis.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import {
  isSeededIngestionMethod,
  publicSuspensionMessage,
  suspendedPolicyWhere,
} from '@/lib/publicDataGate';

const MAX_SUSPENSIONS = 100;

function safeHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

function reasonFromStatus(dataStatus: string, ingestionMethod: string, latestReason?: string | null): string {
  if (isSeededIngestionMethod(ingestionMethod)) {
    return 'source_evidence_missing';
  }

  if (dataStatus === 'Unavailable') return 'fetch_unavailable';
  if (dataStatus === 'Needs Review') return 'needs_review';
  if (dataStatus === 'Partial') return 'partial_retrieval';
  if (dataStatus === 'Configured') return 'configured_not_verified';

  return latestReason || 'quality_gate_suspended';
}

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, { intervalMs: 60_000, max: 60, name: 'public-get' });
  if (limited) return limited;

  try {
    const [total, policies] = await Promise.all([
      db.policy.count({ where: suspendedPolicyWhere() as never }),
      db.policy.findMany({
        where: suspendedPolicyWhere() as never,
        select: {
          id: true,
          name: true,
          type: true,
          jurisdiction: true,
          url: true,
          dataStatus: true,
          ingestionMethod: true,
          lastCheckDate: true,
          lastSuccessfulCheckDate: true,
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              industry: true,
            },
          },
          checkLogs: {
            orderBy: { checkedAt: 'desc' },
            take: 1,
            select: {
              status: true,
              checkedAt: true,
              source: true,
              reason: true,
              httpStatus: true,
            },
          },
        },
        orderBy: [{ company: { name: 'asc' } }, { name: 'asc' }, { jurisdiction: 'asc' }],
        take: MAX_SUSPENSIONS,
      }),
    ]);

    const sources = policies.map((policy) => {
      const latestLog = policy.checkLogs[0] || null;
      return {
        id: policy.id,
        company: policy.company,
        policyName: policy.name,
        policyType: policy.type,
        jurisdiction: policy.jurisdiction,
        sourceHost: safeHost(policy.url),
        dataStatus: policy.dataStatus,
        ingestionMethod: policy.ingestionMethod,
        lastCheckDate: policy.lastCheckDate,
        lastSuccessfulCheckDate: policy.lastSuccessfulCheckDate,
        latestCheck: latestLog
          ? {
              status: latestLog.status,
              checkedAt: latestLog.checkedAt,
              source: latestLog.source,
              reason: latestLog.reason,
              httpStatus: latestLog.httpStatus,
            }
          : null,
        suspensionReason: reasonFromStatus(policy.dataStatus, policy.ingestionMethod, latestLog?.reason),
        publicMessageEn: publicSuspensionMessage('en'),
        publicMessageIt: publicSuspensionMessage('it'),
      };
    });

    return NextResponse.json(
      {
        total,
        returned: sources.length,
        dataExposed: false,
        publicMessageEn: publicSuspensionMessage('en'),
        publicMessageIt: publicSuspensionMessage('it'),
        sources,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=300',
        },
      }
    );
  } catch (error) {
    console.error('[Source Suspensions API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while checking source suspensions.' },
      { status: 500 }
    );
  }
}
