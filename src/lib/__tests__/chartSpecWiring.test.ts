import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const trend = readFileSync('src/components/charts/RiskTrendChart.tsx', 'utf8');
const profile = readFileSync('src/components/charts/RiskProfileChart.tsx', 'utf8');
const gauge = readFileSync('src/components/charts/ComplianceGauge.tsx', 'utf8');
const heatMap = readFileSync('src/components/charts/RegionHeatMap.tsx', 'utf8');
const benchmark = readFileSync('src/components/charts/BenchmarkRadarChart.tsx', 'utf8');
const compare = readFileSync('src/components/CompareModal.tsx', 'utf8');
const frame = readFileSync('src/components/charts/AccessibleChartFrame.tsx', 'utf8');
const panel = readFileSync('src/components/charts/RiskTrendPanel.tsx', 'utf8');
const policyDetails = readFileSync('src/components/PolicyDetails.tsx', 'utf8');

describe('accessible ChartSpec wiring', () => {
  it('renders the risk trend only through its built-in allowlisted spec', () => {
    expect(trend).toContain('RISK_TREND_CHART_SPEC');
    expect(trend).toContain('dataKey={spec.fields.x}');
    expect(trend).toContain('dataKey={spec.fields.y}');
    expect(trend).toContain('isAnimationActive={!prefersReducedMotion}');
  });

  it('provides textual summary, data table, provenance, and limitations', () => {
    expect(trend).toContain('summarizeRiskTrendChart');
    expect(trend).toContain('buildAccessibleTable');
    expect(frame).toContain('data-chart-spec={spec.id}');
    expect(frame).toContain('<table className={styles.chartDataTable}>');
    expect(frame).toContain('spec.provenance.limitationText.map');
    expect(frame).toContain('data-evidence-gate={spec.provenance.evidenceGate}');
  });

  it('uses the embedded accessible frame inside the existing trend panel', () => {
    expect(panel).toContain('<RiskTrendChart data={points} lang={lang} embedded />');
  });

  it('routes risk profile and gauge through built-in specs and reduced-motion handling', () => {
    expect(profile).toContain('RISK_PROFILE_CHART_SPEC');
    expect(profile).toContain('summarizeRiskProfileChart');
    expect(profile).toContain('dataKey={spec.fields.y}');
    expect(profile).toContain('isAnimationActive={!prefersReducedMotion}');
    expect(gauge).toContain('RISK_GAUGE_CHART_SPEC');
    expect(gauge).toContain('summarizeRiskGaugeChart');
    expect(gauge).toContain('if (prefersReducedMotion)');
    expect(gauge).toContain('risk-gauge-gradient-${reactId}');
  });

  it('replaces the legacy histogram with the two accessible chart surfaces', () => {
    expect(policyDetails).toContain('<RiskProfileChart data={riskProfileData} lang={lang} />');
    expect(policyDetails).toContain('<ComplianceGauge');
    expect(policyDetails).not.toContain('className={styles.histogram}');
  });

  it('routes the regional matrix through its accessible spec without color-only meaning', () => {
    expect(heatMap).toContain('REGION_HEAT_MAP_CHART_SPEC');
    expect(heatMap).toContain('summarizeRegionHeatMap');
    expect(heatMap).toContain('visualAriaHidden={false}');
    expect(heatMap).toContain('styles.heatMapCellMissing');
    expect(heatMap).toContain('buildAccessibleTable');
    expect(heatMap).toContain('chartSelectionInspector');
    expect(heatMap).toContain('aria-controls={selectionPanelId}');
    expect(policyDetails).toContain('onCellSelect={onContextChange}');
  });

  it('routes company benchmarks through keyed radar data and the shared frame', () => {
    expect(benchmark).toContain('BENCHMARK_RADAR_CHART_SPEC');
    expect(benchmark).toContain('mergeBenchmarkRadarData');
    expect(benchmark).toContain('isAnimationActive={!prefersReducedMotion}');
    expect(benchmark).toContain('dataKey={spec.fields.y}');
    expect(benchmark).toContain('dataKey={spec.fields.series}');
    expect(compare).toContain('<BenchmarkRadarChart first={profileA} second={profileB} lang={lang} />');
    expect(compare).not.toContain('<RadarChart');
    expect(benchmark).toContain('selectBenchmarkKpiDrilldown');
    expect(benchmark).toContain('visualAriaHidden={false}');
    expect(benchmark).toContain('minWidth={0} minHeight={0}');
    expect(benchmark).toContain('benchmarkDrilldownControls');
    expect(benchmark).toContain('aria-pressed={selectedKey === point.key}');
    expect(benchmark).toContain('not compliance or performance measurements');
  });
});
