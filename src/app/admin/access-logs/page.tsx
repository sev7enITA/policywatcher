'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Download,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import styles from '../admin.module.css';

interface AccessLogRow {
  id: string;
  event: string;
  username: string | null;
  actorRole: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  path: string | null;
  method: string | null;
  detail: string | null;
  createdAt: string;
}

interface AccessLogResponse {
  role: 'admin';
  generatedAt: string;
  count: number;
  logs: AccessLogRow[];
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function eventLabel(value: string): string {
  return value.replace(/_/g, ' ');
}

function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(rows: AccessLogRow[]) {
  const header = ['createdAt', 'event', 'username', 'actorRole', 'ipAddress', 'method', 'path', 'detail', 'userAgent'];
  const csv = [
    header.join(','),
    ...rows.map((row) => header.map((field) => csvEscape(row[field as keyof AccessLogRow])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `policywatcher-access-log-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export default function AccessLogsPage() {
  const router = useRouter();
  const [data, setData] = useState<AccessLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/access-logs?limit=200', {
        credentials: 'include',
      });

      if (res.status === 401 || res.status === 403) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const json: AccessLogResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load access logs');
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

  const filteredLogs = useMemo(() => {
    if (!data) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return data.logs;
    return data.logs.filter((row) => [
      row.event,
      row.username,
      row.actorRole,
      row.ipAddress,
      row.userAgent,
      row.path,
      row.method,
      row.detail,
    ].filter(Boolean).join(' ').toLowerCase().includes(needle));
  }, [data, query]);

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

  const failedCount = data?.logs.filter((row) => row.event === 'login_failed').length || 0;
  const successCount = data?.logs.filter((row) => row.event === 'login_success').length || 0;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div className={styles.pageHeaderText}>
          <h1 className={styles.pageTitle} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={24} style={{ color: 'var(--primary)' }} />
            Access Log
          </h1>
          <p className={styles.pageSubtitle}>
            Authentication and session events for admin debugging and operational audit.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={() => downloadCsv(filteredLogs)}
            disabled={filteredLogs.length === 0}
          >
            <Download size={16} />
            Export CSV
          </button>
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
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statBox}>
          <div className={styles.statValue}>{data?.count || 0}</div>
          <div className={styles.statLabel}>Returned Events</div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statValue}>{successCount}</div>
          <div className={styles.statLabel}>Successful Logins</div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statValue}>{failedCount}</div>
          <div className={styles.statLabel}>Failed Logins</div>
        </div>
      </div>

      <div className={`${styles.alert} ${styles.alertInfo}`} style={{ marginBottom: 18 }}>
        <ShieldCheck size={15} />
        IP extraction follows the configured proxy-trust policy. If Hostinger overwrites forwarding headers, set TRUST_PROXY_HEADERS=true or a trusted provider header.
      </div>

      <div className={styles.card}>
        <div className={styles.statusRow} style={{ marginBottom: 14 }}>
          <div className={styles.searchBar} style={{ flex: 1, margin: 0 }}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search access events..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Event</th>
                <th>User</th>
                <th>Role</th>
                <th>IP</th>
                <th>Method</th>
                <th>Path</th>
                <th>Detail</th>
                <th>User Agent</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 24 }}>
                    No access events found.
                  </td>
                </tr>
              ) : filteredLogs.map((row) => (
                <tr key={row.id}>
                  <td>{formatDate(row.createdAt)}</td>
                  <td>{eventLabel(row.event)}</td>
                  <td>{row.username || 'n/a'}</td>
                  <td>{row.actorRole || 'n/a'}</td>
                  <td>{row.ipAddress || 'unknown'}</td>
                  <td>{row.method || 'n/a'}</td>
                  <td>{row.path || 'n/a'}</td>
                  <td>{row.detail || 'n/a'}</td>
                  <td style={{ maxWidth: 320, overflowWrap: 'anywhere' }}>{row.userAgent || 'n/a'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
