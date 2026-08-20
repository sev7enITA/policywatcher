import Image from 'next/image';
import type { InternalStudyPayload, InternalStudyScenario } from '@/lib/internalExecutiveStudyTypes';
import ExecutiveStudyClient from './ExecutiveStudyClient';
import ExecutiveStudyOutline from './ExecutiveStudyOutline';
import InvestorEndSessionButton from '@/app/investor/executive-study/InvestorEndSessionButton';
import styles from './executiveStudy.module.css';

type StudyAccessContext =
  | { mode: 'internal'; role: 'admin' | 'auditor' }
  | { mode: 'investor'; recipientLabel: string; expiresAt: Date };

export function formatAccessExpiry(value: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(value);
}

export default function ExecutiveStudyDocument({
  study,
  initialScenario,
  access,
}: {
  study: InternalStudyPayload;
  initialScenario: InternalStudyScenario;
  access: StudyAccessContext;
}) {
  const c = study.copy.strings;
  const investor = access.mode === 'investor' ? access : null;
  const expiryLabel = investor ? formatAccessExpiry(investor.expiresAt) : null;
  const roleSeal = access.mode === 'investor'
    ? `${access.recipientLabel} · investor read only`
    : `${access.role} · read only`;

  return (
    <div className={styles.page} data-internal-study="true" data-access-mode={access.mode}>
      {investor ? (
        <header className={styles.investorAccessBar}>
          <div className={styles.investorBrand}>
            <span><Image src="/logo-mark.png" alt="" width={24} height={24} /></span>
            <div><strong>PolicyWatcher</strong><small>Investor data room</small></div>
          </div>
          <dl>
            <div><dt>Recipient</dt><dd>{investor.recipientLabel}</dd></div>
            <div><dt>Access expires</dt><dd><time dateTime={investor.expiresAt.toISOString()}>{expiryLabel}</time></dd></div>
          </dl>
          <InvestorEndSessionButton />
        </header>
      ) : null}

      <aside className={styles.confidentialBand} role="note" aria-label="Confidentiality notice">
        <div>
          <strong>{c.confidentialityLabel}</strong>
          <span>{investor
            ? `Recipient-specific, read-only investor access for ${investor.recipientLabel}. Do not redistribute.`
            : c.confidentialityBody}</span>
        </div>
        <span className={styles.roleSeal}>{roleSeal}</span>
      </aside>

      <header className={styles.hero}>
        <div className={styles.heroIndex} aria-hidden="true">
          <span>{investor ? 'Investor decision document' : 'Internal decision document'}</span>
          <strong>26</strong>
        </div>
        <div className={styles.heroCopy}>
          <div className={styles.heroTopline}><p className={styles.eyebrow}>{c.heroEyebrow}</p><span>{study.researchCutoff}</span></div>
          <h1>{c.heroTitle}</h1>
          <p className={styles.heroLead}>{c.heroLead}</p>
          <dl className={styles.heroMeta}>
            <div><dt>Scope</dt><dd>{c.heroScope}</dd></div>
            <div><dt>Audience</dt><dd>{c.heroAudience}</dd></div>
            <div><dt>Boundary</dt><dd>{c.heroBoundary}</dd></div>
          </dl>
        </div>
        <aside className={styles.recommendation}>
          <span className={styles.recommendationLabel}>{c.recommendationLabel}</span>
          <h2>{c.recommendationTitle}</h2>
          <p>{c.recommendationBody}</p>
          <dl>{study.copy.recommendationItems.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.body}</dd></div>)}</dl>
        </aside>
      </header>

      <ExecutiveStudyOutline />
      <ExecutiveStudyClient study={study} initialScenario={initialScenario} />
    </div>
  );
}
