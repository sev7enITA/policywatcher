import styles from './pressKit.module.css';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';

export default function PressKitLoading() {
  return (
    <div className={styles.page} lang="en">
      <PublicHeader current="press-kit" lang="en" />
      <main className={styles.subpageMain} aria-busy="true" aria-label="Loading newsroom information">
        <section className={styles.subpageHero}>
          <div className={styles.loadingState}><span /><span /><span /></div>
        </section>
      </main>
      <Footer lang="en" variant="compact" />
    </div>
  );
}
