'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  Clock,
  ExternalLink,
  FileDown,
  Filter,
  Globe2,
  ListChecks,
  Radio,
  ShieldCheck,
} from 'lucide-react';
import Footer from '@/components/Footer';
import { useGlobalContext } from '@/components/GlobalContextControl';
import PublicHeader from '@/components/PublicHeader';
import {
  buildObservatoryIcs,
  compareObservatoryDeadlines,
  getMetaObservatoryMetrics,
  getObservatoryCountdown,
  getObservatorySource,
  OBSERVATORY_VERIFIED_AT,
  type ObservatoryContentType,
  type ObservatoryEvidenceRole,
  type ObservatoryEvent,
  type ObservatorySourceKind,
  observatoryEvents,
  observatoryMetaInsights,
  observatorySignals,
  observatorySources,
  type Locale,
} from '@/lib/observatory';
import styles from './observatory.module.css';

type WatchUrgency = 'high' | 'medium' | 'watch' | 'scheduled';

type WatchItem = {
  id: string;
  title: string;
  summary: string;
  sourceName: string;
  sourceHref: string;
  category: ObservatoryContentType;
  region: string;
  cadence: string;
  dateLabel: string;
  timeLabel: string;
  countdown: string;
  urgency: WatchUrgency;
  state: 'In force' | 'Guidance' | 'Event';
  deadlineAt: number;
  event?: ObservatoryEvent;
};

type ProcessStepCopy = {
  title: string;
  description: string;
};

type ObservatoryPageCopy = {
  verifiedAtLabel: string;
  navigation: {
    ariaLabel: string;
    back: string;
    atlas: string;
    trust: string;
    roadmap: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    freshness: (verifiedAtLabel: string) => string;
    metaAction: string;
    sourcesAction: string;
    augustAction: string;
    watchAction: string;
    nextReview: string;
    summaryAriaLabel: string;
    censusLabel: string;
    censusNote: string;
    evidenceReadyLabel: string;
    evidenceReadyNote: string;
    sourceReviewLabel: string;
    sourceReviewNote: string;
    lensesLabel: string;
    lensesNote: string;
  };
  operations: {
    ariaLabel: string;
    evidenceLabel: string;
    evidenceValue: string;
    metaLabel: string;
    metaValue: string;
    operationalLabel: string;
    operationalValue: (upcomingCount: number, highPriorityCount: number) => string;
  };
  meta: {
    eyebrow: string;
    title: string;
    lead: string;
    processAriaLabel: string;
    process: [ProcessStepCopy, ProcessStepCopy, ProcessStepCopy, ProcessStepCopy];
    gateAriaLabel: string;
    gateEyebrow: string;
    gateValue: string;
    catalogued: string;
    cataloguedNote: string;
    verified: string;
    verifiedNote: string;
    evidenceReady: string;
    evidenceReadyNote: string;
    gateNote: string;
    insightsAriaLabel: string;
    implication: string;
    comparedSources: string;
    reviewSuffix: string;
    trustLabel: string;
    trustNote: string;
  };
  ledger: {
    eyebrow: string;
    title: string;
    lead: string;
    ariaLabel: string;
    source: string;
    sourceClass: string;
    region: string;
    evidenceRole: string;
    evidenceGate: string;
    access: string;
    sourceReview: string;
    verified: string;
    evidenceReady: string;
    notEvidenceReady: string;
    publicWeb: string;
  };
  august: {
    eyebrow: string;
    title: string;
    lead: string;
    officialSource: string;
  };
  board: {
    eyebrow: string;
    title: string;
    lead: string;
    filtersAriaLabel: string;
    category: string;
    region: string;
    source: string;
    review: string;
    openSource: string;
    addToCalendar: string;
  };
  method: {
    ariaLabel: string;
    eyebrow: string;
    title: string;
    lead: string;
    action: string;
  };
  discovery: {
    eyebrow: string;
    activeCategories: (count: number) => string;
    lead: string;
    action: string;
  };
  filters: {
    categories: Record<string, string>;
    regions: Record<string, string>;
  };
  urgency: Record<WatchUrgency, string>;
  state: Record<WatchItem['state'], string>;
  category: Record<ObservatoryContentType, string>;
  sourceKind: Record<ObservatorySourceKind, string>;
  evidenceRole: Record<ObservatoryEvidenceRole, string>;
  region: Record<string, string>;
  countdown: Record<string, string>;
  sourceAuthority: Record<string, string>;
  fallback: {
    observatory: string;
    manualReview: string;
    calendarReview: string;
    openInNewTab: (sourceName: string) => string;
  };
};

const observatoryPageCopy: Record<Locale, ObservatoryPageCopy> = {
  en: {
    verifiedAtLabel: OBSERVATORY_VERIFIED_AT,
    navigation: {
      ariaLabel: 'Observatory navigation',
      back: 'Evidence console',
      atlas: 'Atlas',
      trust: 'Trust',
      roadmap: 'Roadmap',
    },
    hero: {
      eyebrow: 'Meta-observatory · operational monitoring',
      title: 'Policy, privacy and AI observatory',
      lead: 'We bring order to observatories, authorities, standards hubs and repositories: we catalogue sources, normalize their role and read convergence, divergence and blind spots before translating them into operational signals.',
      freshness: (verifiedAtLabel) => `Existing registry verified ${verifiedAtLabel} · AI Observatory catalogued with methodology under source review · no automatic ingestion.`,
      metaAction: 'Explore the meta layer',
      sourcesAction: 'Source registry',
      augustAction: 'August update',
      watchAction: 'Operational monitoring',
      nextReview: 'Next review',
      summaryAriaLabel: 'Observatory summary',
      censusLabel: 'Sources catalogued',
      censusNote: 'Normalized observatories, authorities and hubs',
      evidenceReadyLabel: 'Evidence-ready',
      evidenceReadyNote: 'Verified to contribute to signals',
      sourceReviewLabel: 'Source review',
      sourceReviewNote: 'Catalogued, but excluded from operational conclusions',
      lensesLabel: 'Cross-source lenses',
      lensesNote: 'Convergence · divergence · blind spot',
    },
    operations: {
      ariaLabel: 'Observatory operating model',
      evidenceLabel: 'Evidence gate',
      evidenceValue: 'Catalogued ≠ verified ≠ evidence-ready',
      metaLabel: 'Meta layer',
      metaValue: 'Cross-source inference, never single-source synthesis',
      operationalLabel: 'Operational layer',
      operationalValue: (upcomingCount, highPriorityCount) => `${upcomingCount} future reviews · ${highPriorityCount} high priority`,
    },
    meta: {
      eyebrow: 'Meta-observatory',
      title: 'Observatory registry',
      lead: 'Not another feed, but a reasoned map of the ecosystem: who provides context, who defines obligations, who enforces them and who helps implement them. The insights below are inferences from the catalogue, not independent regulatory facts.',
      processAriaLabel: 'Meta-observatory process',
      process: [
        { title: 'Catalogue', description: 'Identify relevant observatories, authorities, standards hubs and repositories.' },
        { title: 'Normalize', description: 'Separate source class, region, evidence role and verification status.' },
        { title: 'Triangulate', description: 'Read relationships and gaps across independent sources without flattening them.' },
        { title: 'Translate', description: 'Move only human-reviewed, evidence-gated material into the watch board.' },
      ],
      gateAriaLabel: 'Meta-observatory evidence gate',
      gateEyebrow: 'The visible threshold',
      gateValue: 'catalogued ≠ verified ≠ evidence-ready',
      catalogued: 'Catalogued',
      cataloguedNote: 'Present in the registry',
      verified: 'Verified',
      verifiedNote: 'Identity and role reviewed',
      evidenceReady: 'Evidence-ready',
      evidenceReadyNote: 'Admitted to operational synthesis',
      gateNote: 'A source under source review remains visible in the census, but does not generate claims and cannot serve as the sole evidence.',
      insightsAriaLabel: 'Cross-source census insights',
      implication: 'Implication',
      comparedSources: 'Sources compared',
      reviewSuffix: 'review',
      trustLabel: 'Trust rule:',
      trustNote: 'no single-source synthesis. Sources under source review remain in the catalogue, but do not contribute to operational conclusions.',
    },
    ledger: {
      eyebrow: 'Source census · evidence registry',
      title: 'Source types and evidence thresholds',
      lead: 'The registry makes different sources comparable without declaring them equivalent. AI Observatory is included with Source review status: visible, but not evidence-ready.',
      ariaLabel: 'Source census and evidence status',
      source: 'Source',
      sourceClass: 'Class',
      region: 'Region',
      evidenceRole: 'Evidence role',
      evidenceGate: 'Evidence gate',
      access: 'Access',
      sourceReview: 'Source review',
      verified: 'Verified',
      evidenceReady: 'Evidence-ready',
      notEvidenceReady: 'Not evidence-ready',
      publicWeb: 'Public web',
    },
    august: {
      eyebrow: 'Applicability update · verified 17 August 2026',
      title: 'EU AI Act updates',
      lead: 'These are applicable obligations and enforcement milestones, not proposals under monitoring. Every entry links to the European Commission source used for verification.',
      officialSource: 'Official source',
    },
    board: {
      eyebrow: 'Active monitoring',
      title: 'Review calendar',
      lead: 'Upcoming reviews are ordered by date; overdue items remain visible with source context and the required action.',
      filtersAriaLabel: 'Observatory filters',
      category: 'Category',
      region: 'Region',
      source: 'Source',
      review: 'Review',
      openSource: 'Source',
      addToCalendar: 'Add to calendar',
    },
    method: {
      ariaLabel: 'Observatory methodology',
      eyebrow: 'Contribution and update model',
      title: 'Registry and operational monitoring',
      lead: 'The observatory starts from a curated public census. Catalogued sources become operational only after human review of scope, authority, methodology and evidence role; the calendar therefore uses evidence-ready sources only.',
      action: 'Roadmap queue',
    },
    discovery: {
      eyebrow: 'Explore',
      activeCategories: (count) => `${count} active monitoring categories`,
      lead: 'The Atlas places the Observatory beside the evidence console, quality and trust surfaces, methodology and roadmap.',
      action: 'Open the site Atlas',
    },
    filters: {
      categories: {
        all: 'All',
        ai: 'AI governance',
        privacy: 'Privacy enforcement',
        standards: 'Standards',
        events: 'Events',
        regulatory: 'Regulatory updates',
      },
      regions: {
        'region-all': 'All',
        global: 'Global',
        eu: 'EU',
        us: 'US',
        uk: 'United Kingdom',
      },
    },
    urgency: {
      high: 'High priority',
      medium: 'Active monitoring',
      watch: 'Standard monitoring',
      scheduled: 'Scheduled',
    },
    state: {
      'In force': 'In force',
      Guidance: 'Guidance',
      Event: 'Event',
    },
    category: {
      'AI governance': 'AI governance',
      'privacy enforcement': 'Privacy enforcement',
      standards: 'Standards',
      events: 'Events',
      'regulatory updates': 'Regulatory updates',
    },
    sourceKind: {
      observatory: 'Observatory',
      authority: 'Authority / regulator',
      'standards-hub': 'Standards / implementation hub',
      repository: 'Repository / archive',
      tracker: 'Tracker / monitoring',
    },
    evidenceRole: {
      'policy-context': 'Policy context',
      'binding-implementation': 'Binding implementation',
      enforcement: 'Enforcement',
      'standards-implementation': 'Standards and implementation',
      'research-context': 'Research and context',
    },
    region: {
      'European Union': 'European Union',
      'United States': 'United States',
      'United Kingdom': 'United Kingdom',
      Global: 'Global',
    },
    countdown: {
      Tomorrow: 'Tomorrow',
      Today: 'Today',
      'Review due': 'Review due',
    },
    sourceAuthority: {
      'oecd-ai': 'Intergovernmental policy observatory',
      'edpb-news': 'EU data protection body',
      'eu-ai-office': 'European Commission AI governance office',
      'ftc-tech': 'US consumer protection agency',
      'uk-ico': 'UK information rights regulator',
      'nist-airc': 'US standards and measurement institute',
      'ieee-isope': 'Standards and policy engineering community',
      'ai-observatory': 'Independent/research observatory',
    },
    fallback: {
      observatory: 'Observatory',
      manualReview: 'Manual review',
      calendarReview: 'Calendar review',
      openInNewTab: (sourceName) => `Open ${sourceName} in a new tab`,
    },
  },
  it: {
    verifiedAtLabel: '17 agosto 2026',
    navigation: {
      ariaLabel: 'Navigazione osservatorio',
      back: 'Console evidenze',
      atlas: 'Atlante',
      trust: 'Fiducia',
      roadmap: 'Roadmap',
    },
    hero: {
      eyebrow: 'Meta-osservatorio · monitoraggio operativo',
      title: 'Osservatorio su policy, privacy e IA',
      lead: 'Mettiamo ordine tra osservatori, autorità, hub di standard e repository: censiamo le fonti, normalizziamo il loro ruolo e leggiamo convergenze, divergenze e punti ciechi prima di tradurli in segnali operativi.',
      freshness: (verifiedAtLabel) => `Registro esistente verificato ${verifiedAtLabel} · AI Observatory censita con metodologia in source review · nessuna ingestione automatica.`,
      metaAction: 'Esplora il meta-livello',
      sourcesAction: 'Registro delle fonti',
      augustAction: 'Aggiornamento agosto',
      watchAction: 'Monitoraggio operativo',
      nextReview: 'Prossima revisione',
      summaryAriaLabel: 'Riepilogo osservatorio',
      censusLabel: 'Fonti censite',
      censusNote: 'Osservatori, autorità e hub normalizzati',
      evidenceReadyLabel: 'Evidence-ready',
      evidenceReadyNote: 'Verificate per contribuire ai segnali',
      sourceReviewLabel: 'Source review',
      sourceReviewNote: 'Censita, ma fuori dalle conclusioni operative',
      lensesLabel: 'Lenti trasversali',
      lensesNote: 'Convergenza · divergenza · punto cieco',
    },
    operations: {
      ariaLabel: 'Modello operativo dell’osservatorio',
      evidenceLabel: 'Evidence gate',
      evidenceValue: 'Censita ≠ verificata ≠ evidence-ready',
      metaLabel: 'Livello meta',
      metaValue: 'Inferenza tra fonti, mai sintesi da una sola fonte',
      operationalLabel: 'Livello operativo',
      operationalValue: (upcomingCount, highPriorityCount) => `${upcomingCount} review future · ${highPriorityCount} ad alta priorità`,
    },
    meta: {
      eyebrow: 'Meta-osservatorio',
      title: 'Registro degli osservatori',
      lead: 'Non un altro feed, ma una mappa ragionata dell’ecosistema: chi produce contesto, chi definisce obblighi, chi fa enforcement e chi aiuta a implementarli. Gli insight qui sotto sono inferenze sul catalogo, non fatti regolatori autonomi.',
      processAriaLabel: 'Processo del meta-osservatorio',
      process: [
        { title: 'Censire', description: 'Individuare osservatori, autorità, standard hub e repository rilevanti.' },
        { title: 'Normalizzare', description: 'Separare classe, regione, ruolo probatorio e stato di verifica.' },
        { title: 'Triangolare', description: 'Leggere relazioni e scarti tra fonti indipendenti, senza appiattirle.' },
        { title: 'Tradurre', description: 'Portare nel watch board solo ciò che supera controllo umano ed evidence gate.' },
      ],
      gateAriaLabel: 'Evidence gate del meta-osservatorio',
      gateEyebrow: 'La soglia visibile',
      gateValue: 'catalogued ≠ verified ≠ evidence-ready',
      catalogued: 'Censite',
      cataloguedNote: 'Presenza nel registro',
      verified: 'Verificate',
      verifiedNote: 'Identità e ruolo revisionati',
      evidenceReady: 'Evidence-ready',
      evidenceReadyNote: 'Ammesse alla sintesi operativa',
      gateNote: 'Una fonte in source review resta visibile nel censimento, ma non genera claim né può essere usata come unica evidenza.',
      insightsAriaLabel: 'Insight trasversali del censimento',
      implication: 'Implicazione',
      comparedSources: 'Fonti nel confronto',
      reviewSuffix: 'review',
      trustLabel: 'Regola di fiducia:',
      trustNote: 'nessuna sintesi da fonte singola. Le fonti in source review restano nel catalogo, ma non contribuiscono a conclusioni operative.',
    },
    ledger: {
      eyebrow: 'Censimento fonti · registro delle evidenze',
      title: 'Tipi di fonte e soglie di evidenza',
      lead: 'Il registro rende confrontabili fonti diverse senza dichiararle equivalenti. AI Observatory è inclusa con stato Source review: visibile, ma non evidence-ready.',
      ariaLabel: 'Censimento fonti e stato di evidenza',
      source: 'Fonte',
      sourceClass: 'Classe',
      region: 'Regione',
      evidenceRole: 'Ruolo probatorio',
      evidenceGate: 'Evidence gate',
      access: 'Accesso',
      sourceReview: 'Source review',
      verified: 'Verificata',
      evidenceReady: 'Evidence-ready',
      notEvidenceReady: 'Non evidence-ready',
      publicWeb: 'Web pubblico',
    },
    august: {
      eyebrow: 'Aggiornamento applicabilità · verificato il 17 agosto 2026',
      title: 'Aggiornamenti AI Act UE',
      lead: 'Sono obblighi applicabili e milestone di enforcement, non proposte in monitoraggio. Ogni voce rimanda alla fonte della Commissione europea usata per la verifica.',
      officialSource: 'Fonte ufficiale',
    },
    board: {
      eyebrow: 'Monitoraggio attivo',
      title: 'Calendario delle revisioni',
      lead: 'Le prossime revisioni sono ordinate per data; quelle scadute restano visibili con il contesto della fonte e l’azione richiesta.',
      filtersAriaLabel: 'Filtri dell’osservatorio',
      category: 'Categoria',
      region: 'Regione',
      source: 'Fonte',
      review: 'Revisione',
      openSource: 'Fonte',
      addToCalendar: 'Aggiungi al calendario',
    },
    method: {
      ariaLabel: 'Metodologia dell’osservatorio',
      eyebrow: 'Modello di contributo e aggiornamento',
      title: 'Registro e monitoraggio operativo',
      lead: 'L’osservatorio parte da un censimento pubblico curato. Le fonti censite diventano operative solo dopo la revisione umana di ambito, autorità, metodologia e ruolo probatorio; il calendario usa quindi solo fonti evidence-ready.',
      action: 'Coda della roadmap',
    },
    discovery: {
      eyebrow: 'Esplorazione',
      activeCategories: (count) => `${count} categorie di monitoraggio attive`,
      lead: 'L’Atlante colloca l’Osservatorio accanto alla console delle evidenze, alle superfici di qualità e fiducia, alla metodologia e alla roadmap.',
      action: 'Apri l’Atlante del sito',
    },
    filters: {
      categories: {
        all: 'Tutte',
        ai: 'Governance IA',
        privacy: 'Enforcement privacy',
        standards: 'Standard',
        events: 'Eventi',
        regulatory: 'Aggiornamenti regolatori',
      },
      regions: {
        'region-all': 'Tutte',
        global: 'Globali',
        eu: 'UE',
        us: 'USA',
        uk: 'Regno Unito',
      },
    },
    urgency: {
      high: 'Priorità alta',
      medium: 'Monitoraggio attivo',
      watch: 'Monitoraggio standard',
      scheduled: 'Pianificato',
    },
    state: {
      'In force': 'In vigore',
      Guidance: 'Linea guida',
      Event: 'Evento',
    },
    category: {
      'AI governance': 'Governance IA',
      'privacy enforcement': 'Enforcement privacy',
      standards: 'Standard',
      events: 'Eventi',
      'regulatory updates': 'Aggiornamenti regolatori',
    },
    sourceKind: {
      observatory: 'Osservatorio',
      authority: 'Autorità / regulator',
      'standards-hub': 'Standard / implementation hub',
      repository: 'Repository / archivio',
      tracker: 'Tracker / monitoraggio',
    },
    evidenceRole: {
      'policy-context': 'Contesto policy',
      'binding-implementation': 'Attuazione vincolante',
      enforcement: 'Enforcement',
      'standards-implementation': 'Standard e implementazione',
      'research-context': 'Ricerca e contesto',
    },
    region: {
      'European Union': 'Unione europea',
      'United States': 'Stati Uniti',
      'United Kingdom': 'Regno Unito',
      Global: 'Globale',
    },
    countdown: {
      Tomorrow: 'Domani',
      Today: 'Oggi',
      'Review due': 'Revisione scaduta',
    },
    sourceAuthority: {
      'oecd-ai': 'Osservatorio intergovernativo sulle politiche',
      'edpb-news': 'Organismo UE per la protezione dei dati',
      'eu-ai-office': 'Ufficio della Commissione europea per la governance dell’IA',
      'ftc-tech': 'Agenzia statunitense per la tutela dei consumatori',
      'uk-ico': 'Autorità britannica per i diritti informativi',
      'nist-airc': 'Istituto statunitense per standard e misurazione',
      'ieee-isope': 'Comunità di standard e policy engineering',
      'ai-observatory': 'Osservatorio indipendente / di ricerca',
    },
    fallback: {
      observatory: 'Osservatorio',
      manualReview: 'Revisione manuale',
      calendarReview: 'Revisione calendario',
      openInNewTab: (sourceName) => `Apri ${sourceName} in una nuova scheda`,
    },
  },
};

const categoryFilters: Array<{ id: string; category?: ObservatoryContentType }> = [
  { id: 'all' },
  { id: 'ai', category: 'AI governance' },
  { id: 'privacy', category: 'privacy enforcement' },
  { id: 'standards', category: 'standards' },
  { id: 'events', category: 'events' },
  { id: 'regulatory', category: 'regulatory updates' },
];

const regionFilters = ['region-all', 'global', 'eu', 'us', 'uk'] as const;

const eventSourceIds: Record<string, string> = {
  'ieee-isope-2026-programme-review': 'ieee-isope',
  'eu-ai-office-monthly-review': 'eu-ai-office',
};

const augustInForceSignals = observatorySignals.filter(
  (signal) => signal.state === 'In force' && signal.publishedOn.startsWith('2026-08'),
);

function getFilterClass(category: ObservatoryContentType) {
  const categoryClasses: Record<ObservatoryContentType, string> = {
    'AI governance': styles.categoryAi,
    'privacy enforcement': styles.categoryPrivacy,
    standards: styles.categoryStandards,
    events: styles.categoryEvents,
    'regulatory updates': styles.categoryRegulatory,
  };

  return categoryClasses[category];
}

function getRegionClasses(region: string) {
  const normalized = region.toLowerCase();
  const classes: string[] = [];

  if (normalized.includes('global')) classes.push(styles.regionGlobal);
  if (normalized.includes('european union') || normalized.includes('eu')) classes.push(styles.regionEu);
  if (normalized.includes('united states') || normalized.includes('us')) classes.push(styles.regionUs);
  if (normalized.includes('united kingdom') || normalized.includes('uk')) classes.push(styles.regionUk);

  return classes;
}

function formatCalendarHref(event: ObservatoryEvent, locale: Locale) {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(buildObservatoryIcs(event, locale))}`;
}

function parseIcsDate(value: string) {
  const year = value.slice(0, 4);
  const month = value.slice(4, 6);
  const day = value.slice(6, 8);
  const hour = value.slice(9, 11);
  const minute = value.slice(11, 13);
  const second = value.slice(13, 15);

  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
}

function formatBoardDate(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'it' ? 'it-IT' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function localizeCountdown(value: string, copy: ObservatoryPageCopy) {
  return copy.countdown[value] ?? value;
}

function localizeRegion(region: string, copy: ObservatoryPageCopy) {
  return copy.region[region] ?? region;
}

function buildWatchItems(now: Date, locale: Locale, copy: ObservatoryPageCopy): WatchItem[] {
  const signalItems = observatorySignals.map((signal): WatchItem => {
    const source = getObservatorySource(signal.sourceId);
    const reviewDate = parseIcsDate(signal.reviewUtc);

    return {
      id: signal.id,
      title: signal.title[locale],
      summary: signal.summary[locale],
      sourceName: source?.shortName ?? copy.fallback.observatory,
      sourceHref: signal.sourceUrl,
      category: signal.contentType,
      region: signal.region,
      cadence: source?.reviewCadence[locale] ?? copy.fallback.manualReview,
      dateLabel: signal.state === 'In force' ? signal.dateLabel[locale] : formatBoardDate(reviewDate, locale),
      timeLabel: signal.reviewTimeLabel[locale],
      countdown: localizeCountdown(getObservatoryCountdown(reviewDate, now), copy),
      urgency: signal.priority,
      state: signal.state,
      deadlineAt: reviewDate.getTime(),
    };
  });

  const eventItems = observatoryEvents.map((event): WatchItem => {
    const source = getObservatorySource(eventSourceIds[event.id]);
    const eventDate = parseIcsDate(event.calendar.startUtc);

    return {
      id: event.id,
      title: event.title[locale],
      summary: event.summary[locale],
      sourceName: source?.shortName ?? event.organizer,
      sourceHref: event.href,
      category: 'events',
      region: source?.region ?? event.location[locale],
      cadence: source?.reviewCadence[locale] ?? copy.fallback.calendarReview,
      dateLabel: event.dateLabel[locale],
      timeLabel: event.timeLabel[locale],
      countdown: localizeCountdown(getObservatoryCountdown(eventDate, now), copy),
      urgency: 'scheduled',
      state: 'Event',
      deadlineAt: eventDate.getTime(),
      event,
    };
  });

  return [...signalItems, ...eventItems].sort((a, b) => compareObservatoryDeadlines(a, b, now));
}

function SourceLedgerSection({ locale, copy }: { locale: Locale; copy: ObservatoryPageCopy }) {
  return (
    <section id="sources" className={styles.section}>
      <div className={styles.sectionHeader}>
        <span>
          <BookOpen size={15} />
          {copy.ledger.eyebrow}
        </span>
        <h2>{copy.ledger.title}</h2>
        <p>{copy.ledger.lead}</p>
      </div>

      <div className={styles.sourceLedger} aria-label={copy.ledger.ariaLabel}>
        <div className={styles.ledgerHeader} aria-hidden="true">
          <span>{copy.ledger.source}</span>
          <span>{copy.ledger.sourceClass}</span>
          <span>{copy.ledger.region}</span>
          <span>{copy.ledger.evidenceRole}</span>
          <span>{copy.ledger.evidenceGate}</span>
          <span>{copy.ledger.access}</span>
        </div>
        {observatorySources.map((source) => (
          <article key={source.id} id={`source-${source.id}`} className={styles.ledgerRow} data-status={source.evidenceStatus}>
            <div className={styles.sourceIdentity}>
              <span className={styles.mobileLabel}>{copy.ledger.source}</span>
              <h3>{source.name}</h3>
              <p>{source.note[locale]}</p>
              <small>{copy.sourceAuthority[source.id] ?? source.authority} · {source.lastReviewLabel[locale]}</small>
              <div className={styles.typeList}>
                {source.contentTypes.map((type) => <span key={type}>{copy.category[type]}</span>)}
              </div>
            </div>
            <div className={styles.ledgerCell}>
              <span className={styles.mobileLabel}>{copy.ledger.sourceClass}</span>
              <strong>{copy.sourceKind[source.kind]}</strong>
            </div>
            <div className={styles.ledgerCell}>
              <span className={styles.mobileLabel}>{copy.ledger.region}</span>
              <strong>{localizeRegion(source.region, copy)}</strong>
            </div>
            <div className={styles.ledgerCell}>
              <span className={styles.mobileLabel}>{copy.ledger.evidenceRole}</span>
              <strong>{copy.evidenceRole[source.evidenceRole]}</strong>
            </div>
            <div className={styles.ledgerCell}>
              <span className={styles.mobileLabel}>{copy.ledger.evidenceGate}</span>
              <span className={styles.evidenceStatus} data-status={source.evidenceStatus}>
                {source.evidenceStatus === 'source-review' ? copy.ledger.sourceReview : copy.ledger.verified}
              </span>
              <small>{source.evidenceReady ? copy.ledger.evidenceReady : copy.ledger.notEvidenceReady}</small>
            </div>
            <div className={`${styles.ledgerCell} ${styles.ledgerAccess}`}>
              <span className={styles.mobileLabel}>{copy.ledger.access}</span>
              <a href={source.url} target="_blank" rel="noopener noreferrer" aria-label={copy.fallback.openInNewTab(source.name)}>
                {copy.ledger.publicWeb}
                <ExternalLink size={15} />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function ObservatoryPage() {
  const globalContext = useGlobalContext('en');
  const locale: Locale = globalContext.lang;
  const copy = observatoryPageCopy[locale];
  const now = new Date();
  const watchItems = buildWatchItems(now, locale, copy);
  const nextItem = watchItems[0];
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const upcomingCount = watchItems.filter((item) => item.deadlineAt >= todayUtc).length;
  const highPriorityCount = watchItems.filter((item) => item.urgency === 'high').length;
  const activeCategories = new Set(watchItems.map((item) => item.category)).size;
  const metaMetrics = getMetaObservatoryMetrics();

  return (
    <>
      <PublicHeader current="observatory" lang={locale} />
      <main className={styles.page}>
        <section className={styles.hero}>
          <nav className={styles.topbar} aria-label={copy.navigation.ariaLabel}>
            <Link href="/" className={styles.backLink}>
              <ArrowLeft size={16} />
              {copy.navigation.back}
            </Link>
            <div className={styles.topbarLinks}>
              <Link href="/atlas">{copy.navigation.atlas}</Link>
              <Link href="/trust">{copy.navigation.trust}</Link>
              <Link href="/roadmap">{copy.navigation.roadmap}</Link>
            </div>
          </nav>

          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>
                <Radio size={15} />
                {copy.hero.eyebrow}
              </span>
              <h1>{copy.hero.title}</h1>
              <p>{copy.hero.lead}</p>
              <p className={styles.freshnessNote}>{copy.hero.freshness(copy.verifiedAtLabel)}</p>
              <div className={styles.heroActions}>
                <Link href="#meta-observatory" className={styles.primaryAction}>
                  {copy.hero.metaAction}
                  <ArrowRight size={15} />
                </Link>
                <Link href="#sources" className={styles.secondaryAction}>
                  {copy.hero.sourcesAction}
                  <ArrowRight size={15} />
                </Link>
                <Link href="#august-update" className={styles.secondaryAction}>
                  {copy.hero.augustAction}
                  <ArrowRight size={15} />
                </Link>
                <Link href="#watch-board" className={styles.secondaryAction}>
                  {copy.hero.watchAction}
                  <ArrowRight size={15} />
                </Link>
              </div>

              {nextItem && (
                <article className={styles.nextUpCard}>
                  <span>{copy.hero.nextReview}</span>
                  <strong>{nextItem.title}</strong>
                  <p>{nextItem.countdown} · {nextItem.dateLabel} · {nextItem.sourceName}</p>
                </article>
              )}
            </div>

            <div className={styles.summaryGrid} aria-label={copy.hero.summaryAriaLabel}>
              <article>
                <span>{copy.hero.censusLabel}</span>
                <strong>{metaMetrics.censusSources}</strong>
                <small>{copy.hero.censusNote}</small>
              </article>
              <article>
                <span>{copy.hero.evidenceReadyLabel}</span>
                <strong>{metaMetrics.evidenceReadySources}</strong>
                <small>{copy.hero.evidenceReadyNote}</small>
              </article>
              <article>
                <span>{copy.hero.sourceReviewLabel}</span>
                <strong>{metaMetrics.sourcesUnderReview}</strong>
                <small>{copy.hero.sourceReviewNote}</small>
              </article>
              <article>
                <span>{copy.hero.lensesLabel}</span>
                <strong>{metaMetrics.insightLenses}</strong>
                <small>{copy.hero.lensesNote}</small>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.opsStrip} aria-label={copy.operations.ariaLabel}>
          <article>
            <ShieldCheck size={18} />
            <div>
              <span>{copy.operations.evidenceLabel}</span>
              <strong>{copy.operations.evidenceValue}</strong>
            </div>
          </article>
          <article>
            <Clock size={18} />
            <div>
              <span>{copy.operations.metaLabel}</span>
              <strong>{copy.operations.metaValue}</strong>
            </div>
          </article>
          <article>
            <CalendarCheck size={18} />
            <div>
              <span>{copy.operations.operationalLabel}</span>
              <strong>{copy.operations.operationalValue(upcomingCount, highPriorityCount)}</strong>
            </div>
          </article>
        </section>

        <section id="meta-observatory" className={styles.metaSection} aria-labelledby="meta-observatory-title">
          <header className={styles.metaHeader}>
            <div>
              <span className={styles.eyebrow}>
                <BookOpen size={15} />
                {copy.meta.eyebrow}
              </span>
              <h2 id="meta-observatory-title">{copy.meta.title}</h2>
            </div>
            <p>{copy.meta.lead}</p>
          </header>

          <ol className={styles.processRail} aria-label={copy.meta.processAriaLabel}>
            {copy.meta.process.map((step, index) => (
              <li key={step.title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{step.title}</strong>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>

          <aside className={styles.evidenceGate} aria-label={copy.meta.gateAriaLabel}>
            <div className={styles.gateTitle}>
              <ShieldCheck size={20} />
              <div>
                <span>{copy.meta.gateEyebrow}</span>
                <strong>{copy.meta.gateValue}</strong>
              </div>
            </div>
            <div className={styles.gateStages}>
              <div>
                <span>{metaMetrics.censusSources}</span>
                <strong>{copy.meta.catalogued}</strong>
                <small>{copy.meta.cataloguedNote}</small>
              </div>
              <div>
                <span>{metaMetrics.verifiedSources}</span>
                <strong>{copy.meta.verified}</strong>
                <small>{copy.meta.verifiedNote}</small>
              </div>
              <div>
                <span>{metaMetrics.evidenceReadySources}</span>
                <strong>{copy.meta.evidenceReady}</strong>
                <small>{copy.meta.evidenceReadyNote}</small>
              </div>
            </div>
            <p>{copy.meta.gateNote}</p>
          </aside>

          <div className={styles.insightLedger} aria-label={copy.meta.insightsAriaLabel}>
            {observatoryMetaInsights.map((insight, index) => (
              <article key={insight.id} className={styles.insightRow} data-lens={insight.lens}>
                <div className={styles.insightMarker}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{insight.eyebrow[locale]}</strong>
                </div>
                <div className={styles.insightCopy}>
                  <h3>{insight.title[locale]}</h3>
                  <p>{insight.summary[locale]}</p>
                  <div className={styles.implication}>
                    <span>{copy.meta.implication}</span>
                    <strong>{insight.implication[locale]}</strong>
                  </div>
                </div>
                <div className={styles.insightSources}>
                  <span>{copy.meta.comparedSources}</span>
                  <div>
                    {insight.sourceIds.map((sourceId) => {
                      const source = getObservatorySource(sourceId);
                      if (!source) return null;
                      return (
                        <a key={source.id} href={`#source-${source.id}`} data-review={source.evidenceStatus === 'source-review'}>
                          {source.shortName}
                          {source.evidenceStatus === 'source-review' ? ` · ${copy.meta.reviewSuffix}` : ''}
                        </a>
                      );
                    })}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <p className={styles.trustAnnotation}>
            <ShieldCheck size={17} />
            <strong>{copy.meta.trustLabel}</strong> {copy.meta.trustNote}
          </p>
        </section>

        <SourceLedgerSection locale={locale} copy={copy} />

        <section id="august-update" className={styles.augustUpdate}>
          <header>
            <div>
              <span>{copy.august.eyebrow}</span>
              <h2>{copy.august.title}</h2>
            </div>
            <p>{copy.august.lead}</p>
          </header>
          <div className={styles.augustUpdateList}>
            {augustInForceSignals.map((signal, index) => {
              const source = getObservatorySource(signal.sourceId);
              return (
                <article key={signal.id}>
                  <div className={styles.augustIndex}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{signal.dateLabel[locale]}</strong>
                  </div>
                  <div>
                    <span className={styles.statePill} data-state="in-force">{copy.state[signal.state]}</span>
                    <h3>{signal.title[locale]}</h3>
                    <p>{signal.summary[locale]}</p>
                  </div>
                  <a href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={copy.fallback.openInNewTab(source?.shortName ?? copy.august.officialSource)}>
                    {source?.shortName ?? copy.august.officialSource}
                    <ExternalLink size={14} />
                  </a>
                </article>
              );
            })}
          </div>
        </section>

        <section id="watch-board" className={styles.boardSection}>
          <div>
            <span className={styles.eyebrow}>
              <Filter size={15} />
              {copy.board.eyebrow}
            </span>
            <h2>{copy.board.title}</h2>
            <p>{copy.board.lead}</p>
          </div>

          <div className={styles.filterShell}>
            <input id="filter-all" className={styles.filterInput} type="radio" name="watch-category-filter" defaultChecked />
            <input id="filter-ai" className={styles.filterInput} type="radio" name="watch-category-filter" />
            <input id="filter-privacy" className={styles.filterInput} type="radio" name="watch-category-filter" />
            <input id="filter-standards" className={styles.filterInput} type="radio" name="watch-category-filter" />
            <input id="filter-events" className={styles.filterInput} type="radio" name="watch-category-filter" />
            <input id="filter-regulatory" className={styles.filterInput} type="radio" name="watch-category-filter" />
            <input id="filter-region-all" className={styles.filterInput} type="radio" name="watch-region-filter" defaultChecked />
            <input id="filter-global" className={styles.filterInput} type="radio" name="watch-region-filter" />
            <input id="filter-eu" className={styles.filterInput} type="radio" name="watch-region-filter" />
            <input id="filter-us" className={styles.filterInput} type="radio" name="watch-region-filter" />
            <input id="filter-uk" className={styles.filterInput} type="radio" name="watch-region-filter" />

            <div className={styles.filterToolbar} aria-label={copy.board.filtersAriaLabel}>
              <div>
                <span>{copy.board.category}</span>
                <div className={styles.filterGroup}>
                  {categoryFilters.map((filter) => (
                    <label key={filter.id} htmlFor={`filter-${filter.id}`}>
                      {copy.filters.categories[filter.id]}
                      <small>
                        {filter.category
                          ? watchItems.filter((item) => item.category === filter.category).length
                          : watchItems.length}
                      </small>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <span>{copy.board.region}</span>
                <div className={`${styles.filterGroup} ${styles.regionFilters}`}>
                  {regionFilters.map((filterId) => (
                    <label key={filterId} htmlFor={`filter-${filterId}`}>
                      {copy.filters.regions[filterId]}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.boardList}>
              {watchItems.map((item, index) => {
                const itemClasses = [
                  styles.watchCard,
                  getFilterClass(item.category),
                  ...getRegionClasses(item.region),
                ].join(' ');

                return (
                  <article key={item.id} className={itemClasses} data-urgency={item.urgency}>
                    <div className={styles.watchIndex}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <strong>{item.countdown}</strong>
                    </div>

                    <div className={styles.watchMain}>
                      <div className={styles.watchTitleRow}>
                        <div>
                          <div className={styles.watchStatusGroup}>
                            <span className={styles.statusPill}>{copy.urgency[item.urgency]}</span>
                            <span className={styles.statePill} data-state={item.state.toLowerCase().replace(' ', '-')}>{copy.state[item.state]}</span>
                          </div>
                          <h3>{item.title}</h3>
                        </div>
                        <a href={item.sourceHref} target="_blank" rel="noopener noreferrer" aria-label={copy.fallback.openInNewTab(item.sourceName)}>
                          <ExternalLink size={16} />
                        </a>
                      </div>
                      <p>{item.summary}</p>

                      <dl className={styles.watchMeta}>
                        <div>
                          <dt>{copy.board.source}</dt>
                          <dd>{item.sourceName}</dd>
                        </div>
                        <div>
                          <dt>{copy.board.category}</dt>
                          <dd>{copy.category[item.category]}</dd>
                        </div>
                        <div>
                          <dt>{copy.board.region}</dt>
                          <dd>{localizeRegion(item.region, copy)}</dd>
                        </div>
                        <div>
                          <dt>{copy.board.review}</dt>
                          <dd>{item.cadence}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className={styles.watchDue}>
                      <span>{item.dateLabel}</span>
                      <strong>{item.timeLabel}</strong>
                      <div className={styles.watchActions}>
                        <a href={item.sourceHref} target="_blank" rel="noopener noreferrer" aria-label={copy.fallback.openInNewTab(item.sourceName)}>
                          <ExternalLink size={14} />
                          {copy.board.openSource}
                        </a>
                        {item.event && (
                          <a
                            href={globalContext.ready ? formatCalendarHref(item.event, locale) : undefined}
                            download={item.event.calendar.filename}
                            aria-disabled={!globalContext.ready}
                          >
                            <FileDown size={14} />
                            {copy.board.addToCalendar}
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className={styles.methodNote} aria-label={copy.method.ariaLabel}>
          <div className={styles.noteIcon}>
            <ListChecks size={20} />
          </div>
          <div>
            <span>{copy.method.eyebrow}</span>
            <h2>{copy.method.title}</h2>
            <p>{copy.method.lead}</p>
          </div>
          <Link href="/roadmap" className={styles.secondaryAction}>
            {copy.method.action}
            <ArrowRight size={15} />
          </Link>
        </section>

        <section className={styles.discoveryBand}>
          <div>
            <span>
              <Globe2 size={15} />
              {copy.discovery.eyebrow}
            </span>
            <h2>{copy.discovery.activeCategories(activeCategories)}</h2>
            <p>{copy.discovery.lead}</p>
          </div>
          <Link href="/atlas" className={styles.primaryAction}>
            {copy.discovery.action}
            <ArrowRight size={15} />
          </Link>
        </section>
      </main>
      <Footer lang={locale} />
    </>
  );
}
