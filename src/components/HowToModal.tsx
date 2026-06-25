/**
 * @file HowToModal.tsx
 *
 * Onboarding / "How To Use" modal that walks first-time visitors through
 * the core features of PolicyWatcher via a multi-slide guided tour.
 *
 * Slides: Welcome → Core Features → Limitations & Caveats → AI Assistant.
 *
 * The modal tracks two persistence layers:
 *  - **sessionStorage**: prevents the modal from re-appearing within the
 *    same browser session.
 *  - **localStorage** ("skip permanently" checkbox): lets the user opt out
 *    of seeing the modal across all future sessions.
 *
 * Supports EN/IT localisation via the `lang` prop.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Compass, 
  Zap, 
  AlertTriangle, 
  HelpCircle, 
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './HowToModal.module.css';

/** Props for the {@link HowToModal} component. */
interface HowToModalProps {
  /** Callback invoked when the user dismisses the modal (close button, backdrop click, or Escape). */
  onClose: () => void;
  /** Active UI language — controls all slide copy. */
  lang: 'en' | 'it';
}

/**
 * Multi-slide onboarding modal that introduces PolicyWatcher's features,
 * limitations, and AI assistant to new users.
 *
 * @param props - {@link HowToModalProps}
 * @returns The rendered modal overlay, or nothing after the close animation completes.
 */
export default function HowToModal({ onClose, lang }: HowToModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  /** Controls the CSS exit animation before the component is unmounted. */
  const [closing, setClosing] = useState(false);
  /** Mirrors the localStorage flag so the checkbox stays in sync. */
  const [skipPermanently, setSkipPermanently] = useState(false);

  // Hydrate the "skip permanently" checkbox from localStorage on mount.
  useEffect(() => {
    try {
      const val = localStorage.getItem('policywatcher_onboarding_skip_permanently') === 'true';
      setSkipPermanently(val);
    } catch (e) {
      // ignore
    }
  }, []);

  /** Persists the user's "don't show again" preference to localStorage. */
  const handleToggleSkip = (checked: boolean) => {
    setSkipPermanently(checked);
    try {
      if (checked) {
        localStorage.setItem('policywatcher_onboarding_skip_permanently', 'true');
      } else {
        localStorage.setItem('policywatcher_onboarding_skip_permanently', 'false');
      }
    } catch (e) {
      // ignore
    }
  };

  const isIt = lang === 'it';

  const slides = [
    {
      id: 'welcome',
      icon: <Compass size={32} className={styles.slideIconPrimary} />,
      title: isIt ? 'Benvenuto su PolicyWatcher 👋' : 'Welcome to PolicyWatcher 👋',
      subtitle: isIt 
        ? 'La tua piattaforma di monitoraggio normativo e AI Governance basata su Intelligenza Artificiale.' 
        : 'Your AI-powered monitor for privacy policies, terms of service, and AI governance.',
      content: (
        <div className={styles.slideContent}>
          <p>
            {isIt 
              ? 'PolicyWatcher ti aiuta a tracciare in tempo reale come le grandi aziende tecnologiche gestiscono i tuoi dati, i modelli di addestramento AI e i tuoi diritti di privacy.'
              : 'PolicyWatcher helps you track in real-time how tech giants handle your private data, AI model training inputs, and regulatory compliance standards.'}
          </p>
          <div className={styles.introFeatureList}>
            <div className={styles.introFeatureItem}>
              <span className={styles.bulletDot}></span>
              <span>{isIt ? 'Scansione automatica e rilevamento differenze (SHA-256)' : 'Automated tracking & policy change detection (SHA-256)'}</span>
            </div>
            <div className={styles.introFeatureItem}>
              <span className={styles.bulletDot}></span>
              <span>{isIt ? 'Analisi semantica e sintesi con modelli Google Gemini' : 'Semantic analysis and digests powered by Google Gemini'}</span>
            </div>
            <div className={styles.introFeatureItem}>
              <span className={styles.bulletDot}></span>
              <span>{isIt ? 'Valutazione del rischio per individui ed imprese (EU/US/Global)' : 'Regional compliance risk scoring (EU/US/Global perspective)'}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'features',
      icon: <Zap size={32} className={styles.slideIconSecondary} />,
      title: isIt ? 'Funzionalità Principali' : 'Core Features',
      subtitle: isIt 
        ? 'Tutto il necessario per analizzare e confrontare la compliance.' 
        : 'Everything you need to analyze, trace, and compare regulatory terms.',
      content: (
        <div className={styles.slideContent}>
          <div className={styles.gridFeatures}>
            <div className={styles.gridCard}>
              <h4>🔍 Scansione & AI Analysis</h4>
              <p>{isIt ? 'Ottieni TL;DR immediati, punti chiave marcati per sentiment (buono/neutro/preoccupante) e azioni di rimedio concrete.' : 'Access clear TL;DR summaries, key points categorized by user sentiment, and concrete step-by-step remediation advice.'}</p>
            </div>
            <div className={styles.gridCard}>
              <h4>📊 Confronto A/B</h4>
              <p>{isIt ? 'Usa il Radar Chart per confrontare visivamente i KPI di privacy ed etica di due aziende affiancate.' : 'Compare two companies side-by-side. View radar charts mapping 15 distinct compliance metrics.'}</p>
            </div>
            <div className={styles.gridCard}>
              <h4>📈 Trend Storici</h4>
              <p>{isIt ? 'Esplora i grafici temporali interattivi per tracciare come il punteggio di rischio di un\'azienda sia evoluto nel tempo.' : 'Interact with timeline charts to monitor how a company\'s overall risk rating has shifted across versions.'}</p>
            </div>
            <div className={styles.gridCard}>
              <h4>⌨️ Command Palette (⌘K)</h4>
              <p>{isIt ? 'Premi ⌘K (o Ctrl+K) per navigare istantaneamente, cercare compagnie, cambiare prospettive o attivare filtri.' : 'Press ⌘K (or Ctrl+K) to launch the command menu. Search companies, filter regions, or trigger actions via keyboard.'}</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'limits',
      icon: <AlertTriangle size={32} className={styles.slideIconWarning} />,
      title: isIt ? 'Limiti e Limitazioni' : 'Limitations & Caveats',
      subtitle: isIt 
        ? 'Ciò di cui devi tenere conto durante l\'utilizzo della piattaforma.' 
        : 'Important considerations when evaluating automated analysis.',
      content: (
        <div className={styles.slideContent}>
          <div className={styles.limitList}>
            <div className={styles.limitItem}>
              <h5>⚠️ {isIt ? 'Prototipo Alpha & No Parere Legale' : 'Alpha Prototype & No Legal Advice'}</h5>
              <p>{isIt 
                ? 'Le analisi sono generate tramite Intelligenza Artificiale Generativa e non costituiscono consulenza o parere legale. Verifica sempre i testi originali.' 
                : 'All reviews are compiled dynamically by Generative AI and do not constitute legal advice. Always reference original texts.'}</p>
            </div>
            <div className={styles.limitItem}>
              <h5>🚫 {isIt ? 'Limitazioni di Scraper e Bot Protection' : 'Scraper & Bot Protection Limitations'}</h5>
              <p>{isIt 
                ? 'Alcune aziende implementano sistemi anti-bot (Cloudflare, captcha) o paywall. In questi casi, lo scraper segnala "Non disponibile" senza inventare dati.' 
                : 'Aggressive bot blockers (Cloudflare, captchas) or paywalls might block text fetching. We report these as "Unavailable" to ensure data integrity.'}</p>
            </div>
            <div className={styles.limitItem}>
              <h5>⏳ {isIt ? 'Rate Limiting protettivi' : 'Usage Rate Limiting'}</h5>
              <p>{isIt 
                ? 'Per contenere i costi delle API (Gemini e Sintesi Vocale TTS), sono attivi limiti di richieste basati su IP. Se li superi, attendi il timeout indicato.' 
                : 'To manage Google Cloud and Gemini API costs, IP-based request limits are enforced. Please respect retry thresholds.'}</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'chatbot',
      icon: <MessageSquare size={32} className={styles.slideIconChat} />,
      title: isIt ? 'Chiedi al tuo Assistente IA' : 'Ask your AI Assistant',
      subtitle: isIt 
        ? 'Puoi avere le stesse indicazioni e informazioni parlando in chat.' 
        : 'Access the same details and guide instructions in real-time.',
      content: (
        <div className={styles.slideContent}>
          <p>
            {isIt 
              ? 'Hai dubbi su come funziona una feature? O vuoi sapere subito le novità sulle policy di Google o Anthropic?'
              : 'Confused about a feature? Or want to know the latest changes in Anthropic or Google policies?'}
          </p>
          <div className={styles.chatbotHighlightBox}>
            <p className={styles.chatbotHighlightText}>
              {isIt 
                ? 'Usa il chatbot "Policy Live Assistant" in basso a destra. È addestrato con tutta la documentazione, la metodologia e lo storico della piattaforma.' 
                : 'Launch the "Policy Live Assistant" in the bottom-right. It is trained with all platform documentation, methodology, and historic datasets.'}
            </p>
          </div>
          <p className={styles.chatSuggestedQueriesTitle}>{isIt ? 'Domande suggerite da fare alla chat:' : 'Suggested queries to ask the chatbot:'}</p>
          <ul className={styles.chatSuggestedQueriesList}>
            <li>{isIt ? '"Come disiscrivermi dagli alert email?"' : '"How do I unsubscribe from email alerts?"'}</li>
            <li>{isIt ? '"Quali modifiche biometriche ha inserito Stripe?"' : '"What biometric changes did Stripe introduce?"'}</li>
            <li>{isIt ? '"Come funziona il calcolo del punteggio di rischio?"' : '"How is the overall risk score calculated?"'}</li>
          </ul>
        </div>
      )
    }
  ];

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  /**
   * Marks the modal as "seen this session" (sessionStorage) then triggers
   * the 200 ms CSS exit animation before invoking the parent's onClose.
   */
  const handleClose = () => {
    try {
      sessionStorage.setItem('policywatcher_onboarding_session_seen', 'true');
    } catch (e) {
      // ignore
    }
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  /** Advances to the next slide, or closes the modal on the last slide. */
  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div 
      className={styles.overlay} 
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={isIt ? 'Guida all\'Onboarding' : 'User Onboarding Guide'}
    >
      <div 
        className={`${styles.modal} ${closing ? styles.modalClosing : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <HelpCircle size={20} className={styles.headerIcon} />
            <h3>{isIt ? 'Come Funziona' : 'How To Use'}</h3>
          </div>
          <button onClick={handleClose} className={styles.closeBtn} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs (Online Guide view) */}
        <div className={styles.tabNav}>
          {slides.map((slide, idx) => (
            <button 
              key={slide.id}
              onClick={() => setCurrentSlide(idx)}
              className={`${styles.tabBtn} ${currentSlide === idx ? styles.tabBtnActive : ''}`}
            >
              {slide.id === 'welcome' && (isIt ? 'Benvenuto' : 'Welcome')}
              {slide.id === 'features' && (isIt ? 'Funzionalità' : 'Features')}
              {slide.id === 'limits' && (isIt ? 'Limiti' : 'Limits')}
              {slide.id === 'chatbot' && (isIt ? 'Assistente IA' : 'AI Assistant')}
            </button>
          ))}
        </div>

        {/* Slide Body */}
        <div className={styles.body}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className={styles.slideWrapper}
            >
              <div className={styles.slideHeader}>
                {slides[currentSlide].icon}
                <div className={styles.slideHeaderText}>
                  <h3 className={styles.slideTitle}>{slides[currentSlide].title}</h3>
                  <p className={styles.slideSubtitle}>{slides[currentSlide].subtitle}</p>
                </div>
              </div>

              <div className={styles.slideMainContent}>
                {slides[currentSlide].content}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Skip future sessions checkbox */}
        <div className={styles.skipSessionRow}>
          <label className={styles.skipCheckboxLabel}>
            <input 
              type="checkbox" 
              checked={skipPermanently} 
              onChange={(e) => handleToggleSkip(e.target.checked)}
              className={styles.skipCheckbox}
            />
            <span>
              {isIt 
                ? 'Salta questo how to nelle prossime sessioni' 
                : 'Skip this how to in future sessions'}
            </span>
          </label>
        </div>
 
        {/* Footer controls */}
        <div className={styles.footer}>
          {/* Progress indicators */}
          <div className={styles.progressDots}>
            {slides.map((_, idx) => (
              <span 
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`${styles.dot} ${currentSlide === idx ? styles.dotActive : ''}`}
              />
            ))}
          </div>

          <div className={styles.navButtons}>
            {currentSlide > 0 && (
              <button onClick={handlePrev} className={styles.navBtnPrev}>
                <ChevronLeft size={16} />
                {isIt ? 'Indietro' : 'Back'}
              </button>
            )}

            <button onClick={handleNext} className={styles.navBtnNext}>
              {currentSlide === slides.length - 1 
                ? (isIt ? 'Completa' : 'Got it!') 
                : (isIt ? 'Avanti' : 'Next')}
              {currentSlide < slides.length - 1 && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
