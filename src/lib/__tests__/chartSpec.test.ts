import { describe, expect, it } from 'vitest';
import {
  BUILT_IN_CHART_RENDERERS,
  BUILT_IN_CHART_SPEC_ISSUES,
  BENCHMARK_RADAR_CHART_SPEC,
  REGION_HEAT_MAP_CHART_SPEC,
  RISK_GAUGE_CHART_SPEC,
  RISK_PROFILE_CHART_SPEC,
  RISK_TREND_CHART_SPEC,
  RISK_TREND_CHART_SPEC_ISSUES,
  mergeBenchmarkRadarData,
  summarizeBenchmarkRadarChart,
  summarizeRegionHeatMap,
  summarizeRiskGaugeChart,
  summarizeRiskProfileChart,
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
  it('ships a static built-in renderer registry without dynamic resolution', () => {
    expect(Object.isFrozen(BUILT_IN_CHART_RENDERERS)).toBe(true);
    expect(BUILT_IN_CHART_RENDERERS).toEqual({
      'recharts-area': { id: 'recharts-area', engine: 'recharts', primitive: 'AreaChart' },
      'recharts-bar': { id: 'recharts-bar', engine: 'recharts', primitive: 'BarChart' },
      'recharts-radar': { id: 'recharts-radar', engine: 'recharts', primitive: 'RadarChart' },
      'native-svg-gauge': { id: 'native-svg-gauge', engine: 'native-svg', primitive: 'ArcGauge' },
      'native-css-heatmap': { id: 'native-css-heatmap', engine: 'native-css', primitive: 'RegionGrid' },
    });
    expect(JSON.stringify(BUILT_IN_CHART_RENDERERS)).not.toMatch(/import|require|module/i);
  });

  it('ships five valid, immutable, serializable built-in specs', () => {
    expect(BUILT_IN_CHART_SPEC_ISSUES).toEqual({
      riskTrend: [],
      riskProfile: [],
      riskGauge: [],
      regionHeatMap: [],
      benchmarkRadar: [],
    });
    expect(RISK_TREND_CHART_SPEC_ISSUES).toEqual([]);
    expect([
      RISK_TREND_CHART_SPEC,
      RISK_PROFILE_CHART_SPEC,
      RISK_GAUGE_CHART_SPEC,
      REGION_HEAT_MAP_CHART_SPEC,
      BENCHMARK_RADAR_CHART_SPEC,
    ].every(Object.isFrozen)).toBe(true);
    expect(JSON.parse(JSON.stringify(RISK_TREND_CHART_SPEC))).toMatchObject({
      id: 'policywatcher.chart.risk-trend.v1',
      renderer: 'recharts-area',
      transform: 'identity',
      provenance: {
        sourceId: 'riskTrends',
        evidenceGate: 'public-change',
      },
    });
    expect(RISK_PROFILE_CHART_SPEC).toMatchObject({
      renderer: 'recharts-bar',
      provenance: { sourceId: 'policyDetails', evidenceGate: 'public-change' },
    });
    expect(RISK_GAUGE_CHART_SPEC).toMatchObject({
      renderer: 'native-svg-gauge',
      provenance: { sourceId: 'policyDetails', evidenceGate: 'public-change' },
    });
    expect(REGION_HEAT_MAP_CHART_SPEC).toMatchObject({
      renderer: 'native-css-heatmap',
      provenance: { sourceId: 'policyDetails', evidenceGate: 'public-change' },
    });
    expect(BENCHMARK_RADAR_CHART_SPEC).toMatchObject({
      renderer: 'recharts-radar',
      provenance: { sourceId: 'companyComparison', evidenceGate: 'public-change' },
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

  it('rejects a summary strategy that does not match the compiled renderer', () => {
    const invalid = {
      ...BENCHMARK_RADAR_CHART_SPEC,
      accessibility: {
        ...BENCHMARK_RADAR_CHART_SPEC.accessibility,
        summaryStrategy: 'risk-gauge-score',
      },
    } as ChartSpec;
    expect(validateChartSpec(invalid)).toContainEqual(
      expect.objectContaining({ code: 'chart.summary_renderer_mismatch' })
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

  it('summarizes risk vectors and the current gauge without relying on color', () => {
    const profile = [
      { labelEn: 'Data Privacy', labelIt: 'Privacy Dati', value: 45 },
      { labelEn: 'IP Rights', labelIt: 'Diritti IP', value: 85 },
    ];
    expect(summarizeRiskProfileChart(profile, 'en')).toBe(
      '2 assessed vectors. The highest concern is IP Rights at 85%.'
    );
    expect(summarizeRiskProfileChart(profile, 'it')).toBe(
      '2 vettori valutati. La criticità più alta è Diritti IP al 85%.'
    );
    expect(summarizeRiskGaugeChart(7.25, 'High', 'en')).toBe(
      'The current public risk score is 7.3 out of 10, high risk.'
    );
    expect(summarizeRiskGaugeChart(12, 'High', 'it')).toBe(
      'Il punteggio di rischio pubblico corrente è 10.0 su 10, livello alto.'
    );
  });

  it('summarizes regional coverage and preserves missing cells as unassessed', () => {
    const impacts = [
      {
        id: 'impact-1',
        region: 'EU' as const,
        perspective: 'Individual' as const,
        impactAnalysisEn: 'Material impact.',
        impactAnalysisIt: 'Impatto materiale.',
        riskLevel: 'High' as const,
      },
      {
        id: 'impact-2',
        region: 'US' as const,
        perspective: 'Enterprise' as const,
        impactAnalysisEn: 'Limited impact.',
        impactAnalysisIt: 'Impatto limitato.',
        riskLevel: 'Low' as const,
      },
    ];
    expect(summarizeRegionHeatMap(impacts, 'en')).toBe(
      '2/6 region-perspective combinations assessed; 1 is high risk.'
    );
    expect(summarizeRegionHeatMap([...impacts, { ...impacts[0], id: 'duplicate' }], 'en')).toBe(
      '2/6 region-perspective combinations assessed; 1 is high risk.'
    );
    expect(summarizeRegionHeatMap([], 'it')).toBe(
      'Non sono disponibili impatti regionali valutati.'
    );
  });

  it('joins benchmark dimensions by key and excludes unassessed values from wins', () => {
    const first = [
      { key: 'a', labelEn: 'A', labelIt: 'A', value: 33, rawValue: 'Limited' },
      { key: 'b', labelEn: 'B', labelIt: 'B', value: 0, rawValue: 'Not assessed' },
    ];
    const second = [
      { key: 'b', labelEn: 'B', labelIt: 'B', value: 66, rawValue: 'Moderate' },
      { key: 'a', labelEn: 'A', labelIt: 'A', value: 66, rawValue: 'Moderate' },
    ];
    const merged = mergeBenchmarkRadarData(first, second);
    expect(merged).toMatchObject([
      { key: 'a', valueA: 33, valueB: 66 },
      { key: 'b', valueA: null, valueB: 66 },
    ]);
    expect(summarizeBenchmarkRadarChart(merged, 'Alpha', 'Beta', 'en')).toBe(
      '1 comparable KPI: Alpha has lower concern in 1, Beta in 0, with 0 ties.'
    );
  });
});
