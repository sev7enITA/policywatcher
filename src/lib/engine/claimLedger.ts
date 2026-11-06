import { db } from '../db';
import { digest } from './document';
import type { ClaimSet, ModelOutput, Verification } from './claims';
import type { Tx } from './store';

/**
 * Queryable claim ledger. Callers must pass a ClaimSet that validateClaims has
 * already accepted with no reasons: every span then equals a slice of frozen
 * text, so evidence rows are "observed". The claim's meaning stays "inferred"
 * (a model produced it) until a named human approves it. A verifier verdict is
 * recorded as-is and never upgrades the status. Nothing here qualifies source
 * completeness or changes a public payload.
 */
export const EVIDENCE_STATUS = 'observed';
export const INTERPRETATION_STATUS = { inferred: 'inferred', approved: 'approved' } as const;
const VERDICTS = new Set(['supported', 'unsupported', 'uncertain']);

export interface LedgerContext {
  taskId: string;
  policyId: string;
  analysis: ModelOutput<ClaimSet>;
  verification?: ModelOutput<Verification>;
  reviewId?: string | null;
  changeId?: string | null;
}

function verdictFor(verification: ModelOutput<Verification> | undefined, claimId: string) {
  const list = Array.isArray(verification?.value?.verdicts) ? verification!.value.verdicts : [];
  const matches = list.filter(v => v?.claimId === claimId);
  // Duplicate or malformed verdicts are not attributable; record no verdict.
  if (matches.length !== 1) return { verdict: null, reason: null };
  const v = matches[0];
  if (!VERDICTS.has(v.verdict) || typeof v.reason !== 'string' || !v.reason.trim()) return { verdict: null, reason: null };
  return { verdict: v.verdict, reason: v.reason.slice(0, 2000) };
}

/** Idempotent per task: a retried hold or a later approval only links ids. */
export async function recordClaimLedger(tx: Tx, context: LedgerContext) {
  const link = { ...(context.reviewId ? { reviewId: context.reviewId } : {}), ...(context.changeId ? { changeId: context.changeId } : {}) };
  if (await tx.engineClaim.count({ where: { taskId: context.taskId } })) {
    if (Object.keys(link).length) await tx.engineClaim.updateMany({ where: { taskId: context.taskId }, data: link });
    return;
  }
  const { analysis, verification } = context;
  for (const [ordinal, claim] of analysis.value.claims.entries()) {
    const { verdict, reason } = verdictFor(verification, claim.id);
    await tx.engineClaim.create({ data: {
      taskId: context.taskId, claimKey: claim.id, ordinal, policyId: context.policyId,
      operation: claim.operation, category: claim.category, textEn: claim.textEn, textIt: claim.textIt, impact: claim.impact,
      deltaIdsJson: JSON.stringify(claim.deltaIds), interpretationStatus: INTERPRETATION_STATUS.inferred,
      analystModel: analysis.receipt.model, promptVersion: analysis.receipt.promptVersion, analysisOutputHash: analysis.receipt.outputHash,
      verifierModel: verification?.receipt?.model || null, verifierVerdict: verdict, verifierReason: reason, ...link,
      evidence: { create: claim.evidence.map((span, index) => ({ ordinal: index, side: span.side, documentHash: span.documentHash,
        startOffset: span.start, endOffset: span.end, quote: span.quote, quoteHash: digest(span.quote), status: EVIDENCE_STATUS })) },
    } });
  }
}

/** Human approval is per task and per named actor; it is never inferred. */
export async function approveClaimLedger(tx: Tx, taskId: string, actor: string, at = new Date()) {
  await tx.engineClaim.updateMany({ where: { taskId }, data: { interpretationStatus: INTERPRETATION_STATUS.approved, approvedBy: actor, approvedAt: at } });
}

export interface ClaimLedgerQuery {
  policyId?: string;
  verdict?: 'supported' | 'unsupported' | 'uncertain' | 'missing';
  interpretationStatus?: 'inferred' | 'approved';
  changeId?: string;
  take?: number;
}

/** Reviewer query: every claim comes back with its verbatim spans. */
export function listClaimLedger(query: ClaimLedgerQuery = {}) {
  return db.engineClaim.findMany({
    where: {
      ...(query.policyId ? { policyId: query.policyId } : {}),
      ...(query.changeId ? { changeId: query.changeId } : {}),
      ...(query.interpretationStatus ? { interpretationStatus: query.interpretationStatus } : {}),
      ...(query.verdict ? { verifierVerdict: query.verdict === 'missing' ? null : query.verdict } : {}),
    },
    include: { evidence: { orderBy: { ordinal: 'asc' } } },
    orderBy: [{ createdAt: 'desc' }, { ordinal: 'asc' }],
    take: Math.min(Math.max(query.take ?? 100, 1), 500),
  });
}
