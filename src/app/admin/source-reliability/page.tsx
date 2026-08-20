'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  Archive,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  FilterX,
  Network,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import styles from '../admin.module.css';
import reliabilityStyles from './source-reliability.module.css';

type IssueStatus = 'Open' | 'Watching' | 'Recovered' | 'Resolved';

interface RemediationIssue {
  id: string;
  retrievalKey: string;
  status: IssueStatus;
  reasonCode: string | null;
  reasonLabel: string;
  sourceHost: string;
  sourcePath: string;
  sourceHref: string | null;
  totalFailures: number;
  consecutiveFailures: number;
  firstDetectedAt: string;
  lastDetectedAt: string;
  recoveredAt: string | null;
  resolvedAt: string | null;
  lastCheckAt: string | null;
  lastSuccessfulCheckAt: string | null;
  suggestedAction: string | null;
  affectedPolicies: Array<{ id: string; company: string; policy: string; jurisdiction: string }>;
}

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
  remediationIssues: RemediationIssue[];
  sourceMigrations: Array<{
    policyId: string;
    company: string;
    policy: string;
    jurisdiction: string;
    requestedAt: string | null;
    canonicalUrl: string;
    acquisitionUrl: string;
  }>;
  remediationSummary: {
    returned: number;
    total: number;
    limit: number;
    counts: { open: number; watching: number; recovered: number; resolved: number };
    boundary: string;
  };
  nextAction: {
    issueId: string;
    status: IssueStatus;
    sourceHost: string;
    label: string;
    guidance: string;
  } | null;
  boundary: string;
}

const WORKFLOW_STEPS = ['Detect', 'Verify', 'Repair', 'Rescan', 'Close'];

function badge(status: string): string {
  if (status === 'Recovered' || status === 'completed') return `${styles.badge} ${styles.badgeSuccess}`;
  if (status === 'Open') return `${styles.badge} ${styles.badgeError}`;
  if (status === 'Watching' || status === 'running') return `${styles.badge} ${styles.badgeWarning}`;
  return `${styles.badge} ${styles.badgeNeutral}`;
}

function formatDate(value: string | null): string {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function WorkflowRail({ status }: { status: IssueStatus }) {
  const current = status === 'Recovered' ? 4 : status === 'Resolved' ? 5 : status === 'Open' ? 2 : 1;
  return (
    <ol className={reliabilityStyles.workflowRail} aria-label={`Remediation workflow, ${status} state`}>
      {WORKFLOW_STEPS.map((step, index) => {
        const complete = index < current;
        const active = index === current && current < WORKFLOW_STEPS.length;
        return (
          <li key={step} className={complete ? reliabilityStyles.workflowComplete : active ? reliabilityStyles.workflowActive : undefined}>
            <span aria-hidden="true">{complete ? <Check size={13} /> : active ? <ChevronRight size={13} /> : <Circle size={10} />}</span>
            <strong>{step}</strong>
          </li>
        );
      })}
    </ol>
  );
}

function IssueEvidence({ issue }: { issue: RemediationIssue }) {
  return (
    <div className={reliabilityStyles.evidenceBody}>
      <WorkflowRail status={issue.status} />
      <dl className={reliabilityStyles.evidenceGrid}>
        <div><dt>Sanitized source</dt><dd>{issue.sourceHost}<span>{issue.sourcePath}</span></dd></div>
        <div><dt>Reason</dt><dd>{issue.reasonLabel}<span>{issue.reasonCode || 'not_recorded'}</span></dd></div>
        <div><dt>Detected</dt><dd>{formatDate(issue.firstDetectedAt)}<span>Latest: {formatDate(issue.lastDetectedAt)}</span></dd></div>
        <div><dt>Recovery</dt><dd>{formatDate(issue.recoveredAt)}<span>Closed: {formatDate(issue.resolvedAt)}</span></dd></div>
        <div><dt>Failure history</dt><dd>{issue.consecutiveFailures} consecutive<span>{issue.totalFailures} total</span></dd></div>
        <div><dt>Acquisition checks</dt><dd>{formatDate(issue.lastCheckAt)}<span>Last successful: {formatDate(issue.lastSuccessfulCheckAt)}</span></dd></div>
      </dl>
      <div className={reliabilityStyles.suggestedAction}>
        <Wrench size={16} />
        <div><strong>Suggested action</strong><p>{issue.suggestedAction || 'Review the bounded evidence and run a fresh source scan.'}</p></div>
      </div>
      <div className={reliabilityStyles.affectedPolicies}>
        <strong>Affected policy records · {issue.affectedPolicies.length}</strong>
        {issue.affectedPolicies.length > 0 ? (
          <ul>{issue.affectedPolicies.map((policy) => <li key={policy.id}>{policy.company} · {policy.policy}<span>{policy.jurisdiction}</span></li>)}</ul>
        ) : <p>Inventory match pending.</p>}
      </div>
    </div>
  );
}

export default function SourceReliabilityPage() {
  const [data, setData] = useState<ReliabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');

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

  const reasons = useMemo(() => [...new Set((data?.remediationIssues || []).map((issue) => issue.reasonCode || 'not_recorded'))].sort(), [data]);
  const filtersActive = Boolean(search.trim()) || statusFilter !== 'all' || reasonFilter !== 'all';
  const visibleIssues = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (data?.remediationIssues || []).filter((issue) => {
      const searchable = [
        issue.sourceHost,
        issue.sourcePath,
        issue.retrievalKey,
        issue.status,
        issue.reasonCode || '',
        issue.reasonLabel,
        ...issue.affectedPolicies.flatMap((policy) => [policy.company, policy.policy]),
      ].join(' ').toLowerCase();
      return (!query || searchable.includes(query))
        && (statusFilter === 'all' || issue.status === statusFilter)
        && (reasonFilter === 'all' || (issue.reasonCode || 'not_recorded') === reasonFilter);
    });
  }, [data, reasonFilter, search, statusFilter]);

  function clearFilters() {
    setSearch('');
    setStatusFilter('all');
    setReasonFilter('all');
  }

  function focusIssue(issueId: string) {
    const compact = window.matchMedia('(max-width: 760px)').matches;
    const target = document.getElementById(`${compact ? 'mobile' : 'ledger'}-issue-${issueId}`);
    target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    target?.focus({ preventScroll: true });
  }

  async function updateIssue(issueId: string, status: 'Open' | 'Resolved') {
    const verb = status === 'Resolved' ? 'close this recovered issue' : 'reopen this resolved issue';
    if (!window.confirm(`Confirm that you want to ${verb}.`)) return;
    setPendingKey(issueId);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/admin/source-reliability', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId, status }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to update remediation state.');
      setNotice(status === 'Resolved' ? 'Recovered issue closed.' : 'Resolved issue reopened for investigation.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update remediation state.');
    } finally {
      setPendingKey(null);
    }
  }

  if (loading && !data) {
    return <div className={styles.loadingScreen}><div className={styles.loadingSpinner} />Loading source reliability workbench</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <header className={`${styles.pageHeader} ${reliabilityStyles.pageHeader}`}>
        <div className={styles.pageHeaderText}>
          <span className={reliabilityStyles.eyebrow}>Evidence operations</span>
          <h1 className={styles.pageTitle}>Source Remediation Workbench</h1>
          <p className={styles.pageSubtitle}>Prioritize acquisition failures, inspect bounded evidence and close only recovered issues.</p>
        </div>
        <div className={reliabilityStyles.headerActions}>
          {data?.role === 'admin' && data.inventory.publicEvidencePolicies > 0 && <Link className={`${styles.btn} ${styles.btnPrimary}`} href="/admin/cron"><Play size={16} /> Run source scan</Link>}
          <button className={`${styles.btn} ${styles.btnSecondary}`} type="button" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={16} className={loading ? styles.spinIcon : undefined} /> {loading ? 'Refreshing' : 'Refresh'}
          </button>
        </div>
      </header>

      <div aria-live="polite" aria-atomic="true">
        {error && <div className={`${styles.alert} ${styles.alertWarning}`}><AlertTriangle size={18} />{error}</div>}
        {notice && <div className={`${styles.alert} ${styles.alertInfo}`}><CheckCircle2 size={18} />{notice}</div>}
      </div>
      {data && <div className={`${styles.alert} ${styles.alertInfo}`}><ShieldCheck size={18} />{data.boundary}</div>}

      {data && (
        <>
          {data.sourceMigrations.length > 0 && (
            <section className={reliabilityStyles.migrationPanel} aria-labelledby="source-migration-title">
              <div className={reliabilityStyles.migrationPanelIntro}>
                <RefreshCw size={20} />
                <div>
                  <span>Controlled source migrations</span>
                  <h2 id="source-migration-title">{data.sourceMigrations.length} baseline{data.sourceMigrations.length === 1 ? '' : 's'} queued</h2>
                  <p>The next verified capture becomes the comparison baseline. Provider-change notifications stay suppressed during this transition.</p>
                </div>
              </div>
              <ul>
                {data.sourceMigrations.map((migration) => (
                  <li key={migration.policyId}>
                    <span><strong>{migration.company} · {migration.policy}</strong><small>{migration.jurisdiction} · queued {formatDate(migration.requestedAt)}</small></span>
                    <a href={migration.acquisitionUrl} target="_blank" rel="noopener noreferrer">Inspect endpoint <ExternalLink size={13} /></a>
                  </li>
                ))}
              </ul>
              <div className={reliabilityStyles.migrationActions}>
                <Link href="/admin/companies" className={`${styles.btn} ${styles.btnSecondary}`}>Review source configuration</Link>
                {data.role === 'admin' && <Link href="/admin/cron" className={`${styles.btn} ${styles.btnPrimary}`}>Run verification scan</Link>}
              </div>
            </section>
          )}
          <section className={reliabilityStyles.priorityStrip} aria-labelledby="returned-window-title">
            <div className={reliabilityStyles.priorityIntro}>
              <span>Returned window</span>
              <strong id="returned-window-title">{data.remediationSummary.returned} of {data.remediationSummary.total}</strong>
            </div>
            <div><span className={reliabilityStyles.statusDotError} />Open<strong>{data.remediationSummary.counts.open}</strong></div>
            <div><span className={reliabilityStyles.statusDotWarning} />Watching<strong>{data.remediationSummary.counts.watching}</strong></div>
            <div><span className={reliabilityStyles.statusDotSuccess} />Recovered<strong>{data.remediationSummary.counts.recovered}</strong></div>
            <div><span className={reliabilityStyles.statusDotNeutral} />Resolved<strong>{data.remediationSummary.counts.resolved}</strong></div>
            <p>{data.remediationSummary.boundary} Maximum {data.remediationSummary.limit} records.</p>
          </section>

          <section className={reliabilityStyles.nextActionPanel} aria-labelledby="next-action-title">
            <div className={reliabilityStyles.nextActionIcon}><Wrench size={20} /></div>
            {data.nextAction ? (
              <>
                <div>
                  <span>Deterministic next action · {data.nextAction.status}</span>
                  <h2 id="next-action-title">{data.nextAction.label}</h2>
                  <p><strong>{data.nextAction.sourceHost}</strong> - {data.nextAction.guidance}</p>
                </div>
                <button className={`${styles.btn} ${styles.btnPrimary}`} type="button" onClick={() => focusIssue(data.nextAction!.issueId)}>Review evidence</button>
              </>
            ) : (
              <div><span>Deterministic next action</span><h2 id="next-action-title">No actionable issue in the returned window</h2><p>This describes the returned queue only; it is not a claim that every source is healthy.</p></div>
            )}
          </section>

          {data.role === 'auditor' && (
            <div className={reliabilityStyles.readOnlyNote}><ShieldCheck size={18} /><p><strong>Auditor view is read-only.</strong> You can inspect evidence and workflow state. Only administrators can close or reopen issues.</p></div>
          )}

          <section className={reliabilityStyles.workbench} aria-labelledby="remediation-ledger-title" role="region" tabIndex={0}>
            <div className={reliabilityStyles.sectionHeading}>
              <div><span>Priority queue</span><h2 id="remediation-ledger-title">Remediation evidence ledger</h2></div>
              <strong aria-live="polite">{visibleIssues.length} result{visibleIssues.length === 1 ? '' : 's'}</strong>
            </div>
            <div className={reliabilityStyles.filterBar}>
              <label className={reliabilityStyles.searchField}><span>Search issues</span><div><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Host, key, company or policy" /></div></label>
              <label><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option>Open</option><option>Watching</option><option>Recovered</option><option>Resolved</option></select></label>
              <label><span>Reason</span><select value={reasonFilter} onChange={(event) => setReasonFilter(event.target.value)}><option value="all">All reasons</option>{reasons.map((reason) => <option value={reason} key={reason}>{reason === 'not_recorded' ? 'Not recorded' : reason.replaceAll('_', ' ')}</option>)}</select></label>
              <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={clearFilters} disabled={!filtersActive}><FilterX size={16} /> Clear filters</button>
            </div>

            {data.remediationIssues.length === 0 ? (
              <div className={reliabilityStyles.emptyState}><CheckCircle2 size={22} /><div><h3>No remediation data recorded</h3><p>Issues appear after a retrieval key records a structured failure. This is a data-availability state, not a source-health claim.</p></div></div>
            ) : visibleIssues.length === 0 ? (
              <div className={reliabilityStyles.emptyState}><Search size={22} /><div><h3>No filter matches</h3><p>Try a different host, company, status or reason.</p></div><button type="button" onClick={clearFilters} className={`${styles.btn} ${styles.btnSecondary}`}>Reset search</button></div>
            ) : (
              <>
                <div className={reliabilityStyles.desktopLedger}>
                  <table>
                    <caption className={reliabilityStyles.srOnly}>Actionable source remediation issues, ordered by state and recency</caption>
                    <thead><tr><th>State</th><th>Source and evidence</th><th>Failure</th><th>Policies</th><th>Responsible action</th></tr></thead>
                    <tbody>
                      {visibleIssues.map((issue) => (
                        <tr key={issue.id} id={`ledger-issue-${issue.id}`} tabIndex={-1}>
                          <td><span className={badge(issue.status)}>{issue.status}</span><small>{formatDate(issue.lastDetectedAt)}</small></td>
                          <td>
                            <div className={reliabilityStyles.sourceIdentity}><strong>{issue.sourceHost}</strong><span>{issue.sourcePath}</span>{issue.sourceHref && <a href={issue.sourceHref} target="_blank" rel="noopener noreferrer">Open HTTPS source <ExternalLink size={13} /></a>}</div>
                            <details className={reliabilityStyles.evidenceDisclosure}><summary>Inspect issue evidence</summary><IssueEvidence issue={issue} /></details>
                          </td>
                          <td><strong>{issue.reasonLabel}</strong><small>{issue.consecutiveFailures} consecutive / {issue.totalFailures} total</small></td>
                          <td><strong>{issue.affectedPolicies.length}</strong><small>{issue.affectedPolicies.slice(0, 2).map((policy) => policy.company).join(', ') || 'Match pending'}</small></td>
                          <td>
                            <p>{issue.suggestedAction || 'Review evidence and rescan.'}</p>
                            {data.role === 'admin' && issue.status === 'Recovered' && <button className={`${styles.btn} ${styles.btnSecondary}`} disabled={pendingKey === issue.id} onClick={() => void updateIssue(issue.id, 'Resolved')} type="button"><CheckCircle2 size={15} />{pendingKey === issue.id ? 'Closing…' : 'Close recovered issue'}</button>}
                            {data.role === 'admin' && issue.status === 'Resolved' && <button className={`${styles.btn} ${styles.btnSecondary}`} disabled={pendingKey === issue.id} onClick={() => void updateIssue(issue.id, 'Open')} type="button">{pendingKey === issue.id ? 'Reopening…' : 'Reopen issue'}</button>}
                            {data.role === 'admin' && (issue.status === 'Open' || issue.status === 'Watching') && <span className={reliabilityStyles.blockedAction}>Rescan must recover the source before closure.</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={reliabilityStyles.mobileLedger}>
                  {visibleIssues.map((issue) => (
                    <article key={issue.id} id={`mobile-issue-${issue.id}`} tabIndex={-1} className={reliabilityStyles.issueCard}>
                      <header><span className={badge(issue.status)}>{issue.status}</span><small>{formatDate(issue.lastDetectedAt)}</small></header>
                      <div className={reliabilityStyles.sourceIdentity}><strong>{issue.sourceHost}</strong><span>{issue.sourcePath}</span>{issue.sourceHref && <a href={issue.sourceHref} target="_blank" rel="noopener noreferrer">Open HTTPS source <ExternalLink size={13} /></a>}</div>
                      <dl className={reliabilityStyles.mobileSummary}><div><dt>Failure</dt><dd>{issue.reasonLabel}</dd></div><div><dt>Policies</dt><dd>{issue.affectedPolicies.length}</dd></div></dl>
                      <details className={reliabilityStyles.evidenceDisclosure}><summary>Inspect issue evidence</summary><IssueEvidence issue={issue} /></details>
                      {data.role === 'admin' && issue.status === 'Recovered' && <button className={`${styles.btn} ${styles.btnSecondary}`} disabled={pendingKey === issue.id} onClick={() => void updateIssue(issue.id, 'Resolved')} type="button"><CheckCircle2 size={15} />{pendingKey === issue.id ? 'Closing…' : 'Close recovered issue'}</button>}
                      {data.role === 'admin' && issue.status === 'Resolved' && <button className={`${styles.btn} ${styles.btnSecondary}`} disabled={pendingKey === issue.id} onClick={() => void updateIssue(issue.id, 'Open')} type="button">{pendingKey === issue.id ? 'Reopening…' : 'Reopen issue'}</button>}
                      {data.role === 'admin' && (issue.status === 'Open' || issue.status === 'Watching') && <p className={reliabilityStyles.blockedAction}>Rescan must recover the source before closure.</p>}
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>

          <details className={reliabilityStyles.diagnosticDisclosure}>
            <summary><Activity size={18} /><span><strong>Inventory and scan diagnostics</strong><small>Lower-priority context: publication gate, scan runs and shared acquisition keys.</small></span></summary>
            <div className={reliabilityStyles.diagnosticContent}>
              {data.inventory.publicEvidencePolicies === 0 && (
                <section className={reliabilityStyles.readinessWarning} aria-labelledby="public-baseline-action-title">
                  <AlertTriangle size={22} /><div><h2 id="public-baseline-action-title">No policy currently passes the public-evidence baseline gate</h2><p>Review the dry-run repair after deployment, then run a complete source scan. Records without exact verified evidence remain private.</p></div>
                  <div className={reliabilityStyles.readinessActions}>{data.role === 'admin' && <Link href="/admin/cron" className={`${styles.btn} ${styles.btnPrimary}`}>Open Cron Manager</Link>}<Link href="/methodology/confidence" className={`${styles.btn} ${styles.btnSecondary}`}>Evidence method</Link></div>
                </section>
              )}
              <section className={reliabilityStyles.metricGrid} aria-label="Source inventory summary">
                <article className={reliabilityStyles.metricCard}><Database size={18} /><div><span>Policy records</span><strong>{data.inventory.policyRecords}</strong><small>Configured policy and jurisdiction rows</small></div></article>
                <article className={reliabilityStyles.metricCard}><Network size={18} /><div><span>Unique retrievals</span><strong>{data.inventory.uniqueRetrievalKeys}</strong><small>Normalized network acquisitions</small></div></article>
                <article className={`${reliabilityStyles.metricCard} ${data.inventory.publicEvidencePolicies === 0 ? reliabilityStyles.metricWarning : reliabilityStyles.metricPositive}`}><Eye size={18} /><div><span>Public baselines</span><strong>{data.inventory.publicEvidencePolicies}</strong><small>Eligible public views</small></div></article>
                <article className={`${reliabilityStyles.metricCard} ${data.inventory.withheldPolicies > 0 ? reliabilityStyles.metricWarning : reliabilityStyles.metricPositive}`}><EyeOff size={18} /><div><span>Withheld</span><strong>{data.inventory.withheldPolicies}</strong><small>Records outside public routes</small></div></article>
                <article className={reliabilityStyles.metricCard}><Archive size={18} /><div><span>Historical</span><strong>{data.inventory.historicalReferences}</strong><small>Excluded from change detection</small></div></article>
              </section>
              <div className={reliabilityStyles.diagnosticColumns}>
                <section><h3><Activity size={17} /> Recent scan runs</h3>{data.scanRuns.length ? <ul>{data.scanRuns.map((run) => <li key={run.id}><span><strong>{formatDate(run.startedAt)}</strong><small>{run.selectedRecords} records · {run.uniqueSources} sources · {run.uniqueUnavailableSources} unavailable</small></span><span className={badge(run.status)}>{run.status}</span></li>)}</ul> : <p>No persisted ScanRun yet. {data.role === 'admin' ? 'Run a source scan to establish a baseline.' : 'An administrator must run the first scan.'}</p>}</section>
                <section><h3><Database size={17} /> Shared acquisitions</h3>{data.inventory.duplicateGroups.length ? <ul>{data.inventory.duplicateGroups.map((group) => <li key={group.retrievalKey}><span><strong>{group.retrievalKey}</strong><small>{group.records.map((record) => `${record.company} · ${record.policy}`).join('; ')}</small></span></li>)}</ul> : <p>Every configured record currently has a distinct acquisition key.</p>}</section>
              </div>
            </div>
          </details>
        </>
      )}
    </div>
  );
}
