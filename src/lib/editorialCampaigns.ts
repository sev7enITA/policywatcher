import { POLICYWATCHER_CANONICAL_ORIGIN } from './pressKit';
import { POLICYWATCHER_VERSION } from './release';

const BETA_27_CAMPAIGN_RELEASE = '3.9.0-beta.27' as const;
const BETA_27_CAMPAIGN_DATE = '2026-08-01' as const;

export const EDITORIAL_CAMPAIGN_IDS = [
  'beta13-press-it',
  'beta13-press-intl',
  'beta13-linkedin',
  'beta13-product-hunt',
  'beta13-show-hn',
  'beta27-press-eu-en',
  'beta27-press-it',
  'beta27-press-fr',
  'beta27-press-dach-de',
  'beta27-press-iberia-es',
  'beta27-press-brazil-ptbr',
  'beta27-press-na-en',
  'beta27-press-apac-en',
  'beta27-press-africa-mena-en',
  'beta27-linkedin-global',
  'beta27-product-hunt',
  'beta27-show-hn',
] as const;

export type EditorialCampaignId = (typeof EDITORIAL_CAMPAIGN_IDS)[number];
export const EDITORIAL_CAMPAIGN_LOCALES = ['en', 'it', 'fr', 'de', 'es', 'pt-BR'] as const;
export type EditorialCampaignLocale = (typeof EDITORIAL_CAMPAIGN_LOCALES)[number];
export type EditorialCampaignChannel = 'earned-press' | 'linkedin' | 'product-hunt' | 'show-hn';
export type OutreachOperationType =
  | 'pitch_sent'
  | 'reply_received'
  | 'interview_requested'
  | 'coverage_confirmed'
  | 'correction_requested';

export const OUTREACH_OPERATION_TYPES = [
  'pitch_sent',
  'reply_received',
  'interview_requested',
  'coverage_confirmed',
  'correction_requested',
] as const satisfies readonly OutreachOperationType[];

export interface EditorialCampaign {
  id: EditorialCampaignId;
  version: string;
  release: string;
  locale: EditorialCampaignLocale;
  region: string;
  channel: EditorialCampaignChannel;
  lifecycle: 'active' | 'archived';
  audience: string;
  purpose: string;
  landingRoute: string;
  availableCopySource: string;
  disclosure: string;
  readiness: 'ready-for-operator-review' | 'human-language-review-required' | 'archived';
  copy: {
    subject: string;
    shortPitch: string;
    followUp?: string;
  };
}

const RELEASE_ROUTE = '/press-kit/releases/admin-operational-readiness-3-9-0-beta-27';

export const editorialCampaigns: readonly EditorialCampaign[] = [
  {
    id: 'beta13-press-it', version: '1.0.0', release: '3.9.0-beta.13', locale: 'it', region: 'italy', channel: 'earned-press', lifecycle: 'archived',
    audience: 'Italian technology, privacy, AI-governance and digital-policy newsrooms',
    purpose: 'Introduce the Beta 13 evidence and editorial reuse surfaces to Italian editors.',
    landingRoute: '/pulse',
    availableCopySource: 'docs/press-release-3.9.0-beta.13-it.md',
    disclosure: 'Beta software; configured coverage; AI-assisted assessments are not legal advice or compliance determinations.',
    readiness: 'archived',
    copy: {
      subject: 'PolicyWatcher pubblica Pulse: lead verificati, Story Pack e dati citabili',
      shortPitch: 'PolicyWatcher Beta 13 aggiunge Pulse, Story Pack versionati, social card multiformato, grafici incorporabili con citazione e una Data Room strutturata. Ogni contenuto mantiene visibili data, fonti e limiti. La copertura è configurata, non esaustiva; le valutazioni assistite da AI non sono consulenza legale.',
      followUp: 'Le segnalo nuovamente la release Beta 13 di PolicyWatcher. Posso fornire una demo tecnica o chiarire fonti, Claim Registry e limiti del dataset. Se il tema non rientra nella vostra copertura non sono necessari ulteriori riscontri.',
    },
  },
  {
    id: 'beta13-press-intl', version: '1.0.0', release: '3.9.0-beta.13', locale: 'en', region: 'global', channel: 'earned-press', lifecycle: 'archived',
    audience: 'International privacy, AI-governance, regulatory-technology and data-quality newsrooms',
    purpose: 'Provide an evidence-linked Beta 13 briefing for international editorial review.',
    landingRoute: '/pulse',
    availableCopySource: 'docs/press-release-3.9.0-beta.13-en.md',
    disclosure: 'Beta software; configured coverage; AI-assisted assessments are not legal advice or compliance determinations.',
    readiness: 'archived',
    copy: {
      subject: 'PolicyWatcher launches Pulse with verified leads, Story Packs and citable data',
      shortPitch: 'PolicyWatcher Beta 13 adds Pulse, versioned Story Packs, multiformat social cards, citable embeds and a structured Data Room. Dates, source links and reuse boundaries remain visible beside each asset. Coverage is configured rather than exhaustive, and AI-assisted assessments are not legal advice.',
      followUp: 'A brief follow-up on PolicyWatcher Beta 13. I can provide a technical walkthrough or answer questions about the source evidence, Claim Registry and dataset boundaries. No further response is needed if this is outside your current coverage.',
    },
  },
  {
    id: 'beta13-linkedin', version: '1.0.0', release: '3.9.0-beta.13', locale: 'en', region: 'global', channel: 'linkedin', lifecycle: 'archived',
    audience: 'Policy, privacy, AI-governance, compliance and data-quality practitioners on LinkedIn',
    purpose: 'Distribute the dated release record through an owned professional channel.',
    landingRoute: '/pulse',
    availableCopySource: 'docs/press-outreach-2026-07-27.md',
    disclosure: 'Product update from the project creator. Beta status and evidence boundaries apply.',
    readiness: 'archived',
    copy: {
      subject: 'Two weeks of PolicyWatcher updates: evidence, explainability and reusable editorial data',
      shortPitch: 'PolicyWatcher Beta 13 is available. Pulse now packages reviewed story leads with dated facts, sources, Story Packs, social cards and embeddable citations. The Data Room exposes machine-readable distributions, while the Claim Registry states what each product claim does and does not establish. The platform remains Beta software with configured, non-exhaustive coverage.',
      followUp: 'Which evidence or reuse format would be most useful in your policy-monitoring workflow? Product feedback can be submitted through the public project channels.',
    },
  },
  {
    id: 'beta13-product-hunt', version: '1.0.0', release: '3.9.0-beta.13', locale: 'en', region: 'global', channel: 'product-hunt', lifecycle: 'archived',
    audience: 'Product Hunt users evaluating public-interest, policy and data products',
    purpose: 'Present a directly usable public product with correctly sized owned assets.',
    landingRoute: '/pulse',
    availableCopySource: 'src/lib/editorialPulse.ts#pulseLaunchKit',
    disclosure: 'No request for votes and no implication of Product Hunt endorsement. Coverage and AI boundaries remain explicit.',
    readiness: 'archived',
    copy: {
      subject: 'PolicyWatcher – trace public policy changes back to evidence',
      shortPitch: 'PolicyWatcher monitors a configured set of public policy sources, shows detected changes and keeps source status, evidence links and analytical limits visible. Beta 13 adds reviewed Pulse stories, versioned Story Packs and reusable citation assets.',
      followUp: 'I built PolicyWatcher to make policy-change evidence easier to inspect and reuse. Feedback on evidence clarity, source boundaries and reuse formats is welcome.',
    },
  },
  {
    id: 'beta13-show-hn', version: '1.0.0', release: '3.9.0-beta.13', locale: 'en', region: 'global', channel: 'show-hn', lifecycle: 'archived',
    audience: 'Show HN readers interested in evidence systems, Next.js and public-interest technology',
    purpose: 'Offer a usable public implementation for technical inspection and feedback.',
    landingRoute: '/pulse',
    availableCopySource: 'src/lib/editorialPulse.ts#pulseLaunchKit',
    disclosure: 'No signup is required for public inspection. No request for votes or comments. Coverage is configured and outputs are not legal determinations.',
    readiness: 'archived',
    copy: {
      subject: 'Show HN: PolicyWatcher – trace public policy changes back to evidence',
      shortPitch: 'PolicyWatcher is a public, read-only policy evidence project built with Next.js, TypeScript, Prisma and SQLite. It publishes evidence-gated changes with timestamps, limitations and citations. Beta 13 adds versioned Story Packs, social assets and embeddable evidence visuals. Public inspection requires no account.',
    },
  },
  {
    id: 'beta27-press-eu-en', version: '1.0.0', release: BETA_27_CAMPAIGN_RELEASE, locale: 'en', region: 'eu-uk', channel: 'earned-press', lifecycle: 'active',
    audience: 'EU and UK AI-governance, privacy, GRC and enterprise-technology desks',
    purpose: 'Brief EU and UK editors on evidence operations and publication readiness without making an AI Act compliance claim.',
    landingRoute: '/pulse', availableCopySource: 'docs/press-campaign-beta27/regional-one-page-eu-uk-en.md',
    disclosure: 'Configured coverage and Beta status; Article 50 is context only; no legal or compliance determination.',
    readiness: 'ready-for-operator-review',
    copy: { subject: 'PolicyWatcher Beta 27 makes missing publication evidence visible', shortPitch: 'PolicyWatcher Beta 27 separates Configured, Retrieved, Baseline verified, Public and Analysed states, while keeping missing scans, unavailable metrics and exclusions visible. Public evidence links, timestamps, methodology and Claim Registry remain available for verification. The configured scope is not exhaustive and the platform does not claim AI Act compliance.', followUp: 'One follow-up with the release audit or a current screenshot may be sent after 3–4 working days. No further sequence is authorised.' },
  },
  {
    id: 'beta27-press-it', version: '1.0.0', release: BETA_27_CAMPAIGN_RELEASE, locale: 'it', region: 'italy', channel: 'earned-press', lifecycle: 'active',
    audience: 'Italian technology, privacy, AI-governance, legal-tech and public-innovation desks',
    purpose: 'Present Beta 27 to Italian editors with its evidence, operational and coverage boundaries.',
    landingRoute: '/pulse', availableCopySource: 'docs/press-campaign-beta27/pitch-it.md',
    disclosure: 'Software Beta; perimetro configurato; nessuna consulenza legale, certificazione o copertura esaustiva.',
    readiness: 'ready-for-operator-review',
    copy: { subject: 'PolicyWatcher Beta 27 rende visibili le evidenze mancanti prima della pubblicazione', shortPitch: 'PolicyWatcher Beta 27 distingue Configured, Retrieved, Baseline verified, Public e Analysed senza trasformare scansioni assenti o metriche non disponibili in uno stato positivo. Fonti, timestamp, metodologia e Claim Registry restano verificabili. L inventario di 16 aziende in sei settori descrive un perimetro configurato, non una copertura esaustiva.', followUp: 'È consentito un solo follow-up dopo 3–4 giorni lavorativi, aggiungendo audit, screenshot o disponibilità per una demo.' },
  },
  {
    id: 'beta27-press-fr', version: '1.0.0', release: BETA_27_CAMPAIGN_RELEASE, locale: 'fr', region: 'france', channel: 'earned-press', lifecycle: 'active',
    audience: 'French technology, privacy, AI-governance and legal-tech desks', purpose: 'Provide a localized France briefing after native editorial review.',
    landingRoute: '/pulse', availableCopySource: 'docs/press-campaign-beta27/pitch-fr.md', disclosure: 'Brouillon localisé; validation humaine francophone requise; couverture configurée et aucune conformité revendiquée.', readiness: 'human-language-review-required',
    copy: { subject: 'PolicyWatcher Beta 27 rend visibles les preuves manquantes avant publication', shortPitch: 'PolicyWatcher Beta 27 sépare cinq étapes de publication et conserve les états indisponibles, les exclusions, les sources et les horodatages. Le périmètre configuré ne constitue ni une couverture exhaustive ni une mesure de conformité.', followUp: 'Un seul suivi après 3 à 4 jours ouvrés, uniquement avec un élément factuel supplémentaire.' },
  },
  {
    id: 'beta27-press-dach-de', version: '1.0.0', release: BETA_27_CAMPAIGN_RELEASE, locale: 'de', region: 'dach', channel: 'earned-press', lifecycle: 'active',
    audience: 'DACH technology, privacy, AI-governance and legal-tech desks', purpose: 'Provide a localized DACH briefing after native editorial review.',
    landingRoute: '/pulse', availableCopySource: 'docs/press-campaign-beta27/pitch-de.md', disclosure: 'Lokalisierter Entwurf; deutschsprachige Fachprüfung erforderlich; keine vollständige Abdeckung oder Compliance-Aussage.', readiness: 'human-language-review-required',
    copy: { subject: 'PolicyWatcher Beta 27 macht fehlende Publikationsnachweise sichtbar', shortPitch: 'PolicyWatcher Beta 27 trennt fünf Publikationsstufen und hält nicht verfügbare Zustände, Ausschlüsse, Quellen und Zeitstempel sichtbar. Der konfigurierte Umfang ist weder vollständige Abdeckung noch gemessene Compliance.', followUp: 'Nur eine Nachfrage nach 3–4 Arbeitstagen und nur mit einem zusätzlichen überprüfbaren Element.' },
  },
  {
    id: 'beta27-press-iberia-es', version: '1.0.0', release: BETA_27_CAMPAIGN_RELEASE, locale: 'es', region: 'iberia-latam-spanish', channel: 'earned-press', lifecycle: 'active',
    audience: 'Spanish-language technology, privacy, AI-governance and civic-tech desks', purpose: 'Provide a Spanish-language briefing; regional distribution requires a local evidence hook.',
    landingRoute: '/pulse', availableCopySource: 'docs/press-campaign-beta27/pitch-es.md', disclosure: 'Borrador localizado; revisión humana y adaptación regional obligatorias; no se afirma cobertura exhaustiva ni cumplimiento.', readiness: 'human-language-review-required',
    copy: { subject: 'PolicyWatcher Beta 27 hace visibles las evidencias que faltan antes de publicar', shortPitch: 'PolicyWatcher Beta 27 separa cinco etapas de publicación y mantiene visibles los estados no disponibles, las exclusiones, las fuentes y las fechas. El alcance configurado no representa cobertura exhaustiva ni cumplimiento medido.', followUp: 'Un único seguimiento después de 3–4 días laborables, con nueva evidencia verificable.' },
  },
  {
    id: 'beta27-press-brazil-ptbr', version: '1.0.0', release: BETA_27_CAMPAIGN_RELEASE, locale: 'pt-BR', region: 'brazil', channel: 'earned-press', lifecycle: 'active',
    audience: 'Brazilian technology, privacy, AI-governance and civic-tech desks', purpose: 'Provide a Brazilian Portuguese briefing; distribution requires a local evidence hook.',
    landingRoute: '/pulse', availableCopySource: 'docs/press-campaign-beta27/pitch-pt-br.md', disclosure: 'Rascunho localizado; revisão humana nativa obrigatória; não afirma cobertura exaustiva nem conformidade.', readiness: 'human-language-review-required',
    copy: { subject: 'PolicyWatcher Beta 27 torna visíveis as evidências ausentes antes da publicação', shortPitch: 'PolicyWatcher Beta 27 separa cinco etapas de publicação e mantém visíveis estados indisponíveis, exclusões, fontes e datas. O escopo configurado não representa cobertura exaustiva nem conformidade mensurada.', followUp: 'Um único acompanhamento após 3–4 dias úteis, com uma evidência verificável adicional.' },
  },
  {
    id: 'beta27-press-na-en', version: '1.0.0', release: BETA_27_CAMPAIGN_RELEASE, locale: 'en', region: 'north-america', channel: 'earned-press', lifecycle: 'active',
    audience: 'North American technology, privacy, cybersecurity, legal-tech and developer desks', purpose: 'Present inspectable evidence infrastructure and public technical surfaces.',
    landingRoute: '/pulse', availableCopySource: 'docs/press-campaign-beta27/regional-one-page-north-america-en.md', disclosure: 'Beta software; configured scope; no complete AI accuracy, security certification or compliance score.', readiness: 'ready-for-operator-review',
    copy: { subject: 'PolicyWatcher Beta 27 separates policy evidence from publication readiness', shortPitch: 'PolicyWatcher exposes source links, timestamps, evidence gates, release history, public APIs and deterministic Story Packs. Beta 27 adds a five-stage publication-readiness model without turning unavailable data into a positive state. The project does not claim exhaustive coverage, certified security or measured compliance.', followUp: 'One evidence-led follow-up may be sent after 3–4 business days.' },
  },
  {
    id: 'beta27-press-apac-en', version: '1.0.0', release: BETA_27_CAMPAIGN_RELEASE, locale: 'en', region: 'apac', channel: 'earned-press', lifecycle: 'active',
    audience: 'APAC technology, regulatory-policy and public-interest technology desks', purpose: 'Hold an APAC cohort for use only when a regional source, case or partner is documented.',
    landingRoute: '/pulse', availableCopySource: 'docs/press-campaign-beta27/regional-one-page-apac-en.md', disclosure: 'Do not distribute without a documented APAC hook; configured scope is not regional coverage.', readiness: 'ready-for-operator-review',
    copy: { subject: 'A verifiable publication-readiness model for policy-change evidence', shortPitch: 'PolicyWatcher keeps source retrieval, baseline verification, public evidence and analysis as separate states. APAC outreach must attach a real regional source, implication, case or partner; the current configured scope is not presented as APAC coverage.', followUp: 'One evidence-led follow-up may be sent after 3–4 business days.' },
  },
  {
    id: 'beta27-press-africa-mena-en', version: '1.0.0', release: BETA_27_CAMPAIGN_RELEASE, locale: 'en', region: 'africa-mena', channel: 'earned-press', lifecycle: 'active',
    audience: 'Africa and MENA technology, digital-policy and civic-tech desks', purpose: 'Hold a regional cohort for use only with a documented local source, case or partner.',
    landingRoute: '/pulse', availableCopySource: 'docs/press-campaign-beta27/regional-one-page-africa-mena-en.md', disclosure: 'Do not distribute without a documented local hook; configured scope is not Africa or MENA coverage.', readiness: 'ready-for-operator-review',
    copy: { subject: 'Inspecting policy-change evidence before publication', shortPitch: 'PolicyWatcher documents a five-stage evidence path and keeps missing or excluded records visible. Africa and MENA outreach must include a real regional source, implication, case or partner; no regional coverage or legal-compliance claim is made.', followUp: 'One evidence-led follow-up may be sent after 3–4 business days.' },
  },
  {
    id: 'beta27-linkedin-global', version: '1.0.0', release: BETA_27_CAMPAIGN_RELEASE, locale: 'en', region: 'global', channel: 'linkedin', lifecycle: 'active',
    audience: 'Global AI-governance, privacy, data-quality and public-interest technology practitioners', purpose: 'Distribute the dated release record through an owned professional channel.',
    landingRoute: '/pulse', availableCopySource: 'docs/press-release-3.9.0-beta.27-en.md', disclosure: 'Founder product update; Beta and evidence boundaries remain explicit.', readiness: 'ready-for-operator-review',
    copy: { subject: 'PolicyWatcher Beta 27: publication readiness without false healthy states', shortPitch: 'Beta 27 connects deterministic priorities, five publication-readiness stages, independent live status and bounded measurement. Missing scans and unavailable metrics remain unavailable. The release documents implemented controls, not measured compliance or operational outcomes.' },
  },
  {
    id: 'beta27-product-hunt', version: '1.0.0', release: BETA_27_CAMPAIGN_RELEASE, locale: 'en', region: 'global', channel: 'product-hunt', lifecycle: 'active',
    audience: 'Product Hunt users evaluating policy, evidence and public-interest products', purpose: 'Present the live product after Product Hunt relaunch eligibility is confirmed.',
    landingRoute: '/pulse', availableCopySource: 'src/lib/editorialPulse.ts#pulseLaunchKit', disclosure: 'No request for votes; no Product Hunt endorsement; verify relaunch eligibility before use.', readiness: 'ready-for-operator-review',
    copy: { subject: 'PolicyWatcher – trace public policy changes back to evidence', shortPitch: 'Inspect configured public policy sources through source links, timestamps, evidence gates, dated releases and reusable Story Packs. Beta 27 adds publication-readiness controls that preserve unavailable states instead of presenting them as healthy.' },
  },
  {
    id: 'beta27-show-hn', version: '1.0.0', release: BETA_27_CAMPAIGN_RELEASE, locale: 'en', region: 'global', channel: 'show-hn', lifecycle: 'active',
    audience: 'Show HN readers interested in evidence systems, Next.js and civic technology', purpose: 'Offer a directly inspectable technical implementation and request product feedback.',
    landingRoute: '/pulse', availableCopySource: 'src/lib/editorialPulse.ts#pulseLaunchKit', disclosure: 'No signup required for public inspection; no vote request; outputs are not legal determinations.', readiness: 'ready-for-operator-review',
    copy: { subject: 'Show HN: PolicyWatcher – trace public policy changes back to evidence', shortPitch: 'PolicyWatcher is a public policy-evidence project built with Next.js, TypeScript, Prisma and SQLite. It keeps sources, timestamps, unavailable states and limitations beside published observations. Beta 27 adds deterministic operational priorities and a five-stage publication-readiness model.' },
  },
] as const;

export const editorialCampaignById = Object.fromEntries(
  editorialCampaigns.map((campaign) => [campaign.id, campaign])
) as Record<EditorialCampaignId, EditorialCampaign>;

export function isEditorialCampaignId(value: unknown): value is EditorialCampaignId {
  return typeof value === 'string' && (EDITORIAL_CAMPAIGN_IDS as readonly string[]).includes(value);
}

export function isEditorialCampaignLocale(value: unknown): value is EditorialCampaignLocale {
  return typeof value === 'string' && (EDITORIAL_CAMPAIGN_LOCALES as readonly string[]).includes(value);
}

export function buildCampaignLandingUrl(id: EditorialCampaignId): string {
  const campaign = editorialCampaignById[id];
  const url = new URL(campaign.landingRoute, POLICYWATCHER_CANONICAL_ORIGIN);
  url.search = '';
  url.searchParams.set('campaign', id);
  return url.toString();
}

export function parseCampaignLandingSearch(search: string): EditorialCampaignId | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  if ([...params.keys()].some((key) => key !== 'campaign')) return null;
  const values = params.getAll('campaign');
  return values.length === 1 && isEditorialCampaignId(values[0]) ? values[0] : null;
}

export interface OutreachOperationPayload {
  eventType: OutreachOperationType;
  target: EditorialCampaignId;
  locale: EditorialCampaignLocale;
}

const OUTREACH_PAYLOAD_KEYS = ['eventType', 'target', 'locale'] as const;

export function parseOutreachOperationPayload(value: unknown): OutreachOperationPayload | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== OUTREACH_PAYLOAD_KEYS.length || keys.some((key) => !OUTREACH_PAYLOAD_KEYS.includes(key as typeof OUTREACH_PAYLOAD_KEYS[number]))) return null;
  if (!(OUTREACH_OPERATION_TYPES as readonly unknown[]).includes(record.eventType)) return null;
  if (!isEditorialCampaignId(record.target)) return null;
  const campaign = editorialCampaignById[record.target];
  if (!isEditorialCampaignLocale(record.locale)) return null;
  if (record.locale !== campaign.locale) return null;
  return { eventType: record.eventType as OutreachOperationType, target: record.target, locale: record.locale };
}

export const OUTREACH_READINESS_STORAGE_KEY = `policywatcher:outreach-readiness:${POLICYWATCHER_VERSION}` as const;
export const OUTREACH_READINESS_ITEMS = [
  { id: 'homepage', label: 'Production homepage reachable', href: '/' },
  { id: 'pulse', label: 'Pulse registry reachable', href: '/pulse' },
  { id: 'release', label: 'Current release record reachable', href: RELEASE_ROUTE },
  { id: 'press-kit', label: 'Press Kit reachable', href: '/press-kit' },
  { id: 'data-room', label: 'Data Room reachable', href: '/press-kit/data' },
  { id: 'press-packages', label: 'English and Italian press packages present', href: '/press-kit#downloads' },
  { id: 'story-packs', label: 'Current Story Packs available', href: '/pulse' },
  { id: 'social-cards', label: 'Four social-card formats available', href: '/pulse/configured-policy-evidence-scope' },
  { id: 'press-contact', label: 'Press contact route visible', href: '/press-kit#contact' },
  { id: 'method-boundary', label: 'Methodology and stated boundaries visible', href: '/methodology/confidence' },
] as const;

export const EDITORIAL_CAMPAIGN_REGISTRY_VERSION = `beta27-multiregion-1.0.0-${BETA_27_CAMPAIGN_DATE}` as const;
