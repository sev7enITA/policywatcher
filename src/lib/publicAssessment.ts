import { db } from './db';
import { publicChangeWhere } from './publicDataGate';

export function publishedAssessmentFilter(asOf: Date) {
  return { publicEvidence: true, publicPublishedAt: { not: null, lte: asOf }, newSnapshot: { publicEvidence: true } } as const;
}

/** A predecessor is an earlier screening of this policy, visible to the reader now. */
export function previousPublicAssessment(policyId: string, screenedAt: Date, asOf: Date) {
  return db.policyChange.findFirst({
    where: publicChangeWhere({ ...publishedAssessmentFilter(asOf), policyId, createdAt: { lt: screenedAt } }),
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: { id: true, overallScore: true, overallRisk: true, createdAt: true },
  });
}
