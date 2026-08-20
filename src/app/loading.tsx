import styles from './RouteStatus.module.css';

export default function RootLoading() {
  return (
    <main className={styles.page} aria-busy="true">
      <section className={styles.card} role="status" aria-live="polite">
        <p className={styles.eyebrow}>PolicyWatcher</p>
        <h1>Loading verified public evidence</h1>
        <p>The page will appear when its current evidence state is available.</p>
        <div className={styles.progress} aria-hidden="true" />
      </section>
    </main>
  );
}
