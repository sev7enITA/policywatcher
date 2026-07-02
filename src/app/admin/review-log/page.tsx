'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ClipboardList,
  Download,
  History,
  RefreshCw,
  Search,
} from 'lucide-react';
import styles from '../admin.module.css';

interface ReviewLogRow {
  id: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string | null;
  targetLabel: string | null;
  oldValue: string | null;
  newValue: string | null;
  note: string | null;
  metadataJson: string | null;
  policyChangeId: string | null;
  createdAt: string;
}

interface ReviewLogResponse {
  role: 'admin' | 'auditor';
  generatedAt: string;
  count: number;
  logs: ReviewLogRow[];
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

function normalizeAction(action: string): string {
  return action.replace(/^dataset_issue_/, '').replace(/_/g, ' ');
}

function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(rows: ReviewLogRow[]) {
  const header = ['createdAt', 'actorRole', 'action', 'targetType', 'targetId', 'targetLabel', 'oldValue', 'newValue', 'note'];
  const csv = [
    header.join(','),
    ...rows.map((row) => header.map((field) => csvEscape(row[field as keyof ReviewLogRow])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `policywatcher-review-log-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export default function ReviewLogPage() {
  const router = useRouter();
  const [data, setData] = useState<ReviewLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/review-log?limit=200', {
        credentials: 'include',
      });

      if (res.status === 401 || res.status === 403) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const json: ReviewLogResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load review log');
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
      row.actorRole,
      row.action,
      row.targetType,
      row.targetId,
      row.targetLabel,
      row.oldValue,
      row.newValue,
      row.note,
      row.metadataJson,
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

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div className={styles.pageHeaderText}>
          <h1 className={styles.pageTitle} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <History size={24} style={{ color: 'var(--primary)' }} />
            Review Log
          </h1>
          <p className={styles.pageSubtitle}>
            Append-only record of human review actions in the admin console.
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
          <div className={styles.statValue}>{filteredLogs.length}</div>
          <div className={styles.statLabel}>Filtered Events</div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statValue}>{data?.role || 'auditor'}</div>
          <div className={styles.statLabel}>Current Role</div>
        </div>
      </div>

      <div className={`${styles.alert} ${styles.alertInfo}`} style={{ marginBottom: 18 }}>
        <ClipboardList size={15} />
        This log records review decisions as new rows. Existing log rows are not edited by later decisions.
      </div>

      <div className={styles.card}>
        <div className={styles.statusRow} style={{ marginBottom: 14 }}>
          <div className={styles.searchBar} style={{ flex: 1, margin: 0 }}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search review events..."
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
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>State</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    No review events match the current filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.createdAt)}</td>
                    <td>
                      <span className={`${styles.badge} ${row.actorRole === 'admin' ? styles.badgePrimary : styles.badgeNeutral}`}>
                        {row.actorRole}
                      </span>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{normalizeAction(row.action)}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {row.targetLabel || row.targetType}
                      </div>
                      <div className={styles.metaText}>{row.targetId || row.targetType}</div>
                    </td>
                    <td>
                      <div className={styles.metaText}>from {row.oldValue || 'none'}</div>
                      <strong style={{ color: 'var(--text-main)' }}>to {row.newValue || 'none'}</strong>
                    </td>
                    <td>{row.note || 'No note recorded.'}</td>
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
