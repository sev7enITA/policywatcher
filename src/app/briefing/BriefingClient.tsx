'use client';

import ShareComparison from './ShareComparison';
import { comparisonPath } from '../../../shared/comparisonLink';
import { clauseAudience } from '../../../shared/clauseAudience';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, CalendarDays, Check, FileText, Filter, LockKeyhole, RefreshCw, Save, Search, ShieldQuestion } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import Footer from '@/components/Footer';
import { citizenFreshness, parseCitizenFeed, type CitizenFeed, type CitizenLocale } from '../../../shared/citizen';
import {
  BRIEFING_MAX_REVIEWS, BRIEFING_STORAGE_KEY, BRIEFING_TOPICS, briefingCalendar, briefingMarkdown,
  buildBriefingRows, buildPolicyBriefing, emptyBriefing, mergeBriefingHistory, parseBriefingPreferences, validBriefingDate,
  type BriefingFilters, type BriefingReview, type BriefingRow, type BriefingTopic, type ReviewStatus,
} from '../../../shared/policyBriefing';
import styles from './briefing.module.css';

const copy = {
  en: {
    kicker: 'POLICYWATCHER / POLICY BRIEFING', title: 'Turn published changes\ninto a review plan.',
    lead: 'Focus on the services and topics you need to review. Keep the evidence, your next step and its source together.',
    privacy: 'Your review plan stays in this browser.', privacyBody: 'No account, shared assignments or automatic notifications. Selections, roles and dates are never sent to PolicyWatcher.',
    language: 'Page language', jumpResults: 'Go to matching changes', jumpExports: 'Go to downloads', filters: 'Choose your scope', service: 'Services', search: 'Find a service', searchPlaceholder: 'Search the public catalog',
    servicesHint: 'No selection includes every loaded service.', allServices: 'Use all services', noServices: 'No matching service in this catalog.',
    missing: 'Selected service absent from this catalog. Your selection is preserved.', selected: 'Selected services', remove: 'Remove selection',
    topics: 'Topics to look for', topicsHint: 'Text mentions in published summaries or excerpts. A mention is not a risk finding or a change in your rights.', allTopics: 'Use all topics',
    window: 'Publication window', days: 'days', allTime: 'All loaded dates', reset: 'Reset filters',
    results: 'Published changes to review', matching: 'matching changes', loaded: 'changes loaded', sources: 'sources to recheck',
    refresh: 'Refresh public evidence', loading: 'Loading public evidence…', refreshing: 'Refreshing…', unavailable: 'Public evidence could not be refreshed.',
    unavailableDetail: 'Previously loaded records are retained. Current source and completed-review status are unknown until a successful refresh.', retry: 'Try again',
    partial: 'This is a loaded window, not a complete history. Load older records to extend your search.', older: 'Load older records', olderBusy: 'Loading older records…',
    truncated: 'The public catalog is partial. A missing service does not establish that its policies are unchanged.',
    historyLimit: 'The 2,000-record session limit is reached. Narrow your review or start a new session.',
    noResults: 'No matches in the loaded window.', noResultsBody: 'This does not mean that nothing changed or that a service is safe. Broaden the filters, load older records or inspect the official source.',
    noFeed: 'Your briefing starts with public evidence.', noFeedBody: 'The catalog has not loaded. Your local selections and saved review plan remain on this device.',
    published: 'Published', sourceRetrieved: 'Source retrieved', noDate: 'unavailable', recent: 'Recent retrieval', dated: 'Recheck source', unknown: 'Current status unknown',
    summary: 'Published automatic summary', match: 'Why this appears', noMatch: 'No selected-topic text match identified in the loaded text.', excerpt: 'excerpt', summaryLocation: 'summary',
    before: 'Before', after: 'After', excerpts: 'Inspect the published excerpts', noExcerpts: 'No before/after excerpt is available in this record.',
    open: 'Open comparison', evidence: 'Evidence packet', source: 'Official source',
    task: 'Your local review', status: 'Review status', removeReview: 'Remove this local review', todo: 'To review', reviewing: 'In review', reviewed: 'Reviewed locally', reopened: 'Newer publication: review again',
    role: 'Responsible role (optional)', rolePlaceholder: 'For example: Privacy team', date: 'Review date (optional)',
    localHint: 'A role is your own annotation. The date is your reminder, not a legal deadline.',
    reviewLatest: 'Open the latest published comparison', reopenedHint: 'A newer publication exists for this policy. The earlier local review cannot complete the current review.',
    unknownHint: 'Fresh source evidence is unavailable. A saved completion cannot establish current review status.',
    capacity: 'The local plan contains 200 records. Export it before adding more review entries.', invalidDate: 'Choose a valid calendar date.',
    save: 'Save plan on this device', saved: 'Plan saved on this device.', saveHint: 'Changes stay in this tab until you save. Only selections and review annotations are saved; public policy text is excluded.',
    savingUnavailable: 'This browser could not save the plan. It remains in this tab; export it before closing.',
    corrupt: 'Saved data could not be read. The original has been preserved. Export it for recovery; saving over it is disabled.', recover: 'Download original saved data',
    exports: 'Take the evidence with you', exportHint: 'Download the filtered records, source dates, excerpts and coverage limits. Local review fields are excluded by default.',
    include: 'Include local roles, review states and reminder dates', includeHint: 'These are your annotations. Review the file before sharing it.',
    markdown: 'Download briefing .md', json: 'Download briefing .json', calendar: 'Download reminders .ics', calendarHint: 'Imports all-day reminders into a calendar you choose. Nothing is subscribed or sent automatically.',
    emptyCalendar: 'Add a review date and include local review fields to export reminders.', exported: 'File prepared on this device.',
    catalogTime: 'Public catalog retrieved', changesHint: 'Publication dates are not policy effective dates. Account and plan applicability must be checked at the source.',
    backCitizen: 'Your followed services', backCollections: 'Evidence collections', boundary: 'Review aid, not legal advice or a compliance determination.',
  },
  it: {
    kicker: 'POLICYWATCHER / BRIEFING POLICY', title: 'Dalle modifiche pubblicate\na un piano di revisione.',
    lead: 'Concentrati sui servizi e sui temi da verificare. Tieni insieme le evidenze, il prossimo passo e la fonte.',
    privacy: 'Il piano di revisione resta in questo browser.', privacyBody: 'Nessun account, assegnazione condivisa o notifica automatica. Selezioni, ruoli e date non vengono inviati a PolicyWatcher.',
    language: 'Lingua della pagina', jumpResults: 'Vai alle modifiche corrispondenti', jumpExports: 'Vai ai download', filters: 'Scegli il perimetro', service: 'Servizi', search: 'Trova un servizio', searchPlaceholder: 'Cerca nel catalogo pubblico',
    servicesHint: 'Senza selezione sono inclusi tutti i servizi caricati.', allServices: 'Usa tutti i servizi', noServices: 'Nessun servizio corrispondente nel catalogo.',
    missing: 'Servizio selezionato assente dal catalogo. La selezione è conservata.', selected: 'Servizi selezionati', remove: 'Rimuovi selezione',
    topics: 'Temi da cercare', topicsHint: 'Menzioni nei riassunti o negli estratti pubblicati. Una menzione non accerta un rischio o una modifica dei tuoi diritti.', allTopics: 'Usa tutti i temi',
    window: 'Finestra di pubblicazione', days: 'giorni', allTime: 'Tutte le date caricate', reset: 'Azzera i filtri',
    results: 'Modifiche pubblicate da rivedere', matching: 'modifiche corrispondenti', loaded: 'modifiche caricate', sources: 'fonti da ricontrollare',
    refresh: 'Aggiorna le evidenze pubbliche', loading: 'Caricamento delle evidenze pubbliche…', refreshing: 'Aggiornamento…', unavailable: 'Non è stato possibile aggiornare le evidenze pubbliche.',
    unavailableDetail: 'I record già caricati sono conservati. Lo stato attuale delle fonti e delle revisioni concluse resta sconosciuto fino a un aggiornamento riuscito.', retry: 'Riprova',
    partial: 'Questa è una finestra caricata, non lo storico completo. Carica i record precedenti per ampliare la ricerca.', older: 'Carica record precedenti', olderBusy: 'Caricamento dei record precedenti…',
    truncated: 'Il catalogo pubblico è parziale. Un servizio assente non dimostra che le sue policy siano rimaste invariate.',
    historyLimit: 'Raggiunto il limite di 2.000 record per sessione. Restringi la revisione o avvia una nuova sessione.',
    noResults: 'Nessuna corrispondenza nella finestra caricata.', noResultsBody: 'Non significa che nulla sia cambiato o che un servizio sia sicuro. Amplia i filtri, carica i record precedenti o consulta la fonte ufficiale.',
    noFeed: 'Il briefing parte dalle evidenze pubbliche.', noFeedBody: 'Il catalogo non è stato caricato. Le selezioni locali e il piano salvato restano sul dispositivo.',
    published: 'Pubblicato', sourceRetrieved: 'Fonte acquisita', noDate: 'non disponibile', recent: 'Acquisizione recente', dated: 'Fonte da ricontrollare', unknown: 'Stato attuale sconosciuto',
    summary: 'Sintesi automatica pubblicata', match: 'Perché compare', noMatch: 'Nessuna corrispondenza testuale con i temi selezionati nel testo caricato.', excerpt: 'estratto', summaryLocation: 'sintesi',
    before: 'Prima', after: 'Dopo', excerpts: 'Esamina gli estratti pubblicati', noExcerpts: 'Questo record non dispone di estratti prima/dopo.',
    open: 'Apri il confronto', evidence: 'Pacchetto evidenze', source: 'Fonte ufficiale',
    task: 'La tua revisione locale', status: 'Stato revisione', removeReview: 'Rimuovi questa revisione locale', todo: 'Da rivedere', reviewing: 'In revisione', reviewed: 'Rivisto localmente', reopened: 'Pubblicazione successiva: rivedere',
    role: 'Ruolo responsabile (facoltativo)', rolePlaceholder: 'Per esempio: Team privacy', date: 'Data di revisione (facoltativa)',
    localHint: 'Il ruolo è una tua annotazione. La data è un promemoria, non un termine legale.',
    reviewLatest: 'Apri il confronto pubblicato più recente', reopenedHint: 'Per questa policy esiste una pubblicazione successiva. La revisione locale precedente non conclude quella attuale.',
    unknownHint: 'Mancano evidenze recenti della fonte. Una revisione salvata come conclusa non accerta lo stato attuale.',
    capacity: 'Il piano locale contiene 200 record. Esportalo prima di aggiungere altre revisioni.', invalidDate: 'Scegli una data valida del calendario.',
    save: 'Salva il piano sul dispositivo', saved: 'Piano salvato su questo dispositivo.', saveHint: 'Le modifiche restano in questa scheda finché non salvi. Sono salvate solo selezioni e annotazioni di revisione; il testo delle policy è escluso.',
    savingUnavailable: 'Il browser non ha potuto salvare il piano. Resta in questa scheda: esportalo prima di chiuderla.',
    corrupt: 'I dati salvati non sono leggibili. L’originale è conservato. Esportalo per il recupero; la sovrascrittura è disabilitata.', recover: 'Scarica i dati originali salvati',
    exports: 'Porta con te le evidenze', exportHint: 'Scarica i record filtrati, le date delle fonti, gli estratti e i limiti di copertura. I campi di revisione locali sono esclusi per impostazione predefinita.',
    include: 'Includi ruoli locali, stati di revisione e date promemoria', includeHint: 'Sono tue annotazioni. Rivedi il file prima di condividerlo.',
    markdown: 'Scarica il briefing .md', json: 'Scarica il briefing .json', calendar: 'Scarica i promemoria .ics', calendarHint: 'Importa promemoria giornalieri in un calendario a tua scelta. Nessuna sottoscrizione o invio automatico.',
    emptyCalendar: 'Aggiungi una data di revisione e includi i campi locali per esportare i promemoria.', exported: 'File preparato sul dispositivo.',
    catalogTime: 'Catalogo pubblico acquisito', changesHint: 'Le date di pubblicazione non sono date di efficacia delle policy. Verifica sulla fonte l’applicabilità ad account e piano.',
    backCitizen: 'I servizi che segui', backCollections: 'Raccolte di evidenze', boundary: 'Strumento di revisione, non consulenza legale o valutazione di conformità.',
  },
};

function download(content: string, filename: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function BriefingClient({ locale }: { locale: CitizenLocale }) {
  const t = copy[locale];
  const [preferences, setPreferences] = useState(emptyBriefing);
  const [feed, setFeed] = useState<CitizenFeed | null>(null);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [failed, setFailed] = useState(false);
  const [clock, setClock] = useState<Date | null>(null);
  const [query, setQuery] = useState('');
  const [includeLocal, setIncludeLocal] = useState(false);
  const [message, setMessage] = useState('');
  const [localReady, setLocalReady] = useState(false);
  const [corruptRaw, setCorruptRaw] = useState<string | null>(null);
  const [storageFailed, setStorageFailed] = useState(false);
  const request = useRef<AbortController | null>(null);
  const feedRef = useRef<CitizenFeed | null>(null);
  const seenCursors = useRef(new Set<string>());

  const load = useCallback(async (older = false) => {
    const current = feedRef.current;
    const cursor = older ? current?.history.nextCursor : null;
    if (older && (!cursor || (current?.changes.length ?? 0) >= 2000)) return;
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    if (older) setLoadingOlder(true); else { setLoading(true); setLive(false); }
    setFailed(false);
    try {
      const params = new URLSearchParams();
      if (cursor) params.set('cursor', cursor);
      const response = await fetch(`/api/v1/citizen-feed${params.size ? `?${params}` : ''}`, { signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw new Error('Public feed unavailable');
      const next = parseCitizenFeed(await response.json());
      if (!next || (older && next.history.nextCursor && (seenCursors.current.has(next.history.nextCursor) || next.history.nextCursor === cursor))) throw new Error('Invalid public feed');
      let merged = next;
      if (older && current) {
        merged = mergeBriefingHistory(current, next);
        seenCursors.current.add(cursor!);
      }
      if (controller.signal.aborted) return;
      if (!older) seenCursors.current.clear();
      feedRef.current = merged; setFeed(merged); setClock(new Date()); setLive(true);
    } catch {
      if (!controller.signal.aborted) { setFailed(true); setLive(false); setClock(new Date()); }
    } finally {
      if (!controller.signal.aborted) { setLoading(false); setLoadingOlder(false); }
    }
  }, []);

  useEffect(() => {
    const start = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(BRIEFING_STORAGE_KEY);
        if (raw !== null) {
          const parsed = parseBriefingPreferences(raw);
          if (parsed) setPreferences(parsed); else setCorruptRaw(raw);
        }
      } catch { setStorageFailed(true); }
      setLocalReady(true);
      void load();
    }, 0);
    const timer = window.setInterval(() => setClock(new Date()), 60_000);
    return () => { window.clearTimeout(start); window.clearInterval(timer); request.current?.abort(); };
  }, [load]);

  const rows = useMemo(() => feed && clock ? buildBriefingRows(feed, preferences, locale, clock, live) : [], [feed, preferences, locale, clock, live]);
  const shownServices = (feed?.services ?? []).filter(service => service.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const missingIds = preferences.filters.serviceIds.filter(id => !feed?.services.some(s => s.id === id));
  const needsSourceCheck = new Set(rows.filter(row => row.freshness !== 'recent').map(row => row.policy.id)).size;
  const calendarCount = rows.filter(row => row.review?.dueDate && row.reviewState !== 'reviewed').length;
  const formatted = (value: string | null) => {
    if (!value || !Number.isFinite(Date.parse(value))) return t.noDate;
    return new Intl.DateTimeFormat(locale === 'it' ? 'it-IT' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
  };

  function filterUpdate(update: Partial<BriefingFilters>) {
    setPreferences(current => ({ ...current, filters: { ...current.filters, ...update } })); setMessage('');
  }
  function toggleService(id: string) {
    filterUpdate({ serviceIds: preferences.filters.serviceIds.includes(id) ? preferences.filters.serviceIds.filter(x => x !== id) : [...preferences.filters.serviceIds, id] });
  }
  function toggleTopic(topic: BriefingTopic) {
    filterUpdate({ topics: preferences.filters.topics.includes(topic) ? preferences.filters.topics.filter(x => x !== topic) : [...preferences.filters.topics, topic] });
  }
  function editReview(row: BriefingRow, update: Partial<Pick<BriefingReview, 'status' | 'role' | 'dueDate'>>) {
    if (update.dueDate && !validBriefingDate(update.dueDate)) { setMessage(t.invalidDate); return; }
    if (!preferences.reviews.some(review => review.changeId === row.change.id) && preferences.reviews.length >= BRIEFING_MAX_REVIEWS) { setMessage(t.capacity); return; }
    const editedAt = new Date();
    const normalizedUpdate = { ...update, ...(typeof update.role === 'string' ? { role: update.role.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 80) } : {}) };
    setClock(editedAt);
    setPreferences(current => {
      const previous = current.reviews.find(review => review.changeId === row.change.id);
      if (!previous && current.reviews.length >= BRIEFING_MAX_REVIEWS) return current;
      const review: BriefingReview = {
        changeId: row.change.id, policyId: row.policy.id,
        status: previous?.status ?? 'todo', role: previous?.role ?? '', dueDate: previous?.dueDate ?? '',
        ...normalizedUpdate, updatedAt: editedAt.toISOString(),
      };
      return { ...current, reviews: [...current.reviews.filter(item => item.changeId !== row.change.id), review] };
    });
    setMessage('');
  }
  function save() {
    if (corruptRaw !== null || !localReady) return;
    try { localStorage.setItem(BRIEFING_STORAGE_KEY, JSON.stringify(preferences)); setStorageFailed(false); setMessage(t.saved); }
    catch { setStorageFailed(true); setMessage(t.savingUnavailable); }
  }
  function exportBrief(format: 'markdown' | 'json' | 'calendar') {
    if (!feed) return;
    const brief = buildPolicyBriefing(feed, preferences, locale, includeLocal, new Date(), live);
    if (format === 'calendar' && (!includeLocal || !calendarCount)) return;
    const date = brief.generatedAt.slice(0, 10);
    if (format === 'json') download(JSON.stringify(brief, null, 2), `policywatcher-briefing-${date}.json`, 'application/json');
    else if (format === 'calendar') download(briefingCalendar(brief), `policywatcher-review-dates-${date}.ics`, 'text/calendar;charset=utf-8');
    else download(briefingMarkdown(brief), `policywatcher-briefing-${date}.md`, 'text/markdown;charset=utf-8');
    setMessage(t.exported);
  }

  return <>
    <PublicHeader current="briefing" lang={locale} lockLang />
    <main className={styles.page} lang={locale}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.heroMeta}><span>{t.kicker}</span><nav aria-label={t.language}><Link href="/briefing" hrefLang="en" aria-current={locale === 'en' ? 'page' : undefined}>EN</Link><Link href="/briefing?lang=it" hrefLang="it" aria-current={locale === 'it' ? 'page' : undefined}>IT</Link></nav></div>
          <div className={styles.heroGrid}><div><h1>{t.title.split('\n').map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h1><p className={styles.lead}>{t.lead}</p></div><aside className={styles.privacy}><LockKeyhole size={20} aria-hidden="true" /><strong>{t.privacy}</strong><p>{t.privacyBody}</p></aside></div>
          <nav className={styles.related} aria-label={locale === 'it' ? 'Percorsi collegati' : 'Related workflows'}><a href="#briefing-results-title">{t.jumpResults}<ArrowRight size={14} aria-hidden="true" /></a><a href="#briefing-exports-title">{t.jumpExports}<ArrowDownToLine size={14} aria-hidden="true" /></a><Link href={locale === 'it' ? '/per-te' : '/per-te?lang=en'}>{t.backCitizen}<ArrowRight size={14} aria-hidden="true" /></Link><Link href="/collections">{t.backCollections}<ArrowRight size={14} aria-hidden="true" /></Link></nav>
        </header>

        <div className={styles.statusBar} aria-live="polite" aria-atomic="true">
          <span>{loading && !feed ? t.loading : feed ? `${t.catalogTime}: ${formatted(feed.generatedAt)}` : t.noFeed}</span>
          <button type="button" onClick={() => void load()} disabled={loading || loadingOlder}><RefreshCw size={15} aria-hidden="true" />{loading && feed ? t.refreshing : t.refresh}</button>
        </div>
        {failed && <div className={styles.warning} role="alert"><ShieldQuestion size={20} aria-hidden="true" /><div><strong>{t.unavailable}</strong><p>{t.unavailableDetail}</p><button type="button" onClick={() => void load()} disabled={loading}>{t.retry}</button></div></div>}
        {corruptRaw !== null && <div className={styles.warning} role="alert"><div><p>{t.corrupt}</p><button type="button" onClick={() => download(corruptRaw, 'policywatcher-briefing-recovery.txt', 'text/plain;charset=utf-8')}>{t.recover}</button></div></div>}
        {storageFailed && <p className={styles.warning} role="status">{t.savingUnavailable}</p>}
        <p className={styles.actionMessage} role="status" aria-live="polite">{message}</p>

        <div className={styles.workbench}>
          <aside className={styles.filters} aria-labelledby="briefing-filters-title">
            <div className={styles.sectionTop}><Filter size={18} aria-hidden="true" /><h2 id="briefing-filters-title">{t.filters}</h2><span>01</span></div>
            <fieldset disabled={!localReady}><legend>{t.service}</legend><label className={styles.search}><Search size={16} aria-hidden="true" /><span className={styles.srOnly}>{t.search}</span><input type="search" value={query} placeholder={t.searchPlaceholder} onChange={event => setQuery(event.target.value)} /></label><p className={styles.hint}>{t.servicesHint}</p>
              <div className={styles.serviceList}>{shownServices.map(service => <label className={styles.checkRow} key={service.id}><input type="checkbox" checked={preferences.filters.serviceIds.includes(service.id)} onChange={() => toggleService(service.id)} /><span>{service.name}<small>{service.policies.length} {locale === 'it' ? 'documenti' : 'documents'}</small></span></label>)}{feed && !shownServices.length && <p className={styles.hint}>{t.noServices}</p>}</div>
              {missingIds.length > 0 && <div className={styles.missing}><strong>{t.selected}</strong>{missingIds.map(id => <div key={id}><p>{t.missing}</p><code>{id}</code><button type="button" onClick={() => toggleService(id)}>{t.remove}</button></div>)}</div>}
              {preferences.filters.serviceIds.length > 0 && <button type="button" className={styles.textButton} onClick={() => filterUpdate({ serviceIds: [] })}>{t.allServices}</button>}
            </fieldset>
            <fieldset disabled={!localReady}><legend>{t.topics}</legend><p className={styles.hint}>{t.topicsHint}</p>{(Object.keys(BRIEFING_TOPICS) as BriefingTopic[]).map(topic => <label className={styles.checkRow} key={topic}><input type="checkbox" checked={preferences.filters.topics.includes(topic)} onChange={() => toggleTopic(topic)} /><span>{BRIEFING_TOPICS[topic][locale]}</span></label>)}{preferences.filters.topics.length > 0 && <button type="button" className={styles.textButton} onClick={() => filterUpdate({ topics: [] })}>{t.allTopics}</button>}</fieldset>
            <label className={styles.windowLabel}>{t.window}<select disabled={!localReady} value={preferences.filters.days} onChange={event => filterUpdate({ days: Number(event.target.value) as BriefingFilters['days'] })}>{[7, 30, 90].map(days => <option key={days} value={days}>{days} {t.days}</option>)}<option value={0}>{t.allTime}</option></select></label>
            <button type="button" className={styles.textButton} disabled={!localReady} onClick={() => filterUpdate(emptyBriefing().filters)}>{t.reset}</button>
            <div className={styles.saveArea}><button type="button" className={styles.primary} onClick={save} disabled={!localReady || corruptRaw !== null}><Save size={16} aria-hidden="true" />{t.save}</button><p className={styles.hint}>{t.saveHint}</p><a className={styles.exportShortcut} href="#briefing-exports-title"><ArrowDownToLine size={15} aria-hidden="true" />{t.jumpExports}</a></div>
          </aside>

          <section className={styles.results} aria-labelledby="briefing-results-title" aria-busy={loading || loadingOlder}>
            <div className={styles.sectionTop}><h2 id="briefing-results-title">{t.results}</h2><span>02</span></div>
            <dl className={styles.metrics}><div><dt>{t.matching}</dt><dd>{rows.length}</dd></div><div><dt>{t.loaded}</dt><dd>{feed?.changes.length ?? t.noDate}</dd></div><div><dt>{t.sources}</dt><dd>{needsSourceCheck}</dd></div></dl>
            <p className={styles.hint}>{t.changesHint}</p>
            {feed?.catalogTruncated && <p className={styles.coverageWarning}>{t.truncated}</p>}
            {feed?.history.hasMore && <p className={styles.coverageWarning}>{t.partial}</p>}
            {!loading && !feed && <div className={styles.empty}><FileText size={28} aria-hidden="true" /><h3>{t.noFeed}</h3><p>{t.noFeedBody}</p></div>}
            {!loading && feed && rows.length === 0 && <div className={styles.empty}><Search size={28} aria-hidden="true" /><h3>{t.noResults}</h3><p>{t.noResultsBody}</p></div>}
            <div className={styles.records}>{rows.map((row, index) => {
              const canComplete = live && clock !== null && feed !== null && citizenFreshness(feed.generatedAt, clock) === 'recent' && row.freshness === 'recent' && row.policy.latestChange?.id === row.change.id;
              return <article className={styles.record} key={row.change.id} aria-labelledby={`briefing-${row.change.id}`}>
                <div className={styles.recordTop}><span className={styles.sequence}>{String(index + 1).padStart(2, '0')}</span><span>{row.service.name} · {row.policy.jurisdiction}</span><time dateTime={row.change.publishedAt}>{t.published} {formatted(row.change.publishedAt)}</time></div>
                <h3 id={`briefing-${row.change.id}`}>{row.policy.name}</h3><span className={styles.freshness} data-freshness={row.freshness}><span aria-hidden="true" />{row.freshness === 'recent' ? t.recent : row.freshness === 'dated' ? t.dated : t.unknown} · {t.sourceRetrieved}: {formatted(row.policy.lastRetrievedAt)}</span>
                <p className={styles.summaryLabel}>{t.summary}</p><p className={styles.summary}>{row.change.summary[locale]}</p>
                <div className={styles.match}><strong>{t.match}</strong>{row.matches.length ? <ul>{row.matches.map(match => <li key={match.topic}>{BRIEFING_TOPICS[match.topic][locale]} <code>“{match.term}”</code> <span>({match.location === 'excerpt' ? t.excerpt : t.summaryLocation})</span></li>)}</ul> : <p>{t.noMatch}</p>}</div>
                <details className={styles.excerpts}><summary>{t.excerpts}</summary>{row.change.evidence.length ? row.change.evidence.map((evidence, i) => <div className={styles.excerptPair} key={i}><div><strong>{t.before}</strong><blockquote>{evidence.before || t.noDate}</blockquote><p>{clauseAudience(evidence.clauseBefore ?? '', locale)}</p></div><div><strong>{t.after}</strong><blockquote>{evidence.after || t.noDate}</blockquote><p>{clauseAudience(evidence.clauseAfter ?? '', locale)}</p></div></div>) : <p>{t.noExcerpts}</p>}</details>
                <nav className={styles.recordLinks} aria-label={`${row.service.name}: ${locale === 'it' ? 'fonti' : 'sources'}`}><Link href={`${row.change.detailPath}?lang=${locale}`}>{t.open}<ArrowRight size={14} aria-hidden="true" /></Link><a href={row.change.evidencePath}>{t.evidence}</a><a href={row.policy.sourceUrl} target="_blank" rel="noopener noreferrer">{t.source}<span className={styles.srOnly}>{locale === 'it' ? ' (nuova scheda)' : ' (new tab)'}</span></a></nav>
                {row.change.comparison ? <ShareComparison path={comparisonPath(row.change.id, row.change.comparison, locale)} lang={locale}
                  review={row.review ? [t[row.reviewState], row.review.role, row.review.dueDate].filter(Boolean).join(' · ') : undefined} />
                  : <p className={styles.hint}>{locale === 'it' ? 'Il link al confronto richiede due versioni pubbliche.' : 'Sharing a comparison requires two public versions.'}</p>}
                <fieldset className={styles.review}><legend>{t.task}</legend><div className={styles.reviewFields}><label>{t.status}<select aria-label={t.status} value={row.reviewState} onChange={event => editReview(row, { status: event.target.value as ReviewStatus })}>{row.reviewState === 'unknown' && <option value="unknown" disabled>{t.unknown}</option>}{row.reviewState === 'reopened' && <option value="reopened" disabled>{t.reopened}</option>}<option value="todo">{t.todo}</option><option value="reviewing">{t.reviewing}</option><option value="reviewed" disabled={!canComplete}>{t.reviewed}</option></select></label><label>{t.role}<input type="text" maxLength={80} value={row.review?.role ?? ''} placeholder={t.rolePlaceholder} onChange={event => editReview(row, { role: event.target.value })} autoComplete="off" /></label><label>{t.date}<input type="date" value={row.review?.dueDate ?? ''} onChange={event => editReview(row, { dueDate: event.target.value })} /></label></div><p className={styles.hint}>{t.localHint}</p>{row.review && <button type="button" className={styles.textButton} onClick={() => { setPreferences(current => ({ ...current, reviews: current.reviews.filter(r => r.changeId !== row.change.id) })); setMessage(''); }}>{t.removeReview}</button>}{row.reviewState === 'reopened' && <p className={styles.reviewWarning}><RefreshCw size={14} aria-hidden="true" /><strong>{t.reopened}</strong> {t.reopenedHint} {row.policy.latestChange && <Link href={`/change/${encodeURIComponent(row.policy.latestChange.id)}?lang=${locale}`}>{t.reviewLatest}</Link>}</p>}{row.reviewState === 'unknown' && <p className={styles.reviewWarning}><ShieldQuestion size={16} aria-hidden="true" />{t.unknownHint}</p>}{row.reviewState === 'reviewed' && <p className={styles.reviewed}><Check size={15} aria-hidden="true" />{t.reviewed}</p>}</fieldset>
              </article>;
            })}</div>
            {feed?.history.hasMore && <div className={styles.history}><p>{feed.changes.length >= 2000 ? t.historyLimit : t.partial}</p><button type="button" onClick={() => void load(true)} disabled={!live || loading || loadingOlder || feed.changes.length >= 2000}>{loadingOlder ? t.olderBusy : t.older}<ArrowDownToLine size={16} aria-hidden="true" /></button></div>}
          </section>
        </div>

        <section className={styles.exports} aria-labelledby="briefing-exports-title"><div><p className={styles.kicker}>03 / {locale === 'it' ? 'ESPORTA' : 'EXPORT'}</p><h2 id="briefing-exports-title">{t.exports}</h2><p>{t.exportHint}</p></div><div className={styles.exportActions}><label className={styles.checkRow}><input type="checkbox" checked={includeLocal} onChange={event => setIncludeLocal(event.target.checked)} /><span>{t.include}<small>{t.includeHint}</small></span></label><div className={styles.downloadButtons}><button type="button" onClick={() => exportBrief('markdown')} disabled={!feed}><FileText size={16} aria-hidden="true" />{t.markdown}</button><button type="button" onClick={() => exportBrief('json')} disabled={!feed}><ArrowDownToLine size={16} aria-hidden="true" />{t.json}</button><button type="button" onClick={() => exportBrief('calendar')} disabled={!feed || !includeLocal || calendarCount === 0}><CalendarDays size={16} aria-hidden="true" />{t.calendar}</button></div><p className={styles.hint}>{includeLocal && calendarCount ? t.calendarHint : t.emptyCalendar}</p></div></section>
        <p className={styles.boundary}>{t.boundary}</p>
      </div>
    </main><Footer lang={locale} />
  </>;
}
