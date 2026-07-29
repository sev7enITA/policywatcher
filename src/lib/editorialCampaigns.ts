import { POLICYWATCHER_CANONICAL_ORIGIN } from './pressKit';
import { POLICYWATCHER_RELEASE_DATE, POLICYWATCHER_VERSION } from './release';

export const EDITORIAL_CAMPAIGN_IDS = [
  'beta13-press-it',
  'beta13-press-intl',
  'beta13-linkedin',
  'beta13-product-hunt',
  'beta13-show-hn',
] as const;

export type EditorialCampaignId = (typeof EDITORIAL_CAMPAIGN_IDS)[number];
export type EditorialCampaignLocale = 'en' | 'it';
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
  release: typeof POLICYWATCHER_VERSION;
  locale: EditorialCampaignLocale;
  audience: string;
  purpose: string;
  landingRoute: string;
  availableCopySource: string;
  disclosure: string;
  readiness: 'ready-for-operator-review';
  copy: {
    subject: string;
    shortPitch: string;
    followUp?: string;
  };
}

const RELEASE_ROUTE = '/press-kit/releases/evidence-governance-packets-3-9-0-beta-16';

export const editorialCampaigns: readonly EditorialCampaign[] = [
  {
    id: 'beta13-press-it', version: '1.0.0', release: POLICYWATCHER_VERSION, locale: 'it',
    audience: 'Italian technology, privacy, AI-governance and digital-policy newsrooms',
    purpose: 'Introduce the Beta 13 evidence and editorial reuse surfaces to Italian editors.',
    landingRoute: '/pulse',
    availableCopySource: 'docs/press-release-3.9.0-beta.13-it.md',
    disclosure: 'Beta software; configured coverage; AI-assisted assessments are not legal advice or compliance determinations.',
    readiness: 'ready-for-operator-review',
    copy: {
      subject: 'PolicyWatcher pubblica Pulse: lead verificati, Story Pack e dati citabili',
      shortPitch: 'PolicyWatcher Beta 13 aggiunge Pulse, Story Pack versionati, social card multiformato, grafici incorporabili con citazione e una Data Room strutturata. Ogni contenuto mantiene visibili data, fonti e limiti. La copertura è configurata, non esaustiva; le valutazioni assistite da AI non sono consulenza legale.',
      followUp: 'Le segnalo nuovamente la release Beta 13 di PolicyWatcher. Posso fornire una demo tecnica o chiarire fonti, Claim Registry e limiti del dataset. Se il tema non rientra nella vostra copertura non sono necessari ulteriori riscontri.',
    },
  },
  {
    id: 'beta13-press-intl', version: '1.0.0', release: POLICYWATCHER_VERSION, locale: 'en',
    audience: 'International privacy, AI-governance, regulatory-technology and data-quality newsrooms',
    purpose: 'Provide an evidence-linked Beta 13 briefing for international editorial review.',
    landingRoute: '/pulse',
    availableCopySource: 'docs/press-release-3.9.0-beta.13-en.md',
    disclosure: 'Beta software; configured coverage; AI-assisted assessments are not legal advice or compliance determinations.',
    readiness: 'ready-for-operator-review',
    copy: {
      subject: 'PolicyWatcher launches Pulse with verified leads, Story Packs and citable data',
      shortPitch: 'PolicyWatcher Beta 13 adds Pulse, versioned Story Packs, multiformat social cards, citable embeds and a structured Data Room. Dates, source links and reuse boundaries remain visible beside each asset. Coverage is configured rather than exhaustive, and AI-assisted assessments are not legal advice.',
      followUp: 'A brief follow-up on PolicyWatcher Beta 13. I can provide a technical walkthrough or answer questions about the source evidence, Claim Registry and dataset boundaries. No further response is needed if this is outside your current coverage.',
    },
  },
  {
    id: 'beta13-linkedin', version: '1.0.0', release: POLICYWATCHER_VERSION, locale: 'en',
    audience: 'Policy, privacy, AI-governance, compliance and data-quality practitioners on LinkedIn',
    purpose: 'Distribute the dated release record through an owned professional channel.',
    landingRoute: '/pulse',
    availableCopySource: 'docs/press-outreach-2026-07-27.md',
    disclosure: 'Product update from the project creator. Beta status and evidence boundaries apply.',
    readiness: 'ready-for-operator-review',
    copy: {
      subject: 'Two weeks of PolicyWatcher updates: evidence, explainability and reusable editorial data',
      shortPitch: 'PolicyWatcher Beta 13 is available. Pulse now packages reviewed story leads with dated facts, sources, Story Packs, social cards and embeddable citations. The Data Room exposes machine-readable distributions, while the Claim Registry states what each product claim does and does not establish. The platform remains Beta software with configured, non-exhaustive coverage.',
      followUp: 'Which evidence or reuse format would be most useful in your policy-monitoring workflow? Product feedback can be submitted through the public project channels.',
    },
  },
  {
    id: 'beta13-product-hunt', version: '1.0.0', release: POLICYWATCHER_VERSION, locale: 'en',
    audience: 'Product Hunt users evaluating public-interest, policy and data products',
    purpose: 'Present a directly usable public product with correctly sized owned assets.',
    landingRoute: '/pulse',
    availableCopySource: 'src/lib/editorialPulse.ts#pulseLaunchKit',
    disclosure: 'No request for votes and no implication of Product Hunt endorsement. Coverage and AI boundaries remain explicit.',
    readiness: 'ready-for-operator-review',
    copy: {
      subject: 'PolicyWatcher – trace public policy changes back to evidence',
      shortPitch: 'PolicyWatcher monitors a configured set of public policy sources, shows detected changes and keeps source status, evidence links and analytical limits visible. Beta 13 adds reviewed Pulse stories, versioned Story Packs and reusable citation assets.',
      followUp: 'I built PolicyWatcher to make policy-change evidence easier to inspect and reuse. Feedback on evidence clarity, source boundaries and reuse formats is welcome.',
    },
  },
  {
    id: 'beta13-show-hn', version: '1.0.0', release: POLICYWATCHER_VERSION, locale: 'en',
    audience: 'Show HN readers interested in evidence systems, Next.js and public-interest technology',
    purpose: 'Offer a usable public implementation for technical inspection and feedback.',
    landingRoute: '/pulse',
    availableCopySource: 'src/lib/editorialPulse.ts#pulseLaunchKit',
    disclosure: 'No signup is required for public inspection. No request for votes or comments. Coverage is configured and outputs are not legal determinations.',
    readiness: 'ready-for-operator-review',
    copy: {
      subject: 'Show HN: PolicyWatcher – trace public policy changes back to evidence',
      shortPitch: 'PolicyWatcher is a public, read-only policy evidence project built with Next.js, TypeScript, Prisma and SQLite. It publishes evidence-gated changes with timestamps, limitations and citations. Beta 13 adds versioned Story Packs, social assets and embeddable evidence visuals. Public inspection requires no account.',
    },
  },
] as const;

export const editorialCampaignById = Object.fromEntries(
  editorialCampaigns.map((campaign) => [campaign.id, campaign])
) as Record<EditorialCampaignId, EditorialCampaign>;

export function isEditorialCampaignId(value: unknown): value is EditorialCampaignId {
  return typeof value === 'string' && (EDITORIAL_CAMPAIGN_IDS as readonly string[]).includes(value);
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
  if (record.locale !== 'en' && record.locale !== 'it') return null;
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

export const EDITORIAL_CAMPAIGN_REGISTRY_VERSION = `beta16-outreach-1.0.0-${POLICYWATCHER_RELEASE_DATE}` as const;
