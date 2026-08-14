import type { BenchmarkRadarPoint } from './chartSpec';

export type BenchmarkKpiOutcome = 'first-lower' | 'second-lower' | 'tie' | 'not-comparable';

export interface BenchmarkKpiDrilldown {
  readonly point: BenchmarkRadarPoint;
  readonly outcome: BenchmarkKpiOutcome;
  readonly absoluteDifference: number | null;
}

/** Resolves an exact, typed KPI selection without inferring missing assessments. */
export function selectBenchmarkKpiDrilldown(
  data: readonly BenchmarkRadarPoint[],
  key: string | null,
): BenchmarkKpiDrilldown | null {
  if (!key) return null;
  const point = data.find((candidate) => candidate.key === key);
  if (!point) return null;
  if (point.valueA === null || point.valueB === null) {
    return { point, outcome: 'not-comparable', absoluteDifference: null };
  }
  if (point.valueA === point.valueB) {
    return { point, outcome: 'tie', absoluteDifference: 0 };
  }
  return {
    point,
    outcome: point.valueA < point.valueB ? 'first-lower' : 'second-lower',
    absoluteDifference: Math.abs(point.valueA - point.valueB),
  };
}
