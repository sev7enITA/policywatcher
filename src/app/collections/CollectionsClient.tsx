'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDown,
  ArrowDownToLine,
  ArrowRight,
  ArrowUp,
  Braces,
  Check,
  ClipboardCheck,
  ClipboardCopy,
  FileJson2,
  FileText,
  FolderSearch2,
  Link2,
  ListChecks,
  LockKeyhole,
  Search,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { POLICYWATCHER_VERSION_DISPLAY } from '@/lib/release';
import {
  EVIDENCE_COLLECTION_EVENT,
  EVIDENCE_COLLECTION_LIMIT,
  EVIDENCE_COLLECTION_STORAGE_KEY,
  parseLocalEvidenceCollection,
  type CollectionReviewState,
  type LocalEvidenceCollection,
} from '@/components/AddToCollectionButton';
import styles from './collections.module.css';

interface EvidenceSummary {
  id: string;
  createdAt: string;
  overallRisk: string;
  overallScore: number;
  summary: string | null;
  sourceState: string;
  policy: {
    id: string;
    name: string;
    type: string;
    jurisdiction: string;
    dataStatus: string;
    company: { name: string; slug: string; industry: string };
  };
}

interface CollectionsClientProps {
  records: EvidenceSummary[];
  initialSelectedIds: string[];
  hasSharedSelection: boolean;
  sharedSelectionError: string;
  unavailableSharedCount: number;
  catalogUnavailable: boolean;
}

const reviewLabels: Record<CollectionReviewState, string> = {
  unreviewed: 'Unreviewed',
  reviewing: 'In review',
  reviewed: 'Reviewed locally',
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(date);
}

function canonicalIds(ids: readonly string[]): string[] {
  return [...new Set(ids.map((id) => id.toLowerCase()))].sort();
}

export default function CollectionsClient({
  records,
  initialSelectedIds,
  hasSharedSelection,
  sharedSelectionError,
  unavailableSharedCount,
  catalogUnavailable,
}: CollectionsClientProps) {
  const recordById = useMemo(() => new Map(records.map((record) => [record.id.toLowerCase(), record])), [records]);
  const [selectedIds, setSelectedIds] = useState(() => canonicalIds(initialSelectedIds));
  const [title, setTitle] = useState('');
  const [reviewStates, setReviewStates] = useState<Record<string, CollectionReviewState>>({});
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const hydrated = useRef(false);
  const registerRef = useRef<HTMLElement>(null);
  const ledgerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      let stored: LocalEvidenceCollection | null = null;
      try {
        stored = parseLocalEvidenceCollection(localStorage.getItem(EVIDENCE_COLLECTION_STORAGE_KEY));
      } catch {
        setStorageAvailable(false);
      }

      const availableIds = new Set(recordById.keys());
      const nextIds = hasSharedSelection
        ? canonicalIds(initialSelectedIds)
        : canonicalIds((stored?.selectedIds ?? []).filter((id) => availableIds.has(id)));
      const nextStates: Record<string, CollectionReviewState> = {};
      for (const id of nextIds) nextStates[id] = stored?.reviewStates[id] ?? 'unreviewed';

      setSelectedIds(nextIds);
      setTitle(stored?.title ?? '');
      setReviewStates(nextStates);
      hydrated.current = true;

      if (hasSharedSelection && !sharedSelectionError && unavailableSharedCount === 0) {
        setMessage('Shared public change IDs loaded. Your local title and review states were not included in the link.');
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hasSharedSelection, initialSelectedIds, recordById, sharedSelectionError, unavailableSharedCount]);

  useEffect(() => {
    if (!hydrated.current || !storageAvailable) return;
    const payload: LocalEvidenceCollection = {
      version: 1,
      title: title.slice(0, 80),
      selectedIds: canonicalIds(selectedIds).slice(0, EVIDENCE_COLLECTION_LIMIT),
      reviewStates,
    };
    try {
      localStorage.setItem(EVIDENCE_COLLECTION_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      window.setTimeout(() => setStorageAvailable(false), 0);
    }
  }, [reviewStates, selectedIds, storageAvailable, title]);

  useEffect(() => {
    function syncFromStorage() {
      if (!hydrated.current) return;
      try {
        const stored = parseLocalEvidenceCollection(localStorage.getItem(EVIDENCE_COLLECTION_STORAGE_KEY));
        if (!stored) return;
        const ids = stored.selectedIds.filter((id) => recordById.has(id));
        setSelectedIds(ids);
        setTitle(stored.title);
        setReviewStates(stored.reviewStates);
      } catch {
        setStorageAvailable(false);
      }
    }
    window.addEventListener(EVIDENCE_COLLECTION_EVENT, syncFromStorage);
    return () => window.removeEventListener(EVIDENCE_COLLECTION_EVENT, syncFromStorage);
  }, [recordById]);

  const selectedRecords = selectedIds.map((id) => recordById.get(id)).filter((record): record is EvidenceSummary => Boolean(record));
  const filteredRecords = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('en');
    if (!term) return records;
    return records.filter((record) => [
      record.policy.company.name,
      record.policy.company.industry,
      record.policy.name,
      record.policy.jurisdiction,
      record.summary ?? '',
    ].some((value) => value.toLocaleLowerCase('en').includes(term)));
  }, [query, records]);

  const sortedIds = canonicalIds(selectedIds);
  const changesParam = sortedIds.join(',');
  const exportBase = `/api/v1/evidence-collections?changes=${encodeURIComponent(changesParam)}`;
  const atLimit = selectedIds.length >= EVIDENCE_COLLECTION_LIMIT;
  const reviewedCount = selectedIds.filter((id) => reviewStates[id] === 'reviewed').length;

  function toggleRecord(id: string) {
    const normalizedId = id.toLowerCase();
    if (selectedIds.includes(normalizedId)) {
      setSelectedIds((current) => current.filter((value) => value !== normalizedId));
      setReviewStates((current) => {
        const next = { ...current };
        delete next[normalizedId];
        return next;
      });
      setMessage('Change removed from the local collection.');
      return;
    }
    if (atLimit) {
      setMessage(`The ${EVIDENCE_COLLECTION_LIMIT}-record collection limit has been reached.`);
      return;
    }
    setSelectedIds((current) => [...current, normalizedId]);
    setReviewStates((current) => ({ ...current, [normalizedId]: 'unreviewed' }));
    setMessage('Public change added to the local collection.');
  }

  async function copyShareLink() {
    if (sortedIds.length === 0) return;
    const url = new URL('/collections', window.location.origin);
    url.searchParams.set('changes', changesParam);
    try {
      await navigator.clipboard.writeText(url.toString());
      setMessage('Share link copied. It contains public change IDs only; local title and review states are excluded.');
    } catch {
      setMessage(`Copy unavailable. Use this ID-only URL: ${url.toString()}`);
    }
  }

  function resetCollection() {
    if (!confirmReset) {
      setConfirmReset(true);
      setMessage('Confirm reset to clear this browser-local collection only.');
      return;
    }
    try {
      localStorage.removeItem(EVIDENCE_COLLECTION_STORAGE_KEY);
    } catch {
      setStorageAvailable(false);
    }
    setSelectedIds([]);
    setTitle('');
    setReviewStates({});
    setConfirmReset(false);
    setMessage('Local collection cleared. No public evidence records were changed.');
  }

  function moveTo(target: 'register' | 'ledger') {
    const element = target === 'register' ? registerRef.current : ledgerRef.current;
    if (!element) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    window.requestAnimationFrame(() => element.focus({ preventScroll: true }));
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.heroMeta}><span>Public evidence utility</span><span>Browser-local review state</span></div>
          <div className={styles.heroGrid}>
            <div>
              <p className={styles.kicker}>PolicyWatcher {POLICYWATCHER_VERSION_DISPLAY}</p>
              <h1>Shareable Evidence Collections</h1>
              <p className={styles.lead}>Select up to 12 exact public changes, record a local review state, and export one deterministic evidence bundle.</p>
            </div>
            <aside className={styles.scopeNote}>
              <strong><LockKeyhole size={16} aria-hidden="true" /> Local and bounded</strong>
              <p>Title and review states stay in this browser. Shared links and export requests contain canonical public change IDs only.</p>
            </aside>
          </div>
        </header>

        <ol className={styles.contractStrip} aria-label="Collection workflow">
          <li><span>01</span><FolderSearch2 size={19} aria-hidden="true" /><strong>Select public records</strong></li>
          <li><span>02</span><ListChecks size={19} aria-hidden="true" /><strong>Review locally</strong></li>
          <li><span>03</span><ArrowDownToLine size={19} aria-hidden="true" /><strong>Share IDs or export</strong></li>
        </ol>

        {(sharedSelectionError || unavailableSharedCount > 0 || !storageAvailable) && (
          <div className={styles.warning} role="status">
            <AlertTriangle size={18} aria-hidden="true" />
            <p>
              {sharedSelectionError || (unavailableSharedCount > 0
                ? `${unavailableSharedCount} shared ID${unavailableSharedCount === 1 ? '' : 's'} did not resolve to a currently available public record. None were loaded, preserving the exact shared scope.`
                : 'Browser storage is unavailable. Selection still works for this page; use ID-only links to reopen a record.')}
            </p>
          </div>
        )}

        <div className={styles.workbench}>
          <section ref={registerRef} className={styles.register} aria-labelledby="register-title" tabIndex={-1}>
            <div className={styles.sectionHead}>
              <div><p className={styles.kicker}>Evidence register</p><h2 id="register-title">Available public changes</h2></div>
              <span>{filteredRecords.length} shown</span>
            </div>
            {selectedIds.length > 0 && (
              <button type="button" className={styles.mobileLedgerJump} onClick={() => moveTo('ledger')} aria-controls="collection-ledger">
                View collection · {selectedIds.length}/{EVIDENCE_COLLECTION_LIMIT}
                <ArrowDown size={17} aria-hidden="true" />
              </button>
            )}
            {!catalogUnavailable && records.length > 0 && (
              <label className={styles.searchBox}>
                <Search size={18} aria-hidden="true" />
                <span className={styles.srOnly}>Search public evidence records</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Company, policy, jurisdiction or summary" />
              </label>
            )}

            {catalogUnavailable ? (
              <div className={styles.emptyState} role="status"><AlertTriangle size={22} /><h3>Evidence catalog temporarily unavailable</h3><p>The public register could not be loaded. Existing evidence has not been changed.</p></div>
            ) : records.length === 0 ? (
              <div className={styles.emptyState}>
                <FolderSearch2 size={22} aria-hidden="true" />
                <h3>No public evidence records available</h3>
                <p role="status">Records appear only after the public-evidence gate is satisfied.</p>
                <nav aria-label="Evidence register guidance">
                  <Link href="/evidence">Open Evidence Packets <ArrowRight size={14} aria-hidden="true" /></Link>
                  <Link href="/methodology/confidence">Read publication methodology <ArrowRight size={14} aria-hidden="true" /></Link>
                </nav>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className={styles.emptyState} role="status"><Search size={22} /><h3>No records match this search</h3><p>Change the company, policy, jurisdiction or summary terms.</p></div>
            ) : (
              <ol className={styles.registerList}>
                {filteredRecords.map((record, index) => {
                  const selected = selectedIds.includes(record.id.toLowerCase());
                  return (
                    <li key={record.id} data-selected={selected ? 'true' : 'false'}>
                      <div className={styles.rowNumber}>{String(index + 1).padStart(2, '0')}</div>
                      <label className={styles.selectControl}>
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={!selected && atLimit}
                          onChange={() => toggleRecord(record.id)}
                        />
                        <span>{selected ? 'Selected' : atLimit ? 'Limit reached' : 'Select'}</span>
                      </label>
                      <article>
                        <div className={styles.recordTopline}><span>{formatDate(record.createdAt)}</span><span>{record.policy.jurisdiction}</span><span>{record.overallRisk} · {record.overallScore}/10</span></div>
                        <h3>{record.policy.company.name}</h3>
                        <p className={styles.policyName}>{record.policy.name}</p>
                        <p className={styles.summary}>{record.summary || 'No public summary recorded.'}</p>
                        <code title={record.id}>{record.id}</code>
                        <nav aria-label={`Record links for ${record.policy.company.name}`}>
                          <Link href={`/evidence/${record.id}`}>Evidence packet <ArrowRight size={14} /></Link>
                          <Link href={`/change/${record.id}`}>Original change <ArrowRight size={14} /></Link>
                        </nav>
                      </article>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <aside ref={ledgerRef} id="collection-ledger" className={styles.ledger} aria-labelledby="ledger-title" tabIndex={-1}>
            <button type="button" className={styles.mobileRegisterJump} onClick={() => moveTo('register')}>
              <ArrowUp size={17} aria-hidden="true" />
              Back to evidence register
            </button>
            <div className={styles.ledgerHead}>
              <div><p className={styles.kicker}>Collection ledger</p><h2 id="ledger-title">{selectedIds.length} / {EVIDENCE_COLLECTION_LIMIT} records</h2></div>
              <span>{reviewedCount} reviewed</span>
            </div>

            {(selectedRecords.length > 0 || title) && (
              <label className={styles.titleField}>
                <span>Local collection title</span>
                <input value={title} maxLength={80} onChange={(event) => setTitle(event.target.value)} placeholder="Untitled local collection" />
                <small>Stored only in this browser · {title.length}/80</small>
              </label>
            )}

            {atLimit && <p className={styles.limitNote}><AlertTriangle size={15} /> Maximum selection reached. Remove one record to add another.</p>}

            {selectedRecords.length === 0 ? (
              <div className={styles.ledgerEmpty}><FolderSearch2 size={22} aria-hidden="true" /><strong>No selected records</strong><p>Select a public change in the evidence register to create share and export controls.</p></div>
            ) : (
              <ol className={styles.selectedList}>
                {selectedRecords.map((record, index) => (
                  <li key={record.id}>
                    <span className={styles.provenanceIndex}>{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <strong>{record.policy.company.name}</strong>
                      <p>{record.policy.name}</p>
                      <code>{record.id}</code>
                      <label>
                        <span>Local review state</span>
                        <select
                          value={reviewStates[record.id] ?? 'unreviewed'}
                          onChange={(event) => setReviewStates((current) => ({
                            ...current,
                            [record.id]: event.target.value as CollectionReviewState,
                          }))}
                        >
                          {Object.entries(reviewLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      </label>
                      <button type="button" onClick={() => toggleRecord(record.id)}>Remove</button>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {selectedRecords.length > 0 && (
              <>
                <div className={styles.digestRail}>
                  <Braces size={18} aria-hidden="true" />
                  <div><span>Deterministic bundle digest</span><code>Generated by the export endpoint from exact packet content</code></div>
                </div>

                <div className={styles.actions}>
                  <button type="button" onClick={copyShareLink}><ClipboardCopy size={16} aria-hidden="true" /> Copy share link</button>
                  <div className={styles.exportGrid}>
                    <a href={`${exportBase}&format=json`}><FileJson2 size={15} aria-hidden="true" /> JSON</a>
                    <a href={`${exportBase}&format=markdown`}><FileText size={15} aria-hidden="true" /> Markdown</a>
                    <a href={`${exportBase}&format=csv`}><ArrowDownToLine size={15} aria-hidden="true" /> CSV</a>
                    <a href={`${exportBase}&format=handoff`}><ClipboardCheck size={15} aria-hidden="true" /> Review handoff</a>
                  </div>
                  <p><Link2 size={14} aria-hidden="true" /> Shared links and handoff files contain public change IDs only. Local title, statuses, assignees and due dates are excluded.</p>
                  <button type="button" className={styles.resetButton} onClick={resetCollection}>
                    {confirmReset ? <Check size={16} aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
                    {confirmReset ? 'Confirm local reset' : 'Reset local collection'}
                  </button>
                  {confirmReset && <button type="button" className={styles.cancelReset} onClick={() => setConfirmReset(false)}>Cancel reset</button>}
                </div>
              </>
            )}
            {selectedRecords.length === 0 && title && (
              <div className={styles.orphanActions}>
                <p>The local title remains in this browser. Reset it when it is no longer needed.</p>
                <button type="button" className={styles.resetButton} onClick={resetCollection}>
                  {confirmReset ? <Check size={16} aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
                  {confirmReset ? 'Confirm local reset' : 'Reset local collection'}
                </button>
                {confirmReset && <button type="button" className={styles.cancelReset} onClick={() => setConfirmReset(false)}>Cancel reset</button>}
              </div>
            )}
            {message && <p className={styles.feedback} role="status" aria-live="polite">{message}</p>}
          </aside>
        </div>

        <section className={styles.boundary} aria-labelledby="boundary-title">
          <div><p className={styles.kicker}>Integration boundary</p><h2 id="boundary-title">Portable evidence data, with explicit limits.</h2></div>
          <dl>
            <div><dt>Included</dt><dd>Exact public change IDs, bounded evidence records, packet digests and review questions.</dd></div>
            <div><dt>Local only</dt><dd>Your collection title and per-record review state.</dd></div>
            <div><dt>Not included</dt><dd>Jira, Confluence or Teams delivery; persistent multi-user collaboration; comments, accounts or ACLs.</dd></div>
            <div><dt>Not a verdict</dt><dd>The bundle is not a compliance report, legal advice or exhaustive market coverage.</dd></div>
          </dl>
          <nav><Link href="/developers">Developer endpoint <ArrowRight size={14} /></Link><Link href="/integrations">Integration options <ArrowRight size={14} /></Link></nav>
        </section>
      </div>
    </main>
  );
}
