'use client';

/**
 * AISummary - the new user-friendly rendering of Gemini's structured output.
 *
 * Replaces the old "wall of text" executive summary with:
 *   1. A bold one-sentence TL;DR
 *   2. Key points as scannable sentiment-tagged bullets
 *
 * If the structured fields (tldrEn/keyPointsJson) are missing (older DB rows),
 * it gracefully falls back to the legacy aiSummaryEn paragraph.
 */
import { Sparkles, CheckCircle2, AlertTriangle, MinusCircle } from 'lucide-react';
import styles from './AISummary.module.css';
import type { Lang, KeyPoint } from '@/types';
import { parseKeyPoints } from './parseAi';

interface AISummaryProps {
  tldrEn?: string | null;
  tldrIt?: string | null;
  keyPointsJson?: string | null;
  legacySummaryEn: string;
  legacySummaryIt: string;
  lang: Lang;
}

const sentimentIcon = {
  positive: <CheckCircle2 size={14} />,
  neutral: <MinusCircle size={14} />,
  negative: <AlertTriangle size={14} />,
};

export default function AISummary({
  tldrEn,
  tldrIt,
  keyPointsJson,
  legacySummaryEn,
  legacySummaryIt,
  lang,
}: AISummaryProps) {
  const isIt = lang === 'it';
  const tldr = isIt ? tldrIt || tldrEn : tldrEn;
  const points: KeyPoint[] = parseKeyPoints(keyPointsJson);

  return (
    <div className={styles.wrapper}>
      {tldr ? (
        <>
          {/* TL;DR */}
          <div className={styles.tldrRow}>
            <Sparkles size={18} className={styles.tldrIcon} />
            <p className={styles.tldr}>{tldr}</p>
          </div>

          {/* Key points */}
          {points.length > 0 && (
            <ul className={styles.points}>
              {points.map((p, i) => {
                const text = isIt ? p.textIt : p.textEn;
                return (
                  <li
                    key={i}
                    className={`${styles.point} ${styles[`s_${p.sentiment}`]}`}
                  >
                    <span className={styles.pointIcon}>
                      {sentimentIcon[p.sentiment]}
                    </span>
                    <span className={styles.pointText}>{text}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : (
        // Graceful fallback for legacy rows without structured fields
        <p className={styles.legacy}>{isIt ? legacySummaryIt : legacySummaryEn}</p>
      )}
    </div>
  );
}
