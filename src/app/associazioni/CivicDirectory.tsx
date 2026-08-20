'use client';

import {
  ArrowUpRight,
  CheckCircle2,
  Globe2,
  MailPlus,
  MessageSquareWarning,
  Search,
  Send,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useGlobalContext } from '@/components/GlobalContextControl';
import {
  GLOBAL_COUNTRIES,
  GLOBAL_REGION_LABELS,
  type GlobalCountryCode,
  type GlobalRegion,
} from '@/lib/globalContext';
import {
  CIVIC_DIRECTORY_REVIEWED_AT,
  CIVIC_DIRECTORY_STATS,
  CIVIC_ORGANIZATIONS,
  CIVIC_TYPE_LABELS,
  CIVIC_VERIFICATION_LABELS,
  buildCivicDirectorySearch,
  buildCivicCorrectionMailto,
  buildCivicSuggestionMailto,
  countryLabel,
  matchesCivicDirectory,
  parseCivicDirectoryQuery,
  sortCivicOrganizations,
  type CivicOrganizationType,
  type CivicTerritory,
} from '@/lib/civicOrganizations';
import type { AssociationLanguage } from '@/lib/associationVertical';
import styles from './CivicDirectory.module.css';

const PAGE_SIZE = 12;
const typeOptions = Object.keys(CIVIC_TYPE_LABELS) as CivicOrganizationType[];
const regionOptions: Exclude<GlobalRegion, 'global'>[] = [
  'europe', 'north-america', 'latin-america', 'asia-pacific', 'africa',
];

function territoryFromContext(country: GlobalCountryCode, region: GlobalRegion): CivicTerritory {
  if (country !== 'all') return country;
  return region;
}

export default function CivicDirectory({ lang }: { lang: AssociationLanguage }) {
  const { context, ready } = useGlobalContext(lang, lang);
  const [territory, setTerritory] = useState<CivicTerritory>('global');
  const [type, setType] = useState<'all' | CivicOrganizationType>('all');
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [routeReady, setRouteReady] = useState(false);
  const initializedContextKey = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    const contextKey = `${context.country}:${context.region}`;
    const isInitialContext = initializedContextKey.current === null;
    const contextChanged = initializedContextKey.current !== contextKey;
    initializedContextKey.current = contextKey;

    const timer = window.setTimeout(() => {
      if (isInitialContext) {
        const route = parseCivicDirectoryQuery(window.location.search);
        setTerritory(route.territory ?? territoryFromContext(context.country, context.region));
        setType(route.type ?? 'all');
        setQuery(route.query);
        setRouteReady(true);
      } else if (contextChanged) {
        setTerritory(territoryFromContext(context.country, context.region));
      }
      setShowAll(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [context.country, context.region, ready]);

  useEffect(() => {
    if (!routeReady) return;
    const nextSearch = buildCivicDirectorySearch({ territory, type, query }, window.location.search);
    const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl !== currentUrl) window.history.replaceState(window.history.state, '', nextUrl);
  }, [query, routeReady, territory, type]);

  const copy = lang === 'it' ? {
    eyebrow: 'Directory civico globale · fonti verificabili',
    title: 'Trova chi tutela i consumatori, paese per paese.',
    lead: 'Un registro iniziale di associazioni generaliste e realtà specializzate in diritti digitali, privacy, finanza, comunicazioni, minori e servizi essenziali.',
    boundary: 'La presenza indica solo che abbiamo trovato una fonte pubblica verificabile. Non implica partnership, endorsement o una valutazione della qualità dei servizi.',
    organizations: 'organizzazioni',
    countries: 'paesi',
    digital: 'specialisti digitali',
    sources: 'fonti uniche',
    territory: 'Paese o area',
    type: 'Tipo di tutela',
    allTypes: 'Tutte le tipologie',
    search: 'Cerca nome o specializzazione',
    searchPlaceholder: 'es. privacy, finanza, OCU…',
    global: 'Elenco completo',
    globalNetworks: 'Solo reti globali',
    context: 'Usa il contesto globale',
    local: 'Nazionale',
    regional: 'Rete regionale',
    network: 'Rete globale',
    source: 'Apri fonte',
    website: 'Link organizzazione',
    reviewed: 'Rivisto',
    noResults: 'Nessuna organizzazione corrisponde a questi filtri.',
    reset: 'Azzera filtri',
    share: 'Copia vista',
    shared: 'Link alla vista copiato.',
    shareError: 'Copia non disponibile in questo browser.',
    suggest: 'Segnala un’associazione',
    correct: 'Segnala correzione',
    showMore: 'Mostra tutto il risultato',
    showLess: 'Mostra meno',
    suggestionEyebrow: 'Registro aperto, inclusione controllata',
    suggestionTitle: 'Segnala o correggi un’organizzazione',
    suggestionLead: 'Le associazioni possono proporre direttamente la propria scheda. La segnalazione apre una bozza email; nessun dato viene inviato o pubblicato automaticamente. Per correggere una scheda già presente usa “Segnala correzione” sulla relativa card.',
    name: 'Nome organizzazione',
    country: 'Paese / area',
    websiteLabel: 'Sito ufficiale HTTPS',
    sourceLabel: 'Registro o rete indipendente HTTPS',
    focus: 'Focus digitale o motivo della segnalazione',
    submittedBy: 'Chi invia la segnalazione',
    representative: 'Rappresento questa organizzazione',
    community: 'Utente / ricercatore / altra parte',
    optional: 'Facoltativo',
    send: 'Prepara segnalazione',
    invalid: 'Completa i campi obbligatori con URL HTTPS validi.',
    mailReady: 'Bozza email preparata. Nessun dato è stato inviato automaticamente.',
  } : {
    eyebrow: 'Global civic directory · verifiable sources',
    title: 'Find consumer advocates, country by country.',
    lead: 'A starter registry of general consumer organizations and specialists in digital rights, privacy, finance, communications, children and essential services.',
    boundary: 'Inclusion only means that a verifiable public source was found. It does not imply partnership, endorsement or an assessment of service quality.',
    organizations: 'organizations',
    countries: 'countries',
    digital: 'digital specialists',
    sources: 'unique sources',
    territory: 'Country or region',
    type: 'Protection type',
    allTypes: 'All types',
    search: 'Search name or specialization',
    searchPlaceholder: 'e.g. privacy, finance, OCU…',
    global: 'Full directory',
    globalNetworks: 'Global networks only',
    context: 'Use global context',
    local: 'National',
    regional: 'Regional network',
    network: 'Global network',
    source: 'Open source',
    website: 'Organization link',
    reviewed: 'Reviewed',
    noResults: 'No organization matches these filters.',
    reset: 'Reset filters',
    share: 'Copy view',
    shared: 'View link copied.',
    shareError: 'Copy is not available in this browser.',
    suggest: 'Suggest an organization',
    correct: 'Report a correction',
    showMore: 'Show the full result',
    showLess: 'Show less',
    suggestionEyebrow: 'Open registry, controlled inclusion',
    suggestionTitle: 'Submit or correct an organization',
    suggestionLead: 'Organizations may submit their own listing. The form opens an email draft; no data is sent or published automatically. To correct an existing listing, use “Report a correction” on its card.',
    name: 'Organization name',
    country: 'Country / area',
    websiteLabel: 'Official HTTPS website',
    sourceLabel: 'Independent registry or network HTTPS',
    focus: 'Digital focus or reason for suggesting',
    submittedBy: 'Who is submitting',
    representative: 'I represent this organization',
    community: 'User / researcher / other party',
    optional: 'Optional',
    send: 'Prepare suggestion',
    invalid: 'Complete the required fields with valid HTTPS URLs.',
    mailReady: 'Email draft prepared. No data was sent automatically.',
  };

  const availableCountries = useMemo(() => {
    const codes = new Set(CIVIC_ORGANIZATIONS
      .filter((organization) => organization.country !== 'all')
      .map((organization) => organization.country));
    return GLOBAL_COUNTRIES.filter((country) => codes.has(country.code));
  }, []);

  const filtered = useMemo(() => sortCivicOrganizations(
    CIVIC_ORGANIZATIONS.filter((organization) => matchesCivicDirectory(organization, { territory, type, query })),
    territory,
  ), [query, territory, type]);
  const visible = showAll ? filtered : filtered.slice(0, PAGE_SIZE);

  const defaultTerritory = territoryFromContext(context.country, context.region);
  const directoryFiltersActive = territory !== defaultTerritory || type !== 'all' || query.trim().length > 0;

  function resetFilters() {
    setTerritory(defaultTerritory);
    setType('all');
    setQuery('');
    setShowAll(false);
  }

  async function copyDirectoryLink() {
    const url = new URL(window.location.href);
    url.hash = 'organizzazioni';
    try {
      await window.navigator.clipboard.writeText(url.toString());
      setShareMessage(copy.shared);
    } catch {
      setShareMessage(copy.shareError);
    }
  }

  function submitSuggestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const mailto = buildCivicSuggestionMailto({
      name: String(form.get('name') ?? ''),
      country: String(form.get('country') ?? ''),
      website: String(form.get('website') ?? ''),
      sourceUrl: String(form.get('sourceUrl') ?? ''),
      focus: String(form.get('focus') ?? ''),
      submittedBy: String(form.get('submittedBy') ?? ''),
    });
    if (!mailto) {
      setFormMessage(copy.invalid);
      return;
    }
    setFormMessage(copy.mailReady);
    window.location.href = mailto;
  }

  return (
    <section id="organizzazioni" className={styles.directory} aria-labelledby="directory-title">
      <header className={styles.intro}>
        <div>
          <p className={styles.eyebrow}><Globe2 size={15} aria-hidden="true" /> {copy.eyebrow}</p>
          <h2 id="directory-title">{copy.title}</h2>
          <p className={styles.lead}>{copy.lead}</p>
          <a className={styles.suggestionJump} href="#segnala-associazione">
            <MailPlus size={15} aria-hidden="true" /> {copy.suggest}
          </a>
        </div>
        <aside><ShieldCheck size={19} aria-hidden="true" /><p>{copy.boundary}</p></aside>
      </header>

      <dl className={styles.stats} aria-label={lang === 'it' ? 'Copertura del directory' : 'Directory coverage'}>
        <div><dt>{copy.organizations}</dt><dd>{CIVIC_DIRECTORY_STATS.organizations}</dd></div>
        <div><dt>{copy.countries}</dt><dd>{CIVIC_DIRECTORY_STATS.countries}</dd></div>
        <div><dt>{copy.digital}</dt><dd>{CIVIC_DIRECTORY_STATS.digitalSpecialists}</dd></div>
        <div><dt>{copy.sources}</dt><dd>{CIVIC_DIRECTORY_STATS.verificationSources}</dd></div>
      </dl>

      <div className={styles.filterPanel}>
        <div className={styles.filterHeading}>
          <SlidersHorizontal size={18} aria-hidden="true" />
          <div>
            <strong>{copy.context}</strong>
            <span>{context.country !== 'all' ? context.country.toUpperCase() : GLOBAL_REGION_LABELS[context.region][lang]}</span>
          </div>
        </div>
        <label>
          <span>{copy.territory}</span>
          <select data-testid="civic-territory-filter" value={territory} onChange={(event) => { setTerritory(event.target.value as CivicTerritory); setShowAll(false); }}>
            <option value="global">{copy.global}</option>
            <option value="all">{copy.globalNetworks}</option>
            <optgroup label={lang === 'it' ? 'Aree' : 'Regions'}>
              {regionOptions.map((region) => <option key={region} value={region}>{GLOBAL_REGION_LABELS[region][lang]}</option>)}
            </optgroup>
            <optgroup label={lang === 'it' ? 'Paesi' : 'Countries'}>
              {availableCountries.map((country) => <option key={country.code} value={country.code}>{country.nativeLabel === country.label ? country.label : `${country.label} · ${country.nativeLabel}`}</option>)}
            </optgroup>
          </select>
        </label>
        <label>
          <span>{copy.type}</span>
          <select data-testid="civic-type-filter" value={type} onChange={(event) => { setType(event.target.value as 'all' | CivicOrganizationType); setShowAll(false); }}>
            <option value="all">{copy.allTypes}</option>
            {typeOptions.map((value) => <option key={value} value={value}>{CIVIC_TYPE_LABELS[value][lang]}</option>)}
          </select>
        </label>
        <label className={styles.searchField}>
          <span>{copy.search}</span>
          <div><Search size={16} aria-hidden="true" /><input data-testid="civic-directory-search" value={query} onChange={(event) => { setQuery(event.target.value); setShowAll(false); }} placeholder={copy.searchPlaceholder} maxLength={120} /></div>
        </label>
      </div>

      <div className={styles.resultBar}>
        <span role="status" aria-live="polite"><UsersRound size={16} aria-hidden="true" /> {filtered.length} {copy.organizations}</span>
        <div className={styles.resultActions}>
          <button type="button" onClick={resetFilters} disabled={!directoryFiltersActive}>{copy.reset}</button>
          <button type="button" onClick={copyDirectoryLink}><Share2 size={14} aria-hidden="true" /> {copy.share}</button>
        </div>
      </div>
      <p className={styles.shareMessage} role="status" aria-live="polite">{shareMessage}</p>

      {visible.length > 0 ? (
        <div className={styles.grid}>
          {visible.map((organization) => (
            <article key={organization.id} className={styles.card}>
              <header>
                <span>{organization.country === 'all' ? 'INT' : organization.country.toUpperCase()}</span>
                <small>{organization.scope === 'global' ? copy.network : organization.scope === 'regional' ? copy.regional : copy.local}</small>
              </header>
              <div className={styles.cardBody}>
                <p>{countryLabel(organization.country, lang)}</p>
                <h3>{organization.name}</h3>
                <div className={styles.tags}>
                  {organization.types.map((value) => <span key={value}>{CIVIC_TYPE_LABELS[value][lang]}</span>)}
                </div>
              </div>
              <footer>
                <div className={styles.verified}>
                  <CheckCircle2 size={15} aria-hidden="true" />
                  <span>{CIVIC_VERIFICATION_LABELS[organization.verificationKind][lang]}<small>{copy.reviewed} {organization.reviewedAt}</small></span>
                </div>
                <div className={styles.links}>
                  <a href={organization.sourceUrl} target="_blank" rel="noreferrer">{copy.source} <ArrowUpRight size={14} aria-hidden="true" /></a>
                  <a href={organization.website} target="_blank" rel="noreferrer">{copy.website} <ArrowUpRight size={14} aria-hidden="true" /></a>
                  <a
                    className={styles.correctionLink}
                    href={buildCivicCorrectionMailto({
                      organizationId: organization.id,
                      name: organization.name,
                      website: organization.website,
                      sourceUrl: organization.sourceUrl,
                    }) ?? '#segnala-associazione'}
                  >
                    <MessageSquareWarning size={14} aria-hidden="true" /> {copy.correct}
                  </a>
                </div>
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.empty}><Search size={22} aria-hidden="true" /><p>{copy.noResults}</p><button type="button" onClick={resetFilters}>{copy.reset}</button></div>
      )}

      {filtered.length > PAGE_SIZE && (
        <button type="button" className={styles.more} onClick={() => setShowAll((current) => !current)}>
          {showAll ? copy.showLess : `${copy.showMore} · ${filtered.length}`}
        </button>
      )}

      <section id="segnala-associazione" className={styles.suggestion} aria-labelledby="suggestion-title">
        <div className={styles.suggestionCopy}>
          <p><MailPlus size={16} aria-hidden="true" /> {copy.suggestionEyebrow}</p>
          <h3 id="suggestion-title">{copy.suggestionTitle}</h3>
          <span>{copy.suggestionLead}</span>
        </div>
        <form onSubmit={submitSuggestion} noValidate>
          <label><span>{copy.name}</span><input name="name" required maxLength={140} /></label>
          <label><span>{copy.country}</span><input name="country" required maxLength={80} /></label>
          <label><span>{copy.websiteLabel}</span><input name="website" type="url" inputMode="url" required placeholder="https://" maxLength={500} /></label>
          <label><span>{copy.sourceLabel}</span><input name="sourceUrl" type="url" inputMode="url" required placeholder="https://" maxLength={500} /></label>
          <label className={styles.roleField}><span>{copy.submittedBy}</span><select name="submittedBy" defaultValue="organization representative"><option value="organization representative">{copy.representative}</option><option value="community user / other party">{copy.community}</option></select></label>
          <label className={styles.focusField}><span>{copy.focus} <small>{copy.optional}</small></span><textarea name="focus" rows={3} maxLength={600} /></label>
          <button type="submit">{copy.send} <Send size={15} aria-hidden="true" /></button>
          {formMessage && <p className={styles.formMessage} role="status">{formMessage}</p>}
        </form>
      </section>

      <p className={styles.researchNote}>
        {lang === 'it'
          ? `Snapshot di ricerca: ${CIVIC_DIRECTORY_REVIEWED_AT}. Il registro non è esaustivo; le appartenenze e gli status possono cambiare e vengono ricontrollati prima degli aggiornamenti.`
          : `Research snapshot: ${CIVIC_DIRECTORY_REVIEWED_AT}. The registry is not exhaustive; memberships and statuses can change and are rechecked before updates.`}
      </p>
    </section>
  );
}
