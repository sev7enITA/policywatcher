import { POLICYWATCHER_CANONICAL_ORIGIN, PRESS_KIT_LICENSE_URL } from './pressKit';
import { RELEASE_EVIDENCE_LEDGER, getReleaseEvidencePulse } from './releasePulse';

export type PulseLocale = 'en' | 'it';
export type PulseLocalized = Record<PulseLocale, string>;
export type PulseBeat = 'ai-governance' | 'privacy' | 'data-quality' | 'distribution';
export type PulseVisualKind = 'scope-strip' | 'evidence-pipeline' | 'release-timeline' | 'release-impact';
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
export const PULSE_AS_OF = '2026-08-01' as const;
export const PULSE_DESK_AS_OF = RELEASE_EVIDENCE_LEDGER.window.end;
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

const releaseEvidencePulse = getReleaseEvidencePulse();
const releaseEvidenceReferenceCount = releaseEvidencePulse.reduce((total, release) => total + release.evidence.length, 0);

export const pulseStories: PulseStory[] = [
  {
    slug: 'two-week-release-impact',
    version: '1.0.0',
    status: 'verified',
    beat: 'distribution',
    asOf: RELEASE_EVIDENCE_LEDGER.window.end,
    updatedAt: RELEASE_EVIDENCE_LEDGER.window.end,
    headline: {
      en: 'What changed. What it unlocked. What remains unproven.',
      it: 'Cosa è cambiato. Cosa ha sbloccato. Cosa resta da provare.',
    },
    deck: {
      en: `${releaseEvidencePulse.length} release clusters across one inclusive ${RELEASE_EVIDENCE_LEDGER.window.inclusiveDays}-day window connect shipped implementation to exact metrics, evidence references and residual boundaries.`,
      it: `${releaseEvidencePulse.length} cluster di release in una finestra inclusiva di ${RELEASE_EVIDENCE_LEDGER.window.inclusiveDays} giorni collegano implementazione, metriche esatte, riferimenti di evidenza e limiti residui.`,
    },
    whyItMatters: {
      en: 'A shared, hashed ledger lets public readers and editors inspect what the product shipped without converting implementation inventory into claims about adoption, performance or compliance.',
      it: 'Un ledger condiviso e dotato di hash permette a lettori ed editor di verificare cosa è stato distribuito senza trasformare l’inventario implementativo in dichiarazioni su adozione, prestazioni o conformità.',
    },
    boundary: {
      en: RELEASE_EVIDENCE_LEDGER.claimBoundary,
      it: 'Solo inventario implementativo ed evidenze di valutazione osservate. Le metriche di release non stabiliscono adozione, conformità legale, disponibilità continua o risultati per gli utenti.',
    },
    citation: {
      en: `PolicyWatcher, “Two-week release impact,” Pulse story pack v1.0.0, ${RELEASE_EVIDENCE_LEDGER.window.end}, ${PULSE_CANONICAL_URL}/two-week-release-impact (accessed [date]).`,
      it: `PolicyWatcher, “Impatto delle release in due settimane,” Pulse story pack v1.0.0, ${RELEASE_EVIDENCE_LEDGER.window.end}, ${PULSE_CANONICAL_URL}/two-week-release-impact (consultato il [data]).`,
    },
    visualKind: 'release-impact',
    facts: [
      {
        id: 'release-clusters',
        value: String(releaseEvidencePulse.length),
        label: { en: 'Dated release clusters', it: 'Cluster di release datati' },
        detail: { en: `${RELEASE_EVIDENCE_LEDGER.window.start} through ${RELEASE_EVIDENCE_LEDGER.window.end}, in ledger order.`, it: `Dal ${RELEASE_EVIDENCE_LEDGER.window.start} al ${RELEASE_EVIDENCE_LEDGER.window.end}, nell’ordine del ledger.` },
        claimId: 'public-code',
        proofHref: '/api/v1/release-evidence',
      },
      {
        id: 'release-window',
        value: String(RELEASE_EVIDENCE_LEDGER.window.inclusiveDays),
        label: { en: 'Inclusive UTC days', it: 'Giorni UTC inclusivi' },
        detail: { en: 'A frozen reporting window, not a real-time service-availability measure.', it: 'Una finestra di reporting congelata, non una misura in tempo reale della disponibilità del servizio.' },
        claimId: 'public-code',
        proofHref: '/api/v1/release-evidence',
      },
      {
        id: 'release-evidence-references',
        value: String(releaseEvidenceReferenceCount),
        label: { en: 'Listed evidence references', it: 'Riferimenti di evidenza elencati' },
        detail: { en: 'References join ledger entries to the release evidence inventory; they are not independent endorsements.', it: 'I riferimenti collegano le voci del ledger all’inventario delle evidenze di release; non sono endorsement indipendenti.' },
        claimId: 'public-code',
        proofHref: '/api/v1/release-evidence',
      },
    ],
    sourceLinks: [
      { href: '/api/v1/release-evidence', label: { en: 'Release evidence API', it: 'API evidenze release' } },
      { href: '/press-kit/releases/evidence-release-control-plane-3-9-0-beta-42', label: { en: 'Beta 42 release record', it: 'Record release Beta 42' }, releaseSlug: 'evidence-release-control-plane-3-9-0-beta-42' },
      { href: '/infographics', label: { en: 'Release evidence infographic', it: 'Infografica delle evidenze release' } },
      { href: '/press-kit/releases', label: { en: 'Versioned release archive', it: 'Archivio release versionato' }, claimId: 'public-code' },
    ],
  },
  {
    slug: 'configured-policy-evidence-scope',
    version: '1.2.0',
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
      en: `PolicyWatcher, “Configured policy evidence scope,” Pulse story pack v1.2.0, ${PULSE_AS_OF}, ${PULSE_CANONICAL_URL}/configured-policy-evidence-scope (accessed [date]).`,
      it: `PolicyWatcher, “Perimetro configurato delle evidenze policy,” Pulse story pack v1.2.0, ${PULSE_AS_OF}, ${PULSE_CANONICAL_URL}/configured-policy-evidence-scope (consultato il [data]).`,
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
    version: '1.13.0',
    status: 'verified',
    beat: 'distribution',
    asOf: '2026-08-15',
    updatedAt: '2026-08-15',
    headline: {
      en: 'Thirty-six consecutive beta records document evidence, delivery, UX, operations and security changes',
      it: 'Trentasei record beta consecutivi documentano evidenze, distribuzione, UX, operazioni e sicurezza',
    },
    deck: {
      en: 'The release archive keeps Beta 7 through Beta 42 as dated, bounded product records with direct evidence links.',
      it: 'L’archivio release conserva dalla Beta 7 alla Beta 42 come record prodotto datati, circoscritti e collegati alle evidenze.',
    },
    whyItMatters: {
      en: 'A versioned product history lets editors verify what changed in the public platform without treating release labels as measured outcomes.',
      it: 'Una cronologia prodotto versionata permette agli editor di verificare cosa è cambiato nella piattaforma pubblica senza trattare le etichette release come risultati misurati.',
    },
    boundary: {
      en: 'Release records describe shipped product changes and stated controls. They do not establish adoption, performance, legal compliance or independent validation.',
      it: 'I record release descrivono modifiche prodotto e controlli dichiarati. Non stabiliscono adozione, prestazioni, conformità legale o validazione indipendente.',
    },
    citation: {
      en: `PolicyWatcher, “Versioned beta release records,” Pulse story pack v1.13.0, 2026-08-15, ${PULSE_CANONICAL_URL}/versioned-beta-release-records (accessed [date]).`,
      it: `PolicyWatcher, “Record beta versionati,” Pulse story pack v1.13.0, 2026-08-15, ${PULSE_CANONICAL_URL}/versioned-beta-release-records (consultato il [data]).`,
    },
    visualKind: 'release-timeline',
    facts: [
      { id: 'records', value: '36', label: { en: 'Consecutive release records', it: 'Record release consecutivi' }, detail: { en: 'Beta 7 through Beta 42 in the public archive.', it: 'Dalla Beta 7 alla Beta 42 nell’archivio pubblico.' }, claimId: 'public-code', proofHref: '/press-kit/releases' },
      { id: 'current', value: 'Beta 42', label: { en: 'Current release record', it: 'Record release corrente' }, detail: { en: 'Evidence Release Control Plane.', it: 'Control plane delle release evidence-first.' }, claimId: 'public-code', proofHref: '/press-kit/releases/evidence-release-control-plane-3-9-0-beta-42' },
    ],
    sourceLinks: [
      { href: '/press-kit/releases', label: { en: 'Versioned release archive', it: 'Archivio release versionato' }, claimId: 'public-code' },
      { href: '/press-kit/releases/evidence-release-control-plane-3-9-0-beta-42', label: { en: 'Beta 42 release record', it: 'Record release Beta 42' }, releaseSlug: 'evidence-release-control-plane-3-9-0-beta-42' },
      { href: '/press-kit/releases/adaptive-experience-3-9-0-beta-41', label: { en: 'Beta 41 release record', it: 'Record release Beta 41' }, releaseSlug: 'adaptive-experience-3-9-0-beta-41' },
      { href: '/press-kit/releases/policywatcher-civico-3-9-0-beta-40', label: { en: 'Beta 40 release record', it: 'Record release Beta 40' }, releaseSlug: 'policywatcher-civico-3-9-0-beta-40' },
      { href: '/press-kit/releases/managed-vps-releases-3-9-0-beta-39', label: { en: 'Beta 39 release record', it: 'Record release Beta 39' }, releaseSlug: 'managed-vps-releases-3-9-0-beta-39' },
      { href: '/press-kit/releases/resource-navigation-retrieval-diagnostics-3-9-0-beta-37', label: { en: 'Beta 37 release record', it: 'Record release Beta 37' }, releaseSlug: 'resource-navigation-retrieval-diagnostics-3-9-0-beta-37' },
      { href: '/press-kit/releases/remediation-community-mutation-hardening-3-9-0-beta-36', label: { en: 'Beta 36 release record', it: 'Record release Beta 36' }, releaseSlug: 'remediation-community-mutation-hardening-3-9-0-beta-36' },
      { href: '/press-kit/releases/community-signal-composer-3-9-0-beta-35', label: { en: 'Beta 35 release record', it: 'Record release Beta 35' }, releaseSlug: 'community-signal-composer-3-9-0-beta-35' },
      { href: '/press-kit/releases/source-remediation-workbench-3-9-0-beta-34', label: { en: 'Beta 34 release record', it: 'Record release Beta 34' }, releaseSlug: 'source-remediation-workbench-3-9-0-beta-34' },
      { href: '/press-kit/releases/multicloud-agent-source-packages-3-9-0-beta-29', label: { en: 'Beta 29 release record', it: 'Record release Beta 29' }, releaseSlug: 'multicloud-agent-source-packages-3-9-0-beta-29' },
      { href: '/press-kit/releases/agent-evidence-gateway-3-9-0-beta-28', label: { en: 'Beta 28 release record', it: 'Record release Beta 28' }, releaseSlug: 'agent-evidence-gateway-3-9-0-beta-28' },
      { href: '/press-kit/releases/admin-operational-readiness-3-9-0-beta-27', label: { en: 'Beta 27 release record', it: 'Record release Beta 27' }, releaseSlug: 'admin-operational-readiness-3-9-0-beta-27' },
      { href: '/press-kit/releases/crawlable-public-knowledge-layer-3-9-0-beta-26', label: { en: 'Beta 26 release record', it: 'Record release Beta 26' }, releaseSlug: 'crawlable-public-knowledge-layer-3-9-0-beta-26' },
      { href: '/press-kit/releases/admin-shell-readability-3-9-0-beta-25', label: { en: 'Beta 25 release record', it: 'Record release Beta 25' }, releaseSlug: 'admin-shell-readability-3-9-0-beta-25' },
      { href: '/press-kit/releases/webhook-operations-ux-3-9-0-beta-24', label: { en: 'Beta 24 release record', it: 'Record release Beta 24' }, releaseSlug: 'webhook-operations-ux-3-9-0-beta-24' },
      { href: '/press-kit/releases/configured-webhook-delivery-pilot-3-9-0-beta-23', label: { en: 'Beta 23 release record', it: 'Record release Beta 23' }, releaseSlug: 'configured-webhook-delivery-pilot-3-9-0-beta-23' },
      { href: '/press-kit/releases/event-feed-continuity-3-9-0-beta-22', label: { en: 'Beta 22 release record', it: 'Record release Beta 22' }, releaseSlug: 'event-feed-continuity-3-9-0-beta-22' },
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
