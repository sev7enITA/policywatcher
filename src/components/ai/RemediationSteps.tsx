'use client';

/**
 * RemediationSteps - action-oriented rendering of the remediation list.
 *
 * Replaces the flat text list with numbered steps, each with an icon,
 * a short description, and an optional CTA button linking to the action URL.
 */
import { ArrowUpRight, ShieldCheck, Wrench } from 'lucide-react';
import styles from './RemediationSteps.module.css';
import type { Lang, Remediation } from '@/types';
import { parseRemediations } from './parseAi';

interface RemediationStepsProps {
  remediationsJson: string | null | undefined;
  lang: Lang;
}

export default function RemediationSteps({
  remediationsJson,
  lang,
}: RemediationStepsProps) {
  const steps: Remediation[] = parseRemediations(remediationsJson);
  if (steps.length === 0) return null;

  const isIt = lang === 'it';

  return (
    <div className={styles.wrapper}>
      <ol className={styles.list}>
        {steps.map((s, i) => {
          const title = isIt ? s.titleIt : s.titleEn;
          const desc = isIt ? s.descriptionIt : s.descriptionEn;
          const actionText = isIt ? s.actionTextIt : s.actionTextEn;
          return (
            <li key={i} className={styles.step}>
              <div className={styles.stepNumber}>{i + 1}</div>
              <div className={styles.stepBody}>
                <div className={styles.stepTitle}>
                  <Wrench size={14} className={styles.stepTitleIcon} />
                  {title}
                </div>
                <p className={styles.stepDesc}>{desc}</p>
                {s.actionUrl && actionText && (
                  <a
                    href={s.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.cta}
                  >
                    <ShieldCheck size={13} />
                    {actionText}
                    <ArrowUpRight size={13} />
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
