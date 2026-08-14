import Link from 'next/link';
import { ArrowLeft, FileQuestion } from 'lucide-react';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import styles from '../evidence.module.css';

export default function EvidencePacketNotFound() {
  return (
    <>
      <PublicHeader current="evidence" />
      <main className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.notice} role="status">
            <FileQuestion size={22} aria-hidden="true" />
            <div>
              <h1>Evidence packet not found</h1>
              <p>The change ID is absent, withheld, or does not satisfy the public-evidence gate.</p>
              <Link href="/evidence" className={styles.retryButton}>
                <ArrowLeft size={15} aria-hidden="true" /> Return to the evidence register
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer lang="en" variant="compact" />
    </>
  );
}
