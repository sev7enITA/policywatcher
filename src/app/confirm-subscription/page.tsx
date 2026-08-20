'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ConfirmSubscriptionPage() {
  const [credentials, setCredentials] = useState<{ email: string; token: string } | null>(null);
  const [state, setState] = useState<'ready' | 'loading' | 'success' | 'error'>('ready');

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const email = params.get('email') || '';
    const token = params.get('token') || '';
    queueMicrotask(() => {
      if (active) setCredentials(email && token ? { email, token } : null);
    });
    window.history.replaceState(null, '', window.location.pathname);
    return () => {
      active = false;
    };
  }, []);

  async function confirm() {
    if (!credentials) return;
    setState('loading');
    try {
      const response = await fetch('/api/subscribers/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      setState(response.ok ? 'success' : 'error');
    } catch {
      setState('error');
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f8fafc' }}>
      <section style={{ width: 'min(480px, 100%)', padding: 40, border: '1px solid #e2e8f0', borderRadius: 24, background: '#fff', textAlign: 'center' }}>
        <p style={{ margin: '0 0 12px', color: '#4f46e5', fontWeight: 700 }}>PolicyWatcher</p>
        <h1 style={{ margin: '0 0 12px', color: '#0f172a' }}>Confirm policy alerts</h1>
        {state === 'success' ? (
          <p role="status">Your confirmation has been processed. You can now receive alerts matching your preferences.</p>
        ) : (
          <>
            <p>Confirm this address before PolicyWatcher starts sending policy-change alerts.</p>
            {!credentials ? <p role="alert">This confirmation link is incomplete.</p> : null}
            {state === 'error' ? <p role="alert">Confirmation is temporarily unavailable. Please try again.</p> : null}
            <button type="button" onClick={() => void confirm()} disabled={!credentials || state === 'loading'} style={{ padding: '12px 20px', border: 0, borderRadius: 10, background: '#4f46e5', color: '#fff', fontWeight: 700 }}>
              {state === 'loading' ? 'Confirming…' : 'Confirm subscription'}
            </button>
          </>
        )}
        <p style={{ marginTop: 24 }}><Link href="/">Return to PolicyWatcher</Link></p>
      </section>
    </main>
  );
}
