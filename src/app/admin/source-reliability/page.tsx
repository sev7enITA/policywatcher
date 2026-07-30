'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, Archive, CheckCircle2, Database, Eye, EyeOff, Network, Play, RefreshCw, ShieldCheck } from 'lucide-react';
import styles from '../admin.module.css';
import reliabilityStyles from './source-reliability.module.css';

interface ReliabilityData {
  generatedAt: string;
  role: 'admin' | 'auditor';
  inventory: {
    policyRecords: number;
    uniqueRetrievalKeys: number;
    duplicateRetrievalGroups: number;
    publicEvidencePolicies: number;
    withheldPolicies: number;
    historicalReferences: number;
    duplicateGroups: Array<{
      retrievalKey: string;
      records: Array<{ policyId: string; company: string; policy: string; jurisdiction: string; status: string }>;
    }>;
  };
  scanRuns: Array<{
    id: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
    selectedRecords: number;
    uniqueSources: number;
    networkRetrievals: number;
    deduplicatedRetrievals: number;
    uniqueUnavailableSources: number;
    metrics?: { degradedDependencies?: string[] } | null;
  }>;
  remediationIssues: Array<{
    id: string;
    retrievalKey: string;
    sourceUrl: string;
    status: string;
    reasonCode: string | null;
    totalFailures: number;
    consecutiveFailures: number;
    lastDetectedAt: string;
    suggestedAction: string | null;
    affectedPolicies: Array<{ id: string; company: string; policy: string; jurisdiction: string }>;
  }>;
  boundary: string;
}

function badge(status: string): string {
  if (status === 'Recovered' || status === 'completed') return `${styles.badge} ${styles.badgeSuccess}`;
  if (status === 'Open') return `${styles.badge} ${styles.badgeError}`;
  if (status === 'Watching' || status === 'running') return `${styles.badge} ${styles.badgeWarning}`;
  return `${styles.badge} ${styles.badgeNeutral}`;
}

export default function SourceReliabilityPage() {
  const [data, setData] = useState<ReliabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/source-reliability', { credentials: 'include' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to load source reliability data.');
      setData(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load source reliability data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function updateIssue(retrievalKey: string, status: 'Open' | 'Resolved') {
    setPendingKey(retrievalKey);
    try {
      const response = await fetch('/api/admin/source-reliability', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retrievalKey, status }),
      });
      if (!response.ok) throw new Error('Unable to update remediation state.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update remediation state.');
    } finally {
      setPendingKey(null);
    }
  }

  if (loading && !data) {
    return <div className={styles.loadingScreen}><div className={styles.loadingSpinner} />Loading source reliability</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <header className={`${styles.pageHeader} ${reliabilityStyles.pageHeader}`}>
        <div className={styles.pageHeaderText}>
          <h1 className={styles.pageTitle}>Source Reliability</h1>
          <p className={styles.pageSubtitle}>Unique retrievals, public-evidence coverage, historical boundaries and remediation state.</p>
        </div>
        <div className={reliabilityStyles.headerActions}>
          {data?.role === 'admin' && data.inventory.publicEvidencePolicies > 0 && <Link className={`${styles.btn} ${styles.btnPrimary}`} href="/admin/cron"><Play size={16} /> Run source scan</Link>}
          <button className={`${styles.btn} ${styles.btnSecondary}`} type="button" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={16} className={loading ? styles.spinIcon : undefined} /> {loading ? 'Refreshing' : 'Refresh'}
          </button>
        </div>
      </header>

      {error && <div className={`${styles.alert} ${styles.alertWarning}`}><AlertTriangle size={18} />{error}</div>}
      {data && <div className={`${styles.alert} ${styles.alertInfo}`}><ShieldCheck size={18} />{data.boundary}</div>}

      {data && data.inventory.publicEvidencePolicies === 0 && (
        <section className={reliabilityStyles.readinessWarning} aria-labelledby="public-baseline-action-title">
          <AlertTriangle size={22} />
          <div>
            <h2 id="public-baseline-action-title">No policy currently passes the public-evidence baseline gate</h2>
            <p>Review the dry-run repair after deployment, then run a complete source scan. Records without exact verified evidence remain private.</p>
          </div>
          <div className={reliabilityStyles.readinessActions}>
            {data.role === 'admin' && <Link href="/admin/cron" className={`${styles.btn} ${styles.btnPrimary}`}>Open Cron Manager</Link>}
            <Link href="/methodology/confidence" className={`${styles.btn} ${styles.btnSecondary}`}>Evidence method</Link>
          </div>
        </section>
      )}

      {data && (
        <>
          <section className={reliabilityStyles.metricGrid} aria-label="Source inventory summary">
            <article className={reliabilityStyles.metricCard}><Database size={18} /><div><span>Policy records</span><strong>{data.inventory.policyRecords}</strong><small>Configured policy and jurisdiction rows</small></div></article>
            <article className={reliabilityStyles.metricCard}><Network size={18} /><div><span>Unique retrieval keys</span><strong>{data.inventory.uniqueRetrievalKeys}</strong><small>Normalized network acquisitions</small></div></article>
            <article className={`${reliabilityStyles.metricCard} ${data.inventory.publicEvidencePolicies === 0 ? reliabilityStyles.metricWarning : reliabilityStyles.metricPositive}`}><Eye size={18} /><div><span>Public baselines</span><strong>{data.inventory.publicEvidencePolicies}</strong><small>Policies currently eligible for public views</small></div></article>
            <article className={`${reliabilityStyles.metricCard} ${data.inventory.withheldPolicies > 0 ? reliabilityStyles.metricWarning : reliabilityStyles.metricPositive}`}><EyeOff size={18} /><div><span>Withheld policies</span><strong>{data.inventory.withheldPolicies}</strong><small>Records retained outside public routes</small></div></article>
            <article className={reliabilityStyles.metricCard}><Archive size={18} /><div><span>Historical references</span><strong>{data.inventory.historicalReferences}</strong><small>Archive context excluded from change detection</small></div></article>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}><AlertTriangle size={18} /> Remediation queue</h2>
            <p className={reliabilityStyles.tableHint}>Scroll horizontally to inspect every remediation field on smaller screens.</p>
            <div className={`${styles.tableWrap} ${reliabilityStyles.focusableTable}`} role="region" aria-label="Source remediation queue table" tabIndex={0}>
              <table className={styles.table}>
                <caption className={reliabilityStyles.srOnly}>Source remediation issues grouped by retrieval key</caption>
                <thead><tr><th>Status</th><th>Source</th><th>Failure state</th><th>Affected policies</th><th>Action</th></tr></thead>
                <tbody>
                  {data.remediationIssues.map((issue) => (
                    <tr key={issue.id}>
                      <td><span className={badge(issue.status)}>{issue.status}</span></td>
                      <td><strong>{issue.sourceUrl}</strong><div className={styles.metaText}>{issue.retrievalKey}</div></td>
                      <td>{issue.reasonCode || 'unknown'}<div className={styles.metaText}>{issue.consecutiveFailures} consecutive / {issue.totalFailures} total</div></td>
                      <td>{issue.affectedPolicies.map((policy) => `${policy.company} · ${policy.policy} · ${policy.jurisdiction}`).join('; ') || 'Inventory match pending'}</td>
                      <td>
                        <div className={styles.metaText}>{issue.suggestedAction}</div>
                        {data.role === 'admin' && issue.status !== 'Resolved' && (
                          <button className={`${styles.btn} ${styles.btnSecondary}`} disabled={pendingKey === issue.retrievalKey} onClick={() => void updateIssue(issue.retrievalKey, 'Resolved')} type="button">
                            <CheckCircle2 size={15} /> Resolve
                          </button>
                        )}
                        {data.role === 'admin' && issue.status === 'Resolved' && (
                          <button className={`${styles.btn} ${styles.btnSecondary}`} disabled={pendingKey === issue.retrievalKey} onClick={() => void updateIssue(issue.retrievalKey, 'Open')} type="button">
                            Reopen
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {data.remediationIssues.length === 0 && <tr><td colSpan={5}><div className={reliabilityStyles.emptyTableState}><CheckCircle2 size={17} /><div><strong>No remediation issue recorded</strong><span>Issues appear after a retrieval key records a structured failure.</span></div></div></td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}><Activity size={18} /> Recent scan runs</h2>
            <p className={reliabilityStyles.tableHint}>Scan counts distinguish selected policy rows from unique source acquisitions.</p>
            <div className={`${styles.tableWrap} ${reliabilityStyles.focusableTable}`} role="region" aria-label="Recent source scan runs table" tabIndex={0}>
              <table className={styles.table}>
                <caption className={reliabilityStyles.srOnly}>Recent persisted source scan runs</caption>
                <thead><tr><th>Started</th><th>Status</th><th>Records / sources</th><th>Network / deduplicated</th><th>Unavailable / dependencies</th></tr></thead>
                <tbody>
                  {data.scanRuns.map((run) => (
                    <tr key={run.id}>
                      <td>{new Date(run.startedAt).toLocaleString()}</td>
                      <td><span className={badge(run.status)}>{run.status}</span></td>
                      <td>{run.selectedRecords} / {run.uniqueSources}</td>
                      <td>{run.networkRetrievals} / {run.deduplicatedRetrievals}</td>
                      <td>{run.uniqueUnavailableSources}<div className={styles.metaText}>{run.metrics?.degradedDependencies?.join(', ') || 'No degraded dependency recorded'}</div></td>
                    </tr>
                  ))}
                  {data.scanRuns.length === 0 && <tr><td colSpan={5}><div className={reliabilityStyles.emptyTableState}><Activity size={17} /><div><strong>No persisted ScanRun yet</strong><span>{data.role === 'admin' ? 'Run a source scan to establish the first operational baseline.' : 'An administrator must run the first source scan.'}</span></div>{data.role === 'admin' && <Link href="/admin/cron">Open Cron Manager</Link>}</div></td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}><Database size={18} /> Shared acquisition keys</h2>
            <p className={reliabilityStyles.tableHint}>One shared acquisition can feed multiple policy-specific comparisons.</p>
            <div className={`${styles.tableWrap} ${reliabilityStyles.focusableTable}`} role="region" aria-label="Shared acquisition keys table" tabIndex={0}>
              <table className={styles.table}>
                <caption className={reliabilityStyles.srOnly}>Normalized retrieval keys shared by multiple policy records</caption>
                <thead><tr><th>Retrieval key</th><th>Policy records sharing the acquisition</th></tr></thead>
                <tbody>
                  {data.inventory.duplicateGroups.map((group) => (
                    <tr key={group.retrievalKey}>
                      <td>{group.retrievalKey}</td>
                      <td>{group.records.map((record) => `${record.company} · ${record.policy} · ${record.jurisdiction}`).join('; ')}</td>
                    </tr>
                  ))}
                  {data.inventory.duplicateGroups.length === 0 && <tr><td colSpan={2}>Every configured record currently has a distinct acquisition key.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
