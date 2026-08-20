import type { Prisma } from '@prisma/client';
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
} from '@/lib/provisionTaxonomy';
import {
  canonicalChangeSummary,
  legacyDocumentCanonicalKey,
  legacyEntityCanonicalKey,
  projectLegacyProvision,
  sha256Text,
} from '@/lib/documentEvidenceSync';

export const DOCUMENT_EVIDENCE_RECONCILIATION_VERSION = '1.0.0' as const;
export const DOCUMENT_EVIDENCE_ACTIVATION_GATE_VERSION = '1.0.0' as const;

export interface DocumentEvidenceCounts {
  entities: number;
  documents: number;
  versions: number;
  changes: number;
  provisions: number;
}

export interface LegacyEvidenceCounts {
  companies: number;
  policies: number;
  snapshots: number;
  changes: number;
}

export interface ReconciliationIssue {
  severity: 'error' | 'warning';
  code: string;
  legacyId?: string;
  canonicalId?: string;
  detail: string;
}

export interface DocumentEvidenceReconciliationReport {
  contractVersion: typeof DOCUMENT_EVIDENCE_RECONCILIATION_VERSION;
  checkedAt: string;
  status: 'reconciled' | 'blocked';
  legacy: LegacyEvidenceCounts;
  expected: DocumentEvidenceCounts;
  canonical: DocumentEvidenceCounts;
  errorCount: number;
  warningCount: number;
  issues: ReconciliationIssue[];
}

export interface DocumentEvidenceActivationGateReport {
  contractVersion: typeof DOCUMENT_EVIDENCE_ACTIVATION_GATE_VERSION;
  checkedAt: string;
  mode: 'aggregate-bridge-check';
  status: 'reconciled' | 'blocked';
  legacy: LegacyEvidenceCounts;
  expected: DocumentEvidenceCounts;
  canonical: DocumentEvidenceCounts;
  errorCount: number;
  warningCount: 0;
  issues: ReconciliationIssue[];
}

const POLICY_INCLUDE = {
  company: true,
  snapshots: { orderBy: [{ createdAt: 'asc' as const }, { version: 'asc' as const }, { id: 'asc' as const }] },
  changes: {
    orderBy: [{ createdAt: 'asc' as const }, { id: 'asc' as const }],
    include: { oldSnapshot: true, newSnapshot: true },
  },
} satisfies Prisma.PolicyInclude;

function sameInstant(left: Date | null, right: Date | null): boolean {
  return left?.getTime() === right?.getTime();
}

function pushMismatch(
  issues: ReconciliationIssue[],
  code: string,
  detail: string,
  refs: Pick<ReconciliationIssue, 'legacyId' | 'canonicalId'> = {},
): void {
  issues.push({ severity: 'error', code, detail, ...refs });
}

export async function inspectLegacyEvidenceSource(
  tx: Prisma.TransactionClient,
): Promise<{ counts: LegacyEvidenceCounts; expected: DocumentEvidenceCounts; issues: ReconciliationIssue[] }> {
  const companies = await tx.company.findMany({
    orderBy: { id: 'asc' },
    include: { policies: { include: POLICY_INCLUDE } },
  });
  const issues: ReconciliationIssue[] = [];
  let policies = 0;
  let snapshots = 0;
  let changes = 0;
  let baselines = 0;

  for (const company of companies) {
    for (const policy of company.policies) {
      policies += 1;
      snapshots += policy.snapshots.length;
      changes += policy.changes.length;
      const snapshotIds = new Set(policy.snapshots.map((snapshot) => snapshot.id));
      const hashes = new Map<string, string>();
      const targeted = new Set(policy.changes.map((change) => change.newSnapshotId));
      baselines += policy.snapshots.filter((snapshot) => !targeted.has(snapshot.id)).length;

      for (const snapshot of policy.snapshots) {
        const prior = hashes.get(snapshot.hash);
        if (prior && prior !== snapshot.id) {
          pushMismatch(
            issues,
            'legacy_snapshot_duplicate_hash',
            `Policy ${policy.id} has multiple snapshots with content hash ${snapshot.hash}.`,
            { legacyId: snapshot.id },
          );
        }
        hashes.set(snapshot.hash, snapshot.id);
        if (sha256Text(snapshot.text) !== snapshot.hash) {
          pushMismatch(
            issues,
            'legacy_snapshot_hash_mismatch',
            'The stored snapshot hash does not equal SHA-256 of the stored text.',
            { legacyId: snapshot.id },
          );
        }
      }

      for (const change of policy.changes) {
        if (!snapshotIds.has(change.newSnapshotId)) {
          pushMismatch(
            issues,
            'legacy_change_missing_new_snapshot',
            'The change target snapshot does not belong to the same policy graph.',
            { legacyId: change.id },
          );
        }
        if (change.oldSnapshotId && !snapshotIds.has(change.oldSnapshotId)) {
          pushMismatch(
            issues,
            'legacy_change_cross_policy_old_snapshot',
            'The change source snapshot does not belong to the same policy graph.',
            { legacyId: change.id },
          );
        }
      }
    }
  }

  return {
    counts: { companies: companies.length, policies, snapshots, changes },
    expected: {
      entities: companies.length,
      documents: policies,
      versions: snapshots,
      changes: changes + baselines,
      provisions: changes * PROVISION_TAXONOMY_KEYS.length,
    },
    issues,
  };
}

export async function countCanonicalEvidence(
  tx: Prisma.TransactionClient,
): Promise<DocumentEvidenceCounts> {
  const [entities, documents, versions, changes, provisions] = await Promise.all([
    tx.entity.count(),
    tx.document.count(),
    tx.version.count(),
    tx.change.count(),
    tx.provision.count(),
  ]);
  return { entities, documents, versions, changes, provisions };
}

/**
 * Constant-memory startup gate for an already fully reconciled dual-write graph.
 *
 * The explicit backfill/rehearsal command remains responsible for content-level
 * reconciliation. Startup verifies aggregate cardinality and every immutable
 * legacy bridge without loading either representation's policy text.
 */
export async function verifyDocumentEvidenceActivation(
  tx: Prisma.TransactionClient,
): Promise<DocumentEvidenceActivationGateReport> {
  const [
    companies,
    policies,
    snapshots,
    changes,
    baselines,
    canonical,
    bridgedEntities,
    bridgedDocuments,
    bridgedVersions,
    bridgedChanges,
    canonicalBaselines,
  ] = await Promise.all([
    tx.company.count(),
    tx.policy.count(),
    tx.policySnapshot.count(),
    tx.policyChange.count(),
    tx.policySnapshot.count({ where: { newChanges: { none: {} } } }),
    countCanonicalEvidence(tx),
    tx.entity.count({ where: { legacyCompanyId: { not: null } } }),
    tx.document.count({ where: { legacyPolicyId: { not: null } } }),
    tx.version.count({ where: { legacySnapshotId: { not: null } } }),
    tx.change.count({ where: { legacyPolicyChangeId: { not: null } } }),
    tx.change.count({ where: { legacyPolicyChangeId: null, kind: 'baseline' } }),
  ]);
  const legacy = { companies, policies, snapshots, changes };
  const expected = {
    entities: companies,
    documents: policies,
    versions: snapshots,
    changes: changes + baselines,
    provisions: changes * PROVISION_TAXONOMY_KEYS.length,
  };
  const issues: ReconciliationIssue[] = [];

  for (const key of Object.keys(expected) as (keyof DocumentEvidenceCounts)[]) {
    if (canonical[key] !== expected[key]) {
      pushMismatch(issues, 'canonical_count_mismatch', `Expected ${expected[key]} ${key}, found ${canonical[key]}.`);
    }
  }
  for (const [label, expectedCount, actualCount] of [
    ['entity', companies, bridgedEntities],
    ['document', policies, bridgedDocuments],
    ['version', snapshots, bridgedVersions],
    ['detected_change', changes, bridgedChanges],
    ['baseline_change', baselines, canonicalBaselines],
  ] as const) {
    if (actualCount !== expectedCount) {
      pushMismatch(
        issues,
        'canonical_bridge_count_mismatch',
        `Expected ${expectedCount} bridged ${label} records, found ${actualCount}.`,
      );
    }
  }

  return {
    contractVersion: DOCUMENT_EVIDENCE_ACTIVATION_GATE_VERSION,
    checkedAt: new Date().toISOString(),
    mode: 'aggregate-bridge-check',
    status: issues.length === 0 ? 'reconciled' : 'blocked',
    legacy,
    expected,
    canonical,
    errorCount: issues.length,
    warningCount: 0,
    issues,
  };
}

export async function reconcileDocumentEvidence(
  tx: Prisma.TransactionClient,
): Promise<DocumentEvidenceReconciliationReport> {
  const [source, canonical, companies, canonicalEntities, canonicalDocuments, canonicalVersions, canonicalChanges] =
    await Promise.all([
      inspectLegacyEvidenceSource(tx),
      countCanonicalEvidence(tx),
      tx.company.findMany({
        orderBy: { id: 'asc' },
        include: { policies: { include: POLICY_INCLUDE } },
      }),
      tx.entity.findMany(),
      tx.document.findMany(),
      tx.version.findMany(),
      tx.change.findMany({ include: { provisions: true } }),
    ]);
  const issues = [...source.issues];
  for (const key of Object.keys(source.expected) as (keyof DocumentEvidenceCounts)[]) {
    if (canonical[key] !== source.expected[key]) {
      pushMismatch(
        issues,
        'canonical_count_mismatch',
        `Expected ${source.expected[key]} ${key}, found ${canonical[key]}.`,
      );
    }
  }
  const entitiesByLegacy = new Map(
    canonicalEntities
      .filter((entity) => entity.legacyCompanyId)
      .map((entity) => [entity.legacyCompanyId!, entity]),
  );
  const documentsByLegacy = new Map(
    canonicalDocuments
      .filter((document) => document.legacyPolicyId)
      .map((document) => [document.legacyPolicyId!, document]),
  );
  const versionsByLegacy = new Map(
    canonicalVersions
      .filter((version) => version.legacySnapshotId)
      .map((version) => [version.legacySnapshotId!, version]),
  );
  const changesByLegacy = new Map(
    canonicalChanges
      .filter((change) => change.legacyPolicyChangeId)
      .map((change) => [change.legacyPolicyChangeId!, change]),
  );
  const legacyCompanyIds = new Set(companies.map((company) => company.id));
  const legacyPolicyIds = new Set<string>();
  const legacySnapshotIds = new Set<string>();
  const legacyChangeIds = new Set<string>();

  for (const company of companies) {
    const canonicalKey = legacyEntityCanonicalKey(company.id);
    const publicId = buildEntityPublicId(canonicalKey);
    const entity = entitiesByLegacy.get(company.id);
    if (!entity) {
      pushMismatch(issues, 'missing_entity', 'No canonical Entity is bridged to this company.', {
        legacyId: company.id,
      });
      continue;
    }
    if (
      entity.publicId !== publicId ||
      entity.canonicalKey !== canonicalKey ||
      entity.name !== company.name ||
      entity.website !== (company.website || null)
    ) {
      pushMismatch(issues, 'entity_projection_mismatch', 'Canonical Entity metadata or stable ID differs.', {
        legacyId: company.id,
        canonicalId: entity.id,
      });
    }

    for (const policy of company.policies) {
      legacyPolicyIds.add(policy.id);
      const documentKey = legacyDocumentCanonicalKey(policy.id);
      const documentPublicId = buildDocumentPublicId(publicId, documentKey);
      const document = documentsByLegacy.get(policy.id);
      if (!document) {
        pushMismatch(issues, 'missing_document', 'No canonical Document is bridged to this policy.', {
          legacyId: policy.id,
        });
        continue;
      }
      if (
        document.entityId !== entity.id ||
        document.publicId !== documentPublicId ||
        document.canonicalKey !== documentKey ||
        document.title !== policy.name ||
        document.documentType !== policy.type ||
        document.jurisdiction !== policy.jurisdiction ||
        document.canonicalUrl !== policy.url
      ) {
        pushMismatch(issues, 'document_projection_mismatch', 'Canonical Document metadata or stable ID differs.', {
          legacyId: policy.id,
          canonicalId: document.id,
        });
      }

      const versionPublicIds = new Map<string, string>();
      for (const snapshot of policy.snapshots) {
        legacySnapshotIds.add(snapshot.id);
        const versionPublicId = buildVersionPublicId(documentPublicId, snapshot.hash);
        versionPublicIds.set(snapshot.id, versionPublicId);
        const version = versionsByLegacy.get(snapshot.id);
        if (!version) {
          pushMismatch(issues, 'missing_version', 'No canonical Version is bridged to this snapshot.', {
            legacyId: snapshot.id,
          });
          continue;
        }
        if (
          version.documentId !== document.id ||
          version.publicId !== versionPublicId ||
          version.contentHash !== snapshot.hash ||
          version.sourceUrl !== policy.url ||
          version.contentText !== snapshot.text ||
          (!version.contentText && !version.contentRef) ||
          version.publicEvidence !== snapshot.publicEvidence ||
          version.sequence < 1 ||
          !sameInstant(version.capturedAt, snapshot.createdAt)
        ) {
          pushMismatch(issues, 'version_projection_mismatch', 'Canonical Version evidence differs.', {
            legacyId: snapshot.id,
            canonicalId: version.id,
          });
        }
      }

      const targetedSnapshotIds = new Set(policy.changes.map((change) => change.newSnapshotId));
      for (const snapshot of policy.snapshots) {
        if (targetedSnapshotIds.has(snapshot.id)) continue;
        const version = versionsByLegacy.get(snapshot.id);
        const versionPublicId = versionPublicIds.get(snapshot.id);
        if (!version || !versionPublicId) continue;
        const expectedPublicId = buildChangePublicId(documentPublicId, null, versionPublicId);
        const baseline = canonicalChanges.find(
          (change) =>
            change.documentId === document.id &&
            change.toVersionId === version.id &&
            change.legacyPolicyChangeId === null,
        );
        if (!baseline) {
          pushMismatch(issues, 'missing_baseline_change', 'No canonical baseline Change targets this Version.', {
            legacyId: snapshot.id,
          });
        } else if (
          baseline.publicId !== expectedPublicId ||
          baseline.kind !== 'baseline' ||
          baseline.fromVersionId !== null ||
          baseline.publicEvidence !== snapshot.publicEvidence ||
          !sameInstant(baseline.publishedAt, snapshot.publicEvidence ? snapshot.createdAt : null) ||
          !sameInstant(baseline.detectedAt, snapshot.createdAt)
        ) {
          pushMismatch(issues, 'baseline_change_projection_mismatch', 'Canonical baseline Change differs.', {
            legacyId: snapshot.id,
            canonicalId: baseline.id,
          });
        }
      }

      for (const legacyChange of policy.changes) {
        legacyChangeIds.add(legacyChange.id);
        const canonicalChange = changesByLegacy.get(legacyChange.id);
        const toVersion = versionsByLegacy.get(legacyChange.newSnapshotId);
        const fromVersion = legacyChange.oldSnapshotId
          ? versionsByLegacy.get(legacyChange.oldSnapshotId)
          : null;
        if (!canonicalChange) {
          pushMismatch(issues, 'missing_change', 'No canonical Change is bridged to this policy change.', {
            legacyId: legacyChange.id,
          });
          continue;
        }
        if (!toVersion) continue;
        const expectedPublicId = buildChangePublicId(
          documentPublicId,
          fromVersion?.publicId || null,
          toVersion.publicId,
        );
        if (
          canonicalChange.documentId !== document.id ||
          canonicalChange.publicId !== expectedPublicId ||
          canonicalChange.fromVersionId !== (fromVersion?.id || null) ||
          canonicalChange.toVersionId !== toVersion.id ||
          canonicalChange.kind !== 'detected' ||
          canonicalChange.summary !== canonicalChangeSummary(legacyChange) ||
          canonicalChange.publicEvidence !== legacyChange.publicEvidence ||
          !sameInstant(canonicalChange.publishedAt, legacyChange.publicPublishedAt) ||
          !sameInstant(canonicalChange.detectedAt, legacyChange.createdAt)
        ) {
          pushMismatch(issues, 'change_projection_mismatch', 'Canonical Change evidence differs.', {
            legacyId: legacyChange.id,
            canonicalId: canonicalChange.id,
          });
        }

        if (canonicalChange.provisions.length !== PROVISION_TAXONOMY_KEYS.length) {
          pushMismatch(
            issues,
            'change_provision_count_mismatch',
            `Expected ${PROVISION_TAXONOMY_KEYS.length} provisions, found ${canonicalChange.provisions.length}.`,
            { legacyId: legacyChange.id, canonicalId: canonicalChange.id },
          );
        }

        for (const taxonomyKey of PROVISION_TAXONOMY_KEYS) {
          const projection = projectLegacyProvision(legacyChange, taxonomyKey);
          const expectedProvisionId = buildProvisionPublicId(canonicalChange.publicId, taxonomyKey, 0);
          const provision = canonicalChange.provisions.find(
            (candidate) => candidate.taxonomyKey === taxonomyKey && candidate.ordinal === 0,
          );
          if (!provision) {
            pushMismatch(issues, 'missing_provision', `No ${taxonomyKey} Provision is projected.`, {
              legacyId: legacyChange.id,
              canonicalId: canonicalChange.id,
            });
          } else if (
            provision.publicId !== expectedProvisionId ||
            provision.taxonomyVersion !== PROVISION_TAXONOMY_VERSION ||
            provision.assessment !== projection.assessment ||
            provision.evidenceText !== projection.evidenceText ||
            provision.evidenceHash !== projection.evidenceHash ||
            provision.sourceLocator !== projection.sourceLocator ||
            provision.rationale !== projection.rationale ||
            provision.reviewStatus !== projection.reviewStatus
          ) {
            pushMismatch(issues, 'provision_projection_mismatch', `Canonical ${taxonomyKey} Provision differs.`, {
              legacyId: legacyChange.id,
              canonicalId: provision.id,
            });
          }
        }
      }
    }
  }

  for (const entity of canonicalEntities) {
    if (entity.legacyCompanyId && !legacyCompanyIds.has(entity.legacyCompanyId)) {
      pushMismatch(issues, 'orphan_bridged_entity', 'Canonical Entity references a missing legacy company.', {
        canonicalId: entity.id,
      });
    }
  }
  for (const document of canonicalDocuments) {
    if (document.legacyPolicyId && !legacyPolicyIds.has(document.legacyPolicyId)) {
      pushMismatch(issues, 'orphan_bridged_document', 'Canonical Document references a missing legacy policy.', {
        canonicalId: document.id,
      });
    }
  }
  for (const version of canonicalVersions) {
    if (version.legacySnapshotId && !legacySnapshotIds.has(version.legacySnapshotId)) {
      pushMismatch(issues, 'orphan_bridged_version', 'Canonical Version references a missing legacy snapshot.', {
        canonicalId: version.id,
      });
    }
  }
  for (const change of canonicalChanges) {
    if (change.legacyPolicyChangeId && !legacyChangeIds.has(change.legacyPolicyChangeId)) {
      pushMismatch(issues, 'orphan_bridged_change', 'Canonical Change references a missing legacy change.', {
        canonicalId: change.id,
      });
    }
  }

  const errorCount = issues.filter((issue) => issue.severity === 'error').length;
  const warningCount = issues.filter((issue) => issue.severity === 'warning').length;
  return {
    contractVersion: DOCUMENT_EVIDENCE_RECONCILIATION_VERSION,
    checkedAt: new Date().toISOString(),
    status: errorCount === 0 ? 'reconciled' : 'blocked',
    legacy: source.counts,
    expected: source.expected,
    canonical,
    errorCount,
    warningCount,
    issues,
  };
}
