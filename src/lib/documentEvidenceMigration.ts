import type { PrismaClient } from '@prisma/client';
import {
  countCanonicalEvidence,
  inspectLegacyEvidenceSource,
  reconcileDocumentEvidence,
  type DocumentEvidenceCounts,
  type DocumentEvidenceReconciliationReport,
  type LegacyEvidenceCounts,
  type ReconciliationIssue,
} from '@/lib/documentEvidenceReconciliation';
import {
  DOCUMENT_EVIDENCE_SYNC_VERSION,
  syncCanonicalEntityForCompany,
  syncCanonicalPolicyGraph,
} from '@/lib/documentEvidenceSync';

export const DOCUMENT_EVIDENCE_BACKFILL_APPROVAL =
  'I_ACKNOWLEDGE_DOCUMENT_EVIDENCE_BACKFILL' as const;
export const DOCUMENT_EVIDENCE_BACKFILL_VERSION = '1.0.0' as const;

export interface DocumentEvidenceBackfillReport {
  contractVersion: typeof DOCUMENT_EVIDENCE_BACKFILL_VERSION;
  syncVersion: typeof DOCUMENT_EVIDENCE_SYNC_VERSION;
  mode: 'dry-run' | 'apply';
  startedAt: string;
  completedAt: string;
  status: 'ready' | 'blocked' | 'applied';
  legacy: LegacyEvidenceCounts;
  expected: DocumentEvidenceCounts;
  canonicalBefore: DocumentEvidenceCounts;
  canonicalAfter: DocumentEvidenceCounts;
  processed: { companies: number; policies: number };
  sourceIssues: ReconciliationIssue[];
  executionError: string | null;
  reconciliation: DocumentEvidenceReconciliationReport | null;
}

function safeExecutionError(error: unknown): string {
  if (error instanceof Error && /^[a-z0-9_:-]{1,300}$/i.test(error.message)) return error.message;
  return 'document_evidence_backfill_failed';
}

async function readSourceState(client: PrismaClient) {
  return client.$transaction(
    async (tx) => ({
      source: await inspectLegacyEvidenceSource(tx),
      canonical: await countCanonicalEvidence(tx),
      companyIds: (await tx.company.findMany({ orderBy: { id: 'asc' }, select: { id: true } })).map(
        (company) => company.id,
      ),
      policyIds: (await tx.policy.findMany({ orderBy: { id: 'asc' }, select: { id: true } })).map(
        (policy) => policy.id,
      ),
    }),
    { maxWait: 10_000, timeout: 120_000 },
  );
}

export async function runDocumentEvidenceBackfill(options: {
  apply: boolean;
  client: PrismaClient;
  actorRole?: string;
  recordAudit?: boolean;
}): Promise<DocumentEvidenceBackfillReport> {
  const client = options.client;
  const startedAt = new Date();
  const state = await readSourceState(client);
  const base = {
    contractVersion: DOCUMENT_EVIDENCE_BACKFILL_VERSION,
    syncVersion: DOCUMENT_EVIDENCE_SYNC_VERSION,
    mode: options.apply ? ('apply' as const) : ('dry-run' as const),
    startedAt: startedAt.toISOString(),
    legacy: state.source.counts,
    expected: state.source.expected,
    canonicalBefore: state.canonical,
    processed: { companies: 0, policies: 0 },
    sourceIssues: state.source.issues,
  };

  if (!options.apply || state.source.issues.some((issue) => issue.severity === 'error')) {
    return {
      ...base,
      completedAt: new Date().toISOString(),
      status: state.source.issues.some((issue) => issue.severity === 'error') ? 'blocked' : 'ready',
      canonicalAfter: state.canonical,
      executionError: null,
      reconciliation: null,
    };
  }

  let executionError: string | null = null;
  try {
    for (const companyId of state.companyIds) {
      await client.$transaction(
        async (tx) => syncCanonicalEntityForCompany(tx, companyId),
        { maxWait: 10_000, timeout: 120_000 },
      );
      base.processed.companies += 1;
    }
    for (const policyId of state.policyIds) {
      await client.$transaction(
        async (tx) => syncCanonicalPolicyGraph(tx, policyId, { prune: true }),
        { maxWait: 10_000, timeout: 120_000 },
      );
      base.processed.policies += 1;
    }
  } catch (error) {
    executionError = safeExecutionError(error);
  }

  const reconciliation = await client.$transaction(
    async (tx) => reconcileDocumentEvidence(tx),
    { maxWait: 10_000, timeout: 120_000 },
  );
  const status = !executionError && reconciliation.status === 'reconciled' ? 'applied' : 'blocked';

  if (status === 'applied' && options.recordAudit !== false) {
    await client.adminReviewLog.create({
      data: {
        actorRole: options.actorRole || 'system',
        action: 'document_evidence_backfill_reconciled',
        targetType: 'database',
        targetId: 'canonical-document-evidence',
        note: 'Idempotent canonical evidence backfill completed and passed deterministic reconciliation.',
        metadataJson: JSON.stringify({
          contractVersion: DOCUMENT_EVIDENCE_BACKFILL_VERSION,
          syncVersion: DOCUMENT_EVIDENCE_SYNC_VERSION,
          legacy: state.source.counts,
          canonical: reconciliation.canonical,
          reconciliationStatus: reconciliation.status,
          completedAt: reconciliation.checkedAt,
        }),
      },
    });
  }

  return {
    ...base,
    completedAt: new Date().toISOString(),
    status,
    canonicalAfter: reconciliation.canonical,
    executionError,
    reconciliation,
  };
}
