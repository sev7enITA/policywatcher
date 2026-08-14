import { FileCheck2 } from 'lucide-react';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import styles from './evidence.module.css';

export default function EvidenceLoading() {
  return (
    <>
      <PublicHeader current="evidence" />
      <main className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.notice} role="status" aria-live="polite">
            <FileCheck2 size={22} aria-hidden="true" />
            <div>
              <h1>Loading public evidence</h1>
              <p>Checking the public-evidence gate and available packet records.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer lang="en" variant="compact" />
    </>
  );
}
