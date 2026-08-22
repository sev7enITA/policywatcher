'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpenCheck,
  ChevronRight,
  Cpu,
  Database,
  Eye,
  FileCheck2,
  Fingerprint,
  GitFork,
  ListChecks,
  Lock,
  Radio,
  Scale,
  Search,
  ServerCog,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  UsersRound,
} from 'lucide-react';
import { ReleaseImpactMap } from '@/components/ReleaseImpactMap';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import { POLICYWATCHER_RELEASE_NAME, POLICYWATCHER_VERSION } from '@/lib/release';
import RoadmapSignalComposer, {
  type RoadmapSignalComposerRequest,
} from './RoadmapSignalComposer';
import styles from './roadmap.module.css';

type GoalId = 'citizen' | 'governance' | 'research' | 'builder';
type DetailLevel = 'snapshot' | 'operational' | 'forensic';

const repoUrl = 'https://github.com/sev7enITA/policywatcher';

const goals: Array<{
  id: GoalId;
  label: string;
  title: string;
  summary: string;
  view: string;
  output: string;
  accent: string;
}> = [
  {
    id: 'citizen',
    label: 'Citizen',
    title: 'Change summary',
    summary:
      'A low-noise reading mode focused on policy changes, plain-language summaries, affected rights, and what should be verified at the source.',
    view: 'Change cards, source status, short explanations, region impact.',
    output: 'Readable briefing and shareable change page.',
    accent: '#5eead4',
  },
  {
    id: 'governance',
    label: 'GRC / Legal',
    title: 'Inspect evidence before using a signal',
    summary:
      'An audit-oriented workspace for source provenance, retrieval chain, publicEvidence state, review notes, and advisory framework mapping.',
    view: 'Dataset QA, check logs, policy history, framework evidence mapping.',
    output: 'Board/legal summary with explicit limitations.',
    accent: '#a78bfa',
  },
  {
    id: 'research',
    label: 'Research',
    title: 'Compare market movement over time',
    summary:
      'A comparative view for sectors, companies, jurisdictions, source coverage, timeline density, and risk movement without presenting legal determinations.',
    view: 'Timeline, trend charts, heatmap, benchmark radar, evidence signals board.',
    output: 'Research notes, CSV exports, and reproducible context.',
    accent: '#60a5fa',
  },
  {
    id: 'builder',
    label: 'Builder',
    title: 'Connect PolicyWatcher to other systems',
    summary:
      'A technical view for public API consumers and controlled enterprise pilots across Microsoft, Google Cloud and AWS.',
    view: 'Integration options, public agent and API v1 contracts, tenant-bound API v2, provider packages, rate and source boundaries.',
    output: 'Read-only machine-readable evidence, three agent source packages and bounded Microsoft workflow paths.',
    accent: '#f59e0b',
  },
];

const depthLabels: Record<DetailLevel, { label: string; note: string; includes: string[] }> = {
  snapshot: {
    label: 'Snapshot',
    note: 'For quick orientation. The UI hides diagnostics unless they change the interpretation of the data.',
    includes: ['Plain-language summary', 'Risk level', 'Region impact', 'Source availability'],
  },
  operational: {
    label: 'Operational',
    note: 'For repeat use. The UI adds the controls and metadata needed to compare, filter, export, and review.',
    includes: ['Filters', 'Timeline', 'Dataset QA state', 'Review notes', 'Export paths'],
  },
  forensic: {
    label: 'Forensic',
    note: 'For audit or publication. The UI exposes retrieval path, hashes, timestamps, source drift, and known limitations.',
    includes: ['Check logs', 'Hash chain', 'Public evidence gate', 'Fallback path', 'Review history'],
  },
};

type BaselineState = 'verified' | 'partial' | 'gap';

const baselineStateLabels: Record<BaselineState, string> = {
  verified: 'Verified',
  partial: 'Partial',
  gap: 'Gap',
};

const technicalBaseline: Array<{
  module: string;
  evidence: string;
  opportunity: string;
  state: BaselineState;
  reference: string;
}> = [
  {
    module: 'Acquisition',
    evidence: 'Five-step cascade: direct, HTTP/2, Renderer, Wayback and Common Crawl.',
    opportunity: 'The mass scan loop is still sequential; move long-running work behind a durable queue.',
    state: 'partial',
    reference: 'scraper.ts · cron/check-all/route.ts',
  },
  {
    module: 'AI and scoring',
    evidence: 'Structured output is schema-validated; Beta 42 includes a golden set and AI telemetry.',
    opportunity: 'The model produces the score. Input is capped at 45,000 characters or 22,000 + 22,000, not scored by a deterministic formula.',
    state: 'verified',
    reference: 'gemini.ts · geminiPolicySchema.ts · golden-set.v1.json',
  },
  {
    module: 'Data and retention',
    evidence: 'SQLite backs 31 Prisma models, including five additive canonical evidence models; AI telemetry and access logs have a 90-day retention policy.',
    opportunity: 'Canonical backfill is not active and PolicyCheckLog has no explicit retention policy.',
    state: 'partial',
    reference: 'prisma/schema.prisma · aiTelemetry.ts',
  },
  {
    module: 'Taxonomy and semantic evidence',
    evidence:
      'The local Full-V4 workspace implements versioned primary-sector, capability and evidence-backed regulatory-role classification, a 17-dimension readiness contract and a tested public taxonomy contract. Classification and provision workflows use draft → reviewed → published with separate reviewer/publisher provenance and immutable published records; the semantic gate requires exact captured-Version excerpts, SHA-256, canonical locators and rationale for positive, conditional or unclear assessments, while reviewed absence remains human-only.',
    opportunity:
      'Production activation is pending. Reconciliation 1.2.0 reports zero errors and warnings, but 317 of 330 provision slots are not_assessed, 13 are KPI-derived draft signals, zero are semantically decision-ready or published, and source/data gates remain open for Apple, Revolut and TikTok.',
    state: 'partial',
    reference: 'full-v4-taxonomy-contract.md · fullV4Readiness.ts · provisionEvidence.ts',
  },
  {
    module: 'Admin and identity',
    evidence: 'Signed sessions and roles are present.',
    opportunity: 'Credentials are shared by role, with no individual identity or central revocation; rate state remains in memory.',
    state: 'gap',
    reference: 'adminAuth.ts · rateLimit.ts',
  },
  {
    module: 'Dashboard',
    evidence: 'DashboardClient is about 3,181 lines and 125 KB; the public “map” is an impact matrix.',
    opportunity: 'Decompose and measure the bundle; add true geography and regional filtering only where supported by data.',
    state: 'gap',
    reference: 'DashboardClient.tsx · ReleaseImpactMap.tsx',
  },
  {
    module: 'API and webhooks',
    evidence: 'v1 and v2 are not symmetrical; a persistent outbox and signed delivery headers already exist.',
    opportunity: 'The worker still depends on application invocation. Actual headers use the PolicyWatcher-* prefix.',
    state: 'partial',
    reference: 'webhookDelivery.ts · webhookDeliveryData.ts',
  },
  {
    module: 'Browser extension',
    evidence: 'activeTab enables local selection/page analysis and up to three evidence summaries.',
    opportunity: 'The companion does not display KPI values or a policy score.',
    state: 'verified',
    reference: 'browser-extension/popup.js',
  },
  {
    module: 'VPS services',
    evidence: 'The Agent uses HMAC, timestamp and nonce; the Renderer uses Bearer auth with two-secret rotation.',
    opportunity: 'Keep release and readiness evidence bounded and observable across both services.',
    state: 'verified',
    reference: 'api/admin/vps-services · vps-agent/agent.mjs',
  },
  {
    module: 'Evidence packet',
    evidence: 'JSON and PDF exports include SHA-256 integrity material.',
    opportunity: 'Packets lack a digital signature, complete diff and archive timestamp.',
    state: 'partial',
    reference: 'evidencePacket.ts',
  },
  {
    module: 'Email and feeds',
    evidence: 'User templates are English-only; newsroom RSS and JSON Feed already exist.',
    opportunity: 'Unsubscribe is client-confirmed rather than one-click, and bounce suppression is not implemented.',
    state: 'partial',
    reference: 'press-kit/feed.xml/route.ts · email templates',
  },
];

const priorityPipeline = [
  {
    title: 'Full-V4 taxonomy production activation',
    outcome:
      'Move the locally implemented taxonomy, semantic-evidence gate and public taxonomy contract through controlled production activation without presenting draft signals as reviewed evidence.',
    gate:
      'Production migrations and remediation, zero-error reconciliation, endpoint smoke, strict Apple/Revolut/TikTok source QA, and accountable human review all pass before publication.',
    horizon: 'Now',
  },
  {
    title: 'Durable queue for asynchronous workloads',
    outcome: 'Scraping, webhooks and email run as persistent jobs with retry, backoff, idempotency and a dead-letter queue.',
    gate: 'Completion and retry metrics are visible; recovery is tested.',
    horizon: 'Now',
  },
  {
    title: 'Source-bound RAG and governed scoring',
    outcome: 'Chunking and source-anchored citations cover every KPI; scoring is deterministic only when presented as such, otherwise explicitly AI-generated.',
    gate: 'Golden-set quality and claim-to-evidence traceability pass review.',
    horizon: 'Now',
  },
  {
    title: 'Individual enterprise identity',
    outcome: 'OIDC, MFA, session revocation and per-user audit records replace role-shared attribution.',
    gate: 'No admin action is attributable only to a shared role.',
    horizon: 'Next',
  },
  {
    title: 'Modular, measured dashboard',
    outcome: 'DashboardClient is decomposed, secondary surfaces are lazy-loaded and bundle changes are measured; geography follows actual data coverage.',
    gate: 'A bundle budget and responsive tests pass before release.',
    horizon: 'Next',
  },
  {
    title: 'Hardened webhook egress and scheduling',
    outcome: 'DNS pinning and rebinding protection align webhook SSRF policy with acquisition; scheduling no longer depends on app cron.',
    gate: 'Redirect/DNS tests and an independent scheduler healthcheck pass.',
    horizon: 'Next',
  },
  {
    title: 'Email deliverability and consent',
    outcome: 'Provider events drive bounce/complaint suppression and true RFC 8058 one-click unsubscribe while preserving granular preferences.',
    gate: 'Provider events and the suppression list are auditable.',
    horizon: 'Next',
  },
  {
    title: 'PostgreSQL and object storage when needed',
    outcome: 'Persistence moves only when deployment is genuinely multi-instance, with an attachment strategy and tested backup/restore.',
    gate: 'The operational requirement and a restore drill are documented first.',
    horizon: 'Conditional',
  },
  {
    title: 'High-assurance evidence export',
    outcome: 'Packets include complete diff and archive timestamp; PDF signing and multiple renderers follow stable queue and storage foundations.',
    gate: 'Signature verification and reproducible rendering pass.',
    horizon: 'Conditional',
  },
] as const;

const applicabilityContextInputs = [
  'Exact legal subject',
  'Group and brand',
  'Service or product',
  'Market operation',
  'Territorial or regulatory nexus',
  'Audience or customer class',
  'Thresholds and exemptions',
  'Effective time',
] as const;

const applicabilityMaturity = [
  {
    step: '01',
    title: 'Evidence foundation',
    status: 'Released foundation',
    body: 'Retain the v4 Entity → Document → Version → Change → Provision lineage and exact source provenance.',
  },
  {
    step: '02',
    title: 'Entity and service relationships',
    status: 'Research candidate',
    body: 'Resolve the monitored portfolio entity to legal subjects, brands, services, markets and time-bounded operating relationships.',
  },
  {
    step: '03',
    title: 'Applicability predicates',
    status: 'Research candidate',
    body: 'Represent nexus, audience, thresholds, exemptions and effective-time conditions as typed, inspectable predicates.',
  },
  {
    step: '04',
    title: 'Reviewed assertions',
    status: 'Human-controlled gate',
    body: 'Permit an accountable reviewer—not an autonomous model—to advance a sourced assertion through a controlled review state.',
  },
] as const;

const nowItems = [
  {
    phase: 'Current · 4.0.0-beta.2',
    title: 'Production Readiness Hardening',
    body:
      'Close the highest-impact independent-assessment findings around request identity, response bounds, scan leases, session revocation, consent and verified recovery exports.',
    benefit: 'The Foundation Beta keeps its evidence model while production behavior becomes safer, more observable and less ambiguous.',
    validation: 'Staging proxy identity, migrations, WAL, SMTP confirmation, backup verification and post-deploy smoke remain mandatory external gates.',
    icon: SlidersHorizontal,
    href: '/',
  },
  {
    phase: 'Delivered · 3.9.0-beta.40',
    title: 'PolicyWatcher Civico',
    body:
      'Turn eligible public policy changes into a bounded association pilot watchlist with theme triage, local review states, a Markdown digest and Evidence Collection handoff.',
    benefit: 'Italian consumer associations can organize a source-first review scope without creating an account or sending member, consumer or draft data to PolicyWatcher.',
    validation: 'The workspace reuses public-evidence gates, keeps working state in the browser and names unavailable or empty conditions; it does not manage complaints, make legal findings or publish decisions.',
    icon: UsersRound,
    href: '/en/associations',
  },
  {
    phase: 'Delivered · 3.9.0-beta.39',
    title: 'Managed VPS Renderer releases',
    body:
      'Upload a bounded Renderer package from the protected Admin Center, verify it across the browser, Hostinger and VPS Agent, then follow asynchronous install, smoke and rollback state.',
    benefit: 'Routine Renderer deltas no longer require manual package staging, extraction or service commands on the VPS.',
    validation: 'The Agent accepts only signed bounded uploads, rejects unsafe archives and version mismatches, and reports one observable operation through completion or rollback.',
    icon: ServerCog,
    href: '/admin/vps-services',
  },
  {
    phase: 'Delivered · 3.9.0-beta.38',
    title: 'Git-hosted Press Kit distribution',
    body:
      'Keep complete checksum-listed editorial packages in the public repository while serving download links from GitHub and excluding nested package archives from Hostinger deployments.',
    benefit: 'Editors retain the complete EN and IT downloads while the application release is smaller, faster to transfer and easier to inspect.',
    validation: 'The package manifest names GitHub as the provider, the UI labels the external handoff and the release builder rejects nested Press Kit ZIPs.',
    icon: GitFork,
    href: '/press-kit#press-packages',
  },
  {
    phase: 'Delivered · 3.9.0-beta.37',
    title: 'Resource navigation and retrieval diagnostics',
    body:
      'Group the full public resource directory by intent and make shared acquisitions explicit through safe fingerprints, cache modes and renderer/browser coherence.',
    benefit: 'Readers scan a shorter navigation structure while operators can distinguish legitimate regional fetches from reused acquisition results.',
    validation: 'All footer destinations remain available; focused tests preserve semantic URL differences, redact log labels and verify renderer UA behavior without stealth or WAF bypass.',
    icon: ListChecks,
    href: '/feature-atlas',
  },
  {
    phase: 'Delivered · 3.9.0-beta.36',
    title: 'Administrative mutation hardening',
    body:
      'Centralize same-origin provenance, route-specific declared-body limits, JSON enforcement, bounded rate state and safe response metadata for unsafe administrative API methods.',
    benefit: 'Administrative mutation routes receive one consistent defense-in-depth boundary without changing public APIs or page CSP and framing behavior.',
    validation: 'Focused tests cover accepted same-origin requests, denial paths, body caps, rate state, headers and page CSP; the control is not a pentest or distributed rate limit.',
    icon: Lock,
    href: '/security',
  },
  {
    phase: 'Delivered · 3.9.0-beta.35',
    title: 'Community Signal Composer UX',
    body:
      'Turn candidate interest or a new proposal into a browser-local Need, Evidence, Limits and Review dossier before an explicit GitHub handoff.',
    benefit: 'Researchers, citizens, GRC reviewers and builders can prepare a bounded proposal without sending draft contents to PolicyWatcher.',
    validation: 'Strict local draft parsing and deterministic issue generation are covered; GitHub permissions, review, acceptance and adoption remain external.',
    icon: Users,
    href: '/roadmap#candidates',
  },
  {
    phase: 'Delivered · 3.9.0-beta.34',
    title: 'Source Remediation Workbench UX',
    body:
      'Connect returned-window priority, safe filtering, bounded issue evidence, responsive layouts and the Detect to Close sequence in one protected workbench.',
    benefit: 'Admins and Auditors can identify the next responsible remediation action while mutation controls remain admin-only.',
    validation: 'Only Recovered issues can be closed and Resolved issues reopened; closure is not proof of continuous source availability or measured usability improvement.',
    icon: Settings2,
    href: '/admin/source-reliability',
  },
  {
    phase: 'Delivered · 3.9.0-beta.33',
    title: 'Renderer production hardening',
    body:
      'Require explicit target-domain egress, HTTPS, bounded output and total runtime while separating public liveness from authenticated Chromium readiness and supporting a bounded two-secret rotation overlap.',
    benefit: 'Operators can constrain rendered destinations and rotate credentials without exposing readiness detail publicly or accepting arbitrary public targets.',
    validation: 'Focused tests cover allowlist parsing, subdomain boundaries, secret overlap, HTTPS enforcement and query-free operational logging; Chromium socket ownership remains an explicit limit.',
    icon: Cpu,
    href: '/admin/vps-services',
  },
  {
    phase: 'Delivered · 3.9.0-beta.30',
    title: 'Word Contract Evidence Review',
    body:
      'Classify an explicitly selected Word clause locally against a fixed taxonomy, display the derived topics and search related public evidence only after a separate acknowledgement.',
    benefit: 'Reviewers can reach cited public evidence from a Word clause without transmitting the selected clause to PolicyWatcher.',
    validation: 'Network queries contain controlled topic labels only; the source package does not verify, approve or legally assess a contract.',
    icon: FileCheck2,
    href: '/office-addin/contract-review',
  },
  {
    phase: 'Delivered · 3.9.0-beta.29',
    title: 'Microsoft, Google and AWS agent packages',
    body:
      'Validate a Microsoft 365 Copilot declarative agent, Vertex AI Agent Builder tool or Amazon Quick OpenAPI connector against the same public evidence contract.',
    benefit: 'Enterprise users can query PolicyWatcher from an approved agent environment while public evidence remains at the source.',
    validation: 'The repository provides source packages and runbooks; it does not deploy, approve, publish or certify them in customer environments.',
    icon: GitFork,
    href: '/integrations',
  },
  {
    phase: 'Delivered · 3.9.0-beta.28',
    title: 'Cross-cloud Agent Evidence Gateway',
    body:
      'Retrieve deterministic capabilities, public change briefs and curated Observatory briefs through one flattened OpenAPI 3.0 contract.',
    benefit: 'Agent tools receive timestamps, applied filters, answer context, citations and explicit evidence limits in a consistent form.',
    validation: 'Only public evidence and curated references are returned; zero results do not establish absence and private workflows remain on API v2.',
    icon: Radio,
    href: '/api/v1/agent/openapi.json',
  },
  {
    phase: 'Delivered · 3.9.0-beta.22',
    title: 'Browser-local event feed continuity',
    body:
      'Inspect the bounded public change-event window, save or import a strict local checkpoint and explicitly resume forward polling from its opaque cursor.',
    benefit: 'Integration developers can rehearse checkpoint, deduplication and resume behavior without registering an endpoint or sending consumer state to PolicyWatcher.',
    validation: 'The report detects observable duplicate, overlap, ordering and truncation conditions; it does not claim exhaustive monitoring, delivery confirmation or zero gaps.',
    icon: Radio,
    href: '/developers/event-continuity',
  },
  {
    phase: 'Delivered · 3.9.0-beta.17',
    title: 'Local public-evidence watchlists and shareable collections',
    body:
      'Select up to 12 exact public change records, keep a bounded title and review state in localStorage, and share a canonical URL containing public change IDs only.',
    benefit: 'Researchers and reviewers can assemble a reproducible scope without creating an account or sending personal workspace state to PolicyWatcher.',
    validation: 'Shared links exclude the local title and review states; corrupt or oversized browser state is ignored and the selection remains bounded to public records.',
    icon: GitFork,
    href: '/collections',
  },
  {
    phase: 'Delivered · 3.9.0-beta.17',
    title: 'Multi-change evidence briefing',
    body:
      'Selected exact-change Evidence Packets are composed into one deterministic collection with per-record identity, source state, screening trace, packet digest and review questions.',
    benefit: 'A reviewer can carry a defined multi-record scope into editorial, research or governance work while retaining each original evidence boundary.',
    validation: 'The collection is selection-based rather than exhaustive and does not infer a market, legal or compliance conclusion.',
    icon: FileCheck2,
    href: '/collections',
  },
  {
    phase: 'Delivered · 3.9.0-beta.17',
    title: 'Portable generic evidence bundle',
    body:
      'One read-only endpoint returns deterministic JSON, Markdown or formula-safe CSV for 1–12 canonical public change IDs.',
    benefit: 'Developers can move bounded public evidence into their own review workflow without a vendor-specific connector.',
    validation: 'The endpoint accepts IDs and format only; direct Jira, Confluence, Teams or GRC delivery, signed webhooks and write operations remain unimplemented.',
    icon: Database,
    href: '/developers',
  },
  {
    phase: 'Delivered · 3.9.0-beta.16',
    title: 'Source evidence and continuity ledger',
    body:
      'Public evidence files show publication state, sanitized retrieval status, last-check time and versioned public snapshot fingerprints for one change.',
    benefit: 'Reviewers can inspect the recorded evidence chain without access to protected Dataset QA operations.',
    validation: 'The public view excludes admin notes, raw retrieval failures, credentials and withheld records; retrieval state is not a source-authenticity rating.',
    icon: Fingerprint,
    href: '/evidence',
  },
  {
    phase: 'Delivered · 3.9.0-beta.16',
    title: 'Advisory governance mapping',
    body:
      'Assessed KPI evidence is mapped to review questions for the EU AI Act, ISO/IEC 42001, NIST AI RMF and OECD AI Principles.',
    benefit: 'GRC and legal reviewers receive a structured starting point for specialist framework review.',
    validation: 'Mappings state mapped or not assessed, name their source and version, and never issue compliance, conformity or legal verdicts.',
    icon: Scale,
    href: '/evidence',
  },
  {
    phase: 'Delivered · 3.9.0-beta.16',
    title: 'Source-anchored score explainability',
    body:
      'Stored score reasons can show an exact source passage, snapshot side and related KPI only when the passage matches the recorded snapshot.',
    benefit: 'A reviewer can connect a screening reason to available source evidence instead of reading an unsupported explanation in isolation.',
    validation: 'Nonmatching candidate quotes are rejected and hidden; historical records without an anchor state that the source passage was not recorded.',
    icon: BookOpenCheck,
    href: '/evidence',
  },
  {
    phase: 'Delivered · 3.9.0-beta.16',
    title: 'Change-bound evidence reports',
    body:
      'Each publishable change can produce a two-page PDF and JSON packet with identity, evidence fingerprints, score trace, advisory mappings, review questions and digest.',
    benefit: 'Reviewers can download an exact-change dossier without receiving a report for a later change in the same policy.',
    validation: 'The packet is a bounded evidence record, not a certification, audit result, legal opinion or compliance assessment.',
    icon: FileCheck2,
    href: '/evidence',
  },
  {
    phase: 'Delivered · 3.9.0-beta.2',
    title: 'Shareable evidence views',
    body:
      'Copy view writes the public dashboard filters to a versioned canonical URL, while committed filter changes participate in browser history and stale values fail closed.',
    benefit: 'Reviewers can share and revisit the same public evidence scope without manually reconstructing each visible filter.',
    validation: 'Only public view state is encoded; identity, private evidence and consent state remain excluded, and a future link can still reflect changed source availability.',
    icon: GitFork,
  },
  {
    phase: 'Delivered · 3.9.0-beta.2',
    title: 'Coordinated visual evidence drill-down',
    body:
      'Heatmap selection commits region and audience together, while radar KPI selection opens original and normalized values with explicit missing and tie outcomes.',
    benefit: 'A visual signal now leads directly to its precise context, exact values and interpretation boundary.',
    validation: 'Keyboard and mobile paths retain exact-value tables; normalized ordinal values are screening aids, not compliance or performance measurements.',
    icon: Eye,
  },
  {
    phase: 'Delivered · 3.8.1',
    title: 'Mobile inquiry reliability',
    body:
      'The notification workflow now moves from paste to a local company/policy summary and one verification action, while optional corrections and explainability stay progressively disclosed.',
    benefit: 'A person on a phone can submit a useful request without reconstructing hidden links, dates or a multi-field form.',
    validation: 'Only successful writes show a registered reference; the admin queue has a visible count and optional minimized email alert, while raw notification content remains browser-local.',
    icon: Search,
  },
  {
    phase: 'Delivered · 3.8.0',
    title: 'Browser Evidence Companion',
    body:
      'A minimum-permission Chrome, Edge and Safari companion reads an opened notice only after an explicit gesture, extracts non-personal clues locally, and connects the confirmed signal to PolicyWatcher’s published portfolio evidence.',
    benefit: 'People can move from a real notification to a verifiable answer without copying raw personal communications into the platform.',
    validation: 'No persistent mailbox access, raw-content transmission, remote code or automated publication; unknown sources still enter the human approval and QA workflow.',
    icon: Search,
  },
  {
    phase: 'Delivered · 3.7.2',
    title: 'Workspace onboarding and navigation',
    body:
      'First-time visitors choose an objective and evidence depth, preview the evidence stack, and enter a workspace whose toolbar exposes only the most relevant actions while retaining every command in More.',
    benefit: 'The product becomes understandable before the full dashboard density appears, without removing expert capabilities.',
    validation: 'Source QA remains visible, preferences stay local, setup is reversible, and the mobile navigation remains focused and safe-area aware.',
    icon: SlidersHorizontal,
  },
  {
    phase: 'Delivered · 3.7.1',
    title: 'Notification-to-evidence inquiry',
    body:
      'A citizen can paste a plain-text terms/privacy notice, confirm the locally extracted organization and starting policy clues, receive portfolio-wide public evidence, or create a zero-content human-review inquiry that feeds controlled company discovery.',
    benefit: 'The path from a real notification email to trustworthy evidence becomes direct without treating marketing copy as proof.',
    validation: 'Only publicEvidence records answer immediately; unknown or unverified cases remain queued behind the human source-approval gate.',
    icon: Search,
  },
  {
    phase: 'Delivered · voted',
    title: 'Objective-based Dashboard Composer',
    body:
      'On a first visit, a guided start asks for the user objective and evidence depth, previews a typed stack of real dashboard evidence modules, and saves the selected workspace.',
    benefit: 'The selected session purpose determines an evidence stack assembled from existing product modules.',
    validation: 'Accepted: generated stacks use registered evidence modules only, remain reversible, and always keep Source QA visible.',
    icon: SlidersHorizontal,
  },
  {
    phase: 'Delivered · voted',
    title: 'Bulk Source Onboarding',
    body:
      'Operators can import company and policy candidates, review official-source fit, establish a first private baseline, run the QA gate, and record an explicit publication decision.',
    benefit: 'Large source batches move through one durable, auditable workflow instead of ad hoc record creation.',
    validation: 'Accepted: duplicate and URL checks run before approval; imports and first baselines remain private until QA passes and an operator publishes them.',
    icon: ListChecks,
  },
  {
    phase: 'Planned',
    title: 'Personal Evidence Workspace',
    body:
      'Save preferred detail level, visible panels, comparison lenses, and export defaults locally so repeated work feels intentional instead of crowded.',
    benefit: 'Power users get density; casual readers get clarity.',
    validation: 'Preferences must be local, reversible, and never hide source-quality warnings.',
    icon: Settings2,
  },
];

const candidateFeatures = [
  {
    track: 'Semantic intelligence',
    title: 'Reviewed Applicability Graph',
    body:
      'Research a provenance-rich ApplicabilityAssertion joining an observed Provision to the exact LegalEntity, Service, Jurisdiction, Audience and ValidityPeriod, with typed nexus, threshold and exemption conditions.',
    status: 'Research candidate · no release commitment',
    risk:
      'This would be an evidence-backed review aid, not legal advice, enforceability proof or compliance certification. AI may propose candidates or extract conditions but cannot autonomously publish a legal conclusion.',
  },
  {
    track: 'API',
    title: 'Read-only public integration directory',
    body:
      'Delivered in 3.9.0 Beta 11: a versioned manifest and localized Observatory registry make the public integration surface inspectable, rate-limited and source-bound.',
    status: 'Delivered beta 11',
    risk: 'The surface is deliberately read-only; it does not expose admin data, raw policy text or operational controls.',
  },
  {
    track: 'Enterprise pilot',
    title: 'Entra, Azure API Management and Power Platform',
    body:
      'Pilot ready: API v2 validates tenant-bound Entra tokens at the origin, publishes an OpenAPI contract, includes an APIM policy and provides a source-controlled custom connector package.',
    status: 'Pilot ready',
    risk: 'Certification, tenant entitlements, offboarding, delivery telemetry and commercial provisioning are not yet implemented.',
  },
  {
    track: 'Enterprise agents',
    title: 'Cross-cloud public evidence dialogue',
    body:
      'Delivered in Beta 28-29: one deterministic Agent Evidence Gateway plus source packages for Microsoft 365 Copilot, Vertex AI Agent Builder and Amazon Quick.',
    status: 'Available gateway · source packages ready',
    risk: 'Provider approval, tenant configuration, cloud logging, retention and product compatibility remain customer- and provider-controlled.',
  },
  {
    track: 'Office',
    title: 'Word Contract Evidence Review',
    body:
      'Delivered in Beta 30: locally classify selected clause text and send only displayed controlled topic labels to the public evidence gateway after explicit acknowledgement.',
    status: 'Source package ready',
    risk: 'Topic mapping can require professional review and must not be presented as contract verification, approval or legal advice.',
  },
  {
    track: 'Collaboration',
    title: 'Local public-evidence watchlists and shareable collections',
    body:
      'Delivered in 3.9.0 Beta 17: select up to 12 public change IDs, retain title and review states locally, and share an ID-only canonical URL.',
    status: 'Delivered beta 17',
    risk: 'This is not a persistent team workspace: accounts, ACLs, comments, presence and conflict resolution are not included.',
  },
  {
    track: 'API',
    title: 'Configured signed webhook delivery',
    body:
      'Delivered in 3.9.0 Beta 23: deployment-configured HTTPS destinations receive eligible public change events through HMAC-SHA256 signatures, a persistent outbox, per-attempt evidence and bounded retries.',
    status: 'Delivered beta 23 · configured pilot',
    risk: 'No public subscriptions, tenant self-service, endpoint challenge, automatic key rotation, guaranteed delivery or SLA.',
  },
  {
    track: 'Governance',
    title: 'Reviewed framework mapping catalogue',
    body:
      'Add versioned reviewer commentary, change history and additional framework topics to the delivered advisory map.',
    status: 'Later validation',
    risk: 'Reviewer input must remain attributable and must not turn topic relevance into a compliance verdict.',
  },
  {
    track: 'Dataset QA',
    title: 'Aggregate source continuity trends',
    body:
      'Publish bounded portfolio-level continuity trends across time without exposing raw failures, admin decisions or private remediation details.',
    status: 'Later aggregate',
    risk: 'Small cohorts and detailed failure patterns could reveal protected operational information.',
  },
  {
    track: 'Research',
    title: 'Market pulse atlas',
    body:
      'A visual atlas of policy movement by sector, jurisdiction, source status, and time period, designed for researchers and journalists.',
    status: 'Communication value',
    risk: 'Requires enough verified public evidence to avoid empty theatrics.',
  },
  {
    track: 'Reports',
    title: 'Multi-change evidence briefing',
    body:
      'Delivered in 3.9.0 Beta 17: compose selected exact-change evidence packets into a dated bundle with selection scope and per-record digests.',
    status: 'Delivered beta 17',
    risk: 'Aggregation must preserve each packet boundary and must not imply a complete market or compliance assessment.',
  },
  {
    track: 'Signals',
    title: 'Persistent alert watchlists',
    body:
      'Let authenticated users subscribe to future changes for selected companies, policies, jurisdictions, or governance topics and receive focused updates.',
    status: 'Community ask',
    risk: 'Persistent subscription preferences, identity and delivery controls need strong privacy defaults and are not part of local Evidence Collections.',
  },
  {
    track: 'Explainability',
    title: 'Cross-version explanation trace',
    body:
      'Compare source-anchored screening reasons across multiple public changes while retaining the original snapshot side and KPI linkage.',
    status: 'Later lineage',
    risk: 'Cross-version summaries must not infer causality where only stored screening outputs exist.',
  },
  {
    track: 'Integrations',
    title: 'Portable generic evidence bundle',
    body:
      'Delivered in 3.9.0 Beta 17: deterministic JSON, Markdown and formula-safe CSV exports for 1–12 canonical public change IDs.',
    status: 'Delivered beta 17',
    risk: 'The bundle is portable data only; it does not deliver directly into third-party products or expose private review state.',
  },
  {
    track: 'Integrations',
    title: 'Evidence export to GRC tools',
    body:
      'Available in the current build as a vendor-neutral handoff manifest with deterministic work-item IDs, evidence links, digests, review questions and acceptance criteria.',
    status: 'Available · generic handoff',
    risk: 'The manifest does not create vendor records, assignments, deadlines or delivery confirmation. Direct publishing still requires identity, audit and delivery controls.',
  },
  {
    track: 'Microsoft 365',
    title: 'Teams, Copilot, MCP and Graph surfaces',
    body:
      'Copilot public-evidence agent source is delivered. Continue with an authenticated Teams route, a federated MCP server and optional Graph indexing over tenant-bound controls.',
    status: 'Copilot source ready · Teams, MCP and Graph planned',
    risk: 'Private surfaces need tenant authorization, content and retention boundaries, operational ownership and multi-tenant isolation tests.',
  },
  {
    track: 'Distribution',
    title: 'Microsoft commercial marketplace offer',
    body:
      'Start with a discovery listing, then evaluate a transactable SaaS offer after tenant provisioning, entitlements, billing events, consent revocation and support operations exist.',
    status: 'Commercial later',
    risk: 'Marketplace packaging must not precede a tested customer lifecycle and tenant-isolation model.',
  },
  {
    track: 'UX',
    title: 'Forensic workbench redesign',
    body:
      'Move from crowded navigation to a command-driven, panel-based inspection surface with graph, table, timeline, and evidence modes.',
    status: 'Design priority',
    risk: 'Must improve orientation without losing expert controls.',
  },
  {
    track: 'Quality',
    title: 'Community benchmark pack',
    body:
      'A public set of known policy-source cases used to test retrieval, source-fit checks, source suspension, and dashboard behavior.',
    status: 'Validation',
    risk: 'Needs stable fixtures that do not become fake public evidence.',
  },
];

type CandidateImplementationState = 'delivered' | 'pilot' | 'candidate';

const candidateStateLabels: Record<CandidateImplementationState, string> = {
  delivered: 'Delivered',
  pilot: 'Pilot or partial',
  candidate: 'Candidate',
};

function getCandidateImplementationState(status: string): CandidateImplementationState {
  if (/delivered/i.test(status)) return 'delivered';
  if (/ready|available/i.test(status)) return 'pilot';
  return 'candidate';
}

const releaseLanes = [
  {
    label: '3.5.1',
    title: 'Audit Operations',
    body:
      'Dataset QA, source suspension, review log, access log, renderer/VPS monitoring, public evidence gate, and quality badges.',
    state: 'delivered',
  },
  {
    label: '3.6.3',
    title: 'Guided Evidence Workflows',
    body:
      'First-use objective composer built from registered evidence modules, plus durable five-stage bulk source onboarding with private baselines, QA review, and explicit publication decisions.',
    state: 'delivered',
  },
  {
    label: '3.6.4',
    title: 'Audit Reliability Fixes',
    body:
      'Persistent discovery jobs, atomic run claims, safe request parsing, audited candidate reopening, synchronized QA rollback, sensor-free mobile context, and UTC countdown correctness.',
    state: 'delivered',
  },
  {
    label: '3.6.5',
    title: 'Stability Release',
    body:
      'Centralized onboarding batch invariants, held-workflow defense in depth, deferred orientation evaluation with cleanup, root mobile overflow containment, and single-source release metadata.',
    state: 'delivered',
  },
  {
    label: '3.7.0',
    title: 'Evidence Experience Release',
    body:
      'Bilingual notification-to-evidence inquiry with browser-local clue extraction, one-request company discovery, in-context baselines, evidence-provenance KPI QA, audited human handoff, and self-checking Hostinger startup.',
    state: 'delivered',
  },
  {
    label: '3.7.1',
    title: 'Evidence Intake Reliability',
    body:
      'Plain-text-first notification intake, explicit clue confirmation, organization/domain conflict handling, portfolio-wide policy verification, and actionable database-unavailable states without transmitting raw message content.',
    state: 'delivered',
  },
  {
    label: '3.7.2',
    title: 'Workspace Navigation Release',
    body:
      'Progressive first-use onboarding, objective-aware quick actions, direct changelog identity, icon-only What Changed entry, focused mobile navigation, and browser-local personalization.',
    state: 'delivered',
  },
  {
    label: '3.8.0',
    title: 'Browser Evidence Companion',
    body:
      'Production Chrome/Edge Manifest V3 extension and Safari-compatible source with temporary tab access, local clue extraction, structured confirmation and portfolio-wide public evidence results.',
    state: 'delivered',
  },
  {
    label: '3.8.1',
    title: 'Mobile Inquiry Reliability',
    body:
      'One-action mobile notification intake, company extraction, persistence-specific receipts, visible admin queue count and privacy-minimized operator alerts.',
    state: 'delivered',
  },
  {
    label: POLICYWATCHER_VERSION,
    title: POLICYWATCHER_RELEASE_NAME,
    body:
      'Human-approved AI model registry, privacy-safe telemetry, validated release ledger and bilingual Evidence Pulse with explicit residual boundaries.',
    state: 'current',
  },
  {
    label: '4.0',
    title: 'Feature Drop',
    body:
      'Self-service webhook lifecycle, endpoint proof and secret rotation, persistent alert watchlists, multi-version diff and production integration hardening after the configured pilot.',
    state: 'candidate',
  },
  {
    label: '4.5',
    title: 'Evidence Methodology Release',
    body:
      'Community benchmark pack, cross-version evidence lineage, external methodology review and production database hardening.',
    state: 'candidate',
  },
];

function buildWorkspaceHref(goalId: GoalId, depth: DetailLevel) {
  const intent = goalId === 'governance' ? 'grc' : goalId;
  return `/?intent=${intent}&depth=${depth}`;
}

function HeroGraph() {
  return (
    <svg viewBox="0 0 760 520" className={styles.heroGraph} aria-hidden="true">
      <path className={styles.graphGrid} d="M72 78h616M72 170h616M72 262h616M72 354h616M72 446h616M124 46v430M254 46v430M384 46v430M514 46v430M644 46v430" />
      <path className={styles.graphRoute} d="M94 384c76-120 142-150 231-104 78 40 112 8 158-72 45-79 101-113 183-52" />
      <path className={styles.graphRouteSoft} d="M100 188c67 48 117 63 175 31 71-39 106-29 155 28 57 66 126 77 225 12" />
      <circle className={styles.graphNodeA} cx="142" cy="318" r="13" />
      <circle className={styles.graphNodeB} cx="324" cy="278" r="13" />
      <circle className={styles.graphNodeC} cx="481" cy="208" r="13" />
      <circle className={styles.graphNodeD} cx="642" cy="156" r="13" />
      <circle className={styles.graphPacket} cx="0" cy="0" r="7">
        <animateMotion dur="7s" repeatCount="indefinite" path="M94 384c76-120 142-150 231-104 78 40 112 8 158-72 45-79 101-113 183-52" />
      </circle>
    </svg>
  );
}

function DepthDiagram({ level, goal }: { level: DetailLevel; goal: (typeof goals)[number] }) {
  return (
    <div className={styles.depthDiagram} style={{ '--goal-accent': goal.accent } as CSSProperties}>
      <div className={styles.depthHeader}>
        <span>{goal.label} workspace</span>
        <strong>{depthLabels[level].label}</strong>
      </div>
      <div className={styles.depthFlow}>
        <div className={styles.depthNode}>
          <span>1</span>
          <b>Question</b>
          <small>{goal.title}</small>
        </div>
        <div className={styles.depthLine} />
        <div className={styles.depthNode}>
          <span>2</span>
          <b>Evidence</b>
          <small>{goal.view}</small>
        </div>
        <div className={styles.depthLine} />
        <div className={styles.depthNode}>
          <span>3</span>
          <b>Output</b>
          <small>{goal.output}</small>
        </div>
      </div>
      <div className={styles.depthIncludes}>
        {depthLabels[level].includes.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  );
}

export default function RoadmapClient() {
  const [goalId, setGoalId] = useState<GoalId>('citizen');
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('forensic');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateTrack, setCandidateTrack] = useState('all');
  const [candidateState, setCandidateState] = useState<'all' | CandidateImplementationState>('all');
  const [composerRequest, setComposerRequest] = useState<RoadmapSignalComposerRequest | null>(null);
  const [hasSavedSignalDraft, setHasSavedSignalDraft] = useState(false);
  const composerRequestId = useRef(0);
  const selectedGoal = useMemo(() => goals.find((goal) => goal.id === goalId) ?? goals[0], [goalId]);
  const candidateTracks = useMemo(
    () => Array.from(new Set(candidateFeatures.map((feature) => feature.track))).sort(),
    [],
  );
  const candidateTrackCount = useMemo(
    () => candidateTracks.length,
    [candidateTracks],
  );
  const filteredCandidateFeatures = useMemo(() => {
    const query = candidateSearch.trim().toLocaleLowerCase();
    return candidateFeatures.filter((feature) => {
      const state = getCandidateImplementationState(feature.status);
      const matchesTrack = candidateTrack === 'all' || feature.track === candidateTrack;
      const matchesState = candidateState === 'all' || state === candidateState;
      const matchesSearch = !query || [feature.title, feature.track, feature.body, feature.status, feature.risk]
        .some((value) => value.toLocaleLowerCase().includes(query));
      return matchesTrack && matchesState && matchesSearch;
    });
  }, [candidateSearch, candidateState, candidateTrack]);
  const filtersActive = Boolean(candidateSearch.trim()) || candidateTrack !== 'all' || candidateState !== 'all';

  const openNewSignal = useCallback(() => {
    composerRequestId.current += 1;
    setComposerRequest({ id: composerRequestId.current, mode: 'new' });
  }, []);

  const resumeSignal = useCallback(() => {
    composerRequestId.current += 1;
    setComposerRequest({ id: composerRequestId.current, mode: 'resume' });
  }, []);

  const openCandidateSignal = useCallback((title: string, track: string) => {
    composerRequestId.current += 1;
    setComposerRequest({ id: composerRequestId.current, mode: 'candidate', title, track });
  }, []);

  const closeSignalComposer = useCallback(() => setComposerRequest(null), []);
  const updateDraftAvailability = useCallback((available: boolean) => setHasSavedSignalDraft(available), []);

  function clearCandidateFilters() {
    setCandidateSearch('');
    setCandidateTrack('all');
    setCandidateState('all');
  }

  return (
    <>
      <PublicHeader current="roadmap" />
      <main className={styles.page}>
      <nav className={styles.nav} aria-label="Roadmap navigation">
        <Link href="/" className={styles.brand}>
          <Image src="/logo-mark.png" alt="" width={34} height={34} className={styles.brandMark} priority />
          <span>PolicyWatcher</span>
        </Link>
        <div className={styles.navLinks}>
          <a href="#technical-baseline">Baseline</a>
          <a href="#pipeline">Pipeline</a>
          <a href="#evolution">Evolution</a>
          <a href="#candidates">Candidates</a>
          <a href="#impact-map">Release impact</a>
          <Link href="/feature-atlas">Feature Atlas</Link>
          <a href="#workspace">Workspace</a>
          <a href="#method">Ranking</a>
          <a href={repoUrl} target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </nav>

      <header className={styles.hero}>
        <section className={styles.heroCopy}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
          <span className={styles.eyebrow}>PRODUCT PLANNING</span>
          <h1>Product roadmap</h1>
          <p>
            PolicyWatcher includes goal-driven evidence workspaces in addition to static dashboard views. Workspace configuration records the user objective, requested evidence depth and modules that remain unavailable until source requirements are met.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryAction} href="#candidates">
              Signal a roadmap priority
              <ArrowUpRight size={17} />
            </a>
            <button className={styles.secondaryAction} type="button" onClick={openNewSignal}>
              Propose a new idea
            </button>
            <Link className={styles.secondaryAction} href="/feature-atlas">
              Explore feature dependencies
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </section>

        <aside className={styles.heroBoard} aria-label="Roadmap signal preview">
          <div className={styles.boardChrome}>
            <span>roadmap.signal</span>
            <b>proposal interface</b>
          </div>
          <HeroGraph />
          <div className={styles.boardStats}>
            <div>
              <strong>4</strong>
              <span>user objectives</span>
            </div>
            <div>
              <strong>3</strong>
              <span>detail levels</span>
            </div>
            <div>
              <strong>{candidateTrackCount}</strong>
              <span>candidate tracks</span>
            </div>
          </div>
        </aside>
      </header>

      <section className={styles.principles} aria-label="Roadmap principles">
        <article>
          <ShieldCheck size={18} />
          <strong>Publication gate</strong>
          <span>Public views expose source-gated records. Seeded or uncertain records remain excluded.</span>
        </article>
        <article>
          <Eye size={18} />
          <strong>Interface configuration</strong>
          <span>The interface uses the selected user objective and evidence depth.</span>
        </article>
        <article>
          <GitFork size={18} />
          <strong>Community signals</strong>
          <span>Roadmap priority uses submissions tied to concrete workflows.</span>
        </article>
        <article>
          <Lock size={18} />
          <strong>Claim scope</strong>
          <span>Feature records include mapping, review, evidence and visible source-quality state.</span>
        </article>
      </section>

      <section className={`${styles.section} ${styles.baselineSection}`} id="technical-baseline">
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.sectionLabel}>Technical baseline · verified 22 August 2026</span>
            <h2>Technical baseline</h2>
          </div>
          <p>
            Eleven evidence-backed module checks separate the deployed 4.0.0-beta.2 release, locally validated deployment-pending work and architectural opportunity. References point to the implementation inspected for this snapshot.
          </p>
        </div>

        <div className={styles.baselineLegend} aria-label="Baseline status legend">
          {(Object.keys(baselineStateLabels) as BaselineState[]).map((state) => (
            <span key={state} data-state={state}>{baselineStateLabels[state]}</span>
          ))}
        </div>

        <div className={styles.baselineTable} role="table" aria-label="Verified technical baseline">
          <div className={styles.baselineHeader} role="row">
            <span role="columnheader">Module</span>
            <span role="columnheader">Current evidence</span>
            <span role="columnheader">Limit / opportunity</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Technical reference</span>
          </div>
          {technicalBaseline.map((item, index) => (
            <article className={styles.baselineRow} role="row" key={item.module}>
              <div className={styles.baselineModule} role="cell">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{item.module}</strong>
              </div>
              <p role="cell" data-label="Current evidence">{item.evidence}</p>
              <p role="cell" data-label="Limit / opportunity">{item.opportunity}</p>
              <div role="cell" data-label="Status">
                <span className={styles.baselineStatus} data-state={item.state}>{baselineStateLabels[item.state]}</span>
              </div>
              <code role="cell" data-label="Technical reference">{item.reference}</code>
            </article>
          ))}
        </div>

        <aside className={styles.baselineNote}>
          <BookOpenCheck size={18} aria-hidden="true" />
          <p>
            <code>docs/reports/policywatcher-state-of-art-audit-2026-08-14.artifact.json</code> remains a historical snapshot. This 22 August baseline also inspects newer local Full-V4 work; production deployment is still pending and the online <code>/api/v1/taxonomy</code> endpoint currently returns 404.
          </p>
        </aside>
      </section>

      <section className={`${styles.section} ${styles.pipelineSection}`} id="pipeline">
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.sectionLabel}>Priority pipeline · 01–09</span>
            <h2>Priority pipeline</h2>
          </div>
          <p>
            This ordered pipeline is the committed prioritization lens. The feature radar remains a separate, unprioritized candidate backlog.
          </p>
        </div>

        <ol className={styles.pipelineList}>
          {priorityPipeline.map((item, index) => (
            <li key={item.title}>
              <span className={styles.pipelineNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div className={styles.pipelineTitle}>
                <span>{item.horizon}</span>
                <h3>{item.title}</h3>
              </div>
              <div className={styles.pipelineOutcome}>
                <small>Expected outcome</small>
                <p>{item.outcome}</p>
              </div>
              <div className={styles.pipelineGate}>
                <small>Dependency / gate</small>
                <p>{item.gate}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${styles.section} ${styles.evolutionSection} ${styles.anchorSection}`} id="evolution">
        <div className={styles.evolutionHead}>
          <div>
            <span className={styles.evolutionLabel}>Evolution candidate · community architecture signal</span>
            <h2>From evidence graph to reviewed applicability assertions</h2>
          </div>
          <div className={styles.evolutionIntroduction}>
            <p>
              A document jurisdiction records the monitored source or market scope. It does not decide whether a provision legally applies to a particular company, service, audience or moment in time—and company attributes alone cannot make that decision either.
            </p>
            <div className={styles.evolutionBadges} aria-label="Evolution maturity">
              <span>Research candidate</span>
              <span>Human-reviewed only</span>
              <span>No release commitment</span>
            </div>
          </div>
        </div>

        <div className={styles.evolutionFlow} aria-label="Progression from observed language to reviewed applicability assertion">
          <article className={styles.evolutionFlowStage} data-stage="evidence">
            <header>
              <span>01 · Evidence</span>
              <b>Released v4 foundation</b>
            </header>
            <h3>What was written</h3>
            <div className={styles.evidenceChain} aria-label="Released evidence chain">
              {['Entity', 'Document', 'Version', 'Change', 'Provision'].map((node, index) => (
                <span key={node}>
                  <code>{node}</code>
                  {index < 4 ? <ChevronRight size={13} aria-hidden="true" /> : null}
                </span>
              ))}
            </div>
            <p>Exact captured language remains anchored to its publisher, document, version and change lineage.</p>
          </article>

          <span className={styles.evolutionRail} aria-hidden="true"><ChevronRight size={20} /></span>

          <article className={styles.evolutionFlowStage} data-stage="context">
            <header>
              <span>02 · Relationships</span>
              <b>Proposed typed model</b>
            </header>
            <h3>Who / what / where / when context</h3>
            <div className={styles.contextNodeGrid}>
              {applicabilityContextInputs.map((input) => <code key={input}>{input}</code>)}
            </div>
            <p>These relationships supply review context; none is sufficient on its own to prove applicability.</p>
          </article>

          <span className={styles.evolutionRail} aria-hidden="true"><ChevronRight size={20} /></span>

          <article className={styles.evolutionFlowStage} data-stage="assertion">
            <header>
              <span>03 · Assertion</span>
              <b>Accountable review gate</b>
            </header>
            <h3>Reviewed applicability assertion</h3>
            <code className={styles.assertionSignature}>Provision + LegalEntity + Service + Jurisdiction + Audience + ValidityPeriod</code>
            <div className={styles.assertionOutcomes} aria-label="Candidate assertion outcomes">
              <span>applies</span>
              <span>may_apply</span>
              <span>does_not_apply</span>
              <span>unknown</span>
            </div>
            <p>Every assertion would retain source, rationale, provenance, time, review state and an accountable reviewer.</p>
          </article>
        </div>

        <ol className={styles.maturityRail} aria-label="Applicability graph maturity path">
          {applicabilityMaturity.map((item) => (
            <li key={item.step}>
              <span>{item.step}</span>
              <div>
                <small>{item.status}</small>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className={styles.evolutionBoundary}>
          <div>
            <strong>Claim boundary</strong>
            <p>
              This candidate is an evidence-backed review aid—not legal advice, enforceability proof, an autonomous legal determination or compliance certification. AI may propose candidates or extract conditions, but it cannot publish a legal conclusion autonomously.
            </p>
          </div>
          <a href="#reviewed-applicability-graph">
            Inspect the feature-radar candidate
            <ChevronRight size={16} aria-hidden="true" />
          </a>
        </div>
      </section>

      <details className={`${styles.lowerPriorityDisclosure} ${styles.anchorSection}`} id="workspace">
        <summary><span>Explore the adaptive workspace</span><small>Optional product demonstrator, collapsed to keep community signals first.</small></summary>
      <section className={`${styles.section} ${styles.workspaceSection}`}>
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.sectionLabel}>Adaptive workspace</span>
            <h2>Workspace configuration</h2>
          </div>
          <p>
            PolicyWatcher retains a guided start for first-time visitors. The selected purpose and evidence depth compose a preview from registered dashboard modules; the choice stays reversible and Source QA remains pinned in every generated stack.
          </p>
        </div>

        <div className={styles.workspaceGrid}>
          <div className={styles.goalPanel}>
            <span className={styles.panelLabel}>1. Choose the job</span>
            <div className={styles.goalButtons}>
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  className={`${styles.goalButton} ${goal.id === goalId ? styles.goalButtonActive : ''}`}
                  onClick={() => setGoalId(goal.id)}
                  style={{ '--goal-accent': goal.accent } as CSSProperties}
                >
                  <span>{goal.label}</span>
                  <b>{goal.title}</b>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.depthPanel}>
            <span className={styles.panelLabel}>2. Choose evidence depth</span>
            <div className={styles.depthButtons}>
              {(Object.keys(depthLabels) as DetailLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`${styles.depthButton} ${level === detailLevel ? styles.depthButtonActive : ''}`}
                  onClick={() => setDetailLevel(level)}
                >
                  {depthLabels[level].label}
                </button>
              ))}
            </div>
            <p>{depthLabels[detailLevel].note}</p>
          </div>

          <div className={styles.selectedGoalCard}>
            <span className={styles.panelLabel}>3. Generated evidence stack</span>
            <h3>{selectedGoal.title}</h3>
            <p>{selectedGoal.summary}</p>
            <DepthDiagram level={detailLevel} goal={selectedGoal} />
            <Link href={buildWorkspaceHref(selectedGoal.id, detailLevel)} className={styles.workspaceLaunch}>
              Open this profile in the dashboard
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      </details>

      <details className={`${styles.lowerPriorityDisclosure} ${styles.anchorSection}`} id="impact-map">
        <summary><span>Review delivered releases and impact evidence</span><small>Version history and the full release-impact map.</small></summary>
      <section className={styles.section} id="now">
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.sectionLabel}>Delivered outcomes and active work</span>
            <h2>Delivered releases</h2>
          </div>
          <p>
            The voted outcomes are now shipped alongside the active Confidence work, with acceptance criteria and publication boundaries kept visible.
          </p>
        </div>

        <div className={styles.nowGrid}>
          {nowItems.map((item) => {
            const Icon = item.icon;
            return (
              <article className={styles.nowCard} key={item.title}>
                <div className={styles.cardTop}>
                  <span>{item.phase}</span>
                  <Icon size={20} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <dl>
                  <div>
                    <dt>Benefit</dt>
                    <dd>{item.benefit}</dd>
                  </div>
                  <div>
                    <dt>Validation</dt>
                    <dd>{item.validation}</dd>
                  </div>
                </dl>
                {'href' in item && item.href ? (
                  <Link href={item.href} className={styles.deliveredLink}>
                    Open delivered surface
                    <ArrowUpRight size={15} />
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.releaseStrip} aria-label="Release cadence">
        {releaseLanes.map((lane) => (
          <article key={lane.label} data-state={lane.state}>
            <span>{lane.label}</span>
            <strong>{lane.title}</strong>
            <p>{lane.body}</p>
          </article>
        ))}
      </section>

      <section className={styles.section}>
        <ReleaseImpactMap />
      </section>
      </details>

      <section className={`${styles.section} ${styles.anchorSection}`} id="candidates">
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.sectionLabel}>Feature radar</span>
            <h2>Feature candidates</h2>
          </div>
          <p>
            Candidate review records the workflow, expected evidence, acceptable limits and the current implementation gap. No popularity or endorsement count is inferred.
          </p>
        </div>

        <div className={styles.candidateControls}>
          <label className={styles.candidateSearch}>
            <span>Search candidates</span>
            <div>
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                value={candidateSearch}
                onChange={(event) => setCandidateSearch(event.target.value)}
                placeholder="Search title, evidence need or risk"
              />
            </div>
          </label>
          <label>
            <span>Track</span>
            <select value={candidateTrack} onChange={(event) => setCandidateTrack(event.target.value)}>
              <option value="all">All tracks</option>
              {candidateTracks.map((track) => <option value={track} key={track}>{track}</option>)}
            </select>
          </label>
          <label>
            <span>Implementation state</span>
            <select
              value={candidateState}
              onChange={(event) => setCandidateState(event.target.value as 'all' | CandidateImplementationState)}
            >
              <option value="all">All states</option>
              {(Object.keys(candidateStateLabels) as CandidateImplementationState[]).map((state) => (
                <option value={state} key={state}>{candidateStateLabels[state]}</option>
              ))}
            </select>
          </label>
          <div className={styles.candidateControlActions}>
            <span role="status" aria-live="polite">
              {filteredCandidateFeatures.length} of {candidateFeatures.length} candidates
            </span>
            <button type="button" onClick={clearCandidateFilters} disabled={!filtersActive}>Clear filters</button>
            {hasSavedSignalDraft ? (
              <button type="button" className={styles.resumeDraftButton} onClick={resumeSignal}>Resume local draft</button>
            ) : null}
          </div>
        </div>

        {candidateFeatures.length === 0 ? (
          <div className={styles.candidateEmptyState}>
            <h3>No candidate data is available</h3>
            <p>The roadmap catalogue could not provide candidate records.</p>
          </div>
        ) : filteredCandidateFeatures.length === 0 ? (
          <div className={styles.candidateEmptyState}>
            <h3>No candidates match these filters</h3>
            <p>Clear the filters or search for a different evidence need.</p>
            <button type="button" onClick={clearCandidateFilters}>Reset candidate view</button>
          </div>
        ) : (
          <div className={styles.candidateGrid}>
          {filteredCandidateFeatures.map((feature, index) => (
            <article
              className={styles.candidateCard}
              key={feature.title}
              id={feature.title === 'Reviewed Applicability Graph' ? 'reviewed-applicability-graph' : undefined}
              style={{ '--delay': `${index * 0.04}s` } as CSSProperties}
            >
              <div className={styles.candidateTop}>
                <span>{feature.track}</span>
                <b>{candidateStateLabels[getCandidateImplementationState(feature.status)]} · {feature.status}</b>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
              <div className={styles.riskNote}>
                <strong>Watch point</strong>
                <span>{feature.risk}</span>
              </div>
              <button className={styles.signalLink} type="button" onClick={() => openCandidateSignal(feature.title, feature.track)}>
                Signal interest
                <ChevronRight size={15} />
              </button>
            </article>
          ))}
          </div>
        )}
      </section>

      <section className={`${styles.methodSection} ${styles.anchorSection}`} id="method">
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.sectionLabel}>Ranking model</span>
            <h2>Signal criteria</h2>
          </div>
          <p>
            Each request is reviewed for feasibility, source quality, security and claim scope. The ranking informs product prioritization.
          </p>
        </div>
        <div className={styles.methodGrid}>
          <article>
            <ListChecks size={22} />
            <h3>Use case</h3>
            <p>Identify the user, decision and question.</p>
          </article>
          <article>
            <Database size={22} />
            <h3>Evidence requirement</h3>
            <p>Specify the required source, check log, snapshot, region, KPI or export.</p>
          </article>
          <article>
            <Cpu size={22} />
            <h3>Implementation path</h3>
            <p>Document the implementation path, data requirements and automation limits.</p>
          </article>
          <article>
            <Radio size={22} />
            <h3>Release lane</h3>
            <p>Classify the item as a feature release, evidence-method release or research candidate.</p>
          </article>
        </div>
      </section>

      <section className={styles.callout}>
        <div>
          <span className={styles.sectionLabel}>Community input</span>
          <h2>Roadmap signal submission</h2>
          <p>
            The most useful feedback is specific: the role you have, the decision you need to make, the evidence you trust, and the level of detail you expect.
          </p>
        </div>
        <button className={styles.primaryAction} type="button" onClick={openNewSignal}>
          Open a roadmap proposal
          <ChevronRight size={17} />
        </button>
      </section>

      <section className={styles.footer} aria-label="Roadmap boundary and local links">
        <span>PolicyWatcher roadmap - community signal board</span>
        <span>Planning surface only. Features may change after validation, testing, and review.</span>
        <div>
          <Link href="/showcase">Showcase</Link>
          <Link href="/press">Press</Link>
          <Link href="/trust">Trust</Link>
          <Link href="/methodology/confidence">Methodology</Link>
        </div>
      </section>
      <Footer lang="en" />
      </main>
      <RoadmapSignalComposer
        request={composerRequest}
        tracks={candidateTracks}
        onClose={closeSignalComposer}
        onDraftAvailabilityChange={updateDraftAvailability}
      />
    </>
  );
}
