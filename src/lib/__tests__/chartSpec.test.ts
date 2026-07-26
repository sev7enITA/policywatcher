import { describe, expect, it } from 'vitest';
import {
  RISK_TREND_CHART_SPEC,
  RISK_TREND_CHART_SPEC_ISSUES,
  summarizeRiskTrendChart,
  validateChartSpec,
  type ChartSpec,
} from '../chartSpec';
import type { RiskTrendPoint } from '../riskTrends';

const points: RiskTrendPoint[] = [
  {
    date: '2026-07-01T00:00:00.000Z',
    score: 4,
    companyName: 'Example',
    policyName: 'Privacy',
    sequence: 1,
    snapshotVersion: 2,
    risk: 'Medium',
  },
  {
    date: '2026-07-02T00:00:00.000Z',
    score: 7,
    companyName: 'Example',
    policyName: 'Terms',
    sequence: 2,
    snapshotVersion: 5,
    risk: 'High',
  },
];

describe('allowlisted chart specification', () => {
  it('ships a valid, immutable, serializable risk trend spec', () => {
    expect(RISK_TREND_CHART_SPEC_ISSUES).toEqual([]);
    expect(Object.isFrozen(RISK_TREND_CHART_SPEC)).toBe(true);
    expect(JSON.parse(JSON.stringify(RISK_TREND_CHART_SPEC))).toMatchObject({
      id: 'policywatcher.chart.risk-trend.v1',
      renderer: 'recharts-area',
      transform: 'identity',
      provenance: {
        sourceId: 'riskTrends',
        evidenceGate: 'public-change',
      },
    });
  });

  it('rejects executable values and non-allowlisted renderer, field, and gate', () => {
    const invalid = {
      ...RISK_TREND_CHART_SPEC,
      renderer: 'dynamic-module-loader',
      fields: { ...RISK_TREND_CHART_SPEC.fields, y: '__proto__' },
      provenance: {
        ...RISK_TREND_CHART_SPEC.provenance,
        evidenceGate: 'public-policy',
      },
      callback: () => 'execute',
    } as unknown as ChartSpec;

    expect(validateChartSpec(invalid).map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'chart.renderer_not_allowed',
        'chart.field_not_allowed',
        'chart.gate_mismatch',
        'chart.executable_value',
      ])
    );
  });

  it('produces bilingual non-visual summaries with an explicit direction', () => {
    expect(summarizeRiskTrendChart(points, 'en')).toBe(
      '2 public observations across 2 policies. The score moves from 4 to 7 (+3, worsening).'
    );
    expect(summarizeRiskTrendChart(points, 'it')).toBe(
      '2 rilevazioni pubbliche su 2 policy. Il punteggio passa da 4 a 7 (+3, in peggioramento).'
    );
    expect(summarizeRiskTrendChart([], 'it')).toBe(
      'Non sono disponibili rilevazioni storiche pubbliche.'
    );
  });
});
