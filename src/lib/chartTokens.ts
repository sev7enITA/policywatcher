import type { RiskLevel } from '@/types';

/**
 * Semantic chart tokens shared by Recharts and SVG-based visualizations.
 *
 * CSS variables keep the palette themeable while the fallbacks also make the
 * values usable in isolated renders and tests.
 */
export const CHART_TOKENS = {
  primary: 'var(--chart-primary, #6366f1)',
  secondary: 'var(--chart-secondary, #06b6d4)',
  axis: 'var(--chart-axis, #64748b)',
  grid: 'var(--chart-grid, rgba(148, 163, 184, 0.25))',
  gridStrong: 'var(--chart-grid-strong, rgba(148, 163, 184, 0.3))',
  cursor: 'var(--chart-cursor, rgba(99, 102, 241, 0.2))',
  cursorFill: 'var(--chart-cursor-fill, rgba(99, 102, 241, 0.06))',
  pointStroke: 'var(--chart-point-stroke, #ffffff)',
  track: 'var(--chart-track, rgba(148, 163, 184, 0.16))',
  risk: {
    Low: 'var(--risk-low, #10b981)',
    Medium: 'var(--risk-medium, #f59e0b)',
    High: 'var(--risk-high, #ef4444)',
  },
} as const;

export function getRiskChartColor(risk: RiskLevel): string {
  return CHART_TOKENS.risk[risk];
}

/** Maps the 0-100 risk-profile scale to PolicyWatcher's risk thresholds. */
export function getRiskScoreChartColor(value: number): string {
  if (value > 70) return getRiskChartColor('High');
  if (value >= 40) return getRiskChartColor('Medium');
  return getRiskChartColor('Low');
}
