'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCopy,
  Download,
  Eye,
  FileSearch,
  Filter,
  FolderKanban,
  Info,
  ListFilter,
  LockKeyhole,
  Mail,
  MapPin,
  RotateCcw,
  Search,
  ShieldCheck,
  SquarePen,
  UsersRound,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AddToCollectionButton from '@/components/AddToCollectionButton';
import { useGlobalContext } from '@/components/GlobalContextControl';
import { CIVIC_DIRECTORY_STATS } from '@/lib/civicOrganizations';
import {
  ASSOCIATION_ATTENTION_LABELS,
  ASSOCIATION_REVIEW_LABELS,
  ASSOCIATION_REVIEW_STORAGE_KEY,
  ASSOCIATION_SOURCE_LABELS,
  ASSOCIATION_VERTICAL_BOUNDARIES,
  ASSOCIATION_WATCHLIST_STORAGE_KEY,
  associationCountryLabels,
  associationOrganizationTypeLabels,
  associationPilotPlan,
  associationRegulatoryAreaLabels,
  associationThemeLabels,
  buildAssociationDigestMarkdown,
  matchesAssociationContext,
  type AssociationAttention,
  type AssociationCountryContext,
  type AssociationLanguage,
  type AssociationOrganizationType,
  type AssociationRadarItem,
  type AssociationRadarSummary,
  type AssociationRegulatoryArea,
  type AssociationReviewState,
  type AssociationTheme,
} from '@/lib/associationVertical';
import CivicDirectory from './CivicDirectory';
import styles from './associazioni.module.css';

interface AssociationsClientProps {
  lang: AssociationLanguage;
  items: AssociationRadarItem[];
  summary: AssociationRadarSummary;
  catalogUnavailable: boolean;
}

interface StoredReviewState {
  version: 1;
  states: Record<string, AssociationReviewState>;
}

interface StoredWatchlist {
  version: 1;
  companySlugs: string[];
}

type ParseResult<T> =
  | { status: 'missing' }
  | { status: 'invalid' }
  | { status: 'valid'; value: T };

const REVIEW_STORAGE_LIMIT = 24_000;
const WATCHLIST_STORAGE_LIMIT = 12_000;
const MAX_CATALOG_ENTRIES = 500;
const REVIEW_STATES = new Set<AssociationReviewState>([
  'osservato',
  'in-revisione',
  'pronto-per-pubblicazione',
]);

function radarCountryFromGlobalContext(country: string, region: string): AssociationCountryContext {
  if (country === 'it' || country === 'us' || country === 'gb' || country === 'ca' || country === 'au') {
    return country;
  }
  if (region === 'europe') return 'eu';
  return 'global';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const allowed = new Set(keys);
  return Object.keys(value).every((key) => allowed.has(key));
}

function parseReviewState(raw: string | null, catalogIds: ReadonlySet<string>): ParseResult<StoredReviewState> {
  if (raw === null) return { status: 'missing' };
  if (raw.length === 0 || raw.length > REVIEW_STORAGE_LIMIT) return { status: 'invalid' };

  try {
    const candidate: unknown = JSON.parse(raw);
    if (!isPlainObject(candidate) || !hasOnlyKeys(candidate, ['version', 'states'])) {
      return { status: 'invalid' };
    }
    if (candidate.version !== 1 || !isPlainObject(candidate.states)) return { status: 'invalid' };

    const entries = Object.entries(candidate.states);
    if (entries.length > Math.min(MAX_CATALOG_ENTRIES, catalogIds.size)) return { status: 'invalid' };

    const states: Record<string, AssociationReviewState> = {};
    for (const [id, state] of entries) {
      if (!catalogIds.has(id) || typeof state !== 'string' || !REVIEW_STATES.has(state as AssociationReviewState)) {
        return { status: 'invalid' };
      }
      states[id] = state as AssociationReviewState;
    }

    return { status: 'valid', value: { version: 1, states } };
  } catch {
    return { status: 'invalid' };
  }
}

function parseWatchlist(raw: string | null, catalogSlugs: ReadonlySet<string>): ParseResult<StoredWatchlist> {
  if (raw === null) return { status: 'missing' };
  if (raw.length === 0 || raw.length > WATCHLIST_STORAGE_LIMIT) return { status: 'invalid' };

  try {
    const candidate: unknown = JSON.parse(raw);
    if (!isPlainObject(candidate) || !hasOnlyKeys(candidate, ['version', 'companySlugs'])) {
      return { status: 'invalid' };
    }
    if (candidate.version !== 1 || !Array.isArray(candidate.companySlugs)) return { status: 'invalid' };
    if (candidate.companySlugs.length > Math.min(MAX_CATALOG_ENTRIES, catalogSlugs.size)) {
      return { status: 'invalid' };
    }

    const slugs: string[] = [];
    const seen = new Set<string>();
    for (const slug of candidate.companySlugs) {
      if (
        typeof slug !== 'string' ||
        slug.length === 0 ||
        slug.length > 120 ||
        seen.has(slug) ||
        !catalogSlugs.has(slug)
      ) {
        return { status: 'invalid' };
      }
      seen.add(slug);
      slugs.push(slug);
    }

    return { status: 'valid', value: { version: 1, companySlugs: slugs } };
  } catch {
    return { status: 'invalid' };
  }
}

function formatDate(value: string, lang: AssociationLanguage): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(lang === 'it' ? 'it-IT' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function sortSlugs(slugs: readonly string[]): string[] {
  return [...new Set(slugs)].sort((left, right) => left.localeCompare(right, 'it'));
}

interface RadarEmptyStateProps {
  lang: AssociationLanguage;
  icon: ReactNode;
  availability: string;
  nextStep: string;
  title: string;
  description: string;
  action: ReactNode;
}

function RadarEmptyState({
  lang,
  icon,
  availability,
  nextStep,
  title,
  description,
  action,
}: RadarEmptyStateProps) {
  return (
    <div className={styles.emptyLedger} role="status">
      <div className={styles.emptyRail} aria-hidden="true">
        <span>00</span>
        <i />
        <small>{lang === 'it' ? 'Nessuna evidenza' : 'No evidence'}</small>
      </div>
      <div className={styles.emptyState}>
        <div className={styles.emptyStateMeta}>
          <span>{lang === 'it' ? 'Catalogo' : 'Catalog'} · {availability}</span>
          <span>{lang === 'it' ? 'Prossimo passo' : 'Next step'} · {nextStep}</span>
        </div>
        {icon}
        <h3>{title}</h3>
        <p>{description}</p>
        {action}
      </div>
    </div>
  );
}

export default function AssociationsClient({
  lang,
  items,
  summary,
  catalogUnavailable,
}: AssociationsClientProps) {
  const globalContext = useGlobalContext(lang, lang);
  const tr = useCallback((it: string, en: string) => lang === 'it' ? it : en, [lang]);
  const reviewLabels = ASSOCIATION_REVIEW_LABELS[lang];
  const attentionLabels = ASSOCIATION_ATTENTION_LABELS[lang];
  const sourceLabels = ASSOCIATION_SOURCE_LABELS[lang];
  const themeLabels = associationThemeLabels(lang);
  const countryLabels = associationCountryLabels(lang);
  const regulatoryAreaLabels = associationRegulatoryAreaLabels(lang);
  const organizationTypeLabels = associationOrganizationTypeLabels(lang);
  const pilotPlan = associationPilotPlan(lang);
  const themeOptions = Object.entries(themeLabels) as Array<[AssociationTheme, string]>;
  const countryOptions = Object.entries(countryLabels) as Array<[AssociationCountryContext, string]>;
  const regulatoryAreaOptions = Object.entries(regulatoryAreaLabels) as Array<[AssociationRegulatoryArea, string]>;
  const organizationTypeOptions = Object.entries(organizationTypeLabels) as Array<[AssociationOrganizationType, string]>;
  const companies = useMemo(() => {
    const catalog = new Map<string, string>();
    for (const item of items) catalog.set(item.companySlug, item.company);
    return [...catalog.entries()]
      .map(([slug, name]) => ({ slug, name }))
      .sort((left, right) => left.name.localeCompare(right.name, lang));
  }, [items, lang]);
  const catalogIds = useMemo(() => new Set(items.map((item) => item.id)), [items]);
  const catalogSlugs = useMemo(() => new Set(companies.map((company) => company.slug)), [companies]);
  const allCompanySlugs = useMemo(() => companies.map((company) => company.slug), [companies]);

  const [reviewStates, setReviewStates] = useState<Record<string, AssociationReviewState>>({});
  const [selectedCompanySlugs, setSelectedCompanySlugs] = useState<string[]>(allCompanySlugs);
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState<AssociationCountryContext>('global');
  const [regulatoryArea, setRegulatoryArea] = useState<AssociationRegulatoryArea>('all');
  const [organizationType, setOrganizationType] = useState<AssociationOrganizationType>('all');
  const [theme, setTheme] = useState<'all' | AssociationTheme>('all');
  const [attention, setAttention] = useState<'all' | AssociationAttention>('all');
  const [storageHydrated, setStorageHydrated] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [storageMessage, setStorageMessage] = useState('');
  const [digestMessage, setDigestMessage] = useState('');
  const digestMessageTimer = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const storedReview = parseReviewState(
          window.localStorage.getItem(ASSOCIATION_REVIEW_STORAGE_KEY),
          catalogIds,
        );
        const storedWatchlist = parseWatchlist(
          window.localStorage.getItem(ASSOCIATION_WATCHLIST_STORAGE_KEY),
          catalogSlugs,
        );

        if (storedReview.status === 'valid') setReviewStates(storedReview.value.states);
        if (storedWatchlist.status === 'valid') {
          setSelectedCompanySlugs(sortSlugs(storedWatchlist.value.companySlugs));
        } else {
          setSelectedCompanySlugs(allCompanySlugs);
        }

        if (storedReview.status === 'invalid' || storedWatchlist.status === 'invalid') {
          setStorageMessage(tr(
            'Preferenze locali non valide ignorate; il catalogo pubblico non è stato modificato.',
            'Invalid local preferences were ignored; the public catalog was not changed.',
          ));
        }
      } catch {
        setStorageAvailable(false);
        setStorageMessage(tr(
          'Il salvataggio locale non è disponibile: le scelte restano solo in questa scheda.',
          'Local storage is unavailable: choices remain only in this tab.',
        ));
      } finally {
        setStorageHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [allCompanySlugs, catalogIds, catalogSlugs, tr]);

  useEffect(() => {
    if (!globalContext.ready) return;
    const timer = window.setTimeout(() => {
      setCountry(radarCountryFromGlobalContext(globalContext.context.country, globalContext.context.region));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [globalContext.context.country, globalContext.context.region, globalContext.ready]);

  useEffect(() => {
    if (!storageHydrated || !storageAvailable) return;
    const payload: StoredReviewState = { version: 1, states: reviewStates };
    try {
      window.localStorage.setItem(ASSOCIATION_REVIEW_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      window.setTimeout(() => {
        setStorageAvailable(false);
        setStorageMessage(tr(
          'Il salvataggio locale non è disponibile: le scelte restano solo in questa scheda.',
          'Local storage is unavailable: choices remain only in this tab.',
        ));
      }, 0);
    }
  }, [reviewStates, storageAvailable, storageHydrated, tr]);

  useEffect(() => {
    if (!storageHydrated || !storageAvailable) return;
    const payload: StoredWatchlist = {
      version: 1,
      companySlugs: sortSlugs(selectedCompanySlugs),
    };
    try {
      window.localStorage.setItem(ASSOCIATION_WATCHLIST_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      window.setTimeout(() => {
        setStorageAvailable(false);
        setStorageMessage(tr(
          'Il salvataggio locale non è disponibile: le scelte restano solo in questa scheda.',
          'Local storage is unavailable: choices remain only in this tab.',
        ));
      }, 0);
    }
  }, [selectedCompanySlugs, storageAvailable, storageHydrated, tr]);

  useEffect(() => {
    function syncLocalState(event: StorageEvent) {
      if (event.storageArea !== window.localStorage) return;

      if (event.key === ASSOCIATION_REVIEW_STORAGE_KEY) {
        const parsed = parseReviewState(event.newValue, catalogIds);
        setReviewStates(parsed.status === 'valid' ? parsed.value.states : {});
      }

      if (event.key === ASSOCIATION_WATCHLIST_STORAGE_KEY) {
        const parsed = parseWatchlist(event.newValue, catalogSlugs);
        setSelectedCompanySlugs(
          parsed.status === 'valid' ? sortSlugs(parsed.value.companySlugs) : allCompanySlugs,
        );
      }
    }

    window.addEventListener('storage', syncLocalState);
    return () => window.removeEventListener('storage', syncLocalState);
  }, [allCompanySlugs, catalogIds, catalogSlugs]);

  useEffect(() => () => {
    if (digestMessageTimer.current !== null) window.clearTimeout(digestMessageTimer.current);
  }, []);

  const visibleItems = useMemo(() => {
    const selected = new Set(selectedCompanySlugs);
    const term = query.trim().toLocaleLowerCase(lang);

    return items.filter((item) => {
      if (!selected.has(item.companySlug)) return false;
      if (!matchesAssociationContext(item, { country, regulatoryArea, organizationType })) return false;
      if (theme !== 'all' && !item.themes.includes(theme)) return false;
      if (attention !== 'all' && item.attention !== attention) return false;
      if (!term) return true;
      return [item.company, item.policyName, item.summary]
        .some((value) => value.toLocaleLowerCase(lang).includes(term));
    });
  }, [attention, country, items, lang, organizationType, query, regulatoryArea, selectedCompanySlugs, theme]);

  const digestCounts = useMemo(() => ({
    reviewing: visibleItems.filter((item) => reviewStates[item.id] === 'in-revisione').length,
    ready: visibleItems.filter((item) => reviewStates[item.id] === 'pronto-per-pubblicazione').length,
    verified: visibleItems.filter((item) => item.sourceStage === 'fonte-verificata').length,
  }), [reviewStates, visibleItems]);

  const filtersActive = query.trim().length > 0
    || country !== 'global'
    || regulatoryArea !== 'all'
    || organizationType !== 'all'
    || theme !== 'all'
    || attention !== 'all';

  function toggleCompany(slug: string) {
    setSelectedCompanySlugs((current) => (
      current.includes(slug)
        ? current.filter((value) => value !== slug)
        : sortSlugs([...current, slug])
    ));
    setStorageMessage(storageAvailable
      ? tr('Watchlist aggiornata in questo browser.', 'Watchlist updated in this browser.')
      : tr('Watchlist aggiornata solo per questa scheda.', 'Watchlist updated for this tab only.'));
  }

  function setReviewState(id: string, state: AssociationReviewState) {
    if (!catalogIds.has(id) || !REVIEW_STATES.has(state)) return;
    setReviewStates((current) => {
      const next = { ...current };
      if (state === 'osservato') delete next[id];
      else next[id] = state;
      return next;
    });
    setStorageMessage(storageAvailable
      ? tr(`Stato “${reviewLabels[state]}” salvato in questo browser.`, `“${reviewLabels[state]}” saved in this browser.`)
      : tr(`Stato “${reviewLabels[state]}” aggiornato solo per questa scheda.`, `“${reviewLabels[state]}” updated for this tab only.`));
  }

  function resetFilters() {
    setQuery('');
    setCountry(radarCountryFromGlobalContext(globalContext.context.country, globalContext.context.region));
    setRegulatoryArea('all');
    setOrganizationType('all');
    setTheme('all');
    setAttention('all');
  }

  function announceDigest(message: string) {
    setDigestMessage(message);
    if (digestMessageTimer.current !== null) window.clearTimeout(digestMessageTimer.current);
    digestMessageTimer.current = window.setTimeout(() => setDigestMessage(''), 6_000);
  }

  function buildDigest(): string {
    return buildAssociationDigestMarkdown(visibleItems, reviewStates, new Date(), {
      country,
      regulatoryArea,
      organizationType,
    }, lang);
  }

  async function copyDigest() {
    if (visibleItems.length === 0) return;
    try {
      await window.navigator.clipboard.writeText(buildDigest());
      announceDigest(tr(
        'Digest Markdown copiato. Verificalo prima di qualsiasi riuso o pubblicazione.',
        'Markdown digest copied. Verify it before reuse or publication.',
      ));
    } catch {
      announceDigest(tr(
        'Copia non disponibile in questo browser. Puoi usare il download Markdown.',
        'Copy is unavailable in this browser. You can use the Markdown download.',
      ));
    }
  }

  function downloadDigest() {
    if (visibleItems.length === 0) return;
    try {
      const blob = new Blob([buildDigest()], { type: 'text/markdown;charset=utf-8' });
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `policywatcher-${lang === 'it' ? 'civico' : 'civic'}-digest-${new Date().toISOString().slice(0, 10)}.md`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(objectUrl);
      announceDigest(tr(
        'Digest Markdown scaricato. È un artefatto locale da sottoporre a revisione umana.',
        'Markdown digest downloaded. It is a local artifact that still requires human review.',
      ));
    } catch {
      announceDigest(tr(
        'Download non disponibile. Nessun dato pubblico è stato modificato.',
        'Download unavailable. No public data was changed.',
      ));
    }
  }

  return (
    <main className={styles.page} lang={lang}>
      <nav className={styles.anchorNav} aria-label={tr('Sezioni di PolicyWatcher Civico', 'PolicyWatcher Civic sections')}>
        <div className={styles.shell}>
          <a href="#panoramica">{tr('Panoramica', 'Overview')}</a>
          <a href="#organizzazioni">{tr('Organizzazioni', 'Organizations')}</a>
          <a href="#radar">Radar</a>
          <a href="#dossier">{tr('Dossier', 'Dossiers')}</a>
          <a href="#pilot">Pilot</a>
        </div>
      </nav>

      <div className={styles.shell}>
        <header id="panoramica" className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>{tr('Osservatorio civico globale · evidenze pubbliche', 'Global civic observatory · public evidence')}</p>
            <h1>{tr('Associazioni dei consumatori', 'Consumer associations')}</h1>
            <p className={styles.lead}>
              {tr(
                `${CIVIC_DIRECTORY_STATS.organizations} realtà in ${CIVIC_DIRECTORY_STATS.countries} paesi, dalle associazioni generaliste ai diritti digitali, collegate a fonti verificabili e al radar delle policy globali.`,
                `${CIVIC_DIRECTORY_STATS.organizations} organizations across ${CIVIC_DIRECTORY_STATS.countries} countries, from general consumer advocates to digital-rights groups, connected to verifiable sources and the global policy radar.`,
              )}
            </p>
            <p className={styles.heroBoundary}>
              {tr(
                'Un banco di lavoro per osservare fonti pubbliche, fare triage e preparare materiali da verificare. Non sostituisce la revisione legale o specialistica.',
                'A workspace for observing public sources, triaging signals and preparing material for verification. It does not replace legal or specialist review.',
              )}
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="#organizzazioni">
                {tr('Esplora le organizzazioni', 'Explore organizations')} <ArrowRight size={17} aria-hidden="true" />
              </a>
              <a className={styles.secondaryAction} href="#radar">
                {tr('Apri il radar', 'Open the radar')} <FileSearch size={16} aria-hidden="true" />
              </a>
            </div>
          </div>

          <aside className={styles.liveSummary} aria-labelledby="summary-title">
            <div className={styles.summaryHead}>
              <span id="summary-title">{tr('Registro pubblico disponibile', 'Public register status')}</span>
              <span className={catalogUnavailable ? styles.unavailableDot : styles.availableDot}>
                {catalogUnavailable ? tr('Non disponibile', 'Unavailable') : tr('Catalogo caricato', 'Catalog loaded')}
              </span>
            </div>
            <dl className={styles.summaryGrid}>
              <div><dt>{tr('Evidenze', 'Evidence')}</dt><dd>{summary.records}</dd></div>
              <div><dt>{tr('Aziende', 'Companies')}</dt><dd>{summary.companies}</dd></div>
              <div><dt>{tr('Fonti verificate', 'Verified sources')}</dt><dd>{summary.verifiedSources}</dd></div>
              <div><dt>{tr('Da rivedere', 'To review')}</dt><dd>{summary.reviewRequired}</dd></div>
            </dl>
            <p>
              {catalogUnavailable
                ? tr('Il catalogo non può essere letto in questo momento; non mostriamo dati sostitutivi.', 'The catalog cannot be read at this time; no substitute data is shown.')
                : summary.latestEvidenceAt
                  ? tr(
                    `Ultima evidenza del ${formatDate(summary.latestEvidenceAt, lang)} · ${summary.priorityItems} segnali prioritari.`,
                    `Latest evidence ${formatDate(summary.latestEvidenceAt, lang)} · ${summary.priorityItems} priority signals.`,
                  )
                  : tr('Il catalogo è raggiungibile ma non contiene ancora evidenze pubblicabili.', 'The catalog is reachable but does not yet contain publishable evidence.')}
            </p>
          </aside>
        </header>

        <section className={styles.actionFlow} aria-labelledby="action-flow-title">
          <div className={styles.sectionLabel}><span>01</span><p>{tr('Dal documento all’azione civica', 'From document to civic action')}</p></div>
          <h2 id="action-flow-title">{tr('Flusso di revisione', 'Review workflow')}</h2>
          <ol>
            <li>
              <Eye size={20} aria-hidden="true" />
              <span>01</span>
              <div><h3>{tr('Osservare', 'Observe')}</h3><p>{tr('Individuare cambiamenti e segnali nel registro pubblico.', 'Identify changes and signals in the public register.')}</p></div>
            </li>
            <li>
              <BookOpenCheck size={20} aria-hidden="true" />
              <span>02</span>
              <div><h3>{tr('Verificare', 'Verify')}</h3><p>{tr('Aprire la fonte, porre domande e registrare uno stato locale.', 'Open the source, ask questions and record a local status.')}</p></div>
            </li>
            <li>
              <SquarePen size={20} aria-hidden="true" />
              <span>03</span>
              <div><h3>{tr('Informare', 'Inform')}</h3><p>{tr('Riutilizzare solo materiali controllati nel proprio processo editoriale.', 'Reuse only reviewed material in your editorial process.')}</p></div>
            </li>
          </ol>
        </section>

        <CivicDirectory lang={lang} />

        <section id="radar" className={styles.radarSection} aria-labelledby="radar-title">
          <div className={styles.sectionHeading}>
            <div>
              <div className={styles.sectionLabel}><span>02</span><p>{tr('Banco di lavoro', 'Workspace')}</p></div>
              <h2 id="radar-title">{tr('Radar civico delle evidenze', 'Civic evidence radar')}</h2>
              <p>{tr('Definisci il perimetro, filtra i segnali e annota la decisione di revisione nel browser corrente.', 'Define the scope, filter signals and record the review decision in the current browser.')}</p>
            </div>
            <span className={styles.localFlag}>
              <LockKeyhole size={15} aria-hidden="true" /> {tr('Stato e watchlist solo locali', 'Local-only status and watchlist')}
            </span>
          </div>

          <aside className={styles.boundaryNotice} aria-label={tr('Confine del radar', 'Radar boundary')}>
            <ShieldCheck size={21} aria-hidden="true" />
            <div>
              <strong>{tr('Confine di utilizzo', 'Use boundary')}</strong>
              <p>{ASSOCIATION_VERTICAL_BOUNDARIES[lang]}</p>
            </div>
          </aside>

          <section className={styles.contextPanel} aria-labelledby="association-context-title">
            <div className={styles.contextIntro}>
              <MapPin size={21} aria-hidden="true" />
              <div>
                <p className={styles.kicker}>{tr('Contesto civico', 'Civic context')}</p>
                <h3 id="association-context-title">{tr('Contesto del radar', 'Radar context')}</h3>
                <p>
                  {tr(
                    'Il contesto ordina le evidenze già presenti. Quando non esiste un set nazionale dedicato, PolicyWatcher mostra soltanto record esplicitamente globali e non deduce coperture locali.',
                    'The context organizes existing evidence. When no dedicated national set exists, PolicyWatcher shows only explicitly global records and does not infer local coverage.',
                  )}
                </p>
              </div>
            </div>
            <div className={styles.contextGrid}>
              <label className={styles.selectField} htmlFor="civic-country-context">
                <span>{tr('Paese o area', 'Country or region')}</span>
                <select id="civic-country-context" name="civic-country-context" value={country} onChange={(event) => setCountry(event.target.value as AssociationCountryContext)}>
                  {countryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className={styles.selectField} htmlFor="civic-regulatory-area">
                <span>{tr('Area normativa', 'Regulatory area')}</span>
                <select id="civic-regulatory-area" name="civic-regulatory-area" value={regulatoryArea} onChange={(event) => setRegulatoryArea(event.target.value as AssociationRegulatoryArea)}>
                  {regulatoryAreaOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className={styles.selectField} htmlFor="civic-organization-type">
                <span>{tr('Tipo di associazione', 'Organization type')}</span>
                <select id="civic-organization-type" name="civic-organization-type" value={organizationType} onChange={(event) => setOrganizationType(event.target.value as AssociationOrganizationType)}>
                  {organizationTypeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            </div>
            <p className={styles.contextSummary} aria-live="polite">
              {tr('Perimetro attivo', 'Active scope')} · {countryLabels[country]} · {regulatoryAreaLabels[regulatoryArea]} · {organizationTypeLabels[organizationType]}
            </p>
          </section>

          <div className={styles.workspace}>
            <aside className={styles.controls} aria-label={tr('Watchlist e filtri del radar', 'Radar watchlist and filters')}>
              <section className={styles.watchlist} aria-labelledby="watchlist-title">
                <div className={styles.controlHead}>
                  <div>
                    <UsersRound size={18} aria-hidden="true" />
                    <h3 id="watchlist-title">{tr('Watchlist pilot', 'Pilot watchlist')}</h3>
                  </div>
                  <strong>{selectedCompanySlugs.length}/{companies.length}</strong>
                </div>
                <p>{tr('Seleziona le aziende da includere. Si salvano soltanto gli identificativi pubblici.', 'Select the companies to include. Only public identifiers are stored.')}</p>
                <div className={styles.miniActions}>
                  <button
                    type="button"
                    onClick={() => setSelectedCompanySlugs(allCompanySlugs)}
                    disabled={companies.length === 0 || selectedCompanySlugs.length === companies.length}
                  >
                    {tr('Seleziona tutte', 'Select all')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCompanySlugs([])}
                    disabled={selectedCompanySlugs.length === 0}
                  >
                    {tr('Azzera', 'Clear')}
                  </button>
                </div>
                {companies.length > 0 ? (
                  <div className={styles.companyList}>
                    {companies.map((company) => (
                      <label key={company.slug} data-selected={selectedCompanySlugs.includes(company.slug)}>
                        <input
                          type="checkbox"
                          checked={selectedCompanySlugs.includes(company.slug)}
                          onChange={() => toggleCompany(company.slug)}
                        />
                        <span>{company.name}</span>
                        <CheckCircle2 size={15} aria-hidden="true" />
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className={styles.controlEmpty}>{tr('Nessuna azienda nel catalogo pubblico.', 'No companies in the public catalog.')}</p>
                )}
              </section>

              <section className={styles.filters} aria-labelledby="filters-title">
                <div className={styles.controlHead}>
                  <div><ListFilter size={18} aria-hidden="true" /><h3 id="filters-title">{tr('Filtri', 'Filters')}</h3></div>
                  {filtersActive && (
                    <button type="button" onClick={resetFilters} aria-label={tr('Reimposta tutti i filtri', 'Reset all filters')}>
                      <RotateCcw size={15} aria-hidden="true" /> {tr('Reimposta', 'Reset')}
                    </button>
                  )}
                </div>
                <label className={styles.searchField}>
                  <span>{tr('Cerca nel radar', 'Search the radar')}</span>
                  <span className={styles.inputWrap}>
                    <Search size={17} aria-hidden="true" />
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value.slice(0, 160))}
                      placeholder={tr('Azienda, policy o sintesi', 'Company, policy or summary')}
                    />
                  </span>
                </label>
                <label className={styles.selectField}>
                  <span>{tr('Tema', 'Theme')}</span>
                  <select value={theme} onChange={(event) => setTheme(event.target.value as 'all' | AssociationTheme)}>
                    <option value="all">{tr('Tutti i temi', 'All themes')}</option>
                    {themeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className={styles.selectField}>
                  <span>{tr('Segnale di attenzione', 'Attention signal')}</span>
                  <select
                    value={attention}
                    onChange={(event) => setAttention(event.target.value as 'all' | AssociationAttention)}
                  >
                    <option value="all">{tr('Tutti i segnali', 'All signals')}</option>
                    <option value="prioritaria">{attentionLabels.prioritaria}</option>
                    <option value="da-valutare">{attentionLabels['da-valutare']}</option>
                    <option value="monitoraggio">{attentionLabels.monitoraggio}</option>
                  </select>
                </label>
              </section>

              <p className={styles.storageNote} data-available={storageAvailable}>
                <LockKeyhole size={15} aria-hidden="true" />
                {storageAvailable
                  ? tr('Nessun nome di associazione o dato personale viene salvato.', 'No organization name or personal data is stored.')
                  : tr('Archiviazione non disponibile: le scelte possono perdersi chiudendo la scheda.', 'Storage unavailable: choices may be lost when this tab is closed.')}
              </p>
              <p className={styles.srOnly} role="status" aria-live="polite">{storageMessage}</p>
            </aside>

            <div className={styles.radarResults}>
              <div className={styles.resultsHead}>
                <div>
                  <p className={styles.kicker}>{tr('Registro filtrato', 'Filtered register')}</p>
                  <h3>{visibleItems.length} {visibleItems.length === 1 ? tr('evidenza visibile', 'visible evidence item') : tr('evidenze visibili', 'visible evidence items')}</h3>
                </div>
                <span>{selectedCompanySlugs.length} {tr('aziende nel perimetro', 'companies in scope')}</span>
              </div>

              {catalogUnavailable ? (
                <RadarEmptyState
                  lang={lang}
                  icon={<AlertTriangle size={25} aria-hidden="true" />}
                  availability={tr('temporaneamente non disponibile', 'temporarily unavailable')}
                  nextStep={tr('riprova o consulta il metodo', 'retry or inspect the method')}
                  title={tr('Catalogo temporaneamente non disponibile', 'Catalog temporarily unavailable')}
                  description={tr('Non sostituiamo le evidenze mancanti con stime o contenuti non verificati. Riprova più tardi.', 'Missing evidence is not replaced with estimates or unverified content. Try again later.')}
                  action={<Link href="/methodology/confidence">{tr('Consulta la metodologia', 'Read the methodology')} <ArrowRight size={15} aria-hidden="true" /></Link>}
                />
              ) : items.length === 0 ? (
                <RadarEmptyState
                  lang={lang}
                  icon={<FileSearch size={25} aria-hidden="true" />}
                  availability={tr('raggiungibile, zero record pubblici', 'reachable, zero public records')}
                  nextStep={tr('attendi il gate di pubblicazione', 'wait for the publication gate')}
                  title={tr('Catalogo pubblico vuoto', 'Public catalog is empty')}
                  description={tr('Il catalogo è disponibile, ma nessuna evidenza ha ancora superato i gate di pubblicazione.', 'The catalog is available, but no evidence has passed the publication gates yet.')}
                  action={<Link href="/what-changed">{tr('Come leggere i cambiamenti', 'How to read changes')} <ArrowRight size={15} aria-hidden="true" /></Link>}
                />
              ) : selectedCompanySlugs.length === 0 ? (
                <RadarEmptyState
                  lang={lang}
                  icon={<Filter size={25} aria-hidden="true" />}
                  availability={tr('record esclusi dalla watchlist', 'records excluded by the watchlist')}
                  nextStep={tr('seleziona almeno un’azienda', 'select at least one company')}
                  title={tr('Watchlist senza aziende', 'Watchlist has no companies')}
                  description={tr('Seleziona almeno un’azienda per mostrare le relative evidenze pubbliche.', 'Select at least one company to show its public evidence.')}
                  action={<button type="button" onClick={() => setSelectedCompanySlugs(allCompanySlugs)}>{tr('Seleziona tutte', 'Select all')}</button>}
                />
              ) : visibleItems.length === 0 ? (
                <RadarEmptyState
                  lang={lang}
                  icon={<Search size={25} aria-hidden="true" />}
                  availability={tr('record filtrati', 'filtered records')}
                  nextStep={tr('amplia i criteri di ricerca', 'broaden the search criteria')}
                  title={tr('Nessun risultato per questi filtri', 'No results for these filters')}
                  description={tr('Il perimetro selezionato non contiene evidenze corrispondenti alla ricerca.', 'The selected scope contains no evidence matching the search.')}
                  action={<button type="button" onClick={resetFilters}>{tr('Reimposta i filtri', 'Reset filters')}</button>}
                />
              ) : (
                <ol className={styles.evidenceLedger}>
                  {visibleItems.map((item, index) => {
                    const currentReview = reviewStates[item.id] ?? 'osservato';
                    return (
                      <li key={item.id} data-attention={item.attention}>
                        <div className={styles.ledgerRail} aria-hidden="true">
                          <span>{String(index + 1).padStart(2, '0')}</span>
                          <i />
                        </div>
                        <article>
                          <div className={styles.evidenceTopline}>
                            <span data-attention={item.attention}>{attentionLabels[item.attention]}</span>
                            <span data-source={item.sourceStage}>{sourceLabels[item.sourceStage]}</span>
                            <time dateTime={item.createdAt}>{formatDate(item.createdAt, lang)}</time>
                            <span>{item.jurisdiction}</span>
                          </div>
                          <div className={styles.evidenceTitle}>
                            <div>
                              <h4>{item.company}</h4>
                              <p>{item.policyName}</p>
                            </div>
                            <code title={item.id}>{item.id}</code>
                          </div>
                          <div className={styles.themeList} aria-label={tr('Temi dell’evidenza', 'Evidence themes')}>
                            {item.themes.map((itemTheme) => (
                              <span key={itemTheme}>{themeLabels[itemTheme]}</span>
                            ))}
                          </div>
                          <p className={styles.evidenceSummary}>{item.summary}</p>

                          <details className={styles.reviewQuestions}>
                            <summary>{tr('Domande per la revisione civica', 'Questions for civic review')}</summary>
                            <div>
                              <ol>
                                {item.citizenQuestions.map((question) => <li key={question}>{question}</li>)}
                              </ol>
                              <p><Info size={15} aria-hidden="true" /> {item.sourceBoundary}</p>
                            </div>
                          </details>

                          <div className={styles.reviewBar}>
                            <label>
                              <span>{tr('Stato di revisione locale', 'Local review status')}</span>
                              <select
                                value={currentReview}
                                onChange={(event) => setReviewState(item.id, event.target.value as AssociationReviewState)}
                              >
                                <option value="osservato">{reviewLabels.osservato}</option>
                                <option value="in-revisione">{reviewLabels['in-revisione']}</option>
                                <option value="pronto-per-pubblicazione">{reviewLabels['pronto-per-pubblicazione']}</option>
                              </select>
                            </label>
                            <small>
                              {currentReview === 'pronto-per-pubblicazione'
                                ? tr('Stato del revisore locale: non pubblica né approva automaticamente.', 'Local reviewer status: it does not publish or approve anything automatically.')
                                : tr('Visibile soltanto in questo browser.', 'Visible only in this browser.')}
                            </small>
                          </div>

                          <nav className={styles.evidenceActions} aria-label={tr(`Azioni per ${item.company}: ${item.policyName}`, `Actions for ${item.company}: ${item.policyName}`)}>
                            <Link href={item.evidenceHref}>{tr('Apri Evidence Packet', 'Open Evidence Packet')} <ArrowRight size={15} aria-hidden="true" /></Link>
                            <Link href={item.changeHref}>{tr('Leggi il cambiamento in italiano', 'Read the change in English')} <ArrowRight size={15} aria-hidden="true" /></Link>
                            <AddToCollectionButton changeId={item.id} compact lang={lang} />
                          </nav>
                        </article>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        </section>

        <section id="dossier" className={styles.dossierSection} aria-labelledby="dossier-title">
          <div className={styles.dossierIntro}>
            <div className={styles.sectionLabel}><span>03</span><p>{tr('Dossier e digest', 'Dossiers and digest')}</p></div>
            <h2 id="dossier-title">{tr('Dossier di revisione', 'Review dossier')}</h2>
            <p>
              {tr(
                'Il digest include solo le evidenze ora visibili e i relativi stati locali. Prima del riuso, apri le fonti e applica il processo di revisione della tua organizzazione.',
                'The digest includes only currently visible evidence and its local review states. Before reuse, open the sources and apply your organization’s review process.',
              )}
            </p>
            <nav aria-label={tr('Risorse per dossier e verifica', 'Dossier and verification resources')}>
              <Link href="/collections">{tr('Apri le raccolte di evidenze', 'Open evidence collections')} <FolderKanban size={16} aria-hidden="true" /></Link>
              <Link href="/what-changed">{tr('Come leggere un cambiamento', 'How to read a change')} <ArrowRight size={16} aria-hidden="true" /></Link>
            </nav>
          </div>

          <div className={styles.digestWorkbench}>
            <div className={styles.digestHead}>
              <div><ClipboardCopy size={20} aria-hidden="true" /><h3>{tr('Digest Markdown locale', 'Local Markdown digest')}</h3></div>
              <strong>{visibleItems.length} {tr('incluse', 'included')}</strong>
            </div>
            <dl>
              <div><dt>{tr('Fonti verificate', 'Verified sources')}</dt><dd>{digestCounts.verified}</dd></div>
              <div><dt>{tr('In revisione', 'Under review')}</dt><dd>{digestCounts.reviewing}</dd></div>
              <div><dt>{tr('Pronte localmente', 'Locally ready')}</dt><dd>{digestCounts.ready}</dd></div>
            </dl>
            <p className={styles.digestBoundary}>
              <Info size={16} aria-hidden="true" /> {tr(
                'È un artefatto di revisione generato nel browser: non è una pubblicazione, approvazione o presa di posizione di PolicyWatcher o di un’associazione.',
                'This is a review artifact generated in the browser. It is not a publication, approval or position of PolicyWatcher or any organization.',
              )}
            </p>
            <div className={styles.digestActions}>
              <button type="button" onClick={copyDigest} disabled={visibleItems.length === 0}>
                <ClipboardCopy size={16} aria-hidden="true" /> {tr('Copia Markdown', 'Copy Markdown')}
              </button>
              <button type="button" onClick={downloadDigest} disabled={visibleItems.length === 0}>
                <Download size={16} aria-hidden="true" /> {tr('Scarica .md', 'Download .md')}
              </button>
            </div>
            <p className={styles.digestFeedback} role="status" aria-live="polite">{digestMessage}</p>
          </div>
        </section>

        <section id="pilot" className={styles.pilotSection} aria-labelledby="pilot-title">
          <div className={styles.sectionHeading}>
            <div>
              <div className={styles.sectionLabel}><span>04</span><p>{tr('Pilot di 60 giorni', '60-day pilot')}</p></div>
              <h2 id="pilot-title">{tr('Fasi del pilot', 'Pilot phases')}</h2>
              <p>{tr('Quattro fasi coprono configurazione, osservazione, revisione e valutazione dei risultati.', 'Four phases cover setup, observation, review and evaluation of results.')}</p>
            </div>
          </div>
          <ol className={styles.pilotTimeline}>
            {pilotPlan.map((phase, index) => (
              <li key={phase.week}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <time>{phase.week}</time>
                <div><h3>{phase.title}</h3><p>{phase.description}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.finalBoundary} aria-labelledby="final-boundary-title">
          <div>
            <p className={styles.kicker}>{tr('Ambito e responsabilità', 'Scope and responsibility')}</p>
            <h2 id="final-boundary-title">{tr('Supporto alla revisione', 'Review support')}</h2>
          </div>
          <div>
            <p>{ASSOCIATION_VERTICAL_BOUNDARIES[lang]}</p>
            <p>
              {tr(
                'Watchlist e stati di revisione restano nel browser corrente. “Pronto per pubblicazione” descrive solo una scelta locale del revisore e non attiva alcuna pubblicazione.',
                'Watchlist and review states remain in the current browser. “Ready for publication” describes only a local reviewer choice and does not trigger publication.',
              )}
            </p>
            <nav aria-label={tr('Approfondimenti e contatto', 'Further information and contact')}>
              <a className={styles.primaryAction} href={`mailto:info@policywatcher.online?subject=${encodeURIComponent(lang === 'it' ? 'Pilot PolicyWatcher Civico' : 'PolicyWatcher Civic pilot')}`}>
                {tr('Valuta un pilot', 'Discuss a pilot')} <Mail size={16} aria-hidden="true" />
              </a>
              <Link href="/methodology/confidence">{tr('Metodologia delle fonti', 'Source methodology')} <ArrowRight size={16} aria-hidden="true" /></Link>
              <Link href="/collections">Evidence Collections <ArrowRight size={16} aria-hidden="true" /></Link>
            </nav>
          </div>
        </section>
      </div>
    </main>
  );
}
