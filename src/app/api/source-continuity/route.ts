/**
 * Public Source Continuity API
 *
 * Publishes a bounded, sanitized transition ledger derived from PolicyCheckLog.
 * The query intentionally excludes policy content, raw failure diagnostics,
 * destination URLs, hashes, scores, AI analysis and administrative records.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { suspendedPolicyWhere } from '@/lib/publicDataGate';
import { rateLimit } from '@/lib/rateLimit';
import {
  buildSourceContinuityResponse,
  SOURCE_CONTINUITY_MAX_LOGS_PER_POLICY,
  SOURCE_CONTINUITY_MAX_POLICIES,
} from '@/lib/sourceContinuity';

function qualifiedSourceContinuityWhere() {
  return {
    OR: [
      { snapshots: { some: { publicEvidence: true } } },
      suspendedPolicyWhere(),
    ],
  };
}

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, { intervalMs: 60_000, max: 60, name: 'public-source-continuity' });
  if (limited) return limited;

  try {
    const where = qualifiedSourceContinuityWhere();
    const [totalQualifiedPolicies, policies] = await Promise.all([
      db.policy.count({ where: where as never }),
      db.policy.findMany({
        where: where as never,
        select: {
          id: true,
          name: true,
          type: true,
          jurisdiction: true,
          url: true,
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              industry: true,
            },
          },
          snapshots: {
            where: { publicEvidence: true },
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { publicEvidence: true, createdAt: true },
          },
          historicalReferences: {
            take: 1,
            orderBy: { capturedAt: 'desc' },
            select: {
              source: true,
              capturedAt: true,
              observedAt: true,
              eligibleForChangeDetection: true,
            },
          },
          checkLogs: {
            orderBy: { checkedAt: 'desc' },
            take: SOURCE_CONTINUITY_MAX_LOGS_PER_POLICY,
            select: {
              id: true,
              status: true,
              checkedAt: true,
              source: true,
            },
          },
          _count: { select: { checkLogs: true } },
        },
        orderBy: [{ company: { name: 'asc' } }, { name: 'asc' }, { jurisdiction: 'asc' }],
        take: SOURCE_CONTINUITY_MAX_POLICIES,
      }),
    ]);

    return NextResponse.json(
      buildSourceContinuityResponse(policies, totalQualifiedPolicies),
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=300',
        },
      }
    );
  } catch (error) {
    console.error('[Source Continuity API] Storage failure:', error);
    return NextResponse.json(
      {
        error: 'Source continuity is temporarily unavailable.',
        dataExposed: false,
      },
      { status: 503 }
    );
  }
}
