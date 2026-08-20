'use client';

/**
 * Admin Dashboard Page
 *
 * @file src/app/admin/page.tsx
 *
 * Displays operational priorities, live module status, publication readiness,
 * analytics and compact links to the responsible protected consoles.
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Server,
  AlertTriangle,
  Settings,
  Activity,
  Download,
  ShieldCheck,
  MousePointerClick,
  Network,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ChartTooltip,
  Legend,
} from 'recharts';
import styles from './admin.module.css';
import { POLICYWATCHER_BUILD_LABEL } from '@/lib/release';
import type { PressMetricCounts } from '@/lib/pressMetrics';
import type { AdminActionCenterResult } from '@/lib/adminActionCenter';
import type { PublicationReadinessResult } from '@/lib/publicationReadiness';
import type { EnvironmentReadinessReport } from '@/lib/databaseReadiness';
import { OperationalActionCenter } from './OperationalActionCenter';
import { PublicationReadinessFunnel } from './PublicationReadinessFunnel';
import { LiveStatusCards } from './LiveStatusCards';
import { DashboardMeasurement } from './DashboardMeasurement';
import { InvestorAccessPanel } from './InvestorAccessPanel';
import {
  getAdminDashboardRolePresentation,
  type AdminConsoleRole,
} from '@/lib/adminRolePresentation';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface MetricsData {
  system: {
    nodeVersion: string;
    nodeEnv: string;
    dbPath: string;
    dbExists: boolean;
    dbDirectoryExists?: boolean;
    dbDirectoryWritable?: boolean;
    dbSizeBytes: number;
    environmentReadiness: EnvironmentReadinessReport;
  };
  data: {
    companies: number;
    policies: number;
    snapshots: number;
    changes: number;
    subscribers: number;
    lastChangeAt: string | null;
    riskDistribution: Record<string, number>;
    sourceReliability: {
      available: boolean;
      uniqueRetrievalKeys: number;
      publicEvidencePolicies: number;
      withheldPolicies: number;
      openRemediationIssues: number;
      lastScanStatus: string | null;
      lastScanAt: string | null;
    };
    pressNewsroom: {
      available: boolean;
      allTime: PressMetricCounts;
      trailing30Days: PressMetricCounts;
      trailingWindowStartedAt: string;
      boundary: string;
    };
  };
  actionCenter: AdminActionCenterResult;
  publicationReadiness: PublicationReadinessResult;
  timestamp: string;
  role: 'admin' | 'auditor';
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Unavailable';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return 'No recorded analysis';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DashboardHeader({ role }: { role: AdminConsoleRole }) {
  const presentation = getAdminDashboardRolePresentation(role);

  return (
    <div className={styles.pageHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <h1
          className={styles.pageTitle}
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          aria-label={`${presentation.title}. ${presentation.roleLabel}`}
        >
          <Image
            src="/logo-mark.png"
            alt="PolicyWatcher Logo"
            width={32}
            height={32}
            style={{ objectFit: 'contain' }}
          />
          {presentation.title}
        </h1>
        <p className={styles.pageSubtitle}>{presentation.subtitle}</p>
      </div>
      <div className={styles.dashboardIdentity}>
        <span className={`${styles.roleBadge} ${role === 'admin' ? styles.roleBadgeAdmin : styles.roleBadgeAuditor}`}>
          {presentation.roleLabel}
        </span>
        <span className={styles.logoVersion} style={{ fontSize: '0.78rem', padding: '4px 10px', borderRadius: '8px' }}>
          PolicyWatcher {POLICYWATCHER_BUILD_LABEL}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [failureActionCenter, setFailureActionCenter] = useState<AdminActionCenterResult | null>(null);
  const [failurePublicationReadiness, setFailurePublicationReadiness] = useState<PublicationReadinessResult | null>(null);
  const [failureRole, setFailureRole] = useState<AdminConsoleRole>('auditor');

  useEffect(() => {
    let cancelled = false;

    async function fetchMetrics() {
      try {
        const res = await fetch('/api/admin/metrics', {
          credentials: 'include',
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => null) as {
            error?: string;
            actionCenter?: AdminActionCenterResult;
            publicationReadiness?: PublicationReadinessResult;
            role?: AdminConsoleRole;
          } | null;
          if (!cancelled && payload?.actionCenter) {
            setFailureActionCenter(payload.actionCenter);
          }
          if (!cancelled && payload?.publicationReadiness) {
            setFailurePublicationReadiness(payload.publicationReadiness);
          }
          if (!cancelled && payload?.role) {
            setFailureRole(payload.role);
          }
          throw new Error(payload?.error || `Failed to load metrics (HTTP ${res.status})`);
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
      <>
        <DashboardHeader role={failureRole} />
        {failureActionCenter ? (
          <>
            <OperationalActionCenter result={failureActionCenter} role={failureRole} state="failed" />
            <LiveStatusCards role={failureRole} />
            {failurePublicationReadiness && <PublicationReadinessFunnel result={failurePublicationReadiness} role={failureRole} />}
          </>
        ) : (
          <div className={styles.loadingContainer} role="alert">
            <AlertTriangle size={32} color="var(--risk-high)" />
            <p className={styles.loadingText}>
              {error || 'Unable to load metrics. Please try again.'}
            </p>
          </div>
        )}
      </>
    );
  }

  const { system, data } = metrics;
  const riskDistribution = data.riskDistribution;
  const pressNewsroom = data.pressNewsroom;
  const pressMetricsAvailable = pressNewsroom.available !== false;
  const allTimeEditorialEvents = Object.values(pressNewsroom.allTime.editorialFunnel).reduce((sum, value) => sum + value, 0);
  const trailingEditorialEvents = Object.values(pressNewsroom.trailing30Days.editorialFunnel).reduce((sum, value) => sum + value, 0);

  const riskProfileData = [
    { name: 'High Risk', value: riskDistribution['High'] || riskDistribution['high'] || 0, color: '#f43f5e' },
    { name: 'Medium Risk', value: riskDistribution['Medium'] || riskDistribution['medium'] || 0, color: '#f59e0b' },
    { name: 'Low Risk', value: riskDistribution['Low'] || riskDistribution['low'] || 0, color: '#10b981' },
  ];
  const pieChartData = riskProfileData.filter((item) => item.value > 0);
  const sourceReliability = data.sourceReliability;

  return (
    <>
      {/* Page Header */}
      <DashboardHeader role={metrics.role} />

      <OperationalActionCenter result={metrics.actionCenter} role={metrics.role} />

      <LiveStatusCards role={metrics.role} />

      {metrics.role === 'admin' ? <InvestorAccessPanel /> : null}

      <section className={styles.reliabilitySummary} aria-labelledby="source-readiness-title">
        <header className={styles.reliabilitySummaryHeader}>
          <div>
            <span>Evidence publication readiness</span>
            <h2 id="source-readiness-title">Source reliability</h2>
            <p>Current public-baseline coverage, acquisition scope and remediation state.</p>
          </div>
          <div className={styles.reliabilitySummaryActions}>
            <Link href="/admin/source-reliability" className={`${styles.btn} ${styles.btnPrimary}`}>{metrics.role === 'auditor' ? 'Verify source evidence' : 'Open reliability'}</Link>
            {metrics.role === 'admin' && <Link href="/admin/cron" className={`${styles.btn} ${styles.btnSecondary}`}>Run source scan</Link>}
          </div>
        </header>
        {sourceReliability.available ? (
          <>
            <div className={styles.reliabilitySummaryGrid}>
              <article><Eye size={17} /><span>Public baselines</span><strong>{sourceReliability.publicEvidencePolicies}</strong></article>
              <article className={sourceReliability.withheldPolicies > 0 ? styles.reliabilitySummaryWarning : undefined}><EyeOff size={17} /><span>Withheld policies</span><strong>{sourceReliability.withheldPolicies}</strong></article>
              <article><Network size={17} /><span>Unique retrieval keys</span><strong>{sourceReliability.uniqueRetrievalKeys}</strong></article>
              <article className={sourceReliability.openRemediationIssues > 0 ? styles.reliabilitySummaryWarning : undefined}><AlertTriangle size={17} /><span>Active source issues</span><strong>{sourceReliability.openRemediationIssues}</strong></article>
            </div>
            <p className={styles.reliabilitySummaryBoundary}>
              Last scan: {sourceReliability.lastScanAt ? `${formatDate(sourceReliability.lastScanAt)} · ${sourceReliability.lastScanStatus}` : 'No persisted ScanRun yet'}.
              {sourceReliability.publicEvidencePolicies === 0 && ' Public surfaces remain empty until exact source-verified baselines pass the evidence gate.'}
            </p>
          </>
        ) : (
          <p className={styles.reliabilitySummaryBoundary}>Source reliability metrics are temporarily unavailable. Core dashboard metrics remain independent.</p>
        )}
      </section>

      {/* ---- Charts Section ---- */}
      <div className={styles.chartsGrid}>
        <PublicationReadinessFunnel result={metrics.publicationReadiness} role={metrics.role} />

        {/* Recharts PieChart: Risk Profile */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartCardTitle}>Policy Risk Profiles</h3>
            <Activity size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className={styles.chartContainer} aria-hidden="true">
            {pieChartData.length === 0 ? (
              <div className={styles.emptyState}>No risk data available yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span style={{ color: 'var(--text-body)', fontSize: '11px' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <details className={styles.riskProfileTableDisclosure} open={pieChartData.length === 0}>
            <summary>Open text table equivalent</summary>
            <div className={styles.riskProfileTableWrap}>
              <table>
                <caption>Policy changes grouped by current overall risk profile</caption>
                <thead><tr><th scope="col">Risk profile</th><th scope="col">Policy changes</th></tr></thead>
                <tbody>
                  {riskProfileData.map((item) => (
                    <tr key={item.name}><th scope="row">{item.name}</th><td>{item.value}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>
        <MousePointerClick size={18} />
        Press Newsroom Measurement
      </h2>

      <section className={styles.compactEvidencePanel} aria-labelledby="press-measurement-title">
        <div className={styles.compactEvidenceLead}>
          <Download size={18} aria-hidden="true" />
          <div>
            <span>Aggregate event counts · {pressMetricsAvailable ? 'Measured' : 'Unavailable'}</span>
            <h3 id="press-measurement-title">Editorial intent and access signals</h3>
            <p>{pressMetricsAvailable ? <>{pressNewsroom.boundary}</> : 'Measurement is temporarily unavailable. No returned zero is interpreted as observed activity.'}</p>
          </div>
        </div>
        <dl className={styles.compactEvidenceMetrics}>
          <div><dt>Package intent · all time</dt><dd>{pressMetricsAvailable ? pressNewsroom.allTime.pressPackageDownloadIntents.total : 'Unavailable'}</dd></div>
          <div><dt>Package intent · 30 days</dt><dd>{pressMetricsAvailable ? pressNewsroom.trailing30Days.pressPackageDownloadIntents.total : 'Unavailable'}</dd></div>
          <div><dt>Pulse story and reuse events · all time</dt><dd>{pressMetricsAvailable ? allTimeEditorialEvents : 'Unavailable'}</dd></div>
          <div><dt>Pulse story and reuse events · 30 days</dt><dd>{pressMetricsAvailable ? trailingEditorialEvents : 'Unavailable'}</dd></div>
        </dl>
        <div className={styles.compactEvidenceAction}>
          <time dateTime={pressNewsroom.trailingWindowStartedAt}>Window starts {formatDate(pressNewsroom.trailingWindowStartedAt)}</time>
          <Link href="/admin/outreach" className={`${styles.btn} ${styles.btnSecondary}`}>{metrics.role === 'auditor' ? 'Verify press signals' : 'Open Press Outreach'}</Link>
        </div>
      </section>

      {/* ---- System Status ---- */}
      <h2 className={styles.sectionTitle}>
        <Server size={18} />
        System Status
      </h2>

      <section className={styles.systemStatusBar} aria-label="System status evidence">
        <Server size={18} aria-hidden="true" />
        <dl>
          <div><dt>Node</dt><dd>{system.nodeVersion || 'Unavailable'}</dd></div>
          <div><dt>Environment</dt><dd>{system.nodeEnv || 'Unavailable'}</dd></div>
          <div><dt>Database size</dt><dd>{system.dbExists ? formatBytes(system.dbSizeBytes) : 'Unavailable'}</dd></div>
          <div><dt>Last analysis</dt><dd>{data.lastChangeAt ? <time dateTime={data.lastChangeAt}>{formatDate(data.lastChangeAt)}</time> : 'No recorded analysis'}</dd></div>
        </dl>
      </section>

      {/* ---- Environment Variables ---- */}
      <h2 className={styles.sectionTitle}>
        <Settings size={18} />
        Environment Readiness
      </h2>

      <section className={styles.environmentSummary} aria-label="Environment configuration presence">
        <ShieldCheck size={18} aria-hidden="true" />
        <div>
          <strong>{system.environmentReadiness.configuredCount} / {system.environmentReadiness.expectedCount} configured</strong>
          <span>Presence only; this does not establish secret validity, service availability or production health.</span>
        </div>
        <Link href="/admin/database#environment-readiness" className={`${styles.btn} ${styles.btnSecondary}`}>View six checks</Link>
      </section>

      <DashboardMeasurement actionCenter={metrics.actionCenter} />
    </>
  );
}
