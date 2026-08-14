import { describe, expect, it } from 'vitest';
import type { BenchmarkRadarPoint } from '../chartSpec';
import { selectBenchmarkKpiDrilldown } from '../visualDrilldown';

const points: BenchmarkRadarPoint[] = [
  {
    key: 'retention', labelEn: 'Retention', labelIt: 'Conservazione', value: 20,
    rawValue: 'Short', valueA: 20, valueB: 70, rawValueA: 'Short', rawValueB: 'Extended',
  },
  {
    key: 'sharing', labelEn: 'Third-party sharing', labelIt: 'Condivisione terzi', value: 50,
    rawValue: 'Limited', valueA: 50, valueB: 50, rawValueA: 'Limited', rawValueB: 'Limited',
  },
  {
    key: 'training', labelEn: 'AI training', labelIt: 'Training AI', value: 0,
    rawValue: 'Not assessed', valueA: null, valueB: 80,
    rawValueA: 'Not assessed', rawValueB: 'Broad',
  },
];

describe('evidence-aware benchmark drill-down', () => {
  it('reports the lower-concern side and exact normalized difference', () => {
    const selected = selectBenchmarkKpiDrilldown(points, 'retention');
    expect(selected?.outcome).toBe('first-lower');
    expect(selected?.absoluteDifference).toBe(50);
  });

  it('keeps ties and missing assessments semantically distinct', () => {
    expect(selectBenchmarkKpiDrilldown(points, 'sharing')).toMatchObject({
      outcome: 'tie', absoluteDifference: 0,
    });
    expect(selectBenchmarkKpiDrilldown(points, 'training')).toMatchObject({
      outcome: 'not-comparable', absoluteDifference: null,
    });
  });

  it('fails closed for an unknown or empty selection', () => {
    expect(selectBenchmarkKpiDrilldown(points, 'unknown')).toBeNull();
    expect(selectBenchmarkKpiDrilldown(points, null)).toBeNull();
  });
});
