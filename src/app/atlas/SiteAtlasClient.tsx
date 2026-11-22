'use client';
import WorkflowAuditNotice from '@/components/WorkflowAuditNotice';


import Link from 'next/link';
import { useMemo, useState, type CSSProperties } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Clock,
  Code2,
  ExternalLink,
  FileText,
  GitFork,
  LayoutDashboard,
  Lock,
  Newspaper,
  Route,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import PlanningResearchStatus from '@/components/PlanningResearchStatus';
import { planningHref, type PlanningLanguage } from '@/lib/planningLocale';
import { POLICYWATCHER_BUILD_LABEL } from '@/lib/release';
import {
  publicSectionEdges,
  publicSectionGroups,
  publicSectionNodes,
  type PublicSectionGroup,
  type PublicSectionNode,
} from '@/lib/publicSections';
import styles from './atlas.module.css';

const iconMap: Record<string, LucideIcon> = {
  'bar-chart': BarChart3,
  book: BookOpen,
  clock: Clock,
  code: Code2,
  'file-text': FileText,
  layout: LayoutDashboard,
  lock: Lock,
  newspaper: Newspaper,
  route: Route,
  server: Server,
  shield: ShieldCheck,
  sparkles: Sparkles,
  user: UserRound,
};

const recommendedRoutes = [
  {
    title: 'Your services, your choices',
    body: 'For you / Per te starts with voluntary service selection, then published updates, official guides, local choices, private notice matching and a support draft.',
    nodes: ['per-te', 'knowledge', 'associations', 'methodology'],
  },
  {
    title: 'Current release and history',
    body: 'The changelog and release archive identify the current web release, earlier milestones and remaining delivery boundaries.',
    nodes: ['changelog', 'feature-atlas', 'roadmap'],
  },
  {
    title: 'Dashboard view settings',
    body: 'The dashboard stores the selected interface density and links to the product diagram and feature catalog.',
    nodes: ['dashboard', 'infographics', 'feature-atlas'],
  },
  {
    title: 'Consumer association review',
    body: 'The association directory links territory filters, published change records and the evidence methodology.',
    nodes: ['associations', 'timeline', 'methodology'],
  },
  {
    title: 'Evidence review controls',
    body: 'The dashboard separates public baseline, retrieval status and KPI coverage. The methodology defines document selection, equal weighting and incomplete-comparison boundaries.',
    nodes: ['dashboard', 'trust', 'methodology'],
  },
  {
    title: 'Market comparison',
    body: 'The dashboard compares the selected document types with explicit coverage and per-type views. The timeline inherits that selection; the separate Policy Signals board measures operational evidence availability.',
    nodes: ['timeline', 'leaderboard', 'dashboard'],
  },
  {
    title: 'Product information',
    body: 'Project, product overview, coverage registry and roadmap pages provide authorship, implementation and release information.',
    nodes: ['about', 'showcase', 'press', 'roadmap'],
  },
  {
    title: 'Integration references',
    body: 'Developer APIs link to Observatory sources and evidence-method boundaries.',
    nodes: ['developers', 'observatory', 'methodology'],
  },
];

function getNode(id: string) {
  return publicSectionNodes.find((node) => node.id === id);
}

function statusLabel(status: PublicSectionNode['status'], lang: PlanningLanguage) {
  const labels = {
    dynamic: { en: 'Dataset-driven', it: 'Da dati pubblici' },
    protected: { en: 'Protected', it: 'Protetta' },
    reference: { en: 'Reference', it: 'Riferimento' },
    live: { en: 'Live', it: 'Disponibile' },
  };
  return labels[status][lang];
}

const italianNodeLabels: Record<string, string> = {
  briefing: 'Briefing policy', 'engine-6-preview': 'Engine 6 Preview', changelog: 'Cronologia delle release',
  'per-te': 'Per te', associations: 'Associazioni dei consumatori', 'historical-comparisons': 'Confronti degli archivi ufficiali',
  knowledge: 'Catalogo pubblico', dashboard: 'Area delle evidenze', showcase: 'Presentazione del prodotto', timeline: 'Cronologia',
  'what-changed': 'Verifica di un avviso', observatory: 'Osservatorio', developers: 'API e strumenti di sviluppo', integrations: 'Integrazioni',
  leaderboard: 'Segnali dalle policy', trust: 'Fiducia e qualità', methodology: 'Metodo delle evidenze', roadmap: 'Roadmap del prodotto',
  press: 'Registro della copertura', 'press-kit': 'Press Kit', pulse: 'PolicyWatcher Pulse', about: 'Il progetto',
  security: 'Politica di sicurezza', privacy: 'Informativa privacy', infographics: 'Infografiche', 'feature-atlas': 'Atlante delle funzioni',
  terms: 'Termini di utilizzo', admin: 'Operazioni amministrative',
};
const italianGroups: Record<PublicSectionGroup, { label: string; description: string }> = {
  core: { label: 'Percorsi principali', description: 'Punti di ingresso e consultazione pubblica.' },
  evidence: { label: 'Viste sulle evidenze', description: 'Viste basate sui record che superano i controlli di pubblicazione.' },
  assurance: { label: 'Controlli di qualità', description: 'Controlli, segnali di sicurezza ed evidenze operative.' },
  community: { label: 'Informazioni pubbliche', description: 'Roadmap, riferimenti stampa e informazioni sul prodotto.' },
  governance: { label: 'Regole e metodo', description: 'Limiti di utilizzo, metodo delle evidenze e informativa privacy.' },
  boundary: { label: 'Operazioni protette', description: 'Funzioni amministrative protette, mostrate solo per contesto.' },
};

function NodeIcon({ node }: { node: PublicSectionNode }) {
  const Icon = iconMap[node.icon] ?? LayoutDashboard;
  return <Icon size={17} aria-hidden="true" />;
}

export default function SiteAtlasClient({ lang = 'en' }: { lang?: PlanningLanguage }) {
  const tr = (en: string, it: string) => lang === 'it' ? it : en;
  const local = (href: string) => planningHref(href, lang);
  const nodeLabel = (node: PublicSectionNode) => lang === 'it' ? italianNodeLabels[node.id] ?? node.label : node.label;
  const groups = Object.fromEntries(Object.entries(publicSectionGroups).map(([key, group]) => [key, { ...group, ...(lang === 'it' ? italianGroups[key as PublicSectionGroup] : {}) }])) as typeof publicSectionGroups;
  const [activeGroup, setActiveGroup] = useState<PublicSectionGroup | 'all'>('all');
  const [selectedId, setSelectedId] = useState('per-te');

  const selectedNode = getNode(selectedId) ?? publicSectionNodes[0];

  const visibleNodeIds = useMemo(() => {
    if (activeGroup === 'all') return new Set(publicSectionNodes.map((node) => node.id));
    return new Set(publicSectionNodes.filter((node) => node.group === activeGroup).map((node) => node.id));
  }, [activeGroup]);

  const selectedEdges = useMemo(
    () => publicSectionEdges.filter((edge) => edge.from === selectedNode.id || edge.to === selectedNode.id),
    [selectedNode.id],
  );

  return (
    <>
      <PublicHeader current="atlas" lang={lang} lockLang />
      <main className={styles.page} lang={lang}>
        <WorkflowAuditNotice lang={lang} />
      <section className={styles.hero}>
        <nav className={styles.topbar} aria-label={tr('Atlas navigation', 'Navigazione dell’atlante')}>
          <Link href={local('/')} className={styles.backLink}>
            <ArrowLeft size={16} />
            {tr('Evidence Console', 'Area delle evidenze')}
          </Link>
          <div className={styles.topbarLinks}>
            <Link href={local('/showcase')}>{tr('Showcase','Presentazione')}</Link>
            <Link href={local('/trust')}>{tr('Trust','Qualità')}</Link>
            <Link href={local('/roadmap')}>{tr('Roadmap','Roadmap')}</Link>
          </div>
        </nav>

        <div className={styles.heroGrid}>
          <div>
            <span className={styles.eyebrow}>
              <GitFork size={15} />
              {tr('Public route graph', 'Mappa delle sezioni pubbliche')} · {POLICYWATCHER_BUILD_LABEL}
            </span>
            <h1>{tr('Site map','Mappa del sito')}</h1>
            <p>
              {tr('The graph contains public sections, quality controls, evidence methodology, public information and protected operations.', 'La mappa comprende sezioni pubbliche, controlli di qualità, metodo delle evidenze e operazioni protette.')}
            </p>
          </div>
          <div className={styles.heroStats} aria-label={tr('Atlas summary', 'Riepilogo dell’atlante')}>
            <div>
              <strong>{publicSectionNodes.length}</strong>
              <span>{tr('nodes','nodi')}</span>
            </div>
            <div>
              <strong>{publicSectionEdges.length}</strong>
              <span>{tr('relations','relazioni')}</span>
            </div>
            <div>
              <strong>{Object.keys(groups).length}</strong>
              <span>{tr('families','famiglie')}</span>
            </div>
          </div>
        </div>
      </section>

      <PlanningResearchStatus lang={lang} path="/atlas" />
      <section className={styles.filters} aria-label={tr('Atlas filters', 'Filtri dell’atlante')}>
        <button
          type="button"
          className={activeGroup === 'all' ? styles.filterActive : ''}
          onClick={() => setActiveGroup('all')}
        >
          All sections
        </button>
        {(Object.entries(groups) as Array<[PublicSectionGroup, typeof groups[PublicSectionGroup]]>).map(([key, group]) => (
          <button
            key={key}
            type="button"
            className={activeGroup === key ? styles.filterActive : ''}
            style={{ '--group-color': group.color } as CSSProperties}
            onClick={() => setActiveGroup(key)}
          >
            {group.label}
          </button>
        ))}
      </section>

      <section className={styles.atlasGrid}>
        <div className={styles.graphPanel}>
          <div className={styles.graphHeader}>
            <div>
              <h2>{tr('Route relationships','Relazioni fra le pagine')}</h2>
              <p>{tr('Node selection displays the route role and connected sections.','Seleziona un nodo per esaminarne il ruolo e i collegamenti.')}</p>
            </div>
            <span>{activeGroup === 'all' ? tr('Full atlas', 'Atlante completo') : groups[activeGroup].label}</span>
          </div>

          <svg className={styles.graph} viewBox="0 0 100 100" role="group" aria-label={tr("PolicyWatcher section relationship graph", "Mappa delle relazioni fra le sezioni")}>
            <defs>
              <radialGradient id="atlasNode" cx="50%" cy="35%" r="70%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
                <stop offset="100%" stopColor="#f1f5f9" stopOpacity="0.9" />
              </radialGradient>
            </defs>
            {publicSectionEdges.map((edge) => {
              const from = getNode(edge.from);
              const to = getNode(edge.to);
              if (!from || !to) return null;
              const edgeVisible = visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to);
              const selected = edge.from === selectedNode.id || edge.to === selectedNode.id;
              return (
                <g key={`${edge.from}-${edge.to}`} className={[
                  styles.edgeGroup,
                  edgeVisible ? styles.edgeVisible : styles.edgeMuted,
                  selected ? styles.edgeSelected : '',
                  edge.strength === 'primary' ? styles.edgePrimary : styles.edgeSecondary,
                ].filter(Boolean).join(' ')}>
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
                </g>
              );
            })}
            {publicSectionNodes.map((node) => {
              const visible = visibleNodeIds.has(node.id);
              const selected = node.id === selectedNode.id;
              const group = groups[node.group];
              return (
                <g
                  key={node.id}
                  className={[
                    styles.nodeGroup,
                    visible ? styles.nodeVisible : styles.nodeMuted,
                    selected ? styles.nodeSelected : '',
                  ].filter(Boolean).join(' ')}
                  transform={`translate(${node.x} ${node.y})`}
                  onClick={() => setSelectedId(node.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedId(node.id);
                    }
                  }}
                  tabIndex={visible ? 0 : -1}
                  aria-hidden={!visible}
                  role="button"
                  aria-label={`${tr('Open', 'Apri')} ${nodeLabel(node)}${lang === 'en' ? ' details' : ''}`}
                >
                  <circle r={selected ? 5.8 : 4.9} fill="url(#atlasNode)" stroke={group.color} />
                  <circle r="8.7" fill="transparent" stroke={group.color} className={styles.nodeHalo} />
                  <text y={selected ? -8.5 : -7.4} textAnchor="middle">
                    {nodeLabel(node)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <aside className={styles.detailPanel}>
          <div className={styles.detailHeader}>
            <span
              className={styles.detailIcon}
              style={{ '--group-color': groups[selectedNode.group].color } as CSSProperties}
            >
              <NodeIcon node={selectedNode} />
            </span>
            <div>
              <span className={styles.nodeFamily}>{groups[selectedNode.group].label}</span>
              <h2>{nodeLabel(selectedNode)}</h2>
            </div>
          </div>

          <p lang="en" className={styles.detailSummary}>{selectedNode.summary}</p>
          <div className={styles.statusRow}>
            <span>{statusLabel(selectedNode.status, lang)}</span>
            <span lang="en">{selectedNode.role}</span>
          </div>

          <Link href={local(selectedNode.href)} className={styles.primaryAction}>
            {tr('Open section', 'Apri la sezione')}
            <ExternalLink size={15} />
          </Link>

          <div className={styles.relationsBox}>
            <h3>{tr('Connected to','Collegamenti')}</h3>
            {selectedEdges.length === 0 ? (
              <p>{tr('No direct relation is configured for this node.','Non sono configurati collegamenti diretti per questo nodo.')}</p>
            ) : (
              <ul>
                {selectedEdges.map((edge) => {
                  const other = getNode(edge.from === selectedNode.id ? edge.to : edge.from);
                  if (!other) return null;
                  return (
                    <li key={`${edge.from}-${edge.to}`}>
                      <button type="button" onClick={() => setSelectedId(other.id)}>
                        <span>{nodeLabel(other)}</span>
                        <small lang="en">{edge.label}</small>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </section>

      <section className={styles.sitemapSection}>
        <div className={styles.sectionHeading}>
          <span>
            <Route size={15} />
            Linked sitemap
          </span>
          <h2>{tr('Route directory','Indice delle sezioni')}</h2>
        </div>

        <div className={styles.sitemapFamilies}>
          {(Object.entries(groups) as Array<[PublicSectionGroup, typeof groups[PublicSectionGroup]]>).map(([key, group]) => {
            const nodes = publicSectionNodes.filter((node) => node.group === key);
            return (
              <article key={key} className={styles.sitemapFamily} style={{ '--group-color': group.color } as CSSProperties}>
                <div className={styles.sitemapFamilyHeader}>
                  <div>
                    <h3>{group.label}</h3>
                    <p>{group.description}</p>
                  </div>
                  <strong>{nodes.length}</strong>
                </div>

                <div className={styles.sitemapLinks}>
                  {nodes.map((node) => (
                    <Link key={node.id} href={local(node.href)} className={styles.sitemapLink}>
                      <span className={styles.sitemapLinkIcon}>
                        <NodeIcon node={node} />
                      </span>
                      <span>
                        <strong>{nodeLabel(node)}</strong>
                        <small lang="en">{node.summary}</small>
                      </span>
                      <em>{statusLabel(node.status, lang)}</em>
                    </Link>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.routesSection}>
        <div className={styles.sectionHeading}>
          <span>
            <Search size={15} />
            Route sequences
          </span>
          <h2>{tr('Route groups','Gruppi di percorsi')}</h2>
        </div>
        <div className={styles.routeCards}>
          {recommendedRoutes.map((route) => (
            <article key={route.title} className={styles.routeCard} lang="en">
              <h3>{route.title}</h3>
              <p>{route.body}</p>
              <div className={styles.routeChain}>
                {route.nodes.map((nodeId, index) => {
                  const node = getNode(nodeId);
                  if (!node) return null;
                  return (
                    <span key={node.id}>
                      <button type="button" onClick={() => setSelectedId(node.id)}>
                        {nodeLabel(node)}
                      </button>
                      {index < route.nodes.length - 1 && <ArrowRight size={14} />}
                    </span>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.familySection}>
        <div className={styles.sectionHeading}>
          <span>
            <ShieldCheck size={15} />
            Route group summary
          </span>
          <h2>{tr('Group responsibilities','Ruoli dei gruppi')}</h2>
        </div>
        <div className={styles.familyGrid}>
          {(Object.entries(groups) as Array<[PublicSectionGroup, typeof groups[PublicSectionGroup]]>).map(([key, group]) => (
            <article key={key} className={styles.familyCard} style={{ '--group-color': group.color } as CSSProperties}>
              <h3>{group.label}</h3>
              <p>{group.description}</p>
              <strong>{publicSectionNodes.filter((node) => node.group === key).length} {tr('sections', 'sezioni')}</strong>
            </article>
          ))}
        </div>
      </section>

      <Footer lang={lang} lockLang />
      </main>
    </>
  );
}
