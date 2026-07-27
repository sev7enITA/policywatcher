import styles from './EvidenceStatusRail.module.css';

interface EvidenceStatusRailProps {
  label: string;
  title: string;
  detail: string;
  meta?: string;
  action?: React.ReactNode;
  tone?: 'live' | 'guide' | 'review' | 'blocked';
}

export default function EvidenceStatusRail({
  label,
  title,
  detail,
  meta,
  action,
  tone = 'guide',
}: EvidenceStatusRailProps) {
  return (
    <aside className={styles.rail} data-tone={tone} aria-label={label}>
      <div className={styles.rule} aria-hidden="true" />
      <div className={styles.copy}>
        <span>{label}</span>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
      {(meta || action) && (
        <div className={styles.meta}>
          {meta && <span>{meta}</span>}
          {action}
        </div>
      )}
    </aside>
  );
}
