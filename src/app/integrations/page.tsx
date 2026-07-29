import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bot,
  Braces,
  Cable,
  Check,
  CircleDot,
  Clock3,
  Code2,
  FileJson,
  Fingerprint,
  KeyRound,
  LayoutPanelTop,
  LockKeyhole,
  Network,
  Puzzle,
  Radio,
  ServerCog,
  ShieldCheck,
  ShoppingBag,
  Workflow,
  FolderKanban,
} from 'lucide-react';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import styles from './integrations.module.css';

export const metadata: Metadata = {
  title: 'Enterprise Integrations | PolicyWatcher',
  description:
    'PolicyWatcher integration architecture: public and Entra-authenticated APIs, Power Platform, Microsoft 365, Copilot, MCP, embeds, feeds, and future Marketplace distribution.',
};

const decisions = [
  { job: 'Public read and discovery', path: 'Public API v1', state: 'Available' },
  { job: 'Portable multi-change evidence', path: 'Evidence Collections', state: 'Available' },
  { job: 'Tenant-authenticated system access', path: 'Enterprise API v2', state: 'Pilot ready' },
  { job: 'Workflow automation', path: 'Power Platform connector', state: 'Pilot ready' },
  { job: 'In-workflow collaboration', path: 'Teams cards and tab', state: 'Planned' },
  { job: 'Conversational evidence', path: 'Copilot agent and MCP', state: 'Planned' },
  { job: 'Procurement and billing', path: 'Microsoft Marketplace', state: 'Commercial later' },
];

const capabilityLanes = [
  {
    id: 'available',
    label: 'Available',
    note: 'Public, bounded surfaces in the current product.',
    icon: BadgeCheck,
    cards: [
      {
        title: 'Public API v1',
        audience: 'Developers, researchers, public-interest tools',
        role: 'Anonymous discovery of the integration manifest, curated Observatory registry and portable evidence bundles.',
        boundary: 'Read-only public metadata, publication-aware gates, shared IP rate policy.',
        artifact: '/api/v1/manifest  |  /api/v1/observatory  |  /api/v1/evidence-collections',
        href: '/developers',
        link: 'Developer directory',
      },
      {
        title: 'Public evidence surfaces',
        audience: 'Browsers, newsroom tools, downstream readers',
        role: 'Human-readable evidence views plus JSON and RSS release feeds.',
        boundary: 'Only already-public records and release metadata. No private retrieval state.',
        artifact: '/change/{id}  |  /press-kit/feed.json',
        href: '/press-kit/releases',
        link: 'Release feeds',
      },
      {
        title: 'Shareable evidence collections',
        audience: 'Researchers, editors, governance reviewers, developers',
        role: 'Selects up to 12 exact public changes and exports deterministic JSON, Markdown or CSV bundles.',
        boundary: 'Only canonical public change IDs leave the browser. Local title and review states are excluded.',
        artifact: '/collections  |  /api/v1/evidence-collections',
        href: '/collections',
        link: 'Open collections',
      },
      {
        title: 'Browser extension',
        audience: 'Reviewers working from a provider policy page',
        role: 'Moves a page-level review into the existing PolicyWatcher evidence workflow.',
        boundary: 'The extension does not turn third-party page content into an enterprise API response.',
        artifact: '/browser-extension',
        href: '/browser-extension',
        link: 'Browser extension',
      },
      {
        title: 'Embeddable change card',
        audience: 'Publishers and evidence-aware websites',
        role: 'Frames one public change card through a purpose-built embed route.',
        boundary: 'The main portal stays frame-protected. Only the dedicated card route is embeddable.',
        artifact: '/embed/change/{id}',
      },
    ],
  },
  {
    id: 'pilot',
    label: 'Pilot ready',
    note: 'Implemented in source; tenant activation still requires configuration.',
    icon: Fingerprint,
    cards: [
      {
        title: 'Enterprise API v2',
        audience: 'Enterprise applications, IT and identity administrators',
        role: 'Tenant-bound access to companies, changes, continuity, and governance signals.',
        boundary: 'Verified Entra tenant, delegated scope or app role, private no-store responses.',
        artifact: '/api/v2/openapi.json',
        href: '/api/v2/openapi.json',
        link: 'Inspect OpenAPI',
        external: true,
      },
      {
        title: 'Azure API Management edge',
        audience: 'Platform engineering and API operations',
        role: 'Gateway policy for token validation, request correlation, and controlled origin access.',
        boundary: 'APIM does not replace origin authorization. The origin verifies the Entra token again.',
        artifact: 'docs/azure/apim-policy.xml',
      },
      {
        title: 'Power Platform connector',
        audience: 'Power Automate, Power Apps, Logic Apps, Copilot Studio',
        role: 'Six read actions over the same v2 evidence contract, ready for a test tenant pilot.',
        boundary: 'Two Entra applications and environment configuration are required before import.',
        artifact: 'integrations/power-platform/policywatcher-v2',
      },
    ],
  },
  {
    id: 'planned',
    label: 'Planned',
    note: 'Architected next paths; not delivered or enabled today.',
    icon: Clock3,
    cards: [
      {
        title: 'Signed event delivery',
        audience: 'Automation and security operations teams',
        role: 'Outbound change, suspension, and recovery events with retries and auditability.',
        boundary: 'Generic signed webhooks come before vendor-specific event integrations.',
        artifact: 'policy.change.published  |  source.suspended',
      },
      {
        title: 'Teams and Microsoft 365',
        audience: 'Legal, GRC, procurement, and business owners',
        role: 'Dedicated SSO tab, Adaptive Cards, and evidence deep links inside collaboration flows.',
        boundary: 'Requires a purpose-built route. The whole portal is not iframe-ready.',
        artifact: 'Dedicated M365 surface, not portal HTML fetching',
      },
      {
        title: 'Copilot declarative agent',
        audience: 'Licensed Microsoft 365 Copilot users',
        role: 'Conversational access to cited evidence through an API plugin backed by v2.',
        boundary: 'Read-only first, with evidence links and explicit non-legal-advice limits.',
        artifact: 'Declarative agent  +  OpenAPI action',
      },
      {
        title: 'Federated MCP connector',
        audience: 'Copilot administrators and knowledge architects',
        role: 'Real-time search and fetch from PolicyWatcher without copying records into an index.',
        boundary: 'Authenticated read tools, tenant controls, and source-of-truth links are required.',
        artifact: 'search  |  fetch  |  query tools',
      },
      {
        title: 'Synchronized Copilot connector',
        audience: 'Organizations requiring Microsoft 365 indexed discovery',
        role: 'Optional external content indexing for tenant search and Copilot grounding.',
        boundary: 'Needs ACLs, delete propagation, retention review, and stale-record controls.',
        artifact: 'Optional path after governance review',
      },
    ],
  },
  {
    id: 'commercial',
    label: 'Commercial later',
    note: 'Distribution and lifecycle work after the enterprise foundation.',
    icon: ShoppingBag,
    cards: [
      {
        title: 'Microsoft Marketplace SaaS',
        audience: 'Enterprise procurement and cloud marketplace buyers',
        role: 'Discovery, commercial plans, purchasing, and access to the PolicyWatcher service.',
        boundary: 'A Marketplace offer distributes the SaaS. It does not embed the portal as the product.',
        artifact: 'Listing first  |  transactable offer later',
      },
      {
        title: 'Provisioning and entitlements',
        audience: 'Tenant owners, billing, and customer success',
        role: 'Subscription activation, plan mapping, lifecycle events, and tenant entitlement checks.',
        boundary: 'Requires a production tenant model, support process, audit history, and lifecycle webhooks.',
        artifact: 'Fulfillment API  +  subscription lifecycle',
      },
    ],
  },
] as const;

const pilotSteps = [
  ['Register the protected API', 'Create the PolicyWatcher Enterprise API app, expose policywatcher.read, and define PolicyWatcher.Read.All.'],
  ['Register the connector client', 'Create a separate Power Platform connector app and grant the delegated API permission.'],
  ['Allowlist the test tenant', 'Configure the pilot tenant ID and API audiences on the PolicyWatcher origin.'],
  ['Choose the API front door', 'Use the public HTTPS origin for a controlled smoke test, or the preferred APIM URL.'],
  ['Identify the Power Platform environment', 'Use the test Environment ID to keep the connector and flows isolated.'],
  ['Import and connect', 'Generate the source-controlled connector package, import it, and complete interactive consent.'],
  ['Prove rejection paths', 'Test wrong tenant, wrong audience, missing scope or role, and direct-origin rejection once APIM is enforced.'],
] as const;

function Status({ kind, children }: { kind: string; children: React.ReactNode }) {
  return <span className={`${styles.status} ${styles[`status_${kind}`]}`}>{children}</span>;
}

export default function IntegrationsPage() {
  return (
    <>
      <PublicHeader current="integrations" />
      <main className={styles.page}>
        <section className={styles.hero}>
          <nav className={styles.topbar} aria-label="Integration page navigation">
            <Link href="/" className={styles.backLink}>
              <ArrowLeft size={16} aria-hidden="true" />
              Evidence Console
            </Link>
            <div className={styles.topbarLinks}>
              <Link href="/developers">Developers</Link>
              <Link href="/roadmap">Roadmap</Link>
              <Link href="/trust">Trust QA</Link>
            </div>
          </nav>

          <div className={styles.heroDocument}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>
                <Network size={16} aria-hidden="true" />
                Enterprise integration surface
              </span>
              <h1>One evidence contract. Many enterprise entry points.</h1>
              <p>
                PolicyWatcher is API-first. Connectors, Microsoft 365 experiences, agents, and commercial distribution sit on top of the same publication gate and data boundary. Integrations consume evidence records, never scraped portal HTML.
              </p>
              <div className={styles.heroActions}>
                <a href="#topology" className={styles.primaryAction}>
                  Explore integration map
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
                <a href="/api/v2/openapi.json" className={styles.secondaryAction} target="_blank" rel="noreferrer">
                  Inspect OpenAPI v2
                  <FileJson size={16} aria-hidden="true" />
                </a>
              </div>
            </div>

            <aside className={styles.summaryPanel} aria-label="Integration contract summary">
              <div><span>01</span><strong>v1 public</strong><small>Anonymous, read-only</small></div>
              <div><span>02</span><strong>v2 Entra</strong><small>Tenant-bound, read-only</small></div>
              <div><span>03</span><strong>Power Platform pilot</strong><small>Source package ready</small></div>
              <div><span>04</span><strong>Zero raw policy text</strong><small>Across API responses</small></div>
            </aside>
          </div>
        </section>

        <section id="topology" className={styles.section} aria-labelledby="topology-title">
          <header className={styles.sectionHeader}>
            <span>Integration topology</span>
            <h2 id="topology-title">Every path crosses the evidence boundary.</h2>
            <p>The central contract is the control point. Status labels describe delivery state in words, not color alone.</p>
          </header>

          <div className={styles.legend} aria-label="Readiness legend">
            <Status kind="available">Available</Status>
            <Status kind="pilot">Pilot ready</Status>
            <Status kind="planned">Planned</Status>
            <Status kind="commercial">Commercial later</Status>
          </div>

          <div className={styles.topology} aria-label="PolicyWatcher enterprise integration architecture">
            <div className={styles.branchColumn}>
              <article className={`${styles.topologyNode} ${styles.nodeAvailable}`}>
                <div className={styles.nodeHeading}><Braces size={18} /><Status kind="available">Available</Status></div>
                <h3>Public API v1</h3>
                <p>Public read and discovery.</p>
                <code>/api/v1</code>
              </article>
              <article className={`${styles.topologyNode} ${styles.nodePilot}`}>
                <div className={styles.nodeHeading}><ServerCog size={18} /><Status kind="pilot">Pilot ready</Status></div>
                <h3>Enterprise API + APIM</h3>
                <p>Tenant-authenticated system access.</p>
                <code>/api/v2</code>
              </article>
              <article className={`${styles.topologyNode} ${styles.nodePilot}`}>
                <div className={styles.nodeHeading}><Workflow size={18} /><Status kind="pilot">Pilot ready</Status></div>
                <h3>Power Platform</h3>
                <p>Composable workflow automation.</p>
                <code>6 read actions</code>
              </article>
            </div>

            <div className={styles.spine}>
              <div className={styles.spineCap}><CircleDot size={17} /> PolicyWatcher core</div>
              <div className={styles.spineStage}>
                <ShieldCheck size={23} aria-hidden="true" />
                <span>Publication Gate</span>
                <small>Only reviewed, public evidence passes</small>
              </div>
              <div className={styles.spineFlow} aria-hidden="true"><span /><span /><span /></div>
              <div className={styles.spineStage}>
                <KeyRound size={23} aria-hidden="true" />
                <span>Tenant Boundary</span>
                <small>Verified Entra identity for v2</small>
              </div>
              <div className={styles.spineContract}>
                <Cable size={24} aria-hidden="true" />
                <strong>Evidence contract</strong>
                <code>OpenAPI 3.0.3</code>
              </div>
            </div>

            <div className={styles.branchColumn}>
              <article className={`${styles.topologyNode} ${styles.nodePlanned}`}>
                <div className={styles.nodeHeading}><LayoutPanelTop size={18} /><Status kind="planned">Planned</Status></div>
                <h3>Teams and M365</h3>
                <p>Dedicated collaboration experience.</p>
                <code>SSO tab + cards</code>
              </article>
              <article className={`${styles.topologyNode} ${styles.nodePlanned}`}>
                <div className={styles.nodeHeading}><Bot size={18} /><Status kind="planned">Planned</Status></div>
                <h3>Copilot and MCP</h3>
                <p>Conversational, source-linked evidence.</p>
                <code>agent + federated tools</code>
              </article>
              <article className={`${styles.topologyNode} ${styles.nodeCommercial}`}>
                <div className={styles.nodeHeading}><ShoppingBag size={18} /><Status kind="commercial">Commercial later</Status></div>
                <h3>Marketplace</h3>
                <p>Procurement, plans, and lifecycle.</p>
                <code>SaaS offer</code>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.decisionSection} aria-labelledby="decision-title">
          <header>
            <span>Choose by job</span>
            <h2 id="decision-title">Start with the outcome, then select the surface.</h2>
          </header>
          <dl className={styles.decisionStrip}>
            {decisions.map((item, index) => (
              <div key={item.job}>
                <dt><span>{String(index + 1).padStart(2, '0')}</span>{item.job}</dt>
                <dd>{item.path}<small>{item.state}</small></dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={styles.section} aria-labelledby="catalog-title">
          <header className={styles.sectionHeader}>
            <span>Capability catalog</span>
            <h2 id="catalog-title">Delivered surfaces stay separate from future architecture.</h2>
            <p>Each entry names its audience, role, boundary, and concrete route or artifact.</p>
          </header>

          <div className={styles.catalog}>
            {capabilityLanes.map((lane) => {
              const LaneIcon = lane.icon;
              return (
                <section key={lane.id} className={`${styles.lane} ${styles[`lane_${lane.id}`]}`} aria-labelledby={`lane-${lane.id}`}>
                  <header className={styles.laneHeader}>
                    <LaneIcon size={21} aria-hidden="true" />
                    <div>
                      <h3 id={`lane-${lane.id}`}>{lane.label}</h3>
                      <p>{lane.note}</p>
                    </div>
                    <span>{String(lane.cards.length).padStart(2, '0')}</span>
                  </header>
                  <div className={styles.laneEntries}>
                    {lane.cards.map((card) => (
                      <article key={card.title} className={styles.capability}>
                        <div className={styles.capabilityTitle}>
                          <h4>{card.title}</h4>
                          {'href' in card && card.href ? (
                            <Link href={card.href} target={'external' in card && card.external ? '_blank' : undefined} rel={'external' in card && card.external ? 'noreferrer' : undefined}>
                              {card.link}<ArrowRight size={14} aria-hidden="true" />
                            </Link>
                          ) : null}
                        </div>
                        <dl>
                          <div><dt>Audience</dt><dd>{card.audience}</dd></div>
                          <div><dt>Role</dt><dd>{card.role}</dd></div>
                          <div><dt>Boundary</dt><dd>{card.boundary}</dd></div>
                        </dl>
                        <code>{card.artifact}</code>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="comparison-title">
          <header className={styles.sectionHeader}>
            <span>Contract choice</span>
            <h2 id="comparison-title">Public v1 or tenant-bound v2?</h2>
            <p>v1 remains the public directory. v2 is the foundation for enterprise systems and Microsoft integrations.</p>
          </header>
          <div className={styles.comparisonRegion} role="region" aria-label="Comparison of PolicyWatcher API v1 and v2" tabIndex={0}>
            <table className={styles.comparisonTable}>
              <thead><tr><th scope="col">Dimension</th><th scope="col">Public API v1</th><th scope="col">Enterprise API v2</th></tr></thead>
              <tbody>
                <tr><th scope="row">Access</th><td data-label="v1">Public internet</td><td data-label="v2">Allowlisted Entra tenant</td></tr>
                <tr><th scope="row">Audience</th><td data-label="v1">Public developers and researchers</td><td data-label="v2">Enterprise apps, users, and automation</td></tr>
                <tr><th scope="row">Use case</th><td data-label="v1">Discovery and curated registry reads</td><td data-label="v2">Evidence, continuity, and governance workflows</td></tr>
                <tr><th scope="row">Authentication</th><td data-label="v1">None, anonymous read-only</td><td data-label="v2"><code>policywatcher.read</code> or <code>PolicyWatcher.Read.All</code></td></tr>
                <tr><th scope="row">Data boundary</th><td data-label="v1">Public metadata and curated references</td><td data-label="v2">Evidence-gated records with verified tenant context</td></tr>
                <tr><th scope="row">Contract</th><td data-label="v1"><code>/api/v1/manifest</code></td><td data-label="v2"><code>/api/v2/openapi.json</code></td></tr>
                <tr><th scope="row">Readiness</th><td data-label="v1"><Status kind="available">Available</Status></td><td data-label="v2"><Status kind="pilot">Pilot ready</Status></td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.pilotSection} aria-labelledby="pilot-title">
          <div className={styles.pilotIntro}>
            <span>Microsoft tenant pilot</span>
            <h2 id="pilot-title">Seven checks from registration to rejection testing.</h2>
            <p>The pilot uses identifiers and controlled configuration. A client secret belongs in a protected secret store and must never be pasted into a document, issue, chat, or generated artifact.</p>
            <Link href="/api/v2/openapi.json" target="_blank" rel="noreferrer">
              Open machine-readable contract
              <FileJson size={16} aria-hidden="true" />
            </Link>
          </div>
          <ol className={styles.pilotList}>
            {pilotSteps.map(([title, body], index) => (
              <li key={title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div><strong>{title}</strong><p>{body}</p></div>
                <Check size={17} aria-hidden="true" />
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.securityBand} aria-labelledby="security-title">
          <div className={styles.securityLead}>
            <LockKeyhole size={26} aria-hidden="true" />
            <span>Security and data boundary</span>
            <h2 id="security-title">Integrations receive bounded evidence, not the machinery behind it.</h2>
            <p>API consumers do not fetch PolicyWatcher portal HTML. They receive structured records that have already crossed the same publication controls used by public evidence views.</p>
          </div>
          <div className={styles.boundaryFlow} aria-label="Integration data boundary flow">
            <div><Radio size={18} /><span>Provider source</span></div>
            <ArrowRight size={18} aria-hidden="true" />
            <div><ShieldCheck size={18} /><span>Publication Gate</span></div>
            <ArrowRight size={18} aria-hidden="true" />
            <div><Braces size={18} /><span>Bounded record</span></div>
          </div>
          <div className={styles.exclusionList}>
            <strong>Never returned to API consumers</strong>
            <ul>
              <li>Raw policy text</li>
              <li>Raw snapshot text or non-public fingerprints</li>
              <li>Private retrieval diagnostics</li>
              <li>Credentials</li>
              <li>Administrator logs</li>
            </ul>
          </div>
        </section>

        <section className={styles.finalCta} aria-labelledby="next-title">
          <div>
            <span>Next entry point</span>
            <h2 id="next-title">Use the contract that matches the work.</h2>
            <p>Inspect the public developer surface, validate v2 against a test tenant, or review what becomes available in the next delivery wave.</p>
          </div>
          <div className={styles.finalLinks}>
            <Link href="/developers"><Code2 size={17} /> Developer directory</Link>
            <Link href="/collections"><FolderKanban size={17} /> Evidence collections</Link>
            <Link href="/api/v2/openapi.json" target="_blank" rel="noreferrer"><FileJson size={17} /> OpenAPI v2</Link>
            <Link href="/roadmap"><Puzzle size={17} /> Integration roadmap</Link>
            <Link href="/browser-extension"><LayoutPanelTop size={17} /> Browser extension</Link>
          </div>
        </section>
      </main>
      <Footer lang="en" />
    </>
  );
}
