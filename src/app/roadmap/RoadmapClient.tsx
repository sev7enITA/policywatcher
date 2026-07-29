'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, type CSSProperties } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpenCheck,
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
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { ReleaseImpactMap } from '@/components/ReleaseImpactMap';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import { POLICYWATCHER_RELEASE_NAME, POLICYWATCHER_VERSION } from '@/lib/release';
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
    title: 'Understand what changed and why it matters',
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
      'A technical view for public API consumers and controlled enterprise pilots across Azure and Power Platform.',
    view: 'Integration options, API v1 and v2 contracts, Observatory registry, tenant, rate and source boundaries.',
    output: 'Read-only machine-readable evidence and a bounded Microsoft test-tenant path.',
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

const nowItems = [
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
    title: 'Source confidence and continuity ledger',
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
    title: 'Calm Workspace onboarding and navigation',
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
    benefit: 'Users start from the question they have and receive an evidence stack assembled from existing product modules.',
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
    phase: 'In progress',
    title: 'Source Remediation Workbench',
    body:
      'Turn failed retrievals into an actionable admin workflow: URL repair, jurisdiction fit, duplicate source decisions, and source suspension review.',
    benefit: 'Dataset confidence becomes a daily operating loop rather than a hidden maintenance task.',
    validation: 'Every repaired source must show before/after QA status and retrieval evidence.',
    icon: Search,
  },
  {
    phase: 'In progress',
    title: 'Community Signal Board',
    body:
      'Let users signal which roadmap candidates matter most and describe their real workflow, evidence needs, and acceptable limits.',
    benefit: 'Prioritization becomes traceable and grounded in actual use cases.',
    validation: 'GitHub issues become structured roadmap signals with acceptance criteria.',
    icon: Users,
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
    track: 'Collaboration',
    title: 'Local public-evidence watchlists and shareable collections',
    body:
      'Delivered in 3.9.0 Beta 17: select up to 12 public change IDs, retain title and review states locally, and share an ID-only canonical URL.',
    status: 'Delivered beta 17',
    risk: 'This is not a persistent team workspace: accounts, ACLs, comments, presence and conflict resolution are not included.',
  },
  {
    track: 'API',
    title: 'Signed outbound events and webhooks',
    body:
      'A versioned forward-polling feed now exposes already-public policy.change.published envelopes with stable IDs and opaque cursors. Push delivery remains a separate later phase.',
    status: 'Polling feed available · push later',
    risk: 'Subscriptions, HMAC signing, replay protection, retries, retention and delivery-health controls are still required before outbound webhooks.',
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
      'Design purpose-built clients over API v2: a dedicated Teams route, a declarative Copilot agent or API plugin, a federated MCP server and optional Graph indexing.',
    status: 'Planned',
    risk: 'Each surface needs tenant authorization, content and retention boundaries, operational ownership and isolation tests.',
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
    title: 'Calm Workspace Release',
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
      'Browser-local public-evidence collections, ID-only share links, multi-change briefings and deterministic JSON, Markdown and CSV bundles with explicit collaboration boundaries.',
    state: 'current',
  },
  {
    label: '4.0',
    title: 'Feature Drop',
    body:
      'Signed webhooks, tenant lifecycle controls, persistent alert watchlists, multi-version diff and production integration hardening after the API v2 pilot.',
    state: 'candidate',
  },
  {
    label: '4.5',
    title: 'Confidence Release',
    body:
      'Community benchmark pack, cross-version evidence lineage, external methodology review and production database hardening.',
    state: 'candidate',
  },
];

function buildIssueUrl(feature: string, track: string) {
  const title = `Roadmap signal: ${feature}`;
  const body = [
    `Feature: ${feature}`,
    `Track: ${track}`,
    '',
    'What I need to understand or accomplish:',
    '',
    'Current workflow or workaround:',
    '',
    'What evidence, export, alert, or view would make this useful:',
    '',
    'Preferred detail level: Snapshot / Operational / Forensic',
    '',
    'Risks, wording limits, or source-quality concerns:',
  ].join('\n');

  return `${repoUrl}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}

function buildWorkspaceHref(goalId: GoalId, depth: DetailLevel) {
  const intent = goalId === 'governance' ? 'grc' : goalId;
  return `/?intent=${intent}&depth=${depth}`;
}

function HeroGraph() {
  return (
    <svg viewBox="0 0 760 520" className={styles.heroGraph} aria-hidden="true">
      <defs>
        <linearGradient id="roadmapRoute" x1="0" x2="1">
          <stop stopColor="#5eead4" />
          <stop offset="0.48" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
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
  const selectedGoal = useMemo(() => goals.find((goal) => goal.id === goalId) ?? goals[0], [goalId]);
  const candidateTrackCount = useMemo(
    () => new Set(candidateFeatures.map((feature) => feature.track)).size,
    [],
  );

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
          <a href="#impact-map">Release impact</a>
          <Link href="/feature-atlas">Feature Atlas</Link>
          <a href="#workspace">Workspace</a>
          <a href="#now">Now</a>
          <a href="#candidates">Candidates</a>
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
          <span className={styles.eyebrow}>Community-shaped roadmap</span>
          <h1>Help decide what PolicyWatcher should show next</h1>
          <p>
            PolicyWatcher includes goal-driven evidence workspaces in addition to static dashboard views. Workspace configuration records the user objective, requested evidence depth and modules that remain unavailable until source requirements are met.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryAction} href="#candidates">
              Signal a roadmap priority
              <ArrowUpRight size={17} />
            </a>
            <a className={styles.secondaryAction} href={buildIssueUrl('New roadmap proposal', 'Community proposal')} target="_blank" rel="noopener noreferrer">
              Propose a new idea
            </a>
            <Link className={styles.secondaryAction} href="/feature-atlas">
              Explore feature dependencies
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </section>

        <aside className={styles.heroBoard} aria-label="Roadmap signal preview">
          <div className={styles.boardChrome}>
            <span>roadmap.signal</span>
            <b>live proposal surface</b>
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
          <strong>Evidence first</strong>
          <span>Public views should expose only source-gated records, not seeded or uncertain data.</span>
        </article>
        <article>
          <Eye size={18} />
          <strong>Configurable clarity</strong>
          <span>The interface should adapt to the user objective and chosen evidence depth.</span>
        </article>
        <article>
          <GitFork size={18} />
          <strong>Community signals</strong>
          <span>Roadmap priority should come from concrete workflows, not generic feature voting.</span>
        </article>
        <article>
          <Lock size={18} />
          <strong>Measured language</strong>
          <span>Future features keep the same discipline: mapping, review, evidence, and visible source-quality state.</span>
        </article>
      </section>

      <section className={`${styles.section} ${styles.workspaceSection}`} id="workspace">
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.sectionLabel}>Adaptive workspace</span>
            <h2>Start from the question, not from the dashboard</h2>
          </div>
          <p>
            PolicyWatcher v{POLICYWATCHER_VERSION} opens a guided start for first-time visitors. The selected purpose and evidence depth compose a preview from registered, real dashboard modules; the choice stays reversible and Source QA remains pinned in every generated stack.
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

      <section className={styles.section} id="now">
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.sectionLabel}>Delivered outcomes and active work</span>
            <h2>What the roadmap has already moved into the product</h2>
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

      <section className={styles.section} id="impact-map">
        <ReleaseImpactMap />
      </section>

      <section className={styles.section} id="candidates">
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.sectionLabel}>Feature radar</span>
            <h2>Potential evolutions the community can rank</h2>
          </div>
          <p>
            Candidate review records the workflow, expected evidence, acceptable limits and the current implementation gap in addition to the vote count.
          </p>
        </div>

        <div className={styles.candidateGrid}>
          {candidateFeatures.map((feature, index) => (
            <article
              className={styles.candidateCard}
              key={feature.title}
              style={{ '--delay': `${index * 0.04}s` } as CSSProperties}
            >
              <div className={styles.candidateTop}>
                <span>{feature.track}</span>
                <b>{feature.status}</b>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
              <div className={styles.riskNote}>
                <strong>Watch point</strong>
                <span>{feature.risk}</span>
              </div>
              <a className={styles.signalLink} href={buildIssueUrl(feature.title, feature.track)} target="_blank" rel="noopener noreferrer">
                Signal interest
                <ArrowUpRight size={15} />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.methodSection} id="method">
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.sectionLabel}>How ranking should work</span>
            <h2>Signals should describe evidence needs</h2>
          </div>
          <p>
            A popular request still needs feasibility, source-quality review, security review, and wording discipline. Roadmap ranking should guide prioritization, not replace product judgment.
          </p>
        </div>
        <div className={styles.methodGrid}>
          <article>
            <ListChecks size={22} />
            <h3>Use case clarity</h3>
            <p>What question should PolicyWatcher help answer, and who is asking it?</p>
          </article>
          <article>
            <Database size={22} />
            <h3>Evidence requirement</h3>
            <p>Which source, check log, snapshot, region, KPI, or export is needed?</p>
          </article>
          <article>
            <Cpu size={22} />
            <h3>Implementation path</h3>
            <p>Can it be built without inventing data, hiding uncertainty, or overstating automation?</p>
          </article>
          <article>
            <Radio size={22} />
            <h3>Release lane</h3>
            <p>Is it a feature drop, a confidence hardening release, or a research candidate?</p>
          </article>
        </div>
      </section>

      <section className={styles.callout}>
        <div>
          <span className={styles.sectionLabel}>Community input</span>
          <h2>Tell us what you need PolicyWatcher to reveal</h2>
          <p>
            The most useful feedback is specific: the role you have, the decision you need to make, the evidence you trust, and the level of detail you expect.
          </p>
        </div>
        <a className={styles.primaryAction} href={buildIssueUrl('New roadmap proposal', 'Community proposal')} target="_blank" rel="noopener noreferrer">
          Open a roadmap proposal
          <ArrowUpRight size={17} />
        </a>
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
    </>
  );
}
