import { POLICYWATCHER_VERSION, POLICYWATCHER_VERSION_DISPLAY } from './release';
import {
  RELEASE_IMPACT_DOMAINS,
  RELEASE_IMPACT_ITEMS,
  type ReleaseImpactItem,
} from './releaseImpact';

export type FeatureAtlasKind = 'business' | 'technical';
export type FeatureAtlasState = 'delivered' | 'current' | 'planned';
export type FeatureAtlasStageId = 'intake' | 'discovery' | 'retrieval' | 'assurance' | 'publication' | 'remediation';
export type FeatureAtlasRelationship =
  | 'depends-on'
  | 'feeds'
  | 'governed-by'
  | 'distributed-through'
  | 'remediated-by';

export interface FeatureAtlasRoute {
  href: string;
  label: string;
  access: 'public' | 'protected';
}

export interface FeatureAtlasDependency {
  featureId: string;
  relationship: FeatureAtlasRelationship;
}

export interface FeatureAtlasConnection extends FeatureAtlasDependency {
  direction: 'incoming' | 'outgoing';
}

export interface FeatureAtlasFeature {
  id: string;
  title: string;
  shortLabel: string;
  summary: string;
  kind: FeatureAtlasKind;
  domainId: string;
  stageId: FeatureAtlasStageId;
  state: FeatureAtlasState;
  releaseId: string;
  release: string;
  horizon: 'delivered' | 'next' | 'later';
  benefit: string;
  kpi: string;
  kri: string;
  evidence: string;
  limitation: string;
  primaryUser: string;
  route?: FeatureAtlasRoute;
  externalDependency?: string;
  dependencies: FeatureAtlasDependency[];
  source: 'release-impact' | 'platform-inventory';
}

export interface FeatureAtlasDomain {
  id: string;
  label: string;
  kind: FeatureAtlasKind;
}

export interface FeatureAtlasStage {
  id: FeatureAtlasStageId;
  index: number;
  shortLabel: string;
  title: string;
  summary: string;
}

export interface FeatureAtlasRelease {
  id: string;
  shortLabel: string;
  label: string;
  current?: boolean;
}

export const FEATURE_ATLAS_CURRENT_RELEASE_ID = POLICYWATCHER_VERSION;

export const FEATURE_ATLAS_STAGES: FeatureAtlasStage[] = [
  { id: 'intake', index: 1, shortLabel: 'Signal', title: 'User signal / source intake', summary: 'A user clue or monitored source enters a bounded workflow.' },
  { id: 'discovery', index: 2, shortLabel: 'Discover', title: 'Official discovery', summary: 'Candidate URLs remain private until official-source review.' },
  { id: 'retrieval', index: 3, shortLabel: 'Capture', title: 'Retrieval & immutable snapshot', summary: 'Layered retrieval produces timestamped content and hash evidence.' },
  { id: 'assurance', index: 4, shortLabel: 'Qualify', title: 'Qualified analysis & assurance', summary: 'Text changes, attention signals and QA remain evidence-qualified.' },
  { id: 'publication', index: 5, shortLabel: 'Publish', title: 'Public evidence & distribution', summary: 'Only gated records reach public views, exports and companions.' },
  { id: 'remediation', index: 6, shortLabel: 'Correct', title: 'Correction review & remediation', summary: 'Accepted cases and scoped operations can review or withhold evidence.' },
];

const featureAtlasDomainExtensions: FeatureAtlasDomain[] = [
  { id: 'discovery', label: 'Official discovery', kind: 'technical' },
  { id: 'evidence', label: 'Evidence integrity', kind: 'technical' },
  { id: 'analysis', label: 'Qualified analysis', kind: 'technical' },
  { id: 'intelligence', label: 'Public intelligence', kind: 'business' },
  { id: 'trust', label: 'Trust operations', kind: 'technical' },
  { id: 'navigation', label: 'Public navigation', kind: 'business' },
];

export const FEATURE_ATLAS_DOMAINS: FeatureAtlasDomain[] = [
  ...RELEASE_IMPACT_DOMAINS,
  ...featureAtlasDomainExtensions,
];

export const FEATURE_ATLAS_RELEASES: FeatureAtlasRelease[] = [
  { id: 'beta.2', shortLabel: 'B2', label: '3.8.3 Beta 2' },
  { id: 'beta.3', shortLabel: 'B3', label: '3.8.3 Beta 3' },
  { id: 'beta.4', shortLabel: 'B4', label: '3.8.3 Beta 4' },
  { id: 'beta.5', shortLabel: 'B5', label: '3.8.3 Beta 5' },
  { id: 'beta.6', shortLabel: 'B6', label: '3.8.3 Beta 6' },
  { id: 'beta.7', shortLabel: 'B7', label: '3.8.3 Beta 7' },
  { id: 'beta.8', shortLabel: 'B8', label: '3.8.3 Beta 8' },
  { id: 'beta.9', shortLabel: 'B9', label: '3.8.3 Beta 9' },
  { id: 'beta.10', shortLabel: 'B10', label: '3.8.3 Beta 10' },
  { id: 'beta.11', shortLabel: 'B11', label: '3.8.3 Beta 11' },
  { id: '3.9.0-beta.1', shortLabel: '3.9 B1', label: '3.9.0 Beta 1' },
  { id: '3.9.0-beta.2', shortLabel: '3.9 B2', label: '3.9.0 Beta 2' },
  { id: '3.9.0-beta.3', shortLabel: '3.9 B3', label: '3.9.0 Beta 3' },
  { id: '3.9.0-beta.4', shortLabel: '3.9 B4', label: POLICYWATCHER_VERSION_DISPLAY },
].map((release) => ({
  ...release,
  label: release.id === FEATURE_ATLAS_CURRENT_RELEASE_ID ? POLICYWATCHER_VERSION_DISPLAY : release.label,
  current: release.id === FEATURE_ATLAS_CURRENT_RELEASE_ID,
}));

const stageByDomain: Record<string, FeatureAtlasStageId> = {
  intake: 'intake',
  retrieval: 'retrieval',
  assurance: 'assurance',
  security: 'assurance',
  legal: 'assurance',
  distribution: 'publication',
  experience: 'publication',
  operations: 'remediation',
  corrections: 'remediation',
};

const primaryUserByDomain: Record<string, string> = {
  experience: 'Public evidence reader',
  corrections: 'Affected organization and reviewer',
  distribution: 'PolicyWatcher user',
  legal: 'GRC or legal reviewer',
  intake: 'PolicyWatcher user and source reviewer',
  retrieval: 'Source QA operator',
  assurance: 'Dataset QA reviewer',
  security: 'Security and platform operator',
  operations: 'Protected admin operator',
};

const routeByFeature: Record<string, FeatureAtlasRoute> = {
  'public-claim-language-governance': { href: '/press-kit', label: 'Press Kit', access: 'public' },
  'editorial-briefing-room': { href: '/press-kit', label: 'Press Kit', access: 'public' },
  'notification-evidence': { href: '/what-changed', label: 'What changed?', access: 'public' },
  'calm-workspace': { href: '/', label: 'Evidence Console', access: 'public' },
  'browser-companion': { href: '/browser-extension', label: 'Browser companion', access: 'public' },
  'regional-discovery': { href: '/admin/source-onboarding', label: 'Source onboarding', access: 'protected' },
  'inquiry-publication-gate': { href: '/admin/source-onboarding', label: 'Source onboarding', access: 'protected' },
  'qualified-language': { href: '/methodology/confidence', label: 'Confidence methodology', access: 'public' },
  'correction-channel': { href: '/what-changed', label: 'Evidence inquiry', access: 'public' },
  'request-hardening': { href: '/security', label: 'Security policy', access: 'public' },
  'hostinger-recovery': { href: '/admin/database', label: 'Database operations', access: 'protected' },
  'impact-clarity': { href: '/roadmap', label: 'Release impact roadmap', access: 'public' },
  'public-surface-consistency': { href: '/trust', label: 'Trust & Quality', access: 'public' },
  'verified-corrections': { href: '/admin/corrections', label: 'Correction cases', access: 'protected' },
  'public-review-state': { href: '/what-changed', label: 'Inquiry status workflow', access: 'public' },
  'source-recovery-console': { href: '/', label: 'Evidence Console', access: 'public' },
  'latest-check-clarity': { href: '/', label: 'Evidence Console', access: 'public' },
  'accessible-changelog': { href: '/roadmap', label: 'Release roadmap', access: 'public' },
  'demo-story-path': { href: '/showcase', label: 'Showcase', access: 'public' },
  'feature-intelligence-atlas': { href: '/feature-atlas', label: 'Feature Intelligence Atlas', access: 'public' },
  'native-dashboard-contracts': { href: '/trust', label: 'Trust & Quality', access: 'public' },
  'governed-regional-benchmark-visualizations': { href: '/', label: 'Evidence Console', access: 'public' },
  'shareable-evidence-views': { href: '/', label: 'Evidence Console', access: 'public' },
  'coordinated-evidence-drilldown': { href: '/', label: 'Evidence Console', access: 'public' },
  'historical-suspensions': { href: '/timeline', label: 'Timeline', access: 'public' },
  'production-validation': { href: '/trust', label: 'Trust & Quality', access: 'public' },
  'renderer-hardening': { href: '/admin/vps-services', label: 'VPS services', access: 'protected' },
  'beta-evidence-cycle': { href: '/roadmap', label: 'Community roadmap', access: 'public' },
};

const dependencyByFeature: Record<string, FeatureAtlasDependency[]> = {
  'public-claim-language-governance': [{ featureId: 'qualified-language', relationship: 'governed-by' }, { featureId: 'editorial-briefing-room', relationship: 'distributed-through' }],
  'editorial-briefing-room': [{ featureId: 'public-surface-consistency', relationship: 'depends-on' }, { featureId: 'explainability-methodology', relationship: 'governed-by' }],
  'notification-evidence': [{ featureId: 'source-portfolio-monitoring', relationship: 'feeds' }],
  'calm-workspace': [{ featureId: 'public-evidence-gate', relationship: 'depends-on' }],
  'browser-companion': [{ featureId: 'notification-evidence', relationship: 'feeds' }],
  'regional-discovery': [{ featureId: 'source-portfolio-monitoring', relationship: 'depends-on' }],
  'inquiry-publication-gate': [{ featureId: 'dataset-qa', relationship: 'governed-by' }],
  'qualified-language': [{ featureId: 'explainability-methodology', relationship: 'governed-by' }],
  'correction-channel': [{ featureId: 'verified-corrections', relationship: 'remediated-by' }],
  'request-hardening': [{ featureId: 'security-privacy-boundaries', relationship: 'governed-by' }],
  'hostinger-recovery': [{ featureId: 'admin-operations', relationship: 'depends-on' }],
  'impact-clarity': [{ featureId: 'interactive-public-navigation', relationship: 'distributed-through' }],
  'public-surface-consistency': [{ featureId: 'public-evidence-gate', relationship: 'depends-on' }],
  'verified-corrections': [{ featureId: 'admin-operations', relationship: 'depends-on' }],
  'public-review-state': [{ featureId: 'verified-corrections', relationship: 'depends-on' }],
  'source-recovery-console': [{ featureId: 'source-suspension-recovery', relationship: 'depends-on' }],
  'latest-check-clarity': [{ featureId: 'source-suspension-recovery', relationship: 'feeds' }],
  'accessible-changelog': [{ featureId: 'impact-clarity', relationship: 'depends-on' }],
  'demo-story-path': [{ featureId: 'evidence-distribution', relationship: 'distributed-through' }],
  'feature-intelligence-atlas': [{ featureId: 'interactive-public-navigation', relationship: 'distributed-through' }],
  'native-dashboard-contracts': [{ featureId: 'public-evidence-gate', relationship: 'governed-by' }],
  'governed-regional-benchmark-visualizations': [{ featureId: 'native-dashboard-contracts', relationship: 'depends-on' }],
  'shareable-evidence-views': [{ featureId: 'native-dashboard-contracts', relationship: 'depends-on' }, { featureId: 'public-evidence-gate', relationship: 'governed-by' }],
  'coordinated-evidence-drilldown': [{ featureId: 'governed-regional-benchmark-visualizations', relationship: 'depends-on' }, { featureId: 'shareable-evidence-views', relationship: 'feeds' }],
  'mobile-email-intake': [{ featureId: 'notification-evidence', relationship: 'feeds' }],
  'mail-addins': [{ featureId: 'mobile-email-intake', relationship: 'depends-on' }],
  'historical-suspensions': [{ featureId: 'source-suspension-recovery', relationship: 'depends-on' }],
  'database-hardening': [{ featureId: 'hostinger-recovery', relationship: 'depends-on' }],
  'residency-assurance': [{ featureId: 'eu-hosting-disclosure', relationship: 'depends-on' }],
  'production-validation': [{ featureId: 'security-privacy-boundaries', relationship: 'depends-on' }],
  'renderer-hardening': [{ featureId: 'retrieval-hierarchy', relationship: 'depends-on' }],
  'beta-evidence-cycle': [{ featureId: 'dataset-qa', relationship: 'depends-on' }],
};

function getReleaseLabel(releaseId: string) {
  if (releaseId === 'next') return 'Next beta horizon';
  if (releaseId === 'later') return 'Later horizon';
  if (releaseId.startsWith('beta.')) return `3.8.3 Beta ${releaseId.slice(5)}`;
  if (releaseId === POLICYWATCHER_VERSION) return POLICYWATCHER_VERSION_DISPLAY;
  if (releaseId === '3.9.0-beta.1') return '3.9.0 Beta 1';
  return releaseId;
}

function toAtlasFeature(item: ReleaseImpactItem): FeatureAtlasFeature {
  const domain = RELEASE_IMPACT_DOMAINS.find((candidate) => candidate.id === item.domainId);
  return {
    id: item.id,
    title: item.title,
    shortLabel: item.title.length > 25 ? item.title.replace(/\b(the|and|to|of)\b/gi, '').replace(/\s+/g, ' ').trim().slice(0, 24) : item.title,
    summary: item.summary,
    kind: domain?.kind ?? 'technical',
    domainId: item.domainId,
    stageId: stageByDomain[item.domainId] ?? 'assurance',
    state: item.status,
    releaseId: item.startRelease,
    release: getReleaseLabel(item.startRelease),
    horizon: item.horizon,
    benefit: item.benefit,
    kpi: item.kpi,
    kri: item.kri,
    evidence: item.evidence,
    limitation: item.limitation,
    primaryUser: primaryUserByDomain[item.domainId] ?? 'Platform stakeholder',
    route: routeByFeature[item.id],
    externalDependency: item.externalDependency,
    dependencies: dependencyByFeature[item.id] ?? [],
    source: 'release-impact',
  };
}

function surfaceFeature(
  input: Omit<FeatureAtlasFeature, 'source' | 'horizon' | 'state' | 'dependencies'> & {
    state?: FeatureAtlasState;
    dependencies?: FeatureAtlasDependency[];
  },
): FeatureAtlasFeature {
  return {
    ...input,
    state: input.state ?? 'delivered',
    horizon: 'delivered',
    dependencies: input.dependencies ?? [],
    source: 'platform-inventory',
  };
}

const platformFeatures: FeatureAtlasFeature[] = [
  {
    id: 'source-portfolio-monitoring', title: 'Source portfolio monitoring', shortLabel: 'Source portfolio',
    summary: 'Maintains a curated portfolio of official policy URLs and scheduled checks.', kind: 'technical', domainId: 'discovery', stageId: 'discovery', state: 'delivered', releaseId: '3.7.0', release: '3.7.0', horizon: 'delivered',
    benefit: 'Official provider sources can be observed through one bounded operating inventory.', kpi: 'Inventory KPI · monitored-source workflow available', kri: 'Residual KRI · source ownership and URL drift require review', evidence: 'Configured policy inventory, scheduled scan routes, source onboarding candidate workflow and admin company views.', limitation: 'A configured URL does not establish completeness or continuing provider ownership.', primaryUser: 'Source QA operator', route: { href: '/admin/companies', label: 'Company sources', access: 'protected' }, dependencies: [], source: 'platform-inventory',
  },
  {
    id: 'immutable-snapshot-evidence', title: 'Immutable snapshot and hash evidence', shortLabel: 'Snapshot + hash',
    summary: 'Stores retrieved policy text with timestamps and content hashes before publication.', kind: 'technical', domainId: 'evidence', stageId: 'retrieval', state: 'delivered', releaseId: 'beta.2', release: '3.8.3 Beta 2', horizon: 'delivered',
    benefit: 'Reviewers can trace a reported change to a preserved retrieval artifact.', kpi: 'Inventory KPI · snapshot provenance available', kri: 'Residual KRI · upstream source authenticity remains external', evidence: 'Policy snapshots, content hash comparisons, persisted check timestamps and public change permalinks.', limitation: 'A hash proves stored-content consistency, not the legal authority of the upstream page.', primaryUser: 'Evidence reviewer', route: { href: '/timeline', label: 'Public timeline', access: 'public' }, dependencies: [{ featureId: 'retrieval-hierarchy', relationship: 'depends-on' }], source: 'platform-inventory',
  },
  {
    id: 'retrieval-hierarchy', title: 'Layered retrieval hierarchy', shortLabel: 'Retrieval hierarchy',
    summary: 'Attempts direct retrieval before bounded archival and protected renderer fallbacks.', kind: 'technical', domainId: 'retrieval', stageId: 'retrieval', state: 'delivered', releaseId: 'beta.2', release: '3.8.3 Beta 2', horizon: 'delivered',
    benefit: 'Source QA has multiple evidence-recovery paths when an official page is unavailable.', kpi: 'Inventory KPI · direct, Wayback, Common Crawl and renderer paths represented', kri: 'Residual KRI · archive freshness and renderer availability remain variable', evidence: 'Scraper cascade, Wayback integration, Common Crawl lookup, renderer boundary and retrieval tests.', limitation: 'Fallback content can be unavailable, stale or unsuitable for public publication.', primaryUser: 'Source QA operator', route: { href: '/methodology/confidence', label: 'Confidence methodology', access: 'public' }, dependencies: [{ featureId: 'source-portfolio-monitoring', relationship: 'depends-on' }], source: 'platform-inventory',
  },
  {
    id: 'textual-change-extraction', title: 'Textual change extraction', shortLabel: 'Text change extraction',
    summary: 'Builds bounded added, removed and unchanged text evidence from snapshot pairs.', kind: 'technical', domainId: 'analysis', stageId: 'assurance', state: 'delivered', releaseId: 'beta.2', release: '3.8.3 Beta 2', horizon: 'delivered',
    benefit: 'Readers can inspect the textual basis for an attention signal.', kpi: 'Inventory KPI · inspectable text delta available', kri: 'Residual KRI · semantic significance still needs qualified interpretation', evidence: 'Diff parsing helpers, DiffViewer, policy detail views and regression fixtures.', limitation: 'Text extraction does not determine legal effect or organizational compliance.', primaryUser: 'Public evidence reader', route: { href: '/timeline', label: 'Timeline', access: 'public' }, dependencies: [{ featureId: 'immutable-snapshot-evidence', relationship: 'depends-on' }], source: 'platform-inventory',
  },
  {
    id: 'ai-attention-signals', title: 'AI-assisted attention signals', shortLabel: 'Attention signals',
    summary: 'Produces qualified analysis from source text with a deterministic fallback when AI output is unavailable.', kind: 'technical', domainId: 'analysis', stageId: 'assurance', state: 'delivered', releaseId: 'beta.2', release: '3.8.3 Beta 2', horizon: 'delivered',
    benefit: 'Reviewers receive a bounded prioritization cue without losing the underlying text evidence.', kpi: 'Inventory KPI · qualified analysis path available', kri: 'Residual KRI · model output can be incomplete or inaccurate', evidence: 'Gemini analysis boundary, deterministic policy-confidence fallback, parsed reason components and qualified public wording.', limitation: 'Signals are not legal findings, adoption measurements or compliance certification.', primaryUser: 'GRC or policy reviewer', route: { href: '/methodology/confidence', label: 'Confidence methodology', access: 'public' }, dependencies: [{ featureId: 'textual-change-extraction', relationship: 'depends-on' }, { featureId: 'explainability-methodology', relationship: 'governed-by' }], source: 'platform-inventory',
  },
  {
    id: 'dataset-qa', title: 'Dataset QA and confidence review', shortLabel: 'Dataset QA',
    summary: 'Checks coverage, freshness, evidence state and onboarding readiness through protected operations.', kind: 'technical', domainId: 'assurance', stageId: 'assurance', state: 'delivered', releaseId: 'beta.2', release: '3.8.3 Beta 2', horizon: 'delivered',
    benefit: 'Operators can find incomplete evidence before it reaches public interpretation.', kpi: 'Inventory KPI · dataset assurance workflow available', kri: 'Residual KRI · operator capacity and production freshness remain open', evidence: 'Dataset-quality admin route, assurance script, QA indicators, KPI audit and review logs.', limitation: 'Automated QA cannot establish source completeness or replace human review.', primaryUser: 'Dataset QA reviewer', route: { href: '/admin/dataset-quality', label: 'Dataset quality', access: 'protected' }, dependencies: [{ featureId: 'immutable-snapshot-evidence', relationship: 'depends-on' }], source: 'platform-inventory',
  },
  {
    id: 'public-evidence-gate', title: 'Fail-closed public evidence gate', shortLabel: 'Public evidence gate',
    summary: 'Exposes only records that satisfy explicit publication, verification and suspension boundaries.', kind: 'technical', domainId: 'evidence', stageId: 'publication', state: 'delivered', releaseId: 'beta.4', release: '3.8.3 Beta 4', horizon: 'delivered',
    benefit: 'Unverified, private or suspended records stay outside public evidence views.', kpi: 'Inventory KPI · fail-closed publication boundary guarded', kri: 'Residual KRI · publication quality retains a human dependency', evidence: 'Shared publicDataGate predicates, public API filters, sitemap filtering and empty-state regression tests.', limitation: 'The gate limits exposure but does not certify the truth or completeness of published evidence.', primaryUser: 'Public evidence reader', route: { href: '/', label: 'Evidence Console', access: 'public' }, dependencies: [{ featureId: 'dataset-qa', relationship: 'governed-by' }], source: 'platform-inventory',
  },
  {
    id: 'explainability-methodology', title: 'Explainability and methodology', shortLabel: 'Methodology',
    summary: 'Documents provenance, retrieval fallbacks, confidence boundaries and qualified use.', kind: 'business', domainId: 'legal', stageId: 'assurance', state: 'delivered', releaseId: 'beta.5', release: '3.8.3 Beta 5', horizon: 'delivered',
    benefit: 'Stakeholders can inspect how evidence becomes a qualified signal before relying on it.', kpi: 'Inventory KPI · method boundary publicly inspectable', kri: 'Residual KRI · reader comprehension requires continued validation', evidence: 'Confidence methodology route, evidence status rails, disclaimers and per-feature implementation proof.', limitation: 'Documentation does not make an automated output a legal opinion or certification.', primaryUser: 'Public, legal and technical reviewer', route: { href: '/methodology/confidence', label: 'Confidence methodology', access: 'public' }, dependencies: [{ featureId: 'textual-change-extraction', relationship: 'depends-on' }], source: 'platform-inventory',
  },
  {
    id: 'evidence-distribution', title: 'Timeline, share and PDF evidence', shortLabel: 'Evidence distribution',
    summary: 'Distributes source-qualified changes through timelines, permalinks, share views and bounded reports.', kind: 'business', domainId: 'distribution', stageId: 'publication', state: 'delivered', releaseId: 'beta.5', release: '3.8.3 Beta 5', horizon: 'delivered',
    benefit: 'A stakeholder can carry an evidence trail into review and presentation workflows.', kpi: 'Inventory KPI · evidence routes and export surfaces available', kri: 'Residual KRI · copied artifacts can become stale outside the platform', evidence: 'Timeline, change and share routes, executive PDF report, export helpers and evidence timestamps.', limitation: 'A shared or exported artifact must still be checked against current provider evidence.', primaryUser: 'Researcher, GRC reviewer and presenter', route: { href: '/timeline', label: 'Timeline', access: 'public' }, dependencies: [{ featureId: 'public-evidence-gate', relationship: 'depends-on' }], source: 'platform-inventory',
  },
  {
    id: 'admin-operations', title: 'Protected admin operations', shortLabel: 'Admin operations',
    summary: 'Provides protected scan, source, QA, correction, access-log and recovery workspaces.', kind: 'technical', domainId: 'operations', stageId: 'remediation', state: 'delivered', releaseId: 'beta.6', release: '3.8.3 Beta 6', horizon: 'delivered',
    benefit: 'Operators can inspect and remediate evidence state without exposing controls publicly.', kpi: 'Inventory KPI · protected operational workspaces available', kri: 'Residual KRI · privileged access and runbook quality require review', evidence: 'Admin authentication, access logging, cron, database, source onboarding, correction and QA routes.', limitation: 'Protected tooling does not guarantee successful remediation or deployed-environment health.', primaryUser: 'Authorized platform operator', route: { href: '/admin', label: 'Admin operations', access: 'protected' }, dependencies: [{ featureId: 'security-privacy-boundaries', relationship: 'governed-by' }], source: 'platform-inventory',
  },
  {
    id: 'source-suspension-recovery', title: 'Source suspension and recovery', shortLabel: 'Suspension + recovery',
    summary: 'Withholds unsuitable evidence and presents bounded causes, attempts and next operator actions.', kind: 'technical', domainId: 'operations', stageId: 'remediation', state: 'delivered', releaseId: 'beta.10', release: '3.8.3 Beta 10', horizon: 'delivered',
    benefit: 'Public readers and operators can distinguish withheld evidence from an asserted policy outcome.', kpi: 'Inventory KPI · suspension state and scoped recovery path available', kri: 'Residual KRI · provider blocks and source changes may remain unresolved', evidence: 'Source-suspension API, presentation mapping, latest-check selection, admin guides and recovery console.', limitation: 'Recovery is not guaranteed and public views must remain fail-closed.', primaryUser: 'Source QA operator and public reader', route: { href: '/', label: 'Evidence Console', access: 'public' }, dependencies: [{ featureId: 'public-evidence-gate', relationship: 'remediated-by' }, { featureId: 'admin-operations', relationship: 'depends-on' }], source: 'platform-inventory',
  },
  {
    id: 'security-privacy-boundaries', title: 'Security and privacy boundaries', shortLabel: 'Security boundaries',
    summary: 'Bounds public input, minimizes sensitive logging and separates public from privileged operations.', kind: 'technical', domainId: 'security', stageId: 'assurance', state: 'delivered', releaseId: 'beta.5', release: '3.8.3 Beta 5', horizon: 'delivered',
    benefit: 'Exposed workflows operate with narrower input, context and disclosure boundaries.', kpi: 'Inventory KPI · bounded request and access controls represented', kri: 'Residual KRI · deployed attack paths remain pending validation', evidence: 'Request-body limits, rate controls, safe errors, masked logs, admin auth and security regression tests.', limitation: 'Local controls and static checks are not a production security certification.', primaryUser: 'Security reviewer and platform operator', route: { href: '/security', label: 'Security policy', access: 'public' }, dependencies: [], source: 'platform-inventory',
  },
  {
    id: 'eu-hosting-disclosure', title: 'EU hosting disclosure', shortLabel: 'EU hosting',
    summary: 'States the platform storage region and backup region alongside explicit documentary limits.', kind: 'business', domainId: 'legal', stageId: 'publication', state: 'delivered', releaseId: 'beta.6', release: '3.8.3 Beta 6', horizon: 'delivered',
    benefit: 'Stakeholders can see the stated operating region before reviewing contractual evidence.', kpi: 'Inventory KPI · hosting location disclosure visible', kri: 'Residual KRI · contractual evidence and provider changes remain external', evidence: 'Global footer disclosure, privacy page and planned residency evidence pack.', limitation: 'Location wording is not a DPA, subprocessor register or compliance certification.', primaryUser: 'Privacy and procurement reviewer', route: { href: '/privacy', label: 'Privacy policy', access: 'public' }, externalDependency: 'Current hosting-provider documentation', dependencies: [{ featureId: 'security-privacy-boundaries', relationship: 'governed-by' }], source: 'platform-inventory',
  },
  {
    id: 'interactive-public-navigation', title: 'Interactive public navigation', shortLabel: 'Public navigation',
    summary: 'Connects evidence, methodology, trust, roadmap and page-level orientation surfaces.', kind: 'business', domainId: 'navigation', stageId: 'publication', state: 'delivered', releaseId: 'beta.8', release: '3.8.3 Beta 8', horizon: 'delivered',
    benefit: 'Non-technical stakeholders can move between product evidence and its operating boundaries.', kpi: 'Inventory KPI · guided public exploration available', kri: 'Residual KRI · cross-route comprehension remains pending observation', evidence: 'Command palette, public header, global footer, Site Atlas, showcase and route metadata.', limitation: 'Navigation describes available surfaces; it does not establish adoption or comprehension.', primaryUser: 'Public visitor and product reviewer', route: { href: '/atlas', label: 'Site Atlas', access: 'public' }, dependencies: [{ featureId: 'explainability-methodology', relationship: 'distributed-through' }], source: 'platform-inventory',
  },
];

const platformSurfaceFeatures: FeatureAtlasFeature[] = [
  surfaceFeature({
    id: 'evidence-console-dashboard', title: 'Public evidence console', shortLabel: 'Evidence Console',
    summary: 'Composes public companies, policy records, QA state and source availability into the main inspection workspace.', kind: 'business', domainId: 'intelligence', stageId: 'publication', releaseId: '3.7.0', release: '3.7.0',
    benefit: 'A public stakeholder can inspect the currently publishable evidence portfolio in one place.', kpi: 'Inventory KPI · public evidence workspace available', kri: 'Residual KRI · portfolio coverage and freshness remain bounded by monitored sources', evidence: 'Dashboard composer, public companies and changes APIs, PolicyDetails and evidence-status components.', limitation: 'The workspace reports available evidence and does not measure provider compliance.', primaryUser: 'Public evidence reader', route: { href: '/', label: 'Evidence Console', access: 'public' }, dependencies: [{ featureId: 'public-evidence-gate', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'portfolio-workspace-filters', title: 'Portfolio and workspace filters', shortLabel: 'Workspace filters',
    summary: 'Filters evidence by company, industry, region and reviewer perspective while retaining a deterministic workspace.', kind: 'business', domainId: 'experience', stageId: 'publication', releaseId: '3.7.2', release: '3.7.2',
    benefit: 'Different stakeholders can narrow the same public inventory without changing its evidence rules.', kpi: 'Inventory KPI · bounded portfolio filtering available', kri: 'Residual KRI · filter choices can omit relevant context', evidence: 'Dashboard filter state, workspace composer, navigation quick actions and responsive filter controls.', limitation: 'A filtered view is not a complete market or legal assessment.', primaryUser: 'Citizen, GRC reviewer, researcher or builder', route: { href: '/', label: 'Evidence Console', access: 'public' }, dependencies: [{ featureId: 'evidence-console-dashboard', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'regional-impact-view', title: 'Regional evidence context', shortLabel: 'Regional context',
    summary: 'Keeps EU, US and global source context visible across public filtering and comparison.', kind: 'business', domainId: 'intelligence', stageId: 'publication', releaseId: '3.8.2', release: '3.8.2',
    benefit: 'Reviewers can distinguish source-region context before comparing policy movement.', kpi: 'Inventory KPI · regional evidence lens available', kri: 'Residual KRI · locale coverage is not exhaustive', evidence: 'Region filters, locale-aware policy inventory and regional discovery metadata.', limitation: 'Region labels describe evidence context and do not determine jurisdiction or legal effect.', primaryUser: 'Regional policy reviewer', route: { href: '/', label: 'Evidence Console', access: 'public' }, dependencies: [{ featureId: 'regional-discovery', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'public-change-timeline', title: 'Source-verified change timeline', shortLabel: 'Change timeline',
    summary: 'Orders publishable policy changes chronologically with source and review context.', kind: 'business', domainId: 'intelligence', stageId: 'publication', releaseId: '3.7.0', release: '3.7.0',
    benefit: 'Readers can follow recorded policy movement across providers and time.', kpi: 'Inventory KPI · chronological evidence surface available', kri: 'Residual KRI · missing or suspended source intervals remain visible gaps', evidence: 'Timeline route, public change query, persisted timestamps and evidence-state presentation.', limitation: 'The timeline reflects recorded public evidence, not every provider change.', primaryUser: 'Researcher and public evidence reader', route: { href: '/timeline', label: 'Timeline', access: 'public' }, dependencies: [{ featureId: 'public-evidence-gate', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'change-permalink', title: 'Evidence change permalink', shortLabel: 'Change permalink',
    summary: 'Provides a stable public detail surface for a single publishable change record.', kind: 'business', domainId: 'evidence', stageId: 'publication', releaseId: '3.7.0', release: '3.7.0',
    benefit: 'A specific evidence record can be cited and revisited during review.', kpi: 'Inventory KPI · record-level evidence route available', kri: 'Residual KRI · later correction or suspension can change public state', evidence: 'Dynamic change route, publicDataGate lookup, source links and review-state component.', limitation: 'A permalink preserves access to the current qualified record, not immutable public availability.', primaryUser: 'Evidence reviewer', route: { href: '/timeline', label: 'Timeline index', access: 'public' }, dependencies: [{ featureId: 'public-change-timeline', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'policy-detail-evidence', title: 'Policy detail evidence view', shortLabel: 'Policy details',
    summary: 'Presents source, snapshot, analysis and evidence-state details for an inspected policy record.', kind: 'business', domainId: 'evidence', stageId: 'publication', releaseId: '3.7.0', release: '3.7.0',
    benefit: 'Reviewers can inspect provenance beside the qualified interpretation.', kpi: 'Inventory KPI · policy evidence detail available', kri: 'Residual KRI · source text still requires independent verification', evidence: 'PolicyDetails, evidence review state, source status rail and public record composition.', limitation: 'The view does not convert a text-derived signal into legal advice.', primaryUser: 'GRC reviewer and researcher', route: { href: '/', label: 'Evidence Console', access: 'public' }, dependencies: [{ featureId: 'immutable-snapshot-evidence', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'side-by-side-diff', title: 'Side-by-side textual diff', shortLabel: 'Diff viewer',
    summary: 'Separates additions, removals and unchanged policy text for direct inspection.', kind: 'technical', domainId: 'analysis', stageId: 'assurance', releaseId: '3.7.0', release: '3.7.0',
    benefit: 'A reviewer can verify what text changed before considering an attention signal.', kpi: 'Inventory KPI · inspectable before-and-after text available', kri: 'Residual KRI · formatting and source structure can affect extraction', evidence: 'DiffViewer, diffParse helpers and text-change regression tests.', limitation: 'A textual diff does not establish why a provider made a change or its legal effect.', primaryUser: 'Technical and policy reviewer', route: { href: '/timeline', label: 'Timeline', access: 'public' }, dependencies: [{ featureId: 'textual-change-extraction', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'share-evidence-view', title: 'Public share evidence view', shortLabel: 'Share view',
    summary: 'Creates a bounded presentation surface for a publishable change without exposing private records.', kind: 'business', domainId: 'distribution', stageId: 'publication', releaseId: '3.7.0', release: '3.7.0',
    benefit: 'Stakeholders can review the same qualified evidence through a concise public route.', kpi: 'Inventory KPI · gated sharing surface available', kri: 'Residual KRI · shared context can become stale', evidence: 'Dynamic share route, public evidence lookup, qualified language and review links.', limitation: 'Sharing does not endorse the interpretation or freeze future correction state.', primaryUser: 'Presenter and evidence reviewer', dependencies: [{ featureId: 'change-permalink', relationship: 'distributed-through' }],
  }),
  surfaceFeature({
    id: 'executive-pdf-report', title: 'Executive evidence PDF', shortLabel: 'Evidence PDF',
    summary: 'Renders selected public evidence with source dates, qualification and correction routes.', kind: 'business', domainId: 'distribution', stageId: 'publication', releaseId: '3.7.0', release: '3.7.0',
    benefit: 'A review artifact can carry provenance and limitations into an offline discussion.', kpi: 'Inventory KPI · qualified PDF evidence artifact available', kri: 'Residual KRI · downloaded reports can age outside the live platform', evidence: 'ExecutiveReport PDF component, source metadata, qualified wording and correction link.', limitation: 'A PDF is a point-in-time artifact and not a certification or live status source.', primaryUser: 'Executive and GRC reviewer', dependencies: [{ featureId: 'public-evidence-gate', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'evidence-csv-export', title: 'Bounded evidence CSV export', shortLabel: 'CSV export',
    summary: 'Exports the selected public evidence inventory with normalized fields.', kind: 'business', domainId: 'distribution', stageId: 'publication', releaseId: '3.7.0', release: '3.7.0',
    benefit: 'Analysts can continue evidence review in their own tabular workflow.', kpi: 'Inventory KPI · structured public export available', kri: 'Residual KRI · downstream copies lose live correction state', evidence: 'Exporter helpers, dashboard export action and export regression tests.', limitation: 'Exported rows require source revalidation before later use.', primaryUser: 'Analyst and researcher', route: { href: '/', label: 'Evidence Console', access: 'public' }, dependencies: [{ featureId: 'public-evidence-gate', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'cross-company-comparison', title: 'Cross-company evidence matrix', shortLabel: 'Company matrix',
    summary: 'Compares evidence-qualified policy indicators across the visible provider portfolio.', kind: 'business', domainId: 'intelligence', stageId: 'publication', releaseId: '3.7.0', release: '3.7.0',
    benefit: 'Reviewers can inspect relative evidence patterns without treating them as legal ranking.', kpi: 'Inventory KPI · cross-company comparison available', kri: 'Residual KRI · unequal source coverage can affect comparison', evidence: 'CrossCompanyMatrix, compare API and public evidence filters.', limitation: 'The matrix is not a compliance score or measured business-performance ranking.', primaryUser: 'Researcher and portfolio reviewer', route: { href: '/', label: 'Evidence Console', access: 'public' }, dependencies: [{ featureId: 'evidence-console-dashboard', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'policy-signals-board', title: 'Policy Signals Board', shortLabel: 'Signals board',
    summary: 'Ranks operational evidence signals such as source coverage, traceability and recorded movement.', kind: 'business', domainId: 'intelligence', stageId: 'publication', releaseId: 'beta.8', release: '3.8.3 Beta 8',
    benefit: 'Stakeholders can orient across the public evidence portfolio before opening detail.', kpi: 'Inventory KPI · evidence-only comparison board available', kri: 'Residual KRI · ranking can be misread without methodology', evidence: 'Leaderboard data composition, public route, evidence-only labels and tests.', limitation: 'The board does not rank legal conformity, ethics or corporate quality.', primaryUser: 'Public intelligence reviewer', route: { href: '/leaderboard', label: 'Policy Signals Board', access: 'public' }, dependencies: [{ featureId: 'public-evidence-gate', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'observatory-registry', title: 'Authoritative-source observatory', shortLabel: 'Observatory',
    summary: 'Curates reference sources for privacy, AI governance, standards and enforcement context.', kind: 'business', domainId: 'intelligence', stageId: 'discovery', releaseId: 'beta.8', release: '3.8.3 Beta 8',
    benefit: 'Reviewers can inspect contextual authorities beside provider evidence.', kpi: 'Inventory KPI · curated reference registry available', kri: 'Residual KRI · registry completeness and currency require editorial review', evidence: 'Observatory route, curated registry data, source categories and methodology links.', limitation: 'Reference inclusion is not endorsement and does not create a legal conclusion.', primaryUser: 'Researcher and policy reviewer', route: { href: '/observatory', label: 'Observatory', access: 'public' }, dependencies: [{ featureId: 'interactive-public-navigation', relationship: 'distributed-through' }],
  }),
  surfaceFeature({
    id: 'subscriber-alerts', title: 'Policy change subscriptions', shortLabel: 'Change alerts',
    summary: 'Collects bounded subscriber preferences for future public policy-change notifications.', kind: 'business', domainId: 'distribution', stageId: 'publication', releaseId: '3.7.0', release: '3.7.0',
    benefit: 'A user can register interest in public policy-change alerts.', kpi: 'Inventory KPI · subscription preference workflow available', kri: 'Residual KRI · delivery, consent and list hygiene remain operational dependencies', evidence: 'Subscriber API, preference validation, subscribe modal and unsubscribe route.', limitation: 'Subscription does not guarantee delivery or imply that every source change is detected.', primaryUser: 'PolicyWatcher subscriber', route: { href: '/', label: 'Evidence Console', access: 'public' }, dependencies: [{ featureId: 'public-evidence-gate', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'inquiry-operator-notifications', title: 'Inquiry operator notifications', shortLabel: 'Inquiry notice',
    summary: 'Notifies the protected review workflow when a bounded policy inquiry needs human attention.', kind: 'technical', domainId: 'intake', stageId: 'intake', releaseId: '3.7.1', release: '3.7.1',
    benefit: 'A user-submitted clue can reach an operator without becoming public evidence.', kpi: 'Inventory KPI · inquiry notification path available', kri: 'Residual KRI · mail transport and operator response remain external', evidence: 'Policy inquiry store, admin notification composition, mailer boundary and integration tests.', limitation: 'Notification delivery does not approve, discover or publish a source.', primaryUser: 'Protected inquiry reviewer', route: { href: '/admin/inquiries', label: 'Inquiry queue', access: 'protected' }, dependencies: [{ featureId: 'notification-evidence', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'source-onboarding-workbench', title: 'Private source onboarding workbench', shortLabel: 'Source onboarding',
    summary: 'Moves reviewed official candidates through private baseline, QA and explicit publication decisions.', kind: 'technical', domainId: 'discovery', stageId: 'discovery', releaseId: 'beta.4', release: '3.8.3 Beta 4',
    benefit: 'Operators can prepare new monitored sources without exposing incomplete evidence.', kpi: 'Inventory KPI · private onboarding workflow available', kri: 'Residual KRI · official-source approval remains human', evidence: 'Source onboarding service, candidate model, admin workspace and focused tests.', limitation: 'Onboarding does not guarantee successful retrieval or public publication.', primaryUser: 'Source QA operator', route: { href: '/admin/source-onboarding', label: 'Source onboarding', access: 'protected' }, dependencies: [{ featureId: 'inquiry-publication-gate', relationship: 'governed-by' }],
  }),
  surfaceFeature({
    id: 'official-candidate-review', title: 'Official source candidate review', shortLabel: 'Candidate review',
    summary: 'Captures bounded candidate reasons, locale clues and review state before configuration.', kind: 'technical', domainId: 'discovery', stageId: 'discovery', releaseId: 'beta.4', release: '3.8.3 Beta 4',
    benefit: 'Reviewers can compare official-source candidates before choosing a monitored URL.', kpi: 'Inventory KPI · candidate review evidence available', kri: 'Residual KRI · official ownership can remain ambiguous', evidence: 'SourceOnboardingCandidate model, URL assessment helpers and review presentation.', limitation: 'A candidate score or clue is not automatic proof of source authority.', primaryUser: 'Source QA operator', route: { href: '/admin/source-onboarding', label: 'Source onboarding', access: 'protected' }, dependencies: [{ featureId: 'source-portfolio-monitoring', relationship: 'feeds' }],
  }),
  surfaceFeature({
    id: 'background-discovery-jobs', title: 'Bounded discovery job queue', shortLabel: 'Discovery jobs',
    summary: 'Schedules and records official-source discovery work without coupling it to public publication.', kind: 'technical', domainId: 'discovery', stageId: 'discovery', releaseId: 'beta.4', release: '3.8.3 Beta 4',
    benefit: 'Discovery work can be retried and inspected independently of public evidence.', kpi: 'Inventory KPI · persistent discovery job workflow available', kri: 'Residual KRI · production worker capacity and target availability remain variable', evidence: 'Policy discovery job helpers, workflow state, bounded retries and job regression tests.', limitation: 'Job completion does not establish source authority or publication readiness.', primaryUser: 'Platform operator', route: { href: '/admin/source-onboarding', label: 'Source onboarding', access: 'protected' }, dependencies: [{ featureId: 'official-candidate-review', relationship: 'feeds' }],
  }),
  surfaceFeature({
    id: 'configured-policy-inventory', title: 'Configured policy source inventory', shortLabel: 'Policy inventory',
    summary: 'Keeps provider, policy type, region and official URL configuration explicit.', kind: 'technical', domainId: 'discovery', stageId: 'discovery', releaseId: '3.7.0', release: '3.7.0',
    benefit: 'Operators can inspect the exact source portfolio the platform intends to monitor.', kpi: 'Inventory KPI · typed source configuration available', kri: 'Residual KRI · configuration can drift from provider publishing practices', evidence: 'Configured policy helpers, company admin views, source onboarding and regression tests.', limitation: 'Configuration records monitoring intent, not continuing source availability.', primaryUser: 'Source QA operator', route: { href: '/admin/companies', label: 'Company sources', access: 'protected' }, dependencies: [{ featureId: 'source-portfolio-monitoring', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'direct-http-retrieval', title: 'Direct official-source retrieval', shortLabel: 'Direct retrieval',
    summary: 'Attempts bounded HTTP retrieval from the configured official source before fallbacks.', kind: 'technical', domainId: 'retrieval', stageId: 'retrieval', releaseId: '3.7.0', release: '3.7.0',
    benefit: 'The freshest reachable official text is the first capture path.', kpi: 'Inventory KPI · direct retrieval path available', kri: 'Residual KRI · provider blocks, redirects and script rendering can prevent capture', evidence: 'Scraper direct fetch, response validation, safe error handling and retrieval tests.', limitation: 'A successful response can still contain interstitial, incomplete or unsuitable content.', primaryUser: 'Source QA operator', dependencies: [{ featureId: 'configured-policy-inventory', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'wayback-archive-retrieval', title: 'Wayback archive fallback', shortLabel: 'Wayback fallback',
    summary: 'Looks for bounded historical snapshots when the configured official source cannot be retrieved.', kind: 'technical', domainId: 'retrieval', stageId: 'retrieval', releaseId: 'beta.2', release: '3.8.3 Beta 2',
    benefit: 'Source QA may recover an inspectable historical artifact during an outage.', kpi: 'Inventory KPI · Wayback fallback represented', kri: 'Residual KRI · archive coverage and capture date remain external', evidence: 'Wayback lookup helper, retrieval cascade and archive provenance metadata.', limitation: 'Archived content can be stale, missing or inappropriate for current public evidence.', primaryUser: 'Source QA operator', externalDependency: 'Internet Archive availability and coverage', dependencies: [{ featureId: 'direct-http-retrieval', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'common-crawl-retrieval', title: 'Common Crawl fallback', shortLabel: 'Common Crawl',
    summary: 'Queries bounded Common Crawl indexes as another recovery path for public source text.', kind: 'technical', domainId: 'retrieval', stageId: 'retrieval', releaseId: 'beta.2', release: '3.8.3 Beta 2',
    benefit: 'Operators gain an additional archive clue when direct and primary archive paths fail.', kpi: 'Inventory KPI · Common Crawl fallback represented', kri: 'Residual KRI · index freshness and content fidelity remain external', evidence: 'Common Crawl branch in the scraper cascade, content checks and provenance handling.', limitation: 'Crawl data is not assumed current or publishable without qualification.', primaryUser: 'Source QA operator', externalDependency: 'Common Crawl index availability', dependencies: [{ featureId: 'wayback-archive-retrieval', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'protected-renderer-retrieval', title: 'Protected browser renderer', shortLabel: 'Renderer retrieval',
    summary: 'Uses a separately protected renderer for official sources that require browser execution.', kind: 'technical', domainId: 'retrieval', stageId: 'retrieval', releaseId: 'beta.4', release: '3.8.3 Beta 4',
    benefit: 'Script-rendered official pages can enter the same evidence-review workflow.', kpi: 'Inventory KPI · protected renderer boundary represented', kri: 'Residual KRI · production secrets, egress and renderer health remain open', evidence: 'Renderer URL and secret boundary, VPS service checks, trust evidence and retrieval integration.', limitation: 'Renderer output remains subject to content validation and does not bypass the public evidence gate.', primaryUser: 'Platform operator', route: { href: '/admin/vps-services', label: 'VPS services', access: 'protected' }, dependencies: [{ featureId: 'retrieval-hierarchy', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'source-check-history', title: 'Source check history', shortLabel: 'Check history',
    summary: 'Records bounded retrieval attempts and timestamps for source QA and public status presentation.', kind: 'technical', domainId: 'evidence', stageId: 'retrieval', releaseId: 'beta.6', release: '3.8.3 Beta 6',
    benefit: 'Reviewers can distinguish the latest recorded attempt from older source state.', kpi: 'Inventory KPI · retrieval attempt history available', kri: 'Residual KRI · bounded retention does not provide complete observability', evidence: 'Policy check logs, latest-check normalization, admin scan summaries and regression tests.', limitation: 'Check history records attempts, not proof that an unchanged page is legally equivalent.', primaryUser: 'Source QA operator', route: { href: '/admin/cron', label: 'Scan operations', access: 'protected' }, dependencies: [{ featureId: 'direct-http-retrieval', relationship: 'feeds' }],
  }),
  surfaceFeature({
    id: 'content-hash-comparison', title: 'Content hash comparison', shortLabel: 'Hash comparison',
    summary: 'Uses normalized content hashes to avoid treating identical stored text as a new change.', kind: 'technical', domainId: 'evidence', stageId: 'retrieval', releaseId: '3.7.0', release: '3.7.0',
    benefit: 'The pipeline can separate recorded text changes from repeated identical captures.', kpi: 'Inventory KPI · deterministic content comparison available', kri: 'Residual KRI · normalization can hide non-textual presentation changes', evidence: 'Snapshot hashes, configured policy baselines and scraper comparison logic.', limitation: 'Hash equality applies to normalized captured content, not the complete provider experience.', primaryUser: 'Evidence pipeline reviewer', dependencies: [{ featureId: 'immutable-snapshot-evidence', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'policy-confidence-rubric', title: 'Deterministic policy confidence rubric', shortLabel: 'Confidence rubric',
    summary: 'Computes explainable evidence-confidence categories from source and review conditions.', kind: 'technical', domainId: 'analysis', stageId: 'assurance', releaseId: 'beta.5', release: '3.8.3 Beta 5',
    benefit: 'A reviewer receives a reproducible confidence cue when interpreting evidence.', kpi: 'Inventory KPI · deterministic confidence rubric available', kri: 'Residual KRI · categorical confidence can be over-interpreted', evidence: 'Policy confidence helpers, defaults, reason codes and regression tests.', limitation: 'Confidence describes evidence conditions, not legal correctness or business impact.', primaryUser: 'Evidence reviewer', route: { href: '/methodology/confidence', label: 'Confidence methodology', access: 'public' }, dependencies: [{ featureId: 'dataset-qa', relationship: 'governed-by' }],
  }),
  surfaceFeature({
    id: 'explainable-attention-reasons', title: 'Explainable attention reasons', shortLabel: 'Attention reasons',
    summary: 'Presents bounded reasons behind an AI-assisted or deterministic attention signal.', kind: 'business', domainId: 'analysis', stageId: 'assurance', releaseId: 'beta.5', release: '3.8.3 Beta 5',
    benefit: 'Readers can inspect why a text change was surfaced instead of seeing an opaque label.', kpi: 'Inventory KPI · signal reasons inspectable', kri: 'Residual KRI · explanations can remain incomplete or model-derived', evidence: 'RiskReasons components, parsed AI output, deterministic fallback reasons and qualified labels.', limitation: 'Reasons prioritize review and are not an unqualified risk score or legal finding.', primaryUser: 'GRC and public evidence reviewer', route: { href: '/methodology/confidence', label: 'Confidence methodology', access: 'public' }, dependencies: [{ featureId: 'ai-attention-signals', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'kpi-assurance-audit', title: 'KPI definition assurance audit', shortLabel: 'KPI audit',
    summary: 'Checks KPI defaults, justifications and coverage through a protected audit surface.', kind: 'technical', domainId: 'assurance', stageId: 'assurance', releaseId: 'beta.6', release: '3.8.3 Beta 6',
    benefit: 'Operators can find unsupported or incomplete indicator definitions before public use.', kpi: 'Inventory KPI · indicator audit workflow available', kri: 'Residual KRI · audited definitions still require domain review', evidence: 'KPI audit helpers, defaults, justifications, protected route and focused tests.', limitation: 'Definition coverage does not validate a provider outcome or legal conclusion.', primaryUser: 'Dataset QA reviewer', route: { href: '/admin/kpi-audit', label: 'KPI audit', access: 'protected' }, dependencies: [{ featureId: 'dataset-qa', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'verified-review-status-model', title: 'Correction review status model', shortLabel: 'Review status',
    summary: 'Keeps correction verification, triage, acceptance and resolution states explicit.', kind: 'technical', domainId: 'corrections', stageId: 'remediation', releaseId: 'beta.9', release: '3.8.3 Beta 9',
    benefit: 'Reviewers and requesters can distinguish submission from accepted evidence review.', kpi: 'Inventory KPI · explicit correction states available', kri: 'Residual KRI · human triage time remains open', evidence: 'Correction case model, status helpers, verification control and wiring tests.', limitation: 'A submitted or verified request does not automatically change public evidence.', primaryUser: 'Requester and correction reviewer', route: { href: '/what-changed', label: 'Evidence inquiry', access: 'public' }, dependencies: [{ featureId: 'verified-corrections', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'admin-review-log', title: 'Protected evidence review log', shortLabel: 'Review log',
    summary: 'Presents recorded evidence review actions and outcomes to authorized operators.', kind: 'technical', domainId: 'trust', stageId: 'remediation', releaseId: 'beta.6', release: '3.8.3 Beta 6',
    benefit: 'Operators can trace review activity when investigating public evidence state.', kpi: 'Inventory KPI · protected review history available', kri: 'Residual KRI · log completeness depends on instrumented workflows', evidence: 'Admin review-log route, audit records and review-state wiring.', limitation: 'An application log is not an independent audit certification.', primaryUser: 'Authorized evidence operator', route: { href: '/admin/review-log', label: 'Review log', access: 'protected' }, dependencies: [{ featureId: 'admin-operations', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'admin-authentication', title: 'Database-independent admin authentication', shortLabel: 'Admin auth',
    summary: 'Protects operational routes with server-side session checks that remain available during database recovery.', kind: 'technical', domainId: 'security', stageId: 'remediation', releaseId: 'beta.6', release: '3.8.3 Beta 6',
    benefit: 'Authorized recovery work can continue when metrics or schema state is unavailable.', kpi: 'Inventory KPI · protected session boundary available', kri: 'Residual KRI · credential and session operations require production discipline', evidence: 'Admin auth helpers, protected layout, login route and authentication regression tests.', limitation: 'Authentication limits access but does not prove authorization design is complete.', primaryUser: 'Authorized platform operator', route: { href: '/admin/login', label: 'Admin login', access: 'protected' }, dependencies: [{ featureId: 'security-privacy-boundaries', relationship: 'governed-by' }],
  }),
  surfaceFeature({
    id: 'admin-access-audit', title: 'Admin access audit trail', shortLabel: 'Access audit',
    summary: 'Records bounded administrative access events for protected operational review.', kind: 'technical', domainId: 'security', stageId: 'remediation', releaseId: 'beta.6', release: '3.8.3 Beta 6',
    benefit: 'Operators can inspect recorded access activity around sensitive workspaces.', kpi: 'Inventory KPI · protected access logging available', kri: 'Residual KRI · application logs require retention and integrity controls', evidence: 'Admin access-log helper, protected route and access-log regression tests.', limitation: 'Recorded application events are not a tamper-proof external audit ledger.', primaryUser: 'Security and platform operator', route: { href: '/admin/access-logs', label: 'Access logs', access: 'protected' }, dependencies: [{ featureId: 'admin-authentication', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'public-rate-controls', title: 'Public request rate controls', shortLabel: 'Rate controls',
    summary: 'Applies bounded request-rate policies to selected exposed intake and assistant routes.', kind: 'technical', domainId: 'security', stageId: 'intake', releaseId: 'beta.5', release: '3.8.3 Beta 5',
    benefit: 'Public endpoints have a predictable first-line abuse boundary.', kpi: 'Inventory KPI · scoped rate controls available', kri: 'Residual KRI · distributed abuse and deployment topology remain open', evidence: 'Rate-limit helper, route integration and rate-control regression tests.', limitation: 'In-process controls are not a complete distributed denial-of-service defense.', primaryUser: 'Security and platform operator', dependencies: [{ featureId: 'request-hardening', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'bounded-request-errors', title: 'Bounded request and safe-error handling', shortLabel: 'Safe errors',
    summary: 'Limits request bodies and keeps internal failure details out of public responses.', kind: 'technical', domainId: 'security', stageId: 'intake', releaseId: 'beta.5', release: '3.8.3 Beta 5',
    benefit: 'Exposed workflows fail with narrower resource and disclosure boundaries.', kpi: 'Inventory KPI · bounded request parsing and safe errors available', kri: 'Residual KRI · route-specific abuse paths require continued review', evidence: 'Bounded request-body helpers, safe errors and focused route tests.', limitation: 'Generic error handling does not replace route-specific threat analysis.', primaryUser: 'Platform and security reviewer', dependencies: [{ featureId: 'security-privacy-boundaries', relationship: 'governed-by' }],
  }),
  surfaceFeature({
    id: 'privacy-minimized-logging', title: 'Privacy-minimized application logging', shortLabel: 'Minimized logging',
    summary: 'Masks or excludes sensitive values in selected operational and public-request logs.', kind: 'technical', domainId: 'security', stageId: 'assurance', releaseId: 'beta.5', release: '3.8.3 Beta 5',
    benefit: 'Operational troubleshooting can retain signals while reducing accidental sensitive disclosure.', kpi: 'Inventory KPI · log minimization helpers available', kri: 'Residual KRI · full production log flows require validation', evidence: 'Log privacy helpers, keyed hashing, safe errors and security regression coverage.', limitation: 'Application-level masking does not prove every infrastructure log is minimized.', primaryUser: 'Privacy and security operator', route: { href: '/privacy', label: 'Privacy policy', access: 'public' }, dependencies: [{ featureId: 'security-privacy-boundaries', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'database-schema-parity', title: 'Deployment schema parity checks', shortLabel: 'Schema parity',
    summary: 'Detects materialized schema drift between deployed SQLite state and application expectations.', kind: 'technical', domainId: 'operations', stageId: 'remediation', releaseId: 'beta.6', release: '3.8.3 Beta 6',
    benefit: 'Operators receive a specific recovery signal instead of an opaque application failure.', kpi: 'Inventory KPI · deployment schema check available', kri: 'Residual KRI · post-deploy execution still requires operator verification', evidence: 'Database configuration, schema-parity tests, deployment diagnostic and initializer scripts.', limitation: 'Detection does not migrate production data automatically.', primaryUser: 'Deployment operator', route: { href: '/admin/database', label: 'Database operations', access: 'protected' }, dependencies: [{ featureId: 'hostinger-recovery', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'backup-operational-recovery', title: 'Backup and operational recovery evidence', shortLabel: 'Backup recovery',
    summary: 'Documents primary and backup operating locations with recovery-oriented database tooling.', kind: 'technical', domainId: 'operations', stageId: 'remediation', releaseId: 'beta.6', release: '3.8.3 Beta 6',
    benefit: 'Operators have an explicit recovery path and stakeholders can see the stated backup region.', kpi: 'Inventory KPI · recovery tooling and region disclosure available', kri: 'Residual KRI · restore success and backup currency remain pending validation', evidence: 'Hostinger initialization and diagnostic scripts, database recovery workflow and EU backup disclosure.', limitation: 'A disclosed backup location does not prove a tested restore or recovery-time objective.', primaryUser: 'Deployment and resilience reviewer', route: { href: '/admin/database', label: 'Database operations', access: 'protected' }, dependencies: [{ featureId: 'hostinger-recovery', relationship: 'depends-on' }, { featureId: 'eu-hosting-disclosure', relationship: 'governed-by' }],
  }),
  surfaceFeature({
    id: 'responsive-evidence-navigation', title: 'Responsive evidence navigation', shortLabel: 'Responsive navigation',
    summary: 'Keeps core evidence and workspace actions accessible across desktop and mobile layouts.', kind: 'business', domainId: 'experience', stageId: 'publication', releaseId: '3.7.2', release: '3.7.2',
    benefit: 'Users can reach primary public evidence actions on smaller screens.', kpi: 'Inventory KPI · mobile and desktop command paths available', kri: 'Residual KRI · device and assistive-technology coverage requires continued validation', evidence: 'Deterministic navigation ribbon, mobile command bar, public header and mobile-context tests.', limitation: 'Responsive layout support is not measured user-task completion.', primaryUser: 'Mobile and desktop visitor', route: { href: '/', label: 'Evidence Console', access: 'public' }, dependencies: [{ featureId: 'interactive-public-navigation', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'bilingual-evidence-language', title: 'Bilingual public evidence language', shortLabel: 'English / Italian',
    summary: 'Provides English and Italian framing across core evidence, release and correction surfaces.', kind: 'business', domainId: 'experience', stageId: 'publication', releaseId: 'beta.6', release: '3.8.3 Beta 6',
    benefit: 'English and Italian readers can inspect the same qualified product boundaries.', kpi: 'Inventory KPI · bilingual evidence framing available', kri: 'Residual KRI · translation consistency requires release review', evidence: 'Localized dashboard copy, changelog, correction workflow, methodology and public evidence components.', limitation: 'Translation support does not establish comprehension or legal equivalence across jurisdictions.', primaryUser: 'English or Italian public visitor', route: { href: '/', label: 'Evidence Console', access: 'public' }, dependencies: [{ featureId: 'qualified-language', relationship: 'governed-by' }],
  }),
  surfaceFeature({
    id: 'terms-consent-boundary', title: 'Public terms and consent boundary', shortLabel: 'Terms boundary',
    summary: 'Requires explicit acknowledgement of product limits before using the public workspace.', kind: 'business', domainId: 'legal', stageId: 'intake', releaseId: '3.7.0', release: '3.7.0',
    benefit: 'Visitors encounter the evidence and legal-use boundary before relying on outputs.', kpi: 'Inventory KPI · explicit terms acknowledgement available', kri: 'Residual KRI · acknowledgement does not prove understanding', evidence: 'Shared terms content, TermsGate acknowledgement and the public bilingual Terms of Use route.', limitation: 'A UI gate is not a substitute for legal advice, contract review or measured comprehension.', primaryUser: 'Public visitor', route: { href: '/terms', label: 'Terms of Use', access: 'public' }, dependencies: [{ featureId: 'qualified-language', relationship: 'governed-by' }],
  }),
  surfaceFeature({
    id: 'live-evidence-assistant', title: 'Qualified live evidence assistant', shortLabel: 'Live assistant',
    summary: 'Answers bounded questions using selected public context and explicit source-verification language.', kind: 'business', domainId: 'analysis', stageId: 'assurance', releaseId: '3.7.0', release: '3.7.0',
    benefit: 'A user can ask a focused question while retaining a route back to provider evidence.', kpi: 'Inventory KPI · bounded conversational evidence aid available', kri: 'Residual KRI · generated answers can be inaccurate or incomplete', evidence: 'LiveAssistant component, chat route, bounded context and request-hardening controls.', limitation: 'Assistant output is AI-generated guidance, not legal advice or a compliance determination.', primaryUser: 'Public evidence reader', route: { href: '/', label: 'Evidence Console', access: 'public' }, dependencies: [{ featureId: 'ai-attention-signals', relationship: 'governed-by' }, { featureId: 'request-hardening', relationship: 'depends-on' }],
  }),
  surfaceFeature({
    id: 'speech-accessibility-output', title: 'Bounded speech output', shortLabel: 'Speech output',
    summary: 'Converts selected explanatory text to speech through a bounded public request path.', kind: 'business', domainId: 'experience', stageId: 'publication', releaseId: '3.7.0', release: '3.7.0',
    benefit: 'Some public explanatory content can be consumed through an audio channel.', kpi: 'Inventory KPI · bounded text-to-speech path available', kri: 'Residual KRI · language quality and assistive suitability require validation', evidence: 'Text-to-speech route, request limits and dashboard control integration.', limitation: 'Speech output does not replace semantic structure or assistive-technology testing.', primaryUser: 'Public visitor', route: { href: '/', label: 'Evidence Console', access: 'public' }, dependencies: [{ featureId: 'bounded-request-errors', relationship: 'depends-on' }],
  }),
];

export const FEATURE_ATLAS_FEATURES: FeatureAtlasFeature[] = [
  ...RELEASE_IMPACT_ITEMS.map(toAtlasFeature),
  ...platformFeatures,
  ...platformSurfaceFeatures,
];

export function getFeatureAtlasDomain(domainId: string) {
  return FEATURE_ATLAS_DOMAINS.find((domain) => domain.id === domainId);
}

export function getFeatureAtlasStage(stageId: FeatureAtlasStageId) {
  return FEATURE_ATLAS_STAGES.find((stage) => stage.id === stageId);
}

export function getFeatureAtlasReleaseFeatures(releaseId: string) {
  return FEATURE_ATLAS_FEATURES.filter((feature) => feature.releaseId === releaseId);
}

export function getConnectedFeatureIds(featureId: string) {
  return new Set(getFeatureAtlasConnections(featureId).map((connection) => connection.featureId));
}

export function getFeatureAtlasConnections(featureId: string): FeatureAtlasConnection[] {
  const connections: FeatureAtlasConnection[] = [];
  for (const feature of FEATURE_ATLAS_FEATURES) {
    for (const dependency of feature.dependencies) {
      if (feature.id === featureId) {
        connections.push({
          featureId: dependency.featureId,
          relationship: dependency.relationship,
          direction: 'outgoing',
        });
      }
      if (dependency.featureId === featureId) {
        connections.push({
          featureId: feature.id,
          relationship: dependency.relationship,
          direction: 'incoming',
        });
      }
    }
  }
  return connections;
}

export function getFeatureAtlasRelationshipLabel(relationship: FeatureAtlasRelationship) {
  return relationship.replaceAll('-', ' ');
}

export function hasOpenResidualKri(feature: FeatureAtlasFeature) {
  return /pending|open|requires|external|not guaranteed|human dependency|human gate/i.test(feature.kri);
}

export function getFeatureAtlasInventorySummary(features: FeatureAtlasFeature[]) {
  return {
    visible: features.length,
    domains: new Set(features.map((feature) => feature.domainId)).size,
    delivered: features.filter((feature) => feature.state === 'delivered').length,
    current: features.filter((feature) => feature.state === 'current').length,
    planned: features.filter((feature) => feature.state === 'planned').length,
    external: features.filter((feature) => Boolean(feature.externalDependency)).length,
    openKri: features.filter(hasOpenResidualKri).length,
  };
}

export function containsUnmeasuredQuantitativeClaim(feature: FeatureAtlasFeature) {
  const claim = `${feature.benefit} ${feature.kpi}`;
  return /\b\d+(?:\.\d+)?%\b|\b(?:increase|decrease|improve|reduce|save|growth|adoption)\w*\s+(?:by\s+)?\d+/i.test(claim);
}
