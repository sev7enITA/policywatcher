import styles from './pressKit.module.css';

export default function PressKitLoading() {
  return (
    <main className={styles.subpageMain} aria-busy="true" aria-label="Loading newsroom information">
      <section className={styles.subpageHero}>
        <div className={styles.loadingState}><span /><span /><span /></div>
      </section>
    </main>
  );
}
