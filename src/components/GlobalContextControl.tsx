'use client';

import { Check, Globe2, Languages, MapPin, ShieldCheck, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_GLOBAL_CONTEXT,
  GLOBAL_CONTEXT_EVENT,
  GLOBAL_CONTEXT_STORAGE_KEY,
  GLOBAL_COUNTRIES,
  GLOBAL_REGION_LABELS,
  globalContextLabel,
  normalizeGlobalContext,
  parseGlobalContext,
  resolvePlatformLanguage,
  storeGlobalContext,
  type GlobalContext,
  type GlobalCountryCode,
  type GlobalRegion,
  type PlatformLanguage,
  type PlatformLanguagePreference,
} from '@/lib/globalContext';
import styles from './GlobalContextControl.module.css';

interface UseGlobalContextResult {
  context: GlobalContext;
  lang: PlatformLanguage;
  ready: boolean;
  configured: boolean;
  updateContext: (next: Partial<GlobalContext>) => GlobalContext;
}

export function useGlobalContext(fallbackLanguage: PlatformLanguage = 'en'): UseGlobalContextResult {
  const [context, setContext] = useState<GlobalContext>({ ...DEFAULT_GLOBAL_CONTEXT });
  const [browserLanguage, setBrowserLanguage] = useState('');
  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      let stored: GlobalContext | null = null;
      try {
        stored = parseGlobalContext(window.localStorage.getItem(GLOBAL_CONTEXT_STORAGE_KEY));
      } catch {
        // Storage is optional; page-level language remains the honest fallback.
      }
      setContext(stored ?? { ...DEFAULT_GLOBAL_CONTEXT });
      setConfigured(Boolean(stored));
      setBrowserLanguage(window.navigator.language ?? '');
      setReady(true);
    });

    const onContext = (event: Event) => {
      const detail = (event as CustomEvent<GlobalContext>).detail;
      setContext(normalizeGlobalContext(detail ?? DEFAULT_GLOBAL_CONTEXT));
      setConfigured(true);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== GLOBAL_CONTEXT_STORAGE_KEY) return;
      const parsed = parseGlobalContext(event.newValue);
      setContext(parsed ?? { ...DEFAULT_GLOBAL_CONTEXT });
      setConfigured(Boolean(parsed));
    };

    window.addEventListener(GLOBAL_CONTEXT_EVENT, onContext);
    window.addEventListener('storage', onStorage);
    return () => {
      active = false;
      window.removeEventListener(GLOBAL_CONTEXT_EVENT, onContext);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const lang = !configured && context.language === 'auto' && context.country === 'all'
    ? fallbackLanguage
    : resolvePlatformLanguage(context, browserLanguage);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = lang;
    document.documentElement.dataset.policywatcherRegion = context.region;
    document.documentElement.dataset.policywatcherCountry = context.country;
  }, [context.country, context.region, lang, ready]);

  const updateContext = useCallback((next: Partial<GlobalContext>) => {
    const stored = storeGlobalContext(next);
    setContext(stored);
    setConfigured(true);
    return stored;
  }, []);

  return { context, lang, ready, configured, updateContext };
}

interface GlobalContextControlProps {
  className?: string;
  compact?: boolean;
  fallbackLang?: PlatformLanguage;
}

export default function GlobalContextControl({ className = '', compact = false, fallbackLang = 'en' }: GlobalContextControlProps) {
  const { context, lang, updateContext } = useGlobalContext(fallbackLang);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<GlobalContext>(context);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = window.requestAnimationFrame(() => headingRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const countries = useMemo(() => (
    draft.region === 'global'
      ? GLOBAL_COUNTRIES
      : GLOBAL_COUNTRIES.filter((country) => country.region === draft.region)
  ), [draft.region]);

  const copy = lang === 'it' ? {
    trigger: 'Paese e lingua',
    eyebrow: 'Contesto globale PolicyWatcher',
    title: 'Area, paese e lingua',
    lead: 'Questa preferenza influenza la dashboard, il directory civico e la lingua delle superfici già localizzate.',
    region: 'Area geografica',
    country: 'Paese / Stato',
    allCountries: 'Tutti i paesi dell’area',
    language: 'Lingua interfaccia',
    auto: 'Automatica',
    english: 'English',
    italian: 'Italiano',
    fallback: 'Oggi l’interfaccia completa supporta EN e IT. Per gli altri paesi il fallback dichiarato è English.',
    privacy: 'Nessuna geolocalizzazione automatica: la scelta resta in questo browser.',
    cancel: 'Annulla',
    save: 'Applica contesto',
    close: 'Chiudi impostazioni globali',
  } : {
    trigger: 'Country and language',
    eyebrow: 'PolicyWatcher global context',
    title: 'Region, country and language',
    lead: 'This preference affects the dashboard, Civic directory and the language of already-localized surfaces.',
    region: 'Geographic region',
    country: 'Country / state',
    allCountries: 'All countries in this region',
    language: 'Interface language',
    auto: 'Automatic',
    english: 'English',
    italian: 'Italiano',
    fallback: 'The complete interface currently supports EN and IT. Other countries use a declared English fallback.',
    privacy: 'No automatic geolocation: this choice stays in your browser.',
    cancel: 'Cancel',
    save: 'Apply context',
    close: 'Close global settings',
  };

  function setRegion(region: GlobalRegion) {
    const currentCountry = GLOBAL_COUNTRIES.find((country) => country.code === draft.country);
    setDraft(normalizeGlobalContext({
      ...draft,
      region,
      country: region === 'global' || currentCountry?.region === region ? draft.country : 'all',
    }));
  }

  function setCountry(country: GlobalCountryCode) {
    setDraft(normalizeGlobalContext({ ...draft, country }));
  }

  function save() {
    updateContext(draft);
    setOpen(false);
  }

  return (
    <div className={`${styles.root} ${compact ? styles.compact : ''} ${className}`.trim()}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setDraft(context);
          setOpen(true);
        }}
        title={copy.trigger}
      >
        <Globe2 size={17} aria-hidden="true" />
        <span>{globalContextLabel(context, lang)}</span>
        <small>{lang.toUpperCase()}</small>
      </button>

      {open && (
        <div className={styles.layer} role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="global-context-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className={styles.header}>
              <div>
                <p>{copy.eyebrow}</p>
                <h2 id="global-context-title" ref={headingRef} tabIndex={-1}>{copy.title}</h2>
                <span>{copy.lead}</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={copy.close}>
                <X size={19} aria-hidden="true" />
              </button>
            </header>

            <div className={styles.fields}>
              <label>
                <span><MapPin size={15} aria-hidden="true" /> {copy.region}</span>
                <select data-testid="global-context-region" value={draft.region} onChange={(event) => setRegion(event.target.value as GlobalRegion)}>
                  {(Object.entries(GLOBAL_REGION_LABELS) as Array<[GlobalRegion, { en: string; it: string }]>).map(([value, labels]) => (
                    <option key={value} value={value}>{labels[lang]}</option>
                  ))}
                </select>
              </label>

              <label>
                <span><Globe2 size={15} aria-hidden="true" /> {copy.country}</span>
                <select data-testid="global-context-country" value={draft.country} onChange={(event) => setCountry(event.target.value as GlobalCountryCode)}>
                  <option value="all">{copy.allCountries}</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.nativeLabel === country.label ? country.label : `${country.label} · ${country.nativeLabel}`}
                    </option>
                  ))}
                </select>
              </label>

              <fieldset>
                <legend><Languages size={15} aria-hidden="true" /> {copy.language}</legend>
                <div className={styles.languageOptions}>
                  {([
                    ['auto', copy.auto],
                    ['en', copy.english],
                    ['it', copy.italian],
                  ] as Array<[PlatformLanguagePreference, string]>).map(([value, label]) => (
                    <label key={value}>
                      <input
                        type="radio"
                        name="policywatcher-global-language"
                        value={value}
                        checked={draft.language === value}
                        onChange={() => setDraft({ ...draft, language: value })}
                      />
                      <span>{draft.language === value && <Check size={14} aria-hidden="true" />}{label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className={styles.boundary}>
              <ShieldCheck size={18} aria-hidden="true" />
              <div><p>{copy.fallback}</p><small>{copy.privacy}</small></div>
            </div>

            <footer className={styles.footer}>
              <button type="button" className={styles.cancel} onClick={() => setOpen(false)}>{copy.cancel}</button>
              <button type="button" data-testid="global-context-save" className={styles.save} onClick={save}>{copy.save}</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
