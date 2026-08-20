import type { Locale } from '@/domain/changeEvent';

const it = {
  tabs: { today: 'Feed', watchlist: 'Aziende', collection: 'Salvati', companion: 'Impostazioni' },
  masthead: { kicker: 'POLICYWATCHER · EVIDENZA PUBBLICA', product: 'PolicyWatcher companion', polling: 'Aggiornamento su richiesta', notLive: 'Durante l’uso' },
  today: {
    eyebrow: 'FEED PUBBLICO', title: 'Aggiornamenti', count: (n: number) => `${n} pubblicazioni nel feed`,
    refreshed: 'Aggiornato', never: 'non ancora', search: 'Cerca azienda, policy o giurisdizione', searchLabel: 'Cerca nel feed pubblico',
    all: 'Tutti', empty: 'Nessun record corrisponde ai filtri.', retry: 'Riprova', loading: 'Verifico le pubblicazioni…',
    cachedTitle: 'Copia locale', cachedBody: 'La rete non ha risposto. Stai leggendo l’ultimo feed pubblico salvato sul dispositivo.',
    demoTitle: 'Modalità dimostrativa', demoBody: 'Il feed pubblico e la copia locale non sono disponibili. I record visualizzati sono dati dimostrativi.',
    feedError: 'Il feed pubblico non è disponibile.', clearFilters: 'Azzera filtri', newWatched: (n: number) => `${n} nuove pubblicazioni per aziende osservate`,
  },
  explainer: {
    label: 'FUNZIONI DISPONIBILI', title: 'Feed ed elementi salvati',
    body: 'Il feed mostra le pubblicazioni disponibili. Puoi salvare fino a 12 record e aprirli sul web.',
    dismiss: 'Ho capito', revisit: 'Rivedi introduzione',
  },
  card: { published: 'PUBBLICATO', score: 'SCORE', open: 'Apri record', watch: 'Osserva azienda', watching: 'Osservata', save: 'Salva', saved: 'Salvato' },
  risk: { High: 'Alto', Medium: 'Medio', Low: 'Basso' },
  watchlist: {
    eyebrow: 'WATCHLIST LOCALE', title: 'Aziende osservate', body: 'La lista contiene le aziende selezionate dal feed pubblico ed è salvata sul dispositivo.',
    emptyTitle: 'Nessuna azienda osservata', emptyBody: 'Aggiungi un’azienda da Oggi. Al prossimo aggiornamento segnaleremo le nuove pubblicazioni solo dentro l’app.',
    browse: 'Sfoglia Oggi', remove: 'Rimuovi', publications: (n: number) => `${n} pubblicazioni visibili`, localOnly: 'Salvata sul dispositivo',
  },
  collection: {
    eyebrow: 'RACCOLTA LOCALE', title: 'Elementi salvati', body: 'La raccolta contiene fino a 12 record pubblici. Titoli e stati di revisione restano sul dispositivo.',
    select: 'Seleziona', review: 'Revisiona', handoff: 'Continua', selected: (n: number) => `${n}/12 selezionati`, reviewed: (n: number) => `${n} revisionati`,
    emptyTitle: 'La raccolta è vuota', emptyBody: 'Salva un record dal feed o dal dettaglio per creare un handoff verificabile.',
    browse: 'Trova evidenze', remove: 'Rimuovi', openWeb: 'Continua sul web', share: 'Condividi link', limit: 'Limite di 12 record raggiunto.',
    invalidLink: 'Deep link rifiutato: la lista contiene identificativi non validi o più di 12 record.', imported: (n: number) => `${n} identificativi pubblici importati dal link.`,
  },
  review: { unreviewed: 'Da leggere', reviewing: 'In revisione', reviewed: 'Revisionato', next: 'Cambia stato revisione' },
  companion: {
    eyebrow: 'APP COMPANION', title: 'Impostazioni', body: 'Configura la lingua e consulta le impostazioni di archiviazione e aggiornamento.',
    language: 'Lingua', italian: 'Italiano', english: 'English', dataTitle: 'Dati sul dispositivo',
    dataBody: 'I link condivisi includono solo gli identificativi pubblici. Aziende osservate, titoli e stati di revisione restano sul dispositivo.',
    pollingTitle: 'Aggiornamento del feed', pollingBody: 'Il feed si aggiorna quando apri o ricarichi l’app. Gli aggiornamenti avvengono mentre l’app è in uso.',
    boundaryTitle: 'Limiti dello screening', boundaryBody: 'Lo screening assistito da AI supporta la revisione umana: non è un verdetto legale, un alert esaustivo o una prova che la fonte sia ancora disponibile.',
    workspace: 'Apri workspace web', origin: 'Origine pubblica', storage: 'Memoria locale', storageValue: 'SQLite KV · cache ultima lettura',
  },
  detail: {
    back: 'Indietro', publication: 'DETTAGLI PUBBLICAZIONE', published: 'Pubblicato', jurisdiction: 'Giurisdizione', policyType: 'Tipo di policy',
    screening: 'Screening', boundary: 'Confine', provenance: 'Provenienza pubblica', changeId: 'Change UUID', canonical: 'Pagina canonica del cambiamento', packet: 'Pacchetto evidenze JSON',
    missingTitle: 'Record non disponibile', missingBody: 'L’identificativo non è valido o il record non è presente nel feed locale corrente.',
    openEvidence: 'Apri evidenza', continueWeb: 'Continua sul web', share: 'Condividi', save: 'Salva', remove: 'Rimuovi',
  },
  common: { local: 'LOCALE', web: 'WEB', cached: 'CACHE', demo: 'DEMO', close: 'Chiudi' },
};

const en: typeof it = {
  tabs: { today: 'Feed', watchlist: 'Companies', collection: 'Saved', companion: 'Settings' },
  masthead: { kicker: 'POLICYWATCHER · PUBLIC EVIDENCE', product: 'PolicyWatcher Companion', polling: 'Refresh on demand', notLive: 'While in use' },
  today: {
    eyebrow: 'PUBLIC FEED', title: 'Updates', count: (n) => `${n} publications in the feed`,
    refreshed: 'Refreshed', never: 'not yet', search: 'Search company, policy or jurisdiction', searchLabel: 'Search the public feed',
    all: 'All', empty: 'No records match these filters.', retry: 'Retry', loading: 'Checking publications…',
    cachedTitle: 'Local copy', cachedBody: 'The network did not respond. You are reading the last public feed saved on this device.',
    demoTitle: 'Demonstration mode', demoBody: 'The public feed and local copy are unavailable. The displayed records are demonstration data.',
    feedError: 'The public feed is unavailable.', clearFilters: 'Clear filters', newWatched: (n) => `${n} new publications for watched companies`,
  },
  explainer: {
    label: 'AVAILABLE FUNCTIONS', title: 'Feed and saved items',
    body: 'The feed shows available publications. You can save up to 12 records and open them on the web.',
    dismiss: 'Got it', revisit: 'Revisit introduction',
  },
  card: { published: 'PUBLISHED', score: 'SCORE', open: 'Open record', watch: 'Watch company', watching: 'Watching', save: 'Save', saved: 'Saved' },
  risk: { High: 'High', Medium: 'Medium', Low: 'Low' },
  watchlist: {
    eyebrow: 'LOCAL WATCHLIST', title: 'Watched companies', body: 'The list contains companies selected from the public feed and is stored on this device.',
    emptyTitle: 'No watched companies', emptyBody: 'Add a company from Today. On refresh, new publications are surfaced only inside the app.',
    browse: 'Browse Today', remove: 'Remove', publications: (n) => `${n} visible publications`, localOnly: 'Stored on this device',
  },
  collection: {
    eyebrow: 'LOCAL COLLECTION', title: 'Saved items', body: 'The collection contains up to 12 public records. Titles and review status remain on this device.',
    select: 'Select', review: 'Review', handoff: 'Handoff', selected: (n) => `${n}/12 selected`, reviewed: (n) => `${n} reviewed`,
    emptyTitle: 'The collection is empty', emptyBody: 'Save a record from the feed or detail view to create a verifiable handoff.',
    browse: 'Find evidence', remove: 'Remove', openWeb: 'Continue on web', share: 'Share link', limit: 'The 12-record limit has been reached.',
    invalidLink: 'Deep link rejected: the list contains invalid identifiers or more than 12 records.', imported: (n) => `${n} public identifiers imported from the link.`,
  },
  review: { unreviewed: 'Unread', reviewing: 'Reviewing', reviewed: 'Reviewed', next: 'Change review status' },
  companion: {
    eyebrow: 'COMPANION APP', title: 'Settings', body: 'Set the language and review storage and update settings.',
    language: 'Language', italian: 'Italiano', english: 'English', dataTitle: 'On-device data',
    dataBody: 'Shared links include public identifiers only. Watched companies, titles and review status stay on this device.',
    pollingTitle: 'Feed updates', pollingBody: 'The feed refreshes when you open or reload the app. Updates run while the app is in use.',
    boundaryTitle: 'Screening limitations', boundaryBody: 'AI-assisted screening supports human review: it is not a legal verdict, exhaustive alert or proof that a source is still available.',
    workspace: 'Open web workspace', origin: 'Public origin', storage: 'Local storage', storageValue: 'SQLite KV · last-read cache',
  },
  detail: {
    back: 'Back', publication: 'PUBLICATION DETAILS', published: 'Published', jurisdiction: 'Jurisdiction', policyType: 'Policy type',
    screening: 'Screening', boundary: 'Boundary', provenance: 'Public provenance', changeId: 'Change UUID', canonical: 'Canonical change page', packet: 'Evidence packet JSON',
    missingTitle: 'Record unavailable', missingBody: 'The identifier is invalid or the record is not in the current local feed.',
    openEvidence: 'Open evidence', continueWeb: 'Continue on web', share: 'Share', save: 'Save', remove: 'Remove',
  },
  common: { local: 'LOCAL', web: 'WEB', cached: 'CACHE', demo: 'DEMO', close: 'Close' },
};

export const COPY = { it, en } as const satisfies Record<Locale, typeof it>;
export type Copy = typeof it;
