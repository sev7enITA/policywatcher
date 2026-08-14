'use client';

/**
 * RiskTrendPanel - historical risk trend with real aggregated data.
 *
 * Fetches from /api/trends?companyId=... or ?industry=... and renders:
 *  - A compact summary row (latest score, delta vs first, avg)
 *  - The AreaChart trend (reuses the existing RiskTrendChart visual)
 *
 * Used in the company-level detail view and in the A/B compare view.
 */
import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import RiskTrendChart from './RiskTrendChart';
import styles from './Charts.module.css';
import type { Lang } from '@/types';
import type { RiskTrendPoint, RiskTrendSummary } from '@/lib/riskTrends';
import { loadPublicDataSource } from '@/lib/dataSourceRegistry';

interface RiskTrendPanelProps {
  companyId?: string;
  industry?: string;
  lang: Lang;
}

const translations = {
  en: {
    title: 'Risk Score Over Time',
    latest: 'Latest',
    avg: 'Average',
    delta: 'Change',
    points: 'snapshots',
    loading: 'Loading trend...',
    noData: 'No historical data yet. Run a scan to start tracking.',
    vs: 'vs first',
  },
  it: {
    title: 'Punteggio Rischio Nel Tempo',
    latest: 'Ultimo',
    avg: 'Media',
    delta: 'Variazione',
    points: 'rilevazioni',
    loading: 'Caricamento trend...',
    noData: 'Nessun dato storico. Esegui una scansione per iniziare il tracciamento.',
    vs: 'vs primo',
  },
};

export default function RiskTrendPanel({
  companyId,
  industry,
  lang,
}: RiskTrendPanelProps) {
  const [points, setPoints] = useState<RiskTrendPoint[]>([]);
  const [summary, setSummary] = useState<RiskTrendSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const t = translations[lang];

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setLoading(true);
    });

    loadPublicDataSource<{ points?: RiskTrendPoint[]; summary?: RiskTrendSummary }>(
      'riskTrends',
      { companyId, industry }
    )
      .then((result) => {
        if (!active) return;
        setPoints(result.data.points || []);
        setSummary(result.data.summary || null);
      })
      .catch((err) => console.error('Trend fetch failed:', err))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [companyId, industry]);

  if (loading) {
    return (
      <div className={styles.chartCard}>
        <h4 className={styles.chartTitle}>
          <Activity size={16} /> {t.title}
        </h4>
        <div
          style={{
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-dark)',
            fontSize: '0.82rem',
          }}
        >
          {t.loading}
        </div>
      </div>
    );
  }

  if (!summary || summary.count === 0) {
    return (
      <div className={styles.chartCard}>
        <h4 className={styles.chartTitle}>
          <Activity size={16} /> {t.title}
        </h4>
        <div
          style={{
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-dark)',
            fontSize: '0.82rem',
            textAlign: 'center',
            padding: '0 20px',
          }}
        >
          {t.noData}
        </div>
      </div>
    );
  }

  const delta = summary.delta;
  const deltaIcon =
    delta > 0 ? <TrendingUp size={13} /> : delta < 0 ? <TrendingDown size={13} /> : <Minus size={13} />;
  const deltaColor =
    delta > 0 ? 'var(--risk-high)' : delta < 0 ? 'var(--risk-low)' : 'var(--text-muted)';

  return (
    <div className={styles.chartCard}>
      <h4 className={styles.chartTitle}>
        <Activity size={16} /> {t.title}
      </h4>

      {/* Summary row */}
      <div style={trendStyles.summaryRow}>
        <div style={trendStyles.summaryItem}>
          <span style={trendStyles.summaryLabel}>{t.latest}</span>
          <span style={trendStyles.summaryValue}>{summary.latestScore}/10</span>
        </div>
        <div style={trendStyles.summaryItem}>
          <span style={trendStyles.summaryLabel}>{t.avg}</span>
          <span style={trendStyles.summaryValue}>{summary.avgScore}/10</span>
        </div>
        <div style={trendStyles.summaryItem}>
          <span style={trendStyles.summaryLabel}>
            {t.delta} ({t.vs})
          </span>
          <span
            style={{ ...trendStyles.summaryValue, color: deltaColor, display: 'inline-flex', alignItems: 'center', gap: 3 }}
          >
            {deltaIcon}
            {delta > 0 ? `+${delta}` : delta}
          </span>
        </div>
        <div style={trendStyles.summaryItem}>
          <span style={trendStyles.summaryLabel}>{t.points}</span>
          <span style={trendStyles.summaryValue}>{summary.count}</span>
        </div>
      </div>

      <RiskTrendChart data={points} lang={lang} embedded />
    </div>
  );
}

// Inline minimal styles (kept local to avoid touching Charts.module.css layout)
const trendStyles: Record<string, React.CSSProperties> = {
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    marginBottom: '16px',
    padding: '12px',
    background: 'var(--bg-secondary)',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    alignItems: 'center',
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: '0.65rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
  },
  summaryValue: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-main)',
  },
};
