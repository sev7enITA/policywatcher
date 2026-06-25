'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
} from 'recharts';
import type { Lang } from '@/types';
import styles from './Charts.module.css';

interface RiskTrendPoint {
  version: number;
  score: number;
  date: string;
}

interface RiskTrendChartProps {
  data: RiskTrendPoint[];
  lang: Lang;
}

const translations = {
  en: {
    title: 'Risk Score Trend',
    score: 'Score',
    version: 'Version',
    date: 'Date',
  },
  it: {
    title: 'Andamento Punteggio di Rischio',
    score: 'Punteggio',
    version: 'Versione',
    date: 'Data',
  },
};

function CustomTooltip({
  active,
  payload,
  lang,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: RiskTrendPoint }>;
  lang: Lang;
}) {
  const t = translations[lang];
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0];
  const data = point.payload;

  return (
    <div className={styles.chartTooltip}>
      <div className={styles.tooltipLabel}>
        {t.version} {data.version}
      </div>
      <div className={styles.tooltipValue}>
        <span
          className={styles.tooltipDot}
          style={{ backgroundColor: '#6366f1' }}
        />
        {t.score}: {point.value}/10
      </div>
      <div
        className={styles.tooltipValue}
        style={{ fontSize: '0.72rem', marginTop: '2px' }}
      >
        {t.date}: {data.date}
      </div>
    </div>
  );
}

export default function RiskTrendChart({ data, lang }: RiskTrendChartProps) {
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
          <AreaChart
            data={data}
            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="riskTrendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148, 163, 184, 0.25)"
              vertical={false}
            />
            <XAxis
              dataKey="version"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              tickLine={false}
              tickFormatter={(v: number) => `v${v}`}
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              content={<CustomTooltip lang={lang} />}
              cursor={{
                stroke: 'rgba(99, 102, 241, 0.2)',
                strokeWidth: 1,
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#riskTrendGradient)"
              dot={{
                r: 4,
                fill: '#06b6d4',
                stroke: '#ffffff',
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: '#06b6d4',
                stroke: '#6366f1',
                strokeWidth: 2,
              }}
              animationDuration={1200}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
