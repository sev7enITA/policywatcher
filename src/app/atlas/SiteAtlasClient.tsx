'use client';

import Link from 'next/link';
import { useMemo, useState, type CSSProperties } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Clock,
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
    title: 'First inspection',
    body: 'Start with the dashboard, check public QA evidence, then read the methodology before using signals.',
    nodes: ['dashboard', 'trust', 'methodology'],
  },
  {
    title: 'Market movement',
    body: 'Move from the timeline to the signals board when you need sector comparison instead of a single event.',
    nodes: ['timeline', 'leaderboard', 'dashboard'],
  },
  {
    title: 'Public narrative',
    body: 'Use the project page, showcase, press wall and roadmap to understand who maintains PolicyWatcher, how it is discussed, and where it may evolve.',
    nodes: ['about', 'showcase', 'press', 'roadmap'],
  },
];

function getNode(id: string) {
  return publicSectionNodes.find((node) => node.id === id);
}

function statusLabel(status: PublicSectionNode['status']) {
  if (status === 'dynamic') return 'Dataset-driven';
  if (status === 'protected') return 'Protected';
  if (status === 'reference') return 'Reference';
  return 'Live';
}

function NodeIcon({ node }: { node: PublicSectionNode }) {
  const Icon = iconMap[node.icon] ?? LayoutDashboard;
  return <Icon size={17} aria-hidden="true" />;
}

export default function SiteAtlasClient() {
  const [activeGroup, setActiveGroup] = useState<PublicSectionGroup | 'all'>('all');
  const [selectedId, setSelectedId] = useState('dashboard');

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
    <main className={styles.page}>
      <section className={styles.hero}>
        <nav className={styles.topbar} aria-label="Atlas navigation">
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            Evidence Console
          </Link>
          <div className={styles.topbarLinks}>
            <Link href="/showcase">Showcase</Link>
            <Link href="/trust">Trust</Link>
            <Link href="/roadmap">Roadmap</Link>
          </div>
        </nav>

        <div className={styles.heroGrid}>
          <div>
            <span className={styles.eyebrow}>
              <GitFork size={15} />
              Interactive sitemap
            </span>
            <h1>PolicyWatcher Site Atlas</h1>
            <p>
              Explore the public platform as an evidence graph: sections, trust surfaces,
              methodology boundaries, community pages and the protected operations layer.
            </p>
          </div>
          <div className={styles.heroStats} aria-label="Atlas summary">
            <div>
              <strong>{publicSectionNodes.length}</strong>
              <span>nodes</span>
            </div>
            <div>
              <strong>{publicSectionEdges.length}</strong>
              <span>relations</span>
            </div>
            <div>
              <strong>6</strong>
              <span>families</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.filters} aria-label="Atlas filters">
        <button
          type="button"
          className={activeGroup === 'all' ? styles.filterActive : ''}
          onClick={() => setActiveGroup('all')}
        >
          All sections
        </button>
        {(Object.entries(publicSectionGroups) as Array<[PublicSectionGroup, typeof publicSectionGroups[PublicSectionGroup]]>).map(([key, group]) => (
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
              <h2>Relationship graph</h2>
              <p>Select a node to inspect its role and linked paths.</p>
            </div>
            <span>{activeGroup === 'all' ? 'Full atlas' : publicSectionGroups[activeGroup].label}</span>
          </div>

          <svg className={styles.graph} viewBox="0 0 100 100" role="img" aria-label="PolicyWatcher section relationship graph">
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
              const group = publicSectionGroups[node.group];
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
                  tabIndex={0}
                  role="button"
                  aria-label={`Open ${node.label} details`}
                >
                  <circle r={selected ? 5.8 : 4.9} fill="url(#atlasNode)" stroke={group.color} />
                  <circle r="8.7" fill="transparent" stroke={group.color} className={styles.nodeHalo} />
                  <text y={selected ? -8.5 : -7.4} textAnchor="middle">
                    {node.label}
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
              style={{ '--group-color': publicSectionGroups[selectedNode.group].color } as CSSProperties}
            >
              <NodeIcon node={selectedNode} />
            </span>
            <div>
              <span className={styles.nodeFamily}>{publicSectionGroups[selectedNode.group].label}</span>
              <h2>{selectedNode.label}</h2>
            </div>
          </div>

          <p className={styles.detailSummary}>{selectedNode.summary}</p>
          <div className={styles.statusRow}>
            <span>{statusLabel(selectedNode.status)}</span>
            <span>{selectedNode.role}</span>
          </div>

          <Link href={selectedNode.href} className={styles.primaryAction}>
            Open section
            <ExternalLink size={15} />
          </Link>

          <div className={styles.relationsBox}>
            <h3>Connected to</h3>
            {selectedEdges.length === 0 ? (
              <p>No direct relation is configured for this node.</p>
            ) : (
              <ul>
                {selectedEdges.map((edge) => {
                  const other = getNode(edge.from === selectedNode.id ? edge.to : edge.from);
                  if (!other) return null;
                  return (
                    <li key={`${edge.from}-${edge.to}`}>
                      <button type="button" onClick={() => setSelectedId(other.id)}>
                        <span>{other.label}</span>
                        <small>{edge.label}</small>
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
            Complete linked sitemap
          </span>
          <h2>Every public and protected-boundary surface, grouped by purpose.</h2>
        </div>

        <div className={styles.sitemapFamilies}>
          {(Object.entries(publicSectionGroups) as Array<[PublicSectionGroup, typeof publicSectionGroups[PublicSectionGroup]]>).map(([key, group]) => {
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
                    <Link key={node.id} href={node.href} className={styles.sitemapLink}>
                      <span className={styles.sitemapLinkIcon}>
                        <NodeIcon node={node} />
                      </span>
                      <span>
                        <strong>{node.label}</strong>
                        <small>{node.summary}</small>
                      </span>
                      <em>{statusLabel(node.status)}</em>
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
            Suggested exploration paths
          </span>
          <h2>Start from the question, not from the menu.</h2>
        </div>
        <div className={styles.routeCards}>
          {recommendedRoutes.map((route) => (
            <article key={route.title} className={styles.routeCard}>
              <h3>{route.title}</h3>
              <p>{route.body}</p>
              <div className={styles.routeChain}>
                {route.nodes.map((nodeId, index) => {
                  const node = getNode(nodeId);
                  if (!node) return null;
                  return (
                    <span key={node.id}>
                      <button type="button" onClick={() => setSelectedId(node.id)}>
                        {node.label}
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
            Coherence check
          </span>
          <h2>Each surface has a specific job.</h2>
        </div>
        <div className={styles.familyGrid}>
          {(Object.entries(publicSectionGroups) as Array<[PublicSectionGroup, typeof publicSectionGroups[PublicSectionGroup]]>).map(([key, group]) => (
            <article key={key} className={styles.familyCard} style={{ '--group-color': group.color } as CSSProperties}>
              <h3>{group.label}</h3>
              <p>{group.description}</p>
              <strong>{publicSectionNodes.filter((node) => node.group === key).length} sections</strong>
            </article>
          ))}
        </div>
      </section>

      <Footer lang="en" />
    </main>
  );
}
