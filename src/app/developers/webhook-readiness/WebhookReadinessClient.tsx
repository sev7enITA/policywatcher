'use client';

import { useMemo, useState } from 'react';
import {
  Check,
  Clipboard,
  KeyRound,
  LoaderCircle,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  TerminalSquare,
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
  signatureVersion: string;
}

type ResultState = 'neutral' | 'working' | 'valid' | 'invalid' | 'error';

interface Result {
  state: ResultState;
  title: string;
  detail: string;
  computedSignature?: string;
}

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

export default function WebhookReadinessClient({
  canonicalVector,
  signatureVersion,
}: WebhookReadinessClientProps) {
  const [secret, setSecret] = useState(canonicalVector.secret);
  const [timestamp, setTimestamp] = useState(String(canonicalVector.timestamp));
  const [payload, setPayload] = useState(canonicalVector.payload);
  const [signature, setSignature] = useState(canonicalVector.signatureHeader);
  const [result, setResult] = useState<Result>(initialResult);
  const [copyLabel, setCopyLabel] = useState('Copy signed payload');

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

  const ResultIcon = result.state === 'valid'
    ? ShieldCheck
    : result.state === 'working'
      ? LoaderCircle
      : result.state === 'neutral'
        ? TerminalSquare
        : ShieldAlert;

  return (
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
  );
}
