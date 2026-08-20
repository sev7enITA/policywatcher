import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { publicPolicyWhere } from '@/lib/publicDataGate';
import {
  buildPublicationReadiness,
  type PublicationReadinessMetric,
  type PublicationReadinessResult,
} from '@/lib/publicationReadiness';

export const PUBLICATION_READINESS_CONTRACT_VERSION = '1.0.0' as const;
export const PUBLICATION_READINESS_METRIC_ID = 'publication-readiness' as const;
export const PUBLICATION_READINESS_SCHEMA =
  'https://policywatcher.online/schemas/publication-readiness/v1' as const;

interface QueryResult<T> {
  available: boolean;
  value: T | null;
  reason: string | null;
}

export interface AuthoritativePublicationReadinessOptions {
  checkedAt?: Date;
  policyWhere?: Prisma.PolicyWhereInput;
  scopeBoundary?: string;
}

async function query<T>(label: string, run: () => Promise<T>): Promise<QueryResult<T>> {
  try {
    return { available: true, value: await run(), reason: null };
  } catch {
    console.warn(`[Publication Readiness] ${label} unavailable.`);
    return { available: false, value: null, reason: `${label} is unavailable.` };
  }
}

function countMetric(result: QueryResult<number>): PublicationReadinessMetric {
  return {
    available: result.available && result.value !== null,
    count: result.available ? result.value : null,
    reason: result.reason,
  };
}

export async function getAuthoritativePublicationReadiness(
  options: AuthoritativePublicationReadinessOptions = {},
): Promise<PublicationReadinessResult> {
  const checkedAt = options.checkedAt || new Date();
  const policyWhere = options.policyWhere || {};
  const retrievalEvidenceWhere: Prisma.PolicyCheckLogWhereInput = {
    status: { in: ['Available', 'Reviewed'] },
    source: { notIn: ['seeded', 'none'], not: null },
    OR: [
      { textHash: { not: null } },
      { textLength: { gt: 0 } },
    ],
  };

  const [configured, retrieved, baselineVerified, publicPolicies, analysed, capture] =
    await Promise.all([
      query('Configured-policy count', () => db.policy.count({ where: policyWhere })),
      query('Retrieved-policy count', () => db.policy.count({
        where: { AND: [policyWhere, { checkLogs: { some: retrievalEvidenceWhere } }] },
      })),
      query('Verified-baseline count', () => db.policy.count({
        where: { AND: [policyWhere, { snapshots: { some: { publicEvidence: true } } }] },
      })),
      query('Public-policy count', () => db.policy.count({
        where: publicPolicyWhere(policyWhere),
      })),
      query('Analysed-policy count', () => db.policy.count({
        where: publicPolicyWhere({
          AND: [policyWhere, { changes: { some: { publicEvidence: true } } }],
        }),
      })),
      query('Latest capture', () => db.policyCheckLog.findFirst({
        where: { ...retrievalEvidenceWhere, policy: policyWhere },
        orderBy: { checkedAt: 'desc' },
        select: { checkedAt: true },
      })),
    ]);

  return buildPublicationReadiness({
    checkedAt: checkedAt.toISOString(),
    configured: countMetric(configured),
    retrieved: countMetric(retrieved),
    baselineVerified: countMetric(baselineVerified),
    public: countMetric(publicPolicies),
    analysed: countMetric(analysed),
    latestCapture: {
      available: capture.available,
      capturedAt: capture.value?.checkedAt.toISOString() || null,
      reason: capture.reason,
    },
    scopeBoundary: options.scopeBoundary,
  });
}

export function serializePublicPublicationReadiness(result: PublicationReadinessResult) {
  return {
    schema: PUBLICATION_READINESS_SCHEMA,
    metricId: PUBLICATION_READINESS_METRIC_ID,
    contractVersion: PUBLICATION_READINESS_CONTRACT_VERSION,
    source: 'database' as const,
    checkedAt: result.checkedAt,
    available: result.available,
    denominator: result.denominator,
    stages: result.stages.map((stage) => ({
      id: stage.id,
      label: stage.label,
      count: stage.count,
      denominator: stage.denominator,
      excluded: stage.excluded,
      availability: stage.availability,
      definition: stage.definition,
      boundary: stage.boundary,
    })),
    latestCapture: result.latestCapture,
    consistencyWarning: result.consistencyWarning,
    scopeBoundary: result.scopeBoundary,
  };
}
