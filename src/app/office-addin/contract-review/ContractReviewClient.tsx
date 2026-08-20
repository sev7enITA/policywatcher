'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { BookOpenCheck, ExternalLink, FileSearch, LockKeyhole, RefreshCw, ShieldCheck } from 'lucide-react';
import {
  CONTRACT_EVIDENCE_TOPICS,
  deriveContractEvidenceQuery,
  getContractTopicLabel,
  type ContractEvidenceDerivation,
  type ContractEvidenceTopicId,
} from '@/lib/contractEvidence';
import styles from './contract-review.module.css';

type OfficeResult = { status: string; value?: string; error?: { message?: string } };
type OfficeApi = {
  CoercionType: { Text: unknown };
  AsyncResultStatus: { Succeeded: string };
  context: {
    document: {
      getSelectedDataAsync: (coercionType: unknown, callback: (result: OfficeResult) => void) => void;
    };
  };
  onReady: (callback: () => void) => void;
};

type AgentBrief = {
  generatedAt: string;
  resultCount: number;
  answerContext: string;
  citations: string;
  filterSummary: string;
  boundary: string;
};

function getOffice() {
  return (window as typeof window & { Office?: OfficeApi }).Office;
}

function splitCitations(value: string) {
  return value.split('\n').map((item) => item.trim()).filter((item) => /^https:\/\//.test(item));
}

export default function ContractReviewClient() {
  const [officeReady, setOfficeReady] = useState(false);
  const [derivation, setDerivation] = useState<ContractEvidenceDerivation | null>(null);
  const [manualTopic, setManualTopic] = useState<ContractEvidenceTopicId>('privacy');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'capturing' | 'ready' | 'searching' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('Select a clause in Word, then capture the selection locally.');
  const [brief, setBrief] = useState<AgentBrief | null>(null);

  useEffect(() => {
    let attempts = 0;
    const timer = window.setInterval(() => {
      const office = getOffice();
      attempts += 1;
      if (office) {
        window.clearInterval(timer);
        office.onReady(() => setOfficeReady(true));
      } else if (attempts >= 20) {
        window.clearInterval(timer);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, []);

  const derivedTopic = useMemo(
    () => derivation?.query || getContractTopicLabel(manualTopic),
    [derivation, manualTopic],
  );

  function captureSelection() {
    const office = getOffice();
    if (!officeReady || !office) {
      setStatus('error');
      setMessage('Open this task pane inside a supported Word host to read the current selection.');
      return;
    }

    setStatus('capturing');
    setBrief(null);
    setConsent(false);
    office.context.document.getSelectedDataAsync(office.CoercionType.Text, (result) => {
      if (result.status !== office.AsyncResultStatus.Succeeded) {
        setStatus('error');
        setMessage(result.error?.message || 'Word could not read the current selection.');
        return;
      }
      const next = deriveContractEvidenceQuery(result.value || '');
      if (!next.characterCount) {
        setStatus('error');
        setMessage('No text is selected. Select one clause and try again.');
        return;
      }
      setDerivation(next);
      setStatus('ready');
      setMessage(next.topics.length
        ? 'The selection was classified locally. Review the derived topics before searching.'
        : 'No controlled topic was detected. Choose a topic manually; selected text will remain local.');
    });
  }

  async function findEvidence() {
    if (!consent || !derivedTopic) return;
    setStatus('searching');
    setBrief(null);
    setMessage('Searching public evidence with derived topics only…');
    const params = new URLSearchParams({ topic: derivedTopic, lang: 'en', limit: '5' });

    try {
      const response = await fetch(`/api/v1/agent/change-brief?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'omit',
      });
      if (!response.ok) throw new Error(`Evidence gateway returned ${response.status}.`);
      const payload = await response.json() as AgentBrief;
      setBrief(payload);
      setStatus('done');
      setMessage(payload.resultCount
        ? `${payload.resultCount} public evidence record${payload.resultCount === 1 ? '' : 's'} returned.`
        : 'No matching public evidence was returned. This does not establish that no relevant change exists.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Public evidence is temporarily unavailable.');
    }
  }

  return (
    <main className={styles.taskPane}>
      <header className={styles.header}>
        <Image src="/press-kit/policywatcher-logo-mark-512.png" alt="" width={42} height={42} priority />
        <div><span>PolicyWatcher for Word</span><h1>Contract Evidence Review</h1></div>
      </header>

      <section className={styles.boundary} aria-labelledby="boundary-title">
        <LockKeyhole size={19} aria-hidden="true" />
        <div>
          <h2 id="boundary-title">Selected text stays in this task pane</h2>
          <p>Only controlled topic labels are sent to the public evidence gateway. PolicyWatcher does not receive or store the selected clause.</p>
        </div>
      </section>

      <section className={styles.step} aria-labelledby="capture-title">
        <span className={styles.stepNumber}>01</span>
        <div className={styles.stepBody}>
          <h2 id="capture-title">Capture the current selection</h2>
          <p>Select one contract clause in Word. Classification happens inside the task pane.</p>
          <button type="button" onClick={captureSelection} disabled={status === 'capturing'}>
            {status === 'capturing' ? <RefreshCw className={styles.spin} size={17} /> : <FileSearch size={17} />}
            {status === 'capturing' ? 'Reading selection…' : 'Capture selection locally'}
          </button>
          {!officeReady ? <small>Waiting for a supported Word host. Browser preview cannot read a document.</small> : null}
        </div>
      </section>

      <section className={styles.step} aria-labelledby="topics-title">
        <span className={styles.stepNumber}>02</span>
        <div className={styles.stepBody}>
          <h2 id="topics-title">Derived topics</h2>
          {derivation ? (
            <>
              <div className={styles.selectionMeta}>
                <span>{derivation.characterCount.toLocaleString()} selected characters</span>
                <span>{derivation.truncated ? 'First 12,000 classified' : 'Classified locally'}</span>
              </div>
              {derivation.topics.length ? (
                <ul className={styles.topics}>
                  {derivation.topics.map((topic) => <li key={topic.id}>{topic.label}<span>{topic.matches}</span></li>)}
                </ul>
              ) : (
                <label className={styles.field}>
                  Topic to search
                  <select value={manualTopic} onChange={(event) => setManualTopic(event.target.value as ContractEvidenceTopicId)}>
                    {CONTRACT_EVIDENCE_TOPICS.map((topic) => <option key={topic.id} value={topic.id}>{topic.label}</option>)}
                  </select>
                </label>
              )}
            </>
          ) : <p className={styles.empty}>Capture a selection to produce controlled topic labels.</p>}
        </div>
      </section>

      <section className={styles.step} aria-labelledby="search-title">
        <span className={styles.stepNumber}>03</span>
        <div className={styles.stepBody}>
          <h2 id="search-title">Related public evidence</h2>
          <label className={styles.consent}>
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} disabled={!derivation} />
            <span>I understand that only the displayed topic labels, not the clause text, will be sent.</span>
          </label>
          <button type="button" onClick={findEvidence} disabled={!derivation || !consent || status === 'searching'}>
            {status === 'searching' ? <RefreshCw className={styles.spin} size={17} /> : <BookOpenCheck size={17} />}
            {status === 'searching' ? 'Searching evidence…' : 'Find public evidence'}
          </button>
        </div>
      </section>

      <div className={`${styles.status} ${status === 'error' ? styles.statusError : ''}`} role="status" aria-live="polite">
        <ShieldCheck size={17} aria-hidden="true" /><span>{message}</span>
      </div>

      {brief ? (
        <section className={styles.results} aria-labelledby="results-title" tabIndex={-1}>
          <div className={styles.resultsHeading}>
            <div><span>Public evidence brief</span><h2 id="results-title">Related records</h2></div>
            <small>Generated {new Date(brief.generatedAt).toLocaleString()}</small>
          </div>
          <pre>{brief.answerContext}</pre>
          {splitCitations(brief.citations).length ? (
            <ul className={styles.citations}>
              {splitCitations(brief.citations).map((citation, index) => (
                <li key={`${citation}-${index}`}><a href={citation} target="_blank" rel="noreferrer">Source {index + 1}<ExternalLink size={13} /></a></li>
              ))}
            </ul>
          ) : null}
          <p className={styles.resultBoundary}>{brief.boundary}</p>
        </section>
      ) : null}

      <footer className={styles.footer}>
        <strong>Evidence mapping only.</strong> Not legal advice, compliance certification or contract approval.
      </footer>
    </main>
  );
}
