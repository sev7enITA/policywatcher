'use client';

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
        label="Explanatory visual guide"
        title="Product architecture, not live production data"
        detail="These interactive diagrams explain workspace behavior and safety boundaries. For current persisted evidence, use the Signals board."
        meta={`Guide build ${POLICYWATCHER_BUILD_LABEL}`}
        tone="guide"
      />
      <main className={styles.content}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>
          <Sparkles size={14} />
          Visual Guide & Infographics
        </span>
        <h1>Understanding the Adaptive Workspace</h1>
        <p>
          Discover how PolicyWatcher v{POLICYWATCHER_VERSION} connects adaptive workspaces, canonical shareable views, coordinated evidence drill-downs, release impact and safety overrides.
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
