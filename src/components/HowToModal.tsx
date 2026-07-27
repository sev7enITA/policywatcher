'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Link2,
  PauseCircle,
  Route,
  ScanSearch,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  X,
} from 'lucide-react';
import styles from './HowToModal.module.css';

type TourStepId =
  | 'workspace'
  | 'share'
  | 'ticker'
  | 'sourceStatus'
  | 'market'
  | 'evidence'
  | 'drilldown'
  | 'navigation'
  | 'mobile';

type TourStep = {
  id: TourStepId;
  title: string;
  description: string;
  focusLabel: string;
  notes?: string[];
};

type TourCopy = {
  title: string;
  label: string;
  close: string;
  skip: string;
  back: string;
  next: string;
  finish: string;
  step: string;
  of: string;
  remember: string;
  progressLabel: string;
  previewLabel: string;
  steps: TourStep[];
};

interface HowToModalProps {
  onClose: () => void;
  lang: 'en' | 'it';
}

const STEP_ICONS: Record<TourStepId, LucideIcon> = {
  workspace: SlidersHorizontal,
  share: Link2,
  ticker: Search,
  sourceStatus: PauseCircle,
  market: Clock,
  evidence: ShieldCheck,
  drilldown: ScanSearch,
  navigation: Route,
  mobile: UserRound,
};

const TOUR_COPY: Record<'en' | 'it', TourCopy> = {
  en: {
    title: 'Home screen tour',
    label: 'Guided home screen tour',
    close: 'Close tour',
    skip: 'Skip tour',
    back: 'Back',
    next: 'Next',
    finish: 'Finish',
    step: 'Step',
    of: 'of',
    remember: 'Do not open this tour automatically',
    progressLabel: 'Tour progress',
    previewLabel: 'Representative PolicyWatcher dashboard with the active area highlighted',
    steps: [
      {
        id: 'workspace',
        title: 'Choose the workspace',
        description:
          'Open Dashboard setup to select a session goal and evidence depth. It rearranges the view; it does not remove source or evidence gates.',
        focusLabel: 'Dashboard setup',
      },
      {
        id: 'share',
        title: 'Copy a shareable evidence view',
        description:
          'Set the public filters, then use Copy view. The canonical URL can carry industry, risk, region, audience, time, search, sort, language, and workspace state.',
        focusLabel: 'Copy view',
        notes: [
          'Personal or private evidence and consent state are never included in the link.',
          'Back and forward restore committed valid views; stale or invalid values fail closed.',
        ],
      },
      {
        id: 'ticker',
        title: 'Read the Observatory ticker',
        description:
          'The ticker surfaces linked monitoring notes. Pause it on hover or focus, then open the source when you need context.',
        focusLabel: 'Observatory ticker',
      },
      {
        id: 'sourceStatus',
        title: 'Check source status first',
        description:
          'Temporarily suspended sources are called out before interpretation. Treat the notice as a gate: public evidence is unavailable until verification.',
        focusLabel: 'Source status notice',
      },
      {
        id: 'market',
        title: 'Follow the market, then open a company',
        description:
          'Market Pulse puts recent changes into sequence. Company cards narrow the view to a provider and its public policy record.',
        focusLabel: 'Market Pulse',
      },
      {
        id: 'evidence',
        title: 'Open the evidence details',
        description:
          'Use View analysis for retrieval status, source baseline, changes, and limits before relying on a summary or score.',
        focusLabel: 'Evidence details',
      },
      {
        id: 'drilldown',
        title: 'Coordinate regional and KPI evidence',
        description:
          'Select a heatmap cell to commit region and audience together, then select a radar KPI to inspect original and normalized values.',
        focusLabel: 'Evidence drill-down',
        notes: [
          'Missing and tie states remain explicit; use the exact-value table whenever the chart is not sufficient.',
          'Normalized ordinal values support comparison only: they are not compliance or performance ratings.',
        ],
      },
      {
        id: 'navigation',
        title: 'Use navigation to widen the search',
        description:
          'Navigation and the sitemap link to Observatory, Atlas, timeline, methodology, and other public context.',
        focusLabel: 'Navigation and sitemap',
      },
      {
        id: 'mobile',
        title: 'Choose mobile reading deliberately',
        description:
          'Desktop keeps the full workspace. On mobile, the optional On-the-Go reading profile is activated from the workspace prompt.',
        focusLabel: 'Optional mobile profile',
        notes: [
          'It uses Citizen + Snapshot to condense the view and hide nonessential release-map material.',
          'Source notices remain visible, with sticky controls and a single-column card layout.',
          'The choice is stored locally and can be changed again through Change view.',
        ],
      },
    ],
  },
  it: {
    title: 'Tour della schermata home',
    label: 'Tour guidato della schermata home',
    close: 'Chiudi tour',
    skip: 'Salta tour',
    back: 'Indietro',
    next: 'Avanti',
    finish: 'Fine',
    step: 'Passo',
    of: 'di',
    remember: 'Non aprire questo tour automaticamente',
    progressLabel: 'Progresso del tour',
    previewLabel: 'Dashboard PolicyWatcher rappresentativa con area attiva evidenziata',
    steps: [
      {
        id: 'workspace',
        title: 'Scegli il workspace',
        description:
          'Apri le impostazioni dashboard per scegliere obiettivo della sessione e profondita delle evidenze. La vista si riordina, ma i gate di fonte ed evidenza restano.',
        focusLabel: 'Impostazioni dashboard',
      },
      {
        id: 'share',
        title: 'Copia una vista evidenze condivisibile',
        description:
          'Imposta i filtri pubblici, poi usa Copia vista. L URL canonico puo includere settore, rischio, regione, audience, periodo, ricerca, ordinamento, lingua e workspace.',
        focusLabel: 'Copia vista',
        notes: [
          'Evidenze personali o private e stato del consenso non vengono mai inclusi nel link.',
          'Indietro e avanti ripristinano viste valide confermate; valori obsoleti o non validi falliscono in modo chiuso.',
        ],
      },
      {
        id: 'ticker',
        title: 'Leggi il ticker Observatory',
        description:
          'Il ticker mostra note di monitoraggio collegate. Fermalo con hover o focus, poi apri la fonte quando serve contesto.',
        focusLabel: 'Ticker Observatory',
      },
      {
        id: 'sourceStatus',
        title: 'Controlla prima lo stato della fonte',
        description:
          'Le fonti temporaneamente sospese sono evidenziate prima dell interpretazione. Tratta l avviso come un gate: l evidenza pubblica non e disponibile fino alla verifica.',
        focusLabel: 'Avviso stato fonte',
      },
      {
        id: 'market',
        title: 'Segui il mercato, poi apri un azienda',
        description:
          'Market Pulse mette in sequenza le modifiche recenti. Le card azienda restringono la lettura a un provider e al suo record policy pubblico.',
        focusLabel: 'Market Pulse',
      },
      {
        id: 'evidence',
        title: 'Apri i dettagli delle evidenze',
        description:
          'Usa Vedi analisi per stato di recupero, baseline fonte, modifiche e limiti prima di usare una sintesi o uno score.',
        focusLabel: 'Dettagli evidenze',
      },
      {
        id: 'drilldown',
        title: 'Coordina evidenze regionali e KPI',
        description:
          'Seleziona una cella della heatmap per confermare insieme regione e audience, poi seleziona un KPI radar per ispezionare valori originali e normalizzati.',
        focusLabel: 'Drill-down evidenze',
        notes: [
          'Stati mancanti e parita restano espliciti; usa la tabella dei valori esatti quando il grafico non basta.',
          'I valori ordinali normalizzati servono solo al confronto: non sono giudizi di conformita o performance.',
        ],
      },
      {
        id: 'navigation',
        title: 'Usa la navigazione per ampliare la ricerca',
        description:
          'Navigazione e sitemap collegano Observatory, Atlas, timeline, metodologia e altro contesto pubblico.',
        focusLabel: 'Navigazione e sitemap',
      },
      {
        id: 'mobile',
        title: 'Scegli consapevolmente la lettura mobile',
        description:
          'Desktop mantiene il workspace completo. Su mobile, il profilo opzionale di lettura On-the-Go si attiva dal prompt del workspace.',
        focusLabel: 'Profilo mobile opzionale',
        notes: [
          'Usa Cittadino + Snapshot per condensare la vista e nascondere il materiale non essenziale della release map.',
          'Gli avvisi fonte restano visibili, con controlli sticky e layout a card su singola colonna.',
          'La scelta viene salvata in locale e puo essere cambiata di nuovo con Cambia vista.',
        ],
      },
    ],
  },
};

export default function HowToModal({ onClose, lang }: HowToModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [closing, setClosing] = useState(false);
  const [skipPermanently, setSkipPermanently] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('policywatcher_onboarding_skip_permanently') === 'true';
    } catch {
      return false;
    }
  });
  const dialogRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const copyPanelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const t = TOUR_COPY[lang];
  const step = t.steps[currentStep];
  const StepIcon = STEP_ICONS[step.id];
  const previewText = lang === 'it'
    ? {
        publicHome: 'HOME PUBBLICA',
        setup: 'IMPOSTAZIONI DASHBOARD',
        profile: 'Cittadino / Snapshot',
        changeView: 'Cambia vista',
        optionalMobile: 'Mobile opzionale',
        ticker: 'OBSERVATORY / nota enforcement aggiornata',
        sourceStatus: 'STATO FONTE',
        suspended: '2 sorgenti sospese',
        review: 'Review prima della pubblicazione',
        market: 'MARKET PULSE',
        policyChange: 'Modifica termini registrata',
        analysis: 'Vedi analisi',
        firstCard: 'Termini AI / Fonte verificata',
        secondCard: 'Privacy / Evidenza recente',
        method: 'Metodo',
      }
    : {
        publicHome: 'PUBLIC HOME',
        setup: 'DASHBOARD SETUP',
        profile: 'Citizen / Snapshot',
        changeView: 'Change view',
        optionalMobile: 'Optional mobile',
        ticker: 'OBSERVATORY / enforcement note updated',
        sourceStatus: 'SOURCE STATUS',
        suspended: '2 temporarily suspended',
        review: 'Review before publication',
        market: 'MARKET PULSE',
        policyChange: 'Terms change recorded',
        analysis: 'View analysis',
        firstCard: 'AI Terms / Source verified',
        secondCard: 'Privacy / Latest evidence',
        method: 'Method',
      };

  const handleClose = useCallback(() => {
    if (closeTimerRef.current) return;

    try {
      sessionStorage.setItem('policywatcher_onboarding_session_seen', 'true');
    } catch {
      // Storage can be unavailable in a restricted browser context.
    }

    setClosing(true);
    closeTimerRef.current = window.setTimeout(onClose, 150);
  }, [onClose]);

  const handleToggleSkip = (checked: boolean) => {
    setSkipPermanently(checked);
    try {
      localStorage.setItem('policywatcher_onboarding_skip_permanently', String(checked));
    } catch {
      // Storage can be unavailable in a restricted browser context.
    }
  };

  const goToStep = useCallback((nextStep: number) => {
    setCurrentStep(Math.max(0, Math.min(nextStep, t.steps.length - 1)));
  }, [t.steps.length]);

  const handleNext = useCallback(() => {
    if (currentStep === t.steps.length - 1) {
      handleClose();
      return;
    }
    goToStep(currentStep + 1);
  }, [currentStep, goToStep, handleClose, t.steps.length]);

  const handlePrevious = useCallback(() => {
    goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
        previousFocusRef.current.focus();
      }
    };
  }, []);

  useEffect(() => {
    const scrollFrame = window.requestAnimationFrame(() => {
      const main = mainRef.current;
      if (!main) return;

      const mobileCopyOffset = copyPanelRef.current?.offsetTop ?? 0;
      main.scrollTo({
        top: step.id === 'mobile' ? Math.max(0, mobileCopyOffset - 8) : 0,
        behavior: 'auto',
      });
    });

    return () => window.cancelAnimationFrame(scrollFrame);
  }, [step.id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNext();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrevious();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute('hidden'));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, handleNext, handlePrevious]);

  return (
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <section
        ref={dialogRef}
        className={styles.modal}
        data-closing={closing}
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-to-title"
        aria-describedby="how-to-description"
      >
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>{t.label}</span>
            <h2 id="how-to-title">{t.title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.iconButton}
            onClick={handleClose}
            aria-label={t.close}
            title={t.close}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div ref={mainRef} className={styles.main} data-tour-main>
          <figure className={styles.preview} aria-label={t.previewLabel}>
            <div className={styles.previewCanvas} data-focus={step.id} aria-hidden="true">
              <div className={styles.previewGrid}>
                {Array.from({ length: 112 }, (_, index) => <span key={index} />)}
              </div>
              <div className={styles.previewTopbar}>
                <span className={styles.previewBrand}>POLICYWATCHER</span>
                <span className={styles.previewTopbarStatus}>{previewText.publicHome}</span>
              </div>

              <div className={styles.previewWorkspace}>
                <span className={styles.previewKicker}>{previewText.setup}</span>
                <strong>{previewText.profile}</strong>
                <span className={styles.previewAction}>{previewText.changeView}</span>
              </div>
              <div className={styles.previewMobileProfile}>
                <UserRound size={11} />
                {previewText.optionalMobile}
              </div>

              <div className={styles.previewTicker}>
                <Search size={11} />
                <span>{previewText.ticker}</span>
                <span className={styles.previewTickerDot} />
              </div>

              <article className={styles.previewSource}>
                <span className={styles.previewPanelLabel}>{previewText.sourceStatus}</span>
                <strong>{previewText.suspended}</strong>
                <span>{previewText.review}</span>
              </article>

              <article className={styles.previewMarket}>
                <span className={styles.previewPanelLabel}>{previewText.market}</span>
                <div className={styles.previewTimeline}>
                  <span />
                  <span />
                  <span />
                </div>
                <strong>{previewText.policyChange}</strong>
              </article>

              <div className={styles.previewCards}>
                <article className={styles.previewCard}>
                  <span className={styles.previewCompanyMark}>A</span>
                  <div>
                    <strong>Anthropic</strong>
                    <span>{previewText.firstCard}</span>
                  </div>
                  <small>{previewText.analysis}</small>
                </article>
                <article className={styles.previewCard}>
                  <span className={styles.previewCompanyMark}>S</span>
                  <div>
                    <strong>Stripe</strong>
                    <span>{previewText.secondCard}</span>
                  </div>
                  <small>{previewText.analysis}</small>
                </article>
              </div>

              <nav className={styles.previewNavigation}>
                <span>Atlas</span>
                <span>Observatory</span>
                <span>Timeline</span>
                <span>{previewText.method}</span>
              </nav>

              <div className={styles.focusRing} data-tour-focus-ring>
                <span className={styles.focusLabel}>
                  <StepIcon size={11} />
                  {step.focusLabel}
                </span>
                <ArrowRight className={styles.focusArrow} size={17} />
              </div>
            </div>
          </figure>

          <div ref={copyPanelRef} className={styles.copyPanel}>
            <div className={styles.stepMeta}>
              <StepIcon size={16} aria-hidden="true" />
              <span>{t.step} {currentStep + 1} {t.of} {t.steps.length}</span>
            </div>
            <h3>{step.title}</h3>
            <p id="how-to-description" className={styles.description} aria-live="polite">
              {step.description}
            </p>
            {step.notes && (
              <ul className={styles.noteList}>
                {step.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <footer className={styles.footer}>
          <div className={styles.progressGroup}>
            <div className={styles.progressText}>
              <span>{t.progressLabel}</span>
              <strong>{currentStep + 1}/{t.steps.length}</strong>
            </div>
            <div className={styles.progressTrack} aria-label={t.progressLabel}>
              {t.steps.map((tourStep, index) => (
                <button
                  key={tourStep.id}
                  type="button"
                  className={styles.progressStep}
                  data-active={index === currentStep}
                  onClick={() => goToStep(index)}
                  aria-label={`${t.step} ${index + 1}: ${tourStep.title}`}
                  aria-current={index === currentStep ? 'step' : undefined}
                />
              ))}
            </div>
          </div>

          <div className={styles.footerControls}>
            <label className={styles.rememberControl}>
              <input
                type="checkbox"
                checked={skipPermanently}
                onChange={(event) => handleToggleSkip(event.target.checked)}
              />
              <span>{t.remember}</span>
            </label>
            <div className={styles.buttonGroup}>
              <button type="button" className={styles.skipButton} onClick={handleClose}>
                {t.skip}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ChevronLeft size={16} aria-hidden="true" />
                {t.back}
              </button>
              <button type="button" className={styles.primaryButton} onClick={handleNext}>
                {currentStep === t.steps.length - 1 ? t.finish : t.next}
                {currentStep === t.steps.length - 1 ? <ShieldCheck size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
              </button>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
