'use client';

import React from 'react';
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
import { CHART_TOKENS, getRiskScoreChartColor } from '@/lib/chartTokens';
import styles from './Charts.module.css';

interface RiskProfileBar {
  label: string;
  labelIt: string;
  value: number;
}

interface RiskProfileChartProps {
  data: RiskProfileBar[];
  lang: Lang;
}

const translations = {
  en: {
    title: 'Risk Profile Breakdown',
    value: 'Risk Score',
  },
  it: {
    title: 'Profilo di Rischio',
    value: 'Punteggio di Rischio',
  },
};

function CustomTooltip({
  active,
  payload,
  lang,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: RiskProfileBar }>;
  lang: Lang;
}) {
  const t = translations[lang];
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0];
  const data = item.payload;
  const label = lang === 'it' ? data.labelIt : data.label;
  const color = getRiskScoreChartColor(item.value);

  return (
    <div className={styles.chartTooltip}>
      <div className={styles.tooltipLabel}>{label}</div>
      <div className={styles.tooltipValue}>
        <span
          className={styles.tooltipDot}
          style={{ backgroundColor: color }}
        />
        {t.value}: {item.value}
      </div>
    </div>
  );
}

export default function RiskProfileChart({
  data,
  lang,
}: RiskProfileChartProps) {
  const t = translations[lang];

  if (!data || data.length === 0) {
    return (
      <div className={styles.chartCard}>
        <h4 className={styles.chartTitle}>{t.title}</h4>
        <div
          style={{
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-dark)',
            fontSize: '0.82rem',
          }}
        >
          {lang === 'it' ? 'Dati non disponibili' : 'No data available'}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chartCard}>
      <h4 className={styles.chartTitle}>{t.title}</h4>
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
            barCategoryGap="25%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={CHART_TOKENS.grid}
              vertical={false}
            />
            <XAxis
              dataKey={lang === 'it' ? 'labelIt' : 'label'}
              tick={{ fill: CHART_TOKENS.axis, fontSize: 10 }}
              axisLine={{ stroke: CHART_TOKENS.gridStrong }}
              tickLine={false}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis
              domain={[0, 100]}
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
              dataKey="value"
              radius={[6, 6, 0, 0]}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getRiskScoreChartColor(entry.value)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
