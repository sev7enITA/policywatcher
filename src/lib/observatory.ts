export type Locale = 'en' | 'it';

export type LocalizedText = Record<Locale, string>;

export const OBSERVATORY_VERIFIED_AT = '17 August 2026' as const;

export type ObservatoryContentType =
  | 'regulatory updates'
  | 'AI governance'
  | 'privacy enforcement'
  | 'standards'
  | 'events';

export type ObservatorySourceKind =
  | 'observatory'
  | 'authority'
  | 'standards-hub'
  | 'repository'
  | 'tracker';

export type ObservatoryEvidenceStatus = 'verified' | 'source-review';

export type ObservatoryEvidenceRole =
  | 'policy-context'
  | 'binding-implementation'
  | 'enforcement'
  | 'standards-implementation'
  | 'research-context';

export interface ObservatorySource {
  id: string;
  name: string;
  shortName: string;
  url: string;
  region: string;
  authority: string;
  kind: ObservatorySourceKind;
  evidenceStatus: ObservatoryEvidenceStatus;
  evidenceRole: ObservatoryEvidenceRole;
  evidenceReady: boolean;
  lastReviewLabel: LocalizedText;
  accessCapability?: 'public-web';
  contentTypes: ObservatoryContentType[];
  reviewCadence: LocalizedText;
  note: LocalizedText;
}

export type ObservatoryInsightLens = 'convergence' | 'divergence' | 'blind-spot';

export interface ObservatoryMetaInsight {
  id: string;
  lens: ObservatoryInsightLens;
  eyebrow: LocalizedText;
  title: LocalizedText;
  summary: LocalizedText;
  implication: LocalizedText;
  sourceIds: string[];
  evidenceBoundary: 'catalog-inference';
}

export interface ObservatorySignal {
  id: string;
  sourceId: string;
  title: LocalizedText;
  summary: LocalizedText;
  contentType: ObservatoryContentType;
  region: string;
  dateLabel: LocalizedText;
  sourceUrl: string;
  publishedOn: string;
  reviewUtc: string;
  reviewTimeLabel: LocalizedText;
  localHref: string;
  priority: 'high' | 'medium' | 'watch';
  state: 'In force' | 'Guidance';
}

export interface ObservatoryEvent {
  id: string;
  title: LocalizedText;
  organizer: string;
  dateLabel: LocalizedText;
  timeLabel: LocalizedText;
  location: LocalizedText;
  summary: LocalizedText;
  href: string;
  calendar: {
    startUtc: string;
    endUtc: string;
    filename: string;
  };
}

export function getObservatoryCountdown(targetDate: Date, now: Date) {
  const targetUtc = Date.UTC(
    targetDate.getUTCFullYear(),
    targetDate.getUTCMonth(),
    targetDate.getUTCDate()
  );
  const nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.round((targetUtc - nowUtc) / 86_400_000);

  if (days > 1) return `D-${days}`;
  if (days === 1) return 'Tomorrow';
  if (days === 0) return 'Today';
  return 'Review due';
}

export function compareObservatoryDeadlines(
  a: { id: string; deadlineAt: number },
  b: { id: string; deadlineAt: number },
  now: Date
) {
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const aOverdue = a.deadlineAt < todayUtc;
  const bOverdue = b.deadlineAt < todayUtc;

  if (aOverdue !== bOverdue) return aOverdue ? 1 : -1;
  const dateOrder = aOverdue
    ? b.deadlineAt - a.deadlineAt
    : a.deadlineAt - b.deadlineAt;
  return dateOrder || a.id.localeCompare(b.id);
}

export interface DashboardNotice {
  id: string;
  label: LocalizedText;
  message: LocalizedText;
  href: string;
  tone: 'teal' | 'indigo' | 'amber';
}

export const observatorySources: ObservatorySource[] = [
  {
    id: 'oecd-ai',
    name: 'OECD.AI Policy Observatory',
    shortName: 'OECD.AI',
    url: 'https://oecd.ai/',
    region: 'Global',
    authority: 'Intergovernmental policy observatory',
    kind: 'observatory',
    evidenceStatus: 'verified',
    evidenceRole: 'policy-context',
    evidenceReady: true,
    lastReviewLabel: { en: OBSERVATORY_VERIFIED_AT, it: '17 agosto 2026' },
    accessCapability: 'public-web',
    contentTypes: ['AI governance', 'regulatory updates', 'events'],
    reviewCadence: {
      en: 'Reviewed during monthly governance sweeps',
      it: 'Rivisto nei cicli mensili di governance',
    },
    note: {
      en: 'Country policy resources and AI policy analysis for cross-market context.',
      it: 'Risorse paese e analisi policy AI per contesto multi-mercato.',
    },
  },
  {
    id: 'edpb-news',
    name: 'EDPB News',
    shortName: 'EDPB',
    url: 'https://www.edpb.europa.eu/news_en',
    region: 'European Union',
    authority: 'EU data protection body',
    kind: 'authority',
    evidenceStatus: 'verified',
    evidenceRole: 'enforcement',
    evidenceReady: true,
    lastReviewLabel: { en: OBSERVATORY_VERIFIED_AT, it: '17 agosto 2026' },
    accessCapability: 'public-web',
    contentTypes: ['privacy enforcement', 'regulatory updates', 'events'],
    reviewCadence: {
      en: 'Reviewed during EU privacy sweeps',
      it: 'Rivisto nei cicli privacy UE',
    },
    note: {
      en: 'Board news, coordinated enforcement updates and guidance signals.',
      it: 'News del comitato, aggiornamenti enforcement coordinato e segnali guida.',
    },
  },
  {
    id: 'eu-ai-office',
    name: 'European AI Office',
    shortName: 'EU AI Office',
    url: 'https://digital-strategy.ec.europa.eu/en/policies/ai-office',
    region: 'European Union',
    authority: 'European Commission AI governance office',
    kind: 'authority',
    evidenceStatus: 'verified',
    evidenceRole: 'binding-implementation',
    evidenceReady: true,
    lastReviewLabel: { en: OBSERVATORY_VERIFIED_AT, it: '17 agosto 2026' },
    accessCapability: 'public-web',
    contentTypes: ['AI governance', 'regulatory updates', 'events'],
    reviewCadence: {
      en: 'Reviewed during EU AI Act monitoring',
      it: 'Rivisto nel monitoraggio EU AI Act',
    },
    note: {
      en: 'AI Act implementation, model governance and institutional coordination.',
      it: 'Attuazione AI Act, governance dei modelli e coordinamento istituzionale.',
    },
  },
  {
    id: 'ftc-tech',
    name: 'FTC Technology Blog and News',
    shortName: 'FTC',
    url: 'https://www.ftc.gov/news-events/topics/protecting-consumer-privacy-security/privacy-security-enforcement',
    region: 'United States',
    authority: 'US consumer protection agency',
    kind: 'authority',
    evidenceStatus: 'verified',
    evidenceRole: 'enforcement',
    evidenceReady: true,
    lastReviewLabel: { en: OBSERVATORY_VERIFIED_AT, it: '17 agosto 2026' },
    accessCapability: 'public-web',
    contentTypes: ['privacy enforcement', 'AI governance', 'regulatory updates'],
    reviewCadence: {
      en: 'Reviewed during US enforcement sweeps',
      it: 'Rivisto nei cicli enforcement USA',
    },
    note: {
      en: 'Consumer protection, privacy, competition and technology enforcement context.',
      it: 'Contesto su protezione consumatori, privacy, concorrenza e tecnologia.',
    },
  },
  {
    id: 'uk-ico',
    name: 'UK ICO News',
    shortName: 'UK ICO',
    url: 'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/',
    region: 'United Kingdom',
    authority: 'UK information rights regulator',
    kind: 'authority',
    evidenceStatus: 'verified',
    evidenceRole: 'enforcement',
    evidenceReady: true,
    lastReviewLabel: { en: OBSERVATORY_VERIFIED_AT, it: '17 agosto 2026' },
    accessCapability: 'public-web',
    contentTypes: ['privacy enforcement', 'regulatory updates', 'events'],
    reviewCadence: {
      en: 'Reviewed during UK privacy sweeps',
      it: 'Rivisto nei cicli privacy UK',
    },
    note: {
      en: 'Regulatory news, consultation updates and enforcement context for UK data rights.',
      it: 'News regolatorie, consultazioni e enforcement per i diritti dati UK.',
    },
  },
  {
    id: 'nist-airc',
    name: 'NIST AI Resource Center',
    shortName: 'NIST AIRC',
    url: 'https://airc.nist.gov/',
    region: 'United States',
    authority: 'US standards and measurement institute',
    kind: 'standards-hub',
    evidenceStatus: 'verified',
    evidenceRole: 'standards-implementation',
    evidenceReady: true,
    lastReviewLabel: { en: OBSERVATORY_VERIFIED_AT, it: '17 agosto 2026' },
    accessCapability: 'public-web',
    contentTypes: ['standards', 'AI governance', 'events'],
    reviewCadence: {
      en: 'Reviewed during standards sweeps',
      it: 'Rivisto nei cicli standard',
    },
    note: {
      en: 'AI RMF, standards resources and implementation support materials.',
      it: 'AI RMF, risorse standard e materiali di supporto implementativo.',
    },
  },
  {
    id: 'ieee-isope',
    name: 'IEEE ISoPE',
    shortName: 'IEEE ISoPE',
    url: 'https://ieee-isope.org/',
    region: 'Global',
    authority: 'Standards and policy engineering community',
    kind: 'standards-hub',
    evidenceStatus: 'verified',
    evidenceRole: 'standards-implementation',
    evidenceReady: true,
    lastReviewLabel: { en: OBSERVATORY_VERIFIED_AT, it: '17 agosto 2026' },
    accessCapability: 'public-web',
    contentTypes: ['standards', 'events', 'AI governance'],
    reviewCadence: {
      en: 'Reviewed during standards and events sweeps',
      it: 'Rivisto nei cicli standard ed eventi',
    },
    note: {
      en: 'Standards-oriented events and policy engineering references.',
      it: 'Eventi orientati agli standard e riferimenti di policy engineering.',
    },
  },
  {
    id: 'ai-observatory',
    name: 'AI Observatory',
    shortName: 'AI Observatory',
    url: 'https://www.ai-observatory.org/',
    region: 'Global',
    authority: 'Independent/research observatory',
    kind: 'observatory',
    evidenceStatus: 'source-review',
    evidenceRole: 'research-context',
    evidenceReady: false,
    lastReviewLabel: {
      en: 'Catalogued 19 August 2026 · methodology pending',
      it: 'Censita il 19 agosto 2026 · metodologia in revisione',
    },
    accessCapability: 'public-web',
    contentTypes: ['AI governance'],
    reviewCadence: {
      en: 'Source review and methodology assessment pending',
      it: 'Revisione della fonte e valutazione metodologica in corso',
    },
    note: {
      en: 'Its methodology and outputs must pass the PolicyWatcher source gate before they can generate operational signals. It is not used as sole evidence for substantive regulatory claims.',
      it: 'Metodologia e output devono superare il source gate di PolicyWatcher prima di generare segnali operativi. Non viene usata come unica evidenza per affermazioni regolatorie sostanziali.',
    },
  },
];

export const observatoryMetaInsights: ObservatoryMetaInsight[] = [
  {
    id: 'principle-to-proof',
    lens: 'convergence',
    eyebrow: { en: 'Convergence', it: 'Convergenza' },
    title: { en: 'From principle to proof', it: 'Dal principio alla prova' },
    summary: {
      en: 'The census connects policy context, binding implementation and enforcement with standards and implementation support. The catalog-level signal is the relationship between these layers; it is not a claim that every source reaches the same conclusion.',
      it: 'Il censimento collega contesto di policy, attuazione vincolante ed enforcement con standard e supporto implementativo. Il segnale, a livello di catalogo, è la relazione tra questi piani: non significa che tutte le fonti dicano la stessa cosa.',
    },
    implication: {
      en: 'Read a policy theme across authority, enforcement and implementation lenses before turning it into an operational claim.',
      it: 'Leggi ogni tema tra autorità, enforcement e implementazione prima di trasformarlo in una conclusione operativa.',
    },
    sourceIds: ['oecd-ai', 'edpb-news', 'eu-ai-office', 'ftc-tech', 'uk-ico', 'nist-airc', 'ieee-isope'],
    evidenceBoundary: 'catalog-inference',
  },
  {
    id: 'different-clocks-authority',
    lens: 'divergence',
    eyebrow: { en: 'Divergence', it: 'Divergenza' },
    title: { en: 'Different clocks, different authority', it: 'Tempi diversi, autorità diverse' },
    summary: {
      en: 'Regulatory obligations, consultations, standards work and observatory analysis move at different cadences and carry different authority. A single undifferentiated feed would hide those differences.',
      it: 'Obblighi regolatori, consultazioni, standard e analisi degli osservatori si muovono con cadenze e livelli di autorità diversi. Un feed indistinto nasconderebbe proprio queste differenze.',
    },
    implication: {
      en: 'Keep dates, authority and evidence role attached to every update; compare them without flattening them.',
      it: 'Mantieni data, autorità e ruolo probatorio su ogni aggiornamento: confronta le fonti senza appiattirle.',
    },
    sourceIds: ['oecd-ai', 'edpb-news', 'eu-ai-office', 'ftc-tech', 'uk-ico', 'nist-airc', 'ieee-isope'],
    evidenceBoundary: 'catalog-inference',
  },
  {
    id: 'coverage-not-global-yet',
    lens: 'blind-spot',
    eyebrow: { en: 'Blind spot', it: 'Punto cieco' },
    title: { en: 'Coverage is not yet global', it: 'La copertura non è ancora globale' },
    summary: {
      en: 'PolicyWatcher\'s present census includes Global, EU, US and UK entries, but no dedicated authority source for Africa, Latin America or Asia-Pacific. This is a gap in our catalog, not evidence that those regions lack governance activity. AI Observatory is catalogued under source review and cannot close or substantiate those gaps.',
      it: 'Il censimento attuale di PolicyWatcher include fonti Global, UE, USA e UK, ma nessuna autorità dedicata per Africa, America Latina o Asia-Pacifico. È un limite del nostro catalogo, non l’assenza di attività di governance in quelle regioni. AI Observatory è censita ma in source review: non può colmare né provare questi gap.',
    },
    implication: {
      en: 'Prioritize authority-source discovery in the uncovered regions and keep new observatories behind the evidence gate until reviewed.',
      it: 'Dai priorità alla ricerca di fonti istituzionali nelle regioni scoperte e mantieni i nuovi osservatori dietro l’evidence gate fino alla verifica.',
    },
    sourceIds: observatorySources.map((source) => source.id),
    evidenceBoundary: 'catalog-inference',
  },
];

export function getMetaObservatoryMetrics() {
  return {
    censusSources: observatorySources.length,
    verifiedSources: observatorySources.filter((source) => source.evidenceStatus === 'verified').length,
    evidenceReadySources: observatorySources.filter((source) => source.evidenceReady).length,
    sourcesUnderReview: observatorySources.filter((source) => source.evidenceStatus === 'source-review').length,
    insightLenses: new Set(observatoryMetaInsights.map((insight) => insight.lens)).size,
  };
}

export const observatorySignals: ObservatorySignal[] = [
  {
    id: 'eu-ai-act-article-50-in-force-2026',
    sourceId: 'eu-ai-office',
    title: {
      en: 'AI Act Article 50 transparency obligations are now applicable',
      it: 'Gli obblighi di trasparenza dell articolo 50 AI Act sono applicabili',
    },
    summary: {
      en: 'From 2 August, providers must support machine-readable marking of generated or manipulated content and deployers must disclose defined AI interactions or synthetic content. The 2 December 2026 window applies only to marking and detection for systems already on the market before 2 August.',
      it: 'Dal 2 agosto i provider devono supportare il marking machine-readable dei contenuti generati o manipolati e i deployer devono dichiarare, nei casi previsti, interazioni AI o contenuti sintetici. La finestra al 2 dicembre 2026 riguarda solo marking e detection per sistemi già sul mercato prima del 2 agosto.',
    },
    contentType: 'AI governance',
    region: 'European Union',
    dateLabel: {
      en: 'In force 2 Aug 2026',
      it: 'In vigore 2 ago 2026',
    },
    sourceUrl: 'https://digital-strategy.ec.europa.eu/en/factpages/quick-facts-transparency-rules-ai-systems',
    publishedOn: '2026-08-02',
    reviewUtc: '20260802T090000Z',
    reviewTimeLabel: { en: 'Applicable · verified 17 Aug', it: 'Applicabile · verificato 17 ago' },
    localHref: '/observatory',
    priority: 'high',
    state: 'In force',
  },
  {
    id: 'eu-ai-act-gpai-full-enforcement-2026',
    sourceId: 'eu-ai-office',
    title: {
      en: 'Full Commission enforcement begins for GPAI obligations',
      it: 'Inizia il pieno enforcement della Commissione sugli obblighi GPAI',
    },
    summary: {
      en: 'On 2 August the Commission moved from the collaborative phase to full enforcement of general-purpose AI model provider obligations, including additional measures for models with systemic risk.',
      it: 'Il 2 agosto la Commissione è passata dalla fase collaborativa al pieno enforcement degli obblighi dei provider di modelli general-purpose AI, comprese le misure aggiuntive per i modelli con rischio sistemico.',
    },
    contentType: 'regulatory updates',
    region: 'European Union',
    dateLabel: {
      en: 'Enforcement from 2 Aug 2026',
      it: 'Enforcement dal 2 ago 2026',
    },
    sourceUrl: 'https://digital-strategy.ec.europa.eu/en/faqs/guidelines-obligations-general-purpose-ai-providers',
    publishedOn: '2026-08-02',
    reviewUtc: '20260802T100000Z',
    reviewTimeLabel: { en: 'Fully enforceable · verified 17 Aug', it: 'Pienamente applicabile · verificato 17 ago' },
    localHref: '/observatory',
    priority: 'high',
    state: 'In force',
  },
  {
    id: 'eu-ai-literacy-supervision-2026',
    sourceId: 'eu-ai-office',
    title: {
      en: 'Supervision and enforcement of AI literacy measures begins',
      it: 'Iniziano supervisione ed enforcement delle misure di AI literacy',
    },
    summary: {
      en: 'From 3 August authorities supervise and enforce the AI literacy measures already required by the AI Act. This entry reflects the framework in force and does not repeat superseded wording from the earlier Omnibus proposal.',
      it: 'Dal 3 agosto le autorità supervisionano e applicano le misure di AI literacy già richieste dall AI Act. La voce riflette il quadro vigente e non ripropone formulazioni superate della precedente proposta Omnibus.',
    },
    contentType: 'AI governance',
    region: 'European Union',
    dateLabel: {
      en: 'Supervision from 3 Aug 2026',
      it: 'Supervisione dal 3 ago 2026',
    },
    sourceUrl: 'https://digital-strategy.ec.europa.eu/en/faqs/ai-literacy-questions-answers',
    publishedOn: '2026-08-03',
    reviewUtc: '20260803T090000Z',
    reviewTimeLabel: { en: 'Enforcement started · verified 17 Aug', it: 'Enforcement avviato · verificato 17 ago' },
    localHref: '/observatory',
    priority: 'high',
    state: 'In force',
  },
  {
    id: 'eu-ai-act-article-50-guidelines',
    sourceId: 'eu-ai-office',
    title: {
      en: 'Commission publishes Article 50 AI transparency guidelines',
      it: 'La Commissione pubblica le linee guida sulla trasparenza AI dell articolo 50',
    },
    summary: {
      en: 'Published 20 July and updated 24 July 2026; the guidance covers provider and deployer transparency obligations that apply from 2 August 2026.',
      it: 'Pubblicate il 20 luglio e aggiornate il 24 luglio 2026; le linee guida riguardano gli obblighi di trasparenza per provider e deployer applicabili dal 2 agosto 2026.',
    },
    contentType: 'AI governance',
    region: 'European Union',
    dateLabel: {
      en: 'Published 20 Jul · updated 24 Jul 2026',
      it: 'Pubblicate 20 lug · aggiornate 24 lug 2026',
    },
    sourceUrl: 'https://digital-strategy.ec.europa.eu/en/news/commission-publishes-guidelines-transparency-obligations-providers-deployers-certain-ai-systems',
    publishedOn: '2026-07-20',
    reviewUtc: '20260802T090000Z',
    reviewTimeLabel: { en: 'Obligations apply · 09:00 UTC review', it: 'Obblighi applicabili · revisione 09:00 UTC' },
    localHref: '/observatory',
    priority: 'high',
    state: 'Guidance',
  },
  {
    id: 'edpb-anonymisation-web-scraping-guidelines',
    sourceId: 'edpb-news',
    title: {
      en: 'EDPB opens consultation on anonymisation and web scraping for generative AI',
      it: 'EDPB apre la consultazione su anonimizzazione e web scraping per l AI generativa',
    },
    summary: {
      en: 'The 8 July guidelines address purpose limitation, transparency, data minimisation and special-category data; consultation closes 30 October 2026. The EDPB also adopted final blockchain guidance.',
      it: 'Le linee guida dell 8 luglio trattano limitazione della finalita, trasparenza, minimizzazione e dati particolari; la consultazione chiude il 30 ottobre 2026. EDPB ha anche adottato le linee guida finali sulla blockchain.',
    },
    contentType: 'privacy enforcement',
    region: 'European Union',
    dateLabel: {
      en: 'Published 8 Jul 2026',
      it: 'Pubblicate 8 lug 2026',
    },
    sourceUrl: 'https://www.edpb.europa.eu/news/edpb-sheds-light-on-anonymisation-and-web-scraping-for-generative-ai-and-adopts-final-version_en',
    publishedOn: '2026-07-08',
    reviewUtc: '20261030T090000Z',
    reviewTimeLabel: { en: 'Consultation closes · 09:00 UTC review', it: 'Chiusura consultazione · revisione 09:00 UTC' },
    localHref: '/observatory',
    priority: 'high',
    state: 'Guidance',
  },
  {
    id: 'ftc-ai-accuracy-comment-watch',
    sourceId: 'ftc-tech',
    title: {
      en: 'FTC enforcement page lists AI accuracy request for comment',
      it: 'La pagina enforcement FTC elenca la richiesta di commenti sull accuratezza AI',
    },
    summary: {
      en: 'The current privacy and security enforcement page lists a 1 July request for comment on a proposed AI accuracy policy statement. PolicyWatcher treats it as US monitoring context, not a final rule.',
      it: 'La pagina corrente su privacy e sicurezza elenca una richiesta di commenti del 1 luglio su una proposta di policy per l accuratezza AI. PolicyWatcher la tratta come contesto di monitoraggio USA, non come regola finale.',
    },
    contentType: 'regulatory updates',
    region: 'United States',
    dateLabel: {
      en: 'Listed 1 Jul 2026 · monitoring context',
      it: 'Elencata 1 lug 2026 · contesto di monitoraggio',
    },
    sourceUrl: 'https://www.ftc.gov/news-events/topics/protecting-consumer-privacy-security/privacy-security-enforcement',
    publishedOn: '2026-07-01',
    reviewUtc: '20260814T150000Z',
    reviewTimeLabel: { en: 'PolicyWatcher review · 15:00 UTC', it: 'Revisione PolicyWatcher · 15:00 UTC' },
    localHref: '/observatory',
    priority: 'medium',
    state: 'Guidance',
  },
  {
    id: 'ico-safe-ai-workplan',
    sourceId: 'uk-ico',
    title: {
      en: 'ICO sets out its 2026/27 safe AI workplan',
      it: 'ICO presenta il piano di lavoro 2026/27 per un AI sicura',
    },
    summary: {
      en: 'The 29 May response identifies forward work on the AI code, agentic-AI guidance and consumer support. It is a workplan signal, not completed guidance.',
      it: 'La risposta del 29 maggio indica lavori futuri su codice AI, guida per AI agentica e supporto ai consumatori. E un segnale di pianificazione, non una guida completata.',
    },
    contentType: 'AI governance',
    region: 'United Kingdom',
    dateLabel: {
      en: 'Published 29 May 2026 · forward workplan',
      it: 'Pubblicata 29 mag 2026 · piano futuro',
    },
    sourceUrl: 'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2026/05/ico-response-to-government-on-safe-ai-powered-innovation/',
    publishedOn: '2026-05-29',
    reviewUtc: '20260901T090000Z',
    reviewTimeLabel: { en: 'PolicyWatcher review · 09:00 UTC', it: 'Revisione PolicyWatcher · 09:00 UTC' },
    localHref: '/observatory',
    priority: 'medium',
    state: 'Guidance',
  },
];

export const observatoryEvents: ObservatoryEvent[] = [
  {
    id: 'ieee-isope-2026-programme-review',
    title: {
      en: 'IEEE ISoPE 2026 programme review',
      it: 'Revisione programma IEEE ISoPE 2026',
    },
    organizer: 'PolicyWatcher Observatory',
    dateLabel: {
      en: '16 Sep 2026',
      it: '16 set 2026',
    },
    timeLabel: {
      en: '09:00 UTC',
      it: '09:00 UTC',
    },
    location: {
      en: 'Remote registry review',
      it: 'Revisione registro da remoto',
    },
    summary: {
      en: 'Review public IEEE ISoPE materials before the October 1-2, 2026 privacy symposium window in New York.',
      it: 'Rivedere i materiali pubblici IEEE ISoPE prima della finestra del simposio privacy dell 1-2 ottobre 2026 a New York.',
    },
    href: 'https://ieee-isope.org/',
    calendar: {
      startUtc: '20260916T090000Z',
      endUtc: '20260916T093000Z',
      filename: 'policywatcher-ieee-isope-2026-programme-review.ics',
    },
  },
  {
    id: 'eu-ai-office-monthly-review',
    title: {
      en: 'European AI Office review window',
      it: 'Finestra revisione European AI Office',
    },
    organizer: 'PolicyWatcher Observatory',
    dateLabel: {
      en: 'First week monthly',
      it: 'Prima settimana mensile',
    },
    timeLabel: {
      en: 'Manual review',
      it: 'Revisione manuale',
    },
    location: {
      en: 'Observatory registry',
      it: 'Registro Observatory',
    },
    summary: {
      en: 'Recurring review window for AI Act implementation context and model-governance materials.',
      it: 'Finestra ricorrente per contesto AI Act e materiali governance modelli.',
    },
    href: 'https://digital-strategy.ec.europa.eu/en/policies/ai-office',
    calendar: {
      startUtc: '20261005T090000Z',
      endUtc: '20261005T093000Z',
      filename: 'policywatcher-eu-ai-office-review.ics',
    },
  },
];

export const dashboardUpdateNotices: DashboardNotice[] = [
  {
    id: 'dashboard-ticker-added',
    label: {
      en: 'Dashboard',
      it: 'Dashboard',
    },
    message: {
      en: 'Observatory signals now appear below the active workspace summary.',
      it: 'I segnali Observatory ora compaiono sotto il riepilogo workspace attivo.',
    },
    href: '/observatory',
    tone: 'teal',
  },
  {
    id: 'trust-boundary-reminder',
    label: {
      en: 'Trust',
      it: 'Trust',
    },
    message: {
      en: 'Source QA and Dataset QA notices remain visible across workspace profiles.',
      it: 'Avvisi Source QA e Dataset QA restano visibili in ogni profilo workspace.',
    },
    href: '/trust',
    tone: 'amber',
  },
  {
    id: 'atlas-observatory-link',
    label: {
      en: 'Atlas',
      it: 'Atlante',
    },
    message: {
      en: 'The Site Atlas now maps Observatory beside evidence and governance surfaces.',
      it: 'L Atlante ora mappa Observatory accanto a superfici evidenza e governance.',
    },
    href: '/atlas',
    tone: 'indigo',
  },
  {
    id: 'roadmap-reading-mode',
    label: {
      en: 'Roadmap',
      it: 'Roadmap',
    },
    message: {
      en: 'First mobile reading mode is available from the workspace area.',
      it: 'La prima modalita lettura mobile e disponibile dall area workspace.',
    },
    href: '/roadmap',
    tone: 'teal',
  },
];

export function getObservatorySource(sourceId: string): ObservatorySource | undefined {
  return observatorySources.find((source) => source.id === sourceId);
}

export function buildObservatoryIcs(event: ObservatoryEvent, locale: Locale = 'en'): string {
  const uid = formatIcsUid(event.id);
  const title = escapeIcsText(event.title[locale]);
  const summary = escapeIcsText(event.summary[locale]);
  const location = escapeIcsText(event.location[locale]);
  const sourceUrl = formatIcsHttpUrl(event.href);
  const startUtc = formatIcsDateTime(event.calendar.startUtc);
  const endUtc = formatIcsDateTime(event.calendar.endUtc);
  const sourceLabel = locale === 'it' ? 'Fonte' : 'Source';

  return foldIcsLines([
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//PolicyWatcher//Observatory//${locale.toUpperCase()}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}@policywatcher.online`,
    `DTSTAMP:${formatIcsDateTime(new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''))}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${summary} ${sourceLabel}: ${escapeIcsText(sourceUrl)}`,
    `LOCATION:${location}`,
    `URL:${sourceUrl}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]).join('\r\n');
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function formatIcsUid(value: string): string {
  if (!/^[a-z0-9._-]+$/i.test(value)) {
    throw new Error(`Invalid observatory calendar event id: ${value}`);
  }

  return value;
}

function formatIcsDateTime(value: string): string {
  if (!/^\d{8}T\d{6}Z$/.test(value)) {
    throw new Error(`Invalid observatory calendar timestamp: ${value}`);
  }

  return value;
}

function formatIcsHttpUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`Invalid observatory calendar URL protocol: ${url.protocol}`);
  }

  return url.toString();
}

function foldIcsLines(lines: string[]): string[] {
  return lines.flatMap((line) => {
    const folded = [];
    let remaining = line;

    while (remaining.length > 75) {
      folded.push(remaining.slice(0, 75));
      remaining = ` ${remaining.slice(75)}`;
    }

    folded.push(remaining);
    return folded;
  });
}
