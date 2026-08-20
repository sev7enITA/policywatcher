'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Check, Clipboard, Clock3, KeyRound, Link2, RotateCcw, ShieldCheck, XCircle } from 'lucide-react';
import type { InvestorGrantView } from '@/lib/investorAccessService';
import styles from './admin.module.css';

function formatTimestamp(value: string | null): string {
  if (!value) return 'Never';
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function InvestorAccessPanel() {
  const [grants, setGrants] = useState<InvestorGrantView[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [recipientLabel, setRecipientLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [oneTimeLink, setOneTimeLink] = useState<{ url: string; expiresAt: string } | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [ledgerMessage, setLedgerMessage] = useState('');

  async function loadGrants() {
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch('/api/admin/investor-access', { credentials: 'include', cache: 'no-store' });
      const payload = await response.json().catch(() => null) as { grants?: InvestorGrantView[]; error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || 'Unable to load investor access.');
      setGrants(payload?.grants || []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load investor access.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/investor-access', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json().catch(() => null) as { grants?: InvestorGrantView[]; error?: string } | null;
        if (!response.ok) throw new Error(payload?.error || 'Unable to load investor access.');
        return payload?.grants || [];
      })
      .then((nextGrants) => { if (!cancelled) setGrants(nextGrants); })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Unable to load investor access.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function createLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating) return;
    setFormError('');
    setCopyState('idle');
    setCreating(true);
    try {
      const response = await fetch('/api/admin/investor-access', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientLabel }),
      });
      const payload = await response.json().catch(() => null) as {
        grant?: InvestorGrantView;
        magicPath?: string;
        error?: string;
      } | null;
      if (!response.ok || !payload?.grant || !payload.magicPath) {
        throw new Error(payload?.error || 'Unable to create an investor link.');
      }
      setGrants((current) => [payload.grant!, ...current.filter((grant) => grant.id !== payload.grant!.id)]);
      setOneTimeLink({
        url: new URL(payload.magicPath, window.location.origin).toString(),
        expiresAt: payload.grant.expiresAt,
      });
      setRecipientLabel('');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to create an investor link.');
    } finally {
      setCreating(false);
    }
  }

  async function copyLink() {
    if (!oneTimeLink) return;
    try {
      await navigator.clipboard.writeText(oneTimeLink.url);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  }

  async function revokeGrant(grant: InvestorGrantView) {
    if (revokingId) return;
    if (!window.confirm(`Revoke Executive Study access for ${grant.recipientLabel}? Existing sessions will stop on their next request.`)) return;
    setRevokingId(grant.id);
    setLedgerMessage('');
    try {
      const response = await fetch(`/api/admin/investor-access/${encodeURIComponent(grant.id)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const payload = await response.json().catch(() => null) as { grant?: InvestorGrantView; error?: string } | null;
      if (!response.ok || !payload?.grant) throw new Error(payload?.error || 'Unable to revoke access.');
      setGrants((current) => current.map((item) => item.id === payload.grant!.id ? payload.grant! : item));
      setLedgerMessage(`Access revoked for ${payload.grant.recipientLabel}.`);
      if (oneTimeLink && grant.expiresAt === oneTimeLink.expiresAt) setOneTimeLink(null);
    } catch (error) {
      setLedgerMessage(error instanceof Error ? error.message : 'Unable to revoke access.');
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <section className={styles.investorAccessPanel} aria-labelledby="investor-access-title">
      <header className={styles.investorAccessHeader}>
        <div className={styles.investorAccessSeal}><ShieldCheck size={18} aria-hidden="true" /><span>7 days</span></div>
        <div>
          <span>Confidential distribution control</span>
          <h2 id="investor-access-title">Investor access</h2>
          <p>Create recipient-specific access to the Executive Study only. Every link is read-only, expires automatically, and can be revoked immediately.</p>
        </div>
        <ul aria-label="Investor access boundaries"><li>Study only</li><li>Read only</li><li>Revocable</li></ul>
      </header>

      <div className={styles.investorAccessBody}>
        <form className={styles.investorAccessForm} onSubmit={createLink}>
          <label htmlFor="investor-recipient-label">Investor or fund label</label>
          <div className={styles.investorAccessFieldRow}>
            <input
              id="investor-recipient-label"
              value={recipientLabel}
              onChange={(event) => setRecipientLabel(event.target.value)}
              minLength={2}
              maxLength={120}
              required
              placeholder="e.g. Northstar Ventures · Partner team"
              aria-describedby="investor-label-help"
            />
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={creating || recipientLabel.trim().length < 2}>
              <Link2 size={16} aria-hidden="true" /> {creating ? 'Creating…' : 'Create 7-day link'}
            </button>
          </div>
          <div className={styles.investorAccessHelp} id="investor-label-help"><span>2–120 characters. This label appears on the confidential document.</span><span>{recipientLabel.length} / 120</span></div>
          {formError ? <p className={styles.investorAccessError} role="alert">{formError}</p> : null}
        </form>

        {oneTimeLink ? (
          <aside className={styles.oneTimeReveal} aria-label="One-time secure link">
            <div className={styles.oneTimeRevealHeading}>
              <span><KeyRound size={16} aria-hidden="true" /> One-time reveal</span>
              <strong>Copy this link now</strong>
              <p>It cannot be recovered after refresh. Only its SHA-256 hash is stored.</p>
            </div>
            <code>{oneTimeLink.url}</code>
            <div className={styles.oneTimeRevealActions}>
              <button type="button" onClick={copyLink}><Clipboard size={16} aria-hidden="true" /> {copyState === 'copied' ? 'Secure link copied' : 'Copy secure link'}</button>
              <span><Clock3 size={14} aria-hidden="true" /> Expires {formatTimestamp(oneTimeLink.expiresAt)}</span>
            </div>
            {copyState === 'error' ? <p className={styles.investorAccessError} role="alert">Clipboard access was blocked. Select and copy the link manually.</p> : null}
          </aside>
        ) : null}
      </div>

      <div className={styles.investorLedgerHeader}>
        <div><span>Access ledger</span><h3>Recent grants</h3></div>
        <button type="button" onClick={() => void loadGrants()} disabled={loading}><RotateCcw size={15} aria-hidden="true" /> Refresh</button>
      </div>
      <p className={styles.investorLedgerStatus} role="status" aria-live="polite">{ledgerMessage}</p>
      {loading ? (
        <div className={styles.investorLedgerEmpty}>Loading access ledger…</div>
      ) : loadError ? (
        <div className={styles.investorLedgerEmpty} role="alert"><XCircle size={17} /> {loadError}</div>
      ) : grants.length === 0 ? (
        <div className={styles.investorLedgerEmpty}><KeyRound size={17} /> No investor links have been issued.</div>
      ) : (
        <div className={styles.investorLedgerScroller} tabIndex={0}>
          <table className={styles.investorLedger}>
            <caption>Recent Executive Study investor access grants</caption>
            <thead><tr><th scope="col">Recipient</th><th scope="col">Status</th><th scope="col">Created</th><th scope="col">Expires</th><th scope="col">Last access</th><th scope="col">Uses</th><th scope="col" aria-label="Access control" /></tr></thead>
            <tbody>{grants.map((grant) => (
              <tr key={grant.id}>
                <th scope="row">{grant.recipientLabel}</th>
                <td><span className={styles.investorGrantStatus} data-status={grant.status}><i /> {grant.status[0].toUpperCase() + grant.status.slice(1)}</span></td>
                <td><time dateTime={grant.createdAt}>{formatTimestamp(grant.createdAt)}</time></td>
                <td><time dateTime={grant.expiresAt}>{formatTimestamp(grant.expiresAt)}</time></td>
                <td>{grant.lastAccessedAt ? <time dateTime={grant.lastAccessedAt}>{formatTimestamp(grant.lastAccessedAt)}</time> : 'Never'}</td>
                <td>{grant.accessCount}</td>
                <td>{grant.status === 'active' ? <button type="button" className={styles.revokeInvestorGrant} onClick={() => void revokeGrant(grant)} disabled={revokingId === grant.id}>{revokingId === grant.id ? 'Revoking…' : 'Revoke'}</button> : <span className={styles.immutableGrant}><Check size={13} /> Closed</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
