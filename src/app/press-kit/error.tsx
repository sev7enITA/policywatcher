'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import styles from './pressKit.module.css';

export default function PressKitError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className={styles.page} lang="en">
      <PublicHeader current="press-kit" lang="en" />
      <main className={styles.subpageMain}>
        <section className={styles.referenceBlock}>
          <div className={styles.emptyRegister} role="alert">
            <AlertTriangle size={20} />
            <strong>Newsroom information could not be displayed.</strong>
            <span>Retry this view or return to the main press kit.</span>
            <div className={styles.formatList}>
              <button type="button" onClick={reset}><RotateCcw size={13} />Retry</button>
              <Link href="/press-kit"><ArrowLeft size={13} />Press kit</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer lang="en" variant="compact" />
    </div>
  );
}
