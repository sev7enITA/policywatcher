'use client';

/**
 * Admin Dashboard Page
 *
 * @file src/app/admin/page.tsx
 *
 * Displays system status, visual analytics charts, database metrics,
 * environment variables, and interactive encrypted backup/verification tools.
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Server,
  HardDrive,
  Leaf,
  Clock,
  AlertTriangle,
  Settings,
  Activity,
  BarChart3,
  Download,
  Lock,
  Unlock,
  ShieldCheck,
  FileCheck,
  ClipboardCheck,
  Database,
  Mail,
  MousePointerClick,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
} from 'recharts';
import styles from './admin.module.css';
import { POLICYWATCHER_BUILD_LABEL } from '@/lib/release';
import type { PressMetricCounts } from '@/lib/pressMetrics';

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
    pressNewsroom: {
      available: boolean;
      allTime: PressMetricCounts;
      trailing30Days: PressMetricCounts;
      trailingWindowStartedAt: string;
      boundary: string;
    };
  };
  timestamp: string;
  role: 'admin' | 'auditor';
}

interface DecryptedBackupSummary {
  version: string;
  exportedAt: string;
  summary: {
    companies: number;
    policies: number;
    snapshots: number;
    subscribers: number;
  };
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

  // Encrypted Backup States
  const [exportPassword, setExportPassword] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);

  // Verification States
  const [decryptFile, setDecryptFile] = useState<File | null>(null);
  const [decryptPassword, setDecryptPassword] = useState('');
  const [decryptLoading, setDecryptLoading] = useState(false);
  const [decryptError, setDecryptError] = useState('');
  const [decryptedSummary, setDecryptedSummary] = useState<DecryptedBackupSummary | null>(null);

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
            database?: {
              path?: string | null;
              directoryPath?: string | null;
              directoryExists?: boolean;
              directoryWritable?: boolean;
              fileExists?: boolean;
              fileReadable?: boolean;
              fileWritable?: boolean;
            };
          } | null;
          const databaseHint = payload?.database
            ? ` DB path: ${payload.database.path || 'not available'}; directory: ${payload.database.directoryPath || 'not available'}; directory exists: ${String(payload.database.directoryExists)}; directory writable: ${String(payload.database.directoryWritable)}; file exists: ${String(payload.database.fileExists)}; file readable: ${String(payload.database.fileReadable)}; file writable: ${String(payload.database.fileWritable)}.`
            : '';
          throw new Error(`${payload?.error || `Failed to load metrics (HTTP ${res.status})`}${databaseHint}`);
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

  const handleExportBackup = async () => {
    if (!exportPassword || exportPassword.length < 12) {
      setExportError('Password must be at least 12 characters long.');
      return;
    }

    setExportLoading(true);
    setExportError('');
    setExportSuccess(false);

    try {
      const res = await fetch('/api/admin/export-encrypted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: exportPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Export failed.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `policywatcher-backup-encrypted-${new Date().toISOString().slice(0, 10)}.enc`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setExportPassword('');
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDecryptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDecryptFile(e.target.files[0]);
      setDecryptedSummary(null);
      setDecryptError('');
    }
  };

  const handleVerifyBackup = async () => {
    if (!decryptFile) {
      setDecryptError('Please select an encrypted backup file first.');
      return;
    }
    if (!decryptPassword) {
      setDecryptError('Please enter the password used to encrypt the backup.');
      return;
    }

    setDecryptLoading(true);
    setDecryptError('');
    setDecryptedSummary(null);

    try {
      const fileText = await decryptFile.text();
      const res = await fetch('/api/admin/decrypt-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encryptedString: fileText, password: decryptPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Decryption failed.');
      }

      setDecryptedSummary(data);
      setDecryptPassword('');
    } catch (err) {
      setDecryptError(
        err instanceof Error
          ? err.message
          : 'Decryption failed. Invalid password or corrupted file.'
      );
    } finally {
      setDecryptLoading(false);
    }
  };

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
  const pressNewsroom = data.pressNewsroom;
  const pressMetricsAvailable = pressNewsroom.available !== false;
  const hasPressEvents = (
    pressNewsroom.allTime.pressPackageDownloadIntents.total
    + pressNewsroom.allTime.dataRoomViews.total
    + pressNewsroom.allTime.pressContactIntents.total
    + Object.values(pressNewsroom.allTime.editorialFunnel).reduce((sum, value) => sum + value, 0)
  ) > 0;

  // Chart Data Preparation
  const barChartData = [
    { name: 'Companies', count: data.companies, fill: '#a78bfa' },
    { name: 'Policies', count: data.policies, fill: '#22d3ee' },
    { name: 'Snapshots', count: data.snapshots, fill: '#34d399' },
    { name: 'Changes', count: data.changes, fill: '#fbbf24' },
    { name: 'Subscribers', count: data.subscribers, fill: '#f87171' },
  ];

  const pieChartData = [
    { name: 'High Risk', value: riskDistribution['High'] || riskDistribution['high'] || 0, color: '#f43f5e' },
    { name: 'Medium Risk', value: riskDistribution['Medium'] || riskDistribution['medium'] || 0, color: '#f59e0b' },
    { name: 'Low Risk', value: riskDistribution['Low'] || riskDistribution['low'] || 0, color: '#10b981' },
  ].filter((item) => item.value > 0);

  return (
    <>
      {/* Page Header */}
      <div className={styles.pageHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className={styles.pageTitle} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image
              src="/logo-mark.png"
              alt="PolicyWatcher Logo"
              width={32}
              height={32}
              style={{ objectFit: 'contain' }}
            />
            Dashboard
          </h1>
          <p className={styles.pageSubtitle}>System overview, analytics and secure backups</p>
        </div>
        <span className={styles.logoVersion} style={{ fontSize: '0.78rem', padding: '4px 10px', borderRadius: '8px' }}>
          PolicyWatcher Admin {POLICYWATCHER_BUILD_LABEL}
        </span>
      </div>

      {/* ---- Charts Section ---- */}
      <div className={styles.chartsGrid}>
        {/* Recharts BarChart: Data Overview */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartCardTitle}>Database Inventory</h3>
            <BarChart3 size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <ChartTooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-main)',
                    fontSize: '12px',
                  }}
                  cursor={{ fill: 'var(--bg-tertiary)', opacity: 0.4 }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recharts PieChart: Risk Profile */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartCardTitle}>Policy Risk Profiles</h3>
            <Activity size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className={styles.chartContainer}>
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
        </div>
      </div>

      <h2 className={styles.sectionTitle}>
        <MousePointerClick size={18} />
        Press Newsroom Measurement
      </h2>

      <section className={styles.pressMeasurement} aria-labelledby="press-measurement-title">
        <header className={styles.pressMeasurementHeader}>
          <div>
            <span>Aggregate event counts</span>
            <h3 id="press-measurement-title">Editorial intent and access signals</h3>
          </div>
          <time dateTime={pressNewsroom.trailingWindowStartedAt}>Trailing window starts {formatDate(pressNewsroom.trailingWindowStartedAt)}</time>
        </header>
        <div className={styles.pressMetricGrid}>
          <article className={styles.pressMetricCard}>
            <Download size={18} />
            <div><span>Primary KPI</span><h4>Press package download intents</h4></div>
            <dl><div><dt>All time</dt><dd>{pressNewsroom.allTime.pressPackageDownloadIntents.total}</dd></div><div><dt>30 days</dt><dd>{pressNewsroom.trailing30Days.pressPackageDownloadIntents.total}</dd></div></dl>
            <p>All time by target: EN {pressNewsroom.allTime.pressPackageDownloadIntents.en} · IT {pressNewsroom.allTime.pressPackageDownloadIntents.it}</p>
          </article>
          <article className={styles.pressMetricCard}>
            <BarChart3 size={18} />
            <div><span>Editorial funnel</span><h4>Pulse story and reuse events</h4></div>
            <dl><div><dt>All time</dt><dd>{Object.values(pressNewsroom.allTime.editorialFunnel).reduce((sum, value) => sum + value, 0)}</dd></div><div><dt>30 days</dt><dd>{Object.values(pressNewsroom.trailing30Days.editorialFunnel).reduce((sum, value) => sum + value, 0)}</dd></div></dl>
            <p>All time: views {pressNewsroom.allTime.editorialFunnel.storyViews} · packs {pressNewsroom.allTime.editorialFunnel.storyPackDownloads} · cards {pressNewsroom.allTime.editorialFunnel.socialCardDownloads} · citations {pressNewsroom.allTime.editorialFunnel.citationCopies} · embeds {pressNewsroom.allTime.editorialFunnel.embedCopies} · launch actions {pressNewsroom.allTime.editorialFunnel.launchOutboundActions}</p>
          </article>
          <article className={styles.pressMetricCard}>
            <Database size={18} />
            <div><span>Driver</span><h4>Data Room views</h4></div>
            <dl><div><dt>All time</dt><dd>{pressNewsroom.allTime.dataRoomViews.total}</dd></div><div><dt>30 days</dt><dd>{pressNewsroom.trailing30Days.dataRoomViews.total}</dd></div></dl>
            <p>One event is requested per Data Room component load.</p>
          </article>
          <article className={styles.pressMetricCard}>
            <Mail size={18} />
            <div><span>Driver</span><h4>Press contact intents</h4></div>
            <dl><div><dt>All time</dt><dd>{pressNewsroom.allTime.pressContactIntents.total}</dd></div><div><dt>30 days</dt><dd>{pressNewsroom.trailing30Days.pressContactIntents.total}</dd></div></dl>
            <p>All time: press {pressNewsroom.allTime.pressContactIntents.press} · fact-checking {pressNewsroom.allTime.pressContactIntents.factChecking} · interview {pressNewsroom.allTime.pressContactIntents.interview} · speaking {pressNewsroom.allTime.pressContactIntents.speaking}</p>
          </article>
        </div>
        {!pressMetricsAvailable && <p className={styles.pressMetricZero}>Newsroom measurement is temporarily unavailable. Displayed zeros are placeholders and must not be interpreted as observed activity.</p>}
        {pressMetricsAvailable && !hasPressEvents && <p className={styles.pressMetricZero}>No newsroom events recorded yet. Zero is a valid initial state, not a performance conclusion.</p>}
        <p className={styles.measurementBoundary}><ShieldCheck size={15} />{pressNewsroom.boundary} Event-write failures do not block downloads, navigation or email links.</p>
      </section>

      <div className={`${styles.card} ${styles.qualitySealCard}`}>
        <div className={styles.qualitySealHeader}>
          <div className={styles.qualitySealIcon}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className={styles.cardTitle} style={{ marginBottom: 4 }}>
              Dataset QA Status
            </h2>
            <p className={styles.metaText}>
              Dataset QA checks source-fit, hash integrity, freshness, KPI coverage, regional impact completeness, and subscriber hygiene.
            </p>
          </div>
          <Link href="/admin/dataset-quality" className={`${styles.btn} ${styles.btnPrimary}`} style={{ marginLeft: 'auto' }}>
            <ClipboardCheck size={16} />
            Open Dataset QA
          </Link>
        </div>

        <div className={styles.sealGrid}>
          <div className={styles.sealItem}>
            <FileCheck size={16} />
            <div>
              <strong>Source Fit</strong>
              <span>Global uses canonical English sources; regional analysis uses official market sources.</span>
            </div>
          </div>
          <div className={styles.sealItem}>
            <Lock size={16} />
            <div>
              <strong>Integrity</strong>
              <span>Hashes, version records, and current policy text must reconcile before public evidence statements.</span>
            </div>
          </div>
          <div className={styles.sealItem}>
            <Activity size={16} />
            <div>
              <strong>Coverage</strong>
              <span>Every change should carry structured AI JSON, 15 KPIs, and six regional impact rows.</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`${styles.card} ${styles.qualitySealCard}`}>
        <div className={styles.qualitySealHeader}>
          <div className={styles.qualitySealIcon}>
            <Server size={22} />
          </div>
          <div>
            <h2 className={styles.cardTitle} style={{ marginBottom: 4 }}>
              VPS Service Monitoring
            </h2>
            <p className={styles.metaText}>
              Checks the external renderer service used by the ingestion pipeline for script-rendered policy pages.
            </p>
          </div>
          <Link href="/admin/vps-services" className={`${styles.btn} ${styles.btnPrimary}`} style={{ marginLeft: 'auto' }}>
            <Activity size={16} />
            Open VPS Services
          </Link>
        </div>

        <div className={styles.sealGrid}>
          <div className={styles.sealItem}>
            <Activity size={16} />
            <div>
              <strong>Live Health</strong>
              <span>Reads renderer reachability, latency, active renders, uptime, and public health payload.</span>
            </div>
          </div>
          <div className={styles.sealItem}>
            <ShieldCheck size={16} />
            <div>
              <strong>Configuration Gate</strong>
              <span>Verifies that Hostinger has the renderer URL and bearer secret configured server-side.</span>
            </div>
          </div>
          <div className={styles.sealItem}>
            <FileCheck size={16} />
            <div>
              <strong>Smoke Test</strong>
              <span>Runs an admin-only render check to validate bearer auth and actual DOM retrieval.</span>
            </div>
          </div>
        </div>
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
          <div className={styles.cardLabel}>Last Analysis Check</div>
          <div className={styles.cardValueSmall}>
            {formatDate(data.lastChangeAt)}
          </div>
        </div>
      </div>

      {/* ---- Encrypted Backups Section (NEW) ---- */}
      <h2 className={styles.sectionTitle}>
        <Lock size={18} />
        Backup &amp; Security Tools
      </h2>

      <div className={styles.card} style={{ marginBottom: 24 }}>
        <div className={styles.backupPanel}>
          {/* Encrypted Export */}
          <div className={styles.backupCol}>
            <h3 className={styles.backupColTitle}>
              <Download size={18} style={{ color: 'var(--primary)' }} />
              Secure Encrypted Export
            </h3>
            <p className={styles.backupDescription}>
              Generates an encrypted JSON backup file containing all companies, policies, history snapshots, and subscribers.
              The file is encrypted before download using AES-256-GCM.
            </p>

            {exportError && (
              <div className={`${styles.alert} ${styles.alertWarning}`} style={{ margin: 0 }}>
                <AlertTriangle size={14} />
                {exportError}
              </div>
            )}

            {exportSuccess && (
              <div className={styles.decryptedResult} style={{ margin: 0, padding: 8, background: 'rgba(16, 185, 129, 0.1)', borderColor: 'var(--risk-low)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--risk-low)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={14} />
                  Backup file downloaded successfully!
                </span>
              </div>
            )}

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="export-pw">Encryption Password</label>
              <input
                id="export-pw"
                type="password"
                className={styles.input}
                placeholder="Enter password (min. 12 chars)"
                value={exportPassword}
                onChange={(e) => setExportPassword(e.target.value)}
                disabled={exportLoading}
              />
            </div>

            <button
              onClick={handleExportBackup}
              disabled={exportLoading}
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{ marginTop: 'auto' }}
            >
              <Lock size={16} />
              {exportLoading ? 'Encrypting & Exporting...' : 'Export Encrypted Data'}
            </button>
          </div>

          {/* Local Verification */}
          <div className={styles.backupCol}>
            <h3 className={styles.backupColTitle}>
              <Unlock size={18} style={{ color: 'var(--risk-low)' }} />
              Backup Decryption &amp; Verification
            </h3>
            <p className={styles.backupDescription}>
              Select a PolicyWatcher encrypted backup file (.enc) and enter its password to decrypt and preview its contents. 
              No data will be imported; this acts as a verification utility.
            </p>

            {decryptError && (
              <div className={`${styles.alert} ${styles.alertWarning}`} style={{ margin: 0 }}>
                <AlertTriangle size={14} />
                {decryptError}
              </div>
            )}

            {/* Hidden Input File Zone */}
            <div 
              className={styles.fileInputWrapper}
              onClick={() => document.getElementById('backup-file-input')?.click()}
            >
              <input
                id="backup-file-input"
                type="file"
                accept=".enc"
                onChange={handleDecryptFileChange}
                style={{ display: 'none' }}
              />
              <FileCheck size={28} style={{ margin: '0 auto 8px', color: decryptFile ? 'var(--risk-low)' : 'var(--text-muted)' }} />
              <p className={styles.fileInputText}>
                {decryptFile ? decryptFile.name : 'Select backup file (.enc)'}
              </p>
              <p className={styles.fileInputSubtext}>
                {decryptFile ? `${(decryptFile.size / 1024).toFixed(1)} KB` : 'Click to select from device'}
              </p>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="decrypt-pw">Backup Password</label>
              <input
                id="decrypt-pw"
                type="password"
                className={styles.input}
                placeholder="Enter encryption password"
                value={decryptPassword}
                onChange={(e) => setDecryptPassword(e.target.value)}
                disabled={decryptLoading}
              />
            </div>

            <button
              onClick={handleVerifyBackup}
              disabled={decryptLoading || !decryptFile}
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{ background: 'linear-gradient(135deg, var(--risk-low), #059669)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)', marginTop: 'auto' }}
            >
              <Unlock size={16} />
              {decryptLoading ? 'Decrypting...' : 'Decrypt & Verify Backup'}
            </button>

            {decryptedSummary && (
              <div className={styles.decryptedResult}>
                <h4 className={styles.decryptedTitle}>
                  <ShieldCheck size={16} />
                  Decryption Verified!
                </h4>
                <div className={styles.decryptedStats}>
                  <div className={styles.decryptedStatItem}>
                    <span>Version:</span>
                    <span className={styles.decryptedValue}>{decryptedSummary.version}</span>
                  </div>
                  <div className={styles.decryptedStatItem}>
                    <span>Exported At:</span>
                    <span className={styles.decryptedValue}>
                      {new Date(decryptedSummary.exportedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className={styles.decryptedStatItem}>
                    <span>Companies:</span>
                    <span className={styles.decryptedValue}>{decryptedSummary.summary.companies}</span>
                  </div>
                  <div className={styles.decryptedStatItem}>
                    <span>Policies:</span>
                    <span className={styles.decryptedValue}>{decryptedSummary.summary.policies}</span>
                  </div>
                  <div className={styles.decryptedStatItem}>
                    <span>Snapshots:</span>
                    <span className={styles.decryptedValue}>{decryptedSummary.summary.snapshots}</span>
                  </div>
                  <div className={styles.decryptedStatItem}>
                    <span>Subscribers:</span>
                    <span className={styles.decryptedValue}>{decryptedSummary.summary.subscribers}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
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
