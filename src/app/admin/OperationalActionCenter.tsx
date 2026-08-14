import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CircleHelp,
  ShieldCheck,
} from 'lucide-react';
import type { AdminActionCenterResult, AdminActionPriority } from '@/lib/adminActionCenter';
import {
  getAdminDashboardRolePresentation,
  presentActionCenterForRole,
  type AdminConsoleRole,
} from '@/lib/adminRolePresentation';
import styles from './admin.module.css';

function formatOperationalTimestamp(value: string | null): string {
  if (!value) return 'Timestamp unavailable';
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function PriorityIcon({ priority }: { priority: AdminActionPriority }) {
  if (priority.severity === 'unavailable') {
    return <CircleHelp size={15} aria-hidden="true" />;
  }
  return <AlertTriangle size={15} aria-hidden="true" />;
}

export function OperationalActionCenter({
  result,
  role,
  state = 'loaded',
}: {
  result: AdminActionCenterResult;
  role: AdminConsoleRole;
  state?: 'loaded' | 'failed';
}) {
  const presentedResult = presentActionCenterForRole(result, role);
  const rolePresentation = getAdminDashboardRolePresentation(role);

  return (
    <section
      className={styles.actionCenter}
      aria-labelledby="operational-action-center-title"
      aria-live="polite"
      aria-busy="false"
      data-state={state}
      tabIndex={-1}
    >
      <header className={styles.actionCenterHeader}>
        <div>
          <span className={styles.actionCenterEyebrow}>{rolePresentation.actionCenterEyebrow}</span>
          <h2 id="operational-action-center-title">Operational Action Center</h2>
          <p>{rolePresentation.actionCenterDescription}</p>
        </div>
        <div className={styles.actionCenterCheck}>
          <span>Checked at</span>
          <time dateTime={presentedResult.checkedAt}>{formatOperationalTimestamp(presentedResult.checkedAt)} UTC</time>
        </div>
      </header>

      {presentedResult.priorities.length > 0 ? (
        <ol className={styles.priorityList} aria-label="Current operational priorities">
          {presentedResult.priorities.map((item, index) => (
            <li
              className={`${styles.priorityItem} ${styles[`priority_${item.severity}`]}`}
              key={item.id}
              data-operational-priority="true"
            >
              <div className={styles.priorityRail} aria-hidden="true">
                <span>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <div className={styles.priorityContent}>
                <div className={styles.priorityHeading}>
                  <span className={styles.prioritySeverity}>
                    <PriorityIcon priority={item} />
                    Severity: {item.severityLabel}
                  </span>
                  <h3>{item.title}</h3>
                </div>
                <p className={styles.priorityCause}>{item.cause}</p>
                <p className={styles.priorityImpact}><strong>Impact:</strong> {item.impact}</p>
                <dl className={styles.priorityMeta}>
                  <div>
                    <dt>{item.timestampLabel}</dt>
                    <dd>
                      {item.timestamp ? (
                        <time dateTime={item.timestamp}>{formatOperationalTimestamp(item.timestamp)} UTC</time>
                      ) : 'Timestamp unavailable'}
                    </dd>
                  </div>
                  <div>
                    <dt>Affected records</dt>
                    <dd>{item.affectedRecords ?? 'Count unavailable'}</dd>
                  </div>
                  <div>
                    <dt>Metric</dt>
                    <dd>{item.metricState === 'available' ? 'Available' : 'Unavailable'}</dd>
                  </div>
                </dl>
              </div>
              <Link
                className={styles.priorityAction}
                href={item.action.href}
                data-dashboard-action="true"
                data-priority-id={item.id}
                data-canonical-destination={item.action.href}
              >
                {item.action.label}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <div className={styles.actionCenterEmpty} role="status">
          <ShieldCheck size={18} aria-hidden="true" />
          <div>
            <strong>No current priority returned</strong>
            <p>This applies only to the checked operational window and is not a health certification.</p>
          </div>
        </div>
      )}

      <p className={styles.actionCenterBoundary}>{presentedResult.checkedWindow} Maximum five priorities are shown.</p>
    </section>
  );
}
