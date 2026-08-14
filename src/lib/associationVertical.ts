export const ASSOCIATION_VERTICAL_SCHEMA = 'policywatcher.association-radar.v1' as const;
export const ASSOCIATION_REVIEW_STORAGE_KEY = 'policywatcher:association-review:v1' as const;
export const ASSOCIATION_WATCHLIST_STORAGE_KEY = 'policywatcher:association-watchlist:v1' as const;

export const ASSOCIATION_VERTICAL_BOUNDARY =
  'Il radar organizza evidenze pubbliche già ammesse dai gate di PolicyWatcher. La rilevanza civica è un segnale di triage, non un giudizio legale, una certificazione di conformità o una prova della condotta interna del fornitore.';

export type AssociationTheme =
  | 'privacy-dati'
  | 'condizioni-contrattuali'
  | 'intelligenza-artificiale'
  | 'pagamenti-abbonamenti'
  | 'account-contenuti'
  | 'minori'
  | 'trasparenza';

export type AssociationAttention = 'prioritaria' | 'da-valutare' | 'monitoraggio';
export type AssociationSourceStage = 'fonte-verificata' | 'revisione-richiesta' | 'stato-non-registrato';
export type AssociationReviewState = 'osservato' | 'in-revisione' | 'pronto-per-pubblicazione';
export type AssociationCountryContext = 'global' | 'it' | 'eu' | 'us' | 'gb' | 'ca' | 'au';
export type AssociationRegulatoryArea =
  | 'all'
  | 'digital-contracts'
  | 'privacy-data'
  | 'ai-platforms'
  | 'payments-markets'
  | 'minors-online';
export type AssociationOrganizationType =
  | 'all'
  | 'generalist'
  | 'digital-rights'
  | 'privacy'
  | 'children'
  | 'financial-services';

export interface AssociationContext {
  country: AssociationCountryContext;
  regulatoryArea: AssociationRegulatoryArea;
  organizationType: AssociationOrganizationType;
}

export interface AssociationEvidenceInput {
  id: string;
  createdAt: string;
  overallRisk: string;
  overallScore: number;
  summary: string | null;
  sourceState: string;
  policy: {
    id: string;
    name: string;
    type: string;
    jurisdiction: string;
    dataStatus: string;
    company: {
      name: string;
      slug: string;
      industry: string;
    };
  };
}

export interface AssociationRadarItem {
  schema: typeof ASSOCIATION_VERTICAL_SCHEMA;
  id: string;
  createdAt: string;
  company: string;
  companySlug: string;
  industry: string;
  policyName: string;
  policyType: string;
  jurisdiction: string;
  summary: string;
  sourceStage: AssociationSourceStage;
  attention: AssociationAttention;
  screeningScore: number;
  themes: AssociationTheme[];
  citizenQuestions: string[];
  evidenceHref: string;
  changeHref: string;
  sourceBoundary: string;
}

export interface AssociationRadarSummary {
  records: number;
  companies: number;
  verifiedSources: number;
  reviewRequired: number;
  priorityItems: number;
  latestEvidenceAt: string | null;
}

export const ASSOCIATION_THEME_LABELS: Readonly<Record<AssociationTheme, string>> = Object.freeze({
  'privacy-dati': 'Privacy e dati',
  'condizioni-contrattuali': 'Condizioni contrattuali',
  'intelligenza-artificiale': 'Intelligenza artificiale',
  'pagamenti-abbonamenti': 'Pagamenti e abbonamenti',
  'account-contenuti': 'Account e contenuti',
  minori: 'Minori',
  trasparenza: 'Trasparenza',
});

export const ASSOCIATION_COUNTRY_LABELS: Readonly<Record<AssociationCountryContext, string>> = Object.freeze({
  global: 'Globale',
  it: 'Italia',
  eu: 'Unione europea',
  us: 'Stati Uniti',
  gb: 'Regno Unito',
  ca: 'Canada',
  au: 'Australia',
});

export const ASSOCIATION_REGULATORY_AREA_LABELS: Readonly<Record<AssociationRegulatoryArea, string>> = Object.freeze({
  all: 'Tutte le aree',
  'digital-contracts': 'Contratti e servizi digitali',
  'privacy-data': 'Privacy e dati',
  'ai-platforms': 'AI e piattaforme',
  'payments-markets': 'Pagamenti e mercati digitali',
  'minors-online': 'Minori online',
});

export const ASSOCIATION_ORGANIZATION_TYPE_LABELS: Readonly<Record<AssociationOrganizationType, string>> = Object.freeze({
  all: 'Tutte le associazioni',
  generalist: 'Tutela consumatori generalista',
  'digital-rights': 'Diritti digitali',
  privacy: 'Privacy e protezione dati',
  children: 'Minori e famiglie',
  'financial-services': 'Servizi finanziari',
});

const regulatoryThemes: Readonly<Record<Exclude<AssociationRegulatoryArea, 'all'>, readonly AssociationTheme[]>> = Object.freeze({
  'digital-contracts': ['condizioni-contrattuali', 'account-contenuti'],
  'privacy-data': ['privacy-dati'],
  'ai-platforms': ['intelligenza-artificiale', 'account-contenuti'],
  'payments-markets': ['pagamenti-abbonamenti', 'condizioni-contrattuali'],
  'minors-online': ['minori', 'privacy-dati', 'account-contenuti'],
});

const organizationThemes: Readonly<Record<Exclude<AssociationOrganizationType, 'all'>, readonly AssociationTheme[] | null>> = Object.freeze({
  generalist: null,
  'digital-rights': ['privacy-dati', 'intelligenza-artificiale', 'account-contenuti'],
  privacy: ['privacy-dati', 'intelligenza-artificiale'],
  children: ['minori', 'privacy-dati', 'account-contenuti'],
  'financial-services': ['pagamenti-abbonamenti', 'condizioni-contrattuali', 'privacy-dati'],
});

function matchesThemeSet(item: AssociationRadarItem, themes: readonly AssociationTheme[] | null): boolean {
  return themes === null || item.themes.some((theme) => themes.includes(theme));
}

function normalizeJurisdiction(value: string): string {
  return value.trim().toLocaleLowerCase('en');
}

/**
 * Applies an association's working context without inventing national data.
 * Countries with no dedicated source set only receive records explicitly
 * marked Global; EU contexts may use EU and Global evidence.
 */
export function matchesAssociationContext(
  item: AssociationRadarItem,
  context: AssociationContext,
): boolean {
  const jurisdiction = normalizeJurisdiction(item.jurisdiction);
  const isGlobal = jurisdiction === 'global' || jurisdiction === 'worldwide' || jurisdiction.includes('global');
  const isEu = jurisdiction === 'eu' || jurisdiction.includes('european union') || jurisdiction.includes('unione europea');
  const isUs = jurisdiction === 'us' || jurisdiction === 'usa' || jurisdiction.includes('united states');

  const countryMatches = context.country === 'global'
    || (context.country === 'it' && (isEu || isGlobal))
    || (context.country === 'eu' && (isEu || isGlobal))
    || (context.country === 'us' && (isUs || isGlobal))
    || (['gb', 'ca', 'au'] as AssociationCountryContext[]).includes(context.country) && isGlobal;

  if (!countryMatches) return false;

  const regulatoryMatches = context.regulatoryArea === 'all'
    || matchesThemeSet(item, regulatoryThemes[context.regulatoryArea]);
  if (!regulatoryMatches) return false;

  return context.organizationType === 'all'
    || matchesThemeSet(item, organizationThemes[context.organizationType]);
}

export const ASSOCIATION_PILOT_PLAN = Object.freeze([
  {
    week: 'Settimana 0',
    title: 'Perimetro condiviso',
    description: 'Scelta di un tema, 10-20 servizi e criteri di rilevanza con l’associazione partner.',
  },
  {
    week: 'Settimane 1-2',
    title: 'Baseline e qualità delle fonti',
    description: 'Verifica delle pagine ufficiali, dello stato di acquisizione e delle evidenze pubblicabili.',
  },
  {
    week: 'Settimane 3-7',
    title: 'Radar e revisione',
    description: 'Triage dei cambiamenti, digest settimanale e costruzione locale dei dossier.',
  },
  {
    week: 'Settimana 8',
    title: 'Rapporto finale',
    description: 'Evidenze utili, fonti non monitorabili, riusi effettuati e decisione sull’eventuale prosecuzione.',
  },
] as const);

const themeMatchers: ReadonlyArray<{
  theme: AssociationTheme;
  patterns: readonly string[];
}> = [
  {
    theme: 'privacy-dati',
    patterns: ['privacy', 'personal data', 'data processing', 'biometric', 'tracking', 'cookie', 'dati personali', 'tracciamento'],
  },
  {
    theme: 'condizioni-contrattuali',
    patterns: ['terms', 'condition', 'contract', 'clause', 'agreement', 'condizioni', 'contratto', 'clausola'],
  },
  {
    theme: 'intelligenza-artificiale',
    patterns: ['artificial intelligence', 'generative ai', 'machine learning', 'training data', 'model training', ' ai ', 'intelligenza artificiale'],
  },
  {
    theme: 'pagamenti-abbonamenti',
    patterns: ['payment', 'billing', 'price', 'subscription', 'renewal', 'refund', 'cancel', 'pagamento', 'prezzo', 'abbonamento', 'rinnovo', 'rimborso'],
  },
  {
    theme: 'account-contenuti',
    patterns: ['account', 'content', 'license', 'moderation', 'suspension', 'termination', 'contenut', 'licenza', 'moderazione', 'sospensione'],
  },
  {
    theme: 'minori',
    patterns: ['minor', 'child', 'teen', 'age assurance', 'minore', 'bambin', 'adolescent'],
  },
];

const questionsByTheme: Readonly<Record<AssociationTheme, readonly string[]>> = Object.freeze({
  'privacy-dati': [
    'Quali categorie di dati o finalità risultano coinvolte?',
    'Il cambiamento modifica scelte, informative o strumenti di opposizione disponibili al cittadino?',
  ],
  'condizioni-contrattuali': [
    'Quali diritti, obblighi o limitazioni cambiano per l’utente?',
    'Sono indicati data di efficacia e modalità di comunicazione del cambiamento?',
  ],
  'intelligenza-artificiale': [
    'Il testo descrive nuovi usi di dati o contenuti per sistemi di intelligenza artificiale?',
    'Sono previste scelte, esclusioni o spiegazioni comprensibili per l’utente?',
  ],
  'pagamenti-abbonamenti': [
    'Cambiano costi, rinnovi, rimborsi o modalita di recesso?',
    'Le nuove condizioni sono presentate prima che producano effetti economici?',
  ],
  'account-contenuti': [
    'Cambiano le regole su accesso, sospensione, cancellazione o uso dei contenuti?',
    'Esiste un percorso di contestazione o recupero chiaramente descritto?',
  ],
  minori: [
    'Il cambiamento riguarda eta, consenso, verifica o protezioni specifiche per i minori?',
    'Le informazioni sono comprensibili anche a utenti giovani e famiglie?',
  ],
  trasparenza: [
    'La fonte ufficiale consente di ricostruire con chiarezza cosa è cambiato e quando?',
    'Servono ulteriori documenti o una revisione competente prima di informare i cittadini?',
  ],
});

function normalizeText(input: AssociationEvidenceInput): string {
  return [
    input.policy.name,
    input.policy.type,
    input.policy.company.industry,
    input.summary ?? '',
  ]
    .join(' ')
    .toLocaleLowerCase('it');
}

export function classifyAssociationThemes(input: AssociationEvidenceInput): AssociationTheme[] {
  const text = ` ${normalizeText(input)} `;
  const themes = themeMatchers
    .filter((matcher) => matcher.patterns.some((pattern) => text.includes(pattern)))
    .map((matcher) => matcher.theme);

  return themes.length > 0 ? themes : ['trasparenza'];
}

export function getAssociationSourceStage(sourceState: string): AssociationSourceStage {
  if (sourceState === 'verified-retrieval') return 'fonte-verificata';
  if (sourceState === 'review-required') return 'revisione-richiesta';
  return 'stato-non-registrato';
}

export function getAssociationAttention(overallRisk: string, sourceState: string): AssociationAttention {
  if (sourceState !== 'verified-retrieval') return 'da-valutare';
  if (overallRisk.toLowerCase() === 'high') return 'prioritaria';
  if (overallRisk.toLowerCase() === 'medium') return 'da-valutare';
  return 'monitoraggio';
}

export function getAssociationCitizenQuestions(themes: readonly AssociationTheme[]): string[] {
  const questions = themes.flatMap((theme) => questionsByTheme[theme]);
  return [...new Set(questions)].slice(0, 3);
}

export function buildAssociationRadarItems(
  inputs: readonly AssociationEvidenceInput[],
): AssociationRadarItem[] {
  return inputs
    .map((input) => {
      const themes = classifyAssociationThemes(input);
      return {
        schema: ASSOCIATION_VERTICAL_SCHEMA,
        id: input.id,
        createdAt: input.createdAt,
        company: input.policy.company.name,
        companySlug: input.policy.company.slug,
        industry: input.policy.company.industry,
        policyName: input.policy.name,
        policyType: input.policy.type,
        jurisdiction: input.policy.jurisdiction,
        summary: input.summary?.trim() || 'Sintesi non disponibile: aprire il pacchetto di evidenze prima della revisione.',
        sourceStage: getAssociationSourceStage(input.sourceState),
        attention: getAssociationAttention(input.overallRisk, input.sourceState),
        screeningScore: Number.isFinite(input.overallScore) ? input.overallScore : 0,
        themes,
        citizenQuestions: getAssociationCitizenQuestions(themes),
        evidenceHref: `/evidence/${encodeURIComponent(input.id)}`,
        changeHref: `/change/${encodeURIComponent(input.id)}?lang=it`,
        sourceBoundary: ASSOCIATION_VERTICAL_BOUNDARY,
      } satisfies AssociationRadarItem;
    })
    .sort((left, right) => {
      const attentionOrder: Record<AssociationAttention, number> = {
        prioritaria: 0,
        'da-valutare': 1,
        monitoraggio: 2,
      };
      const attentionDelta = attentionOrder[left.attention] - attentionOrder[right.attention];
      if (attentionDelta !== 0) return attentionDelta;
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
}

export function summarizeAssociationRadar(items: readonly AssociationRadarItem[]): AssociationRadarSummary {
  const timestamps = items
    .map((item) => new Date(item.createdAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => right.getTime() - left.getTime());

  return {
    records: items.length,
    companies: new Set(items.map((item) => item.companySlug)).size,
    verifiedSources: items.filter((item) => item.sourceStage === 'fonte-verificata').length,
    reviewRequired: items.filter((item) => item.sourceStage !== 'fonte-verificata').length,
    priorityItems: items.filter((item) => item.attention === 'prioritaria').length,
    latestEvidenceAt: timestamps[0]?.toISOString() ?? null,
  };
}

function markdownSafe(value: string): string {
  return value.replace(/([\\`*_{}\[\]()<>#+.!|-])/g, '\\$1').replace(/\r?\n/g, ' ').trim();
}

export function buildAssociationDigestMarkdown(
  items: readonly AssociationRadarItem[],
  reviewStates: Readonly<Record<string, AssociationReviewState>>,
  generatedAt: Date = new Date(),
  context?: AssociationContext,
): string {
  const lines = [
    '# PolicyWatcher Civico - digest di revisione',
    '',
    `- Generato: ${generatedAt.toISOString()}`,
    `- Evidenze incluse: ${items.length}`,
    `- Fonti verificate: ${items.filter((item) => item.sourceStage === 'fonte-verificata').length}`,
    `- In revisione locale: ${items.filter((item) => reviewStates[item.id] === 'in-revisione').length}`,
    `- Pronte per pubblicazione locale: ${items.filter((item) => reviewStates[item.id] === 'pronto-per-pubblicazione').length}`,
    ...(context ? [
      `- Paese di lavoro: ${ASSOCIATION_COUNTRY_LABELS[context.country]}`,
      `- Area normativa: ${ASSOCIATION_REGULATORY_AREA_LABELS[context.regulatoryArea]}`,
      `- Tipo di associazione: ${ASSOCIATION_ORGANIZATION_TYPE_LABELS[context.organizationType]}`,
    ] : []),
    '',
    `> ${ASSOCIATION_VERTICAL_BOUNDARY}`,
    '',
  ];

  for (const [index, item] of items.entries()) {
    lines.push(
      `## ${index + 1}. ${markdownSafe(item.company)} - ${markdownSafe(item.policyName)}`,
      '',
      `- Stato locale: ${reviewStates[item.id] ?? 'osservato'}`,
      `- Segnale di triage: ${item.attention}`,
      `- Stato fonte: ${item.sourceStage}`,
      `- Data evidenza: ${item.createdAt}`,
      `- Temi: ${item.themes.map((theme) => ASSOCIATION_THEME_LABELS[theme]).join(', ')}`,
      `- Pacchetto di evidenze: https://policywatcher.online${item.evidenceHref}`,
      '',
      markdownSafe(item.summary),
      '',
      '**Domande per la revisione umana**',
      '',
      ...item.citizenQuestions.map((question) => `- ${markdownSafe(question)}`),
      '',
    );
  }

  return `${lines.join('\n').trim()}\n`;
}
