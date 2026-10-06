'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowRight, Bookmark, Check, Download, ExternalLink, FileText, Headphones, LockKeyhole, Plus, RefreshCw, Search, Smartphone, Square, Trash2 } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import Footer from '@/components/Footer';
import { useGlobalContext } from '@/components/GlobalContextControl';
import { GLOBAL_COUNTRIES, type GlobalCountryCode } from '@/lib/globalContext';
import {
  CITIZEN_STORAGE_KEY, CITIZEN_MAX_CHOICES, CITIZEN_MAX_SAVED, CITIZEN_MAX_SERVICES,
  emptyCitizenPreferences, parseCitizenPreferences, parseCitizenFeed, citizenFreshness,
  evaluateCitizenChoice, matchCitizenNotice, buildCitizenDossier, citizenSafeUrl,
  type CitizenChange, type CitizenChoice, type CitizenChoiceStatus, type CitizenFeed,
  type CitizenLocale, type CitizenPolicy, type CitizenPreferences, type CitizenService,
} from '../../../shared/citizen';
import { citizenGuidesForService, citizenGuideFreshness } from '../../../shared/citizenGuides';
import styles from './citizen.module.css';

const words = {
  it: {
    eyebrow: 'POLICYWATCHER · PER TE', title: 'I tuoi servizi.\nLe tue scelte.',
    lead: 'Le regole dei servizi digitali cambiano. Qui puoi seguirle, capire cosa è stato pubblicato e decidere cosa fare.',
    start: 'Scegli i tuoi servizi', noticeShortcut: 'Hai ricevuto una comunicazione?', privateTitle: 'Il tuo spazio, sul tuo dispositivo',
    privateBody: 'Nessun account richiesto. Servizi seguiti e scelte restano in questo browser. Puoi esportarli o cancellarli quando vuoi.',
    sections: ['I miei servizi', 'Cosa cambia per me', 'Cosa posso fare', 'Le mie scelte', 'Spiegami questa comunicazione', 'Chiedi supporto'],
    local: 'Salvato sul dispositivo', session: 'Solo per questa sessione', loading: 'Caricamento delle fonti pubbliche…', refresh: 'Aggiorna le fonti',
    unavailable: 'Fonti non raggiungibili. Le informazioni già aperte restano consultabili, ma lo stato attuale è da verificare.',
    retry: 'Riprova', storageError: 'Il browser non consente il salvataggio. Le scelte restano aperte in questa scheda: esportale prima di chiuderla.',
    corrupt: 'Le preferenze salvate non sono leggibili. Non le abbiamo sostituite. Esporta il file originale o azzera questo spazio per ricominciare.',
    recover: 'Esporta il file originale', reset: 'Cancella i dati di questo spazio', resetConfirm: 'Conferma cancellazione', cancel: 'Annulla',
    servicesLead: 'Scegli i servizi che usi. La selezione è volontaria e non viene inviata al server.', search: 'Cerca un servizio', searchPlaceholder: 'Nome del servizio, per esempio Google',
    following: 'I servizi che segui', noneFollowed: 'Il tuo spazio è pronto. Scegli il primo servizio per trovare i suoi aggiornamenti pubblicati.',
    catalog: 'Catalogo delle fonti pubbliche', follow: 'Segui', unfollow: 'Smetti di seguire', followed: 'Seguito', noSearch: 'Nessun servizio corrisponde alla ricerca.',
    plan: 'Il tuo piano (facoltativo)', planHint: 'Per esempio: gratuito o aziendale. È un tuo promemoria: non conferma a quale piano si applica una modifica.',
    country: 'Il tuo paese (facoltativo)', allCountries: 'Non specificato', countryHint: 'Aggiunge contesto anche alle altre pagine. Non nasconde documenti con ambito geografico incerto.',
    missing: 'Fonte ora non disponibile', missingHelp: 'La tua selezione è conservata. L’assenza dal catalogo non conferma che il servizio abbia smesso di cambiare.',
    changesLead: 'Le modifiche pubblicate per i servizi che hai scelto. Le sintesi automatiche aiutano a orientarti: apri la fonte per verificarle.',
    allChanges: 'Tutti gli aggiornamenti', savedOnly: 'Solo salvati', noChanges: 'Nessuna modifica per questi servizi nella finestra caricata. Questo non significa che nulla sia cambiato.',
    pickFirst: 'Scegli almeno un servizio per personalizzare questa pagina.', published: 'Pubblicato', detected: 'Rilevato', retrieved: 'Fonte acquisita', source: 'Apri la fonte ufficiale',
    recent: 'Fonte acquisita di recente', dated: 'Fonte da ricontrollare', unknown: 'Acquisizione non disponibile', offline: 'Stato attuale da verificare',
    substantive: 'Modifica del contenuto', editorial: 'Modifica di forma', unchanged: 'Nessuna modifica rilevata nel confronto', needs_review: 'Confronto da rivedere',
    automatic: 'Sintesi automatica', applicability: 'Da verificare sul tuo account e sul tuo piano.', compare: 'Leggi il confronto e le fonti', evidence: 'Apri le evidenze',
    excerpts: 'Passaggi collegati alla modifica', before: 'Prima', after: 'Dopo', save: 'Salva', unsave: 'Rimuovi dai salvati', read: 'Ascolta', stop: 'Ferma audio',
    audioUnavailable: 'Lettura vocale non disponibile in questo browser.', audioError: 'La lettura vocale non è disponibile al momento.',
    more: 'Carica modifiche precedenti', history: 'Lo storico è limitato ai record pubblici disponibili e può richiedere un aggiornamento. Le date di pubblicazione non sono date di entrata in vigore.',
    reveal: 'Mostra altre 3 modifiche caricate', fewer: 'Torna alle 3 più recenti', loadedCount: (shown: number, total: number) => `Mostrate ${shown} di ${total} modifiche caricate`, nextSteps: 'Passa al prossimo passo',
    catalogLimit: 'Il catalogo restituito è parziale. Le selezioni mancanti restano conservate.',
    actionsLead: 'Parti dalle istruzioni del servizio. Ogni guida indica ambito, data di lettura della fonte e limiti.', chooseGuide: 'Servizio per cui cercare una guida',
    noGuides: 'Per questo servizio non abbiamo ancora una guida curata. Puoi leggere la policy ufficiale e preparare una richiesta di chiarimento.',
    noGuideService: 'Segui un servizio per vedere le guide pertinenti.', guideSource: 'Apri le istruzioni ufficiali', guideRead: 'Fonte consultata il', guideDue: 'Guida da ricontrollare: verifica i passaggi sulla fonte ufficiale.',
    guidance: 'La guida descrive opzioni generali del servizio. Non è una conseguenza accertata della singola modifica.',
    choicesLead: 'Annota quello che hai letto o fatto. Una nuova pubblicazione sullo stesso documento riapre la revisione.',
    choiceNone: 'Non hai ancora annotato una scelta. Puoi farlo da un aggiornamento qui sopra.', reviewed: 'Ho letto', action_recorded: 'Ho eseguito un’azione', remind_me: 'Da rivedere',
    record: 'Annota la tua scelta', guideUsed: 'Guida usata (facoltativa)', noGuideUsed: 'Nessuna guida indicata', recorded: 'Annotazione conservata', revisit: 'Da rivedere',
    choiceUnknown: 'Stato da verificare', declaration: 'È una tua dichiarazione. PolicyWatcher non verifica l’effetto sul servizio.', savedAt: 'Annotata il', removeChoice: 'Elimina annotazione',
    checkUpdate: 'Rivedi gli aggiornamenti', export: 'Esporta le mie scelte', exportHint: 'Il file contiene servizi, piano e annotazioni che hai scelto di salvare. Il testo incollato non è incluso.',
    noticeLead: 'Incolla il testo o il link che hai ricevuto. Cerchiamo corrispondenze nel catalogo già scaricato, solo su questo dispositivo.',
    noticeLabel: 'Testo o link della comunicazione', noticePlaceholder: 'Incolla qui la comunicazione…', match: 'Cerca riscontri locali', clear: 'Svuota',
    noticePrivacy: 'Il testo non viene inviato, registrato o salvato. I link incollati non vengono aperti.', noticeLimit: 'Massimo 20 KiB di testo.', noticeTooLarge: 'Il testo supera 20 KiB. Riducilo prima della ricerca.',
    noticeEmpty: 'Inserisci un testo o un link.', noticeNoMatch: 'Nessuna corrispondenza nel catalogo caricato. Non è una verifica dell’autenticità della comunicazione.',
    candidates: 'Possibili servizi citati', candidateBoundary: 'Una corrispondenza di nome o dominio non autentica il mittente e non conferma il contenuto del messaggio.',
    candidateNoChanges: 'Nessun confronto per questo servizio nella finestra caricata.', viewPublic: 'Vedi i record pubblici',
    supportLead: 'Prepara una bozza con la fonte, la tua annotazione e la domanda da rivolgere a un’associazione. Rivedila prima di condividerla.',
    supportChoice: 'Modifica o annotazione da includere', supportEmpty: 'Scegli un servizio e una modifica pubblicata da includere nella bozza. Puoi farlo senza annotare una scelta e senza copiare la comunicazione privata.',
    question: 'La tua domanda (facoltativa)', questionHint: 'Questo testo entra solo nella bozza scaricata. Evita dati personali non necessari.',
    preview: 'Anteprima della bozza', download: 'Scarica la bozza .txt', directory: 'Trova un’associazione', notSent: 'Nessun invio automatico. La directory non implica una collaborazione con le associazioni.',
    mobileTitle: 'Anche dal telefono', mobileBody: 'Apri questa pagina nel browser del telefono e aggiungila ai preferiti. Le scelte restano sul dispositivo usato; non sono sincronizzate.',
    mobileLimit: 'Gli aggiornamenti vengono caricati quando apri o aggiorni la pagina. Non sono attive notifiche push.',
    capacity: 'Hai raggiunto il limite locale. Esporta e rimuovi alcune annotazioni prima di aggiungerne altre.',
    savedMessage: 'Scelta annotata sul dispositivo.', memoryMessage: 'Scelta annotata in questa scheda.', removedMessage: 'Annotazione rimossa.', resetMessage: 'I dati di questo spazio sono stati cancellati.',
    windowTime: 'Catalogo aggiornato', noDate: 'non disponibile', menu: 'Il tuo percorso', content: 'Vai al contenuto',
  },
  en: {
    eyebrow: 'POLICYWATCHER · FOR YOU', title: 'Your services.\nYour choices.',
    lead: 'Digital services change their rules. Follow them here, understand what has been published and decide what to do.',
    start: 'Choose your services', noticeShortcut: 'Received a policy notice?', privateTitle: 'Your space, on your device',
    privateBody: 'No account needed. Followed services and choices stay in this browser. Export or delete them whenever you want.',
    sections: ['My services', 'What changes for me', 'What I can do', 'My choices', 'Explain this notice', 'Ask for support'],
    local: 'Saved on this device', session: 'This session only', loading: 'Loading public sources…', refresh: 'Refresh sources',
    unavailable: 'Sources are unreachable. Previously opened information remains readable, but its current status needs checking.',
    retry: 'Try again', storageError: 'This browser cannot save your choices. They remain in this tab: export them before closing it.',
    corrupt: 'Saved preferences could not be read. We have not replaced them. Export the original file or clear this space to start again.',
    recover: 'Export original file', reset: 'Delete data from this space', resetConfirm: 'Confirm deletion', cancel: 'Cancel',
    servicesLead: 'Choose the services you use. Your selection is voluntary and is not sent to the server.', search: 'Find a service', searchPlaceholder: 'Service name, for example Google',
    following: 'Services you follow', noneFollowed: 'Your space is ready. Choose your first service to find its published updates.',
    catalog: 'Public source catalog', follow: 'Follow', unfollow: 'Unfollow', followed: 'Following', noSearch: 'No service matches your search.',
    plan: 'Your plan (optional)', planHint: 'For example: free or business. This is your own reminder; it does not confirm which plan a change applies to.',
    country: 'Your country (optional)', allCountries: 'Not specified', countryHint: 'Adds context to other pages too. Documents with an uncertain geographic scope remain visible.',
    missing: 'Source currently unavailable', missingHelp: 'Your selection is preserved. Absence from the catalog does not establish that the service has stopped changing.',
    changesLead: 'Published changes for the services you chose. Automatic summaries help you get oriented: open the source to check them.',
    allChanges: 'All updates', savedOnly: 'Saved only', noChanges: 'No change for these services in the loaded window. This does not mean nothing has changed.',
    pickFirst: 'Choose at least one service to personalize this page.', published: 'Published', detected: 'Detected', retrieved: 'Source retrieved', source: 'Open official source',
    recent: 'Source retrieved recently', dated: 'Source needs checking', unknown: 'Retrieval unavailable', offline: 'Current status needs checking',
    substantive: 'Content change', editorial: 'Wording change', unchanged: 'No change detected in this comparison', needs_review: 'Comparison needs review',
    automatic: 'Automatic summary', applicability: 'Check applicability to your account and plan.', compare: 'Read the comparison and sources', evidence: 'Open evidence',
    excerpts: 'Passages linked to this change', before: 'Before', after: 'After', save: 'Save', unsave: 'Remove from saved', read: 'Listen', stop: 'Stop audio',
    audioUnavailable: 'Speech playback is unavailable in this browser.', audioError: 'Speech playback is unavailable right now.',
    more: 'Load earlier changes', history: 'History is limited to available public records and may need refreshing. Publication dates are not effective dates.',
    reveal: 'Show 3 more loaded changes', fewer: 'Return to the 3 latest', loadedCount: (shown: number, total: number) => `Showing ${shown} of ${total} loaded changes`, nextSteps: 'Go to the next step',
    catalogLimit: 'The returned catalog is partial. Missing selections remain preserved.',
    actionsLead: 'Start with the service’s instructions. Each guide states its scope, source review date and limitations.', chooseGuide: 'Service to find a guide for',
    noGuides: 'There is no curated guide for this service yet. You can read its official policy and prepare a request for clarification.',
    noGuideService: 'Follow a service to see relevant guides.', guideSource: 'Open official instructions', guideRead: 'Source reviewed on', guideDue: 'Guide review is due: check the steps on the official source.',
    guidance: 'This guide describes general service options. It is not an established consequence of a particular change.',
    choicesLead: 'Record what you read or did. A new publication about the same document reopens the review.',
    choiceNone: 'No choice recorded yet. You can record one from an update above.', reviewed: 'I have read this', action_recorded: 'I have taken an action', remind_me: 'Review later',
    record: 'Record your choice', guideUsed: 'Guide used (optional)', noGuideUsed: 'No guide specified', recorded: 'Record preserved', revisit: 'Review again',
    choiceUnknown: 'Status needs checking', declaration: 'This is your own declaration. PolicyWatcher does not verify the effect on the service.', savedAt: 'Recorded on', removeChoice: 'Delete record',
    checkUpdate: 'Review updates', export: 'Export my choices', exportHint: 'The file includes services, plans and records you chose to save. Pasted notice text is excluded.',
    noticeLead: 'Paste the text or link you received. We look for matches in the catalog already downloaded, only on this device.',
    noticeLabel: 'Notice text or link', noticePlaceholder: 'Paste the notice here…', match: 'Look for local matches', clear: 'Clear',
    noticePrivacy: 'The text is not sent, logged or saved. Pasted links are not opened.', noticeLimit: 'Maximum 20 KiB of text.', noticeTooLarge: 'The text exceeds 20 KiB. Shorten it before searching.',
    noticeEmpty: 'Enter text or a link.', noticeNoMatch: 'No match in the loaded catalog. This does not authenticate the notice.',
    candidates: 'Possible services mentioned', candidateBoundary: 'A name or domain match does not authenticate the sender or confirm the message contents.',
    candidateNoChanges: 'No comparison for this service in the loaded window.', viewPublic: 'View public records',
    supportLead: 'Prepare a draft with the source, your record and a question for an association. Review it before sharing.',
    supportChoice: 'Change or record to include', supportEmpty: 'Choose a service and a published change to include in your draft. You can do this without recording a choice or copying the private notice.',
    question: 'Your question (optional)', questionHint: 'This text only enters the downloaded draft. Avoid unnecessary personal information.',
    preview: 'Draft preview', download: 'Download draft .txt', directory: 'Find an association', notSent: 'Nothing is sent automatically. Directory listings do not imply a partnership.',
    mobileTitle: 'On your phone too', mobileBody: 'Open this page in your phone’s browser and bookmark it. Choices stay on the device you use; they are not synced.',
    mobileLimit: 'Updates load when you open or refresh this page. Push notifications are not active.',
    capacity: 'You have reached the local limit. Export and remove some records before adding more.',
    savedMessage: 'Choice recorded on this device.', memoryMessage: 'Choice recorded in this tab.', removedMessage: 'Record removed.', resetMessage: 'The data in this space has been deleted.',
    windowTime: 'Catalog updated', noDate: 'unavailable', menu: 'Your journey', content: 'Skip to content',
  },
};
const sectionIds = ['servizi', 'aggiornamenti', 'azioni', 'scelte', 'comunicazione', 'supporto'];

function downloadFile(content: string, name: string, mime = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function CitizenClient({ locale }: { locale: CitizenLocale }) {
  const t = words[locale];
  const { context, updateContext } = useGlobalContext(locale, locale);
  const [preferences, setPreferences] = useState<CitizenPreferences>(emptyCitizenPreferences);
  const [hydrated, setHydrated] = useState(false);
  const [storageState, setStorageState] = useState<'ok' | 'failed' | 'corrupt'>('ok');
  const originalPreferences = useRef<string | null>(null);
  const [feed, setFeed] = useState<CitizenFeed | null>(null);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedError, setFeedError] = useState(false);
  const requestController = useRef<AbortController | null>(null);
  const [search, setSearch] = useState('');
  const [onlySaved, setOnlySaved] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(3);
  const shellRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const [guideServiceId, setGuideServiceId] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeMatches, setNoticeMatches] = useState<CitizenService[] | null>(null);
  const [noticeError, setNoticeError] = useState('');
  const [supportChoiceId, setSupportChoiceId] = useState('');
  const [supportChangeId, setSupportChangeId] = useState('');
  const [question, setQuestion] = useState('');
  const [deletePending, setDeletePending] = useState(false);
  const [message, setMessage] = useState('');
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState(false);

  useEffect(() => {
    const shell = shellRef.current;
    const header = shell?.querySelector(':scope > header');
    if (!shell || !header) return;
    const measure = () => {
      shell.style.setProperty('--citizen-header-height', `${Math.ceil(header.getBoundingClientRect().height)}px`);
      shell.style.setProperty('--citizen-status-height', `${Math.ceil(statusRef.current?.getBoundingClientRect().height || 0)}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    if (statusRef.current) observer.observe(statusRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const raw = localStorage.getItem(CITIZEN_STORAGE_KEY);
        originalPreferences.current = raw;
        const parsed = parseCitizenPreferences(raw);
        if (parsed) setPreferences(parsed);
        else if (raw) setStorageState('corrupt');
      } catch { setStorageState('failed'); }
      setHydrated(true);
      setSpeechAvailable('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);
    });
    const onStorage = (event: StorageEvent) => {
      if (event.key !== CITIZEN_STORAGE_KEY) return;
      originalPreferences.current = event.newValue;
      const parsed = parseCitizenPreferences(event.newValue);
      if (parsed || event.newValue === null) { setPreferences(parsed || emptyCitizenPreferences()); setStorageState('ok'); }
      else setStorageState('corrupt');
    };
    window.addEventListener('storage', onStorage);
    const onOffline = () => setLive(false);
    window.addEventListener('offline', onOffline);
    return () => { cancelled = true; window.removeEventListener('storage', onStorage); window.removeEventListener('offline', onOffline); window.speechSynthesis?.cancel(); };
  }, []);

  const loadFeed = useCallback(async (cursor?: string) => {
    requestController.current?.abort();
    const controller = new AbortController(); requestController.current = controller;
    let timedOut = false;
    const timeout = window.setTimeout(() => { timedOut = true; controller.abort(); }, 15_000);
    if (cursor) setLoadingMore(true); else { setLoading(true); setLive(false); setVisibleLimit(3); }
    setFeedError(false);
    try {
      const response = await fetch(`/api/v1/citizen-feed${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`, { signal: controller.signal, cache: 'no-store', credentials: 'omit' });
      if (!response.ok) throw new Error('UNAVAILABLE');
      const incoming = parseCitizenFeed(await response.json());
      if (!incoming) throw new Error('INVALID_FEED');
      if (controller.signal.aborted) return;
      setFeed(previous => cursor && previous ? {
        ...incoming,
        changes: [...new Map([...previous.changes.filter(change => incoming.services.some(service => service.id === change.serviceId && service.policies.some(policy => policy.id === change.policyId))), ...incoming.changes].map(change => [change.id, change])).values()],
      } : incoming);
      setLive(true);
    } catch {
      if (!controller.signal.aborted || timedOut) { setFeedError(true); setLive(false); }
    } finally {
      window.clearTimeout(timeout);
      if (!controller.signal.aborted || timedOut) { setLoading(false); setLoadingMore(false); }
    }
  }, []);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) void loadFeed(); });
    return () => { active = false; requestController.current?.abort(); };
  }, [loadFeed]);

  function persist(next: CitizenPreferences): boolean {
    setPreferences(next);
    if (storageState === 'corrupt') return false;
    try { localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(next)); setStorageState('ok'); return true; }
    catch { setStorageState('failed'); return false; }
  }
  function follow(service: CitizenService) {
    const exists = preferences.followed.some(item => item.serviceId === service.id);
    if (!exists && preferences.followed.length >= CITIZEN_MAX_SERVICES) { setMessage(t.capacity); return; }
    persist({ ...preferences, followed: exists ? preferences.followed.filter(item => item.serviceId !== service.id) : [...preferences.followed, { serviceId: service.id, name: service.name, slug: service.slug, plan: '' }] });
  }
  function saveChange(change: CitizenChange) {
    const exists = preferences.savedChangeIds.includes(change.id);
    if (!exists && preferences.savedChangeIds.length >= CITIZEN_MAX_SAVED) { setMessage(t.capacity); return; }
    persist({ ...preferences, savedChangeIds: exists ? preferences.savedChangeIds.filter(id => id !== change.id) : [...preferences.savedChangeIds, change.id] });
  }
  function recordChoice(change: CitizenChange, service: CitizenService, policy: CitizenPolicy, status: CitizenChoiceStatus, guideId?: string) {
    const existing = preferences.choices.find(item => item.changeId === change.id);
    if (!existing && preferences.choices.length >= CITIZEN_MAX_CHOICES) { setMessage(t.capacity); return; }
    const choice: CitizenChoice = {
      id: existing?.id || crypto.randomUUID(), serviceId: service.id, serviceName: service.name,
      policyId: policy.id, policyName: policy.name, changeId: change.id, baselinePublishedAt: change.publishedAt,
      status, recordedAt: new Date().toISOString(), ...(guideId ? { guideId } : {}),
    };
    const saved = persist({ ...preferences, choices: [choice, ...preferences.choices.filter(item => item.id !== choice.id)] });
    setSupportChoiceId(choice.id); setSupportChangeId(''); setMessage(saved ? t.savedMessage : t.memoryMessage);
  }
  function clearLocalData() {
    try { localStorage.removeItem(CITIZEN_STORAGE_KEY); setStorageState('ok'); }
    catch { setStorageState('failed'); setMessage(t.storageError); return; }
    originalPreferences.current = null; setPreferences(emptyCitizenPreferences()); setQuestion(''); setNotice(''); setNoticeMatches(null);
    setDeletePending(false); setMessage(t.resetMessage);
  }
  function speak(change: CitizenChange) {
    if (!speechAvailable) return;
    window.speechSynthesis.cancel(); setSpeechError(false);
    if (speaking === change.id) { setSpeaking(null); return; }
    const utterance = new SpeechSynthesisUtterance(change.summary[locale]);
    utterance.lang = locale === 'it' ? 'it-IT' : 'en-GB';
    utterance.onend = () => setSpeaking(null);
    utterance.onerror = event => { setSpeaking(null); if (event.error !== 'canceled' && event.error !== 'interrupted') setSpeechError(true); };
    setSpeaking(change.id); window.speechSynthesis.speak(utterance);
  }
  const dateLabel = (value: string | null) => value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat(locale === 'it' ? 'it-IT' : 'en-GB', { dateStyle: 'medium' }).format(new Date(value)) : t.noDate;
  const dateTimeLabel = (value: string) => Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat(locale === 'it' ? 'it-IT' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : t.noDate;
  const catalog = feed?.services || [];
  const serviceMap = new Map(catalog.map(service => [service.id, service]));
  const followedIds = new Set(preferences.followed.map(item => item.serviceId));
  const visibleCatalog = catalog.filter(service => service.name.toLocaleLowerCase(locale).includes(search.trim().toLocaleLowerCase(locale)));
  const changes = feed?.changes.filter(change => onlySaved ? preferences.savedChangeIds.includes(change.id) : followedIds.has(change.serviceId)) || [];
  const currentGuideId = preferences.followed.some(item => item.serviceId === guideServiceId) ? guideServiceId : preferences.followed[0]?.serviceId || '';
  const currentGuideService = serviceMap.get(currentGuideId);
  const guides = currentGuideService ? citizenGuidesForService(currentGuideService.slug) : [];
  const supportChanges = feed?.changes.filter(change => followedIds.has(change.serviceId)) || [];
  const selectedChoice = supportChangeId ? undefined : preferences.choices.find(choice => choice.id === supportChoiceId) || preferences.choices[0];
  const selectedChange = feed?.changes.find(change => change.id === (supportChangeId || selectedChoice?.changeId)) || (!selectedChoice && !supportChangeId ? supportChanges[0] : undefined);
  const selectedService = feed?.services.find(service => service.id === (selectedChoice?.serviceId || selectedChange?.serviceId));
  const dossier = selectedChoice || selectedChange ? buildCitizenDossier({ locale, choice: selectedChoice,
    change: selectedChange, service: selectedService,
    policy: selectedService?.policies.find(policy => policy.id === (selectedChoice?.policyId || selectedChange?.policyId)),
    note: question,
  }) : '';
  const disabledPreferences = !hydrated || storageState === 'corrupt';

  return <div ref={shellRef} className={styles.shell} lang={locale}>
    <a className={styles.skip} href="#citizen-main">{t.content}</a>
    <PublicHeader current="per-te" lang={locale} lockLang />
    <main id="citizen-main" className={styles.page}>
      <header className={styles.hero}>
        <div><p className={styles.eyebrow}>{t.eyebrow}</p><h1>{t.title.split('\n').map(line => <span key={line}>{line}</span>)}</h1><p className={styles.lead}>{t.lead}</p>
          <div className={styles.actions}><a className={styles.primary} href="#servizi">{t.start}<ArrowDown size={18} aria-hidden="true" /></a><a href="#comunicazione">{t.noticeShortcut}<ArrowRight size={17} aria-hidden="true" /></a></div>
        </div>
        <aside className={styles.promise}><LockKeyhole size={27} aria-hidden="true" /><h2>{t.privateTitle}</h2><p>{t.privateBody}</p>
          <Link className={styles.language} href={locale === 'it' ? '/per-te?lang=en' : '/per-te'} hrefLang={locale === 'it' ? 'en' : 'it'}>{locale === 'it' ? 'Read in English' : 'Leggi in italiano'}<ArrowRight size={16} aria-hidden="true" /></Link>
        </aside>
      </header>
      <div className={styles.workspace}>
        <nav className={styles.journey} aria-label={t.menu}>{t.sections.map((name, index) => <a href={`#${sectionIds[index]}`} key={name}><span aria-hidden="true">0{index + 1}</span>{name}</a>)}
          <p><LockKeyhole size={14} aria-hidden="true" />{storageState === 'ok' ? t.local : t.session}</p>
        </nav>
        <div className={styles.content}>
          {storageState !== 'ok' && <div className={styles.warning} role="alert"><p>{storageState === 'corrupt' ? t.corrupt : t.storageError}</p>{storageState === 'corrupt' && <div className={styles.actions}><button onClick={() => downloadFile(originalPreferences.current || '', 'policywatcher-local-recovery.json', 'application/json')}>{t.recover}</button><a href="#dati-locali">{t.reset}</a></div>}</div>}
          <div ref={statusRef} className={styles.liveMessage} role="status" aria-live="polite">{message}</div>
          <section id="servizi" className={styles.section} aria-labelledby="services-title">
            <SectionTitle index="01" title={t.sections[0]} id="services-title" lead={t.servicesLead} />
            <div className={styles.context}><label htmlFor="citizen-country">{t.country}</label><select id="citizen-country" value={context.country} disabled={disabledPreferences} onChange={event => { const country = event.target.value as GlobalCountryCode; updateContext({ ...context, country }); persist({ ...preferences, country }); }}><option value="all">{t.allCountries}</option>{GLOBAL_COUNTRIES.map(country => <option value={country.code} key={country.code}>{locale === 'it' ? country.nativeLabel : country.label}</option>)}</select><p>{t.countryHint}</p></div>
            <h3 className={styles.smallTitle}>{t.following}</h3>
            {preferences.followed.length === 0 ? <p className={styles.empty}>{t.noneFollowed}</p> : <ul className={styles.followedList}>{preferences.followed.map(item => <li key={item.serviceId}>
              <div className={styles.row}><strong>{item.name}</strong><button className={styles.quiet} disabled={disabledPreferences} onClick={() => persist({ ...preferences, followed: preferences.followed.filter(service => service.serviceId !== item.serviceId) })} aria-label={`${t.unfollow} ${item.name}`}><Check size={16} aria-hidden="true" />{t.followed}</button></div>
              {!serviceMap.has(item.serviceId) && !loading && <p className={styles.inlineWarning}><strong>{t.missing}.</strong> {t.missingHelp}</p>}
              <label className={styles.plan}>{t.plan}<input maxLength={80} value={item.plan} disabled={disabledPreferences} onChange={event => persist({ ...preferences, followed: preferences.followed.map(service => service.serviceId === item.serviceId ? { ...service, plan: event.target.value } : service) })} /></label>
            </li>)}</ul>}
            {preferences.followed.length > 0 && <p className={styles.hint}>{t.planHint}</p>}
            <details className={styles.catalog} open={preferences.followed.length === 0 || undefined}>
              <summary>{t.catalog}<Plus size={17} aria-hidden="true" /></summary>
              <label className={styles.searchLabel} htmlFor="citizen-search">{t.search}</label><div className={styles.search}><Search size={19} aria-hidden="true" /><input id="citizen-search" type="search" placeholder={t.searchPlaceholder} value={search} onChange={event => setSearch(event.target.value)} /></div>
              {loading && !feed ? <p role="status">{t.loading}</p> : <ul className={styles.catalogList}>{visibleCatalog.map(service => <li key={service.id}><span>{service.name}</span><button disabled={disabledPreferences} aria-pressed={followedIds.has(service.id)} onClick={() => follow(service)} aria-label={`${followedIds.has(service.id) ? t.unfollow : t.follow} ${service.name}`}>{followedIds.has(service.id) ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}{followedIds.has(service.id) ? t.followed : t.follow}</button></li>)}</ul>}
              {!loading && !visibleCatalog.length && <p>{feedError ? t.unavailable : t.noSearch}</p>}
              {feed?.catalogTruncated && <p className={styles.inlineWarning}>{t.catalogLimit}</p>}
            </details>
          </section>
          <section id="aggiornamenti" className={styles.section} aria-labelledby="updates-title">
            <SectionTitle index="02" title={t.sections[1]} id="updates-title" lead={t.changesLead} />
            <div className={styles.toolbar}><label className={styles.checkbox}><input type="checkbox" checked={onlySaved} onChange={event => { setOnlySaved(event.target.checked); setVisibleLimit(3); }} />{t.savedOnly}</label><button disabled={loading || loadingMore} onClick={() => void loadFeed()}><RefreshCw size={16} aria-hidden="true" />{loading ? t.loading : t.refresh}</button></div>
            {feedError && <p className={styles.warning} role="alert">{t.unavailable}</p>}
            {feed && <p className={styles.hint}>{t.windowTime}: {dateLabel(feed.generatedAt)}. {!live && t.offline}</p>}
            {!changes.length && !loading && <p className={styles.empty}>{preferences.followed.length ? t.noChanges : t.pickFirst}</p>}
            {changes.length > 0 && <div className={styles.updateOverview}><p role="status">{t.loadedCount(Math.min(visibleLimit, changes.length), changes.length)}</p><nav aria-label={t.nextSteps}><a href="#azioni">{t.sections[2]}<ArrowRight size={15} aria-hidden="true" /></a><a href="#scelte">{t.sections[3]}<ArrowRight size={15} aria-hidden="true" /></a></nav></div>}
            {changes.slice(0, visibleLimit).map(change => {
              const service = serviceMap.get(change.serviceId); const policy = service?.policies.find(item => item.id === change.policyId);
              return service && policy ? <ChangeCard key={change.id} change={change} service={service} policy={policy} locale={locale} live={live} saved={preferences.savedChangeIds.includes(change.id)} disabledPreferences={disabledPreferences} speaking={speaking === change.id} speechAvailable={speechAvailable} onSave={() => saveChange(change)} onSpeak={() => speak(change)} onSupport={() => { setSupportChoiceId(''); setSupportChangeId(change.id); }} onRecord={(status, guideId) => recordChoice(change, service, policy, status, guideId)} dateLabel={dateLabel} /> : null;
            })}
            {speechError && <p role="status">{t.audioError}</p>}
            {!speechAvailable && changes.length > 0 && <p className={styles.hint}>{t.audioUnavailable}</p>}
            <div className={styles.historyControls}>
              {visibleLimit < changes.length && <button onClick={() => setVisibleLimit(limit => limit + 3)}>{t.reveal}<Plus size={16} aria-hidden="true" /></button>}
              {visibleLimit > 3 && changes.length > 3 && <a href="#aggiornamenti" onClick={() => setVisibleLimit(3)}>{t.fewer}</a>}
            </div>
            {feed?.history.hasMore && <button className={styles.loadMore} disabled={loading || loadingMore} onClick={() => feed.history.nextCursor && void loadFeed(feed.history.nextCursor)}>{loadingMore ? t.loading : t.more}<ArrowDown size={16} aria-hidden="true" /></button>}
            <p className={styles.hint}>{t.history}</p>
            {changes.length > 0 && <nav className={styles.nextSteps} aria-label={t.nextSteps}><a href="#azioni">{t.sections[2]}<ArrowRight size={16} aria-hidden="true" /></a><a href="#scelte">{t.sections[3]}<ArrowRight size={16} aria-hidden="true" /></a></nav>}
          </section>
          <section id="azioni" className={styles.section} aria-labelledby="actions-title">
            <SectionTitle index="03" title={t.sections[2]} id="actions-title" lead={t.actionsLead} />
            {!preferences.followed.length ? <p className={styles.empty}>{t.noGuideService}</p> : <>
              <label className={styles.field}>{t.chooseGuide}<select value={currentGuideId} onChange={event => setGuideServiceId(event.target.value)}><option value="" disabled>{t.chooseGuide}</option>{preferences.followed.map(item => <option value={item.serviceId} key={item.serviceId}>{item.name}</option>)}</select></label>
              {!guides.length && <p className={styles.empty}>{t.noGuides}</p>}
              {guides.map(guide => <article className={styles.guide} key={guide.id}><h3>{guide.title[locale]}</h3><p>{guide.scope[locale]}</p><ol>{guide.steps[locale].map(step => <li key={step}>{step}</li>)}</ol><p className={styles.hint}>{guide.boundary[locale]}</p><p className={styles.hint}>{t.guideRead}: {dateLabel(guide.reviewedAt)}.</p>{citizenGuideFreshness(guide) === 'review_due' && <p className={styles.inlineWarning}>{t.guideDue}</p>}<a href={citizenSafeUrl(guide.officialUrl) || undefined} className={styles.sourceLink} rel="noreferrer">{t.guideSource}<ExternalLink size={15} aria-hidden="true" /></a></article>)}
              {currentGuideService && !guides.length && <ul className={styles.simpleLinks}>{currentGuideService.policies.map(policy => <li key={policy.id}><a href={citizenSafeUrl(policy.sourceUrl) || undefined} rel="noreferrer">{policy.name}<ExternalLink size={14} aria-hidden="true" /></a></li>)}</ul>}
              <p className={styles.hint}>{t.guidance}</p>
            </>}
          </section>
          <section id="scelte" className={styles.section} aria-labelledby="choices-title">
            <SectionTitle index="04" title={t.sections[3]} id="choices-title" lead={t.choicesLead} />
            {!preferences.choices.length ? <p className={styles.empty}>{t.choiceNone}</p> : <ul className={styles.choiceList}>{preferences.choices.map(choice => {
              const review = evaluateCitizenChoice(choice, feed, live);
              return <li key={choice.id}><div className={styles.row}><h3>{choice.serviceName}</h3><span className={`${styles.badge} ${review !== 'recorded' ? styles.attention : ''}`}>{review === 'unknown' ? t.choiceUnknown : t[review]}</span></div><p>{choice.policyName}</p><strong>{t[choice.status]}</strong><p className={styles.hint}>{t.savedAt}: {dateLabel(choice.recordedAt)}. {t.declaration}</p><div className={styles.actions}><a href="#aggiornamenti">{t.checkUpdate}<ArrowRight size={15} aria-hidden="true" /></a><a href="#supporto" onClick={() => { setSupportChoiceId(choice.id); setSupportChangeId(''); }}>{t.sections[5]}</a><button className={styles.quiet} onClick={() => { persist({ ...preferences, choices: preferences.choices.filter(item => item.id !== choice.id) }); setMessage(t.removedMessage); }} disabled={disabledPreferences} aria-label={`${t.removeChoice}: ${choice.serviceName}, ${choice.policyName}`}><Trash2 size={16} aria-hidden="true" />{t.removeChoice}</button></div></li>;
            })}</ul>}
            <div id="dati-locali" className={styles.localData}><button disabled={!hydrated} onClick={() => downloadFile(JSON.stringify(preferences, null, 2), 'policywatcher-my-choices.json', 'application/json')}><Download size={16} aria-hidden="true" />{t.export}</button><p className={styles.hint}>{t.exportHint}</p>{!deletePending ? <button className={styles.quiet} onClick={() => setDeletePending(true)}>{t.reset}</button> : <div className={styles.actions}><button onClick={clearLocalData}>{t.resetConfirm}</button><button className={styles.quiet} onClick={() => setDeletePending(false)}>{t.cancel}</button></div>}</div>
          </section>
          <section id="comunicazione" className={styles.section} aria-labelledby="notice-title">
            <SectionTitle index="05" title={t.sections[4]} id="notice-title" lead={t.noticeLead} />
            <form onSubmit={event => { event.preventDefault(); setNoticeError(''); if (!notice.trim()) { setNoticeError(t.noticeEmpty); setNoticeMatches(null); return; } try { setNoticeMatches(matchCitizenNotice(notice, catalog)); } catch { setNoticeError(t.noticeTooLarge); setNoticeMatches(null); } }}>
              <label className={styles.field} htmlFor="citizen-notice">{t.noticeLabel}<textarea id="citizen-notice" value={notice} onChange={event => { setNotice(event.target.value); setNoticeMatches(null); setNoticeError(''); }} rows={5} placeholder={t.noticePlaceholder} aria-describedby="notice-privacy notice-limit" autoComplete="off" spellCheck={false} /></label>
              <p className={styles.hint} id="notice-privacy"><LockKeyhole size={14} aria-hidden="true" /> {t.noticePrivacy}</p><p className={styles.hint} id="notice-limit">{t.noticeLimit}</p>
              {noticeError && <p className={styles.inlineWarning} role="alert">{noticeError}</p>}
              <div className={styles.actions}><button className={styles.primary} disabled={!feed} type="submit"><Search size={17} aria-hidden="true" />{t.match}</button><button type="button" className={styles.quiet} onClick={() => { setNotice(''); setNoticeMatches(null); setNoticeError(''); }}>{t.clear}</button></div>
            </form>
            {noticeMatches && <div className={styles.noticeResult} role="status">{noticeMatches.length ? <><h3>{t.candidates}</h3><p>{t.candidateBoundary}</p>{noticeMatches.map(service => <div key={service.id} className={styles.candidate}><div className={styles.row}><strong>{service.name}</strong><button disabled={disabledPreferences} onClick={() => follow(service)} aria-pressed={followedIds.has(service.id)}>{followedIds.has(service.id) ? t.followed : `${t.follow} ${service.name}`}</button></div><ul className={styles.simpleLinks}>{feed?.changes.filter(change => change.serviceId === service.id).map(change => <li key={change.id}><Link href={change.detailPath}>{dateLabel(change.publishedAt)} · {change.summary[locale]}</Link></li>)}</ul>{!feed?.changes.some(change => change.serviceId === service.id) && <p>{t.candidateNoChanges}</p>}<Link href={`/knowledge/companies/${encodeURIComponent(service.slug)}`}>{t.viewPublic}<ArrowRight size={15} aria-hidden="true" /></Link></div>)}</> : <p>{t.noticeNoMatch}</p>}</div>}
          </section>
          <section id="supporto" className={styles.section} aria-labelledby="support-title">
            <SectionTitle index="06" title={t.sections[5]} id="support-title" lead={t.supportLead} />
            {!selectedChoice && !selectedChange ? <p className={styles.empty}>{t.supportEmpty}</p> : <>
              <label className={styles.field}>{t.supportChoice}<select value={selectedChoice ? `choice:${selectedChoice.id}` : `change:${selectedChange?.id}`} onChange={event => { const [kind, id] = event.target.value.split(':'); setSupportChoiceId(kind === 'choice' ? id : ''); setSupportChangeId(kind === 'change' ? id : ''); }}>
                {preferences.choices.length > 0 && <optgroup label={t.sections[3]}>{preferences.choices.map((choice, index) => <option value={`choice:${choice.id}`} key={choice.id}>{index + 1}. {choice.serviceName} · {choice.policyName} · {t[choice.status]} · {dateTimeLabel(choice.recordedAt)}</option>)}</optgroup>}
                {supportChanges.length > 0 && <optgroup label={t.allChanges}>{supportChanges.map((change, index) => <option value={`change:${change.id}`} key={change.id}>{index + 1}. {serviceMap.get(change.serviceId)?.name} · {dateTimeLabel(change.publishedAt)} · {change.summary[locale].slice(0, 70)}{change.summary[locale].length > 70 ? '…' : ''}</option>)}</optgroup>}
              </select></label>
              {selectedChange && <p className={styles.selectedRecord}>{selectedService?.name} · {dateTimeLabel(selectedChange.publishedAt)}<br />{selectedChange.summary[locale]}</p>}
              <label className={styles.field}>{t.question}<textarea value={question} maxLength={2000} rows={3} onChange={event => setQuestion(event.target.value)} aria-describedby="support-note" /></label><p className={styles.hint} id="support-note">{t.questionHint}</p><details className={styles.dossier}><summary><FileText size={17} aria-hidden="true" />{t.preview}</summary><pre>{dossier}</pre></details><button className={styles.primary} onClick={() => downloadFile(dossier, 'policywatcher-support-draft.txt')}><Download size={17} aria-hidden="true" />{t.download}</button>
            </>}
            <div className={styles.supportLinks}><Link href={locale === 'it' ? '/it/associazioni' : '/en/associations'}>{t.directory}<ArrowRight size={17} aria-hidden="true" /></Link><p className={styles.hint}>{t.notSent}</p></div>
          </section>
          <aside className={styles.mobileNote}><Smartphone size={25} aria-hidden="true" /><div><h2>{t.mobileTitle}</h2><p>{t.mobileBody}</p><p className={styles.hint}>{t.mobileLimit}</p></div></aside>
        </div>
      </div>
    </main><Footer lang={locale} lockLang variant="compact" />
  </div>;
}

function SectionTitle({ index, title, id, lead }: { index: string; title: string; id: string; lead: string }) {
  return <header className={styles.sectionHeader}><span className={styles.number} aria-hidden="true">{index}</span><div><h2 id={id}>{title}</h2><p>{lead}</p></div></header>;
}

function ChangeCard({ change, service, policy, locale, live, saved, disabledPreferences, speechAvailable, speaking, onSave, onSpeak, onSupport, onRecord, dateLabel }: {
  change: CitizenChange; service: CitizenService; policy: CitizenPolicy; locale: CitizenLocale; live: boolean;
  saved: boolean; disabledPreferences: boolean; speechAvailable: boolean; speaking: boolean; onSave: () => void; onSpeak: () => void; onSupport: () => void;
  onRecord: (status: CitizenChoiceStatus, guideId?: string) => void; dateLabel: (value: string | null) => string;
}) {
  const t = words[locale]; const [guideId, setGuideId] = useState('');
  const guides = citizenGuidesForService(service.slug);
  const freshness = citizenFreshness(policy.lastRetrievedAt);
  return <article className={styles.change}>
    <div className={styles.row}><p className={styles.serviceName}>{service.name}</p><span className={styles.badge}>{t[change.kind]}</span></div>
    <h3>{policy.name}</h3><p className={styles.hint}>{t.published}: {dateLabel(change.publishedAt)} · {t.detected}: {dateLabel(change.detectedAt)}</p>
    <p className={styles.summaryLabel}>{t.automatic}</p><p className={styles.summary}>{change.summary[locale]}</p>
    <div className={styles.sourceState}><span className={`${styles.badge} ${!live || freshness !== 'recent' ? styles.attention : ''}`}>{!live ? t.offline : freshness === 'recent' ? t.recent : freshness === 'dated' ? t.dated : t.unknown}</span><span>{t.retrieved}: {dateLabel(policy.lastRetrievedAt)}</span></div>
    <p className={styles.hint}>{t.applicability} {policy.jurisdiction && <span>{locale === 'it' ? 'Ambito dichiarato' : 'Declared scope'}: {policy.jurisdiction}.</span>}</p>
    <div className={styles.actions}><Link href={`${change.detailPath}${locale === 'it' ? '?lang=it' : ''}`}>{t.compare}<ArrowRight size={16} aria-hidden="true" /></Link><button className={styles.quiet} onClick={onSave} disabled={disabledPreferences} aria-pressed={saved}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />{saved ? t.unsave : t.save}</button>{speechAvailable && <button className={styles.quiet} onClick={onSpeak}>{speaking ? <Square size={15} aria-hidden="true" /> : <Headphones size={17} aria-hidden="true" />}{speaking ? t.stop : t.read}</button>}</div>
    <details className={styles.evidence}><summary>{t.excerpts}</summary>{change.evidence.length ? change.evidence.map((item, index) => <div className={styles.excerpt} key={index}><div><strong>{t.before}</strong><blockquote>{item.before || '—'}</blockquote></div><div><strong>{t.after}</strong><blockquote>{item.after || '—'}</blockquote></div></div>) : <p>{locale === 'it' ? 'Passaggi testuali non disponibili in questa vista. Apri il confronto per verificarne i limiti.' : 'Text passages are unavailable in this view. Open the comparison to inspect its limits.'}</p>}<div className={styles.actions}><a href={citizenSafeUrl(policy.sourceUrl) || undefined} rel="noreferrer">{t.source}<ExternalLink size={14} aria-hidden="true" /></a><Link href={change.evidencePath}>{t.evidence}</Link></div></details>
    <details className={styles.recordChoice}><summary>{t.record}</summary><p className={styles.hint}>{t.declaration}</p>{guides.length > 0 && <label className={styles.field}>{t.guideUsed}<select value={guideId} onChange={event => setGuideId(event.target.value)}><option value="">{t.noGuideUsed}</option>{guides.map(guide => <option value={guide.id} key={guide.id}>{guide.title[locale]}</option>)}</select></label>}<div className={styles.choiceButtons}>{(['reviewed', 'action_recorded', 'remind_me'] as const).map(status => <button key={status} disabled={disabledPreferences} onClick={() => onRecord(status, guideId || undefined)}>{t[status]}</button>)}</div></details>
    <a className={styles.supportAction} href="#supporto" onClick={onSupport}>{t.sections[5]}<ArrowRight size={15} aria-hidden="true" /></a>
  </article>;
}
