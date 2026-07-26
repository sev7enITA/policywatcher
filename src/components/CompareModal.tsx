'use client';

/**
 * CompareModal - side-by-side A/B comparison of two companies.
 *
 * Features:
 *  - Two dropdown selectors to pick the companies
 *  - Radar (spider) chart comparing 15 KPIs
 *  - Summary header: overall score + risk for each
 *  - Accessible exact-value table and provenance through the chart frame
 */
import { useState, useEffect, useId } from 'react';
import { X, GitCompare } from 'lucide-react';
import styles from './CompareModal.module.css';
import type { Company, Lang } from '@/types';
import type { BenchmarkRadarSourcePoint } from '@/lib/chartSpec';
import { loadPublicDataSource } from '@/lib/dataSourceRegistry';
import BenchmarkRadarChart from './charts/BenchmarkRadarChart';

/** Comparison profile returned by the `/api/compare` endpoint for one company. */
interface CompanyProfile {
  id: string;
  name: string;
  industry: string;
  website: string;
  logo: string;
  /** Aggregate public risk score on a 0-10 scale, or null when unassessed. */
  overallScore: number | null;
  /** Risk tier: "High" | "Medium" | "Low". */
  overallRisk: string;
  /** Per-KPI radar data points. */
  radar: BenchmarkRadarSourcePoint[];
  /** Number of distinct policies tracked for this company. */
  policiesCount: number;
}

interface CompareResponse {
  companyA?: CompanyProfile;
  companyB?: CompanyProfile;
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
    subtitle: 'Side-by-side public policy risk comparison',
    selectA: 'Select company A',
    selectB: 'Select company B',
    overall: 'Overall Score',
    risk: 'Risk Level',
    policies: 'Policies',
    pickBoth: 'Pick two companies to compare',
    industryAverage: 'Industry average',
    unavailable: 'The public comparison is temporarily unavailable.',
  },
  it: {
    title: 'Confronta Aziende',
    subtitle: 'Confronto affiancato del rischio nelle policy pubbliche',
    selectA: 'Seleziona azienda A',
    selectB: 'Seleziona azienda B',
    overall: 'Punteggio Globale',
    risk: 'Livello Rischio',
    policies: 'Policy',
    pickBoth: 'Scegli due aziende da confrontare',
    industryAverage: 'Media settore',
    unavailable: 'Il confronto pubblico è temporaneamente non disponibile.',
  },
};

/**
 * Side-by-side A/B comparison modal for two companies.
 *
 * Displays summary cards, a radar chart overlaying 15 KPI dimensions,
 * and an exact-value table that keeps missing assessments distinct from low risk.
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
  const [loadError, setLoadError] = useState(false);
  const [closing, setClosing] = useState(false);
  const reactId = useId().replace(/:/g, '');
  const titleId = `compare-title-${reactId}`;
  const firstSelectId = `compare-first-${reactId}`;
  const secondSelectId = `compare-second-${reactId}`;

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
        setLoadError(false);
        setLoading(false);
      });
      return;
    }

    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setLoading(true);
      setLoadError(false);
      loadPublicDataSource<CompareResponse>('companyComparison', {
        companyA: companyAId,
        companyB: companyBId,
      })
        .then(({ data }) => {
          if (!active) return;
          if (!data.companyA || !data.companyB) {
            throw new Error('Comparison response is incomplete.');
          }
          setProfileA(data.companyA);
          setProfileB(data.companyB);
        })
        .catch((err) => {
          console.error('Compare load failed:', err);
          if (!active) return;
          setProfileA(null);
          setProfileB(null);
          setLoadError(true);
        })
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

  if (!isOpen) return null;

  const getRiskColor = (risk: string) =>
    risk === 'High'
      ? 'var(--risk-high)'
      : risk === 'Medium'
      ? 'var(--risk-medium)'
      : risk === 'Low'
      ? 'var(--risk-low)'
      : 'var(--text-muted)';
  const getRiskLabel = (risk: string) => {
    if (!isIt) return risk;
    return ({ High: 'Alto', Medium: 'Medio', Low: 'Basso' } as Record<string, string>)[risk]
      || 'Non valutato';
  };

  return (
    <div
      className={styles.overlay}
      onClick={handleClose}
    >
      <div
        className={`${styles.modal} ${closing ? styles.modalClosing : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 id={titleId} className={styles.title}>
              <GitCompare size={20} /> {t.title}
            </h2>
            <span className={styles.subtitle}>{t.subtitle}</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className={styles.closeBtn}
            aria-label={isIt ? 'Chiudi confronto' : 'Close comparison'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Selectors */}
        <div className={styles.selectors}>
          <div className={styles.selectorGroup}>
            <label htmlFor={firstSelectId} className={styles.selectorLabel}>{t.selectA}</label>
            <select
              id={firstSelectId}
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
            <label htmlFor={secondSelectId} className={styles.selectorLabel}>{t.selectB}</label>
            <select
              id={secondSelectId}
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
        {loading ? (
          <div className={styles.placeholder}>
            <p>{isIt ? 'Confronto in corso...' : 'Comparing...'}</p>
          </div>
        ) : loadError ? (
          <div className={styles.placeholder}>
            <p>{t.unavailable}</p>
          </div>
        ) : !profileA || !profileB ? (
          <div className={styles.placeholder}>
            {companyAId === companyBId && companyAId ? (
              <p>{isIt ? 'Seleziona due aziende diverse' : 'Pick two different companies'}</p>
            ) : (
              <p>{t.pickBoth}</p>
            )}
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
                      <span className={styles.summaryStatValue}>
                        {p.overallScore === null ? (isIt ? 'Non valutato' : 'Not assessed') : `${p.overallScore}/10`}
                      </span>
                    </div>
                    <div className={styles.summaryStat}>
                      <span className={styles.summaryStatLabel}>{t.risk}</span>
                      <span
                        className={styles.summaryStatValue}
                        style={{ color: getRiskColor(p.overallRisk) }}
                      >
                        {getRiskLabel(p.overallRisk)}
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

            {/* Evidence-gated benchmark radar and exact-value table */}
            <div className={styles.chartSection}>
              <BenchmarkRadarChart first={profileA} second={profileB} lang={lang} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
