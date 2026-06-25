'use client';

/**
 * CardRiskReasons - compact version of RiskReasons for the dashboard cards.
 *
 * Shows the top reason(s) inline under the TL;DR, so the user understands
 * WHY a company's score is what it is without opening the detail panel.
 * Renders at most 2 reasons to keep cards scannable.
 */
import { AlertOctagon, AlertTriangle, Info } from 'lucide-react';
import styles from './CardRiskReasons.module.css';
import type { Lang, RiskReason } from '@/types';
import { parseRiskReasons } from './parseAi';

interface CardRiskReasonsProps {
  riskReasonsJson?: string | null;
  lang: Lang;
}

const iconMap = {
  alert: <AlertOctagon size={12} />,
  warning: <AlertTriangle size={12} />,
  info: <Info size={12} />,
};

export default function CardRiskReasons({
  riskReasonsJson,
  lang,
}: CardRiskReasonsProps) {
  const reasons: RiskReason[] = parseRiskReasons(riskReasonsJson).slice(0, 2);
  if (reasons.length === 0) return null;

  const isIt = lang === 'it';

  return (
    <div className={styles.wrapper}>
      {reasons.map((r, i) => {
        const text = isIt ? r.textIt : r.textEn;
        return (
          <span key={i} className={`${styles.chip} ${styles[`i_${r.icon}`]}`}>
            <span className={styles.icon}>{iconMap[r.icon]}</span>
            <span className={styles.text}>{text}</span>
          </span>
        );
      })}
    </div>
  );
}
