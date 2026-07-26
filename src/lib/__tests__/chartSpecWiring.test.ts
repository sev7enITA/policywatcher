import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const chart = readFileSync('src/components/charts/RiskTrendChart.tsx', 'utf8');
const frame = readFileSync('src/components/charts/AccessibleChartFrame.tsx', 'utf8');
const panel = readFileSync('src/components/charts/RiskTrendPanel.tsx', 'utf8');

describe('accessible ChartSpec wiring', () => {
  it('renders the risk trend only through its built-in allowlisted spec', () => {
    expect(chart).toContain('RISK_TREND_CHART_SPEC');
    expect(chart).toContain('dataKey={spec.fields.x}');
    expect(chart).toContain('dataKey={spec.fields.y}');
    expect(chart).toContain('isAnimationActive={!prefersReducedMotion}');
  });

  it('provides textual summary, data table, provenance, and limitations', () => {
    expect(chart).toContain('summarizeRiskTrendChart');
    expect(chart).toContain('buildAccessibleTable');
    expect(frame).toContain('data-chart-spec={spec.id}');
    expect(frame).toContain('<table className={styles.chartDataTable}>');
    expect(frame).toContain('spec.provenance.limitationText.map');
    expect(frame).toContain('data-evidence-gate={spec.provenance.evidenceGate}');
  });

  it('uses the embedded accessible frame inside the existing trend panel', () => {
    expect(panel).toContain('<RiskTrendChart data={points} lang={lang} embedded />');
  });
});
