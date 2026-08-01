'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CircleHelp, RefreshCw, Ruler, Sigma } from 'lucide-react';
import type { AdminActionCenterResult } from '@/lib/adminActionCenter';
import {
  buildUnavailableDashboardTelemetry,
  deriveDashboardStateMetrics,
  type AdminDashboardMeasurementStatus,
  type AdminDashboardObservedMetric,
  type AdminDashboardTelemetryAggregate,
} from '@/lib/adminDashboardTelemetry';
import styles from './admin.module.css';

const STATUS_LABELS: Record<AdminDashboardMeasurementStatus, string> = {
  'measurement-enabled': 'Measurement enabled',
  'baseline-pending': 'Baseline pending',
  measured: 'Bounded observation',
  unavailable: 'Unavailable',
};

function formatCheckedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleString('en-GB', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC',
  });
}

function observedValue(metric: AdminDashboardObservedMetric): string {
  if (metric.value === null) return 'Not displayed';
  if (metric.unit === 'milliseconds') return `${(metric.value / 1000).toFixed(1)} s average`;
  if (metric.unit === 'percent') return `${metric.value.toFixed(1)}% confirmed`;
  return `${Math.round(metric.value)} px average`;
}

function EvidenceState({ status }: { status: AdminDashboardMeasurementStatus }) {
  return (
    <span className={styles.measurementState} data-state={status}>
      {status === 'unavailable' ? <AlertTriangle size={14} aria-hidden="true" /> : <CircleHelp size={14} aria-hidden="true" />}
      {STATUS_LABELS[status]}
    </span>
  );
}

function ObservedRow({ definition, metric }: { definition: string; metric: AdminDashboardObservedMetric }) {
  const evidenceWindow = metric.status === 'unavailable' || metric.sample === null || metric.windowDays === null
    ? 'Sample unavailable · window unavailable'
    : `Sample ${metric.sample} · trailing ${metric.windowDays} days`;
  return (
    <li className={styles.measurementRow}>
      <div className={styles.measurementDefinition}>
        <span>Event-derived KPI</span>
        <strong>{definition}</strong>
      </div>
      <EvidenceState status={metric.status} />
      <div className={styles.measurementValue}>
        <strong>{observedValue(metric)}</strong>
        <span>{evidenceWindow}</span>
      </div>
    </li>
  );
}

export function DashboardMeasurement({ actionCenter }: { actionCenter: AdminActionCenterResult }) {
  const [telemetry, setTelemetry] = useState<AdminDashboardTelemetryAggregate | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [announcement, setAnnouncement] = useState('Dashboard measurement is loading.');
  const sectionRef = useRef<HTMLElement | null>(null);
  const stateMetrics = useMemo(() => deriveDashboardStateMetrics(actionCenter), [actionCenter]);

  const load = useCallback(async (focusAfter = false) => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/admin/dashboard-telemetry', { credentials: 'include', cache: 'no-store' });
      const body = await response.json().catch(() => null) as { telemetry?: AdminDashboardTelemetryAggregate } | null;
      const result = body?.telemetry || buildUnavailableDashboardTelemetry();
      setTelemetry(result);
      setAnnouncement(response.ok ? 'Dashboard measurement refreshed.' : 'Dashboard measurement is unavailable.');
    } catch {
      setTelemetry(buildUnavailableDashboardTelemetry());
      setAnnouncement('Dashboard measurement is unavailable.');
    } finally {
      setRefreshing(false);
      if (focusAfter) window.setTimeout(() => sectionRef.current?.focus(), 0);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(false), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const displayed = telemetry || buildUnavailableDashboardTelemetry(actionCenter.checkedAt);
  const severity = stateMetrics.prioritiesBySeverity;

  return (
    <section
      ref={sectionRef}
      className={styles.dashboardMeasurement}
      aria-labelledby="dashboard-measurement-title"
      tabIndex={-1}
    >
      <header className={styles.dashboardMeasurementHeader}>
        <div>
          <span className={styles.measurementEyebrow}>Measurement ledger</span>
          <h2 id="dashboard-measurement-title">Dashboard measurement</h2>
          <p>Initial evidence collection only. No target, improvement or performance conclusion is set in this release.</p>
        </div>
        <button type="button" className={styles.measurementRefresh} onClick={() => void load(true)} disabled={refreshing}>
          <RefreshCw className={refreshing ? styles.measurementSpin : undefined} size={15} aria-hidden="true" />
          {refreshing ? 'Refreshing' : 'Refresh evidence'}
        </button>
      </header>

      <p className={styles.srOnly} role="status" aria-live="polite">{announcement}</p>
      <ol className={styles.measurementLedger}>
        <ObservedRow definition="Elapsed time from dashboard open to the first tagged dashboard action" metric={displayed.firstActionElapsed} />
        <ObservedRow definition="Action Center CTA attempts confirmed at the canonical destination" metric={displayed.confirmedActionCenterRoutes} />
        <li className={styles.measurementRow}>
          <div className={styles.measurementDefinition}><span>Current-state KPI</span><strong>Open operational priorities without a usable timestamp</strong></div>
          <span className={styles.measurementState} data-state="measured"><Sigma size={14} aria-hidden="true" />Checked snapshot</span>
          <div className={styles.measurementValue}><strong>{stateMetrics.prioritiesWithoutTimestamp}</strong><span>Checked {formatCheckedAt(stateMetrics.checkedAt)} UTC</span></div>
        </li>
        <li className={styles.measurementRow}>
          <div className={styles.measurementDefinition}><span>Current-state KPI</span><strong>Open operational priorities by severity</strong></div>
          <span className={styles.measurementState} data-state="measured"><Sigma size={14} aria-hidden="true" />Checked snapshot</span>
          <div className={styles.measurementValue}><strong>C {severity.critical} · H {severity.high} · M {severity.medium} · U {severity.unavailable}</strong><span>Critical · High · Medium · Unavailable</span></div>
        </li>
        <ObservedRow definition="Mobile viewport distance required to reach the first priority" metric={displayed.mobilePriorityDistance} />
      </ol>

      <div className={styles.measurementBoundary}>
        <Ruler size={16} aria-hidden="true" />
        <p>{displayed.privacyBoundary} Event-derived values remain hidden until at least {displayed.minimumSample} eligible visits or attempts exist. Checked {formatCheckedAt(displayed.checkedAt)} UTC.</p>
      </div>
    </section>
  );
}
