import { createHash } from 'node:crypto';
import type { PolicyChange, Prisma } from '@prisma/client';
import {
  buildChangePublicId,
  buildDocumentPublicId,
  buildEntityPublicId,
  buildProvisionPublicId,
  buildVersionPublicId,
} from '@/lib/publicEvidenceIds';
import {
  PROVISION_TAXONOMY_KEYS,
  PROVISION_TAXONOMY_VERSION,
  type ProvisionAssessment,
  type ProvisionTaxonomyKey,
} from '@/lib/provisionTaxonomy';

export const DOCUMENT_EVIDENCE_DUAL_WRITE_ENV =
  'POLICYWATCHER_DOCUMENT_EVIDENCE_DUAL_WRITE' as const;
export const DOCUMENT_EVIDENCE_SYNC_VERSION = '1.0.0' as const;

const LEGACY_POLICY_GRAPH_INCLUDE = {
  company: true,
  snapshots: { orderBy: [{ createdAt: 'asc' as const }, { version: 'asc' as const }, { id: 'asc' as const }] },
  changes: {
    orderBy: [{ createdAt: 'asc' as const }, { id: 'asc' as const }],
    include: { oldSnapshot: true, newSnapshot: true },
  },
} satisfies Prisma.PolicyInclude;

type LegacyPolicyGraph = Prisma.PolicyGetPayload<{
  include: typeof LEGACY_POLICY_GRAPH_INCLUDE;
}>;

interface CanonicalVersionRef {
  id: string;
  publicId: string;
  sequence: number;
  legacySnapshotId: string | null;
}

export interface CanonicalSyncResult {
  entityId: string;
  documentId: string;
  versions: number;
  changes: number;
  provisions: number;
}

export function isDocumentEvidenceDualWriteEnabled(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return environment[DOCUMENT_EVIDENCE_DUAL_WRITE_ENV]?.trim() === '1';
}

export function legacyEntityCanonicalKey(companyId: string): string {
  return `legacy-company:${companyId}`;
}

export function legacyDocumentCanonicalKey(policyId: string): string {
  return `legacy-policy:${policyId}`;
}

export function sha256Text(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function meaningfulLegacyValue(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized || /^not assessed$/i.test(normalized)) return null;
  return normalized;
}

function assessmentForLegacyValue(value: string | null): ProvisionAssessment {
  if (!value) return 'not_assessed';
  if (/\b(not specified|unclear|unknown|unspecified)\b/i.test(value)) return 'unclear';
  if (/\b(opt[- ]?out|conditional|limited|except|unless|case[- ]by[- ]case)\b/i.test(value)) {
    return 'conditional';
  }
  return 'present';
}

const LEGACY_PROVISION_FIELDS: Readonly<
  Record<ProvisionTaxonomyKey, readonly (keyof PolicyChange)[]>
> = Object.freeze({
  ai_training: ['kpiAiTrainingOptOut', 'aiTrainingOptOut'],
  data_sharing: ['kpiThirdPartySharing', 'aiDataScrapingRestricted'],
  retention: ['kpiDataRetention', 'aiPromptRetention'],
  arbitration: [],
  content_licensing: ['kpiAiOutputOwnership', 'aiIpLicensing'],
  liability: [],
});

export interface LegacyProvisionProjection {
  taxonomyKey: ProvisionTaxonomyKey;
  ordinal: 0;
  assessment: ProvisionAssessment;
  evidenceText: string | null;
  evidenceHash: string | null;
  sourceLocator: string | null;
  rationale: string;
  reviewStatus: 'draft' | 'reviewed' | 'published';
}

export function projectLegacyProvision(
  change: PolicyChange,
  taxonomyKey: ProvisionTaxonomyKey,
): LegacyProvisionProjection {
  const field = LEGACY_PROVISION_FIELDS[taxonomyKey].find((candidate) =>
    meaningfulLegacyValue(String(change[candidate] ?? '')),
  );
  const evidenceText = field
    ? meaningfulLegacyValue(String(change[field] ?? ''))
    : null;
  const reviewStatus = change.publicEvidence
    ? change.publicPublishedAt
      ? 'published'
      : 'reviewed'
    : 'draft';

  return {
    taxonomyKey,
    ordinal: 0,
    assessment: assessmentForLegacyValue(evidenceText),
    evidenceText,
    evidenceHash: evidenceText ? sha256Text(evidenceText) : null,
    sourceLocator: field ? `legacy:PolicyChange:${change.id}#${String(field)}` : null,
    rationale: field
      ? `Projected from legacy structured field ${String(field)}. The assessment describes observed structured evidence, not legal effect or enforceability.`
      : 'No compatible structured legacy field is available; human review is required.',
    reviewStatus,
  };
}

export function canonicalChangeSummary(change: PolicyChange): string | null {
  return meaningfulLegacyValue(change.tldrEn) || meaningfulLegacyValue(change.aiSummaryEn);
}

async function findOrCreateEntity(
  tx: Prisma.TransactionClient,
  company: LegacyPolicyGraph['company'],
) {
  const canonicalKey = legacyEntityCanonicalKey(company.id);
  const publicId = buildEntityPublicId(canonicalKey);
  const [byLegacyId, byPublicId] = await Promise.all([
    tx.entity.findUnique({ where: { legacyCompanyId: company.id } }),
    tx.entity.findUnique({ where: { publicId } }),
  ]);
  if (byLegacyId && byPublicId && byLegacyId.id !== byPublicId.id) {
    throw new Error(`canonical_entity_identity_conflict:${company.id}`);
  }
  const existing = byLegacyId || byPublicId;
  if (existing && (existing.publicId !== publicId || existing.canonicalKey !== canonicalKey)) {
    throw new Error(`canonical_entity_stable_id_conflict:${company.id}`);
  }
  const data = {
    publicId,
    canonicalKey,
    name: company.name,
    entityType: 'organization',
    website: company.website || null,
    legacyCompanyId: company.id,
  };
  return existing
    ? tx.entity.update({ where: { id: existing.id }, data })
    : tx.entity.create({ data: { ...data, createdAt: company.createdAt } });
}

export async function syncCanonicalEntityForCompany(
  tx: Prisma.TransactionClient,
  companyId: string,
) {
  const company = await tx.company.findUnique({ where: { id: companyId } });
  if (!company) throw new Error(`legacy_company_not_found:${companyId}`);
  return findOrCreateEntity(tx, company);
}

async function findOrCreateDocument(
  tx: Prisma.TransactionClient,
  policy: LegacyPolicyGraph,
  entityId: string,
  entityPublicId: string,
) {
  const canonicalKey = legacyDocumentCanonicalKey(policy.id);
  const publicId = buildDocumentPublicId(entityPublicId, canonicalKey);
  const [byLegacyId, byPublicId] = await Promise.all([
    tx.document.findUnique({ where: { legacyPolicyId: policy.id } }),
    tx.document.findUnique({ where: { publicId } }),
  ]);
  if (byLegacyId && byPublicId && byLegacyId.id !== byPublicId.id) {
    throw new Error(`canonical_document_identity_conflict:${policy.id}`);
  }
  const existing = byLegacyId || byPublicId;
  if (
    existing &&
    (existing.publicId !== publicId ||
      existing.canonicalKey !== canonicalKey ||
      existing.entityId !== entityId)
  ) {
    throw new Error(`canonical_document_stable_id_conflict:${policy.id}`);
  }
  const data = {
    publicId,
    entityId,
    canonicalKey,
    title: policy.name,
    documentType: policy.type,
    jurisdiction: policy.jurisdiction,
    canonicalUrl: policy.url,
    legacyPolicyId: policy.id,
  };
  return existing
    ? tx.document.update({ where: { id: existing.id }, data })
    : tx.document.create({ data: { ...data, createdAt: policy.createdAt } });
}

function assertLegacyGraphCanBeProjected(policy: LegacyPolicyGraph): void {
  const hashes = new Map<string, string>();
  const snapshotIds = new Set(policy.snapshots.map((snapshot) => snapshot.id));
  for (const snapshot of policy.snapshots) {
    const priorId = hashes.get(snapshot.hash);
    if (priorId && priorId !== snapshot.id) {
      throw new Error(`legacy_snapshot_duplicate_hash:${policy.id}:${snapshot.hash}`);
    }
    hashes.set(snapshot.hash, snapshot.id);
    if (sha256Text(snapshot.text) !== snapshot.hash) {
      throw new Error(`legacy_snapshot_hash_mismatch:${snapshot.id}`);
    }
  }
  for (const change of policy.changes) {
    if (!snapshotIds.has(change.newSnapshotId)) {
      throw new Error(`legacy_change_missing_new_snapshot:${change.id}`);
    }
    if (change.oldSnapshotId && !snapshotIds.has(change.oldSnapshotId)) {
      throw new Error(`legacy_change_cross_policy_old_snapshot:${change.id}`);
    }
  }
}

async function pruneRemovedLegacyRows(
  tx: Prisma.TransactionClient,
  policy: LegacyPolicyGraph,
  documentId: string,
): Promise<void> {
  const snapshotIds = new Set(policy.snapshots.map((snapshot) => snapshot.id));
  const changeIds = new Set(policy.changes.map((change) => change.id));
  const targetedSnapshotIds = new Set(policy.changes.map((change) => change.newSnapshotId));

  const bridgedChanges = await tx.change.findMany({
    where: { documentId, legacyPolicyChangeId: { not: null } },
    select: { id: true, legacyPolicyChangeId: true },
  });
  const staleChangeIds = bridgedChanges
    .filter((change) => !change.legacyPolicyChangeId || !changeIds.has(change.legacyPolicyChangeId))
    .map((change) => change.id);
  if (staleChangeIds.length) await tx.change.deleteMany({ where: { id: { in: staleChangeIds } } });

  const baselines = await tx.change.findMany({
    where: { documentId, kind: 'baseline', legacyPolicyChangeId: null },
    select: { id: true, toVersion: { select: { legacySnapshotId: true } } },
  });
  const staleBaselineIds = baselines
    .filter(
      (change) =>
        !change.toVersion.legacySnapshotId ||
        !snapshotIds.has(change.toVersion.legacySnapshotId) ||
        targetedSnapshotIds.has(change.toVersion.legacySnapshotId),
    )
    .map((change) => change.id);
  if (staleBaselineIds.length) await tx.change.deleteMany({ where: { id: { in: staleBaselineIds } } });

  const bridgedVersions = await tx.version.findMany({
    where: { documentId, legacySnapshotId: { not: null } },
    select: { id: true, legacySnapshotId: true },
  });
  const staleVersionIds = bridgedVersions
    .filter((version) => !version.legacySnapshotId || !snapshotIds.has(version.legacySnapshotId))
    .map((version) => version.id);
  if (staleVersionIds.length) await tx.version.deleteMany({ where: { id: { in: staleVersionIds } } });
}

async function syncVersion(
  tx: Prisma.TransactionClient,
  policy: LegacyPolicyGraph,
  document: { id: string; publicId: string },
  snapshot: LegacyPolicyGraph['snapshots'][number],
  nextSequence: () => number,
): Promise<CanonicalVersionRef> {
  const publicId = buildVersionPublicId(document.publicId, snapshot.hash);
  const [byLegacyId, byPublicId] = await Promise.all([
    tx.version.findUnique({ where: { legacySnapshotId: snapshot.id } }),
    tx.version.findUnique({ where: { publicId } }),
  ]);
  if (byLegacyId && byPublicId && byLegacyId.id !== byPublicId.id) {
    throw new Error(`canonical_version_identity_conflict:${snapshot.id}`);
  }
  const existing = byLegacyId || byPublicId;
  if (
    existing &&
    (existing.publicId !== publicId ||
      existing.documentId !== document.id ||
      (existing.legacySnapshotId && existing.legacySnapshotId !== snapshot.id))
  ) {
    throw new Error(`canonical_version_stable_id_conflict:${snapshot.id}`);
  }
  const sequence = existing?.sequence ?? nextSequence();
  const data = {
    publicId,
    documentId: document.id,
    sequence,
    contentHash: snapshot.hash,
    sourceUrl: policy.url,
    capturedAt: snapshot.createdAt,
    effectiveAt: null,
    contentRef: null,
    contentText: snapshot.text,
    publicEvidence: snapshot.publicEvidence,
    legacySnapshotId: snapshot.id,
  };
  const version = existing
    ? await tx.version.update({ where: { id: existing.id }, data })
    : await tx.version.create({ data: { ...data, createdAt: snapshot.createdAt } });
  return {
    id: version.id,
    publicId: version.publicId,
    sequence: version.sequence,
    legacySnapshotId: version.legacySnapshotId,
  };
}

async function findOrCreateChange(
  tx: Prisma.TransactionClient,
  params: {
    document: { id: string; publicId: string };
    fromVersion: CanonicalVersionRef | null;
    toVersion: CanonicalVersionRef;
    legacyChange: PolicyChange | null;
    publicEvidence: boolean;
    detectedAt: Date;
  },
) {
  const publicId = buildChangePublicId(
    params.document.publicId,
    params.fromVersion?.publicId || null,
    params.toVersion.publicId,
  );
  const byLegacyId = params.legacyChange
    ? await tx.change.findUnique({ where: { legacyPolicyChangeId: params.legacyChange.id } })
    : null;
  const [byPublicId, byTransition] = await Promise.all([
    tx.change.findUnique({ where: { publicId } }),
    tx.change.findUnique({
      where: {
        documentId_toVersionId: {
          documentId: params.document.id,
          toVersionId: params.toVersion.id,
        },
      },
    }),
  ]);
  const matches = [byLegacyId, byPublicId, byTransition].filter(Boolean);
  if (matches.some((match) => match!.id !== matches[0]!.id)) {
    throw new Error(
      `canonical_change_identity_conflict:${params.legacyChange?.id || params.toVersion.legacySnapshotId}`,
    );
  }
  const existing = matches[0];
  if (
    existing &&
    (existing.publicId !== publicId ||
      existing.documentId !== params.document.id ||
      (existing.legacyPolicyChangeId &&
        existing.legacyPolicyChangeId !== params.legacyChange?.id))
  ) {
    throw new Error(
      `canonical_change_stable_id_conflict:${params.legacyChange?.id || params.toVersion.legacySnapshotId}`,
    );
  }
  const data = {
    publicId,
    documentId: params.document.id,
    fromVersionId: params.fromVersion?.id || null,
    toVersionId: params.toVersion.id,
    kind: params.legacyChange ? 'detected' : 'baseline',
    summary: params.legacyChange
      ? canonicalChangeSummary(params.legacyChange)
      : 'Verified baseline imported from legacy evidence.',
    detectedAt: params.detectedAt,
    publicEvidence: params.publicEvidence,
    publishedAt: params.legacyChange
      ? params.legacyChange.publicPublishedAt
      : params.publicEvidence
        ? params.detectedAt
        : null,
    legacyPolicyChangeId: params.legacyChange?.id || null,
  };
  return existing
    ? tx.change.update({ where: { id: existing.id }, data })
    : tx.change.create({ data: { ...data, createdAt: params.detectedAt } });
}

async function syncProvisions(
  tx: Prisma.TransactionClient,
  canonicalChange: { id: string; publicId: string },
  legacyChange: PolicyChange,
): Promise<number> {
  for (const taxonomyKey of PROVISION_TAXONOMY_KEYS) {
    const projection = projectLegacyProvision(legacyChange, taxonomyKey);
    const publicId = buildProvisionPublicId(canonicalChange.publicId, taxonomyKey, 0);
    const byPublicId = await tx.provision.findUnique({ where: { publicId } });
    const byTaxon = await tx.provision.findUnique({
      where: {
        changeId_taxonomyKey_ordinal: {
          changeId: canonicalChange.id,
          taxonomyKey,
          ordinal: 0,
        },
      },
    });
    if (byPublicId && byTaxon && byPublicId.id !== byTaxon.id) {
      throw new Error(`canonical_provision_identity_conflict:${legacyChange.id}:${taxonomyKey}`);
    }
    const existing = byPublicId || byTaxon;
    if (existing && (existing.publicId !== publicId || existing.changeId !== canonicalChange.id)) {
      throw new Error(`canonical_provision_stable_id_conflict:${legacyChange.id}:${taxonomyKey}`);
    }
    const data = {
      publicId,
      changeId: canonicalChange.id,
      taxonomyVersion: PROVISION_TAXONOMY_VERSION,
      ...projection,
    };
    if (existing) {
      await tx.provision.update({ where: { id: existing.id }, data });
    } else {
      await tx.provision.create({ data: { ...data, createdAt: legacyChange.createdAt } });
    }
  }
  return PROVISION_TAXONOMY_KEYS.length;
}

/**
 * Projects one complete legacy policy graph into the canonical graph. The
 * operation is idempotent and is intended to run inside the same transaction
 * as the legacy mutation. Stable public IDs are never rewritten on conflict.
 */
export async function syncCanonicalPolicyGraph(
  tx: Prisma.TransactionClient,
  policyId: string,
  options: { prune?: boolean } = {},
): Promise<CanonicalSyncResult> {
  const policy = await tx.policy.findUnique({
    where: { id: policyId },
    include: LEGACY_POLICY_GRAPH_INCLUDE,
  });
  if (!policy) throw new Error(`legacy_policy_not_found:${policyId}`);
  assertLegacyGraphCanBeProjected(policy);

  const entity = await findOrCreateEntity(tx, policy.company);
  const document = await findOrCreateDocument(tx, policy, entity.id, entity.publicId);
  if (options.prune) await pruneRemovedLegacyRows(tx, policy, document.id);

  const existingVersions = await tx.version.findMany({
    where: { documentId: document.id },
    select: { sequence: true },
  });
  let maximumSequence = existingVersions.reduce(
    (maximum, version) => Math.max(maximum, version.sequence),
    0,
  );
  const versionsByLegacyId = new Map<string, CanonicalVersionRef>();
  for (const snapshot of policy.snapshots) {
    const version = await syncVersion(
      tx,
      policy,
      document,
      snapshot,
      () => ++maximumSequence,
    );
    versionsByLegacyId.set(snapshot.id, version);
  }

  const targetedSnapshotIds = new Set(policy.changes.map((change) => change.newSnapshotId));
  let changeCount = 0;
  let provisionCount = 0;
  for (const snapshot of policy.snapshots) {
    if (targetedSnapshotIds.has(snapshot.id)) continue;
    const toVersion = versionsByLegacyId.get(snapshot.id);
    if (!toVersion) throw new Error(`canonical_version_missing_after_sync:${snapshot.id}`);
    await findOrCreateChange(tx, {
      document,
      fromVersion: null,
      toVersion,
      legacyChange: null,
      publicEvidence: snapshot.publicEvidence,
      detectedAt: snapshot.createdAt,
    });
    changeCount += 1;
  }

  for (const legacyChange of policy.changes) {
    const fromVersion = legacyChange.oldSnapshotId
      ? versionsByLegacyId.get(legacyChange.oldSnapshotId) || null
      : null;
    const toVersion = versionsByLegacyId.get(legacyChange.newSnapshotId);
    if (!toVersion) throw new Error(`canonical_change_to_version_missing:${legacyChange.id}`);
    const canonicalChange = await findOrCreateChange(tx, {
      document,
      fromVersion,
      toVersion,
      legacyChange,
      publicEvidence: legacyChange.publicEvidence,
      detectedAt: legacyChange.createdAt,
    });
    changeCount += 1;
    provisionCount += await syncProvisions(tx, canonicalChange, legacyChange);
  }

  return {
    entityId: entity.id,
    documentId: document.id,
    versions: policy.snapshots.length,
    changes: changeCount,
    provisions: provisionCount,
  };
}

export async function dualWriteCanonicalPolicyGraph(
  tx: Prisma.TransactionClient,
  policyId: string,
  options: { prune?: boolean } = {},
): Promise<CanonicalSyncResult | null> {
  if (!isDocumentEvidenceDualWriteEnabled()) return null;
  return syncCanonicalPolicyGraph(tx, policyId, options);
}

export async function dualWriteCanonicalEntity(
  tx: Prisma.TransactionClient,
  companyId: string,
) {
  if (!isDocumentEvidenceDualWriteEnabled()) return null;
  return syncCanonicalEntityForCompany(tx, companyId);
}

export async function deleteCanonicalDocumentForLegacyPolicy(
  tx: Prisma.TransactionClient,
  policyId: string,
): Promise<void> {
  if (!isDocumentEvidenceDualWriteEnabled()) return;
  await tx.document.deleteMany({ where: { legacyPolicyId: policyId } });
}

export async function deleteCanonicalEntityForLegacyCompany(
  tx: Prisma.TransactionClient,
  companyId: string,
): Promise<void> {
  if (!isDocumentEvidenceDualWriteEnabled()) return;
  await tx.entity.deleteMany({ where: { legacyCompanyId: companyId } });
}
