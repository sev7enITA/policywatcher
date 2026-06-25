'use client';

/**
 * RiskReasons - explains WHY the risk score is what it is.
 *
 * Renders up to 3 compact chips, each showing a specific reason + its
 * delta contribution to the score (e.g. "+2"). Designed to sit right
 * under the risk score for instant context.
 */
import { AlertOctagon, AlertTriangle, Info, TrendingUp, TrendingDown } from 'lucide-react';
import styles from './RiskReasons.module.css';
import type { Lang, RiskReason } from '@/types';
import { parseRiskReasons } from './parseAi';

interface RiskReasonsProps {
  riskReasonsJson?: string | null;
  lang: Lang;
}

const iconMap = {
  alert: <AlertOctagon size={15} />,
  warning: <AlertTriangle size={15} />,
  info: <Info size={15} />,
};

export default function RiskReasons({ riskReasonsJson, lang }: RiskReasonsProps) {
  const reasons: RiskReason[] = parseRiskReasons(riskReasonsJson);
  if (reasons.length === 0) return null;

  const isIt = lang === 'it';

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        {isIt ? 'Perché questo punteggio' : 'Why this score'}
      </div>
      <div className={styles.grid}>
        {reasons.map((r, i) => {
          const text = isIt ? r.textIt : r.textEn;
          const delta = r.deltaScore || 0;
          return (
            <div key={i} className={`${styles.chip} ${styles[`i_${r.icon}`]}`}>
              <span className={styles.chipIcon}>{iconMap[r.icon]}</span>
              <span className={styles.chipText}>{text}</span>
              {delta !== 0 && (
                <span
                  className={`${styles.delta} ${
                    delta > 0 ? styles.deltaUp : styles.deltaDown
                  }`}
                >
                  {delta > 0 ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  {delta > 0 ? `+${delta}` : delta}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
