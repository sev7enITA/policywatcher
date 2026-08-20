import type { Policy, PolicySnapshot, Prisma } from '@prisma/client';
import { dualWriteCanonicalPolicyGraph } from '@/lib/documentEvidenceSync';

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
  scanRunId?: string;
  sourceRetrievalId?: string;
  durationMs?: number;
  reasonCode?: string;
}

interface ReplaceSeededPolicyBaselineResult {
  policy: Policy;
  snapshot: PolicySnapshot;
  removedChangeCount: number;
  removedSnapshotCount: number;
}

interface EstablishVerifiedPolicyBaselineParams {
  policyId: string;
  text: string;
  hash: string;
  checkedAt: Date;
  ingestionMethod: string;
  source: string;
  httpStatus?: number | null;
  finalUrl: string;
  archiveTimestamp?: Date | null;
  scanRunId?: string;
  sourceRetrievalId?: string;
  durationMs?: number;
  reasonCode?: string;
}

interface EstablishVerifiedPolicyBaselineResult {
  policy: Policy;
  snapshot: PolicySnapshot;
  publicEvidence: boolean;
  promotedExistingSnapshot: boolean;
}

type EstablishSourceMigrationBaselineParams = EstablishVerifiedPolicyBaselineParams;

interface EstablishSourceMigrationBaselineResult {
  policy: Policy;
  snapshot: PolicySnapshot;
  createdSnapshot: boolean;
}

/**
 * Accepts the first verified capture after an administrator changes the
 * acquisition endpoint. The capture becomes the new comparison baseline but
 * never creates a provider-authored PolicyChange: the content boundary was
 * introduced by our source configuration, not by evidence of a publisher
 * edit.
 */
export async function establishSourceMigrationBaseline(
  tx: Prisma.TransactionClient,
  params: EstablishSourceMigrationBaselineParams
): Promise<EstablishSourceMigrationBaselineResult> {
  const current = await tx.policy.findUnique({
    where: { id: params.policyId },
    select: { sourceMigrationPending: true },
  });
  if (!current?.sourceMigrationPending) {
    throw new Error('source_migration_rebaseline_aborted_not_pending');
  }

  const latestSnapshot = await tx.policySnapshot.findFirst({
    where: { policyId: params.policyId },
    orderBy: [{ version: 'desc' }, { createdAt: 'desc' }],
  });

  const createdSnapshot = latestSnapshot?.hash !== params.hash;
  const snapshot = createdSnapshot
    ? await tx.policySnapshot.create({
        data: {
          policyId: params.policyId,
          version: (latestSnapshot?.version || 0) + 1,
          text: params.text,
          hash: params.hash,
          publicEvidence: true,
          createdAt: params.checkedAt,
        },
      })
    : latestSnapshot;

  if (!snapshot) {
    throw new Error('source_migration_rebaseline_aborted_missing_snapshot');
  }

  const policy = await tx.policy.update({
    where: { id: params.policyId },
    data: {
      currentText: params.text,
      currentHash: params.hash,
      lastCheckDate: params.checkedAt,
      lastSuccessfulCheckDate: params.checkedAt,
      dataStatus: 'Available',
      ingestionMethod: params.ingestionMethod,
      sourceMigrationPending: false,
      sourceMigrationRequestedAt: null,
    },
  });

  await tx.policyCheckLog.create({
    data: {
      policyId: params.policyId,
      status: 'Available',
      checkedAt: params.checkedAt,
      source: params.source,
      httpStatus: params.httpStatus || null,
      reason: 'verified_source_migration_baseline_established',
      finalUrl: params.finalUrl,
      textHash: params.hash,
      textLength: params.text.length,
      archiveTimestamp: params.archiveTimestamp || null,
      scanRunId: params.scanRunId || null,
      sourceRetrievalId: params.sourceRetrievalId || null,
      durationMs: params.durationMs ?? null,
      reasonCode: params.reasonCode || 'verified',
    },
  });

  await tx.adminReviewLog.create({
    data: {
      actorRole: 'system',
      action: 'source_migration_baseline_established',
      targetType: 'policy',
      targetId: params.policyId,
      note: 'Verified the newly configured acquisition source and established a comparison baseline without creating a provider change event.',
      metadataJson: JSON.stringify({
        source: params.source,
        finalUrl: params.finalUrl,
        archiveTimestamp: params.archiveTimestamp?.toISOString() || null,
        createdSnapshot,
        snapshotVersion: snapshot.version,
      }),
    },
  });

  await dualWriteCanonicalPolicyGraph(tx, params.policyId);

  return { policy, snapshot, createdSnapshot };
}

/**
 * Establishes the first source-verified baseline when a policy has already
 * accumulated retrieval logs but still has no public snapshot. This closes a
 * critical gate gap: a verified hash that matches `Policy.currentHash` must
 * not remain forever in the ordinary "unchanged" branch.
 *
 * Bulk-onboarding records remain private until their explicit QA decision.
 */
export async function establishVerifiedPolicyBaseline(
  tx: Prisma.TransactionClient,
  params: EstablishVerifiedPolicyBaselineParams
): Promise<EstablishVerifiedPolicyBaselineResult> {
  const onboardingItem = await tx.sourceOnboardingItem.findFirst({
    where: {
      policyId: params.policyId,
      stage: { in: ['BaselinePending', 'QaReview'] },
    },
    select: { id: true },
  });
  const publicEvidence = !onboardingItem;

  const existingPublicSnapshot = await tx.policySnapshot.findFirst({
    where: { policyId: params.policyId, publicEvidence: true },
  });
  if (existingPublicSnapshot) {
    const policy = await tx.policy.update({
      where: { id: params.policyId },
      data: {
        lastCheckDate: params.checkedAt,
        lastSuccessfulCheckDate: params.checkedAt,
        dataStatus: 'Available',
        ingestionMethod: params.ingestionMethod,
      },
    });
    await dualWriteCanonicalPolicyGraph(tx, params.policyId);
    return {
      policy,
      snapshot: existingPublicSnapshot,
      publicEvidence: true,
      promotedExistingSnapshot: false,
    };
  }

  const matchingSnapshot = await tx.policySnapshot.findFirst({
    where: { policyId: params.policyId, hash: params.hash },
    orderBy: [{ version: 'desc' }, { createdAt: 'desc' }],
  });

  let snapshot: PolicySnapshot;
  let promotedExistingSnapshot = false;
  if (matchingSnapshot) {
    snapshot = publicEvidence
      ? await tx.policySnapshot.update({
          where: { id: matchingSnapshot.id },
          data: { publicEvidence: true },
        })
      : matchingSnapshot;
    promotedExistingSnapshot = publicEvidence;
  } else {
    const latestSnapshot = await tx.policySnapshot.findFirst({
      where: { policyId: params.policyId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    snapshot = await tx.policySnapshot.create({
      data: {
        policyId: params.policyId,
        version: (latestSnapshot?.version || 0) + 1,
        text: params.text,
        hash: params.hash,
        publicEvidence,
        createdAt: params.checkedAt,
      },
    });
  }

  const policy = await tx.policy.update({
    where: { id: params.policyId },
    data: {
      currentText: params.text,
      currentHash: params.hash,
      lastCheckDate: params.checkedAt,
      lastSuccessfulCheckDate: params.checkedAt,
      dataStatus: publicEvidence ? 'Available' : 'Needs Review',
      ingestionMethod: params.ingestionMethod,
    },
  });

  await tx.policyCheckLog.create({
    data: {
      policyId: params.policyId,
      status: publicEvidence ? 'Available' : 'Needs Review',
      checkedAt: params.checkedAt,
      source: params.source,
      httpStatus: params.httpStatus || null,
      reason: publicEvidence
        ? 'verified_public_baseline_established'
        : 'verified_private_baseline_pending_onboarding_qa',
      finalUrl: params.finalUrl,
      textHash: params.hash,
      textLength: params.text.length,
      archiveTimestamp: params.archiveTimestamp || null,
      scanRunId: params.scanRunId || null,
      sourceRetrievalId: params.sourceRetrievalId || null,
      durationMs: params.durationMs ?? null,
      reasonCode: params.reasonCode || 'verified',
    },
  });

  if (onboardingItem) {
    await tx.sourceOnboardingItem.updateMany({
      where: { policyId: params.policyId, stage: 'BaselinePending' },
      data: {
        stage: 'QaReview',
        qaStatus: 'Pending',
        qaSummary: 'Verified first baseline captured privately. Source QA review is required before publication.',
        qaChecksJson: null,
        error: null,
      },
    });
  }

  await tx.adminReviewLog.create({
    data: {
      actorRole: 'system',
      action: publicEvidence ? 'verified_public_baseline_established' : 'verified_private_baseline_established',
      targetType: 'policy',
      targetId: params.policyId,
      note: publicEvidence
        ? 'First source-verified public baseline established after a successful retrieval; no provider change event was created.'
        : 'First source-verified baseline retained privately pending onboarding QA and publication review.',
      metadataJson: JSON.stringify({
        source: params.source,
        finalUrl: params.finalUrl,
        archiveTimestamp: params.archiveTimestamp?.toISOString() || null,
        publicEvidence,
        promotedExistingSnapshot,
        sourceOnboardingItemId: onboardingItem?.id || null,
      }),
    },
  });

  await dualWriteCanonicalPolicyGraph(tx, params.policyId);

  return { policy, snapshot, publicEvidence, promotedExistingSnapshot };
}

export async function replaceSeededPolicyBaseline(
  tx: Prisma.TransactionClient,
  params: ReplaceSeededPolicyBaselineParams
): Promise<ReplaceSeededPolicyBaselineResult> {
  const onboardingItem = await tx.sourceOnboardingItem.findFirst({
    where: {
      policyId: params.policyId,
      stage: { in: ['BaselinePending', 'QaReview'] },
    },
    select: { id: true },
  });
  const publicEvidence = !onboardingItem;

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
      publicEvidence,
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
      dataStatus: publicEvidence ? 'Available' : 'Needs Review',
      ingestionMethod: params.ingestionMethod,
    },
  });

  await tx.policyCheckLog.create({
    data: {
      policyId: params.policyId,
      status: publicEvidence ? 'Available' : 'Needs Review',
      checkedAt: params.checkedAt,
      source: params.source,
      httpStatus: params.httpStatus || null,
      reason: 'rebaseline_from_seeded_record',
      finalUrl: params.finalUrl,
      textHash: params.hash,
      textLength: params.text.length,
      archiveTimestamp: params.archiveTimestamp || null,
      scanRunId: params.scanRunId || null,
      sourceRetrievalId: params.sourceRetrievalId || null,
      durationMs: params.durationMs ?? null,
      reasonCode: params.reasonCode || 'verified',
    },
  });

  if (onboardingItem) {
    await tx.sourceOnboardingItem.updateMany({
      where: {
        policyId: params.policyId,
        stage: 'BaselinePending',
      },
      data: {
        stage: 'QaReview',
        qaStatus: 'Pending',
        qaSummary: 'Verified first baseline captured privately. Source QA review is required before publication.',
        qaChecksJson: null,
        error: null,
      },
    });
  }

  await tx.adminReviewLog.create({
    data: {
      actorRole: 'system',
      action: 'rebaseline_from_seeded_record',
      targetType: 'policy',
      targetId: params.policyId,
      note: onboardingItem
        ? 'Bulk-onboarding baseline captured from verified source retrieval and held private pending QA and publication review.'
        : 'Seeded/demo baseline replaced with first verified source retrieval without creating public change evidence.',
      metadataJson: JSON.stringify({
        removedChangeCount: changeIds.length,
        removedSnapshotCount: removedSnapshots.count,
        source: params.source,
        finalUrl: params.finalUrl,
        archiveTimestamp: params.archiveTimestamp?.toISOString() || null,
        publicEvidence,
        sourceOnboardingItemId: onboardingItem?.id || null,
      }),
    },
  });

  await dualWriteCanonicalPolicyGraph(tx, params.policyId, { prune: true });

  return {
    policy,
    snapshot,
    removedChangeCount: changeIds.length,
    removedSnapshotCount: removedSnapshots.count,
  };
}
