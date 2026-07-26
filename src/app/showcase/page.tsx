import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { POLICYWATCHER_RELEASE_NAME, POLICYWATCHER_VERSION } from '@/lib/release';
import styles from './showcase.module.css';

export const metadata: Metadata = {
  title: `PolicyWatcher ${POLICYWATCHER_VERSION} ${POLICYWATCHER_RELEASE_NAME} Showcase`,
  description:
    'PolicyWatcher native dashboard intelligence: validated composition, canonical KPIs, evidence-first data sources and five accessible, provenance-aware visualizations.',
};

const topNav = [
  ['01', 'Sources', '#atlas'],
  ['02', 'Graphs', '#signals'],
  ['03', 'Dataset QA', '#quality'],
  ['04', 'Admin tools', '#admin'],
  ['05', 'Trust', '#trust'],
  ['06', 'Pipeline', '#flow'],
] as const;

const atlasPanels = [
  {
    code: 'DATASET',
    title: 'Company and policy records',
    body: 'The platform displays configured companies, source URLs, jurisdiction labels, policy categories and Dataset QA status.',
    details: ['Company', 'Industry', 'Configured URL', 'Jurisdiction', 'Policy type', 'Dataset QA status'],
    metric: 'Configured records',
    accent: '#5eead4',
  },
  {
    code: 'CHANGES',
    title: 'Change views',
    body: 'When change rows exist in the dataset, the UI shows timelines, diffs, summaries and related metadata.',
    details: ['Timeline', 'Diff view', 'Change page', 'Share view', 'Embed view', 'OG image'],
    metric: 'Dataset-driven views',
    accent: '#a78bfa',
  },
  {
    code: 'ANALYSIS',
    title: 'Risk and KPI analysis',
    body: 'Canonical KPI semantics, real snapshot-version trends and evidence provenance keep analysis fields consistent across APIs, charts and exports.',
    details: ['Truthful trend', 'Risk profile', 'Current score', 'Region matrix', 'KPI benchmark', 'View export'],
    metric: 'Validated analysis contracts',
    accent: '#fb923c',
  },
  {
    code: 'CONTROL',
    title: 'Admin tools',
    body: 'The admin area includes five-stage Bulk Source Onboarding, Dataset QA decisions, Review Log, KPI audit, companies, cron status, VPS services and database controls.',
    details: ['Bulk intake', 'Private baseline', 'Dataset QA', 'Publication decision', 'Review Log', 'Cron'],
    metric: 'Operational modules',
    accent: '#60a5fa',
  },
];

const signalTiles = [
  { name: 'Timeline', tag: 'Change rows', visual: 'pulse', metric: 'Filters', copy: 'Uses the changes API to list available change records with filters by company, sector, risk and date.' },
  { name: 'Risk trend', tag: 'Public score rows', visual: 'trend', metric: 'Snapshot provenance', copy: 'Plots evidence-gated score records, distinguishes observation sequence from the real snapshot version, and includes an accessible table.' },
  { name: 'Region heatmap', tag: 'Public change evidence', visual: 'map', metric: 'Explicit coverage', copy: 'Shows region and perspective risk with bilingual summary, exact-value table and missing cells kept as Not assessed.' },
  { name: 'Benchmark radar', tag: 'Evidence-gated comparison', visual: 'radar', metric: 'Keyed KPI dimensions', copy: 'Compares companies or a current sector cohort by canonical KPI key, excludes unassessed values from wins and exposes exact assessments.' },
  { name: 'KPI matrix', tag: 'Canonical KPI fields', visual: 'matrix', metric: 'Shared catalog', copy: 'Uses one field-specific vocabulary and concern order across normalization, audit and the public matrix.' },
  { name: 'Executive PDF', tag: 'Report route', visual: 'report', metric: 'PDF output', copy: 'Generates a report from the selected policy and its available analysis fields.' },
];

const heroTelemetry = [
  ['Validated dashboard grammar', 'Composes goal-specific workspaces from immutable allowlisted modules with deterministic IDs and Source QA pinned.'],
  ['Evidence-first data registry', 'Declares endpoint, path/query scope, freshness, visibility, public-evidence gate and limitations before a dashboard source can load.'],
  ['View/export parity', 'Uses the same filtered view model for the visible company list and CSV export, including a provenance manifest.'],
  ['Bulk source onboarding', 'Moves validated candidates through official review, private baseline, QA, and an explicit publication decision.'],
  ['Dataset QA', 'Checks URL hygiene, source evidence, hash consistency, timestamps, KPI fields, regional impact coverage and subscriber hygiene.'],
  ['Retrieval evidence', 'Documents direct fetch, HTTP/2, VPS-rendered fetch, archive fallback, source failures and strategy escalation without inventing data.'],
  ['Public evidence gate', 'Seeded, partial, unavailable or review-needed sources are withheld from public views until a valid source baseline exists.'],
  ['Policy Signals Board', 'Ranks source coverage, retrieval traceability and publicEvidence movement without certifying companies or compliance.'],
  ['Trust evidence', 'Shows CI, CodeQL, OpenSSF Scorecard, targeted reliability coverage and live-header report links.'],
] as const;

const qualityGates = [
  ['Onboarding gate', 'Imports and first baselines remain private until QA passes and an admin explicitly publishes', 'Publication'],
  ['Source fit', 'Official URL, jurisdiction, duplicate and localization checks', 'Dataset QA'],
  ['Retrieval chain', 'Direct, HTTP/2, VPS renderer, Wayback and Common Crawl diagnostics', 'Evidence'],
  ['Public gate', 'Seeded, partial, unavailable and review-needed records stay non-public', 'Gate'],
  ['Re-baseline guard', 'Seed-only baseline replacement with source-evidence and public-baseline protections', 'Guard'],
  ['Drift control', 'Host drift, homepage redirect and oversized extraction checks', 'Validation'],
  ['Evidence log', 'Status, source, timestamp, hash, length and archive timestamp records', 'Audit trail'],
  ['Review trail', 'Dataset QA decisions, admin review log, access log and suspension alerts', 'Review'],
] as const;

const adminCells = [
  ['Bulk Source Onboarding', 'CSV/TSV intake, official-source review, private baseline, QA gate and publish/hold/reject decision'],
  ['Dataset Quality', 'Source fit, public evidence gates, check logs, hash consistency and analysis field checks'],
  ['KPI Audit', 'KPI value distribution and explanation coverage by company'],
  ['Company Registry', 'Companies, industries, policy URLs, policy types and jurisdictions'],
  ['Cron Manager', 'Batch scans, company targeting, live strategy evidence and source suspension results'],
  ['VPS Services', 'Renderer health checks, bearer-auth smoke test and redirect/SSRF boundary checks'],
  ['Database Console', 'Database inspection for records used by public views'],
  ['Access Log', 'Admin login and access events with IP, user-agent, path and outcome'],
  ['Encrypted Backup', 'Encrypted export and decrypt-preview utility for database content'],
  ['Auditor Role', 'Read-only review access for selected admin views'],
  ['Security Settings', 'Session HMAC, rate limits, protected APIs and token hygiene'],
  ['Trust Evidence', 'Public quality page for CI, CodeQL, OpenSSF, targeted reliability coverage and live header reports'],
] as const;

const flow = [
  ['Proposed source', 'Validated CSV/TSV candidate enters protected admin review and remains private'],
  ['Official review to publication', 'Official-source decision, private first baseline, QA gate and explicit publish/hold/reject are persisted'],
  ['Inventory row', 'Company, policy URL, type, jurisdiction and configured status'],
  ['Retrieval cascade', 'Direct fetch, HTTP/2, VPS renderer, Wayback and Common Crawl are tried with recorded outcomes'],
  ['Source validation', 'Minimum text, host drift, path drift, extraction cap and content-shape checks'],
  ['Evidence log', 'Status, source, HTTP status, final URL, hash, text length and archive timestamp are recorded'],
  ['Public gate', 'Only source-verified evidence is available to public routes and reports'],
  ['Re-baseline guard', 'Seeded inventory is replaced only when no source evidence or public baseline already exists'],
  ['Change analysis', 'Diff, AI summary, KPI fields and regional impacts are generated only after a valid baseline comparison'],
  ['Review workflow', 'Dataset QA decisions, admin review log and suspension alerts document human and system actions'],
  ['Trust view', 'Public evidence page links repository checks, security scans and external report surfaces'],
  ['Public view', 'Dashboard, timeline, signals board, share, embed, report and digest routes read only gated data'],
] as const;

function ArrowGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

function SignalMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path d="M24 4l16 7.7v10.6C40 32.2 33.3 40.6 24 44 14.7 40.6 8 32.2 8 22.3V11.7L24 4z" />
      <path d="M14 26c4.8-10.2 15.2-10.2 20 0" />
      <path d="M14 22c4.2 6 15 6 20 0" />
      <circle cx="24" cy="24" r="4" />
    </svg>
  );
}

function HeroInstrument() {
  return (
    <div className={styles.heroInstrument} aria-hidden="true">
      <div className={styles.instrumentFrame}>
        <div className={styles.instrumentHeader}>
          <span>Feature visual</span>
          <b>v3.6</b>
        </div>
        <div className={styles.instrumentStage}>
          <svg viewBox="0 0 720 460" className={styles.fieldSvg}>
            <defs>
              <linearGradient id="routeA" x1="0" x2="1">
                <stop stopColor="#5eead4" />
                <stop offset="1" stopColor="#60a5fa" />
              </linearGradient>
              <linearGradient id="routeB" x1="0" x2="1">
                <stop stopColor="#f59e0b" />
                <stop offset="1" stopColor="#ef4444" />
              </linearGradient>
            </defs>
            <path className={styles.landMass} d="M106 184c31-78 121-119 213-86 44 16 63 48 104 43 76-9 122-62 184-28 49 27 65 104 32 158-34 57-106 78-171 60-51-14-87-45-143-20-69 31-132 22-179-24-32-32-63-51-40-103z" />
            <path className={styles.routeOne} d="M78 314c96-91 199-114 300-83 89 27 137 82 226 38" />
            <path className={styles.routeTwo} d="M142 132c77 84 149 121 233 113 86-8 130-57 222-11" />
            <path className={styles.routeThree} d="M184 365c62-87 119-117 186-110 56 6 96 48 161 3" />
            <circle className={styles.packetA} cx="0" cy="0" r="6">
              <animateMotion dur="7s" repeatCount="indefinite" path="M78 314c96-91 199-114 300-83 89 27 137 82 226 38" />
            </circle>
            <circle className={styles.packetB} cx="0" cy="0" r="6">
              <animateMotion dur="8s" repeatCount="indefinite" path="M142 132c77 84 149 121 233 113 86-8 130-57 222-11" />
            </circle>
            <circle className={styles.packetC} cx="0" cy="0" r="6">
              <animateMotion dur="6.4s" repeatCount="indefinite" path="M184 365c62-87 119-117 186-110 56 6 96 48 161 3" />
            </circle>
            <circle className={styles.hotNode} cx="392" cy="230" r="11" />
            <circle className={styles.warnNode} cx="239" cy="262" r="11" />
            <circle className={styles.coldNode} cx="586" cy="266" r="11" />
            <circle className={styles.coreNode} cx="332" cy="337" r="13" />
          </svg>

          <div className={`${styles.instrumentCard} ${styles.cardRisk}`}>
            <span>Risk field</span>
            <strong>KPI</strong>
            <small>From analysis rows</small>
          </div>
          <div className={`${styles.instrumentCard} ${styles.cardSeal}`}>
            <span>QA fields</span>
            <strong>QA</strong>
            <small>Admin dataset QA</small>
          </div>
          <div className={styles.instrumentDock}>
            <span>Diff view</span>
            <span>Summary field</span>
            <span>Region view</span>
            <span>Report route</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignalVisual({ type }: { type: string }) {
  if (type === 'pulse') {
    return (
      <svg viewBox="0 0 360 200" className={styles.signalSvg} aria-hidden="true">
        <path className={styles.axisLine} d="M28 146h304" />
        <rect className={styles.timelineBarOne} x="58" y="118" width="70" height="15" rx="7" />
        <rect className={styles.timelineBarTwo} x="132" y="83" width="96" height="15" rx="7" />
        <rect className={styles.timelineBarThree} x="214" y="45" width="74" height="15" rx="7" />
        <path className={styles.animatedTrace} d="M55 146c31-14 44-46 76-43 34 3 42 32 78 22 45-12 45-78 96-82" />
        <line className={styles.timelineCursor} x1="70" y1="30" x2="70" y2="164" />
        <circle className={styles.signalDot} cx="55" cy="146" r="7" />
        <circle className={styles.signalDot} cx="131" cy="103" r="7" />
        <circle className={styles.signalDot} cx="209" cy="125" r="7" />
        <circle className={styles.signalDot} cx="305" cy="43" r="7" />
      </svg>
    );
  }

  if (type === 'trend') {
    return (
      <svg viewBox="0 0 360 200" className={styles.signalSvg} aria-hidden="true">
        <path className={styles.axisLine} d="M42 154h280M42 112h280M42 70h280" />
        <path className={`${styles.redTrace} ${styles.animatedTrace}`} d="M56 150c42-25 61-78 105-64 34 11 31 61 73 48 37-11 47-74 81-87" />
        <path className={`${styles.blueTrace} ${styles.animatedTraceAlt}`} d="M56 126c45-12 70-22 110-6 39 16 56 37 89 20 31-16 38-49 66-43" />
        <circle className={styles.trendCursor} cx="0" cy="0" r="6">
          <animateMotion dur="5.8s" repeatCount="indefinite" path="M56 150c42-25 61-78 105-64 34 11 31 61 73 48 37-11 47-74 81-87" />
        </circle>
      </svg>
    );
  }

  if (type === 'map') {
    return (
      <svg viewBox="0 0 360 200" className={styles.signalSvg} aria-hidden="true">
        <path className={styles.mapBody} d="M58 83c32-43 92-55 138-25 29 18 45 10 78 6 47-6 72 36 62 78-9 38-53 61-103 48-33-9-61-25-98-10-51 21-99-5-116-43-10-22 15-34 39-54z" />
        <circle className={styles.mapHalo} cx="164" cy="104" r="22" />
        <circle className={styles.mapHalo} cx="259" cy="76" r="18" />
        <circle className={styles.mapHalo} cx="102" cy="139" r="16" />
        <circle className={styles.signalDot} cx="164" cy="104" r="10" />
        <circle className={styles.signalDot} cx="259" cy="76" r="8" />
        <circle className={styles.signalDot} cx="102" cy="139" r="8" />
      </svg>
    );
  }

  if (type === 'radar') {
    return (
      <svg viewBox="0 0 360 200" className={styles.signalSvg} aria-hidden="true">
        <polygon points="180,28 278,82 254,164 106,164 82,82" />
        <polygon points="180,56 238,90 224,136 136,136 122,90" />
        <polygon className={styles.radarFill} points="180,47 249,94 215,151 124,128 116,88" />
        <polygon className={styles.radarFillAlt} points="180,66 228,84 236,146 142,154 106,96" />
        <path d="M180 28v136M82 82l172 82M278 82l-172 82" />
        <line className={styles.radarSweep} x1="180" y1="96" x2="278" y2="82" />
      </svg>
    );
  }

  if (type === 'matrix') {
    return (
      <svg viewBox="0 0 360 200" className={styles.signalSvg} aria-hidden="true">
        {Array.from({ length: 6 }).map((_, row) =>
          Array.from({ length: 8 }).map((__, col) => (
            <rect
              key={`${row}-${col}`}
              x={38 + col * 35}
              y={34 + row * 24}
              width="22"
              height="15"
              rx="4"
              className={`${styles[`heat${(row + col) % 4}`]} ${styles.heatCell}`}
              style={{ '--d': `${(row * 8 + col) * 70}ms` } as CSSProperties}
            />
          ))
        )}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 360 200" className={styles.signalSvg} aria-hidden="true">
      <path d="M108 28h120l38 38v106H108z" />
      <path d="M228 28v38h38" />
      <path className={styles.reportLineOne} d="M136 91h91" />
      <path className={styles.reportLineTwo} d="M136 116h64" />
      <path className={styles.reportLineThree} d="M136 141h103" />
      <circle cx="262" cy="144" r="27" />
      <path className={styles.reportCheck} d="M250 144l9 9 20-25" />
    </svg>
  );
}

function AdminConsoleArt() {
  return (
    <div className={styles.consoleArt} aria-hidden="true">
      <div className={styles.consoleSide}>
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className={styles.consoleMain}>
        <div className={styles.consoleTop}>
            <strong>Dataset QA View</strong>
            <b>Admin only</b>
        </div>
        <div className={styles.consoleGrid}>
          <div className={styles.consoleScore}><strong>QA</strong><span>Issue list</span></div>
          <div className={styles.consoleBars}>
            {qualityGates.slice(0, 4).map((gate) => (
              <div key={gate[0]}>
                <span>{gate[0]}</span>
                <i />
              </div>
            ))}
          </div>
          <div className={styles.consoleColumns}>
            <i /><i /><i /><i /><i />
          </div>
          <div className={styles.consoleTags}>
            <span>Public Gate</span>
            <span>Re-baseline Guard</span>
            <span>Suspension Alerts</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShowcasePage() {
  return (
    <main className={styles.showcase}>
      <aside className={styles.verticalRail} aria-label="Showcase vertical navigation">
        {topNav.map(([number, label, href]) => (
          <a key={href} href={href}>
            <span>{number}</span>
            <b>{label}</b>
          </a>
        ))}
      </aside>

      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="PolicyWatcher dashboard">
            <Image src="/logo-mark.png" alt="" width={42} height={42} className={styles.logo} priority />
            <span>
              <strong>PolicyWatcher</strong>
              <small>Release {POLICYWATCHER_VERSION} {POLICYWATCHER_RELEASE_NAME}</small>
            </span>
        </Link>

        <nav className={styles.nav} aria-label="Showcase horizontal navigation">
          {topNav.map(([, label, href]) => (
            <a key={href} href={href}>{label}</a>
          ))}
        </nav>

        <Link href="/" className={styles.headerCta}>
          Open platform
          <ArrowGlyph />
        </Link>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>
            <SignalMark />
            PolicyWatcher {POLICYWATCHER_VERSION} {POLICYWATCHER_RELEASE_NAME}
          </span>
          <h1>
            <span>PolicyWatcher</span>
            <span>confidence</span>
            <span>map.</span>
          </h1>
          <p>
            This page describes what the current platform exposes: public
            dashboard contracts, change views, canonical analysis fields,
            provenance-aware exports, dataset QA checks, retrieval evidence,
            source suspension logic, Trust & Quality evidence and admin tools.
          </p>
          <div className={styles.heroActions}>
            <Link href="/" className={styles.primaryAction}>
              Open dashboard
              <ArrowGlyph />
            </Link>
            <Link href="/timeline" className={styles.secondaryAction}>
              Open timeline
              <ArrowGlyph />
            </Link>
            <Link href="/leaderboard" className={styles.secondaryAction}>
              Open signals board
              <ArrowGlyph />
            </Link>
          </div>
          <div className={styles.heroTelemetry} aria-label="Release telemetry highlights">
            {heroTelemetry.map(([label, body]) => (
              <article key={label}>
                <strong>{label}</strong>
                <span>{body}</span>
              </article>
            ))}
          </div>
        </div>
        <HeroInstrument />
      </section>

      <nav className={styles.horizontalStrip} aria-label="Product capability jump strip">
        {topNav.map(([number, label, href]) => (
          <a key={href} href={href}>
            <span>{number}</span>
            {label}
          </a>
        ))}
      </nav>

      <section id="atlas" className={`${styles.section} ${styles.atlasSection}`}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionKicker}>Data model</span>
          <h2>What the interface reads from the configured records.</h2>
          <p>
            The public and admin pages are built around companies, policies,
            policy changes, check logs, region impacts, subscribers and QA results. The
            panels below map those records to the visible features.
          </p>
        </div>

        <div className={styles.atlasRail} aria-label="Horizontal PolicyWatcher capability atlas">
          {atlasPanels.map((panel, index) => (
            <article
              key={panel.title}
              className={styles.atlasPanel}
              style={{ '--accent': panel.accent } as CSSProperties}
            >
              <div className={styles.panelIndex}>0{index + 1}</div>
              <div className={styles.panelCopy}>
                <span>{panel.code}</span>
                <h3>{panel.title}</h3>
                <p>{panel.body}</p>
              </div>
              <div className={styles.panelConstellation}>
                {panel.details.map((detail, detailIndex) => (
                  <i
                    key={detail}
                    style={{
                      '--x': `${18 + ((detailIndex * 29) % 62)}%`,
                      '--y': `${18 + ((detailIndex * 19) % 62)}%`,
                    } as CSSProperties}
                  >
                    {detail}
                  </i>
                ))}
              </div>
              <strong>{panel.metric}</strong>
            </article>
          ))}
        </div>
      </section>

      <section id="signals" className={`${styles.section} ${styles.signalsSection}`}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionKicker}>Animated data views</span>
          <h2>Visual modules currently present in the platform.</h2>
          <p>
            The animated SVGs below are static representations of existing
            product views. They describe UI modules and the database fields they
            use.
          </p>
        </div>

        <div className={styles.signalWall}>
          {signalTiles.map((tile) => (
            <article key={tile.name} className={styles.signalTile}>
              <SignalVisual type={tile.visual} />
              <div>
                <span>{tile.tag}</span>
                <h3>{tile.name}</h3>
                <strong>{tile.metric}</strong>
                <p>{tile.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="quality" className={`${styles.section} ${styles.qualitySection}`}>
        <div className={styles.qualityNarrative}>
          <span className={styles.sectionKicker}>Dataset QA</span>
          <h2>Dataset QA lists checks and issues for review.</h2>
          <p>
            The admin QA layer checks source fit, retrieval evidence, public
            evidence gates, seeded-record boundaries, hash consistency,
            check-log completeness, timestamp integrity, archive timestamps,
            KPI coverage, regional impact coverage and subscriber hygiene.
            Review decisions are persisted and written to an append-only log.
          </p>
        </div>
        <div className={styles.qualityReactor} aria-label="Dataset quality gates">
          {qualityGates.map(([label, value, badge], index) => (
            <div key={label} className={styles.qualityOrbit} style={{ '--i': index } as CSSProperties}>
              <span>{label}</span>
              <b>{value}</b>
              <i>{badge}</i>
            </div>
          ))}
          <div className={styles.reactorCore}>
            <strong>QA</strong>
            <span>Checks</span>
          </div>
        </div>
      </section>

      <section id="admin" className={`${styles.section} ${styles.adminSection}`}>
        <div className={styles.adminIntro}>
          <div>
            <span className={styles.sectionKicker}>Administrative tools</span>
            <h2>Admin functions available across the {POLICYWATCHER_VERSION} dashboard intelligence and confidence track.</h2>
            <p>
            The admin area includes login, metrics, company and policy
              management, dataset QA, KPI audit, explainability, cron status,
              database inspection, encrypted backup utilities, renderer-aware retrieval evidence and policy telemetry.
            </p>
          </div>
          <AdminConsoleArt />
        </div>

        <div className={styles.adminTrace} aria-label="Administrative operating layers">
          <span>Company records</span>
          <span>Policy records</span>
          <span>Retrieval path</span>
          <span>Change records</span>
          <span>QA issue list</span>
          <span>Trust evidence</span>
          <span>Encrypted export</span>
        </div>

        <div className={styles.adminMosaic}>
          {adminCells.map(([title, body], index) => (
            <article key={title} className={styles.adminCell} style={{ '--d': `${index * 60}ms` } as CSSProperties}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="flow" className={`${styles.section} ${styles.flowSection}`}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionKicker}>Workflow</span>
          <h2>How database records feed the public views.</h2>
          <p>
            This is a functional map of routes and records used by the app. It
            separates what is configured in the dataset from what is shown in
            public pages.
          </p>
        </div>

        <div className={styles.flowRibbon}>
          {flow.map(([title, body], index) => (
            <article key={title} className={styles.flowStep}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <i>{index === flow.length - 1 ? 'Live' : 'Next'}</i>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="trust" className={`${styles.section} ${styles.qualitySection}`}>
        <div className={styles.qualityNarrative}>
          <span className={styles.sectionKicker}>Trust & Quality</span>
          <h2>Public evidence follows explicit QA gates.</h2>
          <p>
            The Trust page presents workflow status, CodeQL, OpenSSF Scorecard,
            targeted reliability coverage, Sonar readiness, Codecov readiness and live HTTP
            header report links. The Policy Signals Board turns source evidence into an
            inspectable operational ranking. These checks describe build health,
            retrieval quality, source status, and public evidence readiness.
          </p>
        </div>
        <div className={styles.qualityReactor} aria-label="Trust and quality evidence">
          {[
            ['Quality Gate', 'GitHub Actions', 'CI'],
            ['CodeQL', 'Code scanning', 'Scan'],
            ['OpenSSF', 'Scorecard workflow', 'Supply chain'],
            ['Coverage', 'Vitest targeted reliability coverage', 'Test'],
            ['Sonar', 'Ready for token setup', 'Pending'],
            ['Headers', 'Live report links', 'External'],
          ].map(([label, value, badge], index) => (
            <div key={label} className={styles.qualityOrbit} style={{ '--i': index } as CSSProperties}>
              <span>{label}</span>
              <b>{value}</b>
              <i>{badge}</i>
            </div>
          ))}
          <div className={styles.reactorCore}>
            <strong>Trust</strong>
            <span>Evidence</span>
          </div>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <span className={styles.sectionKicker}>Public interface</span>
          <h2>A platform with visible methodology and admin review tools.</h2>
          <p>
            The public interface explains its methodology and exposes available
            analysis outputs with confidence boundaries. The admin interface adds
            tools to inspect and improve the dataset behind those outputs.
          </p>
        </div>
        <div className={styles.founder}>
          <Image src="/fabrizio-degni.png" alt="Fabrizio Degni" width={72} height={72} />
          <div>
            <strong>Fabrizio Degni</strong>
            <span>Creator, PolicyWatcher</span>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>PolicyWatcher {POLICYWATCHER_VERSION} {POLICYWATCHER_RELEASE_NAME}</span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/security">Security</Link>
          <Link href="/leaderboard">Signals</Link>
          <Link href="/press">Press</Link>
          <Link href="/">Platform</Link>
        </div>
      </footer>
    </main>
  );
}
