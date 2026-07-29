'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import styles from './evidence.module.css';

export default function EvidenceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <PublicHeader current="evidence" />
      <main className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.notice} role="alert">
            <AlertTriangle size={22} aria-hidden="true" />
            <div>
              <h1>Evidence packet temporarily unavailable</h1>
              <p>The public evidence file could not be loaded. Protected storage details are not exposed.</p>
              <button type="button" className={styles.retryButton} onClick={reset}>
                <RotateCcw size={15} aria-hidden="true" /> Retry
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer lang="en" variant="compact" />
    </>
  );
}
