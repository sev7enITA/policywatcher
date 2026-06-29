'use client';

/**
 * CompareModal - side-by-side A/B comparison of two companies.
 *
 * Features:
 *  - Two dropdown selectors to pick the companies
 *  - Radar (spider) chart comparing 15 KPIs
 *  - Summary header: overall score + risk for each
 *  - Per-KPI diff table with winner highlight
 */
import { useState, useEffect, useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { X, GitCompare, Trophy, Minus } from 'lucide-react';
import styles from './CompareModal.module.css';
import type { Company, Lang } from '@/types';

/** A single data point on the radar/spider chart for one KPI dimension. */
interface RadarPoint {
  /** KPI machine key, e.g. `kpiDataCollection`. */
  key: string;
  /** English display label. */
  labelEn: string;
  /** Italian display label. */
  labelIt: string;
  /** Normalised numeric score (0–100). */
  value: number;
  /** Human-readable raw assessment text (e.g. "Restricted"). */
  rawValue: string;
  /** Score for company A (populated when merging two profiles). */
  a?: number;
  /** Score for company B (populated when merging two profiles). */
  b?: number;
}

/** Comparison profile returned by the `/api/compare` endpoint for one company. */
interface CompanyProfile {
  id: string;
  name: string;
  industry: string;
  website: string;
  logo: string;
  /** Aggregate compliance score on a 0–10 scale. */
  overallScore: number;
  /** Risk tier: "High" | "Medium" | "Low". */
  overallRisk: string;
  /** Per-KPI radar data points. */
  radar: RadarPoint[];
  /** Number of distinct policies tracked for this company. */
  policiesCount: number;
}

/** Props for the {@link CompareModal} component. */
interface CompareModalProps {
  /** Whether the modal overlay is currently visible. */
  isOpen: boolean;
  /** Dismiss callback. */
  onClose: () => void;
  /** Full company list used to populate the two dropdown selectors. */
  companies: Company[];
  /** Active UI language. */
  lang: Lang;
  /** Pre-selected company A id (e.g. from a dashboard action). */
  initialCompanyA?: string;
  /** Pre-selected company B id. */
  initialCompanyB?: string;
}

const translations = {
  en: {
    title: 'Compare Companies',
    subtitle: 'Side-by-side compliance & risk comparison',
    selectA: 'Select company A',
    selectB: 'Select company B',
    overall: 'Overall Score',
    risk: 'Risk Level',
    policies: 'Policies',
    radarTitle: 'KPI Radar (lower = safer)',
    tableTitle: 'Detailed Breakdown',
    kpi: 'KPI',
    winner: 'Safer',
    tie: 'Tie',
    pickBoth: 'Pick two companies to compare',
    industryAverage: 'Industry average',
  },
  it: {
    title: 'Confronta Aziende',
    subtitle: 'Confronto compliance e rischio affiancato',
    selectA: 'Seleziona azienda A',
    selectB: 'Seleziona azienda B',
    overall: 'Punteggio Globale',
    risk: 'Livello Rischio',
    policies: 'Policy',
    radarTitle: 'Radar KPI (più basso = più sicuro)',
    tableTitle: 'Dettaglio Comparato',
    kpi: 'KPI',
    winner: 'Più Sicuro',
    tie: 'Parità',
    pickBoth: 'Scegli due aziende da confrontare',
    industryAverage: 'Media settore',
  },
};

/**
 * Side-by-side A/B comparison modal for two companies.
 *
 * Displays summary cards, a radar chart overlaying 15 KPI dimensions,
 * and a detailed breakdown table highlighting the "safer" company per KPI.
 *
 * @param props - {@link CompareModalProps}
 * @returns The comparison modal overlay, or `null` when closed.
 */
export default function CompareModal({
  isOpen,
  onClose,
  companies,
  lang,
  initialCompanyA,
  initialCompanyB,
}: CompareModalProps) {
  const [companyAId, setCompanyAId] = useState(initialCompanyA || '');
  const [companyBId, setCompanyBId] = useState(initialCompanyB || '');
  const [profileA, setProfileA] = useState<CompanyProfile | null>(null);
  const [profileB, setProfileB] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);

  const t = translations[lang];
  const isIt = lang === 'it';

  useEffect(() => {
    if (isOpen) {
      // Auto-pick two distinct companies if none selected
      queueMicrotask(() => {
        if (!companyAId && companies[0]) setCompanyAId(companies[0].id);
        if (!companyBId && companies[1]) setCompanyBId(companies[1].id);
      });
    }
  }, [isOpen, companies, companyAId, companyBId]);

  useEffect(() => {
    if (!isOpen) return;
    if (!companyAId || !companyBId || companyAId === companyBId) {
      queueMicrotask(() => {
        setProfileA(null);
        setProfileB(null);
      });
      return;
    }

    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setLoading(true);
      fetch(`/api/compare?companyA=${companyAId}&companyB=${companyBId}`)
        .then((r) => r.json())
        .then((data) => {
          if (!active) return;
          setProfileA(data.companyA || null);
          setProfileB(data.companyB || null);
        })
        .catch((err) => console.error('Compare fetch failed:', err))
        .finally(() => {
          if (active) setLoading(false);
        });
      });

    return () => {
      active = false;
    };
  }, [isOpen, companyAId, companyBId]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 250);
  };

  // Build merged radar data for the chart
  const radarData = useMemo<RadarPoint[]>(() => {
    if (!profileA || !profileB) return [];
    return profileA.radar.map((point, idx) => ({
      ...point,
      a: profileA.radar[idx].value,
      b: profileB.radar[idx].value,
    }));
  }, [profileA, profileB]);

  if (!isOpen) return null;

  const getRiskColor = (risk: string) =>
    risk === 'High'
      ? 'var(--risk-high)'
      : risk === 'Medium'
      ? 'var(--risk-medium)'
      : 'var(--risk-low)';

  return (
    <div className={styles.overlay} onClick={handleClose} role="dialog" aria-modal="true">
      <div
        className={`${styles.modal} ${closing ? styles.modalClosing : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>
              <GitCompare size={20} /> {t.title}
            </h2>
            <span className={styles.subtitle}>{t.subtitle}</span>
          </div>
          <button onClick={handleClose} className={styles.closeBtn} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Selectors */}
        <div className={styles.selectors}>
          <div className={styles.selectorGroup}>
            <label className={styles.selectorLabel}>{t.selectA}</label>
            <select
              value={companyAId}
              onChange={(e) => setCompanyAId(e.target.value)}
              className={`${styles.select} ${styles.selectA}`}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.vsBadge}>VS</div>
          <div className={styles.selectorGroup}>
            <label className={styles.selectorLabel}>{t.selectB}</label>
            <select
              value={companyBId}
              onChange={(e) => setCompanyBId(e.target.value)}
              className={`${styles.select} ${styles.selectB}`}
            >
              <option value="industry-average">{t.industryAverage}</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Body */}
        {!profileA || !profileB ? (
          <div className={styles.placeholder}>
            {companyAId === companyBId && companyAId ? (
              <p>{isIt ? 'Seleziona due aziende diverse' : 'Pick two different companies'}</p>
            ) : (
              <p>{t.pickBoth}</p>
            )}
          </div>
        ) : loading ? (
          <div className={styles.placeholder}>
            <p>{isIt ? 'Confronto in corso...' : 'Comparing...'}</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className={styles.summaryRow}>
              {[profileA, profileB].map((p, idx) => (
                <div
                  key={idx}
                  className={styles.summaryCard}
                  style={{ borderTop: `3px solid ${idx === 0 ? 'var(--primary)' : 'var(--secondary)'}` }}
                >
                  <div className={styles.summaryName}>{p.name}</div>
                  <div className={styles.summaryIndustry}>{p.industry}</div>
                  <div className={styles.summaryStats}>
                    <div className={styles.summaryStat}>
                      <span className={styles.summaryStatLabel}>{t.overall}</span>
                      <span className={styles.summaryStatValue}>{p.overallScore}/10</span>
                    </div>
                    <div className={styles.summaryStat}>
                      <span className={styles.summaryStatLabel}>{t.risk}</span>
                      <span
                        className={styles.summaryStatValue}
                        style={{ color: getRiskColor(p.overallRisk) }}
                      >
                        {p.overallRisk}
                      </span>
                    </div>
                    <div className={styles.summaryStat}>
                      <span className={styles.summaryStatLabel}>{t.policies}</span>
                      <span className={styles.summaryStatValue}>{p.policiesCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Radar chart */}
            <div className={styles.chartSection}>
              <h3 className={styles.sectionTitle}>{t.radarTitle}</h3>
              <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="75%">
                    <PolarGrid stroke="rgba(148, 163, 184, 0.3)" />
                    <PolarAngleAxis
                      dataKey={isIt ? 'labelIt' : 'labelEn'}
                      tick={{ fill: '#64748b', fontSize: 10 }}
                    />
                    <PolarRadiusAxis
                      domain={[0, 100]}
                      tick={{ fill: '#94a3b8', fontSize: 9 }}
                      angle={90}
                    />
                    <Radar
                      name={profileA.name}
                      dataKey="a"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name={profileB.name}
                      dataKey="b"
                      stroke="#06b6d4"
                      fill="#06b6d4"
                      fillOpacity={0.3}
                    />
                    <Legend />
                    <Tooltip
                      contentStyle={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed breakdown table */}
            <div className={styles.tableSection}>
              <h3 className={styles.sectionTitle}>{t.tableTitle}</h3>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>{t.kpi}</th>
                      <th className={styles.th}>{profileA.name}</th>
                      <th className={styles.th}>{profileB.name}</th>
                      <th className={styles.th}>{t.winner}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profileA.radar.map((row, idx) => {
                      const aScore = row.value;
                      const bScore = profileB.radar[idx].value;
                      const winner =
                        aScore === bScore
                          ? 'tie'
                          : aScore < bScore
                          ? 'a'
                          : 'b';
                      return (
                        <tr key={row.key} className={styles.tr}>
                          <td className={styles.tdLabel}>
                            {isIt ? row.labelIt : row.labelEn}
                          </td>
                          <td className={`${styles.td} ${winner === 'a' ? styles.tdWinner : ''}`}>
                            {row.rawValue}
                          </td>
                          <td className={`${styles.td} ${winner === 'b' ? styles.tdWinner : ''}`}>
                            {profileB.radar[idx].rawValue}
                          </td>
                          <td className={styles.tdWinnerCol}>
                            {winner === 'tie' ? (
                              <span className={styles.tieBadge}>
                                <Minus size={12} /> {t.tie}
                              </span>
                            ) : (
                              <span
                                className={`${styles.winnerBadge} ${
                                  winner === 'a' ? styles.winnerA : styles.winnerB
                                }`}
                              >
                                <Trophy size={11} /> {winner === 'a' ? profileA.name : profileB.name}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
