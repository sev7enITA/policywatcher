'use client';

import React, { useId } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
} from 'recharts';
import type { Lang } from '@/types';
import { CHART_TOKENS } from '@/lib/chartTokens';
import {
  RISK_TREND_CHART_SPEC,
  localizedChartText,
  summarizeRiskTrendChart,
} from '@/lib/chartSpec';
import type { RiskTrendPoint } from '@/lib/riskTrends';
import AccessibleChartFrame, { type AccessibleChartTable } from './AccessibleChartFrame';
import styles from './Charts.module.css';

interface RiskTrendChartProps {
  data: RiskTrendPoint[];
  lang: Lang;
  embedded?: boolean;
}

function formatDate(date: string, lang: Lang): string {
  return new Date(date).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function buildAccessibleTable(data: readonly RiskTrendPoint[], lang: Lang): AccessibleChartTable {
  const copy = RISK_TREND_CHART_SPEC.copy;
  const columns = copy.columns;
  return {
    caption: localizedChartText(copy.title, lang),
    columns: [
      { key: 'observation', label: localizedChartText(columns.observation, lang) },
      { key: 'policy', label: localizedChartText(columns.policy, lang) },
      { key: 'snapshot', label: localizedChartText(columns.snapshot, lang) },
      { key: 'date', label: localizedChartText(columns.date, lang) },
      { key: 'score', label: localizedChartText(columns.score, lang) },
      { key: 'risk', label: localizedChartText(columns.risk, lang) },
    ],
    rows: data.map((point) => ({
      observation: `#${point.sequence}`,
      policy: `${point.companyName} · ${point.policyName}`,
      snapshot: `v${point.snapshotVersion}`,
      date: formatDate(point.date, lang),
      score: `${point.score}/10`,
      risk: point.risk,
    })),
  };
}

function CustomTooltip({
  active,
  payload,
  lang,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: RiskTrendPoint }>;
  lang: Lang;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const copy = RISK_TREND_CHART_SPEC.copy;
  const columns = copy.columns;
  const point = payload[0];
  const data = point.payload;

  return (
    <div className={styles.chartTooltip}>
      <div className={styles.tooltipLabel}>
        {data.companyName} · {data.policyName}
      </div>
      <div className={styles.tooltipValue}>
        <span
          className={styles.tooltipDot}
          style={{ backgroundColor: CHART_TOKENS.primary }}
        />
        {localizedChartText(columns.score, lang)}: {point.value}/10
      </div>
      <div className={styles.tooltipValue} style={{ fontSize: '0.72rem', marginTop: '2px' }}>
        {localizedChartText(columns.observation, lang)} #{data.sequence} ·{' '}
        {localizedChartText(columns.snapshot, lang)} v{data.snapshotVersion}
      </div>
      <div className={styles.tooltipValue} style={{ fontSize: '0.72rem', marginTop: '2px' }}>
        {localizedChartText(columns.date, lang)}: {formatDate(data.date, lang)}
      </div>
    </div>
  );
}

export default function RiskTrendChart({ data, lang, embedded = false }: RiskTrendChartProps) {
  const prefersReducedMotion = useReducedMotion();
  const gradientId = `risk-trend-gradient-${useId().replace(/:/g, '')}`;
  const spec = RISK_TREND_CHART_SPEC;
  const summary = summarizeRiskTrendChart(data || [], lang);
  const table = buildAccessibleTable(data || [], lang);

  return (
    <AccessibleChartFrame
      spec={spec}
      lang={lang}
      summary={summary}
      table={table}
      embedded={embedded}
    >
      {data?.length > 0 ? (
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_TOKENS.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_TOKENS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_TOKENS.grid}
                vertical={false}
              />
              <XAxis
                dataKey={spec.fields.x}
                tick={{ fill: CHART_TOKENS.axis, fontSize: 11 }}
                axisLine={{ stroke: CHART_TOKENS.gridStrong }}
                tickLine={false}
                tickFormatter={(value: number) => `#${value}`}
              />
              <YAxis
                domain={[spec.axes.yDomain[0], spec.axes.yDomain[1]]}
                tick={{ fill: CHART_TOKENS.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                content={<CustomTooltip lang={lang} />}
                cursor={{ stroke: CHART_TOKENS.cursor, strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey={spec.fields.y}
                stroke={CHART_TOKENS.primary}
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                dot={{
                  r: 4,
                  fill: CHART_TOKENS.secondary,
                  stroke: CHART_TOKENS.pointStroke,
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: CHART_TOKENS.secondary,
                  stroke: CHART_TOKENS.primary,
                  strokeWidth: 2,
                }}
                isAnimationActive={!prefersReducedMotion}
                animationDuration={1200}
                animationEasing="ease-in-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : undefined}
    </AccessibleChartFrame>
  );
}
