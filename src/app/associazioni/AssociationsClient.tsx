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
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AddToCollectionButton from '@/components/AddToCollectionButton';
import { useGlobalContext } from '@/components/GlobalContextControl';
import {
  ASSOCIATION_COUNTRY_LABELS,
  ASSOCIATION_ORGANIZATION_TYPE_LABELS,
  ASSOCIATION_PILOT_PLAN,
  ASSOCIATION_REGULATORY_AREA_LABELS,
  ASSOCIATION_REVIEW_STORAGE_KEY,
  ASSOCIATION_THEME_LABELS,
  ASSOCIATION_VERTICAL_BOUNDARY,
  ASSOCIATION_WATCHLIST_STORAGE_KEY,
  buildAssociationDigestMarkdown,
  matchesAssociationContext,
  type AssociationAttention,
  type AssociationCountryContext,
  type AssociationOrganizationType,
  type AssociationRadarItem,
  type AssociationRadarSummary,
  type AssociationRegulatoryArea,
  type AssociationReviewState,
  type AssociationSourceStage,
  type AssociationTheme,
} from '@/lib/associationVertical';
import CivicDirectory from './CivicDirectory';
import styles from './associazioni.module.css';

interface AssociationsClientProps {
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

const reviewLabels: Record<AssociationReviewState, string> = {
  osservato: 'Osservato',
  'in-revisione': 'In revisione',
  'pronto-per-pubblicazione': 'Pronto per pubblicazione',
};

const attentionLabels: Record<AssociationAttention, string> = {
  prioritaria: 'Prioritaria',
  'da-valutare': 'Da valutare',
  monitoraggio: 'Monitoraggio',
};

const sourceLabels: Record<AssociationSourceStage, string> = {
  'fonte-verificata': 'Fonte verificata',
  'revisione-richiesta': 'Revisione richiesta',
  'stato-non-registrato': 'Stato fonte non registrato',
};

const themeOptions = Object.entries(ASSOCIATION_THEME_LABELS) as Array<[AssociationTheme, string]>;
const countryOptions = Object.entries(ASSOCIATION_COUNTRY_LABELS) as Array<[AssociationCountryContext, string]>;
const regulatoryAreaOptions = Object.entries(ASSOCIATION_REGULATORY_AREA_LABELS) as Array<[AssociationRegulatoryArea, string]>;
const organizationTypeOptions = Object.entries(ASSOCIATION_ORGANIZATION_TYPE_LABELS) as Array<[AssociationOrganizationType, string]>;

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

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function sortSlugs(slugs: readonly string[]): string[] {
  return [...new Set(slugs)].sort((left, right) => left.localeCompare(right, 'it'));
}

interface RadarEmptyStateProps {
  icon: ReactNode;
  availability: string;
  nextStep: string;
  title: string;
  description: string;
  action: ReactNode;
}

function RadarEmptyState({
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
        <small>Nessuna evidenza</small>
      </div>
      <div className={styles.emptyState}>
        <div className={styles.emptyStateMeta}>
          <span>Catalogo · {availability}</span>
          <span>Prossimo passo · {nextStep}</span>
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
  items,
  summary,
  catalogUnavailable,
}: AssociationsClientProps) {
  const globalContext = useGlobalContext('it');
  const companies = useMemo(() => {
    const catalog = new Map<string, string>();
    for (const item of items) catalog.set(item.companySlug, item.company);
    return [...catalog.entries()]
      .map(([slug, name]) => ({ slug, name }))
      .sort((left, right) => left.name.localeCompare(right.name, 'it'));
  }, [items]);
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
          setStorageMessage('Preferenze locali non valide ignorate; il catalogo pubblico non è stato modificato.');
        }
      } catch {
        setStorageAvailable(false);
        setStorageMessage('Il salvataggio locale non è disponibile: le scelte restano solo in questa scheda.');
      } finally {
        setStorageHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [allCompanySlugs, catalogIds, catalogSlugs]);

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
        setStorageMessage('Il salvataggio locale non è disponibile: le scelte restano solo in questa scheda.');
      }, 0);
    }
  }, [reviewStates, storageAvailable, storageHydrated]);

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
        setStorageMessage('Il salvataggio locale non è disponibile: le scelte restano solo in questa scheda.');
      }, 0);
    }
  }, [selectedCompanySlugs, storageAvailable, storageHydrated]);

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
    const term = query.trim().toLocaleLowerCase('it');

    return items.filter((item) => {
      if (!selected.has(item.companySlug)) return false;
      if (!matchesAssociationContext(item, { country, regulatoryArea, organizationType })) return false;
      if (theme !== 'all' && !item.themes.includes(theme)) return false;
      if (attention !== 'all' && item.attention !== attention) return false;
      if (!term) return true;
      return [item.company, item.policyName, item.summary]
        .some((value) => value.toLocaleLowerCase('it').includes(term));
    });
  }, [attention, country, items, organizationType, query, regulatoryArea, selectedCompanySlugs, theme]);

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
      ? 'Watchlist aggiornata in questo browser.'
      : 'Watchlist aggiornata solo per questa scheda.');
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
      ? `Stato “${reviewLabels[state]}” salvato in questo browser.`
      : `Stato “${reviewLabels[state]}” aggiornato solo per questa scheda.`);
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
    });
  }

  async function copyDigest() {
    if (visibleItems.length === 0) return;
    try {
      await window.navigator.clipboard.writeText(buildDigest());
      announceDigest('Digest Markdown copiato. Verificalo prima di qualsiasi riuso o pubblicazione.');
    } catch {
      announceDigest('Copia non disponibile in questo browser. Puoi usare il download Markdown.');
    }
  }

  function downloadDigest() {
    if (visibleItems.length === 0) return;
    try {
      const blob = new Blob([buildDigest()], { type: 'text/markdown;charset=utf-8' });
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `policywatcher-civico-digest-${new Date().toISOString().slice(0, 10)}.md`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(objectUrl);
      announceDigest('Digest Markdown scaricato. È un artefatto locale da sottoporre a revisione umana.');
    } catch {
      announceDigest('Download non disponibile. Nessun dato pubblico è stato modificato.');
    }
  }

  return (
    <main className={styles.page}>
      <nav className={styles.anchorNav} aria-label="Sezioni di PolicyWatcher Civico">
        <div className={styles.shell}>
          <a href="#panoramica">Panoramica</a>
          <a href="#organizzazioni">Organizzazioni</a>
          <a href="#radar">Radar</a>
          <a href="#dossier">Dossier</a>
          <a href="#pilot">Pilot</a>
        </div>
      </nav>

      <div className={styles.shell}>
        <header id="panoramica" className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Osservatorio civico globale · evidenze pubbliche</p>
            <h1>PolicyWatcher <span>Civico</span></h1>
            <p className={styles.lead}>
              79 realtà in 24 paesi, dalle associazioni generaliste ai diritti digitali, collegate a fonti verificabili e al radar delle policy globali.
            </p>
            <p className={styles.heroBoundary}>
              Un banco di lavoro per osservare fonti pubbliche, fare triage e preparare materiali da verificare.
              Non sostituisce la revisione legale o specialistica.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="#organizzazioni">
                Esplora le organizzazioni <ArrowRight size={17} aria-hidden="true" />
              </a>
              <a className={styles.secondaryAction} href="#radar">
                Apri il radar <FileSearch size={16} aria-hidden="true" />
              </a>
            </div>
          </div>

          <aside className={styles.liveSummary} aria-labelledby="summary-title">
            <div className={styles.summaryHead}>
              <span id="summary-title">Registro pubblico disponibile</span>
              <span className={catalogUnavailable ? styles.unavailableDot : styles.availableDot}>
                {catalogUnavailable ? 'Non disponibile' : 'Catalogo caricato'}
              </span>
            </div>
            <dl className={styles.summaryGrid}>
              <div><dt>Evidenze</dt><dd>{summary.records}</dd></div>
              <div><dt>Aziende</dt><dd>{summary.companies}</dd></div>
              <div><dt>Fonti verificate</dt><dd>{summary.verifiedSources}</dd></div>
              <div><dt>Da rivedere</dt><dd>{summary.reviewRequired}</dd></div>
            </dl>
            <p>
              {catalogUnavailable
                ? 'Il catalogo non può essere letto in questo momento; non mostriamo dati sostitutivi.'
                : summary.latestEvidenceAt
                  ? `Ultima evidenza del ${formatDate(summary.latestEvidenceAt)} · ${summary.priorityItems} segnali prioritari.`
                  : 'Il catalogo è raggiungibile ma non contiene ancora evidenze pubblicabili.'}
            </p>
          </aside>
        </header>

        <section className={styles.actionFlow} aria-labelledby="action-flow-title">
          <div className={styles.sectionLabel}><span>01</span><p>Dal documento all’azione civica</p></div>
          <h2 id="action-flow-title">Tre passaggi, una responsabilità umana</h2>
          <ol>
            <li>
              <Eye size={20} aria-hidden="true" />
              <span>01</span>
              <div><h3>Osservare</h3><p>Individuare cambiamenti e segnali nel registro pubblico.</p></div>
            </li>
            <li>
              <BookOpenCheck size={20} aria-hidden="true" />
              <span>02</span>
              <div><h3>Verificare</h3><p>Aprire la fonte, porre domande e registrare uno stato locale.</p></div>
            </li>
            <li>
              <SquarePen size={20} aria-hidden="true" />
              <span>03</span>
              <div><h3>Informare</h3><p>Riutilizzare solo materiali controllati nel proprio processo editoriale.</p></div>
            </li>
          </ol>
        </section>

        <CivicDirectory />

        <section id="radar" className={styles.radarSection} aria-labelledby="radar-title">
          <div className={styles.sectionHeading}>
            <div>
              <div className={styles.sectionLabel}><span>02</span><p>Banco di lavoro</p></div>
              <h2 id="radar-title">Radar civico delle evidenze</h2>
              <p>Definisci il perimetro, filtra i segnali e annota la decisione di revisione nel browser corrente.</p>
            </div>
            <span className={styles.localFlag}>
              <LockKeyhole size={15} aria-hidden="true" /> Stato e watchlist solo locali
            </span>
          </div>

          <aside className={styles.boundaryNotice} aria-label="Confine del radar">
            <ShieldCheck size={21} aria-hidden="true" />
            <div>
              <strong>Confine di utilizzo</strong>
              <p>{ASSOCIATION_VERTICAL_BOUNDARY}</p>
            </div>
          </aside>

          <section className={styles.contextPanel} aria-labelledby="association-context-title">
            <div className={styles.contextIntro}>
              <MapPin size={21} aria-hidden="true" />
              <div>
                <p className={styles.kicker}>Contesto civico</p>
                <h3 id="association-context-title">Declina il radar sul territorio e sul mandato</h3>
                <p>
                  Il contesto ordina le evidenze già presenti. Quando non esiste un set nazionale dedicato,
                  PolicyWatcher mostra soltanto record esplicitamente globali e non deduce coperture locali.
                </p>
              </div>
            </div>
            <div className={styles.contextGrid}>
              <label className={styles.selectField} htmlFor="civic-country-context">
                <span>Paese o area</span>
                <select id="civic-country-context" name="civic-country-context" value={country} onChange={(event) => setCountry(event.target.value as AssociationCountryContext)}>
                  {countryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className={styles.selectField} htmlFor="civic-regulatory-area">
                <span>Area normativa</span>
                <select id="civic-regulatory-area" name="civic-regulatory-area" value={regulatoryArea} onChange={(event) => setRegulatoryArea(event.target.value as AssociationRegulatoryArea)}>
                  {regulatoryAreaOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className={styles.selectField} htmlFor="civic-organization-type">
                <span>Tipo di associazione</span>
                <select id="civic-organization-type" name="civic-organization-type" value={organizationType} onChange={(event) => setOrganizationType(event.target.value as AssociationOrganizationType)}>
                  {organizationTypeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            </div>
            <p className={styles.contextSummary} aria-live="polite">
              Perimetro attivo · {ASSOCIATION_COUNTRY_LABELS[country]} · {ASSOCIATION_REGULATORY_AREA_LABELS[regulatoryArea]} · {ASSOCIATION_ORGANIZATION_TYPE_LABELS[organizationType]}
            </p>
          </section>

          <div className={styles.workspace}>
            <aside className={styles.controls} aria-label="Watchlist e filtri del radar">
              <section className={styles.watchlist} aria-labelledby="watchlist-title">
                <div className={styles.controlHead}>
                  <div>
                    <UsersRound size={18} aria-hidden="true" />
                    <h3 id="watchlist-title">Watchlist pilot</h3>
                  </div>
                  <strong>{selectedCompanySlugs.length}/{companies.length}</strong>
                </div>
                <p>Seleziona le aziende da includere. Si salvano soltanto gli identificativi pubblici.</p>
                <div className={styles.miniActions}>
                  <button
                    type="button"
                    onClick={() => setSelectedCompanySlugs(allCompanySlugs)}
                    disabled={companies.length === 0 || selectedCompanySlugs.length === companies.length}
                  >
                    Seleziona tutte
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCompanySlugs([])}
                    disabled={selectedCompanySlugs.length === 0}
                  >
                    Azzera
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
                  <p className={styles.controlEmpty}>Nessuna azienda nel catalogo pubblico.</p>
                )}
              </section>

              <section className={styles.filters} aria-labelledby="filters-title">
                <div className={styles.controlHead}>
                  <div><ListFilter size={18} aria-hidden="true" /><h3 id="filters-title">Filtri</h3></div>
                  {filtersActive && (
                    <button type="button" onClick={resetFilters} aria-label="Reimposta tutti i filtri">
                      <RotateCcw size={15} aria-hidden="true" /> Reimposta
                    </button>
                  )}
                </div>
                <label className={styles.searchField}>
                  <span>Cerca nel radar</span>
                  <span className={styles.inputWrap}>
                    <Search size={17} aria-hidden="true" />
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value.slice(0, 160))}
                      placeholder="Azienda, policy o sintesi"
                    />
                  </span>
                </label>
                <label className={styles.selectField}>
                  <span>Tema</span>
                  <select value={theme} onChange={(event) => setTheme(event.target.value as 'all' | AssociationTheme)}>
                    <option value="all">Tutti i temi</option>
                    {themeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className={styles.selectField}>
                  <span>Segnale di attenzione</span>
                  <select
                    value={attention}
                    onChange={(event) => setAttention(event.target.value as 'all' | AssociationAttention)}
                  >
                    <option value="all">Tutti i segnali</option>
                    <option value="prioritaria">Prioritaria</option>
                    <option value="da-valutare">Da valutare</option>
                    <option value="monitoraggio">Monitoraggio</option>
                  </select>
                </label>
              </section>

              <p className={styles.storageNote} data-available={storageAvailable}>
                <LockKeyhole size={15} aria-hidden="true" />
                {storageAvailable
                  ? 'Nessun nome di associazione o dato personale viene salvato.'
                  : 'Archiviazione non disponibile: le scelte possono perdersi chiudendo la scheda.'}
              </p>
              <p className={styles.srOnly} role="status" aria-live="polite">{storageMessage}</p>
            </aside>

            <div className={styles.radarResults}>
              <div className={styles.resultsHead}>
                <div>
                  <p className={styles.kicker}>Registro filtrato</p>
                  <h3>{visibleItems.length} {visibleItems.length === 1 ? 'evidenza visibile' : 'evidenze visibili'}</h3>
                </div>
                <span>{selectedCompanySlugs.length} aziende nel perimetro</span>
              </div>

              {catalogUnavailable ? (
                <RadarEmptyState
                  icon={<AlertTriangle size={25} aria-hidden="true" />}
                  availability="temporaneamente non disponibile"
                  nextStep="riprova o consulta il metodo"
                  title="Catalogo temporaneamente non disponibile"
                  description="Non sostituiamo le evidenze mancanti con stime o contenuti non verificati. Riprova più tardi."
                  action={<Link href="/methodology/confidence">Consulta la metodologia <ArrowRight size={15} aria-hidden="true" /></Link>}
                />
              ) : items.length === 0 ? (
                <RadarEmptyState
                  icon={<FileSearch size={25} aria-hidden="true" />}
                  availability="raggiungibile, zero record pubblici"
                  nextStep="attendi il gate di pubblicazione"
                  title="Catalogo pubblico vuoto"
                  description="Il catalogo è disponibile, ma nessuna evidenza ha ancora superato i gate di pubblicazione."
                  action={<Link href="/what-changed">Come leggere i cambiamenti <ArrowRight size={15} aria-hidden="true" /></Link>}
                />
              ) : selectedCompanySlugs.length === 0 ? (
                <RadarEmptyState
                  icon={<Filter size={25} aria-hidden="true" />}
                  availability="record esclusi dalla watchlist"
                  nextStep="seleziona almeno un’azienda"
                  title="Watchlist senza aziende"
                  description="Seleziona almeno un’azienda per mostrare le relative evidenze pubbliche."
                  action={<button type="button" onClick={() => setSelectedCompanySlugs(allCompanySlugs)}>Seleziona tutte</button>}
                />
              ) : visibleItems.length === 0 ? (
                <RadarEmptyState
                  icon={<Search size={25} aria-hidden="true" />}
                  availability="record filtrati"
                  nextStep="amplia i criteri di ricerca"
                  title="Nessun risultato per questi filtri"
                  description="Il perimetro selezionato non contiene evidenze corrispondenti alla ricerca."
                  action={<button type="button" onClick={resetFilters}>Reimposta i filtri</button>}
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
                            <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
                            <span>{item.jurisdiction}</span>
                          </div>
                          <div className={styles.evidenceTitle}>
                            <div>
                              <h4>{item.company}</h4>
                              <p>{item.policyName}</p>
                            </div>
                            <code title={item.id}>{item.id}</code>
                          </div>
                          <div className={styles.themeList} aria-label="Temi dell’evidenza">
                            {item.themes.map((itemTheme) => (
                              <span key={itemTheme}>{ASSOCIATION_THEME_LABELS[itemTheme]}</span>
                            ))}
                          </div>
                          <p className={styles.evidenceSummary}>{item.summary}</p>

                          <details className={styles.reviewQuestions}>
                            <summary>Domande per la revisione civica</summary>
                            <div>
                              <ol>
                                {item.citizenQuestions.map((question) => <li key={question}>{question}</li>)}
                              </ol>
                              <p><Info size={15} aria-hidden="true" /> {item.sourceBoundary}</p>
                            </div>
                          </details>

                          <div className={styles.reviewBar}>
                            <label>
                              <span>Stato di revisione locale</span>
                              <select
                                value={currentReview}
                                onChange={(event) => setReviewState(item.id, event.target.value as AssociationReviewState)}
                              >
                                <option value="osservato">Osservato</option>
                                <option value="in-revisione">In revisione</option>
                                <option value="pronto-per-pubblicazione">Pronto per pubblicazione</option>
                              </select>
                            </label>
                            <small>
                              {currentReview === 'pronto-per-pubblicazione'
                                ? 'Stato del revisore locale: non pubblica né approva automaticamente.'
                                : 'Visibile soltanto in questo browser.'}
                            </small>
                          </div>

                          <nav className={styles.evidenceActions} aria-label={`Azioni per ${item.company}: ${item.policyName}`}>
                            <Link href={item.evidenceHref}>Apri Evidence Packet <ArrowRight size={15} aria-hidden="true" /></Link>
                            <Link href={item.changeHref}>Leggi il cambiamento in italiano <ArrowRight size={15} aria-hidden="true" /></Link>
                            <AddToCollectionButton changeId={item.id} compact lang="it" />
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
            <div className={styles.sectionLabel}><span>03</span><p>Dossier e digest</p></div>
            <h2 id="dossier-title">Porta il radar nel tuo processo editoriale</h2>
            <p>
              Il digest include solo le evidenze ora visibili e i relativi stati locali. Prima del riuso,
              apri le fonti e applica il processo di revisione della tua organizzazione.
            </p>
            <nav aria-label="Risorse per dossier e verifica">
              <Link href="/collections">Apri le raccolte di evidenze <FolderKanban size={16} aria-hidden="true" /></Link>
              <Link href="/what-changed">Come leggere un cambiamento <ArrowRight size={16} aria-hidden="true" /></Link>
            </nav>
          </div>

          <div className={styles.digestWorkbench}>
            <div className={styles.digestHead}>
              <div><ClipboardCopy size={20} aria-hidden="true" /><h3>Digest Markdown locale</h3></div>
              <strong>{visibleItems.length} incluse</strong>
            </div>
            <dl>
              <div><dt>Fonti verificate</dt><dd>{digestCounts.verified}</dd></div>
              <div><dt>In revisione</dt><dd>{digestCounts.reviewing}</dd></div>
              <div><dt>Pronte localmente</dt><dd>{digestCounts.ready}</dd></div>
            </dl>
            <p className={styles.digestBoundary}>
              <Info size={16} aria-hidden="true" /> È un artefatto di revisione generato nel browser: non è una pubblicazione,
              approvazione o presa di posizione di PolicyWatcher o di un’associazione.
            </p>
            <div className={styles.digestActions}>
              <button type="button" onClick={copyDigest} disabled={visibleItems.length === 0}>
                <ClipboardCopy size={16} aria-hidden="true" /> Copia Markdown
              </button>
              <button type="button" onClick={downloadDigest} disabled={visibleItems.length === 0}>
                <Download size={16} aria-hidden="true" /> Scarica .md
              </button>
            </div>
            <p className={styles.digestFeedback} role="status" aria-live="polite">{digestMessage}</p>
          </div>
        </section>

        <section id="pilot" className={styles.pilotSection} aria-labelledby="pilot-title">
          <div className={styles.sectionHeading}>
            <div>
              <div className={styles.sectionLabel}><span>04</span><p>Pilot di 60 giorni</p></div>
              <h2 id="pilot-title">Un perimetro piccolo, risultati verificabili</h2>
              <p>Quattro fasi per testare utilità, qualità delle fonti e riuso effettivo senza dichiarare partnership anticipate.</p>
            </div>
          </div>
          <ol className={styles.pilotTimeline}>
            {ASSOCIATION_PILOT_PLAN.map((phase, index) => (
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
            <p className={styles.kicker}>Confini prima delle conclusioni</p>
            <h2 id="final-boundary-title">Evidenze per decidere, non decisioni automatiche</h2>
          </div>
          <div>
            <p>{ASSOCIATION_VERTICAL_BOUNDARY}</p>
            <p>
              Watchlist e stati di revisione restano nel browser corrente. “Pronto per pubblicazione” descrive
              solo una scelta locale del revisore e non attiva alcuna pubblicazione.
            </p>
            <nav aria-label="Approfondimenti e contatto">
              <a className={styles.primaryAction} href="mailto:info@policywatcher.online?subject=Pilot%20PolicyWatcher%20Civico">
                Valuta un pilot <Mail size={16} aria-hidden="true" />
              </a>
              <Link href="/methodology/confidence">Metodologia delle fonti <ArrowRight size={16} aria-hidden="true" /></Link>
              <Link href="/collections">Evidence Collections <ArrowRight size={16} aria-hidden="true" /></Link>
            </nav>
          </div>
        </section>
      </div>
    </main>
  );
}
