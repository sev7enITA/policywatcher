import { db } from './db';
import { reviewedMetrics, reviewEvidenceHash } from './evidenceQuality';

export async function getReviewedQualityMetrics() {
  const reviews = await db.evidenceQualityReview.findMany();
  const changes = await db.policyChange.findMany({
    where: { id: { in: [...new Set(reviews.map(r => r.changeId))] } },
    include: { oldSnapshot: true, newSnapshot: true },
  });
  return reviewedMetrics(reviews, new Map(changes.map(c => [c.id, reviewEvidenceHash(c)])));
}
