'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  Database,
  Download,
  ExternalLink,
  FileInput,
  Info,
  LoaderCircle,
  Play,
  RotateCw,
  Save,
  Trash2,
} from 'lucide-react';
import type { PublicChangeEventFeed } from '@/lib/publicChangeEvents';
import {
  EVENT_CONTINUITY_STORAGE_KEY,
  createEventContinuityCheckpoint,
  inspectEventContinuity,
  parseEventContinuityCheckpoint,
  serializeEventContinuityCheckpoint,
  type EventContinuityCheckpoint,
  type EventContinuityFinding,
  type EventContinuityReport,
} from '@/lib/eventContinuity';
import styles from './event-continuity.module.css';

type RequestState = 'idle' | 'loading' | 'success' | 'error';
type RequestMode = 'initial' | 'resume';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPublicChangeEventFeed(value: unknown): value is PublicChangeEventFeed {
  if (!isRecord(value) || !Array.isArray(value.events)) return false;
  if (typeof value.schemaVersion !== 'string' || (value.locale !== 'en' && value.locale !== 'it')) return false;
  if (typeof value.hasMore !== 'boolean' || typeof value.initialWindowTruncated !== 'boolean') return false;
  if (value.nextCursor !== null && typeof value.nextCursor !== 'string') return false;

  return value.events.every((event) => {
    if (!isRecord(event) || !isRecord(event.subject) || !isRecord(event.screening) || !isRecord(event.links)) return false;
    if (!isRecord(event.subject.company) || !isRecord(event.subject.policy)) return false;
    return typeof event.eventId === 'string'
      && typeof event.occurredAt === 'string'
      && Number.isFinite(Date.parse(event.occurredAt))
      && typeof event.subject.company.name === 'string'
      && typeof event.subject.policy.name === 'string'
      && typeof event.screening.overallRisk === 'string'
      && typeof event.links.evidence === 'string';
  });
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }).format(date) + ' UTC'
    : value;
}

function findingIcon(finding: EventContinuityFinding) {
  if (finding.severity === 'error') return <AlertTriangle size={17} aria-hidden="true" />;
  if (finding.severity === 'warning') return <AlertTriangle size={17} aria-hidden="true" />;
  return <Info size={17} aria-hidden="true" />;
}

function yesNo(value: boolean): string {
  return value ? 'Yes' : 'No';
}

export default function EventContinuityClient() {
  const [requestState, setRequestState] = useState<RequestState>('idle');
  const [requestMode, setRequestMode] = useState<RequestMode>('initial');
  const [feed, setFeed] = useState<PublicChangeEventFeed | null>(null);
  const [report, setReport] = useState<EventContinuityReport | null>(null);
  const [candidateCheckpoint, setCandidateCheckpoint] = useState<EventContinuityCheckpoint | null>(null);
  const [checkpoint, setCheckpoint] = useState<EventContinuityCheckpoint | null>(null);
  const [announcement, setAnnouncement] = useState('No feed request has run.');
  const [errorMessage, setErrorMessage] = useState('');
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [copyLabel, setCopyLabel] = useState('Copy cursor');
  const requestLock = useRef(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const raw = window.localStorage.getItem(EVENT_CONTINUITY_STORAGE_KEY);
        if (!raw) return;
        const parsed = parseEventContinuityCheckpoint(raw);
        if (!parsed) {
          window.localStorage.removeItem(EVENT_CONTINUITY_STORAGE_KEY);
          setAnnouncement('An invalid local checkpoint was removed. No request was sent.');
          return;
        }
        setCheckpoint(parsed);
        setAnnouncement(`Local checkpoint loaded from ${formatTimestamp(parsed.savedAt)}.`);
      } catch {
        setAnnouncement('Browser storage is unavailable. You can still inspect the public feed.');
      }
    });
    return () => { active = false; };
  }, []);

  const requestFeed = async (mode: RequestMode) => {
    if (requestLock.current) return;
    if (mode === 'resume' && !checkpoint?.cursor) {
      setAnnouncement('Resume requires a valid local checkpoint cursor.');
      return;
    }

    requestLock.current = true;
    setRequestState('loading');
    setRequestMode(mode);
    setErrorMessage('');
    setShowAllEvents(false);
    setCopyLabel('Copy cursor');
    setAnnouncement(mode === 'resume' ? 'Requesting a resumed public event window.' : 'Requesting the current public event window.');

    const parameters = new URLSearchParams({ limit: '25', lang: 'en' });
    if (mode === 'resume' && checkpoint?.cursor) parameters.set('cursor', checkpoint.cursor);

    try {
      const response = await fetch(`/api/v1/change-events?${parameters.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'omit',
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const detail = isRecord(payload) && typeof payload.error === 'string'
          ? payload.error
          : `The public feed returned HTTP ${response.status}.`;
        throw new Error(detail);
      }
      if (!isPublicChangeEventFeed(payload)) throw new Error('The public feed response does not match the expected event shape.');

      const previousCheckpoint = mode === 'resume' ? checkpoint : null;
      const nextReport = inspectEventContinuity(payload, previousCheckpoint);
      const nextCheckpoint = createEventContinuityCheckpoint(payload, previousCheckpoint);
      setFeed(payload);
      setReport(nextReport);
      setCandidateCheckpoint(nextCheckpoint);
      setRequestState('success');
      setAnnouncement(
        `${mode === 'resume' ? 'Resumed' : 'Initial'} window inspected: ${nextReport.metrics.received} events, ${nextReport.findings.length} findings.`,
      );
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'The public feed request failed.';
      setRequestState('error');
      setErrorMessage(detail);
      setAnnouncement(`Request failed. ${detail} No automatic retry was attempted.`);
    } finally {
      requestLock.current = false;
    }
  };

  const saveCheckpoint = () => {
    if (!candidateCheckpoint) return;
    try {
      const serialized = serializeEventContinuityCheckpoint(candidateCheckpoint);
      window.localStorage.setItem(EVENT_CONTINUITY_STORAGE_KEY, serialized);
      setCheckpoint(candidateCheckpoint);
      setAnnouncement(`Checkpoint saved only in this browser at ${formatTimestamp(candidateCheckpoint.savedAt)}.`);
    } catch {
      setAnnouncement('The browser could not save this checkpoint. The feed result remains visible.');
    }
  };

  const clearCheckpoint = () => {
    try {
      window.localStorage.removeItem(EVENT_CONTINUITY_STORAGE_KEY);
    } catch {
      // The in-memory checkpoint is still cleared when browser storage is unavailable.
    }
    setCheckpoint(null);
    setAnnouncement('The browser-local checkpoint was cleared.');
  };

  const downloadCheckpoint = () => {
    if (!checkpoint) return;
    const blob = new Blob([serializeEventContinuityCheckpoint(checkpoint)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `policywatcher-event-checkpoint-${checkpoint.savedAt.slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setAnnouncement('Checkpoint JSON downloaded from this browser.');
  };

  const copyCursor = async () => {
    if (!checkpoint?.cursor) return;
    try {
      await navigator.clipboard.writeText(checkpoint.cursor);
      setCopyLabel('Cursor copied');
      setAnnouncement('The opaque checkpoint cursor was copied.');
    } catch {
      setCopyLabel('Copy unavailable');
      setAnnouncement('Clipboard access is unavailable in this browser context.');
    }
  };

  const importCheckpoint = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 16_384) {
      setAnnouncement('Checkpoint import rejected: the file exceeds 16 KB.');
      input.value = '';
      return;
    }
    try {
      const parsed = parseEventContinuityCheckpoint(await file.text());
      if (!parsed) {
        setAnnouncement('Checkpoint import rejected: the JSON does not match the strict public checkpoint schema.');
        return;
      }
      window.localStorage.setItem(EVENT_CONTINUITY_STORAGE_KEY, serializeEventContinuityCheckpoint(parsed));
      setCheckpoint(parsed);
      setAnnouncement(`Checkpoint imported and saved only in this browser. Cursor date: ${formatTimestamp(parsed.savedAt)}.`);
    } catch {
      setAnnouncement('Checkpoint import failed. No existing local checkpoint was changed.');
    } finally {
      input.value = '';
    }
  };

  const statusTone = report?.status === 'clear' ? 'clean' : report?.status === 'attention' ? 'warning' : 'neutral';
  const events = feed?.events ?? [];
  const visibleEvents = showAllEvents ? events : events.slice(0, 12);
  const hasCheckpointCursor = Boolean(checkpoint?.cursor);

  return (
    <div className={styles.workbench}>
      <div className={styles.checkpointRail} aria-label="Checkpoint sequence">
        <div className={styles.railStep} data-state={requestState === 'success' && requestMode === 'initial' ? 'active' : 'idle'}>
          <span>01</span>
          <span><small>Request state</small><strong>Initial window</strong></span>
        </div>
        <i className={styles.railRule} aria-hidden="true" />
        <div className={styles.railStep} data-state={checkpoint ? 'active' : candidateCheckpoint ? 'ready' : 'idle'}>
          <span>02</span>
          <span><small>Browser state</small><strong>{checkpoint ? 'Local checkpoint saved' : candidateCheckpoint ? 'Checkpoint ready' : 'No checkpoint'}</strong></span>
        </div>
        <i className={styles.railRule} aria-hidden="true" />
        <div className={styles.railStep} data-state={requestState === 'success' && requestMode === 'resume' ? 'active' : hasCheckpointCursor ? 'ready' : 'idle'}>
          <span>03</span>
          <span><small>Next request</small><strong>{requestState === 'success' && requestMode === 'resume' ? 'Resumed window' : hasCheckpointCursor ? 'Resume available' : 'Waiting for checkpoint'}</strong></span>
        </div>
      </div>

      <div className={styles.controlStrip}>
        <div className={styles.controlContext}>
          <span>Explicit requests only</span>
          <strong>{requestState === 'loading' ? 'Feed request in progress' : 'Choose a polling position'}</strong>
          <p>No automatic fetch, retry, polling interval or push delivery runs from this page.</p>
        </div>
        <div className={styles.controlActions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => void requestFeed('initial')}
            disabled={requestState === 'loading'}
          >
            {requestState === 'loading' && requestMode === 'initial'
              ? <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" />
              : <Play size={16} aria-hidden="true" />}
            Inspect current window
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => void requestFeed('resume')}
            disabled={requestState === 'loading' || !hasCheckpointCursor}
          >
            {requestState === 'loading' && requestMode === 'resume'
              ? <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" />
              : <RotateCw size={16} aria-hidden="true" />}
            Resume from checkpoint
          </button>
        </div>
      </div>

      <p className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">{announcement}</p>

      {requestState === 'idle' && (
        <div className={styles.emptyState}>
          <Activity size={24} aria-hidden="true" />
          <div>
            <h3>No event window has been requested.</h3>
            <p>Inspect the current window to establish an observation, or import a valid checkpoint below and explicitly resume from its opaque cursor.</p>
          </div>
        </div>
      )}

      {requestState === 'loading' && (
        <div className={styles.emptyState} aria-hidden="true">
          <LoaderCircle className={styles.spinner} size={24} />
          <div><h3>Inspecting the public feed</h3><p>The current request will produce one bounded window. It will not retry automatically.</p></div>
        </div>
      )}

      {requestState === 'error' && (
        <div className={styles.errorState}>
          <AlertTriangle size={22} aria-hidden="true" />
          <div><h3>Feed request did not complete</h3><p>{errorMessage} No automatic retry was attempted; review the response before trying again.</p></div>
        </div>
      )}

      {requestState === 'success' && report && feed && (
        <div className={styles.resultsGrid}>
          <section className={styles.reportPanel} aria-labelledby="report-heading">
            <header className={styles.panelHeader}>
              <div><span>Continuity report</span><h3 id="report-heading">Observed window signals</h3></div>
              <span className={styles.statusBadge} data-tone={statusTone}>
                {report.status === 'clear' && <CheckCircle2 size={14} aria-hidden="true" />}
                {report.status === 'attention' && <AlertTriangle size={14} aria-hidden="true" />}
                {report.status === 'empty' && <Info size={14} aria-hidden="true" />}
                {report.status}
              </span>
            </header>

            <dl className={styles.metricGrid}>
              <div><dt>Received</dt><dd>{report.metrics.received}</dd></div>
              <div><dt>Unique</dt><dd>{report.metrics.unique}</dd></div>
              <div><dt>Duplicates</dt><dd>{report.metrics.duplicates}</dd></div>
              <div><dt>Prior overlap</dt><dd>{report.metrics.crossWindowDuplicates}</dd></div>
              <div><dt>Chronological</dt><dd>{yesNo(report.metrics.orderedChronologically)}</dd></div>
              <div><dt>Has more</dt><dd>{yesNo(report.metrics.hasMore)}</dd></div>
              <div><dt>Initial truncated</dt><dd>{yesNo(report.metrics.initialWindowTruncated)}</dd></div>
              <div><dt>Checkpoint compared</dt><dd>{yesNo(report.metrics.resumedFromCheckpoint)}</dd></div>
            </dl>

            <div className={styles.findings}>
              <h4>Findings · {report.findings.length}</h4>
              <ul>
                {report.findings.length === 0 && (
                  <li className={styles.finding}>
                    <CheckCircle2 size={17} aria-hidden="true" />
                    <div><strong>No local continuity finding</strong><p>This returned window contains no duplicate or ordering signal. This is not proof of exhaustive monitoring.</p></div>
                  </li>
                )}
                {report.findings.map((finding) => (
                  <li key={finding.code} className={styles.finding} data-severity={finding.severity}>
                    {findingIcon(finding)}
                    <div><strong>{finding.title}</strong><p>{finding.detail}</p></div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className={styles.ledgerPanel} aria-labelledby="ledger-heading">
            <header className={styles.panelHeader}>
              <div><span>Event ledger</span><h3 id="ledger-heading">{events.length} published event{events.length === 1 ? '' : 's'}</h3></div>
              <Database size={20} aria-hidden="true" />
            </header>

            {events.length === 0 ? (
              <div className={styles.emptyState}>
                <Info size={21} aria-hidden="true" />
                <div><h3>No new public events</h3><p>Retain the cursor and poll again later. An empty window does not indicate whether external sources changed.</p></div>
              </div>
            ) : (
              <div className={styles.ledgerTable} role="region" aria-label="Public event ledger" tabIndex={0}>
                <table>
                  <thead><tr><th>Event ID</th><th>Occurred</th><th>Subject</th><th>Risk</th><th>Evidence</th></tr></thead>
                  <tbody>
                    {visibleEvents.map((event) => (
                      <tr key={`${event.eventId}-${event.occurredAt}`}>
                        <th scope="row">{event.eventId}</th>
                        <td data-label="Occurred"><time dateTime={event.occurredAt}>{formatTimestamp(event.occurredAt)}</time></td>
                        <td data-label="Subject"><strong>{event.subject.company.name}</strong><small>{event.subject.policy.name}</small></td>
                        <td data-label="Risk"><span className={styles.riskLabel} data-risk={event.screening.overallRisk.toLowerCase()}>{event.screening.overallRisk}</span></td>
                        <td data-label="Evidence"><a href={event.links.evidence} target="_blank" rel="noreferrer">Open <ExternalLink size={13} aria-hidden="true" /></a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {events.length > 12 && (
              <button type="button" className={styles.showMoreButton} onClick={() => setShowAllEvents((value) => !value)}>
                {showAllEvents ? 'Show first 12 events' : `Show all ${events.length} events`}
              </button>
            )}
          </section>
        </div>
      )}

      <section className={styles.checkpointPanel} aria-labelledby="checkpoint-heading">
        <header>
          <div>
            <span>Browser-local checkpoint</span>
            <strong id="checkpoint-heading">{checkpoint ? `Saved ${formatTimestamp(checkpoint.savedAt)}` : candidateCheckpoint ? 'Latest window is ready to save' : 'No checkpoint saved'}</strong>
            <p>No checkpoint content is sent anywhere. Only its opaque cursor is used when you explicitly choose resume.</p>
          </div>
          <div className={styles.checkpointActions}>
            <button type="button" className={styles.quietButton} onClick={saveCheckpoint} disabled={!candidateCheckpoint}>
              <Save size={15} aria-hidden="true" /> Save latest
            </button>
            <button type="button" className={styles.quietButton} onClick={() => void copyCursor()} disabled={!hasCheckpointCursor}>
              <Clipboard size={15} aria-hidden="true" /> {copyLabel}
            </button>
            <button type="button" className={styles.quietButton} onClick={downloadCheckpoint} disabled={!checkpoint}>
              <Download size={15} aria-hidden="true" /> Download JSON
            </button>
            <label className={styles.fileButton}>
              <FileInput size={15} aria-hidden="true" /> Import JSON
              <input type="file" accept="application/json,.json" onChange={(event) => void importCheckpoint(event)} />
            </label>
            <button type="button" className={styles.quietButton} onClick={clearCheckpoint} disabled={!checkpoint}>
              <Trash2 size={15} aria-hidden="true" /> Clear
            </button>
          </div>
        </header>
        {checkpoint?.cursor && (
          <div className={styles.checkpointCode}>
            <span>Opaque cursor</span>
            <code title={checkpoint.cursor}>{checkpoint.cursor}</code>
          </div>
        )}
      </section>
    </div>
  );
}
