'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './evidence-quality.module.css';
import ReviewedEvidenceMetrics from '@/components/admin/ReviewedEvidenceMetrics';
import type { ReviewedChange } from '@/lib/evidenceQuality';

type Reference = { id: string; service: string; title: string; commitSha: string; blobId: string; recordedAt: string;
  referenceUrl: string; status: string; jurisdiction: string; attribution: string; license: string };
type Data = { role: string; references: Reference[]; referenceScope: string;
  policies: { id: string; name: string; jurisdiction: string; company: { name: string } }[];
  changes: { id: string; policy: { name: string; company: { name: string } } }[];
  held: { policyId: string; reason: string; checkedAt: string; policy: { name: string; currentHash: string } }[] };

export default function EvidenceQualityPage() {
  const [data, setData] = useState<Data | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [changeId, setChangeId] = useState('');
  const [evidence, setEvidence] = useState<{ change: ReviewedChange; evidenceHash: string } | null>(null);
  const [metric, setMetric] = useState('substantive_change');
  const [verdict, setVerdict] = useState('unassessed');
  const [claim, setClaim] = useState(''); const [quote, setQuote] = useState('');
  const [note, setNote] = useState('');
  const [referenceNote, setReferenceNote] = useState('');
  const [baselineNote, setBaselineNote] = useState('');
  const [referenceId, setReferenceId] = useState(''); const [policyId, setPolicyId] = useState('');
  const [scopeConfirmed, setScopeConfirmed] = useState(false);
  const [mappingConfirmed, setMappingConfirmed] = useState(false);
  const [externalText, setExternalText] = useState(''); const [rightsBasis, setRightsBasis] = useState('');
  const [comparison, setComparison] = useState('');
  const load = useCallback(async () => {
    const r = await fetch('/api/admin/evidence-quality', { cache: 'no-store' });
    if (!r.ok) throw new Error('Evidence workspace unavailable. Check your session and database migration.');
    setData(await r.json());
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/evidence-quality', { signal: controller.signal, cache: 'no-store' })
      .then(async r => { if (!r.ok) throw new Error('Evidence workspace unavailable. Check your session and database migration.'); return r.json(); })
      .then(setData).catch(e => { if (e.name !== 'AbortError') setMessage(e.message); });
    return () => controller.abort();
  }, []);
  async function post(body: Record<string, unknown>) {
    setBusy(true); setMessage('');
    try {
      const r = await fetch('/api/admin/evidence-quality', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await r.json(); if (!r.ok) throw new Error(result.error || 'Request failed');
      if (body.action === 'compare') { setComparison(JSON.stringify(result, null, 2)); setExternalText(''); }
      else { await load(); setMessage(result.next || 'Review saved.'); }
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Request failed'); }
    finally { setBusy(false); }
  }
  async function inspect() {
    setEvidence(null); setClaim(''); setQuote(''); setComparison(''); setScopeConfirmed(false); setBusy(true);
    try {
      const r = await fetch(`/api/admin/evidence-quality?changeId=${encodeURIComponent(changeId)}`);
      if (!r.ok) throw new Error('Could not load the selected change'); setEvidence(await r.json());
    } catch (e) { setMessage(String(e)); } finally { setBusy(false); }
  }
  const disabled = busy || data?.role !== 'admin';
  const box = { display: 'grid', gap: 12, marginBlock: 24, maxWidth: 1000 } as const;
  return <main className={styles.workspace}>
    <h1>Evidence quality and external sources</h1>
    <p><Link href="/admin/dataset-quality">Dataset QA</Link> · <Link href="/admin/source-onboarding">Source onboarding</Link></p>
    <p>Review samples, investigate extraction differences and inspect the metadata-only EU pilot. External records never count as live checks.</p>
    <p role="status" aria-live="polite">{message}</p>
    <ReviewedEvidenceMetrics key={data ? JSON.stringify(data.changes) + message : 'initial'} />
    <section style={box}>
      <h2>Review a detected change</h2>
      <label>Recent change (latest 50)<select value={changeId} onChange={e => { setChangeId(e.target.value); setEvidence(null); }}>
        <option value="">Select a change</option>{data?.changes.map(c => <option key={c.id} value={c.id}>{c.policy.company.name} · {c.policy.name} · {c.id}</option>)}
      </select></label>
      <button type="button" disabled={!changeId || busy} onClick={inspect}>Load evidence</button>
      {evidence && <>
        <p>Evidence fingerprint: <code>{evidence.evidenceHash}</code></p>
        <details><summary>AI summaries and before/after source passages</summary>
          <h3>AI summary</h3><p style={{ whiteSpace: 'pre-wrap' }}>{evidence.change.aiSummaryEn}</p><p>{evidence.change.aiSummaryIt}</p>
          <h3>Before</h3><pre style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>{evidence.change.oldSnapshot?.text || 'No baseline'}</pre>
          <h3>After</h3><pre style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>{evidence.change.newSnapshot?.text || 'No snapshot'}</pre>
        </details>
        <label>Review metric<select value={metric} onChange={e => setMetric(e.target.value)}>
          <option value="substantive_change">Is this a substantive provider change?</option><option value="ai_citation">Does the source support this AI claim?</option>
        </select></label>
        <label>Verdict<select aria-label="Verdict" value={verdict} onChange={e => setVerdict(e.target.value)}>
          <option value="unassessed">Unassessed</option><option value="pass">Yes, supported</option><option value="fail">No, false positive / unsupported</option>
        </select></label>
        {metric === 'ai_citation' && <><label>Exact claim from the displayed AI summary<textarea maxLength={4000} value={claim} onChange={e => setClaim(e.target.value)} /></label>
          <label>Exact source passage (required for supported verdict)<textarea maxLength={4000} value={quote} onChange={e => setQuote(e.target.value)} /></label></>}
        <label>Review rationale<textarea maxLength={2000} value={note} onChange={e => setNote(e.target.value)} /></label>
        <button type="button" disabled={disabled || note.trim().length < 10} onClick={() => post({ changeId, evidenceHash: evidence.evidenceHash, metric, verdict, claim, quote, note })}>Save human review</button>
      </>}
    </section>
    <section style={box}>
      <h2>External extraction comparison</h2>
      <p>Load a change above. Use only a text you have a documented right to process. The comparison is transient; it does not import the text or change scores.</p>
      <label>External text<textarea maxLength={40000} value={externalText} onChange={e => setExternalText(e.target.value)} /></label>
      <label>Basis for processing this text<input maxLength={1000} value={rightsBasis} onChange={e => setRightsBasis(e.target.value)} /></label>
      <label><input type="checkbox" checked={scopeConfirmed} onChange={e => setScopeConfirmed(e.target.checked)} /> I checked equivalent service, document, language, jurisdiction and period.</label>
      <button type="button" disabled={disabled || !evidence || !scopeConfirmed || rightsBasis.trim().length < 10} onClick={() => post({ action: 'compare', changeId, evidenceHash: evidence?.evidenceHash, externalText, scopeConfirmed, rightsBasis })}>Compare without storing the external text</button>
      {comparison && <pre style={{ whiteSpace: 'pre-wrap' }}>{comparison}</pre>}
    </section>
    <section style={box}>
      <h2>EU discovery and historical references</h2><p>{data?.referenceScope}</p>
      <p>Imports run through the bounded operator command documented in the runbook. Mapping a reference does not publish a policy or certify its scope.</p>
      <label>Reference (latest 100)<select value={referenceId} onChange={e => { setReferenceId(e.target.value); setMappingConfirmed(false); }}>
        <option value="">Select a reference</option>{data?.references.map(r => <option key={r.id} value={r.id}>{r.service} · {r.title} · {r.recordedAt.slice(0, 10)} · {r.status}</option>)}
      </select></label>
      {data?.references.filter(r => r.id === referenceId).map(r => <div key={r.id}>
        <p><a href={r.referenceUrl} target="_blank" rel="noreferrer">Open archived version at its commit</a></p>
        <p>Recorded: {r.recordedAt}. Jurisdiction: {r.jurisdiction}. Effective date: unknown.</p>
        <p>Commit: <code>{r.commitSha}</code><br />Git blob ID: <code>{r.blobId}</code> (not a SHA-256 text hash)</p>
        <p>{r.license}. {r.attribution}</p>
      </div>)}
      <label>Existing PolicyWatcher document<select value={policyId} onChange={e => { setPolicyId(e.target.value); setMappingConfirmed(false); }}>
        <option value="">Select a document</option>{data?.policies.map(p => <option key={p.id} value={p.id}>{p.company.name} · {p.name} · {p.jurisdiction}</option>)}
      </select></label>
      <label>Mapping/rejection rationale<textarea maxLength={2000} value={referenceNote} onChange={e => setReferenceNote(e.target.value)} /></label>
      <label><input type="checkbox" checked={mappingConfirmed} onChange={e => setMappingConfirmed(e.target.checked)} /> I reviewed applicability of this mapping.</label>
      <div><button disabled={disabled || !referenceId || !policyId || !mappingConfirmed || referenceNote.trim().length < 10} onClick={() => post({ action: 'reference_review', id: referenceId, status: 'mapped', policyId, scopeConfirmed: mappingConfirmed, note: referenceNote })}>Map metadata</button>{' '}
        <button disabled={disabled || !referenceId || referenceNote.trim().length < 10} onClick={() => post({ action: 'reference_review', id: referenceId, status: 'rejected', note: referenceNote })}>Reject reference</button></div>
    </section>
    <section style={box}><h2>Recent extraction guard events (latest 50)</h2>
      <p>Missing historical input needs an explicit review. Requesting a new baseline preserves old evidence and requires a fresh live scan. It creates no provider-change event.</p>
      <label>Baseline review rationale<textarea maxLength={2000} value={baselineNote} onChange={e => setBaselineNote(e.target.value)} /></label>
      {data?.held.map((h, i) => <div key={`${h.policyId}-${i}`}><p>{h.policy.name}: {h.reason} · {h.checkedAt}</p>
        {['extraction_baseline_missing', 'extraction_replay_unavailable', 'extraction_replay_incomplete'].includes(h.reason) && <button disabled={disabled || baselineNote.trim().length < 10}
          onClick={() => post({ action: 'baseline_review', policyId: h.policyId, expectedHash: h.policy.currentHash, note: baselineNote })}>Request reviewed baseline on next live scan</button>}</div>)}
    </section>
  </main>;
}
