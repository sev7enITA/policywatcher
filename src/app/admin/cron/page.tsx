'use client';

/**
 * Cron Manager Page
 *
 * @file src/app/admin/cron/page.tsx
 *
 * Displays the current cron status (running / idle), allows admins to
 * trigger a full policy scan, and shows the last scan result with a
 * per-policy detail table.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Play,
  Square,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import styles from '../admin.module.css';

/* ---------- Types ---------- */

interface DetailEntry {
  company: string;
  policy: string;
  status: string;
}

interface LastResult {
  checked?: number;
  changed?: number;
  errors?: number;
  unavailable?: number;
  invalid?: number;
  details?: DetailEntry[];
  error?: string;
}

interface CronStatus {
  isRunning: boolean;
  startedAt: string | null;
  lastCompletedAt: string | null;
  lastResult: LastResult | null;
}

/* ---------- Helpers ---------- */

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return 'N/A';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function badgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'changed' || s === 'error' || s === 'invalid') return styles.badgeError;
  if (s === 'unavailable') return styles.badgeWarning;
  if (s === 'unchanged' || s === 'ok') return styles.badgeSuccess;
  return styles.badgeNeutral;
}

/* ---------- Component ---------- */

export default function CronManagerPage() {
  const [status, setStatus] = useState<CronStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Fetch status from the API */
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/cron-status', {
        credentials: 'include',
      });
      if (!res.ok) return;
      const data: CronStatus = await res.json();
      setStatus(data);

      // Stop polling once the scan is no longer running
      if (!data.isRunning && pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    } catch {
      // Silently ignore fetch errors during polling
    }
  }, []);

  /* Initial fetch on mount */
  useEffect(() => {
    let cancelled = false;

    async function init() {
      await fetchStatus();
      if (!cancelled) setLoading(false);
    }

    init();
    return () => {
      cancelled = true;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [fetchStatus]);

  /* Start polling every 5 seconds */
  function startPolling() {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(fetchStatus, 5000);
  }

  /* Trigger a full scan */
  async function handleRunScan() {
    setAlertMsg('');
    setTriggering(true);

    try {
      const res = await fetch('/api/admin/cron-status', {
        method: 'POST',
        credentials: 'include',
      });

      if (res.status === 409) {
        setAlertMsg('A scan is already running. Please wait for it to finish.');
        setTriggering(false);
        return;
      }

      if (!res.ok) {
        setAlertMsg('Failed to start the scan. Please try again.');
        setTriggering(false);
        return;
      }

      // Refresh status and begin polling
      await fetchStatus();
      startPolling();
    } catch {
      setAlertMsg('Unable to reach the server. Please try again later.');
    } finally {
      setTriggering(false);
    }
  }

  /* ---------- Render ---------- */

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  const isRunning = status?.isRunning ?? false;
  const lastResult = status?.lastResult ?? null;
  const details = lastResult?.details ?? [];

  return (
    <div>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Cron Manager</h1>
        <p className={styles.pageSubtitle}>
          Monitor and trigger policy scans
        </p>
      </div>

      {/* Alert */}
      {alertMsg && (
        <div className={`${styles.alert} ${styles.alertWarning}`}>
          <AlertTriangle size={16} />
          {alertMsg}
        </div>
      )}

      {/* Status Card */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <RefreshCw size={16} />
          Scan Status
        </h2>

        <div className={styles.statusRow}>
          {/* Running / Idle */}
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Status</span>
            <span
              className={`${styles.statusDot} ${
                isRunning ? styles.statusDotRunning : styles.statusDotIdle
              }`}
            />
            <span
              className={`${styles.statusText} ${
                isRunning ? styles.statusTextRunning : styles.statusTextIdle
              }`}
            >
              {isRunning ? 'Running' : 'Idle'}
            </span>
          </div>

          {/* Started at */}
          {isRunning && status?.startedAt && (
            <div className={styles.statusItem}>
              <Play size={14} />
              <span className={styles.statusLabel}>Started</span>
              <span>{formatTimestamp(status.startedAt)}</span>
            </div>
          )}

          {/* Last completed */}
          <div className={styles.statusItem}>
            <Clock size={14} />
            <span className={styles.statusLabel}>Last completed</span>
            <span>{formatTimestamp(status?.lastCompletedAt)}</span>
          </div>
        </div>

        {/* Progress indicator while running */}
        {isRunning && (
          <div className={styles.progressBar}>
            <div className={styles.progressIndeterminate} />
          </div>
        )}
      </div>

      {/* Run Full Scan Button */}
      <div style={{ marginBottom: 24, maxWidth: 280 }}>
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={handleRunScan}
          disabled={triggering || isRunning}
        >
          {isRunning ? (
            <>
              <Square size={16} />
              Scan in progress...
            </>
          ) : triggering ? (
            <>
              <RefreshCw size={16} className={styles.spinIcon} />
              Starting scan...
            </>
          ) : (
            <>
              <Play size={16} />
              Run Full Scan
            </>
          )}
        </button>
      </div>

      {/* Last Result */}
      {lastResult && !lastResult.error && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            <CheckCircle size={16} />
            Last Scan Result
          </h2>

          {/* Summary Stats */}
          <div className={styles.statGrid}>
            <div className={styles.statBox}>
              <div className={styles.statValue}>
                {lastResult.checked ?? 0}
              </div>
              <div className={styles.statLabel}>Checked</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statValue}>
                {lastResult.changed ?? 0}
              </div>
              <div className={styles.statLabel}>Changed</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statValue}>
                {lastResult.errors ?? 0}
              </div>
              <div className={styles.statLabel}>Errors</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statValue}>
                {lastResult.unavailable ?? 0}
              </div>
              <div className={styles.statLabel}>Unavailable</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statValue}>
                {lastResult.invalid ?? 0}
              </div>
              <div className={styles.statLabel}>Invalid</div>
            </div>
          </div>

          {/* Details Table */}
          {details.length > 0 && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Policy</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((d, i) => (
                    <tr key={`${d.company}-${d.policy}-${i}`}>
                      <td>{d.company}</td>
                      <td>{d.policy}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${badgeClass(d.status)}`}
                        >
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {details.length === 0 && (
            <p className={styles.emptyState}>
              No per-policy details available for this scan.
            </p>
          )}
        </div>
      )}

      {/* Error result */}
      {lastResult?.error && (
        <div className={`${styles.alert} ${styles.alertWarning}`}>
          <AlertTriangle size={16} />
          Last scan ended with an error: {lastResult.error}
        </div>
      )}

      {/* No results yet */}
      {!lastResult && !isRunning && (
        <div className={styles.card}>
          <p className={styles.emptyState}>
            No scan results yet. Click &quot;Run Full Scan&quot; to start.
          </p>
        </div>
      )}
    </div>
  );
}
