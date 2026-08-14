'use client';

import React, { useId, type ReactNode } from 'react';
import type { Lang } from '@/types';
import {
  localizedChartText,
  type ChartSpec,
} from '@/lib/chartSpec';
import styles from './Charts.module.css';

export interface AccessibleChartTable {
  caption: string;
  columns: readonly { key: string; label: string }[];
  rows: readonly Record<string, string | number>[];
}

interface AccessibleChartFrameProps {
  spec: ChartSpec;
  lang: Lang;
  summary: string;
  table: AccessibleChartTable;
  embedded?: boolean;
  visualAriaHidden?: boolean;
  children?: ReactNode;
}

export default function AccessibleChartFrame({
  spec,
  lang,
  summary,
  table,
  embedded = false,
  visualAriaHidden = true,
  children,
}: AccessibleChartFrameProps) {
  const reactId = useId().replace(/:/g, '');
  const titleId = `${spec.id}-${reactId}-title`;
  const descriptionId = `${spec.id}-${reactId}-description`;
  const copy = spec.copy;

  return (
    <figure
      className={`${styles.chartCard} ${embedded ? styles.chartFrameEmbedded : ''}`}
      data-chart-spec={spec.id}
      data-chart-renderer={spec.renderer}
      data-chart-source={spec.provenance.sourceId}
      data-evidence-gate={spec.provenance.evidenceGate}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <figcaption className={embedded ? styles.visuallyHidden : styles.chartFrameHeader}>
        <h4 id={titleId} className={styles.chartTitle}>
          {localizedChartText(copy.title, lang)}
        </h4>
        <p id={descriptionId} className={styles.chartDescription}>
          {localizedChartText(copy.description, lang)}
        </p>
      </figcaption>

      <p className={styles.chartTextSummary} aria-live="polite">
        {summary}
      </p>

      {children && (
        <div className={styles.chartVisual} aria-hidden={visualAriaHidden || undefined}>
          {children}
        </div>
      )}

      <details className={styles.chartDataDisclosure}>
        <summary>{localizedChartText(copy.dataTable, lang)}</summary>
        <div className={styles.chartTableScroller}>
          <table className={styles.chartDataTable}>
            <caption className={styles.visuallyHidden}>{table.caption}</caption>
            <thead>
              <tr>
                {table.columns.map((column) => <th key={column.key}>{column.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {table.rows.length === 0 ? (
                <tr>
                  <td colSpan={table.columns.length}>{localizedChartText(copy.noData, lang)}</td>
                </tr>
              ) : table.rows.map((row, index) => (
                <tr key={`${spec.id}-row-${index}`}>
                  {table.columns.map((column) => <td key={column.key}>{row[column.key]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <footer className={styles.chartProvenance}>
        <div>
          <strong>{localizedChartText(copy.source, lang)}:</strong>{' '}
          {localizedChartText(spec.provenance.sourceLabel, lang)} · {spec.provenance.evidenceGate}
        </div>
        <div>
          <strong>{localizedChartText(copy.limitations, lang)}:</strong>
          <ul>
            {spec.provenance.limitationText.map((limitation, index) => (
              <li key={spec.provenance.limitationKeys[index]}>
                {localizedChartText(limitation, lang)}
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </figure>
  );
}
