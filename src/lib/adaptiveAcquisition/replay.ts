import {
  detectBlockPage, detectSoft404, hasLiveHostDrift, hasLivePathDrift, validateContent,
} from '../scraper';
import { canonicalJson, digest, sha256, verifyCapture, type RawCapture } from './evidence';
import { applyRecipe, recipeApplies, validateRecipe, type ExtractionRecipe } from './recipe';
import * as cheerio from 'cheerio';

export const REPLAY_VERSION = 'scraping-replay/1';
export const PROMOTION_RULES = Object.freeze({
  minTrain: 2, minHoldout: 3, minPositiveHoldout: 2, minNegativeHoldout: 1,
  requireTrainImprovement: true, requireHoldoutImprovement: true, maxRegressions: 0,
});

export interface ReplayCase {
  id: string;
  /** Captures of the same source/version, including mirrors, share a group. */
  groupId: string;
  split: 'train' | 'holdout';
  language: string;
  jurisdiction: string;
  capture: RawCapture;
  expected: { accept: boolean; required: string[]; forbidden: string[] };
}
export interface ReplayCorpus {
  schemaVersion: 1;
  kind: 'synthetic' | 'reviewed_captures' | 'provisional_captures';
  labelledBy: string;
  cases: ReplayCase[];
}
export interface CaseEvaluation {
  caseId: string;
  captureId: string;
  groupId: string;
  split: 'train' | 'holdout';
  applied: boolean;
  accepted: boolean;
  passes: boolean;
  reason: string;
  textSha256: string;
  textLength: number;
  missing: number;
  forbidden: number;
}
export interface CandidateEvaluation {
  recipe: ExtractionRecipe;
  recipeSha256: string;
  cases: CaseEvaluation[];
  decision: 'recommend_shadow' | 'keep_current' | 'insufficient_evidence';
  reasons: string[];
  wins: string[];
  regressions: string[];
}
export interface ReplayReceipt {
  schemaVersion: 1;
  engine: string;
  generatedAt: string;
  corpusKind: ReplayCorpus['kind'];
  corpusSha256: string;
  provenance: Record<string, string>;
  rules: typeof PROMOTION_RULES;
  baseline: CaseEvaluation[];
  candidates: CandidateEvaluation[];
  receiptId: string;
}

export function validateCorpus(corpus: ReplayCorpus): void {
  if (!corpus || corpus.schemaVersion !== 1 || !['synthetic', 'reviewed_captures', 'provisional_captures'].includes(corpus.kind)
    || typeof corpus.labelledBy !== 'string' || !corpus.labelledBy.trim()
    || !Array.isArray(corpus.cases) || !corpus.cases.length || corpus.cases.length > 200) {
    throw new Error('invalid_corpus');
  }
  const ids = new Set<string>();
  const bodies = new Set<string>();
  const groups = new Map<string, string>();
  for (const item of corpus.cases) {
    if (!item || typeof item.id !== 'string' || !item.id || ids.has(item.id)
      || typeof item.groupId !== 'string' || !item.groupId
      || !['train', 'holdout'].includes(item.split)
      || typeof item.language !== 'string' || !item.language.trim()
      || typeof item.jurisdiction !== 'string' || !item.jurisdiction.trim()
      || !item.expected || typeof item.expected.accept !== 'boolean'
      || !Array.isArray(item.expected.required) || !Array.isArray(item.expected.forbidden)
      || [...item.expected.required, ...item.expected.forbidden].some((s) => typeof s !== 'string' || !s.trim())
      || (item.expected.accept && item.expected.required.length < 2)) throw new Error('invalid_replay_case');
    verifyCapture(item.capture);
    // Duplicate bodies cannot inflate sample size or leak into reserved verification.
    if (bodies.has(item.capture.htmlSha256)) throw new Error('duplicate_capture_body');
    if (groups.has(item.groupId) && groups.get(item.groupId) !== item.split) throw new Error('split_group_leakage');
    ids.add(item.id); bodies.add(item.capture.htmlSha256); groups.set(item.groupId, item.split);
  }
}

function normalize(text: string): string { return text.replace(/\s+/g, ' ').trim().toLowerCase(); }

/** Shared deterministic evaluator. It never fetches, publishes or changes recipes. */
export async function extractFrozenCapture(
  capture: RawCapture,
  context: { language: string; jurisdiction: string },
  recipe?: ExtractionRecipe,
): Promise<{ applied: boolean; accepted: boolean; reason: string; text: string }> {
  verifyCapture(capture);
  if (recipe) validateRecipe(recipe);
  const applied = Boolean(recipe && recipeApplies(recipe, capture.requestedUrl, context.language, context.jurisdiction));
  let text = '';
  let reason = '';
  let accepted = false;
  // Invariant guards inspect the original body and provenance, before any recipe.
  if (!['direct', 'http2', 'rendered'].includes(capture.transport)) reason = 'historical_reference_only';
  else if (!capture.transportOk || capture.httpStatus < 200 || capture.httpStatus >= 400) reason = 'transport_not_successful';
  else if (hasLiveHostDrift(capture.requestedUrl, capture.finalUrl, capture.transport)
    || hasLivePathDrift(capture.requestedUrl, capture.finalUrl, capture.transport)) reason = 'source_scope_drift';
  else if (hasLanguageMismatch(capture.html, context.language)) reason = 'document_language_mismatch';
  else if (detectBlockPage(capture.html)) reason = 'blocked_original_body';
  else if (detectSoft404(capture.html)) reason = 'soft404_original_body';
  else {
    try {
      // Preserve a raw-document completeness signal even when a selector hides a
      // full-document link or an oversized section from the candidate's output.
      const original = await validateContent(capture.html, capture.requestedUrl);
      if (!original.ok && !['content_too_short', 'not_a_policy_page'].includes(original.reason)) {
        reason = original.reason;
      } else if (original.ok && original.partial) reason = original.partialReason || 'original_partial';
      else {
        const validation = applied && recipe
          ? await validateContent(applyRecipe(capture.html, recipe), capture.requestedUrl)
          : original;
        if (validation.ok) {
          text = validation.text;
          accepted = !validation.partial;
          reason = validation.partial ? validation.partialReason || 'partial' : 'accepted';
        } else reason = validation.reason;
      }
    } catch { reason = 'recipe_or_validation_error'; }
  }
  return { applied, accepted, reason, text };
}

function hasLanguageMismatch(html: string, expected: string): boolean {
  const declared = cheerio.load(html)('html').attr('lang')?.trim().toLowerCase().replaceAll('_', '-');
  const wanted = expected.trim().toLowerCase().replaceAll('_', '-');
  if (!declared || !wanted) return false;
  // A specific requested locale must match; a base language accepts its variants.
  return wanted.includes('-') ? wanted !== declared : wanted !== declared.split('-')[0];
}

async function evaluate(item: ReplayCase, recipe?: ExtractionRecipe): Promise<CaseEvaluation> {
  const { applied, accepted, reason, text } = await extractFrozenCapture(item.capture, item, recipe);
  const normalized = normalize(text);
  const missing = item.expected.required.filter((s) => !normalized.includes(normalize(s))).length;
  const forbidden = item.expected.forbidden.filter((s) => normalized.includes(normalize(s))).length;
  return {
    caseId: item.id, captureId: item.capture.captureId, groupId: item.groupId, split: item.split,
    applied, accepted, reason, textSha256: sha256(text), textLength: text.length, missing, forbidden,
    passes: item.expected.accept ? accepted && missing === 0 && forbidden === 0 : !accepted,
  };
}

function decide(corpus: ReplayCorpus, baseline: CaseEvaluation[], candidate: CaseEvaluation[]):
  Pick<CandidateEvaluation, 'decision' | 'reasons' | 'wins' | 'regressions'> {
  const wins = candidate.filter((r, i) => r.applied && r.passes && !baseline[i].passes).map((r) => r.caseId);
  const regressions = candidate.filter((r, i) => r.applied && !r.passes && baseline[i].passes).map((r) => r.caseId);
  if (corpus.kind === 'provisional_captures') {
    return { decision: 'insufficient_evidence', reasons: ['independent_labels_required'], wins, regressions };
  }
  const scoped = corpus.cases.filter((_, i) => candidate[i].applied);
  const count = (split: string, positive?: boolean) => new Set(scoped
    .filter((c) => c.split === split && (positive === undefined || c.expected.accept === positive))
    .map((c) => c.groupId)).size;
  const sufficient = count('train') >= PROMOTION_RULES.minTrain
    && count('holdout') >= PROMOTION_RULES.minHoldout
    && count('holdout', true) >= PROMOTION_RULES.minPositiveHoldout
    && count('holdout', false) >= PROMOTION_RULES.minNegativeHoldout;
  if (!sufficient) return { decision: 'insufficient_evidence', reasons: ['minimum_independent_cases_not_met'], wins, regressions };
  if (regressions.length) return { decision: 'keep_current', reasons: ['regression_detected'], wins, regressions };
  // A scoped recipe cannot repair an unrelated baseline failure. Keep all case
  // results in the receipt, but qualify this candidate only within its scope.
  if (candidate.some((r) => r.applied && !r.passes)) return { decision: 'keep_current', reasons: ['validation_failures_remain'], wins, regressions };
  if (!candidate.some((r) => r.split === 'train' && wins.includes(r.caseId))
    || !candidate.some((r) => r.split === 'holdout' && wins.includes(r.caseId))) {
    return { decision: 'keep_current', reasons: ['no_improvement_in_both_splits'], wins, regressions };
  }
  return { decision: 'recommend_shadow', reasons: ['offline_gates_passed_live_validation_required'], wins, regressions };
}

export async function replayCorpus(
  corpus: ReplayCorpus,
  recipes: ExtractionRecipe[],
  provenance: Record<string, string>,
  generatedAt = new Date().toISOString(),
): Promise<ReplayReceipt> {
  validateCorpus(corpus);
  if (!Number.isFinite(Date.parse(generatedAt)) || !Object.keys(provenance).length
    || Object.values(provenance).some((hash) => !/^[a-f0-9]{64}$/.test(hash))) throw new Error('invalid_replay_provenance');
  if (!Array.isArray(recipes) || recipes.length > 20) throw new Error('recipe_budget_exceeded');
  const recipeIds = new Set<string>();
  for (const recipe of recipes) {
    validateRecipe(recipe);
    const id = `${recipe.id}@${recipe.revision}`;
    if (recipeIds.has(id)) throw new Error('duplicate_recipe');
    recipeIds.add(id);
  }
  const baseline: CaseEvaluation[] = [];
  for (const item of corpus.cases) baseline.push(await evaluate(item));
  const candidates: CandidateEvaluation[] = [];
  for (const recipe of recipes) {
    const cases: CaseEvaluation[] = [];
    for (const item of corpus.cases) cases.push(await evaluate(item, recipe));
    candidates.push({ recipe, recipeSha256: digest(recipe), cases, ...decide(corpus, baseline, cases) });
  }
  const body = {
    schemaVersion: 1 as const, engine: REPLAY_VERSION, generatedAt,
    corpusKind: corpus.kind, corpusSha256: digest(corpus), provenance,
    rules: PROMOTION_RULES, baseline, candidates,
  };
  return { ...body, receiptId: digest(body) };
}

export function verifyReceipt(receipt: ReplayReceipt): void {
  const { receiptId, ...body } = receipt;
  if (receipt.schemaVersion !== 1 || receipt.engine !== REPLAY_VERSION
    || canonicalJson(receipt.rules) !== canonicalJson(PROMOTION_RULES)
    || digest(body) !== receiptId) throw new Error('receipt_integrity_mismatch');
}
