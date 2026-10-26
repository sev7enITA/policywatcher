import { digest } from './evidence';
import { verifyReceipt, type ReplayReceipt } from './replay';
import type { RecipeScope } from './recipe';

export interface LessonProposal {
  schemaVersion: 1;
  claim: string;
  recipeSha256: string;
  scope: RecipeScope;
  receiptId: string;
  evidenceCaseIds: string[];
  expiresAt: string;
}

/** The resolver must use receipts from a trusted local replay, never model text. */
export function resolveLesson(
  proposal: LessonProposal,
  resolveReceipt: (id: string) => ReplayReceipt | undefined,
  now = new Date(),
) {
  if (proposal.schemaVersion !== 1 || typeof proposal.claim !== 'string' || !proposal.claim.trim()
    || proposal.claim.length > 2000 || !Array.isArray(proposal.evidenceCaseIds)
    || !proposal.evidenceCaseIds.length || new Set(proposal.evidenceCaseIds).size !== proposal.evidenceCaseIds.length) {
    throw new Error('invalid_lesson');
  }
  const receipt = resolveReceipt(proposal.receiptId);
  if (!receipt || receipt.receiptId !== proposal.receiptId) throw new Error('unresolved_lesson_receipt');
  verifyReceipt(receipt);
  const candidate = receipt.candidates.find((c) => c.recipeSha256 === proposal.recipeSha256);
  if (!candidate || digest(candidate.recipe) !== candidate.recipeSha256
    || digest(candidate.recipe.scope) !== digest(proposal.scope)) throw new Error('lesson_scope_or_recipe_mismatch');
  if (proposal.evidenceCaseIds.some((id) => !candidate.cases.some((c) => c.caseId === id && c.applied))) {
    throw new Error('unresolved_lesson_case');
  }
  const created = Date.parse(receipt.generatedAt);
  const expires = Date.parse(proposal.expiresAt);
  if (!Number.isFinite(now.getTime()) || !Number.isFinite(created) || !Number.isFinite(expires)
    || created > now.getTime() || expires <= created || expires - created > 30 * 86_400_000) {
    throw new Error('invalid_lesson_lifetime');
  }
  // Derive counts and counterexamples from ALL scoped cases, not selected citations.
  const scoped = candidate.cases.filter((c) => c.applied);
  const counterexamples = scoped.filter((c) => !c.passes).map((c) => c.caseId);
  const state = expires <= now.getTime() ? 'expired'
    : candidate.decision === 'recommend_shadow' && counterexamples.length === 0 ? 'validated_offline' : 'candidate';
  return {
    ...proposal, lessonId: digest(proposal), state,
    corpusKind: receipt.corpusKind,
    successes: scoped.filter((c) => c.passes).length,
    independentGroups: new Set(scoped.map((c) => c.groupId)).size,
    counterexamples,
    /** Offline support is not authorization for a live recipe change. */
    operationalEligible: false as const,
  };
}
