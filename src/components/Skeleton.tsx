'use client';

/**
 * Skeleton - shimmer placeholder loaders that replace the bare spinner.
 * Mimics the actual dashboard layout so the perceived load time feels faster.
 */
import styles from './Skeleton.module.css';

export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <div className={styles.logoBlock} />
        <div className={styles.titleBlock}>
          <div className={`${styles.line} ${styles.lineTitle}`} />
          <div className={`${styles.line} ${styles.lineTag}`} />
        </div>
        <div className={styles.riskBlock} />
      </div>
      <div className={`${styles.line} ${styles.lineFull}`} />
      <div className={`${styles.line} ${styles.lineFull}`} />
      <div className={`${styles.line} ${styles.lineShort}`} />
      <div className={styles.pillsRow}>
        <div className={styles.pill} />
        <div className={styles.pill} />
        <div className={styles.pill} />
      </div>
    </div>
  );
}

export function SkeletonStatsGrid() {
  return (
    <div className={styles.statsGrid}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={styles.statCard}>
          <div className={`${styles.line} ${styles.lineLabel}`} />
          <div className={`${styles.line} ${styles.lineValue}`} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
