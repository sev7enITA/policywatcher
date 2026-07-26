'use client';

import { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { Lang } from '@/types';
import {
  BENCHMARK_RADAR_CHART_SPEC,
  localizedChartText,
  mergeBenchmarkRadarData,
  summarizeBenchmarkRadarChart,
  type BenchmarkRadarSourcePoint,
} from '@/lib/chartSpec';
import { CHART_TOKENS } from '@/lib/chartTokens';
import AccessibleChartFrame, { type AccessibleChartTable } from './AccessibleChartFrame';
import styles from './Charts.module.css';

interface BenchmarkProfile {
  name: string;
  radar: BenchmarkRadarSourcePoint[];
}

interface BenchmarkRadarChartProps {
  first: BenchmarkProfile;
  second: BenchmarkProfile;
  lang: Lang;
}

function buildAccessibleTable(
  first: BenchmarkProfile,
  second: BenchmarkProfile,
  lang: Lang
): AccessibleChartTable {
  const copy = BENCHMARK_RADAR_CHART_SPEC.copy;
  const data = mergeBenchmarkRadarData(first.radar, second.radar);
  const notAssessed = lang === 'it' ? 'Non valutato' : 'Not assessed';
  const tie = lang === 'it' ? 'Parità' : 'Tie';

  return {
    caption: localizedChartText(copy.title, lang),
    columns: [
      { key: 'kpi', label: localizedChartText(copy.columns.kpi, lang) },
      { key: 'firstAssessment', label: `${first.name}: ${localizedChartText(copy.columns.firstAssessment, lang)}` },
      { key: 'firstScore', label: localizedChartText(copy.columns.firstScore, lang) },
      { key: 'secondAssessment', label: `${second.name}: ${localizedChartText(copy.columns.secondAssessment, lang)}` },
      { key: 'secondScore', label: localizedChartText(copy.columns.secondScore, lang) },
      { key: 'safer', label: localizedChartText(copy.columns.safer, lang) },
    ],
    rows: data.map((point) => {
      const safer = point.valueA === null || point.valueB === null
        ? notAssessed
        : point.valueA === point.valueB
          ? tie
          : point.valueA < point.valueB ? first.name : second.name;
      return {
        kpi: lang === 'it' ? point.labelIt : point.labelEn,
        firstAssessment: point.rawValueA,
        firstScore: point.valueA === null ? notAssessed : `${point.valueA}%`,
        secondAssessment: point.rawValueB,
        secondScore: point.valueB === null ? notAssessed : `${point.valueB}%`,
        safer,
      };
    }),
  };
}

export default function BenchmarkRadarChart({ first, second, lang }: BenchmarkRadarChartProps) {
  const prefersReducedMotion = useReducedMotion();
  const spec = BENCHMARK_RADAR_CHART_SPEC;
  const data = useMemo(
    () => mergeBenchmarkRadarData(first.radar, second.radar),
    [first.radar, second.radar]
  );
  const comparableData = data.filter((point) => point.valueA !== null && point.valueB !== null);
  const labels = new Map(data.map((point) => [point.key, lang === 'it' ? point.labelIt : point.labelEn]));

  return (
    <AccessibleChartFrame
      spec={spec}
      lang={lang}
      summary={summarizeBenchmarkRadarChart(data, first.name, second.name, lang)}
      table={buildAccessibleTable(first, second, lang)}
    >
      {comparableData.length >= 3 ? (
        <div className={styles.benchmarkChartVisual}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={comparableData} outerRadius="72%">
              <PolarGrid stroke={CHART_TOKENS.gridStrong} />
              <PolarAngleAxis
                dataKey={spec.fields.x}
                tickFormatter={(key: string) => labels.get(key) || key}
                tick={{ fill: CHART_TOKENS.axis, fontSize: 10 }}
              />
              <PolarRadiusAxis
                domain={[spec.axes.yDomain[0], spec.axes.yDomain[1]]}
                tick={{ fill: CHART_TOKENS.axis, fontSize: 9 }}
                angle={90}
              />
              <Radar
                name={first.name}
                dataKey={spec.fields.y}
                stroke={CHART_TOKENS.primary}
                fill={CHART_TOKENS.primary}
                fillOpacity={0.18}
                dot={{ r: 3, fill: CHART_TOKENS.primary }}
                isAnimationActive={!prefersReducedMotion}
              />
              <Radar
                name={second.name}
                dataKey={spec.fields.series}
                stroke={CHART_TOKENS.secondary}
                strokeDasharray="6 4"
                fill={CHART_TOKENS.secondary}
                fillOpacity={0.04}
                dot={{ r: 3, fill: '#ffffff', stroke: CHART_TOKENS.secondary, strokeWidth: 2 }}
                isAnimationActive={!prefersReducedMotion}
              />
              <Legend />
              <Tooltip
                formatter={(value, name) => [`${Number(value).toFixed(0)}%`, String(name)]}
                labelFormatter={(key) => labels.get(String(key)) || String(key)}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : undefined}
    </AccessibleChartFrame>
  );
}
