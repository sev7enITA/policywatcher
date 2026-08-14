'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clipboard,
  Download,
  ExternalLink,
  FlaskConical,
  KeyRound,
  LoaderCircle,
  MinusCircle,
  Play,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  TerminalSquare,
  XCircle,
} from 'lucide-react';
import styles from './webhook-readiness.module.css';

interface CanonicalVector {
  secret: string;
  timestamp: string | number;
  eventId: string;
  payload: string;
  signatureHeader: string;
  signedPayload: string;
}

interface WebhookReadinessClientProps {
  canonicalVector: CanonicalVector;
  conformanceSuite: ConformanceSuite;
  signatureVersion: string;
}

interface ConformanceInput {
  secret: string;
  timestamp: number;
  rawBody: string;
  signatureHeader: string;
  nowSeconds?: number;
  toleranceSeconds?: number;
}

interface ConformanceCase {
  id: string;
  title: string;
  purpose: string;
  expectedCode: string;
  input: ConformanceInput;
}

interface ConformanceSuite {
  suiteVersion: string;
  contractVersion: string;
  caseCount: number;
  boundary: string;
  schema: string;
  cases: readonly ConformanceCase[];
}

type ResultState = 'neutral' | 'working' | 'valid' | 'invalid' | 'error';

interface Result {
  state: ResultState;
  title: string;
  detail: string;
  computedSignature?: string;
}

type CaseState = 'not_run' | 'running' | 'passed' | 'failed';

interface CaseRunResult {
  actualCode: string;
  passed: boolean;
}

interface CompletedRun {
  executedAt: string;
  passed: number;
  failed: number;
  results: Record<string, CaseRunResult>;
}

const LOCAL_EVIDENCE_BOUNDARY =
  'This result is local compatibility evidence for the published fixtures. It is not endpoint, delivery or security certification.';

const initialResult: Result = {
  state: 'neutral',
  title: 'Ready for local verification',
  detail: 'The canonical public test vector is loaded. No data has left this page.',
};

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

async function evaluateConformanceCase(
  input: ConformanceInput,
  signatureVersion: string,
): Promise<string> {
  if (input.secret.length === 0) return 'invalid_secret';

  if (!Number.isSafeInteger(input.timestamp) || input.timestamp <= 0) {
    return 'invalid_timestamp';
  }

  const signaturePattern = new RegExp(`^${signatureVersion}=[0-9a-f]{64}$`);
  if (!signaturePattern.test(input.signatureHeader)) {
    return 'invalid_signature_header';
  }

  const nowSeconds = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const toleranceSeconds = input.toleranceSeconds ?? 300;
  if (
    !Number.isSafeInteger(nowSeconds)
    || !Number.isSafeInteger(toleranceSeconds)
    || toleranceSeconds < 0
    || Math.abs(nowSeconds - input.timestamp) > toleranceSeconds
  ) {
    return 'timestamp_outside_tolerance';
  }

  if (!globalThis.crypto?.subtle) throw new Error('Web Crypto unavailable');

  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(input.secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const suppliedHex = input.signatureHeader.slice(signatureVersion.length + 1);
  const matches = await globalThis.crypto.subtle.verify(
    'HMAC',
    key,
    hexToBytes(suppliedHex),
    encoder.encode(`${input.timestamp}.${input.rawBody}`),
  );

  return matches ? 'valid' : 'signature_mismatch';
}

export default function WebhookReadinessClient({
  canonicalVector,
  conformanceSuite,
  signatureVersion,
}: WebhookReadinessClientProps) {
  const [secret, setSecret] = useState(canonicalVector.secret);
  const [timestamp, setTimestamp] = useState(String(canonicalVector.timestamp));
  const [payload, setPayload] = useState(canonicalVector.payload);
  const [signature, setSignature] = useState(canonicalVector.signatureHeader);
  const [result, setResult] = useState<Result>(initialResult);
  const [copyLabel, setCopyLabel] = useState('Copy signed payload');
  const [caseResults, setCaseResults] = useState<Record<string, CaseRunResult>>({});
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [runState, setRunState] = useState<'idle' | 'running' | 'complete'>('idle');
  const [completedRun, setCompletedRun] = useState<CompletedRun | null>(null);
  const [runAnnouncement, setRunAnnouncement] = useState(
    `${conformanceSuite.caseCount} local cases are ready to run.`,
  );
  const runLock = useRef(false);

  const signedPayload = useMemo(() => `${timestamp}.${payload}`, [timestamp, payload]);
  const resultTone = styles[`result_${result.state}`];

  const resetResult = () => {
    setResult(initialResult);
    setCopyLabel('Copy signed payload');
  };

  const restoreCanonicalVector = () => {
    setSecret(canonicalVector.secret);
    setTimestamp(String(canonicalVector.timestamp));
    setPayload(canonicalVector.payload);
    setSignature(canonicalVector.signatureHeader);
    resetResult();
  };

  const copySignedPayload = async () => {
    try {
      await navigator.clipboard.writeText(signedPayload);
      setCopyLabel('Copied');
    } catch {
      setCopyLabel('Copy unavailable');
    }
  };

  const verifyLocally = async () => {
    if (secret.length === 0) {
      setResult({
        state: 'invalid',
        title: 'Test secret is required',
        detail: 'Enter the exact public test secret or another non-empty local test value.',
      });
      return;
    }

    const parsedTimestamp = Number(timestamp);
    if (!/^\d+$/.test(timestamp) || !Number.isSafeInteger(parsedTimestamp) || parsedTimestamp <= 0) {
      setResult({
        state: 'invalid',
        title: 'Timestamp is not valid',
        detail: 'Enter a positive Unix timestamp as an integer.',
      });
      return;
    }

    const signaturePattern = new RegExp(`^${signatureVersion}=[0-9a-f]{64}$`);
    if (!signaturePattern.test(signature)) {
      setResult({
        state: 'invalid',
        title: 'Signature header is not valid',
        detail: `Use ${signatureVersion}= followed by exactly 64 lowercase hexadecimal characters.`,
      });
      return;
    }

    if (!globalThis.crypto?.subtle) {
      setResult({
        state: 'error',
        title: 'Web Crypto is unavailable',
        detail: 'This browser context cannot perform the local HMAC calculation.',
      });
      return;
    }

    setResult({
      state: 'working',
      title: 'Computing locally',
      detail: 'Generating HMAC-SHA256 from the exact timestamp and raw body.',
    });

    try {
      const encoder = new TextEncoder();
      const key = await globalThis.crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      );
      const digest = await globalThis.crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(signedPayload),
      );
      const computedHex = bytesToHex(digest);
      const suppliedHex = signature.slice(signatureVersion.length + 1);
      const matches = await globalThis.crypto.subtle.verify(
        'HMAC',
        key,
        hexToBytes(suppliedHex),
        encoder.encode(signedPayload),
      );

      setResult({
        state: matches ? 'valid' : 'invalid',
        title: matches ? 'Signature matches' : 'Signature does not match',
        detail: matches
          ? 'Signature compatibility matches this historical vector. Production freshness and replay checks remain separate.'
          : 'The supplied header differs from the digest computed from this exact signed input.',
        computedSignature: `${signatureVersion}=${computedHex}`,
      });
    } catch {
      setResult({
        state: 'error',
        title: 'Local computation failed',
        detail: 'The browser could not complete the HMAC calculation. No request was sent.',
      });
    }
  };

  const runConformanceSuite = async () => {
    if (runLock.current) return;

    runLock.current = true;
    setRunState('running');
    setCompletedRun(null);
    setCaseResults({});
    setActiveCaseId(null);
    setRunAnnouncement(`Starting ${conformanceSuite.caseCount} local conformance cases.`);

    const nextResults: Record<string, CaseRunResult> = {};

    for (const [index, testCase] of conformanceSuite.cases.entries()) {
      setActiveCaseId(testCase.id);
      setRunAnnouncement(`Running case ${index + 1} of ${conformanceSuite.caseCount}: ${testCase.title}.`);
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });

      let actualCode: string;
      try {
        actualCode = await evaluateConformanceCase(testCase.input, signatureVersion);
      } catch {
        actualCode = 'execution_error';
      }

      const caseResult = {
        actualCode,
        passed: actualCode === testCase.expectedCode,
      };
      nextResults[testCase.id] = caseResult;
      setCaseResults({ ...nextResults });
    }

    const passed = Object.values(nextResults).filter((item) => item.passed).length;
    const failed = conformanceSuite.caseCount - passed;
    const nextCompletedRun = {
      executedAt: new Date().toISOString(),
      passed,
      failed,
      results: nextResults,
    };

    setActiveCaseId(null);
    setCompletedRun(nextCompletedRun);
    setRunState('complete');
    runLock.current = false;
    setRunAnnouncement(
      `Local run complete. ${passed} passed and ${failed} failed out of ${conformanceSuite.caseCount} cases.`,
    );
  };

  const exportRun = () => {
    if (!completedRun || runState !== 'complete') return;

    const exportPayload = {
      formatVersion: '1.0.0',
      suiteVersion: conformanceSuite.suiteVersion,
      contractVersion: conformanceSuite.contractVersion,
      executedAt: completedRun.executedAt,
      executionMode: 'browser-web-crypto',
      passed: completedRun.passed,
      failed: completedRun.failed,
      cases: conformanceSuite.cases.map((testCase) => {
        const caseResult = completedRun.results[testCase.id];
        return {
          id: testCase.id,
          expectedCode: testCase.expectedCode,
          actualCode: caseResult?.actualCode ?? 'execution_error',
          passed: caseResult?.passed ?? false,
        };
      }),
      boundary: LOCAL_EVIDENCE_BOUNDARY,
    };
    const blob = new Blob([`${JSON.stringify(exportPayload, null, 2)}\n`], {
      type: 'application/json',
    });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `policywatcher-webhook-conformance-${completedRun.executedAt.slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const ResultIcon = result.state === 'valid'
    ? ShieldCheck
    : result.state === 'working'
      ? LoaderCircle
      : result.state === 'neutral'
        ? TerminalSquare
        : ShieldAlert;

  return (
    <>
      <div className={styles.workbench}>
      <div className={styles.workbenchRail} aria-hidden="true">
        <span>INPUT</span><i /><span>HMAC</span><i /><span>DECISION</span>
      </div>

      <div className={styles.workbenchGrid}>
        <form className={styles.inputPanel} onSubmit={(event) => { event.preventDefault(); void verifyLocally(); }}>
          <div className={styles.panelHeading}>
            <div><span>Signing input</span><h3>Canonical test vector</h3></div>
            <span className={styles.localBadge}><KeyRound size={13} aria-hidden="true" /> Public · test only</span>
          </div>

          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label htmlFor="webhook-test-secret">Test secret</label>
              <p id="webhook-test-secret-help">Public value for this deterministic vector. Do not use it in production.</p>
              <input
                id="webhook-test-secret"
                aria-describedby="webhook-test-secret-help"
                value={secret}
                onChange={(event) => { setSecret(event.target.value); resetResult(); }}
                spellCheck={false}
                autoComplete="off"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="webhook-timestamp">Unix timestamp</label>
              <p id="webhook-timestamp-help">Positive integer included before the raw body.</p>
              <input
                id="webhook-timestamp"
                aria-describedby="webhook-timestamp-help"
                inputMode="numeric"
                value={timestamp}
                onChange={(event) => { setTimestamp(event.target.value); resetResult(); }}
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="webhook-raw-payload">Raw JSON payload</label>
            <p id="webhook-raw-payload-help">Whitespace and property order are part of the signature. Verify before parsing.</p>
            <textarea
              id="webhook-raw-payload"
              aria-describedby="webhook-raw-payload-help"
              value={payload}
              onChange={(event) => { setPayload(event.target.value); resetResult(); }}
              spellCheck={false}
              rows={9}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="webhook-signature">Signature header</label>
            <p id="webhook-signature-help">Expected form: {signatureVersion}= followed by 64 lowercase hexadecimal characters.</p>
            <input
              id="webhook-signature"
              aria-describedby="webhook-signature-help"
              value={signature}
              onChange={(event) => { setSignature(event.target.value); resetResult(); }}
              spellCheck={false}
              autoComplete="off"
            />
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryButton} disabled={result.state === 'working'}>
              {result.state === 'working'
                ? <LoaderCircle size={16} className={styles.spinner} aria-hidden="true" />
                : <ShieldCheck size={16} aria-hidden="true" />}
              Verify locally
            </button>
            <button type="button" className={styles.secondaryButton} onClick={restoreCanonicalVector}>
              <RefreshCcw size={16} aria-hidden="true" />
              Restore canonical vector
            </button>
          </div>
        </form>

        <aside className={styles.evidencePanel} aria-label="Inspectable signing evidence">
          <div className={styles.panelHeading}>
            <div><span>Inspectable evidence</span><h3>Exact signed input</h3></div>
            <span className={styles.localBadge}><Check size={13} aria-hidden="true" /> Local only</span>
          </div>

          <dl className={styles.evidenceMeta}>
            <div><dt>Event ID</dt><dd>{canonicalVector.eventId}</dd></div>
            <div><dt>Algorithm</dt><dd>HMAC-SHA256</dd></div>
            <div><dt>Message shape</dt><dd>timestamp.raw-body</dd></div>
          </dl>

          <div className={styles.signedBlock}>
            <div className={styles.signedHeading}>
              <span>UTF-8 message</span>
              <button type="button" onClick={() => { void copySignedPayload(); }}>
                {copyLabel === 'Copied' ? <Check size={14} aria-hidden="true" /> : <Clipboard size={14} aria-hidden="true" />}
                {copyLabel}
              </button>
            </div>
            <pre tabIndex={0}><code>{signedPayload}</code></pre>
          </div>

          <div
            className={`${styles.result} ${resultTone}`}
            role={result.state === 'error' || result.state === 'invalid' ? 'alert' : 'status'}
            aria-live="polite"
            aria-atomic="true"
          >
            <ResultIcon size={22} className={result.state === 'working' ? styles.spinner : undefined} aria-hidden="true" />
            <div>
              <span>Verification result</span>
              <h4>{result.title}</h4>
              <p>{result.detail}</p>
            </div>
          </div>

          <div className={styles.computedBlock}>
            <span>Computed signature</span>
            <code>{result.computedSignature ?? 'Run local verification to calculate the digest.'}</code>
          </div>
        </aside>
      </div>
      </div>

      <section id="conformance-lab" className={styles.conformanceLab} aria-labelledby="conformance-lab-heading">
      <header className={styles.labHeader}>
        <div>
          <span className={styles.labEyebrow}>
            <FlaskConical size={15} aria-hidden="true" />
            Receiver conformance lab
          </span>
          <h2 id="conformance-lab-heading">Eight fixtures. Exact receiver decisions.</h2>
          <p>
            Run the published positive and negative cases in this browser. A passing run demonstrates fixture compatibility only; no endpoint or delivery is tested.
          </p>
        </div>
        <div className={styles.labVersion} aria-label="Conformance suite version">
          <span>Suite</span>
          <strong>v{conformanceSuite.suiteVersion}</strong>
        </div>
      </header>

      <dl className={styles.labSummaryStrip}>
        <div><dt>Cases</dt><dd>{conformanceSuite.caseCount} deterministic</dd></div>
        <div><dt>Contract</dt><dd>v{conformanceSuite.contractVersion}</dd></div>
        <div><dt>Execution</dt><dd>Browser · local only</dd></div>
      </dl>

      <div className={styles.labToolbar}>
        <div className={styles.labActions}>
          <button
            type="button"
            className={styles.runButton}
            disabled={runState === 'running'}
            onClick={() => { void runConformanceSuite(); }}
          >
            {runState === 'running'
              ? <LoaderCircle size={17} className={styles.spinner} aria-hidden="true" />
              : <Play size={17} aria-hidden="true" />}
            {runState === 'running' ? 'Running local cases' : `Run ${conformanceSuite.caseCount} local cases`}
          </button>
          <button
            type="button"
            className={styles.exportButton}
            disabled={!completedRun || runState === 'running'}
            onClick={exportRun}
          >
            <Download size={17} aria-hidden="true" />
            Export run JSON
          </button>
        </div>
        <nav className={styles.machineLinks} aria-label="Machine-readable conformance resources">
          <a href="/api/v1/webhook-conformance-suite">
            Suite API <ExternalLink size={14} aria-hidden="true" />
          </a>
          <a href={conformanceSuite.schema}>
            JSON Schema <ExternalLink size={14} aria-hidden="true" />
          </a>
        </nav>
      </div>

      <p className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">
        {runAnnouncement}
      </p>

      <div className={styles.caseLedger} tabIndex={0} aria-label="Receiver conformance case ledger">
        <table>
          <thead>
            <tr>
              <th scope="col">Case</th>
              <th scope="col">Purpose</th>
              <th scope="col">Expected</th>
              <th scope="col">Actual</th>
              <th scope="col">State</th>
            </tr>
          </thead>
          <tbody>
            {conformanceSuite.cases.map((testCase, index) => {
              const caseResult = caseResults[testCase.id];
              const caseState: CaseState = activeCaseId === testCase.id
                ? 'running'
                : caseResult?.passed
                  ? 'passed'
                  : caseResult
                    ? 'failed'
                    : 'not_run';
              const StateIcon = caseState === 'passed'
                ? CheckCircle2
                : caseState === 'failed'
                  ? XCircle
                  : caseState === 'running'
                    ? LoaderCircle
                    : MinusCircle;
              const stateLabel = caseState === 'not_run'
                ? 'Not run'
                : caseState === 'running'
                  ? 'Running'
                  : caseState === 'passed'
                    ? 'Passed'
                    : 'Failed';

              return (
                <tr key={testCase.id} className={styles[`case_${caseState}`]}>
                  <th scope="row" data-label="Case">
                    <span className={styles.caseNumber}>{String(index + 1).padStart(2, '0')}</span>
                    <span><code>{testCase.id}</code><strong>{testCase.title}</strong></span>
                  </th>
                  <td data-label="Purpose">{testCase.purpose}</td>
                  <td data-label="Expected"><code>{testCase.expectedCode}</code></td>
                  <td data-label="Actual"><code>{caseResult?.actualCode ?? 'not_run'}</code></td>
                  <td data-label="State">
                    <span className={styles.caseState}>
                      <StateIcon
                        size={15}
                        className={caseState === 'running' ? styles.spinner : undefined}
                        aria-hidden="true"
                      />
                      {stateLabel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        className={`${styles.runSummary} ${completedRun?.failed ? styles.runSummaryFailed : completedRun ? styles.runSummaryPassed : ''}`}
        aria-label="Conformance run summary"
      >
        <div>
          <span>Evidence summary</span>
          <strong>
            {runState === 'running'
              ? 'Run in progress'
              : completedRun
                ? `${completedRun.passed} passed · ${completedRun.failed} failed`
                : 'No local run recorded'}
          </strong>
        </div>
        <p>{completedRun ? LOCAL_EVIDENCE_BOUNDARY : conformanceSuite.boundary}</p>
      </div>
      </section>
    </>
  );
}
