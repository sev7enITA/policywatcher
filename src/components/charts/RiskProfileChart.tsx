'use client';

import React from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import type { Lang } from '@/types';
import {
  RISK_PROFILE_CHART_SPEC,
  localizedChartText,
  summarizeRiskProfileChart,
  type RiskProfilePoint,
} from '@/lib/chartSpec';
import { CHART_TOKENS, getRiskScoreChartColor } from '@/lib/chartTokens';
import AccessibleChartFrame, { type AccessibleChartTable } from './AccessibleChartFrame';
import styles from './Charts.module.css';

interface RiskProfileChartProps {
  data: RiskProfilePoint[];
  lang: Lang;
}

function buildAccessibleTable(
  data: readonly RiskProfilePoint[],
  lang: Lang
): AccessibleChartTable {
  const copy = RISK_PROFILE_CHART_SPEC.copy;
  return {
    caption: localizedChartText(copy.title, lang),
    columns: [
      { key: 'category', label: localizedChartText(copy.columns.category, lang) },
      { key: 'value', label: localizedChartText(copy.columns.value, lang) },
    ],
    rows: data.map((point) => ({
      category: lang === 'it' ? point.labelIt : point.labelEn,
      value: `${point.value}%`,
    })),
  };
}

function CustomTooltip({
  active,
  payload,
  lang,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: RiskProfilePoint }>;
  lang: Lang;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const point = item.payload;
  const label = lang === 'it' ? point.labelIt : point.labelEn;
  const color = getRiskScoreChartColor(item.value);

  return (
    <div className={styles.chartTooltip}>
      <div className={styles.tooltipLabel}>{label}</div>
      <div className={styles.tooltipValue}>
        <span className={styles.tooltipDot} style={{ backgroundColor: color }} />
        {localizedChartText(RISK_PROFILE_CHART_SPEC.copy.columns.value, lang)}: {item.value}%
      </div>
    </div>
  );
}

export default function RiskProfileChart({ data, lang }: RiskProfileChartProps) {
  const prefersReducedMotion = useReducedMotion();
  const spec = RISK_PROFILE_CHART_SPEC;
  const points = data || [];
  const xField = lang === 'it' ? spec.fields.series : spec.fields.x;

  return (
    <AccessibleChartFrame
      spec={spec}
      lang={lang}
      summary={summarizeRiskProfileChart(points, lang)}
      table={buildAccessibleTable(points, lang)}
    >
      {points.length > 0 ? (
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={points}
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              barCategoryGap="25%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_TOKENS.grid}
                vertical={false}
              />
              <XAxis
                dataKey={xField}
                tick={{ fill: CHART_TOKENS.axis, fontSize: 10 }}
                axisLine={{ stroke: CHART_TOKENS.gridStrong }}
                tickLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={50}
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
                cursor={{ fill: CHART_TOKENS.cursorFill }}
              />
              <Bar
                dataKey={spec.fields.y}
                radius={[6, 6, 0, 0]}
                isAnimationActive={!prefersReducedMotion}
                animationDuration={1000}
                animationEasing="ease-out"
              >
                {points.map((entry, index) => (
                  <Cell key={`${entry.labelEn}-${index}`} fill={getRiskScoreChartColor(entry.value)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : undefined}
    </AccessibleChartFrame>
  );
}
