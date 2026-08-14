'use client';

import { useEffect, useState } from 'react';
import styles from '../admin.module.css';
import type { AiTelemetrySummary } from '@/lib/aiTelemetry';

type PanelState =
  | { status: 'loading' }
  | { status: 'unavailable'; detail: string }
  | { status: 'ready'; summary: AiTelemetrySummary };

function rate(value: number | null): string {
  return value === null ? 'Baseline pending' : `${value.toFixed(1)}%`;
}

export default function AiTelemetryPanel() {
  const [state, setState] = useState<PanelState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/ai-telemetry', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const body = await response.json() as AiTelemetrySummary & { error?: string; boundary?: string };
        if (!response.ok) throw new Error(body.boundary || body.error || 'Telemetry unavailable');
        setState({ status: 'ready', summary: body });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: 'unavailable', detail: error instanceof Error ? error.message : 'Telemetry unavailable' });
      });
    return () => controller.abort();
  }, []);

  if (state.status === 'loading') {
    return <p style={{ marginTop: 12 }}>Loading privacy-minimized AI telemetry…</p>;
  }
  if (state.status === 'unavailable') {
    return (
      <div className={`${styles.alert} ${styles.alertWarning}`} style={{ marginTop: 12 }}>
        Telemetry unavailable. {state.detail}
      </div>
    );
  }

  const { summary } = state;
  return (
    <div style={{ marginTop: 12 }}>
      <div className={styles.card} style={{ padding: 16 }}>
        <strong>Trailing {summary.windowDays} days</strong>
        <p style={{ marginTop: 8, lineHeight: 1.7 }}>
          {summary.attempts} attempts across {summary.traces} traces. Success {rate(summary.successRate)},
          {' '}fallback {rate(summary.fallbackRate)}, structured-output failures {rate(summary.structuredOutputFailureRate)}.
        </p>
      </div>
      {summary.models.length > 0 ? (
        <table className={styles.table} style={{ marginTop: 12 }}>
          <thead><tr><th className={styles.th}>Model</th><th className={styles.th}>Attempts</th><th className={styles.th}>Success</th><th className={styles.th}>Structured failures</th><th className={styles.th}>Avg latency</th></tr></thead>
          <tbody>
            {summary.models.map((model) => (
              <tr className={styles.trHover} key={model.modelId}>
                <td className={styles.td}>{model.modelId}</td>
                <td className={styles.td}>{model.attempts}</td>
                <td className={styles.td}>{model.successRate.toFixed(1)}%</td>
                <td className={styles.td}>{model.structuredOutputFailures}</td>
                <td className={styles.td}>{model.averageDurationMs} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p style={{ marginTop: 12 }}>Measurement enabled; no invocation has been recorded in the window.</p>}
      <p style={{ marginTop: 12, lineHeight: 1.6, fontSize: '0.9rem' }}>{summary.privacyBoundary}</p>
    </div>
  );
}
