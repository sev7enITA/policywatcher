import { sha256 } from './extractionProfile';

export type ReviewMetric = 'substantive_change' | 'ai_citation';
export type ReviewedChange = {
  id: string; diff: string; aiSummaryEn: string; aiSummaryIt: string;
  oldSnapshot: { hash: string; text: string } | null;
  newSnapshot: { hash: string; text: string } | null;
};
export function reviewEvidenceHash(change: ReviewedChange) {
  return sha256(JSON.stringify([change.oldSnapshot?.hash, change.newSnapshot?.hash,
    change.oldSnapshot ? sha256(change.oldSnapshot.text) : null, change.newSnapshot ? sha256(change.newSnapshot.text) : null,
    change.aiSummaryEn, change.aiSummaryIt, change.diff]));
}
export type ReviewRow = { changeId: string; metric: string; verdict: string; evidenceHash: string };
export function reviewedMetrics(reviews: ReviewRow[], currentHashes: Map<string, string>) {
  const current = reviews.filter(r => currentHashes.get(r.changeId) === r.evidenceHash);
  const measure = (metric: ReviewMetric, numeratorVerdict: string) => {
    const rows = current.filter(r => r.metric === metric && ['pass', 'fail'].includes(r.verdict));
    const numerator = rows.filter(r => r.verdict === numeratorVerdict).length;
    return { numerator, denominator: rows.length, percent: rows.length ? Math.round(numerator / rows.length * 1000) / 10 : null,
      unassessed: current.filter(r => r.metric === metric && r.verdict === 'unassessed').length };
  };
  return {
    falsePositiveShare: measure('substantive_change', 'fail'),
    citationSupport: measure('ai_citation', 'pass'),
    staleReviews: reviews.length - current.length,
    scope: 'Manually reviewed sample only; false-positive share among reviewed detected changes, not population false-positive rate. Citation support is a human judgement, not an exact-match score.',
  };
}

/** No text is persisted or fetched here. A difference is a review signal, never a correctness verdict. */
export function compareExtractions(a: string, b: string, scopeConfirmed: boolean) {
  if (!scopeConfirmed) return { comparable: false as const, reason: 'Confirm equivalent document, language, jurisdiction and period first.' };
  const tokens = (s: string) => new Set(s.toLocaleLowerCase('en').match(/[\p{L}\p{N}]+/gu) || []);
  const left = tokens(a); const right = tokens(b);
  if (!left.size || !right.size) return { comparable: false as const, reason: 'Both extractions must contain text.' };
  const intersection = [...left].filter(w => right.has(w)).length;
  const numbers = (s: string) => [...new Set(s.match(/\d+(?:[.,]\d+)*/g) || [])].sort();
  const negations = (s: string) => (s.match(/\b(no|not|never|without|non|mai|senza)\b/gi) || []).length;
  return { comparable: true as const, exactMatch: a === b, leftHash: sha256(a), rightHash: sha256(b),
    tokenOverlapPercent: Math.round(intersection / new Set([...left, ...right]).size * 1000) / 10,
    lengths: [a.length, b.length], numbersDiffer: JSON.stringify(numbers(a)) !== JSON.stringify(numbers(b)),
    negationCounts: [negations(a), negations(b)],
    interpretation: 'Diagnostic signal only. Shared upstream ancestry is not independent corroboration. No confidence or KPI is changed.' };
}
