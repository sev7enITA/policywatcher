'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { AlertTriangle, Check, LoaderCircle, ShieldCheck } from 'lucide-react';
import styles from './investorAccess.module.css';

type AccessState = 'redeeming' | 'missing' | 'invalid' | 'expired' | 'revoked' | 'ended' | 'unavailable';

const outcomes: Record<Exclude<AccessState, 'redeeming'>, { title: string; body: string }> = {
  missing: {
    title: 'This access link is incomplete',
    body: 'Ask the PolicyWatcher team for a new secure link. Nothing from the study has been opened.',
  },
  invalid: {
    title: 'This access link is not valid',
    body: 'The link may be incomplete or no longer recognized. Ask the sender to create a new one.',
  },
  expired: {
    title: 'This seven-day window has closed',
    body: 'Access has expired. Ask the PolicyWatcher team to issue a fresh investor link.',
  },
  revoked: {
    title: 'This access has been withdrawn',
    body: 'The sender has closed this data-room invitation. Contact them if you still need access.',
  },
  ended: {
    title: 'This private session has ended',
    body: 'The secure session is closed. Use the original link again only if its seven-day access window is still active.',
  },
  unavailable: {
    title: 'The data room is temporarily unavailable',
    body: 'Your study has not been opened. Please try the original link again later.',
  },
};

export default function InvestorAccessClient() {
  const [state, setState] = useState<AccessState>('redeeming');

  useEffect(() => {
    let cancelled = false;
    async function redeem() {
      const fragment = window.location.hash;
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      const token = new URLSearchParams(fragment.startsWith('#') ? fragment.slice(1) : fragment).get('token');
      if (!token) {
        const outcome = new URLSearchParams(window.location.search).get('outcome');
        if (!cancelled) {
          setState(outcome === 'revoked' || outcome === 'expired'
            ? outcome
            : outcome === 'ended' || outcome === 'session-ended'
              ? 'ended'
              : 'missing');
        }
        return;
      }
      try {
        const response = await fetch('/api/investor/redeem', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const payload = await response.json().catch(() => null) as { outcome?: AccessState } | null;
        if (response.ok) {
          window.location.replace('/investor/executive-study');
          return;
        }
        const outcome = payload?.outcome;
        if (!cancelled) setState(outcome === 'expired' || outcome === 'revoked' || outcome === 'invalid' ? outcome : 'unavailable');
      } catch {
        if (!cancelled) setState('unavailable');
      }
    }
    void redeem();
    return () => { cancelled = true; };
  }, []);

  const outcome = state === 'redeeming' ? null : outcomes[state];
  return (
    <main className={styles.page}>
      <section className={styles.accessDocument} aria-live="polite">
        <header className={styles.brandLine}>
          <span className={styles.mark}><Image src="/logo-mark.png" alt="" width={30} height={30} priority /></span>
          <span><b>PolicyWatcher</b><small>Investor data room</small></span>
          <span className={styles.windowSeal}><ShieldCheck size={15} aria-hidden="true" /> 7-day access</span>
        </header>
        <div className={styles.rule} />
        {state === 'redeeming' ? (
          <div className={styles.statePanel}>
            <LoaderCircle className={styles.spinner} size={34} aria-hidden="true" />
            <p className={styles.kicker}>Opening sealed document</p>
            <h1>Verifying your private access window</h1>
            <p>The link is being exchanged for a secure, read-only session. It has already been removed from the address bar.</p>
            <ol className={styles.progress} aria-label="Access verification progress">
              <li data-complete="true"><Check size={14} /> Secure link received</li>
              <li><span /> Verifying seven-day grant</li>
              <li><span /> Opening Executive Study</li>
            </ol>
          </div>
        ) : (
          <div className={styles.statePanel}>
            <AlertTriangle className={styles.outcomeIcon} size={34} aria-hidden="true" />
            <p className={styles.kicker}>Access notice</p>
            <h1>{outcome?.title}</h1>
            <p>{outcome?.body}</p>
          </div>
        )}
        <footer>
          <span>Confidential · recipient-specific · read only</span>
          <span>PW / DATA ROOM / 07</span>
        </footer>
      </section>
    </main>
  );
}
