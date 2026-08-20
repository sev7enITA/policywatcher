import Link from 'next/link';
import { AlertTriangle, ArrowUpRight, CircleHelp, Database, ShieldCheck } from 'lucide-react';
import type {
  PublicationReadinessResult,
  PublicationReadinessStage,
} from '@/lib/publicationReadiness';
import {
  presentPublicationReadinessForRole,
  type AdminConsoleRole,
} from '@/lib/adminRolePresentation';
import styles from './admin.module.css';

function formatCheckedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unavailable';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function stageState(stage: PublicationReadinessStage): string {
  if (stage.availability === 'review') return 'Review consistency';
  if (stage.availability === 'unavailable') return 'Unavailable';
  return 'Measured';
}

function metricValue(value: number | null): string {
  return value === null ? 'Not available' : value.toLocaleString('en-US');
}

function StageStateIcon({ availability }: Pick<PublicationReadinessStage, 'availability'>) {
  if (availability === 'review') return <AlertTriangle size={13} aria-hidden="true" />;
  if (availability === 'unavailable') return <CircleHelp size={13} aria-hidden="true" />;
  return <ShieldCheck size={13} aria-hidden="true" />;
}

export function PublicationReadinessFunnel({
  result,
  role,
}: {
  result: PublicationReadinessResult;
  role: AdminConsoleRole;
}) {
  const presentedResult = presentPublicationReadinessForRole(result, role);

  return (
    <section className={styles.readinessFunnel} aria-labelledby="publication-readiness-title">
      <header className={styles.readinessFunnelHeader}>
        <div>
          <span className={styles.readinessFunnelEyebrow}>Publication readiness</span>
          <h3 id="publication-readiness-title">Evidence funnel</h3>
          <p>Five policy-level evidence stages measured against one configured denominator.</p>
        </div>
        <div className={styles.readinessFunnelChecked}>
          <span>Checked</span>
          <time dateTime={presentedResult.checkedAt}>{formatCheckedAt(presentedResult.checkedAt)}</time>
          <span className={styles.readinessCaptureLabel}>Latest capture</span>
          {presentedResult.latestCapture.capturedAt ? (
            <time dateTime={presentedResult.latestCapture.capturedAt}>
              {formatCheckedAt(presentedResult.latestCapture.capturedAt)}
            </time>
          ) : (
            <strong>Not available</strong>
          )}
        </div>
      </header>

      {!presentedResult.available ? (
        <div className={styles.readinessFunnelUnavailable} role="status">
          <Database size={20} aria-hidden="true" />
          <div>
            <strong>Publication metrics unavailable</strong>
            <p>No stage is shown as measured because the configured policy denominator could not be established.</p>
          </div>
          <Link href="/admin/database">{role === 'auditor' ? 'Verify database evidence' : 'Open Database Readiness'} <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </div>
      ) : (
        <ol className={styles.readinessStageList} aria-label="Publication readiness stages">
          {presentedResult.stages.map((stage, index) => (
            <li
              key={stage.id}
              className={styles.readinessStage}
              data-availability={stage.availability}
              style={{ '--readiness-step': `${100 - index * 8}%` } as React.CSSProperties}
            >
              <div className={styles.readinessStageRail} aria-hidden="true"><span>{index + 1}</span></div>
              <div className={styles.readinessStageBody}>
                <div className={styles.readinessStageHeading}>
                  <h4>{stage.label}</h4>
                  <span className={styles.readinessStageState}>
                    <StageStateIcon availability={stage.availability} />
                    {stageState(stage)}
                  </span>
                </div>
                <div className={styles.readinessStageLedger}>
                  <strong>{metricValue(stage.count)} <span>/ {metricValue(stage.denominator)}</span></strong>
                  <span>Excluded {metricValue(stage.excluded)}</span>
                </div>
                <p>{stage.definition}</p>
                {stage.reason && <p className={styles.readinessStageReason}>{stage.reason}</p>}
                {stage.boundary && <p className={styles.readinessStageWarning}>{stage.boundary}</p>}
                <Link href={stage.actionHref}>{stage.actionLabel} <ArrowUpRight size={14} aria-hidden="true" /></Link>
              </div>
            </li>
          ))}
        </ol>
      )}

      {presentedResult.consistencyWarning && (
        <p className={styles.readinessConsistencyWarning} role="status">
          <AlertTriangle size={15} aria-hidden="true" />
          {presentedResult.consistencyWarning}
        </p>
      )}

      <details className={styles.readinessTableDisclosure}>
        <summary>Open text table equivalent</summary>
        <div className={styles.readinessTableWrap}>
          <table>
            <caption>Publication readiness stage counts, exclusions, states and responsible actions</caption>
            <thead>
              <tr><th scope="col">Stage</th><th scope="col">State</th><th scope="col">Count</th><th scope="col">Denominator</th><th scope="col">Excluded</th><th scope="col">Action</th></tr>
            </thead>
            <tbody>
              {presentedResult.stages.map((stage) => (
                <tr key={stage.id}>
                  <th scope="row">{stage.label}</th>
                  <td>{stageState(stage)}</td>
                  <td>{metricValue(stage.count)}</td>
                  <td>{metricValue(stage.denominator)}</td>
                  <td>{metricValue(stage.excluded)}</td>
                  <td><Link href={stage.actionHref}>{stage.actionLabel}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <p className={styles.readinessFunnelBoundary}>{presentedResult.scopeBoundary}</p>
    </section>
  );
}
