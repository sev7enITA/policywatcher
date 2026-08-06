import 'server-only';
import { db } from './db';
import { buildEvidencePacket, type EvidencePacketInput } from './evidencePacket';
import { publicChangeWhere } from './publicDataGate';

export async function getPublicEvidencePacket(changeId: string) {
  const change = await db.policyChange.findFirst({
    where: publicChangeWhere({ id: changeId, newSnapshot: { publicEvidence: true } }) as never,
    include: {
      oldSnapshot: {
        select: { version: true, hash: true, text: true, publicEvidence: true, createdAt: true },
      },
      newSnapshot: {
        select: { version: true, hash: true, text: true, publicEvidence: true, createdAt: true },
      },
      regionImpacts: {
        select: {
          region: true,
          perspective: true,
          riskLevel: true,
          impactAnalysisEn: true,
          complianceNoteEn: true,
        },
      },
      policy: {
        select: {
          id: true,
          name: true,
          type: true,
          jurisdiction: true,
          url: true,
          dataStatus: true,
          ingestionMethod: true,
          company: {
            select: { id: true, name: true, slug: true, industry: true },
          },
          checkLogs: {
            orderBy: { checkedAt: 'desc' },
            take: 1,
            select: { status: true, checkedAt: true, source: true },
          },
        },
      },
    },
  });

  if (!change) return null;

  const previousChange = await db.policyChange.findFirst({
    where: publicChangeWhere({
      policyId: change.policyId,
      createdAt: { lt: change.createdAt },
      newSnapshot: { publicEvidence: true },
    }) as never,
    orderBy: { createdAt: 'desc' },
    select: { id: true, overallScore: true, overallRisk: true, createdAt: true },
  });

  return buildEvidencePacket({
    change,
    previousChange,
    policy: change.policy,
  } as unknown as EvidencePacketInput);
}

export async function listPublicEvidencePacketSummaries(limit = 24) {
  const boundedLimit = Math.min(Math.max(limit, 1), 50);
  const changes = await db.policyChange.findMany({
    where: publicChangeWhere({ newSnapshot: { publicEvidence: true } }) as never,
    orderBy: { createdAt: 'desc' },
    take: boundedLimit,
    select: {
      id: true,
      createdAt: true,
      overallRisk: true,
      overallScore: true,
      tldrEn: true,
      tldrIt: true,
      aiSummaryEn: true,
      aiSummaryIt: true,
      policy: {
        select: {
          id: true,
          name: true,
          type: true,
          jurisdiction: true,
          dataStatus: true,
          company: { select: { name: true, slug: true, industry: true } },
          checkLogs: {
            orderBy: { checkedAt: 'desc' },
            take: 1,
            select: { status: true, checkedAt: true, source: true },
          },
        },
      },
    },
  });

  return changes.map((change) => ({
    id: change.id,
    createdAt: change.createdAt.toISOString(),
    overallRisk: change.overallRisk,
    overallScore: change.overallScore,
    summary: change.tldrEn || change.aiSummaryEn,
    summaryIt: change.tldrIt || change.aiSummaryIt || change.tldrEn || change.aiSummaryEn,
    policy: change.policy,
    sourceState: change.policy.checkLogs[0]
      ? change.policy.checkLogs[0].status === 'Available' || change.policy.checkLogs[0].status === 'Reviewed'
        ? 'verified-retrieval'
        : 'review-required'
      : 'not-recorded',
  }));
}
