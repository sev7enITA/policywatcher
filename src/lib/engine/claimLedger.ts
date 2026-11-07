import { db } from '../db';
import { digest } from './document';
import { validateVerification, type ClaimSet, type ModelOutput, type Verification } from './claims';
import type { Tx } from './store';

/**
 * Queryable claim ledger. Callers must pass a ClaimSet that validateClaims has
 * already accepted with no reasons: every span then equals a slice of frozen
 * text, so evidence rows are "observed". The claim's meaning stays "inferred"
 * (a model produced it) until an approval records an actor label. Today the
 * admin route supplies a role label ("admin"), not a personal identity.
 * A verifier verdict is stored only when the verifier output is valid under
 * validateVerification; malformed output is stored as null (query "missing")
 * and the raw response stays in the task checkpoint. A verdict never upgrades
 * status. Nothing here qualifies source completeness or changes a public payload.
 */
export const EVIDENCE_STATUS = 'observed';
export const INTERPRETATION_STATUS = { inferred: 'inferred', approved: 'approved' } as const;

export interface LedgerContext {
  taskId: string;
  policyId: string;
  analysis: ModelOutput<ClaimSet>;
  verification?: ModelOutput<Verification>;
  reviewId?: string | null;
  changeId?: string | null;
}

/** Same contract as validateVerification: any structural defect voids every verdict. */
export function ledgerVerdicts(claims: ClaimSet, verification?: ModelOutput<Verification>) {
  const verdicts = new Map<string, { verdict: string; reason: string }>();
  if (!verification) return verdicts;
  const reasons = validateVerification(verification.value, claims);
  if (reasons.some(r => r === 'verification_incomplete' || r === 'verification_invalid')) return verdicts;
  for (const v of verification.value.verdicts) verdicts.set(v.claimId, { verdict: v.verdict, reason: v.reason });
  return verdicts;
}

/** Idempotent per task: a retried hold or a later approval only links ids. */
export async function recordClaimLedger(tx: Tx, context: LedgerContext) {
  const link = { ...(context.reviewId ? { reviewId: context.reviewId } : {}), ...(context.changeId ? { changeId: context.changeId } : {}) };
  if (await tx.engineClaim.count({ where: { taskId: context.taskId } })) {
    if (Object.keys(link).length) await tx.engineClaim.updateMany({ where: { taskId: context.taskId }, data: link });
    return;
  }
  const { analysis, verification } = context;
  const verdicts = ledgerVerdicts(analysis.value, verification);
  for (const [ordinal, claim] of analysis.value.claims.entries()) {
    const verdict = verdicts.get(claim.id);
    await tx.engineClaim.create({ data: {
      taskId: context.taskId, claimKey: claim.id, ordinal, policyId: context.policyId,
      operation: claim.operation, category: claim.category, textEn: claim.textEn, textIt: claim.textIt, impact: claim.impact,
      deltaIdsJson: JSON.stringify(claim.deltaIds), interpretationStatus: INTERPRETATION_STATUS.inferred,
      analystModel: analysis.receipt.model, promptVersion: analysis.receipt.promptVersion, analysisOutputHash: analysis.receipt.outputHash,
      verifierModel: verification?.receipt?.model || null, verifierVerdict: verdict?.verdict ?? null, verifierReason: verdict?.reason ?? null, ...link,
      evidence: { create: claim.evidence.map((span, index) => ({ ordinal: index, side: span.side, documentHash: span.documentHash,
        startOffset: span.start, endOffset: span.end, quote: span.quote, quoteHash: digest(span.quote), status: EVIDENCE_STATUS })) },
    } });
  }
}

/** Approval records the actor label supplied by the caller; it is never inferred. */
export async function approveClaimLedger(tx: Tx, taskId: string, actor: string, at = new Date()) {
  await tx.engineClaim.updateMany({ where: { taskId }, data: { interpretationStatus: INTERPRETATION_STATUS.approved, approvedBy: actor, approvedAt: at } });
}

export interface ClaimLedgerQuery {
  policyId?: string;
  verdict?: 'supported' | 'unsupported' | 'uncertain' | 'missing';
  interpretationStatus?: 'inferred' | 'approved';
  changeId?: string;
  take?: number;
  /** Opaque cursor: the `nextCursor` of the previous page. */
  cursor?: string | null;
}

/** Reviewer query with stable keyset pagination; each claim carries its verbatim spans. */
export async function listClaimLedger(query: ClaimLedgerQuery = {}) {
  const take = Math.min(Math.max(query.take ?? 100, 1), 500);
  const rows = await db.engineClaim.findMany({
    where: {
      ...(query.policyId ? { policyId: query.policyId } : {}),
      ...(query.changeId ? { changeId: query.changeId } : {}),
      ...(query.interpretationStatus ? { interpretationStatus: query.interpretationStatus } : {}),
      ...(query.verdict ? { verifierVerdict: query.verdict === 'missing' ? null : query.verdict } : {}),
    },
    include: { evidence: { orderBy: { ordinal: 'asc' } } },
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    take: take + 1,
  });
  const items = rows.slice(0, take);
  return { items, nextCursor: rows.length > take ? items[items.length - 1].id : null };
}
