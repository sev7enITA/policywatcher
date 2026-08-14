'use client';

import React, { useId, useState } from 'react';
import type { Lang, Perspective, Region, RegionImpact, RiskLevel } from '@/types';
import {
  REGION_HEAT_MAP_CHART_SPEC,
  localizedChartText,
  summarizeRegionHeatMap,
} from '@/lib/chartSpec';
import AccessibleChartFrame, { type AccessibleChartTable } from './AccessibleChartFrame';
import styles from './Charts.module.css';

interface RegionHeatMapProps {
  regionImpacts: RegionImpact[];
  lang: Lang;
  selectedRegion?: Region;
  selectedPerspective?: Perspective;
  onCellSelect?: (region: Region, perspective: Perspective) => void;
}

const REGIONS = ['EU', 'US', 'Global'] as const;
const PERSPECTIVES = ['Individual', 'Enterprise'] as const;

const perspectiveLabels = {
  en: { Individual: 'Individual', Enterprise: 'Enterprise' },
  it: { Individual: 'Privato', Enterprise: 'Azienda' },
} as const;

const riskLabels = {
  en: { Low: 'Low', Medium: 'Medium', High: 'High' },
  it: { Low: 'Basso', Medium: 'Medio', High: 'Alto' },
} as const;

function getCellStyle(riskLevel: RiskLevel): string {
  if (riskLevel === 'High') return styles.heatMapCellHigh;
  if (riskLevel === 'Medium') return styles.heatMapCellMedium;
  return styles.heatMapCellLow;
}

function buildAccessibleTable(
  impacts: readonly RegionImpact[],
  lang: Lang
): AccessibleChartTable {
  const copy = REGION_HEAT_MAP_CHART_SPEC.copy;
  return {
    caption: localizedChartText(copy.title, lang),
    columns: [
      { key: 'region', label: localizedChartText(copy.columns.region, lang) },
      { key: 'perspective', label: localizedChartText(copy.columns.perspective, lang) },
      { key: 'risk', label: localizedChartText(copy.columns.risk, lang) },
      { key: 'analysis', label: localizedChartText(copy.columns.analysis, lang) },
    ],
    rows: impacts.map((impact) => ({
      region: impact.region,
      perspective: perspectiveLabels[lang][impact.perspective],
      risk: riskLabels[lang][impact.riskLevel],
      analysis: lang === 'it' ? impact.impactAnalysisIt : impact.impactAnalysisEn,
    })),
  };
}

export default function RegionHeatMap({
  regionImpacts,
  lang,
  selectedRegion,
  selectedPerspective,
  onCellSelect,
}: RegionHeatMapProps) {
  const [localSelection, setLocalSelection] = useState<string | null>(null);
  const selectionPanelId = `region-impact-selection-${useId().replace(/:/g, '')}`;
  const spec = REGION_HEAT_MAP_CHART_SPEC;
  const noData = lang === 'it' ? 'Non valutato' : 'Not assessed';
  const impactByCell = new Map(
    regionImpacts.map((impact) => [`${impact.region}-${impact.perspective}`, impact])
  );
  const visibleImpacts = REGIONS.flatMap((region) =>
    PERSPECTIVES.flatMap((perspective) => {
      const impact = impactByCell.get(`${region}-${perspective}`);
      return impact ? [impact] : [];
    })
  );

  const controlledSelection = selectedRegion && selectedPerspective
    ? `${selectedRegion}-${selectedPerspective}`
    : null;
  const selected = controlledSelection || localSelection;
  const selectedImpact = selected ? impactByCell.get(selected) : undefined;

  const handleClick = (region: Region, perspective: Perspective) => {
    const key = `${region}-${perspective}`;
    setLocalSelection(key);
    onCellSelect?.(region, perspective);
  };

  return (
    <AccessibleChartFrame
      spec={spec}
      lang={lang}
      summary={summarizeRegionHeatMap(visibleImpacts, lang)}
      table={buildAccessibleTable(visibleImpacts, lang)}
      visualAriaHidden={false}
    >
      <div className={styles.heatMapGrid}>
        <div aria-hidden="true" />
        {PERSPECTIVES.map((perspective) => (
          <div key={perspective} className={styles.heatMapHeader}>
            {perspectiveLabels[lang][perspective]}
          </div>
        ))}

        {REGIONS.map((region) => (
          <React.Fragment key={region}>
            <div className={styles.heatMapRowLabel}>{region}</div>
            {PERSPECTIVES.map((perspective) => {
              const key = `${region}-${perspective}`;
              const impact = impactByCell.get(key);
              if (!impact) {
                return (
                  <div key={key} className={`${styles.heatMapCell} ${styles.heatMapCellMissing}`}>
                    {noData}
                  </div>
                );
              }

              const label = `${region}, ${perspectiveLabels[lang][perspective]}: ${riskLabels[lang][impact.riskLevel]}`;
              return (
                <button
                  type="button"
                  key={key}
                  className={`${styles.heatMapCell} ${getCellStyle(impact.riskLevel)} ${
                    selected === key ? styles.heatMapCellSelected : ''
                  }`}
                  onClick={() => handleClick(region, perspective)}
                  title={lang === 'it' ? impact.impactAnalysisIt : impact.impactAnalysisEn}
                  aria-pressed={selected === key}
                  aria-label={label}
                  aria-controls={selectionPanelId}
                >
                  {riskLabels[lang][impact.riskLevel]}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div
        id={selectionPanelId}
        className={styles.chartSelectionInspector}
        role="region"
        aria-live="polite"
        aria-label={lang === 'it' ? 'Dettaglio contesto regionale selezionato' : 'Selected regional context detail'}
      >
        {selectedImpact ? (
          <>
            <div className={styles.chartSelectionHeading}>
              <span>{selectedImpact.region} / {perspectiveLabels[lang][selectedImpact.perspective]}</span>
              <strong>{riskLabels[lang][selectedImpact.riskLevel]}</strong>
            </div>
            <p>{lang === 'it' ? selectedImpact.impactAnalysisIt : selectedImpact.impactAnalysisEn}</p>
            {(lang === 'it' ? selectedImpact.complianceNoteIt : selectedImpact.complianceNoteEn) && (
              <small>
                {lang === 'it' ? selectedImpact.complianceNoteIt : selectedImpact.complianceNoteEn}
              </small>
            )}
          </>
        ) : (
          <p>
            {lang === 'it'
              ? 'Seleziona una cella valutata per ispezionare il contesto. Le celle mancanti restano Non valutato.'
              : 'Select an assessed cell to inspect its context. Missing cells remain Not assessed.'}
          </p>
        )}
      </div>
    </AccessibleChartFrame>
  );
}
