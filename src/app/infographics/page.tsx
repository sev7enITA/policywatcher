'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useMemo, type KeyboardEvent } from 'react';
import {
  GitFork,
  Radio,
  Sparkles,
  Lock,
} from 'lucide-react';
import EvidenceStatusRail from '@/components/EvidenceStatusRail';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import { POLICYWATCHER_BUILD_LABEL, POLICYWATCHER_VERSION } from '@/lib/release';
import styles from './infographics.module.css';

type WorkspaceIntent = 'citizen' | 'grc' | 'research' | 'builder';

interface ModuleState {
  id: string;
  label: string;
  citizen: boolean;
  grc: boolean;
  research: boolean;
  builder: boolean;
}

const dashboardModules: ModuleState[] = [
  { id: 'suspendedWarning', label: 'Safety Banner (Suspended Sources)', citizen: true, grc: true, research: true, builder: true },
  { id: 'marketPulse', label: 'Market Pulse (AI Briefings)', citizen: true, grc: false, research: true, builder: false },
  { id: 'companyCards', label: 'Company Cards Grid', citizen: true, grc: false, research: false, builder: false },
  { id: 'changeSummaries', label: 'Natural Language Summaries', citizen: true, grc: true, research: false, builder: false },
  { id: 'qaTelemetry', label: 'Dataset QA & Confidence Badges', citizen: false, grc: true, research: false, builder: false },
  { id: 'kpiMatrix', label: 'Evidence KPI Matrix', citizen: false, grc: true, research: false, builder: false },
  { id: 'shareableView', label: 'Canonical Shareable View State', citizen: true, grc: true, research: true, builder: true },
  { id: 'regionalDrilldown', label: 'Regional Context Drill-down', citizen: false, grc: true, research: true, builder: false },
  { id: 'benchmarkInspector', label: 'Benchmark KPI Inspector', citizen: false, grc: true, research: true, builder: false },
  { id: 'timeline', label: 'Chronological Policy Timeline', citizen: false, grc: false, research: true, builder: false },
  { id: 'leaderboard', label: 'Policy Signals Board', citizen: false, grc: false, research: true, builder: false },
  { id: 'apiLogs', label: 'Protected API Operations', citizen: false, grc: false, research: false, builder: true },
  { id: 'vpsDiagnostics', label: 'VPS companion diagnostics', citizen: false, grc: false, research: false, builder: true },
];

export default function InfographicsPage() {
  const [activeIntent, setActiveIntent] = useState<WorkspaceIntent>('grc');
  const [selectedNode, setSelectedNode] = useState<string>('dashboard');

  const activeNodeDetails = useMemo(() => {
    const nodes: Record<string, { title: string; category: string; desc: string; flow: string }> = {
      dashboard: {
        title: 'Evidence Console',
        category: 'Core Workspace',
        desc: 'Main public dashboard equipped with the dynamic workspace composer, filters, QA state, and monitored companies.',
        flow: 'Feeds policy changes into the Timeline and compares readiness on the Signals Board.',
      },
      showcase: {
        title: 'Product Showcase',
        category: 'Core Workspace',
        desc: 'An overview of product features, workflows, and administrative capabilities designed for quick onboarding.',
        flow: 'Links directly to the Dashboard and outlines trust indicators.',
      },
      timeline: {
        title: 'Policy Timeline',
        category: 'Evidence Views',
        desc: 'A chronological list of published changes derived from retrieved policy documents.',
        flow: 'Receives updates from the main scraper loop and formats historical diffs.',
      },
      leaderboard: {
        title: 'Policy Signals Board',
        category: 'Evidence Views',
        desc: 'A comparative index ranking policy-source coverage, scraper logs, and retrieval traceability.',
        flow: 'Aggregates QA telemetry into high-level indicators.',
      },
      trust: {
        title: 'Trust & Quality Panel',
        category: 'Assurance Surface',
        desc: 'Displays CodeQL status, OpenSSF cards, HTTP response checks, and browser renderer health.',
        flow: 'Supports product statements with transparent infrastructure logs.',
      },
      roadmap: {
        title: 'Community Roadmap',
        category: 'Community Surface',
        desc: 'Exposes upcoming features, adaptive lenses, API designs, and lets users submit GitHub feedback.',
        flow: 'Links features back to pre-configured workspaces.',
      },
      admin: {
        title: 'Admin Operations',
        category: 'Controlled Boundary',
        desc: 'Protected dashboard for running scans, updating configurations, and checking VPS companions.',
        flow: 'Uses authenticated session validation for protected operations.',
      },
    };
    return nodes[selectedNode] ?? nodes.dashboard;
  }, [selectedNode]);

  const selectNodeOnKey = (event: KeyboardEvent<SVGCircleElement>, node: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedNode(node);
    }
  };

  return (
    <div className={styles.page}>
      <PublicHeader current="infographics" />
      <EvidenceStatusRail
        label="Visual documentation"
        title="Product architecture"
        detail="These diagrams document workspace behavior and safety boundaries. Current persisted evidence is available on the Signals board."
        meta={`Guide build ${POLICYWATCHER_BUILD_LABEL}`}
        tone="guide"
      />
      <main className={styles.content}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>
          <Sparkles size={14} />
          Visual Guide & Infographics
        </span>
        <h1>Infographics</h1>
        <p>
          PolicyWatcher v{POLICYWATCHER_VERSION} diagrams cover adaptive workspaces, shareable views, evidence drill-downs, release impact and safety overrides.
        </p>
        <nav className={styles.contextLinks} aria-label="Related evidence views">
          <Link href="/timeline">
            <span>Operational evidence</span>
            Policy-change timeline
          </Link>
          <Link href="/feature-atlas">
            <span>Product intelligence</span>
            Feature KPI / KRI atlas
          </Link>
        </nav>
      </header>

      <div className={styles.infographicsGrid}>
        <section className={styles.erPosterCard} aria-labelledby="civic-editorial-workflow-title">
          <div className={styles.erPosterHeader}>
            <div>
              <span className={`${styles.eyebrow} ${styles.eyebrowIndigo}`}>
                <Radio size={14} />
                Infographic 09 · Editorial workflow · 18 August 2026
              </span>
              <h2 id="civic-editorial-workflow-title">Civic editorial workflow</h2>
              <p>
                A descriptive Day 0-Day 10 sequence for introducing the directory, explaining coverage, showing
                one country view, documenting the contribution path and presenting the evidence method.
              </p>
            </div>
            <div className={styles.erPosterActions}>
              <Link href="/en/associations#organizzazioni">Open the directory</Link>
              <a href="/infographics/policywatcher-civic-editorial-workflow-2026-08-18.png" download>
                Download PNG
              </a>
              <a href="/infographics/policywatcher-civic-editorial-workflow-2026-08-18.svg" download>
                Download SVG
              </a>
            </div>
          </div>
          <figure className={styles.erPosterFigure}>
            <Image
              src="/infographics/policywatcher-civic-editorial-workflow-2026-08-18.png"
              alt="English PolicyWatcher Civic editorial workflow showing five posts from Day 0 to Day 10, with a named asset, call to action and measurement point for each post"
              width={1200}
              height={1500}
              priority
            />
            <figcaption>
              Deterministic campaign workflow. Visits, source opens, copied views and user-initiated drafts are
              measured separately from impressions. Inclusion does not imply partnership or endorsement.
            </figcaption>
          </figure>
        </section>

        <section className={styles.erPosterCard} aria-labelledby="civic-world-map-title">
          <div className={styles.erPosterHeader}>
            <div>
              <span className={`${styles.eyebrow} ${styles.eyebrowTeal}`}>
                <GitFork size={14} />
                Infographic 08 · World coverage map · 18 August 2026
              </span>
              <h2 id="civic-world-map-title">Consumer association coverage</h2>
              <p>
                A proportional-symbol world map derived from the directory: 76 national listings across 24
                countries, with a Europe inset and the three global or regional networks reported separately.
              </p>
            </div>
            <div className={styles.erPosterActions}>
              <Link href="/en/associations#organizzazioni">Inspect the listings</Link>
              <a href="/infographics/policywatcher-civic-world-coverage-map-2026-08-18.png" download>
                Download PNG
              </a>
              <a href="/infographics/policywatcher-civic-world-coverage-map-2026-08-18.svg" download>
                Download SVG
              </a>
            </div>
          </div>
          <figure className={styles.erPosterFigure}>
            <Image
              src="/infographics/policywatcher-civic-world-coverage-map-2026-08-18.png"
              alt="English PolicyWatcher Civic world coverage map showing 76 national association listings across 24 countries, a detailed Europe inset, and three global or regional networks outside the country counts"
              width={1200}
              height={1500}
              priority
            />
            <figcaption>
              Country-level coverage view derived from the catalog reviewed on 7 August 2026. Marker positions
              are approximate country centroids, not office addresses; coverage is curated and not exhaustive.
            </figcaption>
          </figure>
        </section>

        <section className={styles.erPosterCard} aria-labelledby="civic-5w-title">
          <div className={styles.erPosterHeader}>
            <div>
              <span className={`${styles.eyebrow} ${styles.eyebrowTeal}`}>
                <GitFork size={14} />
                Infographic 07 · PolicyWatcher Civic 5W · 18 August 2026
              </span>
              <h2 id="civic-5w-title">Global civic workflow</h2>
              <p>
                The English launch visual explains the audience, scope, geographic model, research date and
                evidence-first purpose of the global directory, with direct paths to explore, submit and correct.
              </p>
            </div>
            <div className={styles.erPosterActions}>
              <Link href="/en/associations#organizzazioni">Open PolicyWatcher Civic</Link>
              <a href="/infographics/policywatcher-civic-5w-global-directory-2026-08-18-v3.png" download>
                Download 5W PNG
              </a>
            </div>
          </div>
          <figure className={styles.erPosterFigure}>
            <Image
              src="/infographics/policywatcher-civic-5w-global-directory-2026-08-18-v3.png"
              alt="English PolicyWatcher Civic 5W infographic with the official PolicyWatcher logo, explaining who the global directory serves, what it provides, where it operates, when its research was reviewed and why the evidence workflow exists"
              width={946}
              height={1663}
              priority
            />
            <figcaption>
              AI-generated editorial visualization grounded in the catalog snapshot reviewed on 7 August 2026.
              Inclusion records a verifiable public source; it does not imply partnership, endorsement or legal authority.
            </figcaption>
          </figure>
        </section>

        <section className={styles.erPosterCard} aria-labelledby="civic-technical-title">
          <div className={styles.erPosterHeader}>
            <div>
              <span className={`${styles.eyebrow} ${styles.eyebrowIndigo}`}>
                <GitFork size={14} />
                Infographic 06 · Technical coverage · 18 August 2026
              </span>
              <h2 id="civic-technical-title">Civic review controls</h2>
              <p>
                The technical companion shows global, regional and national coverage; the eight protection types;
                shareable filters; the evidence workflow; and the separate paths for submissions and corrections.
              </p>
            </div>
            <div className={styles.erPosterActions}>
              <Link href="/en/associations#segnala-associazione">Submit or correct a listing</Link>
              <a href="/infographics/policywatcher-civic-technical-coverage-2026-08-18-v3.png" download>
                Download technical PNG
              </a>
            </div>
          </div>
          <figure className={styles.erPosterFigure}>
            <Image
              src="/infographics/policywatcher-civic-technical-coverage-2026-08-18-v3.png"
              alt="English technical infographic with the official PolicyWatcher logo, showing 79 organizations across 24 countries, coverage layers, eight protection filters, evidence workflow and controlled submission and correction paths"
              width={897}
              height={1752}
            />
            <figcaption>
              Detailed implementation view. Watchlists and review states remain in the browser; email drafts and
              directory changes require explicit human action.
            </figcaption>
          </figure>
        </section>

        <section className={styles.erPosterCard} aria-labelledby="civic-associations-title">
          <div className={styles.erPosterHeader}>
            <div>
              <span className={`${styles.eyebrow} ${styles.eyebrowTeal}`}>
                <GitFork size={14} />
                Infographic 05 · Civic directory · 18 August 2026
              </span>
              <h2 id="civic-associations-title">Consumer association directory</h2>
              <p>
                The earlier Italian editorial poster presents the country-aware directory, eight protection areas,
                the evidence-to-digest workflow and the controlled path for suggesting another organization.
              </p>
            </div>
            <div className={styles.erPosterActions}>
              <Link href="/it/associazioni#organizzazioni">Open PolicyWatcher Civico</Link>
              <a href="/infographics/policywatcher-civico-associazioni-globali-2026-08-18.png" download>
                Download PNG
              </a>
            </div>
          </div>
          <figure className={styles.erPosterFigure}>
            <Image
              src="/infographics/policywatcher-civico-associazioni-globali-2026-08-18.png"
              alt="Italian PolicyWatcher Civico infographic showing 79 organizations in 24 countries, 41 digital specialists, eight protection areas and a five-step evidence workflow"
              width={972}
              height={1619}
            />
            <figcaption>
              AI-generated editorial visualization grounded in the catalog snapshot reviewed on 7 August 2026.
              Inclusion documents a public verification source; it does not imply partnership, endorsement or legal authority.
            </figcaption>
          </figure>
        </section>

        <section className={styles.erPosterCard} aria-labelledby="release-evidence-pulse-title">
          <div className={styles.erPosterHeader}>
            <div>
              <span className={`${styles.eyebrow} ${styles.eyebrowIndigo}`}>
                <Radio size={14} />
                Infographic 04 · Release evidence · 2-15 August 2026
              </span>
              <h2 id="release-evidence-pulse-title">Release evidence</h2>
              <p>
                A bilingual press-ready record of the last fourteen days: what shipped, the implementation impact, the observable metric and the residual limit attached to every claim.
              </p>
            </div>
            <div className={styles.erPosterActions}>
              <Link href="/pulse/two-week-release-impact">Open interactive Pulse</Link>
              <a href="/press-kit/policywatcher-release-evidence-pulse-en-2026-08-15.png" download>English PNG</a>
              <a href="/press-kit/policywatcher-release-evidence-pulse-it-2026-08-15.png" download>Italiano PNG</a>
            </div>
          </div>
          <figure className={styles.erPosterFigure}>
            <Image
              src="/press-kit/policywatcher-release-evidence-pulse-en-2026-08-15.webp"
              alt="Six PolicyWatcher release cards with dates, implementation impacts, metrics and limitations for the fourteen days from 2 to 15 August 2026"
              width={2400}
              height={3168}
              priority
            />
            <figcaption>
              Deterministic rendering of the public release evidence ledger. Implementation inventory, not measured adoption or compliance. The decorative background was generated with AI and is disclosed in the Press Kit metadata.
            </figcaption>
          </figure>
        </section>

        <section className={styles.erPosterCard} aria-labelledby="sitemap-er-title">
          <div className={styles.erPosterHeader}>
            <div>
              <span className={`${styles.eyebrow} ${styles.eyebrowTeal}`}>
                <GitFork size={14} />
                Infographic 00 · ER sitemap · August 2026
              </span>
              <h2 id="sitemap-er-title">Site map model</h2>
              <p>
                A source-backed map of 33 static sitemap entries, seven editorial domains and four dynamic entity families. Region, language and workspace orient the experience without changing evidence gates.
              </p>
            </div>
            <div className={styles.erPosterActions}>
              <Link href="/atlas">Open interactive Atlas</Link>
              <a href="/infographics/policywatcher-experience-map-er-sitemap-2026-08.png" download>
                Download PNG
              </a>
            </div>
          </div>
          <figure className={styles.erPosterFigure}>
            <Image
              src="/infographics/policywatcher-experience-map-er-sitemap-2026-08.webp"
              alt="PolicyWatcher entity relationship sitemap with a central global experience connected to Monitor, Evidence, Civic, Trust and Method, Build and Integrate, Communicate, and Understand domains"
              width={1536}
              height={1024}
              priority
            />
            <figcaption>
              Editorial poster generated from the ER taxonomy. Exact routes and relations remain documented in the machine-readable sitemap inventory.
            </figcaption>
          </figure>
        </section>

        {/* Infographic 1 */}
        <section className={styles.infographicCard}>
          <div className={styles.infoContent}>
            <span className={`${styles.eyebrow} ${styles.eyebrowTeal}`}>
              <Radio size={14} />
              Infographic 01 - Interactive
            </span>
            <h2>Adaptive Workspace Matrix</h2>
            <p>
              When a user selects a role, the workspace composer filters and reorders modules dynamically. Canonical links preserve committed public view state, while regional and KPI modules coordinate context with exact-value fallbacks. Select a lens tab to preview which modules activate:
            </p>

            <div className={styles.interactiveConsole}>
              <span className={styles.consoleLabel}>Choose Workspace Intent</span>
              <div className={styles.lensTabs} role="group" aria-label="Workspace intent">
                {(['citizen', 'grc', 'research', 'builder'] as WorkspaceIntent[]).map((intent) => (
                  <button
                    key={intent}
                    type="button"
                    aria-pressed={activeIntent === intent}
                    className={`${styles.lensTab} ${activeIntent === intent ? styles.lensTabActive : ''}`}
                    onClick={() => setActiveIntent(intent)}
                  >
                    {intent.toUpperCase()}
                  </button>
                ))}
              </div>

              <span className={styles.consoleLabel}>Active Modules List</span>
              <div className={styles.consoleList}>
                {dashboardModules.map((mod) => {
                  const isActive = mod[activeIntent];
                  return (
                    <div
                      key={mod.id}
                      className={`${styles.consoleItem} ${isActive ? styles.consoleItemActive : styles.consoleItemMuted}`}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: mod.id === 'suspendedWarning' ? '#dc2626' : isActive ? '#0f8f84' : '#cbd5e1',
                        }}
                      />
                      <span>{mod.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={styles.visualWrapper}>
            <svg className={styles.svgVisual} viewBox="0 0 480 340" aria-hidden="true">
              <rect width="480" height="340" fill="none" />
              {/* Grid backdrop */}
              <path d="M40 0v340M120 0v340M200 0v340M280 0v340M360 0v340M440 0v340M0 60h480M0 140h480M0 220h480M0 300h480" stroke="#dbe5f1" strokeWidth="1" />

              {/* Flow Lines */}
              <path d="M40 40h400v260H40Z" fill="none" stroke="#c7d2fe" strokeWidth="2" />
              <path d="M40 40h400v260H40Z" fill="none" stroke="url(#flowGradient)" strokeWidth="2" className={styles.animateFlow} />

              {/* Module representations in SVG */}
              {/* Suspended Warning (Always Solid) */}
              <g transform="translate(60 30)">
                <rect x="0" y="0" width="360" height="36" rx="8" fill="#fff1f2" stroke="#dc2626" strokeWidth="1.5" />
                <text x="180" y="22" fill="#b91c1c" fontSize="11" fontWeight="800" textAnchor="middle" letterSpacing="0.05em">SAFETY BANNER: SUSPENDED SOURCES (LOCKED)</text>
              </g>

              {/* Module A */}
              <g transform="translate(60 85)" style={{ opacity: dashboardModules[1][activeIntent] ? 1 : 0.15, transition: 'opacity 0.35s' }}>
                <rect x="0" y="0" width="170" height="70" rx="8" fill="#ffffff" stroke="#4f64c5" strokeWidth="1.5" />
                <text x="16" y="32" fill="#0f172a" fontSize="12" fontWeight="700">Market Pulse</text>
                <text x="16" y="50" fill="#526276" fontSize="10">AI Policy Briefings</text>
              </g>

              {/* Module B */}
              <g transform="translate(250 85)" style={{ opacity: dashboardModules[4][activeIntent] ? 1 : 0.15, transition: 'opacity 0.35s' }}>
                <rect x="0" y="0" width="170" height="70" rx="8" fill="#ffffff" stroke="#0f8f84" strokeWidth="1.5" />
                <text x="16" y="32" fill="#0f172a" fontSize="12" fontWeight="700">Dataset QA</text>
                <text x="16" y="50" fill="#526276" fontSize="10">Confidence Telemetry</text>
              </g>

              {/* Module C */}
              <g transform="translate(60 170)" style={{ opacity: dashboardModules[5][activeIntent] ? 1 : 0.15, transition: 'opacity 0.35s' }}>
                <rect x="0" y="0" width="170" height="70" rx="8" fill="#ffffff" stroke="#4f64c5" strokeWidth="1.5" />
                <text x="16" y="32" fill="#0f172a" fontSize="12" fontWeight="700">Evidence KPI</text>
                <text x="16" y="50" fill="#526276" fontSize="10">Source-backed Matrix</text>
              </g>

              {/* Module D */}
              <g transform="translate(250 170)" style={{ opacity: dashboardModules[8][activeIntent] ? 1 : 0.15, transition: 'opacity 0.35s' }}>
                <rect x="0" y="0" width="170" height="70" rx="8" fill="#ffffff" stroke="#0f8f84" strokeWidth="1.5" />
                <text x="16" y="32" fill="#0f172a" fontSize="12" fontWeight="700">Protected API Ops</text>
                <text x="16" y="50" fill="#526276" fontSize="10">Admin routes & logs</text>
              </g>

              {/* Base Info */}
              <g transform="translate(60 255)">
                <rect x="0" y="0" width="360" height="40" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                <text x="180" y="24" fill="#526276" fontSize="10" textAnchor="middle">
                  Workspace Profile State: <tspan fill="#4355a6" fontWeight="700">{activeIntent.toUpperCase()}</tspan>
                </text>
              </g>

              <defs>
                <linearGradient id="flowGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#4f64c5" />
                  <stop offset="50%" stopColor="#0f8f84" />
                  <stop offset="100%" stopColor="#4f64c5" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className={styles.mobileDiagramLegend} aria-label="Adaptive workspace diagram key">
            <strong>Mobile diagram key</strong>
            <dl>
              <div><dt>Safety banner</dt><dd>Required by each registered workspace intent.</dd></div>
              <div><dt>Solid module</dt><dd>Active in the selected {activeIntent.toUpperCase()} workspace.</dd></div>
              <div><dt>Faded module</dt><dd>Available elsewhere, deprioritized for this intent.</dd></div>
              <div><dt>Share and drill-down</dt><dd>Canonical view state, atomic regional context and exact KPI inspection remain evidence-bound.</dd></div>
            </dl>
          </div>
        </section>

        {/* Infographic 2 */}
        <section className={styles.infographicCard}>
          <div className={styles.infoContent}>
            <span className={`${styles.eyebrow} ${styles.eyebrowIndigo}`}>
              <GitFork size={14} />
              Infographic 02 - Interactive Sitemap
            </span>
            <h2>Sitemap & Section Atlas</h2>
            <p>
              The new build introduces structured categories. Click on any node in the relationship graph below to explore its description and role:
            </p>

            <div className={styles.interactiveConsole}>
              <span className={styles.consoleLabel}>Selected Atlas Node Details</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#0f172a', fontSize: '1rem' }}>{activeNodeDetails.title}</strong>
                  <span style={{ fontSize: '0.72rem', background: '#eef2ff', color: '#4355a6', padding: '3px 8px', borderRadius: '5px', fontWeight: 800 }}>
                    {activeNodeDetails.category}
                  </span>
                </div>
                <p style={{ margin: '4px 0 8px', fontSize: '0.85rem', color: '#526276', lineHeight: 1.4 }}>
                  {activeNodeDetails.desc}
                </p>
                <small style={{ color: '#0f766e', fontWeight: 600 }}>
                  → {activeNodeDetails.flow}
                </small>
              </div>
            </div>
          </div>

          <div className={styles.visualWrapper}>
            <svg className={styles.svgVisual} viewBox="0 0 480 340" role="group" aria-label="Interactive PolicyWatcher sitemap">
              <rect width="480" height="340" fill="none" />
              <path d="M40 0v340M120 0v340M200 0v340M280 0v340M360 0v340M440 0v340M0 60h480M0 140h480M0 220h480M0 300h480" stroke="#dbe5f1" strokeWidth="1" />

              {/* Edge Connections */}
              <g stroke="#c7d2fe" strokeWidth="2">
                <line x1="240" y1="170" x2="100" y2="90" />
                <line x1="240" y1="170" x2="380" y2="90" />
                <line x1="240" y1="170" x2="100" y2="250" />
                <line x1="240" y1="170" x2="380" y2="250" />
                <line x1="100" y1="90" x2="380" y2="90" />
                <line x1="100" y1="250" x2="380" y2="250" />
              </g>

              {/* Flow Packets */}
              <g stroke="#4f64c5" strokeWidth="2" strokeDasharray="5 10" className={styles.animateFlow}>
                <line x1="240" y1="170" x2="100" y2="90" />
                <line x1="240" y1="170" x2="380" y2="90" />
                <line x1="240" y1="170" x2="100" y2="250" />
                <line x1="240" y1="170" x2="380" y2="250" />
              </g>

              {/* Graph Nodes */}
              {/* Dashboard */}
              <circle
                cx="240"
                cy="170"
                r="20"
                className={`${styles.svgNode} ${selectedNode === 'dashboard' ? styles.svgNodeActive : ''}`}
                onClick={() => setSelectedNode('dashboard')}
                onKeyDown={(event) => selectNodeOnKey(event, 'dashboard')}
                tabIndex={0}
                role="button"
                aria-label="Select Evidence Console"
              />
              <text x="240" y="174" fill="#0f172a" fontSize="9" fontWeight="800" textAnchor="middle" pointerEvents="none">DASH</text>

              {/* Showcase */}
              <circle
                cx="100"
                cy="90"
                r="18"
                className={`${styles.svgNode} ${selectedNode === 'showcase' ? styles.svgNodeActive : ''}`}
                onClick={() => setSelectedNode('showcase')}
                onKeyDown={(event) => selectNodeOnKey(event, 'showcase')}
                tabIndex={0}
                role="button"
                aria-label="Select Product Showcase"
              />
              <text x="100" y="94" fill="#0f172a" fontSize="8" fontWeight="800" textAnchor="middle" pointerEvents="none">SHOW</text>

              {/* Timeline */}
              <circle
                cx="380"
                cy="90"
                r="18"
                className={`${styles.svgNode} ${selectedNode === 'timeline' ? styles.svgNodeActive : ''}`}
                onClick={() => setSelectedNode('timeline')}
                onKeyDown={(event) => selectNodeOnKey(event, 'timeline')}
                tabIndex={0}
                role="button"
                aria-label="Select Policy Timeline"
              />
              <text x="380" y="94" fill="#0f172a" fontSize="8" fontWeight="800" textAnchor="middle" pointerEvents="none">TIME</text>

              {/* Leaderboard */}
              <circle
                cx="100"
                cy="250"
                r="18"
                className={`${styles.svgNode} ${selectedNode === 'leaderboard' ? styles.svgNodeActive : ''}`}
                onClick={() => setSelectedNode('leaderboard')}
                onKeyDown={(event) => selectNodeOnKey(event, 'leaderboard')}
                tabIndex={0}
                role="button"
                aria-label="Select Policy Signals Board"
              />
              <text x="100" y="254" fill="#0f172a" fontSize="8" fontWeight="800" textAnchor="middle" pointerEvents="none">LEAD</text>

              {/* Trust */}
              <circle
                cx="380"
                cy="250"
                r="18"
                className={`${styles.svgNode} ${selectedNode === 'trust' ? styles.svgNodeActive : ''}`}
                onClick={() => setSelectedNode('trust')}
                onKeyDown={(event) => selectNodeOnKey(event, 'trust')}
                tabIndex={0}
                role="button"
                aria-label="Select Trust and Quality Panel"
              />
              <text x="380" y="254" fill="#0f172a" fontSize="8" fontWeight="800" textAnchor="middle" pointerEvents="none">TRST</text>

              {/* Roadmap */}
              <circle
                cx="240"
                cy="50"
                r="18"
                className={`${styles.svgNode} ${selectedNode === 'roadmap' ? styles.svgNodeActive : ''}`}
                onClick={() => setSelectedNode('roadmap')}
                onKeyDown={(event) => selectNodeOnKey(event, 'roadmap')}
                tabIndex={0}
                role="button"
                aria-label="Select Community Roadmap"
              />
              <text x="240" y="54" fill="#0f172a" fontSize="8" fontWeight="800" textAnchor="middle" pointerEvents="none">MAP</text>

              {/* Admin */}
              <circle
                cx="240"
                cy="290"
                r="18"
                className={`${styles.svgNode} ${selectedNode === 'admin' ? styles.svgNodeActive : ''}`}
                onClick={() => setSelectedNode('admin')}
                onKeyDown={(event) => selectNodeOnKey(event, 'admin')}
                tabIndex={0}
                role="button"
                aria-label="Select Admin Operations"
              />
              <text x="240" y="294" fill="#0f172a" fontSize="8" fontWeight="800" textAnchor="middle" pointerEvents="none">ADM</text>
            </svg>
          </div>
        </section>

        {/* Infographic 3 */}
        <section className={styles.infographicCard}>
          <div className={styles.infoContent}>
            <span className={`${styles.eyebrow} ${styles.eyebrowDanger}`}>
              <Lock size={14} />
              Infographic 03 - Safety Invariant
            </span>
            <h2>Safety Invariant & Filter Pipeline</h2>
            <p>
              When initializing parameters, PolicyWatcher validates queries against a strict schema. Regardless of the active view or lens details, any detected data warnings are forced to render through a locked safety bypass.
            </p>
            <div className={styles.interactiveConsole}>
              <span className={styles.consoleLabel}>Control pipeline logic</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', color: '#526276' }}>
                <div>1. <strong>URL Param Parser:</strong> Filters values via enum allowlists.</div>
                <div>2. <strong>Profile Mapper:</strong> Activates visible cards and widgets.</div>
                <div>3. <strong>Bypass Rule:</strong> Forces suspended source warning to load.</div>
                <div style={{ color: '#ef4444', fontWeight: 800, marginTop: 4 }}>
                  → Safety rule active: workspace filtering cannot remove source warnings.
                </div>
              </div>
            </div>
          </div>

          <div className={styles.visualWrapper}>
            <svg className={styles.svgVisual} viewBox="0 0 480 340" aria-hidden="true">
              <rect width="480" height="340" fill="none" />
              <path d="M40 0v340M120 0v340M200 0v340M280 0v340M360 0v340M440 0v340M0 60h480M0 140h480M0 220h480M0 300h480" stroke="#dbe5f1" strokeWidth="1" />

              {/* Data Ingestion packet path */}
              <path d="M40 170h120" stroke="#4f64c5" strokeWidth="4" />
              {/* Dynamic flow */}
              <path d="M40 170h120" stroke="#0f8f84" strokeWidth="4" strokeDasharray="6 8" className={styles.animateFlow} />

              {/* Node 1: Parser */}
              <g transform="translate(130 135)">
                <rect x="0" y="0" width="70" height="70" rx="8" fill="#ffffff" stroke="#4f64c5" strokeWidth="2" />
                <text x="35" y="34" fill="#0f172a" fontSize="10" fontWeight="800" textAnchor="middle">URL Query</text>
                <text x="35" y="48" fill="#526276" fontSize="8" textAnchor="middle">Sanitize</text>
              </g>

              {/* Output path splitting */}
              <path d="M200 170c30 0, 40 -60, 90 -60h70" fill="none" stroke="#cbd5e1" strokeWidth="3" />
              <path d="M200 170c30 0, 40 60, 90 60h70" fill="none" stroke="rgba(239, 68, 68, 0.3)" strokeWidth="3" />
              <path d="M200 170c30 0, 40 60, 90 60h70" fill="none" stroke="#ef4444" strokeWidth="3" className={styles.safetyFlow} />

              {/* Standard modules card */}
              <g transform="translate(320 85)">
                <rect x="0" y="0" width="120" height="50" rx="6" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
                <text x="60" y="24" fill="#334155" fontSize="10" fontWeight="700" textAnchor="middle">Dashboard</text>
                <text x="60" y="38" fill="#64748b" fontSize="8" textAnchor="middle">Dynamic modules</text>
              </g>

              {/* Locked safety panel */}
              <g transform="translate(320 205)" className={styles.animateFloat}>
                <rect x="0" y="0" width="120" height="60" rx="6" fill="#fff1f2" stroke="#dc2626" strokeWidth="2" className={styles.safetyHighlight} />
                <text x="60" y="24" fill="#b91c1c" fontSize="10" fontWeight="900" textAnchor="middle">SAFETY BYPASS</text>
                <text x="60" y="38" fill="#0f172a" fontSize="8" fontWeight="800" textAnchor="middle">Required Module</text>
                <text x="60" y="48" fill="#64748b" fontSize="7" textAnchor="middle">Warnings locked</text>
              </g>

              {/* Safety Shield Indicator */}
              <g transform="translate(252 216)">
                <circle cx="12" cy="12" r="14" fill="#fff1f2" stroke="#dc2626" strokeWidth="2" />
                <path d="M8 12l3 3 6-6" stroke="#ef4444" strokeWidth="2" fill="none" strokeLinecap="round" />
              </g>

              <text x="240" y="316" fill="#ef4444" fontSize="10" fontWeight="800" textAnchor="middle">SAFETY LOCK OVERRIDE INVARIANT</text>
            </svg>
          </div>
          <div className={styles.mobileDiagramLegend} aria-label="Safety pipeline diagram key">
            <strong>Mobile diagram key</strong>
            <dl>
              <div><dt>1 · Parse</dt><dd>Allowlisted URL parameters enter the workspace mapper.</dd></div>
              <div><dt>2 · Compose</dt><dd>Ordinary dashboard modules follow the selected profile.</dd></div>
              <div><dt>3 · Override</dt><dd>Source warnings bypass workspace filtering.</dd></div>
            </dl>
          </div>
        </section>
      </div>
      </main>
      <Footer lang="en" />
    </div>
  );
}
