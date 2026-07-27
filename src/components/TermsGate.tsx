'use client';

/**
 * TermsGate blocks access until the user accepts the current use boundaries.
 *
 * Persistence: acceptance is stored in localStorage under
 * `policywatcher_terms_accepted_v2`. Bump the suffix when terms materially
 * change and users should be asked to acknowledge them again.
 */
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Database,
  FileText,
  Languages,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import styles from './TermsGate.module.css';
import type { Lang } from '@/types';
import { TERMS_ACCEPTANCE_TTL_DAYS, TERMS_OF_USE, TERMS_STORAGE_KEY } from '@/lib/termsOfUse';

const ACCEPTANCE_TTL_MS = TERMS_ACCEPTANCE_TTL_DAYS * 24 * 60 * 60 * 1000;

interface TermsGateProps {
  children: React.ReactNode;
  lang: Lang;
  onLangToggle: () => void;
}

const content = {
  en: {
    badge: 'POLICYWATCHER ACCESS',
    contextStep: 'Context',
    termsStep: 'Use terms',
    title: 'Open the policy intelligence workspace',
    subtitle:
      'Before the dashboard loads, review what the system shows and where human verification remains required.',
    contextTitle: 'What you are entering',
    contextBody:
      'PolicyWatcher compares public policy-change evidence, jurisdictional impact signals, dataset QA metadata, and AI-assisted summaries in one inspection workspace.',
    evidence: [
      {
        title: 'Evidence map',
        body: 'Companies, policy types, jurisdictions, changes, and region-specific impact signals are shown together.',
      },
      {
        title: 'Dataset QA telemetry',
        body: 'Source availability, ingestion method, last check, and last successful fetch are surfaced where metadata is available.',
      },
      {
        title: 'AI-assisted reading',
        body: 'Summaries and scores help triage policy movement; source review remains part of responsible use.',
      },
    ],
    continueBtn: 'Review use terms',
    termsTitle: TERMS_OF_USE.en.boundaryTitle,
    termsIntro: TERMS_OF_USE.en.intro,
    terms: TERMS_OF_USE.en.boundaries,
    checkbox: 'I understand these use boundaries and accept the Terms of Use.',
    acceptBtn: 'Accept & Continue',
    backBtn: 'Back',
    error: 'You must check the box to continue.',
    footer: 'Acceptance is stored locally for 90 days and can be renewed when terms change.',
    langToggle: 'Italiano',
  },
  it: {
    badge: 'ACCESSO POLICYWATCHER',
    contextStep: 'Contesto',
    termsStep: 'Uso',
    title: 'Apri il workspace di policy intelligence',
    subtitle:
      'Prima di caricare la dashboard, rivedi cosa mostra il sistema e dove resta necessaria la verifica umana.',
    contextTitle: 'Cosa stai aprendo',
    contextBody:
      'PolicyWatcher confronta evidenze pubbliche di cambiamento policy, segnali di impatto per giurisdizione, metadata di QA dataset e sintesi AI-assisted in un workspace di ispezione.',
    evidence: [
      {
        title: 'Mappa evidenze',
        body: 'Compagnie, tipologie di policy, giurisdizioni, modifiche e segnali di impatto regionali vengono mostrati insieme.',
      },
      {
        title: 'Telemetry Dataset QA',
        body: 'Disponibilità fonte, metodo di ingestion, ultimo controllo e ultimo fetch riuscito sono esposti dove disponibili.',
      },
      {
        title: 'Lettura AI-assisted',
        body: 'Sintesi e punteggi aiutano il triage dei movimenti policy; la verifica delle fonti resta parte dell\'uso responsabile.',
      },
    ],
    continueBtn: 'Rivedi condizioni d\'uso',
    termsTitle: TERMS_OF_USE.it.boundaryTitle,
    termsIntro: TERMS_OF_USE.it.intro,
    terms: TERMS_OF_USE.it.boundaries,
    checkbox: 'Ho compreso questi confini d\'uso e accetto i Termini di Utilizzo.',
    acceptBtn: 'Accetta e continua',
    backBtn: 'Indietro',
    error: 'Devi spuntare la casella per continuare.',
    footer: 'L\'accettazione resta salvata localmente per 90 giorni e può essere rinnovata quando cambiano i termini.',
    langToggle: 'English',
  },
};

export default function TermsGate({ children, lang, onLangToggle }: TermsGateProps) {
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);
  const [showError, setShowError] = useState(false);
  const [step, setStep] = useState<'context' | 'terms'>('context');

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = localStorage.getItem(TERMS_STORAGE_KEY);
        if (stored) {
          const timestamp = parseInt(stored, 10);
          if (!Number.isNaN(timestamp) && Date.now() - timestamp < ACCEPTANCE_TTL_MS) {
            setAccepted(true);
            return;
          }
          localStorage.removeItem(TERMS_STORAGE_KEY);
        }
        setAccepted(false);
      } catch {
        setAccepted(false);
      }
    });
  }, []);

  const handleAccept = () => {
    if (!checked) {
      setShowError(true);
      return;
    }
    try {
      localStorage.setItem(TERMS_STORAGE_KEY, Date.now().toString());
    } catch {
      /* ignore localStorage write errors */
    }
    setAccepted(true);
  };

  if (accepted === null) return null;
  if (accepted) return <>{children}</>;

  const t = content[lang];

  return (
    <div className={styles.overlay}>
      <button onClick={onLangToggle} className={styles.langToggle}>
        <Languages size={14} />
        {t.langToggle}
      </button>

      <div className={styles.card}>
        <div className={styles.contextPanel}>
          <div className={styles.badge}>
            <ShieldCheck size={13} />
            {t.badge}
          </div>

          <h1 className={styles.title}>{t.title}</h1>
          <p className={styles.subtitle}>{t.subtitle}</p>

          <div className={styles.stepper} aria-label={lang === 'it' ? 'Passaggi accesso' : 'Access steps'}>
            <span className={`${styles.stepPill} ${step === 'context' ? styles.stepPillActive : ''}`}>
              <span>1</span>
              {t.contextStep}
            </span>
            <span className={styles.stepLine} />
            <span className={`${styles.stepPill} ${step === 'terms' ? styles.stepPillActive : ''}`}>
              <span>2</span>
              {t.termsStep}
            </span>
          </div>
        </div>

        <div className={styles.contentPanel}>
          {step === 'context' ? (
            <>
              <div className={styles.sectionHeader}>
                <Database size={18} />
                <div>
                  <h2>{t.contextTitle}</h2>
                  <p>{t.contextBody}</p>
                </div>
              </div>

              <div className={styles.evidenceGrid}>
                {t.evidence.map((item, i) => (
                  <div className={styles.evidenceItem} key={item.title}>
                    <span className={styles.evidenceNumber}>{i + 1}</span>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </div>
                ))}
              </div>

              <div className={styles.actions}>
                <button onClick={() => setStep('terms')} className={`${styles.btn} ${styles.btnPrimary}`}>
                  {t.continueBtn}
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.sectionHeader}>
                <FileText size={18} />
                <div>
                  <h2>{t.termsTitle}</h2>
                  <p>{t.termsIntro}</p>
                </div>
              </div>

              <div className={styles.termsBox}>
                <div className={styles.termsHeader}>
                  <Lock size={14} />
                  {t.termsTitle}
                </div>
                <ul className={styles.termsList}>
                  {t.terms.map((term) => (
                    <li key={term} className={styles.termsItem}>
                      <CheckCircle2 size={16} className={styles.termsBullet} />
                      <span>{term}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    setChecked(e.target.checked);
                    if (e.target.checked) setShowError(false);
                  }}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxLabel}>{t.checkbox}</span>
              </label>
              {showError && <p className={styles.error}>{t.error}</p>}

              <div className={styles.actions}>
                <button onClick={() => setStep('context')} className={`${styles.btn} ${styles.btnSecondary}`}>
                  <ArrowLeft size={16} />
                  {t.backBtn}
                </button>
                <button
                  onClick={handleAccept}
                  className={`${styles.btn} ${styles.btnPrimary} ${!checked ? styles.btnDisabled : ''}`}
                  disabled={!checked}
                >
                  <ShieldCheck size={16} />
                  {t.acceptBtn}
                </button>
              </div>
            </>
          )}
        </div>

        <p className={styles.footer}>
          <Lock size={11} />
          {t.footer}
        </p>
      </div>
    </div>
  );
}
