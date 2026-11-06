'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { GroundedClaim, Verification } from '@/lib/engine/claims';
import type { ReviewedExclusion, SourceContract, StructuredDocument } from '@/lib/engine/document';
import styles from '../admin.module.css';

type Policy = { id: string; name: string; url: string; retrievalUrl: string | null; jurisdiction: string; company: { name: string } };
type Task = { id: string; policyId: string | null; kind: string; stage: string; status: string; attempt: number; lastError: string | null; resultJson: string | null };
type Run = { id: string; mode: string; status: string; selected: number; createdAt: string; tasks: Task[] };
type Review = { status: string; mode: string; id: string; policyId: string; reasonsJson: string; createdAt: string };
type Detail = { review: Review & { status: string }; payload: { observation?: { observedAt: string; source: string; httpStatus: number }; checkpoint?: { analysis?: { value: { claims: GroundedClaim[] } }; verification?: { value: Verification } } }; document?: StructuredDocument; oldDocument?: StructuredDocument; baselineCandidate?: StructuredDocument };
type Status = { hostedPreview?: boolean; worker?: { active: boolean; leader?: { phase: string; lastHeartbeatAt: string; lastError: string | null } | null; error?: string | null } | null; implementationHash?: string | null; coverage?: { total: number; contracted: number; verified: number; awaitingConfirmation: number }; enabled: boolean; publicationEnabled: boolean; schema: string; runs: Run[]; reviews: Review[]; policies: Policy[] };
const fieldStyle = { width: '100%', padding: 10, margin: '6px 0 16px', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 6 };
const buttonStyle = { padding: '10px 16px', marginRight: 12, marginBottom: 12, cursor: 'pointer', borderRadius: 6, border: '1px solid #7089ae', background: '#203a5a', color: '#fff' };
const label = (value: string) => value.replaceAll('_', ' ');
type EditableExclusion = ReviewedExclusion & { dialogHeadings?: string[] };
function parseReviewedExclusions(value: string): EditableExclusion[] {
  let parsed: unknown;
  try { parsed = JSON.parse(value.trim() || '[]'); }
  catch { throw new Error('Reviewed exclusions must be valid JSON. Use an array of objects, or [] for no exclusions.'); }
  if (!Array.isArray(parsed) || parsed.length > 20) throw new Error('Reviewed exclusions must be a JSON array with at most 20 entries.');
  return parsed.map((entry: unknown, index: number) => {
    const prefix = `Exclusion ${index + 1}: `;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error(`${prefix}expected an object.`);
    const item = entry as Record<string, unknown>;
    if (typeof item.selector !== 'string' || !item.selector.trim() || item.selector.length > 300) throw new Error(`${prefix}selector must contain 1–300 characters.`);
    if (/:(?:has|contains|matches|not)\s*\(/i.test(item.selector)) throw new Error(`${prefix}use a specific selector without :has(), :contains(), :matches() or :not().`);
    if (typeof item.htmlSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(item.htmlSha256)) throw new Error(`${prefix}htmlSha256 must be a 64-character lowercase hexadecimal hash of the reviewed node.`);
    if (item.purpose !== 'non_document_ui') throw new Error(`${prefix}purpose must be "non_document_ui".`);
    if (typeof item.reviewNote !== 'string' || item.reviewNote.trim().length < 20 || item.reviewNote.length > 1000) throw new Error(`${prefix}reviewNote must contain 20–1,000 characters explaining the review.`);
    if (item.dialogHeadings !== undefined && (!Array.isArray(item.dialogHeadings) || item.dialogHeadings.some(h => typeof h !== 'string' || !h.trim()))) throw new Error(`${prefix}dialogHeadings, when supplied, must be an array of non-empty strings.`);
    return { selector: item.selector, htmlSha256: item.htmlSha256, purpose: 'non_document_ui', reviewNote: item.reviewNote,
      ...(item.dialogHeadings !== undefined ? { dialogHeadings: item.dialogHeadings as string[] } : {}) };
  });
}

export default function EngineWorkspace() {
  const [status, setStatus] = useState<Status | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [policyId, setPolicyId] = useState('');
  const [titles, setTitles] = useState('');
  const [headings, setHeadings] = useState('');
  const [terminal, setTerminal] = useState('');
  const [language, setLanguage] = useState('en');
  const [preferredTransport, setTransport] = useState('direct');
  const [note, setNote] = useState('');
  const [exclusions, setExclusions] = useState('[]');
  const [exclusionsError, setExclusionsError] = useState('');
  const [contractLoading, setContractLoading] = useState(false);
  const [contractError, setContractError] = useState('');
  const [loadedPolicyId, setLoadedPolicyId] = useState('');
  const [contractBounds, setContractBounds] = useState({ minimumChars: 100, maximumChars: 500000 });
  const contractRequest = useRef<AbortController | null>(null);
  const [reviewDetail, setReviewDetail] = useState<Detail | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const refresh = useCallback(async () => {
    const response = await fetch('/api/admin/engine', { cache: 'no-store' });
    if (!response.ok) throw new Error('Unable to load engine status. Check your admin session.');
    setStatus(await response.json());
  }, []);
  useEffect(() => {
    const initial = setTimeout(() => { void refresh().catch(e => setMessage(e.message)); }, 0);
    const timer = setInterval(() => { void refresh().catch(() => undefined); }, 5000);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, [refresh]);
  useEffect(() => () => contractRequest.current?.abort(), []);
  async function selectPolicy(nextPolicyId: string) {
    contractRequest.current?.abort();
    const controller = new AbortController();
    contractRequest.current = controller;
    setPolicyId(nextPolicyId); setLoadedPolicyId(''); setContractError(''); setExclusionsError('');
    setTitles(''); setHeadings(''); setTerminal(''); setLanguage('en'); setTransport('direct'); setNote(''); setExclusions('[]');
    setContractBounds({ minimumChars: 100, maximumChars: 500000 });
    setContractLoading(Boolean(nextPolicyId));
    if (!nextPolicyId) return;
    try {
      const response = await fetch(`/api/admin/engine?policyId=${encodeURIComponent(nextPolicyId)}`, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error('Unable to load the reviewed source contract. Retry loading it before saving.');
      const result: { contract: SourceContract | null } = await response.json();
      if (controller.signal.aborted || contractRequest.current !== controller) return;
      if (result.contract) {
        const contract = result.contract;
        setTitles(contract.titleAliases.join('\n')); setHeadings(contract.requiredHeadings.join('\n')); setTerminal(contract.terminalText);
        setLanguage(contract.language); setTransport(contract.preferredTransport); setNote(contract.reviewNote);
        setExclusions(JSON.stringify(contract.reviewedExclusions || [], null, 2));
        setContractBounds({ minimumChars: contract.minimumChars, maximumChars: contract.maximumChars });
      }
      setLoadedPolicyId(nextPolicyId);
    } catch (error) {
      if (!controller.signal.aborted && contractRequest.current === controller) setContractError(error instanceof Error ? error.message : 'Unable to load the reviewed source contract.');
    } finally {
      if (!controller.signal.aborted && contractRequest.current === controller) setContractLoading(false);
    }
  }
  async function action(body: { action: string; [key: string]: unknown }) {
    setBusy(true);
    try {
      const response = await fetch('/api/admin/engine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(label(result.error || 'Request failed'));
      setMessage(body.action === 'rebaseline'
        ? 'A newly confirmed baseline has been requested. Two fresh captures are still required; the old baseline and history are preserved. This request creates no public change or notification.'
        : result.run ? `Run accepted: ${result.run.selected} policies due. A worker processes the saved queue.` : 'Saved.');
      setReviewDetail(null); setReviewNote('');
      await refresh();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Request failed'); }
    finally { setBusy(false); }
  }
  const selected = status?.policies.find(p => p.id === policyId);
  const reviewReasons: string[] = reviewDetail ? JSON.parse(reviewDetail.review.reasonsJson) : [];
  const needsRebaseline = reviewReasons.length === 1 && reviewReasons[0] === 'parser_upgrade_rebaseline_required';
  const policyName = (id: string) => { const p = status?.policies.find(p => p.id === id); return p ? `${p.company.name} · ${p.name} (${p.jurisdiction})` : id; };
  return <div style={{ maxWidth: 1200 }}>
    <h1 className={styles.pageTitle}>Engine 6 Preview</h1>
    <p className={styles.pageSubtitle}>Daily monitoring with traceable evidence, resumable work and explicit review.</p>
    <p role="status" aria-live="polite">{message}</p>
    {!status ? <p>Loading…</p> : !status.enabled ? <section className={styles.card}>
      <h2>Preview is disabled</h2><p>The current scanner remains active. Enable the preview in an isolated environment after applying its additive database migration.</p>
    </section> : <>
      {status.hostedPreview && <section className={styles.card} style={{ marginBottom: 24 }}>
        <h2>6.0 Preview · separate private environment</h2>
        <p>Live captures and reports stay in this preview database. Official baselines, public changes and subscriber notifications are disabled. Source completeness, observation over several days and operation at 500 sources remain under qualification.</p>
        <p>Worker: {status.worker?.active ? 'active' : 'not active'}{status.worker?.leader?.lastHeartbeatAt ? ` · last heartbeat ${new Date(status.worker.leader.lastHeartbeatAt).toLocaleString()}` : ''}.</p>
        {(status.worker?.error || status.worker?.leader?.lastError) && <p role="alert">Worker status: {status.worker.error || status.worker.leader?.lastError}. Saved work is not evidence of a completed scan.</p>}
        <p><Link href="/admin/cron">Start Preview or compare extractors</Link> · <a href="https://policywatcher.online" target="_blank" rel="noreferrer">Open stable PolicyWatcher</a></p>
        <details><summary>Implementation identity</summary><code style={{ overflowWrap: 'anywhere' }}>{status.implementationHash || 'Unavailable; execution is blocked'}</code></details>
      </section>}
      <section className={styles.card} style={{ marginBottom: 24 }}>
        <h2>Coverage and evidence</h2><p>{status.coverage?.contracted || 0}/{status.coverage?.total || 0} sources configured · {status.coverage?.verified || 0} baselines verified in the last 24 hours · {status.coverage?.awaitingConfirmation || 0} candidates awaiting confirmation.</p>
        <p>Missing baselines need a documented correction in <Link href="/admin/evidence-quality">Evidence Quality</Link>. A completed run may still contain held or unconfigured sources.</p>
        <p>A configured contract checks expected document boundaries. It does not establish independent coverage of every clause, repeated occurrence or table cell.</p>
      </section>
      <section className={styles.card} style={{ marginBottom: 24 }}>
        <h2>Start a durable run</h2>
        <p>{status.hostedPreview ? 'Start with five due policies. Use the scan selector for a company scope, extraction comparison or a batch of up to 50. A completed run can include held sources that require review.' : 'Up to 500 due policies. Observation keeps candidate changes private. Publication requires complete evidence and independent verification; high impact changes enter review.'}</p>
        <button style={buttonStyle} disabled={busy || (status.hostedPreview && !status.worker?.active)} onClick={() => void action({ action: 'enqueue', mode: 'observe', requestKey: crypto.randomUUID(), ...(status.hostedPreview ? { channel: 'preview', limit: 5 } : {}) })}>Observe due policies</button>
        {!status.hostedPreview && <button style={buttonStyle} disabled={busy || !status.publicationEnabled} onClick={() => void action({ action: 'enqueue', mode: 'publish', requestKey: crypto.randomUUID() })}>Scan with publication gates</button>}
        <p>These manual runs are silent: no subscriber notifications. Scheduled notification delivery has a separate configuration.</p>
      </section>
      <section className={styles.card} style={{ marginBottom: 24, overflowX: 'auto' }}>
        <h2>Saved runs</h2>
        {status.runs.length === 0 ? <p>No runs yet.</p> : status.runs.map(run => <details key={run.id} style={{ marginBottom: 18 }}>
          <summary>{new Date(run.createdAt).toLocaleString()} · {run.mode} · {label(run.status)} · {run.tasks.filter(t => t.kind === 'policy' && ['completed', 'failed'].includes(t.status)).length}/{run.selected} policies</summary>
          <p>Run {run.id}</p>
          {['queued', 'running'].includes(run.status) && <button style={buttonStyle} disabled={busy} onClick={() => void action({ action: 'cancel', runId: run.id, note: 'Administrator cancelled remaining work from the Engine 6 workspace.' })}>Cancel remaining work</button>}
          <table style={{ width: '100%', textAlign: 'left', borderSpacing: '10px' }}><thead><tr><th>Policy / retrieval</th><th>Stage</th><th>Status</th><th>Outcome / reason</th></tr></thead><tbody>
            {run.tasks.map(t => <tr key={t.id}><td>{t.policyId ? policyName(t.policyId) : 'Shared source retrieval'}</td><td>{label(t.stage)}</td><td>{label(t.status)} ({t.attempt})</td><td>{t.lastError || (t.resultJson ? label(JSON.parse(t.resultJson).outcome || (JSON.parse(t.resultJson).eligible ? 'source accepted' : 'source needs review')) : 'Not recorded')}</td></tr>)}
          </tbody></table>
        </details>)}
      </section>
      <section className={styles.card} style={{ marginBottom: 24 }}>
        <h2>Evidence reviews and observations ({status.reviews.length})</h2>
        <p>Approve verified high impact changes or explicitly reviewed baseline replacements. Missing source identity or coverage must be repaired first. Request new evidence when a review has become stale; the earlier evidence remains saved.</p>
        {status.reviews.map(r => <div key={r.id} style={{ borderTop: '1px solid #41516b', padding: '14px 0' }}>
          <strong>{policyName(r.policyId)}</strong><p>{label(r.status)} · {r.mode}</p><p>{JSON.parse(r.reasonsJson).map(label).join(' · ')}</p>
          <button style={buttonStyle} onClick={async () => {
            try {
              const response = await fetch(`/api/admin/engine?reviewId=${encodeURIComponent(r.id)}`, { cache: 'no-store' });
              if (!response.ok) throw new Error('Unable to load evidence');
              setReviewDetail(await response.json()); setReviewNote('');
            } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to load evidence'); }
          }}>Inspect frozen evidence</button>
        </div>)}
        {reviewDetail && <div style={{ borderTop: '2px solid #7089ae', paddingTop: 20 }}>
          <h3>Frozen evidence and independent verification</h3>
          <p>{policyName(reviewDetail.review.policyId)} · {label(reviewDetail.review.status)}</p>
          <p>Observation recorded {reviewDetail.payload.observation?.observedAt ? new Date(reviewDetail.payload.observation.observedAt).toLocaleString() : 'Not recorded'} · {reviewDetail.payload.observation?.source || 'No transport recorded'} · {reviewDetail.payload.observation?.httpStatus ? `HTTP ${reviewDetail.payload.observation.httpStatus}` : 'No HTTP response recorded'}</p>
          {(reviewDetail.payload.checkpoint?.analysis?.value.claims || []).map(claim => <article key={claim.id} style={{ padding: 18, marginBottom: 16, background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
            <h4>{claim.textEn}</h4><p>{claim.textIt}</p><p>Impact {claim.impact}/10 · {label(claim.category)}</p>
            {claim.evidence.map((span, i) => <div key={i}><strong>{span.side === 'old' ? 'Previous version' : 'Captured version'}</strong><blockquote style={{ borderLeft: '3px solid #839bc0', paddingLeft: 14, whiteSpace: 'pre-wrap' }}>{span.quote}</blockquote></div>)}
            {reviewDetail.payload.checkpoint?.verification?.value.verdicts.filter(v => v.claimId === claim.id).map(v => <p key={v.claimId}><strong>Independent check: {v.verdict}.</strong> {v.reason}</p>)}
          </article>)}
          {[["Previous frozen text", reviewDetail.oldDocument], ["Captured text", reviewDetail.document], ["Proposed baseline after replay", reviewDetail.baselineCandidate]].map(([title, value]) => {
            const document = value as StructuredDocument | undefined;
            return document && <details key={String(title)} style={{ marginBottom: 14 }}><summary>{String(title)}</summary><pre style={{ maxHeight: 400, overflow: 'auto', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{document.text}</pre></details>;
          })}
          <details style={{ marginBottom: 16 }}><summary>Technical provenance</summary><pre style={{ maxHeight: 300, overflow: 'auto', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(reviewDetail, null, 2)}</pre></details>
          <label>Review rationale (minimum 20 characters)<textarea style={fieldStyle} value={reviewNote} onChange={e => setReviewNote(e.target.value)} /></label>
          {needsRebaseline && <div style={{ marginBottom: 18, padding: 16, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
            <h4>A new extraction baseline needs fresh confirmation</h4>
            <p>The parser upgrade cannot safely reuse the earlier extraction as a comparable baseline. Requesting a replacement starts a confirmation process: a worker must obtain two fresh captures before a new baseline can be recorded. The existing baseline and history are preserved; clicking this button publishes no policy change and sends no notification.</p>
            <p>Replacing the baseline can absorb a real provider policy change without producing a change alert. Use this only after explicit review establishes that the historical baseline cannot be compared reliably.</p>
            <p>This preview has no dedicated action to revoke a baseline replacement request. Scan-pause and publication controls remain available.</p>
            <button style={buttonStyle} disabled={busy || !status.publicationEnabled || reviewDetail.review.mode !== 'publish' || reviewDetail.review.status !== 'pending' || reviewNote.trim().length < 20} onClick={() => void action({ action: 'rebaseline', reviewId: reviewDetail.review.id, note: reviewNote })}>Request a newly confirmed baseline</button>
          </div>}
          <button style={buttonStyle} disabled={busy || needsRebaseline || reviewDetail.review.status !== 'pending' || reviewDetail.review.mode !== 'publish' || !status.publicationEnabled || reviewNote.trim().length < 20 || !reviewReasons.every(r => ['high_impact_review_required', 'parser_upgrade_requires_baseline_review', 'formatting_requires_baseline_review'].includes(r))} onClick={() => void action({ action: 'approve', reviewId: reviewDetail.review.id, note: reviewNote })}>Approve reviewed evidence</button>
          <button style={buttonStyle} disabled={busy || reviewNote.trim().length < 20} onClick={() => void action({ action: 'refresh', reviewId: reviewDetail.review.id, note: reviewNote })}>Request fresh evidence</button>
          <button style={buttonStyle} disabled={busy || reviewNote.trim().length < 20} onClick={() => void action({ action: 'reject', reviewId: reviewDetail.review.id, note: reviewNote })}>Close without publishing</button>
        </div>}
      </section>
      <section className={styles.card}>
        <h2>Review a source contract</h2><p>A source contract defines the document identity and completeness checks. Read the official document before recording these expectations. A changed title or missing terminal section will require review.</p>
        <form onSubmit={e => { e.preventDefault(); if (!selected || busy || contractLoading || loadedPolicyId !== policyId) return;
          let reviewedExclusions: EditableExclusion[];
          try { reviewedExclusions = parseReviewedExclusions(exclusions); setExclusionsError(''); }
          catch (error) { setExclusionsError(error instanceof Error ? error.message : 'Unable to parse reviewed exclusions.'); return; }
          void action({ action: 'contract', policyId,
          contract: { schemaVersion: 1, sourceUrl: selected.retrievalUrl || selected.url, titleAliases: titles.split('\n').filter(Boolean), requiredHeadings: headings.split('\n').filter(Boolean), terminalText: terminal,
            language, preferredTransport, ...contractBounds, reviewedExclusions, reviewedAt: new Date().toISOString(), reviewNote: note } }); }}>
          <label>Policy<select required disabled={busy} style={fieldStyle} value={policyId} onChange={e => void selectPolicy(e.target.value)}><option value="">Select a policy</option>{status.policies.map(p => <option key={p.id} value={p.id}>{policyName(p.id)}</option>)}</select></label>
          {contractLoading && <p role="status">Loading the reviewed source contract…</p>}
          {contractError && <div><p role="alert">{contractError}</p><button type="button" style={buttonStyle} disabled={busy || !policyId || contractLoading} onClick={() => void selectPolicy(policyId)}>Retry loading source contract</button></div>}
          {selected && <p><a href={selected.retrievalUrl || selected.url} target="_blank" rel="noreferrer">Read the official source ↗</a></p>}
          <fieldset disabled={busy || !selected || contractLoading || loadedPolicyId !== policyId} style={{ border: 0, padding: 0, minWidth: 0 }}>
          <label>Expected document titles, one per line<textarea required style={fieldStyle} value={titles} onChange={e => setTitles(e.target.value)} /></label>
          <label>Required section headings, one per line<textarea required style={fieldStyle} value={headings} onChange={e => setHeadings(e.target.value)} /></label>
          <label>Exact text near the end of the document<textarea required minLength={10} style={fieldStyle} value={terminal} onChange={e => setTerminal(e.target.value)} /></label>
          <label>Document language<select style={fieldStyle} value={language} onChange={e => setLanguage(e.target.value)}><option value="en">English</option><option value="it">Italian</option></select></label>
          <label>Preferred retrieval<select style={fieldStyle} value={preferredTransport} onChange={e => setTransport(e.target.value)}><option value="direct">Direct HTTP</option><option value="rendered">Browser rendering</option></select></label>
          <label>Reviewed exclusions (optional JSON array)<textarea rows={8} spellCheck={false} style={{ ...fieldStyle, fontFamily: 'var(--font-mono)' }} value={exclusions} aria-describedby="reviewed-exclusions-help reviewed-exclusions-error" aria-invalid={Boolean(exclusionsError)} onChange={e => { setExclusions(e.target.value); setExclusionsError(''); }} /></label>
          <p id="reviewed-exclusions-help">Use [] for none. Every exclusion must identify a specific reviewed node with selector and htmlSha256, purpose &quot;non_document_ui&quot;, and a reviewNote of at least 20 characters. Optional dialogHeadings records reviewed dialog headings. Exclude only non-document interface content, never policy provisions. Each exclusion is pinned to the reviewed HTML hash; new or changed nodes remain held for review.</p>
          <p id="reviewed-exclusions-error" role={exclusionsError ? 'alert' : undefined}>{exclusionsError}</p>
          <label>What did you verify?<textarea required minLength={10} style={fieldStyle} value={note} onChange={e => setNote(e.target.value)} /></label>
          <button style={buttonStyle} disabled={busy || !selected || contractLoading || loadedPolicyId !== policyId}>Save reviewed contract</button>
          </fieldset>
        </form>
      </section>
    </>}
  </div>;
}
