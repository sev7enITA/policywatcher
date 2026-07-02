'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle,
  ClipboardCheck,
  Database,
  FileSearch,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import styles from '../admin.module.css';

type Severity = 'critical' | 'warning' | 'info';
type GateStatus = 'pass' | 'warn' | 'fail';
type SeverityFilter = Severity | 'all';

interface DatasetIssue {
  id: string;
  severity: Severity;
  area: string;
  entityType: 'company' | 'policy' | 'snapshot' | 'change' | 'subscriber' | 'system';
  entityId?: string;
  companyName?: string;
  policyName?: string;
  label: string;
  detail: string;
  action: string;
}

interface GateCheck {
  id: string;
  label: string;
  status: GateStatus;
  passed: number;
  total: number;
  detail: string;
}

interface AreaSummary {
  area: string;
  count: number;
}

interface DatasetQualityData {
  generatedAt: string;
  role: 'admin' | 'auditor';
  summary: {
    status: GateStatus;
    qualityScore: number;
    companies: number;
    policies: number;
    snapshots: number;
    changes: number;
    subscribers: number;
    activeSubscribers: number;
    criticalIssues: number;
    warningIssues: number;
    infoIssues: number;
    returnedIssues: number;
    maxIssuesReturned: number;
    stalePolicies: number;
    hashFailures: number;
    kpiCoveragePct: number;
    regionCoveragePct: number;
    jsonCoveragePct: number;
    latestChangeAt: string | null;
    latestPolicyUpdateAt: string | null;
  };
  checks: GateCheck[];
  areaSummary: AreaSummary[];
  issues: DatasetIssue[];
}

function formatDate(value: string | null): string {
  if (!value) return 'No data';
  return new Date(value).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusBadgeClass(status: GateStatus): string {
  if (status === 'pass') return `${styles.badge} ${styles.badgeSuccess}`;
  if (status === 'warn') return `${styles.badge} ${styles.badgeWarning}`;
  return `${styles.badge} ${styles.badgeError}`;
}

function severityBadgeClass(severity: Severity): string {
  if (severity === 'critical') return `${styles.badge} ${styles.badgeError}`;
  if (severity === 'warning') return `${styles.badge} ${styles.badgeWarning}`;
  return `${styles.badge} ${styles.badgeNeutral}`;
}

function StatusIcon({ status }: { status: GateStatus }) {
  if (status === 'pass') return <CheckCircle size={16} />;
  if (status === 'warn') return <AlertTriangle size={16} />;
  return <XCircle size={16} />;
}

export default function DatasetQualityPage() {
  const router = useRouter();
  const [data, setData] = useState<DatasetQualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [query, setQuery] = useState('');

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/dataset-quality', {
        credentials: 'include',
      });

      if (res.status === 401 || res.status === 403) {
        router.push('/admin/login');
        return;
      }

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const json: DatasetQualityData = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dataset quality data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const areas = useMemo(() => {
    if (!data) return [];
    return [...data.areaSummary].sort((a, b) => a.area.localeCompare(b.area));
  }, [data]);

  const filteredIssues = useMemo(() => {
    if (!data) return [];
    const needle = query.trim().toLowerCase();
    return data.issues.filter((issue) => {
      const matchesSeverity = severityFilter === 'all' || issue.severity === severityFilter;
      const matchesArea = areaFilter === 'all' || issue.area === areaFilter;
      const haystack = [
        issue.area,
        issue.entityType,
        issue.companyName,
        issue.policyName,
        issue.label,
        issue.detail,
        issue.action,
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesQuery = !needle || haystack.includes(needle);
      return matchesSeverity && matchesArea && matchesQuery;
    });
  }, [areaFilter, data, query, severityFilter]);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <div className={`${styles.alert} ${styles.alertWarning}`}>
          <AlertTriangle size={16} />
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary } = data;
  const issueLimitReached = summary.returnedIssues >= summary.maxIssuesReturned;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div className={styles.pageHeaderText}>
          <h1 className={styles.pageTitle} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClipboardCheck size={24} style={{ color: 'var(--primary)' }} />
            Dataset QA
          </h1>
          <p className={styles.pageSubtitle}>
            Dataset integrity, coverage, freshness, and analysis-quality gates
          </p>
        </div>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => void load(true)}
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? styles.spinIcon : ''} />
          Refresh
        </button>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statBox}>
          <div className={styles.statValue}>{summary.qualityScore}</div>
          <div className={styles.statLabel}>Quality Score</div>
          <span className={statusBadgeClass(summary.status)} style={{ marginTop: 8 }}>
            {summary.status}
          </span>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statValue}>{summary.criticalIssues}</div>
          <div className={styles.statLabel}>Critical</div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statValue}>{summary.warningIssues}</div>
          <div className={styles.statLabel}>Warnings</div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statValue}>{summary.kpiCoveragePct}%</div>
          <div className={styles.statLabel}>KPI Coverage</div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statValue}>{summary.regionCoveragePct}%</div>
          <div className={styles.statLabel}>Region Coverage</div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statValue}>{summary.stalePolicies}</div>
          <div className={styles.statLabel}>Stale Policies</div>
        </div>
      </div>

      <div className={`${styles.card} ${styles.qualitySealCard}`}>
        <div className={styles.qualitySealHeader}>
          <div className={styles.qualitySealIcon}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className={styles.cardTitle} style={{ marginBottom: 2 }}>
              Dataset QA Status
            </h2>
            <p className={styles.metaText}>
              The dataset is audited regularly for sources, snapshots, hashes, AI analysis, KPI coverage, and regional impact rows.
            </p>
          </div>
          <span className={statusBadgeClass(summary.status)} style={{ marginLeft: 'auto' }}>
            {summary.status}
          </span>
        </div>

        <div className={styles.sealGrid}>
          <div className={styles.sealItem}>
            <FileSearch size={16} />
            <div>
              <strong>Source Fit</strong>
              <span>Global analysis uses canonical English/global policies; EU/US analysis uses official market-specific sources.</span>
            </div>
          </div>
          <div className={styles.sealItem}>
            <Database size={16} />
            <div>
              <strong>Traceability</strong>
              <span>Every policy should have source URL, current hash, stored snapshots, and versioned changes.</span>
            </div>
          </div>
          <div className={styles.sealItem}>
            <ClipboardCheck size={16} />
            <div>
              <strong>Analysis Coverage</strong>
              <span>Each change should carry structured AI JSON, 15 KPI values, and six region-perspective impacts.</span>
            </div>
          </div>
        </div>

        <div className={`${styles.alert} ${styles.alertInfo}`} style={{ marginTop: 14 }}>
          <AlertTriangle size={15} />
          Treat critical issues as release blockers. Warnings mark dataset drift or source ambiguity that should be resolved before public promotion.
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <Database size={17} />
          Dataset Inventory
        </h2>
        <div className={styles.statusRow}>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Companies</span>
            <span className={styles.statusText}>{summary.companies}</span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Policies</span>
            <span className={styles.statusText}>{summary.policies}</span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Snapshots</span>
            <span className={styles.statusText}>{summary.snapshots}</span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Changes</span>
            <span className={styles.statusText}>{summary.changes}</span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Subscribers</span>
            <span className={styles.statusText}>{summary.activeSubscribers}/{summary.subscribers}</span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Latest Change</span>
            <span className={styles.statusText}>{formatDate(summary.latestChangeAt)}</span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Generated</span>
            <span className={styles.statusText}>{formatDate(data.generatedAt)}</span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <ClipboardCheck size={17} />
          Quality Gates
        </h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Gate</th>
                <th>Status</th>
                <th>Coverage</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {data.checks.map((check) => (
                <tr key={check.id}>
                  <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{check.label}</td>
                  <td>
                    <span className={statusBadgeClass(check.status)}>
                      <StatusIcon status={check.status} />
                      {check.status}
                    </span>
                  </td>
                  <td>{check.passed}/{check.total}</td>
                  <td>{check.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <AlertTriangle size={17} />
          Issues
        </h2>

        {issueLimitReached && (
          <div className={`${styles.alert} ${styles.alertInfo}`} style={{ marginBottom: 14 }}>
            <AlertTriangle size={15} />
            Showing the first {summary.maxIssuesReturned} issues. Fix the highest-severity rows first, then refresh.
          </div>
        )}

        <div className={styles.statusRow} style={{ marginBottom: 14 }}>
          <div className={styles.searchBar} style={{ flex: 1, margin: 0 }}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search issues..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className={styles.input}
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
            style={{ maxWidth: 180 }}
          >
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
          <select
            className={styles.input}
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            style={{ maxWidth: 220 }}
          >
            <option value="all">All areas</option>
            {areas.map((area) => (
              <option key={area.area} value={area.area}>
                {area.area} ({area.count})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Severity</th>
                <th>Area</th>
                <th>Entity</th>
                <th>Finding</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>
                    No issues match the current filters.
                  </td>
                </tr>
              ) : (
                filteredIssues.map((issue) => (
                  <tr key={issue.id}>
                    <td>
                      <span className={severityBadgeClass(issue.severity)}>
                        {issue.severity}
                      </span>
                    </td>
                    <td>{issue.area}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {issue.companyName || issue.entityType}
                      </div>
                      <div className={styles.metaText}>
                        {issue.policyName || issue.entityType}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {issue.label}
                      </div>
                      <div className={styles.metaText}>{issue.detail}</div>
                    </td>
                    <td>{issue.action}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
