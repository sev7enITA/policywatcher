'use client';

import { useId, useState } from 'react';
import { AlertTriangle, ChevronDown, Eye, ShieldCheck } from 'lucide-react';
import { presentShadowEvidence, SHADOW_COMPARISON_OUTCOMES } from '@/lib/adaptiveAcquisition/presentation';
import styles from './AdaptiveAcquisitionPanel.module.css';

export interface AdaptiveEvidenceRun {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  metrics?: unknown;
}

const STATES = {
  shadow: { label: 'Shadow observation', description: 'Candidate recipes run alongside the active scraper when an acquisition is eligible. Results remain review evidence.' },
  disabled: { label: 'Observer disabled', description: 'Shadow observation was disabled for this run. No candidate evidence was collected by this observer.' },
  configuration_error: { label: 'Configuration unavailable', description: 'The observer could not start with its configuration. This does not describe the outcome of the baseline scan.' },
  unrecorded: { label: 'No recorded shadow summary', description: 'This run has no shadow summary. Historical or missing metrics do not establish whether the observer was enabled or whether errors occurred.' },
  invalid: { label: 'Shadow evidence unavailable', description: 'The stored summary is incomplete in format or inconsistent. Its counters cannot be shown reliably.' },
} as const;

function scanState(value: string) {
  if (value === 'completed') return { label: 'Scan completed', tone: 'complete' };
  if (value === 'failed') return { label: 'Scan failed', tone: 'failed' };
  if (value === 'running') return { label: 'Scan running', tone: 'running' };
  if (value === 'cancelled' || value === 'canceled') return { label: 'Scan cancelled', tone: 'neutral' };
  return { label: 'Scan status unavailable', tone: 'neutral' };
}

function date(value: string | null) {
  if (!value) return 'Not recorded';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Not recorded' : new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium', timeStyle: 'short',
  }).format(parsed);
}

function number(value: number | null) {
  return value === null ? 'Not recorded' : new Intl.NumberFormat('en-GB').format(value);
}

export function AdaptiveAcquisitionPanel({ runs, refreshing = false }: { runs: AdaptiveEvidenceRun[]; refreshing?: boolean }) {
  const id = useId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const run = runs.find(({ id: runId }) => runId === selectedId) ?? runs[0];
  const evidence = presentShadowEvidence(run?.metrics);
  const state = STATES[evidence.state];
  const scan = run ? scanState(run.status) : null;
  const { counts } = evidence;
  const diagnostics = [
    ['budgetSkipped', 'Observation budget reached', 'Acquisitions skipped after the configured observation limit.'],
    ['outOfScope', 'Acquisitions outside allowlist', 'Baseline acquisitions that were not eligible for shadow observation.'],
    ['noCapture', 'No live capture', 'Attempts with no live response available for replay.'],
    ['unmatchedProductionCaptures', 'No exact capture match', 'Captured responses could not be matched to the production result.'],
    ['baselineMismatches', 'Baseline disagreements', 'Frozen replay and the production result disagreed.'],
  ] as const;

  return (
    <section className={styles.panel} aria-labelledby={`${id}-title`} aria-busy={refreshing}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Acquisition evidence</span>
          <h2 id={`${id}-title`}>Adaptive acquisition</h2>
          <p>Inspect the observer without changing the active scraper.</p>
        </div>
        <span className={styles.readOnly}><Eye size={15} aria-hidden="true" /> Read-only</span>
      </header>

      {!run ? <p className={styles.empty}>No scan runs are available. Shadow evidence will appear here when a run records it.</p> : (
        <>
          <div className={styles.runBar}>
            <div className={styles.runControl}>
              <label htmlFor={`${id}-run`}>Scan run</label>
              <select id={`${id}-run`} value={run.id} onChange={(event) => setSelectedId(event.target.value)} disabled={refreshing}>
                {runs.map((item) => <option key={item.id} value={item.id}>{date(item.startedAt)} · {scanState(item.status).label}</option>)}
              </select>
            </div>
            <div className={styles.runStatus}>
              <span className={styles.scanBadge} data-tone={scan?.tone}>{scan?.label}</span>
              <span>{run.status === 'running' ? 'Started' : 'Ended'} {date(run.status === 'running' ? run.startedAt : run.completedAt)}</span>
            </div>
          </div>

          <div key={run.id} className={styles.runEvidence} aria-live="polite" aria-atomic="true">
            <div className={styles.mode} data-warning={evidence.state === 'invalid' || evidence.state === 'configuration_error'}>
              <span className={styles.modeMarker} aria-hidden="true" />
              <div><h3>{state.label}</h3><p>{state.description}</p></div>
            </div>

            {evidence.summaryWriteFailed && <p className={styles.warning}><AlertTriangle size={17} aria-hidden="true" /><span><strong>Private summary not saved.</strong> The run recorded a separate summary-write failure. Observation persistence is reported below.</span></p>}

            {evidence.state === 'shadow' && (
              <>
                {evidence.partial && <p className={styles.partial}>Some counters were not recorded in this summary. Missing values are shown explicitly.</p>}
                <dl className={styles.observations}>
                  <div className={styles.persisted}>
                    <dt>Persisted observations</dt>
                    <dd data-missing={counts.persisted === null}>{number(counts.persisted)}</dd>
                    <dd className={styles.metricNote}>{counts.attempted === null ? 'Attempted count not recorded' : `${number(counts.attempted)} attempted`}</dd>
                  </div>
                  <div><dt>Observer errors</dt><dd data-missing={counts.errors === null}>{number(counts.errors)}</dd><dd className={styles.metricNote}>Replay or observation persistence failed.</dd></div>
                  <div><dt>Baseline acquisition errors</dt><dd data-missing={counts.acquisitionErrors === null}>{number(counts.acquisitionErrors)}</dd><dd className={styles.metricNote}>The baseline scrape raised an error.</dd></div>
                </dl>
                {counts.persisted === 0 && <p className={styles.zero}>{counts.attempted === 0 ? 'No observations were attempted.' : 'No observations were persisted.'} This run does not validate any candidate recipe.</p>}

                <details className={styles.details}>
                  <summary><span>Observation diagnostics &amp; comparisons</span><ChevronDown size={18} aria-hidden="true" /></summary>
                  <div className={styles.diagnosticBody}>
                    <div>
                      <h4>Observation diagnostics</h4>
                      <p className={styles.sectionNote}>These counters can overlap. They are not additional observations.</p>
                      <dl className={styles.diagnostics}>
                        {diagnostics.map(([key, label, explanation]) => <div key={key}><dt>{label}<span>{explanation}</span></dt><dd>{number(counts[key])}</dd></div>)}
                      </dl>
                    </div>
                    <div className={styles.comparisons}>
                      <h4>Recipe comparisons</h4>
                      <p className={styles.sectionNote}>{evidence.comparisonTotal === null ? 'Comparison counts were not recorded.' : <><strong>{number(evidence.comparisonTotal)} comparisons</strong>{counts.persisted === null ? '' : ` across ${number(counts.persisted)} persisted observations`}.</>} Each persisted observation can produce up to three comparisons. These are not source counts.</p>
                      {evidence.comparisons && <dl className={styles.outcomes}>{SHADOW_COMPARISON_OUTCOMES.map(({ key, label, detail }) => <div key={key}><dt>{label}<span>{detail}</span></dt><dd>{number(evidence.comparisons![key])}</dd></div>)}</dl>}
                    </div>
                  </div>
                </details>
              </>
            )}
          </div>
        </>
      )}
      <footer className={styles.boundary}>
        <ShieldCheck size={18} aria-hidden="true" />
        <div><strong>Baseline retained · No automatic promotion</strong><p>Shadow observations do not change the active scraper or establish calibrated confidence.</p></div>
        {refreshing && <span role="status">Refreshing…</span>}
      </footer>
    </section>
  );
}
