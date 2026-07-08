import type { Policy, PolicySnapshot, Prisma } from '@prisma/client';

interface ReplaceSeededPolicyBaselineParams {
  policyId: string;
  text: string;
  hash: string;
  checkedAt: Date;
  ingestionMethod: string;
  source: string;
  httpStatus?: number | null;
  finalUrl: string;
  archiveTimestamp?: Date | null;
}

interface ReplaceSeededPolicyBaselineResult {
  policy: Policy;
  snapshot: PolicySnapshot;
  removedChangeCount: number;
  removedSnapshotCount: number;
}

export async function replaceSeededPolicyBaseline(
  tx: Prisma.TransactionClient,
  params: ReplaceSeededPolicyBaselineParams
): Promise<ReplaceSeededPolicyBaselineResult> {
  const existingSourceEvidence = await tx.policyCheckLog.findFirst({
    where: {
      policyId: params.policyId,
      textHash: { not: null },
      source: { in: ['direct', 'http2', 'rendered', 'wayback', 'commoncrawl'] },
    },
    select: { id: true, source: true, checkedAt: true },
  });
  if (existingSourceEvidence) {
    throw new Error('rebaseline_aborted_existing_source_evidence');
  }

  const existingPublicSnapshot = await tx.policySnapshot.findFirst({
    where: {
      policyId: params.policyId,
      publicEvidence: true,
    },
    select: { id: true },
  });
  if (existingPublicSnapshot) {
    throw new Error('rebaseline_aborted_existing_public_snapshot');
  }

  const existingChanges = await tx.policyChange.findMany({
    where: { policyId: params.policyId },
    select: { id: true },
  });
  const changeIds = existingChanges.map((change) => change.id);

  if (changeIds.length > 0) {
    const attachedReviewLog = await tx.adminReviewLog.findFirst({
      where: { policyChangeId: { in: changeIds } },
      select: { id: true },
    });
    if (attachedReviewLog) {
      throw new Error('rebaseline_aborted_reviewed_change_history');
    }

    await tx.regionImpact.deleteMany({
      where: { policyChangeId: { in: changeIds } },
    });
    await tx.policyChange.deleteMany({
      where: { id: { in: changeIds } },
    });
  }

  const removedSnapshots = await tx.policySnapshot.deleteMany({
    where: { policyId: params.policyId },
  });

  const snapshot = await tx.policySnapshot.create({
    data: {
      policyId: params.policyId,
      version: 1,
      text: params.text,
      hash: params.hash,
      publicEvidence: true,
      createdAt: params.checkedAt,
    },
  });

  const policy = await tx.policy.update({
    where: { id: params.policyId },
    data: {
      currentText: params.text,
      currentHash: params.hash,
      lastCheckDate: params.checkedAt,
      lastSuccessfulCheckDate: params.checkedAt,
      dataStatus: 'Available',
      ingestionMethod: params.ingestionMethod,
    },
  });

  await tx.policyCheckLog.create({
    data: {
      policyId: params.policyId,
      status: 'Available',
      checkedAt: params.checkedAt,
      source: params.source,
      httpStatus: params.httpStatus || null,
      reason: 'rebaseline_from_seeded_record',
      finalUrl: params.finalUrl,
      textHash: params.hash,
      textLength: params.text.length,
      archiveTimestamp: params.archiveTimestamp || null,
    },
  });

  await tx.adminReviewLog.create({
    data: {
      actorRole: 'system',
      action: 'rebaseline_from_seeded_record',
      targetType: 'policy',
      targetId: params.policyId,
      note: 'Seeded/demo baseline replaced with first verified source retrieval without creating public change evidence.',
      metadataJson: JSON.stringify({
        removedChangeCount: changeIds.length,
        removedSnapshotCount: removedSnapshots.count,
        source: params.source,
        finalUrl: params.finalUrl,
        archiveTimestamp: params.archiveTimestamp?.toISOString() || null,
      }),
    },
  });

  return {
    policy,
    snapshot,
    removedChangeCount: changeIds.length,
    removedSnapshotCount: removedSnapshots.count,
  };
}
