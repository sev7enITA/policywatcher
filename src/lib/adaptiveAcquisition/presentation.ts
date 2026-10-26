/** A client-safe projection of persisted scan metrics. Never return raw metric values. */
const COUNTERS = [
  'attempted', 'persisted', 'errors', 'budgetSkipped', 'outOfScope', 'noCapture',
  'baselineMismatches', 'acquisitionErrors', 'unmatchedProductionCaptures',
] as const;

export const SHADOW_COMPARISON_OUTCOMES = [
  { key: 'identical', label: 'Same extraction', detail: 'Candidate and frozen baseline returned the same text.' },
  { key: 'extraction_differs', label: 'Different extraction', detail: 'Text differs; a review is needed to judge the difference.' },
  { key: 'candidate_accepts_after_baseline_rejection', label: 'Candidate only accepted', detail: 'The candidate accepted a capture rejected by the frozen baseline.' },
  { key: 'candidate_rejected', label: 'Candidate rejected', detail: 'The frozen baseline accepted the capture; the candidate rejected it.' },
  { key: 'both_rejected', label: 'Both rejected', detail: 'Neither recipe accepted the capture.' },
  { key: 'out_of_scope', label: 'Recipe outside scope', detail: 'This comparison did not meet the recipe scope.' },
] as const;

type Counter = typeof COUNTERS[number];
type Outcome = typeof SHADOW_COMPARISON_OUTCOMES[number]['key'];
export type ShadowEvidenceState = 'unrecorded' | 'invalid' | 'disabled' | 'configuration_error' | 'shadow';
export interface ShadowEvidence {
  state: ShadowEvidenceState;
  counts: Record<Counter, number | null>;
  comparisons: Record<Outcome, number> | null;
  comparisonTotal: number | null;
  partial: boolean;
  summaryWriteFailed: boolean;
}

function record(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function count(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function empty(state: ShadowEvidenceState): ShadowEvidence {
  return {
    state,
    counts: Object.fromEntries(COUNTERS.map((key) => [key, null])) as ShadowEvidence['counts'],
    comparisons: null,
    comparisonTotal: null,
    partial: false,
    summaryWriteFailed: false,
  };
}

/** Missing historical data is unknown, not a disabled observer or zero errors. */
export function presentShadowEvidence(metrics: unknown): ShadowEvidence {
  if (metrics === null || metrics === undefined) return empty('unrecorded');
  if (!record(metrics)) return empty('invalid');
  if (!Object.hasOwn(metrics, 'scrapingShadow')) return empty('unrecorded');
  const raw = metrics.scrapingShadow;
  if (!record(raw)) return empty('invalid');
  const mode = raw.mode;
  if (mode !== 'shadow' && mode !== 'disabled' && mode !== 'configuration_error') return empty('invalid');
  const result = empty(mode);
  for (const key of COUNTERS) {
    if (!Object.hasOwn(raw, key)) continue;
    if (!count(raw[key])) return empty('invalid');
    result.counts[key] = raw[key];
  }
  if (Object.hasOwn(raw, 'summaryWriteFailed')) {
    if (typeof raw.summaryWriteFailed !== 'boolean') return empty('invalid');
    result.summaryWriteFailed = raw.summaryWriteFailed;
  }
  if (Object.hasOwn(raw, 'dispositions')) {
    if (!record(raw.dispositions)) return empty('invalid');
    const keys = SHADOW_COMPARISON_OUTCOMES.map(({ key }) => key);
    if (Object.keys(raw.dispositions).some((key) => !keys.includes(key as Outcome))) return empty('invalid');
    const comparisons = {} as Record<Outcome, number>;
    let total = 0;
    for (const key of keys) {
      const value = Object.hasOwn(raw.dispositions, key) ? raw.dispositions[key] : 0;
      if (!count(value)) return empty('invalid');
      comparisons[key] = value;
      total += value;
      if (!Number.isSafeInteger(total)) return empty('invalid');
    }
    result.comparisons = comparisons;
    result.comparisonTotal = total;
  }

  const { attempted, persisted, errors, noCapture, acquisitionErrors } = result.counts;
  // A configuration error uses errors=1 with attempted=0; it is not an observation failure.
  if (mode === 'shadow') {
    if (attempted !== null) {
      const bounded: Counter[] = ['persisted', 'errors', 'noCapture', 'acquisitionErrors', 'baselineMismatches', 'unmatchedProductionCaptures'];
      if (bounded.some((key) => result.counts[key] !== null && result.counts[key]! > attempted)) return empty('invalid');
      const terminal = [persisted, errors, noCapture, acquisitionErrors];
      if (terminal.every((value) => value !== null)
        && terminal.reduce<number>((sum, value) => sum + (value ?? 0), 0) > attempted) return empty('invalid');
    }
    if (persisted !== null && result.comparisonTotal !== null
      && (result.comparisonTotal < persisted || result.comparisonTotal / 3 > persisted)) return empty('invalid');
    result.partial = COUNTERS.some((key) => result.counts[key] === null) || result.comparisons === null;
  } else if ((attempted !== null && attempted !== 0) || (persisted !== null && persisted !== 0)) {
    return empty('invalid');
  }
  return result;
}
