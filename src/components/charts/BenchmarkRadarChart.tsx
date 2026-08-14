'use client';

import { useId, useMemo, useState } from 'react';
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
import { selectBenchmarkKpiDrilldown } from '@/lib/visualDrilldown';
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
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const inspectorId = `benchmark-kpi-inspector-${useId().replace(/:/g, '')}`;
  const spec = BENCHMARK_RADAR_CHART_SPEC;
  const data = useMemo(
    () => mergeBenchmarkRadarData(first.radar, second.radar),
    [first.radar, second.radar]
  );
  const comparableData = data.filter((point) => point.valueA !== null && point.valueB !== null);
  const labels = new Map(data.map((point) => [point.key, lang === 'it' ? point.labelIt : point.labelEn]));
  const drilldown = selectBenchmarkKpiDrilldown(data, selectedKey);
  const notAssessed = lang === 'it' ? 'Non valutato' : 'Not assessed';

  const outcomeText = drilldown
    ? drilldown.outcome === 'first-lower'
      ? lang === 'it'
        ? `${first.name} mostra una criticità normalizzata inferiore di ${drilldown.absoluteDifference} punti.`
        : `${first.name} shows ${drilldown.absoluteDifference} points lower normalized concern.`
      : drilldown.outcome === 'second-lower'
        ? lang === 'it'
          ? `${second.name} mostra una criticità normalizzata inferiore di ${drilldown.absoluteDifference} punti.`
          : `${second.name} shows ${drilldown.absoluteDifference} points lower normalized concern.`
        : drilldown.outcome === 'tie'
          ? lang === 'it' ? 'Le valutazioni normalizzate risultano in parità.' : 'The normalized assessments are tied.'
          : lang === 'it'
            ? 'Il confronto non è disponibile perché almeno una valutazione è assente.'
            : 'The comparison is unavailable because at least one assessment is missing.'
    : null;

  return (
    <AccessibleChartFrame
      spec={spec}
      lang={lang}
      summary={summarizeBenchmarkRadarChart(data, first.name, second.name, lang)}
      table={buildAccessibleTable(first, second, lang)}
      visualAriaHidden={false}
    >
      {comparableData.length >= 3 ? (
        <div className={styles.benchmarkChartVisual}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
      <div
        className={styles.benchmarkDrilldownControls}
        role="group"
        aria-label={lang === 'it' ? 'Seleziona KPI da ispezionare' : 'Select KPI to inspect'}
      >
        {data.map((point) => (
          <button
            type="button"
            key={point.key}
            className={styles.benchmarkDrilldownButton}
            aria-pressed={selectedKey === point.key}
            aria-controls={inspectorId}
            onClick={() => setSelectedKey((current) => current === point.key ? null : point.key)}
          >
            {lang === 'it' ? point.labelIt : point.labelEn}
          </button>
        ))}
      </div>
      <div
        id={inspectorId}
        className={styles.chartSelectionInspector}
        role="region"
        aria-live="polite"
        aria-label={lang === 'it' ? 'Dettaglio KPI selezionato' : 'Selected KPI detail'}
      >
        {drilldown ? (
          <>
            <div className={styles.chartSelectionHeading}>
              <span>{lang === 'it' ? drilldown.point.labelIt : drilldown.point.labelEn}</span>
              <button type="button" onClick={() => setSelectedKey(null)}>
                {lang === 'it' ? 'Chiudi dettaglio' : 'Clear detail'}
              </button>
            </div>
            <div className={styles.benchmarkSelectionGrid}>
              <div>
                <strong>{first.name}</strong>
                <span>{drilldown.point.rawValueA}</span>
                <small>{drilldown.point.valueA === null ? notAssessed : `${drilldown.point.valueA}%`}</small>
              </div>
              <div>
                <strong>{second.name}</strong>
                <span>{drilldown.point.rawValueB}</span>
                <small>{drilldown.point.valueB === null ? notAssessed : `${drilldown.point.valueB}%`}</small>
              </div>
            </div>
            <p>{outcomeText}</p>
            <small>
              {lang === 'it'
                ? 'Valori ordinali normalizzati per ispezione: non sono misure di compliance o performance.'
                : 'Ordinal values normalized for inspection: they are not compliance or performance measurements.'}
            </small>
          </>
        ) : (
          <p>
            {lang === 'it'
              ? 'Seleziona un KPI per confrontare valutazione originale, valore normalizzato e limite interpretativo.'
              : 'Select a KPI to compare its original assessment, normalized value and interpretation boundary.'}
          </p>
        )}
      </div>
    </AccessibleChartFrame>
  );
}
