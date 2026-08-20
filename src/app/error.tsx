'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import styles from './RouteStatus.module.css';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[App] Unhandled route error:', error);
  }, [error]);

  return (
    <main className={styles.page}>
      <section className={styles.card} role="alert" aria-labelledby="route-error-title">
        <p className={styles.eyebrow}>PolicyWatcher / Service status</p>
        <h1 id="route-error-title">This page is temporarily unavailable</h1>
        <p>
          The request could not be completed. No missing evidence or healthy status is inferred from this error.
        </p>
        <div className={styles.actions}>
          <button type="button" onClick={reset}>Try again</button>
          <Link href="/">Return to PolicyWatcher</Link>
        </div>
      </section>
    </main>
  );
}
