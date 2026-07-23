'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardPaste,
  ExternalLink,
  FileCheck2,
  Filter,
  PauseCircle,
  Play,
  RefreshCw,
  Send,
  ShieldCheck,
  Upload,
  XCircle,
} from 'lucide-react';
import styles from '../admin.module.css';
import {
  prepareSourceOnboardingRows,
  summarizeSourceOnboardingPipeline,
  SOURCE_ONBOARDING_HEADERS,
  SOURCE_ONBOARDING_MAX_ROWS,
  type SourceOnboardingAction,
  type SourceOnboardingPreview,
} from '@/lib/sourceOnboarding';

const SAMPLE_CSV = `${SOURCE_ONBOARDING_HEADERS.join(',')}
Acme AI,acme-ai,AI Provider,https://acme.example,Privacy Policy,privacy,https://acme.example/privacy,Global
Northstar Cloud,,Cloud/SaaS,https://northstar.example,Terms of Service,terms,https://northstar.example/legal/terms,EU`;

interface BatchListItem {
  id: string;
  label: string;
  status: string;
  totalItems: number;
  successfulItems: number;
  failedItems: number;
  createdAt: string;
  updatedAt: string;
}

interface OnboardingItem {
  id: string;
  rowNumber: number;
  companyName: string;
  companySlug: string;
  industry: string;
  website: string;
  policyName: string;
  policyType: string;
  policyUrl: string;
  jurisdiction: string;
  stage: string;
  qaStatus: string;
  qaSummary: string | null;
  qaChecksJson: string | null;
  publicationDecision: string;
  error: string | null;
  reviewedByRole: string | null;
  reviewedAt: string | null;
  decisionByRole: string | null;
  decisionAt: string | null;
  company: { id: string; name: string; slug: string } | null;
  discoveryCandidate: { id: string; status: string; url: string } | null;
  policy: {
    id: string;
    dataStatus: string;
    ingestionMethod: string;
    currentHash: string;
    lastSuccessfulCheckDate: string;
    _count: { snapshots: number; changes: number };
  } | null;
}

interface OnboardingBatch extends BatchListItem {
  actorRole: string;
  completedAt: string | null;
  items: OnboardingItem[];
}

interface ApiPayload {
  batch: OnboardingBatch | null;
  recentBatches?: BatchListItem[];
  error?: string;
}

const PIPELINE = [
  { label: 'Proposed source', icon: ClipboardPaste },
  { label: 'Official-source review', icon: ShieldCheck },
  { label: 'First baseline', icon: Play },
  { label: 'QA gate', icon: FileCheck2 },
  { label: 'Publication decision', icon: Send },
] as const;

function stageTone(stage: string): string {
  if (stage === 'Published' || stage === 'Ready') return styles.badgeSuccess;
  if (stage === 'Rejected' || stage === 'Failed') return styles.badgeError;
  if (stage === 'Held') return styles.badgeNeutral;
  return styles.badgeWarning;
}

function stageIcon(stage: string) {
  if (stage === 'Published' || stage === 'Ready') return <CheckCircle2 size={13} aria-hidden="true" />;
  if (stage === 'Rejected' || stage === 'Failed') return <XCircle size={13} aria-hidden="true" />;
  if (stage === 'Held') return <PauseCircle size={13} aria-hidden="true" />;
  return <RefreshCw size={13} aria-hidden="true" />;
}

export default function SourceOnboardingPage() {
  const [batchLabel, setBatchLabel] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [preview, setPreview] = useState<SourceOnboardingPreview | null>(null);
  const [batch, setBatch] = useState<OnboardingBatch | null>(null);
  const [recentBatches, setRecentBatches] = useState<BatchListItem[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [committing, setCommitting] = useState(false);
  const [actionId, setActionId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadBatches = useCallback(async (batchId?: string) => {
    setLoading(true);
    try {
      const query = batchId ? `?batchId=${encodeURIComponent(batchId)}` : '';
      const response = await fetch(`/api/admin/source-onboarding${query}`, { credentials: 'include' });
      const data = await response.json().catch(() => null) as ApiPayload | null;
      if (!response.ok) throw new Error(data?.error || 'Unable to load source onboarding batches.');
      setBatch(data?.batch || null);
      setRecentBatches(data?.recentBatches || []);
      setSelectedBatchId(data?.batch?.id || '');
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load source onboarding batches.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadBatches());
  }, [loadBatches]);

  const pipelineAccounting = useMemo(() => {
    const items = batch?.items || [];
    const summary = summarizeSourceOnboardingPipeline(items);
    const stages = [
      {
        ...PIPELINE[0],
        count: summary.proposed,
        detail: 'Awaiting intake review',
      },
      {
        ...PIPELINE[1],
        count: summary.officialReview,
        detail: summary.rejectedAtReview > 0 ? `${summary.rejectedAtReview} rejected at source review` : 'Official-source decision',
      },
      {
        ...PIPELINE[2],
        count: summary.baseline,
        detail: 'Private capture pending',
      },
      {
        ...PIPELINE[3],
        count: summary.qa,
        detail: 'Evidence checks pending',
      },
      {
        ...PIPELINE[4],
        count: summary.publication,
        detail: summary.rejectedAtPublication > 0 ? `${summary.rejectedAtPublication} rejected at publication` : 'Publish, hold, or reject',
      },
    ];
    return {
      stages,
      failedRows: summary.failed,
      accountedRows: summary.accounted,
    };
  }, [batch]);

  const visibleItems = useMemo(() => {
    if (!batch) return [];
    if (stageFilter === 'all') return batch.items;
    return batch.items.filter((item) => item.stage === stageFilter);
  }, [batch, stageFilter]);

  const handlePreview = () => {
    const nextPreview = prepareSourceOnboardingRows(sourceText);
    setPreview(nextPreview);
    setError(nextPreview.errors[0] || '');
    setNotice('');
  };

  const commitBatch = async () => {
    if (!preview || preview.readyCount === 0) return;
    setCommitting(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/admin/source-onboarding', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: batchLabel, text: sourceText }),
      });
      const data = await response.json().catch(() => null) as ApiPayload | null;
      if (!response.ok) throw new Error(data?.error || 'Unable to commit onboarding batch.');
      setBatch(data?.batch || null);
      setSelectedBatchId(data?.batch?.id || '');
      setPreview(null);
      setSourceText('');
      setBatchLabel('');
      setNotice(
        data?.batch?.failedItems
          ? `Batch saved with partial success: ${data.batch.successfulItems} accepted, ${data.batch.failedItems} failed.`
          : `Batch saved: ${data?.batch?.successfulItems || 0} sources are ready for accountable review.`
      );
      await loadBatches(data?.batch?.id);
    } catch (commitError) {
      setError(commitError instanceof Error ? commitError.message : 'Unable to commit onboarding batch.');
    } finally {
      setCommitting(false);
    }
  };

  const runAction = async (item: OnboardingItem, action: SourceOnboardingAction) => {
    setActionId(`${item.id}:${action}`);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/admin/source-onboarding/${encodeURIComponent(item.id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await response.json().catch(() => null) as { error?: string; qa?: { summary?: string } } | null;
      if (!response.ok) throw new Error(data?.error || `Unable to perform ${action}.`);
      setNotice(data?.qa?.summary || `${item.companyName} / ${item.policyName}: ${action} saved.`);
      await loadBatches(batch?.id);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : `Unable to perform ${action}.`);
    } finally {
      setActionId('');
    }
  };

  const runBaseline = async (item: OnboardingItem) => {
    setActionId(`${item.id}:scan`);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/admin/cron-status', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companySlug: item.companySlug, limit: 50 }),
      });
      const data = await response.json().catch(() => null) as { error?: string; message?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Unable to start the targeted baseline scan.');
      setNotice(`${data?.message || 'Targeted scan started'} Refresh this batch after the scan completes; its private baseline will advance to QA automatically.`);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : 'Unable to start the targeted baseline scan.');
    } finally {
      setActionId('');
    }
  };

  return (
    <div className={styles.sourceOnboardingPage}>
      <header className={styles.sourceOnboardingHeader}>
        <div>
          <span className={styles.sourceOnboardingEyebrow}>Evidence intake console</span>
          <h1 className={styles.pageTitle}>Bulk source onboarding</h1>
          <p className={styles.pageSubtitle}>Import operator-supplied official policy URLs, then move each source through review, private baseline, QA, and an explicit publication decision.</p>
        </div>
        <Link href="/admin/companies" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnInline}`}>
          <ArrowLeft size={15} aria-hidden="true" /> Company Manager
        </Link>
      </header>

      <div className={styles.sourcePipelineBlock}>
        <ol className={styles.sourcePipeline} aria-label="Bulk source onboarding stages">
          {pipelineAccounting.stages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <li key={stage.label}>
                <span className={styles.sourcePipelineMarker}><Icon size={16} aria-hidden="true" /></span>
                <div><small>Stage {index + 1}</small><strong>{stage.label}</strong><span>{stage.detail}</span></div>
                <b aria-label={`${stage.count} items`}>{stage.count}</b>
              </li>
            );
          })}
        </ol>
        <div className={styles.sourcePipelineAudit} data-reconciled={pipelineAccounting.accountedRows === (batch?.totalItems || 0) ? 'true' : 'false'}>
          <span>
            <ShieldCheck size={14} aria-hidden="true" />
            Accounted rows: <strong>{pipelineAccounting.accountedRows} / {batch?.totalItems || 0}</strong>
          </span>
          <span className={`${styles.badge} ${pipelineAccounting.failedRows > 0 ? styles.badgeError : styles.badgeNeutral}`}>
            {pipelineAccounting.failedRows > 0 ? <AlertTriangle size={12} aria-hidden="true" /> : <Check size={12} aria-hidden="true" />}
            {pipelineAccounting.failedRows} failed at import
          </span>
        </div>
      </div>

      {(error || notice) && (
        <div className={`${styles.alert} ${error ? styles.alertDanger : styles.alertInfo}`} role={error ? 'alert' : 'status'}>
          {error ? <AlertTriangle size={17} aria-hidden="true" /> : <CheckCircle2 size={17} aria-hidden="true" />}
          <span>{error || notice}</span>
        </div>
      )}

      <section className={`${styles.card} ${styles.sourceImportPanel}`} aria-labelledby="source-import-title">
        <div className={styles.sourceSectionHeader}>
          <div>
            <span className={styles.sourceSectionKicker}>New intake</span>
            <h2 id="source-import-title">Paste a controlled CSV or TSV batch</h2>
            <p>Maximum {SOURCE_ONBOARDING_MAX_ROWS} rows. Import creates private proposed candidates only; it never publishes evidence.</p>
          </div>
          <button type="button" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnInline}`} onClick={() => { setSourceText(SAMPLE_CSV); setPreview(null); }}>
            <ClipboardPaste size={15} aria-hidden="true" /> Load sample
          </button>
        </div>
        <div className={styles.sourceHeaderContract}>
          <strong>Required header contract</strong>
          <code>{SOURCE_ONBOARDING_HEADERS.join(', ')}</code>
          <span>Blank companySlug is derived. Jurisdiction accepts EU, US, UK, Global. Industry uses the Company Manager values.</span>
        </div>
        <div className={styles.sourceImportFields}>
          <label>
            <span>Batch name</span>
            <input value={batchLabel} onChange={(event) => setBatchLabel(event.target.value)} placeholder="Q3 official source intake" maxLength={120} />
          </label>
          <label>
            <span>CSV or TSV rows</span>
            <textarea value={sourceText} onChange={(event) => { setSourceText(event.target.value); setPreview(null); }} placeholder={SAMPLE_CSV} rows={8} spellCheck={false} />
          </label>
        </div>
        <div className={styles.sourceImportActions}>
          <span>{sourceText ? `${sourceText.split(/\r?\n/).filter(Boolean).length - 1} pasted rows` : 'No rows pasted'}</span>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnInline}`} onClick={handlePreview} disabled={!sourceText.trim()}>
            <FileCheck2 size={16} aria-hidden="true" /> Preview validation
          </button>
        </div>
      </section>

      {preview && (
        <section className={`${styles.card} ${styles.sourcePreviewPanel}`} aria-labelledby="source-preview-title">
          <div className={styles.sourceSectionHeader}>
            <div>
              <span className={styles.sourceSectionKicker}>No writes yet</span>
              <h2 id="source-preview-title">Validated import preview</h2>
              <p>{preview.readyCount} ready · {preview.invalidCount} duplicate or invalid · {preview.rows.length} total</p>
            </div>
            <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnInline}`} onClick={() => void commitBatch()} disabled={committing || preview.readyCount === 0 || preview.errors.length > 0}>
              {committing ? <RefreshCw size={16} className={styles.spinIcon} aria-hidden="true" /> : <Upload size={16} aria-hidden="true" />}
              {committing ? 'Committing…' : `Commit ${preview.rows.length} rows`}
            </button>
          </div>
          <div className={styles.sourcePreviewTableWrap}>
            <table className={styles.sourcePreviewTable}>
              <thead><tr><th>Row</th><th>Company</th><th>Policy source</th><th>Normalized</th><th>Result</th></tr></thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.rowNumber} data-valid={row.ready ? 'true' : 'false'}>
                    <td>{row.rowNumber}</td>
                    <td><strong>{row.companyName || 'Missing'}</strong><span>{row.companySlug || 'no slug'} · {row.industry || 'no industry'}</span></td>
                    <td><strong>{row.policyName || 'Missing'}</strong><span>{row.policyUrl || 'no URL'}</span></td>
                    <td><span>{row.policyType || '-'} · {row.jurisdiction || '-'}</span><span>{row.website || 'no website'}</span></td>
                    <td>{row.ready ? <span className={`${styles.badge} ${styles.badgeSuccess}`}><Check size={13} /> Ready</span> : <div className={styles.sourceRowErrors}>{row.errors.map((message) => <span key={message}><AlertTriangle size={12} /> {message}</span>)}</div>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ol className={styles.sourcePreviewCards} aria-label="Validated import preview rows">
            {preview.rows.map((row) => (
              <li key={row.rowNumber} data-valid={row.ready ? 'true' : 'false'}>
                <div><small>Row</small><strong>#{row.rowNumber}</strong></div>
                <div><small>Company</small><strong>{row.companyName || 'Missing'}</strong><span>{row.companySlug || 'no slug'} · {row.industry || 'no industry'}</span></div>
                <div><small>Source</small><strong>{row.policyName || 'Missing'}</strong><span className={styles.sourcePreviewCardUrl}>{row.policyUrl || 'no URL'}</span></div>
                <div><small>Normalized</small><strong>{row.policyType || '-'} · {row.jurisdiction || '-'}</strong><span>{row.website || 'no website'}</span></div>
                <div>
                  <small>Result</small>
                  {row.ready ? (
                    <span className={`${styles.badge} ${styles.badgeSuccess}`}><Check size={13} /> Ready</span>
                  ) : (
                    <div className={styles.sourceRowErrors}>{row.errors.map((message) => <span key={message}><AlertTriangle size={12} /> {message}</span>)}</div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className={styles.sourceBatchWorkspace} aria-labelledby="batch-workspace-title">
        <div className={styles.sourceBatchToolbar}>
          <div>
            <span className={styles.sourceSectionKicker}>Durable work queue</span>
            <h2 id="batch-workspace-title">Batch overview</h2>
          </div>
          <div className={styles.sourceBatchControls}>
            <label><span className={styles.sourceVisuallyHidden}>Select batch</span><select value={selectedBatchId} onChange={(event) => { setSelectedBatchId(event.target.value); void loadBatches(event.target.value); }}><option value="">No saved batch</option>{recentBatches.map((entry) => <option key={entry.id} value={entry.id}>{entry.label} · {entry.status} · {entry.totalItems}</option>)}</select></label>
            <label><Filter size={14} aria-hidden="true" /><span className={styles.sourceVisuallyHidden}>Filter by stage</span><select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}><option value="all">All stages</option>{['Proposed', 'OfficialReview', 'BaselinePending', 'QaReview', 'Ready', 'Published', 'Held', 'Rejected', 'Failed'].map((stage) => <option key={stage}>{stage}</option>)}</select></label>
            <button type="button" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnInline}`} onClick={() => void loadBatches(batch?.id)} disabled={loading}><RefreshCw size={15} className={loading ? styles.spinIcon : ''} /> Refresh</button>
          </div>
        </div>

        {loading ? (
          <div className={styles.sourceQueueState}><RefreshCw size={20} className={styles.spinIcon} /><span>Loading durable onboarding state…</span></div>
        ) : !batch ? (
          <div className={styles.sourceQueueState}><ClipboardPaste size={22} /><span>No onboarding batch exists yet. Paste and preview the first controlled intake above.</span></div>
        ) : (
          <>
            <div className={styles.sourceBatchSummary}>
              <div><small>Batch</small><strong>{batch.label}</strong><span>{new Date(batch.createdAt).toLocaleString()}</span></div>
              <div><small>Status</small><strong>{batch.status}</strong><span>Actor: {batch.actorRole}</span></div>
              <div><small>Accepted</small><strong>{batch.successfulItems}</strong><span>of {batch.totalItems} rows</span></div>
              <div><small>Failed import</small><strong>{batch.failedItems}</strong><span>persisted for correction</span></div>
            </div>

            {visibleItems.length === 0 ? (
              <div className={styles.sourceQueueState}><Filter size={20} /><span>No rows match this stage filter.</span></div>
            ) : (
              <div className={styles.sourceWorkQueue}>
                {visibleItems.map((item) => (
                  <article key={item.id} className={styles.sourceQueueItem} data-stage={item.stage}>
                    <div className={styles.sourceQueueMain}>
                      <div className={styles.sourceQueueTitle}>
                        <span className={styles.sourceRowNumber}>#{item.rowNumber}</span>
                        <div><h3>{item.companyName}</h3><p>{item.policyName} · {item.policyType} · {item.jurisdiction}</p></div>
                        <span className={`${styles.badge} ${stageTone(item.stage)}`}>{stageIcon(item.stage)} {item.stage}</span>
                      </div>
                      <a href={item.policyUrl} target="_blank" rel="noopener noreferrer" className={styles.sourceQueueUrl}>{item.policyUrl}<ExternalLink size={12} /></a>
                      <div className={styles.sourceQueueMeta}>
                        <span>Candidate: <strong>{item.discoveryCandidate?.status || 'not created'}</strong></span>
                        <span>Policy: <strong>{item.policy ? `${item.policy.dataStatus} / ${item.policy.ingestionMethod}` : 'not approved'}</strong></span>
                        <span>QA: <strong>{item.qaStatus}</strong></span>
                        <span>Publication: <strong>{item.publicationDecision}</strong></span>
                      </div>
                      {(item.qaSummary || item.error) && <div className={`${styles.sourceQueueMessage} ${item.error ? styles.sourceQueueMessageError : ''}`}>{item.error || item.qaSummary}</div>}
                    </div>
                    <div className={styles.sourceQueueActions}>
                      {item.stage === 'Proposed' && <button type="button" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} onClick={() => void runAction(item, 'start-review')} disabled={Boolean(actionId)}><ShieldCheck size={14} /> Start official review</button>}
                      {item.stage === 'OfficialReview' && <><button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} onClick={() => void runAction(item, 'approve-source')} disabled={Boolean(actionId)}><CheckCircle2 size={14} /> Approve official source</button><button type="button" className={`${styles.btn} ${styles.btnDangerOutline} ${styles.btnSmall}`} onClick={() => void runAction(item, 'reject-source')} disabled={Boolean(actionId)}><XCircle size={14} /> Reject source</button></>}
                      {item.stage === 'BaselinePending' && <><button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} onClick={() => void runBaseline(item)} disabled={Boolean(actionId)}><Play size={14} /> Run targeted baseline</button><Link href="/admin/cron" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}>Open scan console</Link></>}
                      {item.stage === 'QaReview' && <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} onClick={() => void runAction(item, 'run-qa')} disabled={Boolean(actionId)}><FileCheck2 size={14} /> Run scoped QA</button>}
                      {item.stage === 'Ready' && <><button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} onClick={() => void runAction(item, 'publish')} disabled={Boolean(actionId)}><Send size={14} /> Publish evidence</button><button type="button" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} onClick={() => void runAction(item, 'hold')} disabled={Boolean(actionId)}><PauseCircle size={14} /> Hold private</button><button type="button" className={`${styles.btn} ${styles.btnDangerOutline} ${styles.btnSmall}`} onClick={() => void runAction(item, 'reject-publication')} disabled={Boolean(actionId)}><XCircle size={14} /> Reject publication</button></>}
                      {item.stage === 'Published' && <button type="button" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} onClick={() => void runAction(item, 'hold')} disabled={Boolean(actionId)}><PauseCircle size={14} /> Withdraw to hold</button>}
                      {item.stage === 'Held' && <><button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} onClick={() => void runAction(item, 'publish')} disabled={Boolean(actionId)}><Send size={14} /> Publish after hold</button><button type="button" className={`${styles.btn} ${styles.btnDangerOutline} ${styles.btnSmall}`} onClick={() => void runAction(item, 'reject-publication')} disabled={Boolean(actionId)}><XCircle size={14} /> Reject</button></>}
                      {['Rejected', 'Failed'].includes(item.stage) && <span className={styles.sourceTerminalLabel}>{item.stage === 'Failed' ? 'Correct the row in a new batch.' : 'Decision recorded in Review Log.'}</span>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
