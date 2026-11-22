import 'server-only';
import { db } from './db';
import { buildPublicInsight, type PublicInsightInput } from './policyAsCode';

export async function getPublicInsight(changeId: string) {
  const asOf = new Date();
  // This boundary intentionally cannot be widened by ALLOW_SEEDED_PUBLIC_DATA.
  const change = await db.policyChange.findFirst({
    where: {
      id: changeId, publicEvidence: true, publicPublishedAt: { not: null, lte: asOf },
      newSnapshot: { publicEvidence: true },
      policy: { ingestionMethod: { not: 'Seeded' }, dataStatus: { in: ['Available', 'Reviewed'] } },
    },
    select: {
      id: true, publicEvidence: true, publicPublishedAt: true, createdAt: true,
      tldrEn: true, aiSummaryEn: true, riskReasonsJson: true,
      oldSnapshot: { select: { version: true, text: true, publicEvidence: true, createdAt: true } },
      newSnapshot: { select: { version: true, text: true, publicEvidence: true, createdAt: true } },
      policy: { select: { id: true, url: true, jurisdiction: true, ingestionMethod: true, dataStatus: true } },
    },
  });
  return change ? buildPublicInsight(change as PublicInsightInput, asOf) : null;
}
