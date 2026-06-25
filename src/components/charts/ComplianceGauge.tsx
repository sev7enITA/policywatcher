'use client';

import React, { useEffect, useState } from 'react';
import type { Lang, RiskLevel } from '@/types';
import styles from './Charts.module.css';

interface ComplianceGaugeProps {
  score: number; // 0-10
  riskLevel: RiskLevel;
  lang: Lang;
}

const riskColorMap: Record<RiskLevel, string> = {
  Low: '#10b981',
  Medium: '#f59e0b',
  High: '#f43f5e',
};

const riskLabelMap = {
  en: { Low: 'Low Risk', Medium: 'Medium Risk', High: 'High Risk' },
  it: { Low: 'Rischio Basso', Medium: 'Rischio Medio', High: 'Rischio Alto' },
};

const translations = {
  en: { title: 'Compliance Score' },
  it: { title: 'Punteggio Compliance' },
};

export default function ComplianceGauge({
  score,
  riskLevel,
  lang,
}: ComplianceGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const t = translations[lang];
  const color = riskColorMap[riskLevel];

  // Animate score on mount
  useEffect(() => {
    const target = Math.min(Math.max(score, 0), 10);
    let frame: number;
    let start: number | null = null;
    const duration = 1200;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(eased * target);
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  // SVG arc calculations
  const size = 180;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = center - strokeWidth;
  // Arc spans 240 degrees (from 150 to 390 / -210 to 30)
  const startAngle = 150;
  const endAngle = 390;
  const totalAngle = endAngle - startAngle;
  const scoreAngle = startAngle + (animatedScore / 10) * totalAngle;

  const polarToCartesian = (
    cx: number,
    cy: number,
    r: number,
    angleDeg: number
  ) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const describeArc = (
    cx: number,
    cy: number,
    r: number,
    startA: number,
    endA: number
  ) => {
    const start = polarToCartesian(cx, cy, r, endA);
    const end = polarToCartesian(cx, cy, r, startA);
    const largeArcFlag = endA - startA <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  const bgArc = describeArc(center, center, radius, startAngle, endAngle);
  const valueArc =
    animatedScore > 0.05
      ? describeArc(center, center, radius, startAngle, scoreAngle)
      : '';

  return (
    <div className={styles.chartCard}>
      <h4 className={styles.chartTitle}>{t.title}</h4>
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          margin: '0 auto',
        }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.8} />
              <stop offset="100%" stopColor={color} stopOpacity={1} />
            </linearGradient>
            <filter id="gaugeGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Background track */}
          <path
            d={bgArc}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Value arc */}
          {valueArc && (
            <path
              d={valueArc}
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              filter="url(#gaugeGlow)"
            />
          )}
        </svg>
        {/* Center text */}
        <div className={styles.gaugeCenter}>
          <div className={styles.gaugeScore} style={{ color }}>
            {animatedScore.toFixed(1)}
          </div>
          <div className={styles.gaugeLabel}>
            {riskLabelMap[lang][riskLevel]}
          </div>
        </div>
      </div>
    </div>
  );
}
