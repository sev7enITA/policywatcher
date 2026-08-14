'use client';

import React, { useEffect, useId, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { Lang, RiskLevel } from '@/types';
import {
  RISK_GAUGE_CHART_SPEC,
  localizedChartText,
  summarizeRiskGaugeChart,
} from '@/lib/chartSpec';
import { CHART_TOKENS, getRiskChartColor } from '@/lib/chartTokens';
import AccessibleChartFrame, { type AccessibleChartTable } from './AccessibleChartFrame';
import styles from './Charts.module.css';

interface ComplianceGaugeProps {
  score: number;
  riskLevel: RiskLevel;
  lang: Lang;
}

const riskLabelMap = {
  en: { Low: 'Low Risk', Medium: 'Medium Risk', High: 'High Risk' },
  it: { Low: 'Rischio Basso', Medium: 'Rischio Medio', High: 'Rischio Alto' },
} as const;

function buildAccessibleTable(
  score: number,
  riskLevel: RiskLevel,
  lang: Lang
): AccessibleChartTable {
  const copy = RISK_GAUGE_CHART_SPEC.copy;
  const normalizedScore = Math.min(Math.max(Number.isFinite(score) ? score : 0, 0), 10);
  return {
    caption: localizedChartText(copy.title, lang),
    columns: [
      { key: 'score', label: localizedChartText(copy.columns.score, lang) },
      { key: 'risk', label: localizedChartText(copy.columns.risk, lang) },
    ],
    rows: [{
      score: `${normalizedScore.toFixed(1)}/10`,
      risk: riskLabelMap[lang][riskLevel],
    }],
  };
}

export default function ComplianceGauge({ score, riskLevel, lang }: ComplianceGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const reactId = useId().replace(/:/g, '');
  const gradientId = `risk-gauge-gradient-${reactId}`;
  const glowId = `risk-gauge-glow-${reactId}`;
  const spec = RISK_GAUGE_CHART_SPEC;
  const color = getRiskChartColor(riskLevel);
  const target = Math.min(Math.max(Number.isFinite(score) ? score : 0, 0), 10);
  const displayedScore = prefersReducedMotion ? target : animatedScore;

  useEffect(() => {
    if (prefersReducedMotion) return;

    let frame: number;
    let start: number | null = null;
    const duration = 1200;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(eased * target);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [prefersReducedMotion, target]);

  const size = 180;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = center - strokeWidth;
  const startAngle = 150;
  const endAngle = 390;
  const scoreAngle = startAngle + (displayedScore / 10) * (endAngle - startAngle);

  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const describeArc = (cx: number, cy: number, r: number, startA: number, endA: number) => {
    const start = polarToCartesian(cx, cy, r, endA);
    const end = polarToCartesian(cx, cy, r, startA);
    const largeArcFlag = endA - startA <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  const backgroundArc = describeArc(center, center, radius, startAngle, endAngle);
  const valueArc = displayedScore > 0.05
    ? describeArc(center, center, radius, startAngle, scoreAngle)
    : '';

  return (
    <AccessibleChartFrame
      spec={spec}
      lang={lang}
      summary={summarizeRiskGaugeChart(score, riskLevel, lang)}
      table={buildAccessibleTable(score, riskLevel, lang)}
    >
      <div className={styles.gaugeVisual}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.8} />
              <stop offset="100%" stopColor={color} stopOpacity={1} />
            </linearGradient>
            <filter id={glowId}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d={backgroundArc}
            fill="none"
            stroke={CHART_TOKENS.track}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {valueArc && (
            <path
              d={valueArc}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              filter={`url(#${glowId})`}
            />
          )}
        </svg>
        <div className={styles.gaugeCenter}>
          <div className={styles.gaugeScore} style={{ color }}>
            {displayedScore.toFixed(1)}
          </div>
          <div className={styles.gaugeLabel}>{riskLabelMap[lang][riskLevel]}</div>
        </div>
      </div>
    </AccessibleChartFrame>
  );
}
