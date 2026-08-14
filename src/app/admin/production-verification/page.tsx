'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, CircleDashed, RefreshCw, ShieldCheck } from 'lucide-react';
import type { ProductionVerificationReport, ProductionVerificationState } from '@/lib/productionVerification';
import styles from './production-verification.module.css';

const labels: Record<ProductionVerificationState, string> = {
  passed: 'Passed', attention: 'Attention', unavailable: 'Unavailable', external: 'External evidence',
};

export default function ProductionVerificationPage() {
  const router = useRouter();
  const [report, setReport] = useState<ProductionVerificationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/production-verification', { credentials: 'include', cache: 'no-store' });
      if (response.status === 401) { router.push('/admin/login'); return; }
      if (!response.ok) throw new Error(`Verification endpoint returned HTTP ${response.status}.`);
      setReport(await response.json() as ProductionVerificationReport);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Production verification is unavailable.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div><span>Beta 32 · deployment assurance</span><h1>Production Verification</h1><p>Run one sanitized, authenticated snapshot across runtime identity, database readiness, live HTTP controls and negative authorization boundaries.</p></div>
        <button type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={17} className={loading ? styles.spin : undefined} /> {loading ? 'Checking...' : 'Run verification'}</button>
      </header>

      {error ? <div className={styles.error}><AlertTriangle size={18} />{error}</div> : null}
      {loading && !report ? <div className={styles.loading}><CircleDashed size={22} />Running independent checks...</div> : null}
      {report ? (
        <>
          <section className={styles.summary} data-status={report.status} aria-live="polite">
            <div><ShieldCheck size={24} /><span>Snapshot status</span><strong>{report.status}</strong></div>
            <dl>
              {(Object.keys(labels) as ProductionVerificationState[]).map((state) => <div key={state}><dt>{labels[state]}</dt><dd>{report.summary[state]}</dd></div>)}
            </dl>
            <p>Checked {new Date(report.checkedAt).toLocaleString()} · release {report.release} · role {report.role}</p>
          </section>

          <section className={styles.checks} aria-label="Production verification checks">
            {report.checks.map((check) => (
              <article key={check.id} data-state={check.state}>
                <div className={styles.checkTop}>{check.state === 'passed' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}<span>{check.category}</span><b>{labels[check.state]}</b></div>
                <h2>{check.title}</h2>
                <dl><div><dt>Observed</dt><dd>{check.observed}</dd></div><div><dt>Expected</dt><dd>{check.expected}</dd></div><div><dt>Boundary</dt><dd>{check.boundary}</dd></div></dl>
              </article>
            ))}
          </section>
          <aside className={styles.boundary}><strong>Report boundary</strong><p>{report.boundary}</p></aside>
        </>
      ) : null}
    </div>
  );
}
