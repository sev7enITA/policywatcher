'use client';

/**
 * Admin Dashboard Page
 *
 * @file src/app/admin/page.tsx
 *
 * Displays system status, data metrics, risk distribution, and
 * environment variable status. Fetches all data from GET /api/admin/metrics.
 * Session validation is handled by the parent admin layout.
 */

import { useEffect, useState } from 'react';
import {
  Server,
  HardDrive,
  Leaf,
  Clock,
  Building2,
  FileText,
  Archive,
  GitCompare,
  Bell,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Settings,
  Activity,
  BarChart3,
} from 'lucide-react';
import styles from './admin.module.css';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface MetricsData {
  system: {
    nodeVersion: string;
    nodeEnv: string;
    dbPath: string;
    dbExists: boolean;
    dbSizeBytes: number;
    envVars: Record<string, string>;
  };
  data: {
    companies: number;
    policies: number;
    snapshots: number;
    changes: number;
    subscribers: number;
    lastChangeAt: string | null;
    riskDistribution: Record<string, number>;
  };
  timestamp: string;
  role: 'admin' | 'auditor';
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return 'No data yet';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetchMetrics() {
      try {
        const res = await fetch('/api/admin/metrics', {
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error(`Failed to load metrics (HTTP ${res.status})`);
        }

        const data: MetricsData = await res.json();
        if (!cancelled) {
          setMetrics(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load metrics'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchMetrics();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p className={styles.loadingText}>Loading dashboard metrics...</p>
      </div>
    );
  }

  /* ---- Error ---- */
  if (error || !metrics) {
    return (
      <div className={styles.loadingContainer}>
        <AlertTriangle size={32} color="var(--risk-high)" />
        <p className={styles.loadingText}>
          {error || 'Unable to load metrics. Please try again.'}
        </p>
      </div>
    );
  }

  const { system, data } = metrics;
  const envEntries = Object.entries(system.envVars);
  const riskDistribution = data.riskDistribution;

  return (
    <>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <p className={styles.pageSubtitle}>System overview and key metrics</p>
      </div>

      {/* ---- System Status ---- */}
      <h2 className={styles.sectionTitle}>
        <Server size={18} />
        System Status
      </h2>

      <div className={styles.grid4}>
        {/* Node.js Version */}
        <div className={styles.card}>
          <div className={`${styles.cardIcon} ${styles.cardIconPurple}`}>
            <Server size={20} />
          </div>
          <div className={styles.cardLabel}>Node.js Version</div>
          <div className={styles.cardValueSmall}>{system.nodeVersion}</div>
        </div>

        {/* DB Size */}
        <div className={styles.card}>
          <div className={`${styles.cardIcon} ${styles.cardIconCyan}`}>
            <HardDrive size={20} />
          </div>
          <div className={styles.cardLabel}>Database Size</div>
          <div className={styles.cardValue}>
            {formatBytes(system.dbSizeBytes)}
          </div>
        </div>

        {/* Environment */}
        <div className={styles.card}>
          <div className={`${styles.cardIcon} ${styles.cardIconGreen}`}>
            <Leaf size={20} />
          </div>
          <div className={styles.cardLabel}>Environment</div>
          <div className={styles.cardValueSmall}>{system.nodeEnv}</div>
        </div>

        {/* Last Analysis */}
        <div className={styles.card}>
          <div className={`${styles.cardIcon} ${styles.cardIconAmber}`}>
            <Clock size={20} />
          </div>
          <div className={styles.cardLabel}>Last Analysis</div>
          <div className={styles.cardValueSmall}>
            {formatDate(data.lastChangeAt)}
          </div>
        </div>
      </div>

      {/* ---- Data Metrics ---- */}
      <h2 className={styles.sectionTitle}>
        <Activity size={18} />
        Data Metrics
      </h2>

      <div className={styles.grid5}>
        {/* Companies */}
        <div className={styles.card}>
          <div className={`${styles.cardIcon} ${styles.cardIconPurple}`}>
            <Building2 size={20} />
          </div>
          <div className={styles.cardLabel}>Companies</div>
          <div className={styles.cardValue}>
            {data.companies.toLocaleString()}
          </div>
        </div>

        {/* Policies */}
        <div className={styles.card}>
          <div className={`${styles.cardIcon} ${styles.cardIconCyan}`}>
            <FileText size={20} />
          </div>
          <div className={styles.cardLabel}>Policies</div>
          <div className={styles.cardValue}>
            {data.policies.toLocaleString()}
          </div>
        </div>

        {/* Snapshots */}
        <div className={styles.card}>
          <div className={`${styles.cardIcon} ${styles.cardIconGreen}`}>
            <Archive size={20} />
          </div>
          <div className={styles.cardLabel}>Snapshots</div>
          <div className={styles.cardValue}>
            {data.snapshots.toLocaleString()}
          </div>
        </div>

        {/* Changes */}
        <div className={styles.card}>
          <div className={`${styles.cardIcon} ${styles.cardIconAmber}`}>
            <GitCompare size={20} />
          </div>
          <div className={styles.cardLabel}>Changes</div>
          <div className={styles.cardValue}>
            {data.changes.toLocaleString()}
          </div>
        </div>

        {/* Subscribers */}
        <div className={styles.card}>
          <div className={`${styles.cardIcon} ${styles.cardIconRed}`}>
            <Bell size={20} />
          </div>
          <div className={styles.cardLabel}>Subscribers</div>
          <div className={styles.cardValue}>
            {data.subscribers.toLocaleString()}
          </div>
        </div>
      </div>

      {/* ---- Risk Distribution ---- */}
      <h2 className={styles.sectionTitle}>
        <BarChart3 size={18} />
        Risk Distribution
      </h2>

      <div className={styles.riskRow}>
        <div className={`${styles.riskBadge} ${styles.riskBadgeHigh}`}>
          <ShieldAlert size={18} />
          <span>High</span>
          <span className={styles.riskCount}>
            {riskDistribution['high'] ?? 0}
          </span>
        </div>

        <div className={`${styles.riskBadge} ${styles.riskBadgeMedium}`}>
          <AlertTriangle size={18} />
          <span>Medium</span>
          <span className={styles.riskCount}>
            {riskDistribution['medium'] ?? 0}
          </span>
        </div>

        <div className={`${styles.riskBadge} ${styles.riskBadgeLow}`}>
          <CheckCircle2 size={18} />
          <span>Low</span>
          <span className={styles.riskCount}>
            {riskDistribution['low'] ?? 0}
          </span>
        </div>
      </div>

      {/* ---- Environment Variables ---- */}
      <h2 className={styles.sectionTitle}>
        <Settings size={18} />
        Environment Variables
      </h2>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Variable</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {envEntries.map(([name, status]) => {
              const isSet = status === 'SET';
              return (
                <tr key={name}>
                  <td className={styles.envVarName}>{name}</td>
                  <td>
                    <span
                      className={`${styles.statusDot} ${
                        isSet ? styles.statusSet : styles.statusNotSet
                      }`}
                    />
                    <span
                      className={`${styles.statusText} ${
                        isSet ? styles.statusTextSet : styles.statusTextNotSet
                      }`}
                    >
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
