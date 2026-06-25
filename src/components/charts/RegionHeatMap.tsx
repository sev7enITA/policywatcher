'use client';

import React, { useState } from 'react';
import type { RegionImpact, Lang, RiskLevel } from '@/types';
import styles from './Charts.module.css';

interface RegionHeatMapProps {
  regionImpacts: RegionImpact[];
  lang: Lang;
  onCellSelect?: (region: string, perspective: string) => void;
}

const REGIONS = ['EU', 'US', 'Global'] as const;
const PERSPECTIVES = ['Individual', 'Enterprise'] as const;

const translations = {
  en: {
    title: 'Region Risk Heat Map',
    individual: 'Individual',
    enterprise: 'Enterprise',
    noData: '--',
  },
  it: {
    title: 'Mappa di Rischio Regionale',
    individual: 'Privato',
    enterprise: 'Azienda',
    noData: '--',
  },
};

const riskLabelMap = {
  en: { Low: 'Low', Medium: 'Med', High: 'High' },
  it: { Low: 'Basso', Medium: 'Medio', High: 'Alto' },
};

function getCellStyle(riskLevel: RiskLevel): string {
  if (riskLevel === 'High') return styles.heatMapCellHigh;
  if (riskLevel === 'Medium') return styles.heatMapCellMedium;
  return styles.heatMapCellLow;
}

export default function RegionHeatMap({
  regionImpacts,
  lang,
  onCellSelect,
}: RegionHeatMapProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const t = translations[lang];

  const findImpact = (region: string, perspective: string) => {
    return regionImpacts.find(
      (ri) => ri.region === region && ri.perspective === perspective
    );
  };

  const handleClick = (region: string, perspective: string) => {
    const key = `${region}-${perspective}`;
    setSelected(selected === key ? null : key);
    onCellSelect?.(region, perspective);
  };

  return (
    <div className={styles.chartCard}>
      <h4 className={styles.chartTitle}>{t.title}</h4>

      <div className={styles.heatMapGrid}>
        {/* Column headers */}
        <div /> {/* Empty corner */}
        <div className={styles.heatMapHeader}>{t.individual}</div>
        <div className={styles.heatMapHeader}>{t.enterprise}</div>

        {/* Rows */}
        {REGIONS.map((region) => (
          <React.Fragment key={region}>
            <div className={styles.heatMapRowLabel}>{region}</div>
            {PERSPECTIVES.map((perspective) => {
              const impact = findImpact(region, perspective);
              const key = `${region}-${perspective}`;
              const isSelected = selected === key;

              if (!impact) {
                return (
                  <div
                    key={key}
                    className={styles.heatMapCell}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      color: 'var(--text-dark)',
                    }}
                  >
                    {t.noData}
                  </div>
                );
              }

              return (
                <button
                  key={key}
                  className={`${styles.heatMapCell} ${getCellStyle(impact.riskLevel as RiskLevel)} ${
                    isSelected ? styles.heatMapCellSelected : ''
                  }`}
                  onClick={() => handleClick(region, perspective)}
                  title={
                    lang === 'it'
                      ? impact.impactAnalysisIt
                      : impact.impactAnalysisEn
                  }
                  aria-pressed={isSelected}
                  aria-label={`${region} ${perspective}: ${impact.riskLevel}`}
                >
                  {riskLabelMap[lang][impact.riskLevel as RiskLevel]}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
