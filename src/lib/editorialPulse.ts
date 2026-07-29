import { POLICYWATCHER_CANONICAL_ORIGIN, PRESS_KIT_LICENSE_URL } from './pressKit';

export type PulseLocale = 'en' | 'it';
export type PulseLocalized = Record<PulseLocale, string>;
export type PulseBeat = 'ai-governance' | 'privacy' | 'data-quality' | 'distribution';
export type PulseVisualKind = 'scope-strip' | 'evidence-pipeline' | 'release-timeline';
export type PulseCardFormat = 'og' | 'square' | 'feed' | 'story';

export interface PulseFact {
  id: string;
  value: string;
  label: PulseLocalized;
  detail: PulseLocalized;
  claimId: string;
  proofHref: string;
}

export interface PulseStory {
  slug: string;
  version: string;
  status: 'verified';
  beat: PulseBeat;
  asOf: string;
  updatedAt: string;
  headline: PulseLocalized;
  deck: PulseLocalized;
  whyItMatters: PulseLocalized;
  boundary: PulseLocalized;
  citation: PulseLocalized;
  visualKind: PulseVisualKind;
  facts: PulseFact[];
  sourceLinks: Array<{ href: string; label: PulseLocalized; claimId?: string; releaseSlug?: string }>;
}

export const PULSE_SCHEMA_VERSION = '1.0.0' as const;
export const PULSE_AS_OF = '2026-07-29' as const;
export const PULSE_CANONICAL_URL = `${POLICYWATCHER_CANONICAL_ORIGIN}/pulse` as const;

export const pulseBeatLabels: Record<PulseBeat, PulseLocalized> = {
  'ai-governance': { en: 'AI governance', it: 'Governance AI' },
  privacy: { en: 'Privacy', it: 'Privacy' },
  'data-quality': { en: 'Data quality', it: 'Qualita dei dati' },
  distribution: { en: 'Distribution', it: 'Distribuzione' },
};

export const pulseCardDimensions: Record<PulseCardFormat, { width: number; height: number; label: string }> = {
  og: { width: 1200, height: 630, label: 'Open Graph' },
  square: { width: 1080, height: 1080, label: 'Square' },
  feed: { width: 1080, height: 1350, label: 'Portrait feed' },
  story: { width: 1080, height: 1920, label: 'Story' },
};

export const pulseStories: PulseStory[] = [
  {
    slug: 'configured-policy-evidence-scope',
    version: '1.1.0',
    status: 'verified',
    beat: 'data-quality',
    asOf: PULSE_AS_OF,
    updatedAt: PULSE_AS_OF,
    headline: {
      en: 'PolicyWatcher publishes a dated view of its configured evidence scope',
      it: 'PolicyWatcher pubblica una vista datata del perimetro di evidenze configurato',
    },
    deck: {
      en: 'The public inventory records 16 configured companies, 6 sectors and 15 canonical KPIs with explicit coverage boundaries.',
      it: 'L inventario pubblico registra 16 aziende configurate, 6 settori e 15 KPI canonici con limiti di copertura espliciti.',
    },
    whyItMatters: {
      en: 'Comparable policy analysis starts with a visible denominator. The snapshot makes the configured scope reusable without presenting it as exhaustive market coverage.',
      it: 'L analisi comparabile delle policy parte da un denominatore visibile. Lo snapshot rende riutilizzabile il perimetro configurato senza presentarlo come copertura esaustiva del mercato.',
    },
    boundary: {
      en: 'Configured product inventory and method; not exhaustive market coverage, legal advice or measured compliance.',
      it: 'Inventario e metodo configurati; non copertura esaustiva, consulenza legale o conformita misurata.',
    },
    citation: {
      en: `PolicyWatcher, “Configured policy evidence scope,” Pulse story pack v1.1.0, ${PULSE_AS_OF}, ${PULSE_CANONICAL_URL}/configured-policy-evidence-scope (accessed [date]).`,
      it: `PolicyWatcher, “Perimetro configurato delle evidenze policy,” Pulse story pack v1.1.0, ${PULSE_AS_OF}, ${PULSE_CANONICAL_URL}/configured-policy-evidence-scope (consultato il [data]).`,
    },
    visualKind: 'scope-strip',
    facts: [
      { id: 'companies', value: '16', label: { en: 'Configured companies', it: 'Aziende configurate' }, detail: { en: 'Excludes the WAZE admin-onboarding fixture.', it: 'Esclude la fixture WAZE per l onboarding amministrativo.' }, claimId: 'configured-inventory', proofHref: '/press-kit#claim-configured-inventory' },
      { id: 'sectors', value: '6', label: { en: 'Configured sectors', it: 'Settori configurati' }, detail: { en: 'Sector labels organize the monitored inventory.', it: 'Le etichette di settore organizzano l inventario monitorato.' }, claimId: 'configured-inventory', proofHref: '/press-kit#fact-configured-sectors' },
      { id: 'kpis', value: '15', label: { en: 'Canonical KPIs', it: 'KPI canonici' }, detail: { en: 'Across privacy, AI governance and ethics.', it: 'Tra privacy, governance AI ed etica.' }, claimId: 'canonical-kpis', proofHref: '/press-kit#claim-canonical-kpis' },
    ],
    sourceLinks: [
      { href: '/press-kit/data', label: { en: 'Configured-scope dataset', it: 'Dataset del perimetro configurato' } },
      { href: '/press-kit#claim-configured-inventory', label: { en: 'Claim Registry: configured inventory', it: 'Registro claim: inventario configurato' }, claimId: 'configured-inventory' },
      { href: '/press-kit#claim-canonical-kpis', label: { en: 'Claim Registry: canonical KPIs', it: 'Registro claim: KPI canonici' }, claimId: 'canonical-kpis' },
    ],
  },
  {
    slug: 'public-evidence-publication-gate',
    version: '1.1.0',
    status: 'verified',
    beat: 'ai-governance',
    asOf: PULSE_AS_OF,
    updatedAt: PULSE_AS_OF,
    headline: {
      en: 'A publication gate separates source evidence from AI-assisted assessment',
      it: 'Un gate di pubblicazione separa le evidenze della fonte dalla valutazione assistita da AI',
    },
    deck: {
      en: 'PolicyWatcher documents a five-stage evidence path and withholds records that have not passed its configured public-evidence gate.',
      it: 'PolicyWatcher documenta un percorso di evidenze in cinque fasi e trattiene i record che non hanno superato il gate configurato delle evidenze pubbliche.',
    },
    whyItMatters: {
      en: 'Readers can distinguish retrieved source material, detected changes and generated interpretation before reusing a published observation.',
      it: 'I lettori possono distinguere materiale della fonte, cambi rilevati e interpretazione generata prima di riutilizzare un osservazione pubblicata.',
    },
    boundary: {
      en: 'The gate reduces unsupported publication; it does not prove source completeness, legal authority or assessment correctness.',
      it: 'Il gate riduce pubblicazioni non supportate; non prova completezza della fonte, autorita legale o correttezza della valutazione.',
    },
    citation: {
      en: `PolicyWatcher, “Public evidence publication gate,” Pulse story pack v1.1.0, ${PULSE_AS_OF}, ${PULSE_CANONICAL_URL}/public-evidence-publication-gate (accessed [date]).`,
      it: `PolicyWatcher, “Gate di pubblicazione delle evidenze pubbliche,” Pulse story pack v1.1.0, ${PULSE_AS_OF}, ${PULSE_CANONICAL_URL}/public-evidence-publication-gate (consultato il [data]).`,
    },
    visualKind: 'evidence-pipeline',
    facts: [
      { id: 'stages', value: '5', label: { en: 'Directly labelled stages', it: 'Fasi con etichetta diretta' }, detail: { en: 'Source, snapshot, diff, assessment and publication gate.', it: 'Fonte, snapshot, diff, valutazione e gate di pubblicazione.' }, claimId: 'public-evidence-gate', proofHref: '/methodology/confidence' },
      { id: 'missing', value: 'Not assessed', label: { en: 'Missing analytical value', it: 'Valore analitico mancante' }, detail: { en: 'Unavailable assessments are not converted to zero.', it: 'Le valutazioni non disponibili non vengono convertite a zero.' }, claimId: 'canonical-kpis', proofHref: '/press-kit/glossary' },
    ],
    sourceLinks: [
      { href: '/methodology/confidence', label: { en: 'Confidence methodology', it: 'Metodologia di confidence' }, claimId: 'public-evidence-gate' },
      { href: '/press-kit#claim-public-evidence-gate', label: { en: 'Claim Registry: evidence gate', it: 'Registro claim: gate evidenze' }, claimId: 'public-evidence-gate' },
      { href: '/press-kit/glossary', label: { en: 'Evidence-state glossary', it: 'Glossario degli stati evidenza' } },
    ],
  },
  {
    slug: 'versioned-beta-release-records',
    version: '1.1.0',
    status: 'verified',
    beat: 'distribution',
    asOf: PULSE_AS_OF,
    updatedAt: PULSE_AS_OF,
    headline: {
      en: 'Six consecutive beta records document evidence intake, delivery and public QA changes',
      it: 'Sei record beta consecutivi documentano cambi a intake, distribuzione e QA pubblico delle evidenze',
    },
    deck: {
      en: 'The release archive keeps Beta 7 through Beta 13 as dated, bounded product records with direct evidence links.',
      it: 'L archivio release conserva dalla Beta 7 alla Beta 13 come record prodotto datati, circoscritti e collegati alle evidenze.',
    },
    whyItMatters: {
      en: 'A versioned product history lets editors verify what changed in the public platform without treating release labels as measured outcomes.',
      it: 'Una cronologia prodotto versionata permette agli editor di verificare cosa e cambiato nella piattaforma pubblica senza trattare le etichette release come risultati misurati.',
    },
    boundary: {
      en: 'Release records describe shipped product changes and stated controls. They do not establish adoption, performance, legal compliance or independent validation.',
      it: 'I record release descrivono modifiche prodotto e controlli dichiarati. Non stabiliscono adozione, prestazioni, conformita legale o validazione indipendente.',
    },
    citation: {
      en: `PolicyWatcher, “Versioned beta release records,” Pulse story pack v1.1.0, ${PULSE_AS_OF}, ${PULSE_CANONICAL_URL}/versioned-beta-release-records (accessed [date]).`,
      it: `PolicyWatcher, “Record beta versionati,” Pulse story pack v1.1.0, ${PULSE_AS_OF}, ${PULSE_CANONICAL_URL}/versioned-beta-release-records (consultato il [data]).`,
    },
    visualKind: 'release-timeline',
    facts: [
      { id: 'records', value: '7', label: { en: 'Consecutive release records', it: 'Record release consecutivi' }, detail: { en: 'Beta 7 through Beta 13 in the public archive.', it: 'Dalla Beta 7 alla Beta 13 nell archivio pubblico.' }, claimId: 'public-code', proofHref: '/press-kit/releases' },
      { id: 'current', value: 'Beta 13', label: { en: 'Current release record', it: 'Record release corrente' }, detail: { en: 'Editorial Pulse and Distribution.', it: 'Editorial Pulse e distribuzione.' }, claimId: 'public-code', proofHref: '/press-kit/releases/editorial-pulse-distribution-3-9-0-beta-13' },
    ],
    sourceLinks: [
      { href: '/press-kit/releases', label: { en: 'Versioned release archive', it: 'Archivio release versionato' }, claimId: 'public-code' },
      { href: '/press-kit/releases/editorial-pulse-distribution-3-9-0-beta-13', label: { en: 'Beta 13 release record', it: 'Record release Beta 13' }, releaseSlug: 'editorial-pulse-distribution-3-9-0-beta-13' },
      { href: '/press-kit/releases/release-assurance-newsroom-insights-3-9-0-beta-7', label: { en: 'Beta 7 release record', it: 'Record release Beta 7' }, releaseSlug: 'release-assurance-newsroom-insights-3-9-0-beta-7' },
    ],
  },
];

export const pulseStorySlugs = pulseStories.map((story) => story.slug);

export function getPulseStory(slug: string): PulseStory | undefined {
  return pulseStories.find((story) => story.slug === slug);
}

export function getPulseStoryUrl(story: PulseStory): string {
  return `${PULSE_CANONICAL_URL}/${story.slug}`;
}

export function getPulseCardUrl(story: PulseStory, format: PulseCardFormat, locale: PulseLocale): string {
  return `${POLICYWATCHER_CANONICAL_ORIGIN}/api/og/pulse/${story.slug}/${format}?lang=${locale}`;
}

export function getPulseStoryPackUrl(story: PulseStory, locale: PulseLocale): string {
  return `${POLICYWATCHER_CANONICAL_ORIGIN}/api/pulse/story-pack/${story.slug}?lang=${locale}&version=${story.version}`;
}

export const pulseLaunchKit = {
  version: '1.1.0',
  generatedAt: PULSE_AS_OF,
  licenseUrl: PRESS_KIT_LICENSE_URL,
  productHunt: {
    name: 'PolicyWatcher',
    tagline: 'Trace public policy changes back to evidence',
    description: 'PolicyWatcher monitors a configured set of public policy sources, shows detected changes and keeps source status, evidence links and analytical limits visible.',
    firstComment: 'I built PolicyWatcher to make policy-change evidence easier to inspect and reuse. The public product includes source-gated changes, a dated Data Room, a Claim Registry, versioned release notes and Story Packs. Current scope is configured rather than exhaustive; AI-assisted assessments are not legal advice. Feedback on evidence clarity and reuse formats is welcome.',
    url: POLICYWATCHER_CANONICAL_ORIGIN,
    assets: {
      thumbnail: `${POLICYWATCHER_CANONICAL_ORIGIN}/api/og/launch/product-hunt-thumbnail`,
      gallery: `${POLICYWATCHER_CANONICAL_ORIGIN}/api/og/launch/product-hunt-gallery`,
    },
  },
  showHn: {
    title: 'Show HN: PolicyWatcher – trace public policy changes back to evidence',
    submission: 'PolicyWatcher is a public, read-only policy evidence project. It monitors a configured inventory of public sources, publishes evidence-gated changes, and keeps timestamps, limitations and citations beside the output. The new Pulse layer packages supported facts into versioned story files and embeddable evidence visuals. No account is required for public inspection.',
    technical: 'Built with Next.js, TypeScript, Prisma and SQLite. Public routes use an explicit publicEvidence gate. Editorial telemetry stores allowlisted aggregate event type, target, locale and timestamp only; it does not store visitor identifiers, referrers, query strings, IP addresses or raw user content.',
    limitations: 'Coverage is configured, not exhaustive. Source availability can change. AI-assisted assessments are not legal advice or compliance determinations.',
    url: PULSE_CANONICAL_URL,
  },
} as const;

export function buildPulseManifest(story: PulseStory, locale: PulseLocale) {
  const files = ['README.txt', 'citation.txt', 'facts.csv', 'manifest.json', 'pitch.txt', 'sources.json'] as const;
  return {
    schema: `${POLICYWATCHER_CANONICAL_ORIGIN}/schemas/editorial-story-pack/v1`,
    schemaVersion: PULSE_SCHEMA_VERSION,
    storySlug: story.slug,
    storyVersion: story.version,
    generatedAt: story.updatedAt,
    asOf: story.asOf,
    locale,
    canonicalUrl: getPulseStoryUrl(story),
    claimIds: [...new Set(story.facts.map((fact) => fact.claimId))].sort(),
    sourceHrefs: story.sourceLinks.map((source) => source.href).sort(),
    files: [...files],
    boundary: story.boundary[locale],
  };
}
