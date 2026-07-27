'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ExternalLink,
  GitBranch,
  Network,
  RotateCcw,
  Search,
  ShieldAlert,
} from 'lucide-react';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import {
  FEATURE_ATLAS_DOMAINS,
  FEATURE_ATLAS_FEATURES,
  FEATURE_ATLAS_RELEASES,
  FEATURE_ATLAS_STAGES,
  getConnectedFeatureIds,
  getFeatureAtlasConnections,
  getFeatureAtlasDomain,
  getFeatureAtlasInventorySummary,
  getFeatureAtlasRelationshipLabel,
  getFeatureAtlasReleaseFeatures,
  getFeatureAtlasStage,
  type FeatureAtlasFeature,
  type FeatureAtlasKind,
  type FeatureAtlasStageId,
  type FeatureAtlasState,
} from '@/lib/featureAtlas';
import { POLICYWATCHER_VERSION_DISPLAY } from '@/lib/release';
import styles from './featureAtlas.module.css';

type KindFilter = 'all' | FeatureAtlasKind;
type StateFilter = 'all' | FeatureAtlasState;

const stateLabels: Record<FeatureAtlasState, string> = {
  delivered: 'Delivered',
  current: 'Current',
  planned: 'Planned',
};

const stageX: Record<FeatureAtlasStageId, number> = {
  intake: 7.5,
  discovery: 24.5,
  retrieval: 41.5,
  assurance: 58.5,
  publication: 75.5,
  remediation: 92.5,
};

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase();
}

function Inspector({
  feature,
  onSelect,
  panelRef,
  backTargetId,
}: {
  feature: FeatureAtlasFeature;
  onSelect: (id: string) => void;
  panelRef: RefObject<HTMLElement | null>;
  backTargetId: string;
}) {
  const domain = getFeatureAtlasDomain(feature.domainId);
  const stage = getFeatureAtlasStage(feature.stageId);
  const connections = getFeatureAtlasConnections(feature.id).flatMap((connection) => {
    const connectedFeature = FEATURE_ATLAS_FEATURES.find((candidate) => candidate.id === connection.featureId);
    return connectedFeature ? [{ ...connection, feature: connectedFeature }] : [];
  });

  return (
    <aside ref={panelRef} className={styles.inspector} aria-labelledby="inspector-title" tabIndex={-1}>
      <a href={`#${backTargetId}`} className={styles.backToRail}><ArrowLeft size={15} /> Back to selected capability</a>
      <header className={styles.inspectorHeader} aria-live="polite">
        <div>
          <span className={styles.inspectorKicker}>Selected capability · {stage?.shortLabel}</span>
          <h2 id="inspector-title">{feature.title}</h2>
        </div>
        <span className={styles.stateTag} data-state={feature.state}>{stateLabels[feature.state]}</span>
      </header>

      <p className={styles.inspectorSummary}>{feature.summary}</p>

      <dl className={styles.metadataGrid}>
        <div><dt>Domain / kind</dt><dd>{domain?.label} · {feature.kind}</dd></div>
        <div><dt>First release / horizon</dt><dd>{feature.release} · {feature.horizon}</dd></div>
        <div><dt>Primary stakeholder</dt><dd>{feature.primaryUser}</dd></div>
        <div><dt>Operating stage</dt><dd>{stage?.title}</dd></div>
      </dl>

      <section className={styles.proofBlock}>
        <span>Benefit / outcome</span>
        <p>{feature.benefit}</p>
      </section>
      <section className={styles.proofBlock}>
        <span>Inventory KPI</span>
        <p>{feature.kpi.replace(/^Inventory KPI\s*[·:]?\s*/i, '')}</p>
      </section>
      <section className={`${styles.proofBlock} ${styles.riskBlock}`}>
        <span><ShieldAlert size={14} /> Residual KRI</span>
        <p>{feature.kri.replace(/^Residual KRI\s*[·:]?\s*/i, '')}</p>
      </section>
      <section className={styles.proofBlock}>
        <span>Implementation proof</span>
        <p>{feature.evidence}</p>
      </section>
      <section className={styles.proofBlock}>
        <span>Known limitation</span>
        <p>{feature.limitation}</p>
      </section>

      {feature.externalDependency && (
        <div className={styles.externalNote}>
          <ExternalLink size={15} />
          <span><b>External dependency</b>{feature.externalDependency}</span>
        </div>
      )}

      {feature.route && (
        <Link href={feature.route.href} className={styles.routeLink}>
          Open {feature.route.label}
          <span>{feature.route.access}</span>
          <ArrowRight size={15} />
        </Link>
      )}

      <section className={styles.relationships} aria-labelledby="connected-title">
        <div className={styles.sectionLabel} id="connected-title">
          <Network size={14} /> Connected capabilities <b>{connections.length}</b>
        </div>
        {connections.length > 0 ? (
          <ul>
            {connections.map((connection) => (
              <li key={`${connection.direction}-${connection.relationship}-${connection.feature.id}`}>
                <button
                  type="button"
                  onClick={() => onSelect(connection.feature.id)}
                  aria-label={`${connection.feature.title}. ${connection.direction} relationship: ${getFeatureAtlasRelationshipLabel(connection.relationship)}.`}
                >
                  <span>{connection.feature.shortLabel}</span>
                  <small>
                    {connection.direction === 'outgoing' ? 'Out →' : 'In ←'} · {getFeatureAtlasRelationshipLabel(connection.relationship)}
                  </small>
                </button>
              </li>
            ))}
          </ul>
        ) : <p className={styles.noRelationships}>Foundation capability; no explicit upstream dependency recorded.</p>}
      </section>
    </aside>
  );
}

export default function FeatureAtlasClient() {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<KindFilter>('all');
  const [state, setState] = useState<StateFilter>('all');
  const [domainId, setDomainId] = useState('all');
  const [releaseId, setReleaseId] = useState('all');
  const [showDependencies, setShowDependencies] = useState(false);
  const [selectedId, setSelectedId] = useState('feature-intelligence-atlas');
  const [openMobileStages, setOpenMobileStages] = useState<Set<FeatureAtlasStageId>>(() => new Set(['publication']));
  const inspectorRef = useRef<HTMLElement>(null);

  const visibleFeatures = useMemo(() => {
    const normalized = normalizeSearch(query);
    return FEATURE_ATLAS_FEATURES.filter((feature) => {
      const domain = getFeatureAtlasDomain(feature.domainId);
      const haystack = `${feature.title} ${feature.shortLabel} ${feature.summary} ${feature.evidence} ${feature.primaryUser} ${domain?.label}`.toLocaleLowerCase();
      return (!normalized || haystack.includes(normalized))
        && (kind === 'all' || feature.kind === kind)
        && (state === 'all' || feature.state === state)
        && (domainId === 'all' || feature.domainId === domainId)
        && (releaseId === 'all' || feature.releaseId === releaseId);
    });
  }, [domainId, kind, query, releaseId, state]);

  const selectedFeature = visibleFeatures.find((feature) => feature.id === selectedId)
    ?? visibleFeatures[0]
    ?? FEATURE_ATLAS_FEATURES.find((feature) => feature.id === selectedId)
    ?? FEATURE_ATLAS_FEATURES[0];

  const visibleIds = useMemo(() => new Set(visibleFeatures.map((feature) => feature.id)), [visibleFeatures]);
  const connectedToSelected = getConnectedFeatureIds(selectedFeature.id);
  const summary = getFeatureAtlasInventorySummary(visibleFeatures);

  const layout = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    let largestStage = 0;
    for (const stage of FEATURE_ATLAS_STAGES) {
      const features = visibleFeatures.filter((feature) => feature.stageId === stage.id);
      largestStage = Math.max(largestStage, features.length);
      features.forEach((feature, index) => {
        positions.set(feature.id, { x: stageX[stage.id], y: 112 + index * 57 });
      });
    }
    return { positions, height: Math.max(650, 152 + largestStage * 57) };
  }, [visibleFeatures]);

  const visibleEdges = useMemo(() => visibleFeatures.flatMap((feature) => feature.dependencies
    .filter((dependency) => visibleIds.has(dependency.featureId))
    .map((dependency) => ({
      from: feature.id,
      to: dependency.featureId,
      relationship: dependency.relationship,
    }))), [visibleFeatures, visibleIds]);

  const availableReleases = useMemo(() => Array.from(new Map(
    FEATURE_ATLAS_FEATURES.map((feature) => [feature.releaseId, feature.release]),
  ).entries()), []);

  const resetFilters = () => {
    setQuery('');
    setKind('all');
    setState('all');
    setDomainId('all');
    setReleaseId('all');
  };

  const revealInspectorOnCompactLayout = () => {
    if (!window.matchMedia('(max-width: 900px)').matches) return;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const inspector = inspectorRef.current;
        if (!inspector) return;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        inspector.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
        inspector.focus({ preventScroll: true });
      });
    });
  };

  const selectFeature = (id: string, revealInspector = true) => {
    const nextFeature = FEATURE_ATLAS_FEATURES.find((feature) => feature.id === id);
    if (nextFeature) {
      setOpenMobileStages((current) => new Set([...current, nextFeature.stageId]));
    }
    setSelectedId(id);
    if (!visibleIds.has(id)) resetFilters();
    if (revealInspector) revealInspectorOnCompactLayout();
  };

  const toggleMobileStage = (stageId: FeatureAtlasStageId) => {
    setOpenMobileStages((current) => {
      const next = new Set(current);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      return next;
    });
  };

  return (
    <>
      <PublicHeader current="feature-atlas" />
      <main className={styles.page}>
      <nav className={styles.topbar} aria-label="Feature Atlas navigation">
        <Link href="/" className={styles.brand} aria-label="PolicyWatcher home">
          <Image src="/logo-mark.png" width={34} height={34} alt="" priority />
          <span><strong>PolicyWatcher</strong><small>Feature intelligence</small></span>
        </Link>
        <div className={styles.topLinks}>
          <Link href="/atlas">Site Atlas</Link>
          <Link href="/roadmap">Roadmap</Link>
          <Link href="/methodology/confidence">Method</Link>
        </div>
      </nav>

      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <Link href="/" className={styles.backLink}><ArrowLeft size={15} /> Evidence Console</Link>
          <span className={styles.eyebrow}><GitBranch size={14} /> Operational constellation · {POLICYWATCHER_VERSION_DISPLAY}</span>
          <h1>Feature Intelligence Atlas</h1>
          <p>
            Follow PolicyWatcher from a user signal to official evidence, qualified analysis,
            public distribution and recorded remediation. Nodes include outcome,
            implementation proof and remaining limit.
          </p>
        </div>
        <aside className={styles.heroNote}>
          <span>Interpretation boundary</span>
          <p><b>Inventory KPIs</b> and <b>Residual KRIs</b> are qualitative release and assurance indicators.</p>
          <small>They are not measured adoption, legal findings or compliance certification.</small>
        </aside>
      </header>

      <section className={styles.summaryStrip} aria-label="Visible inventory summary">
        <article><span>Inventory KPI</span><strong>{summary.visible}</strong><small>visible features</small></article>
        <article><span>Coverage</span><strong>{summary.domains}</strong><small>visible domains</small></article>
        <article className={styles.splitStat}><span>Delivery split</span><strong>{summary.delivered}<i>/</i>{summary.current}<i>/</i>{summary.planned}</strong><small>delivered / current / planned</small></article>
        <article><span>External</span><strong>{summary.external}</strong><small>named dependencies</small></article>
        <article className={styles.riskStat}><span>Residual KRI</span><strong>{summary.openKri}</strong><small>pending or open</small></article>
      </section>

      <section className={styles.controls} aria-label="Feature Atlas filters">
        <label className={styles.searchField}>
          <span>Search capability or proof</span>
          <span><Search size={16} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search retrieval, correction, PDF…" /></span>
        </label>
        <fieldset className={styles.segmented}>
          <legend>Kind</legend>
          <div>
            {(['all', 'business', 'technical'] as KindFilter[]).map((value) => (
              <button key={value} type="button" aria-pressed={kind === value} onClick={() => setKind(value)}>{value}</button>
            ))}
          </div>
        </fieldset>
        <fieldset className={styles.segmented}>
          <legend>Delivery</legend>
          <div>
            {(['all', 'delivered', 'current', 'planned'] as StateFilter[]).map((value) => (
              <button key={value} type="button" aria-pressed={state === value} onClick={() => setState(value)}>{value}</button>
            ))}
          </div>
        </fieldset>
        <label className={styles.selectField}>Domain
          <select value={domainId} onChange={(event) => setDomainId(event.target.value)}>
            <option value="all">All domains</option>
            {FEATURE_ATLAS_DOMAINS.map((domain) => <option key={domain.id} value={domain.id}>{domain.label}</option>)}
          </select>
        </label>
        <label className={styles.selectField}>Release / horizon
          <select value={releaseId} onChange={(event) => setReleaseId(event.target.value)}>
            <option value="all">All releases</option>
            {availableReleases.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
        <div className={styles.controlActions}>
          <button type="button" className={styles.dependencyToggle} aria-pressed={showDependencies} onClick={() => setShowDependencies((value) => !value)}>
            <Network size={16} /> Show dependencies
          </button>
          <button type="button" className={styles.resetButton} onClick={resetFilters}><RotateCcw size={15} /> Clear</button>
        </div>
      </section>

      <section className={styles.workspace} aria-label="Feature dependency workspace">
        <div className={styles.mapPanel} id="feature-atlas-map">
          <header className={styles.panelHeader}>
            <div><span>System map / evidence chain</span><h2>Six operating stages, one fail-closed boundary</h2></div>
            <p>{visibleFeatures.length} of {FEATURE_ATLAS_FEATURES.length} nodes shown</p>
          </header>

          {visibleFeatures.length > 0 ? (
            <div className={styles.desktopConstellation} style={{ '--graph-height': `${layout.height}px` } as CSSProperties}>
              <div className={styles.stageHeads} aria-hidden="true">
                {FEATURE_ATLAS_STAGES.map((stage) => (
                  <div key={stage.id} style={{ left: `${stageX[stage.id]}%` }}>
                    <b>0{stage.index}</b><span>{stage.shortLabel}</span>
                  </div>
                ))}
              </div>
              <svg viewBox={`0 0 100 ${layout.height}`} preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <marker id="atlas-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 6 3 L 0 6 z" /></marker>
                </defs>
                {FEATURE_ATLAS_STAGES.slice(0, -1).map((stage, index) => (
                  <line key={stage.id} className={styles.chainLine} x1={stageX[stage.id]} y1="76" x2={stageX[FEATURE_ATLAS_STAGES[index + 1].id]} y2="76" />
                ))}
                {visibleEdges.map((edge) => {
                  const from = layout.positions.get(edge.from);
                  const to = layout.positions.get(edge.to);
                  if (!from || !to) return null;
                  const selected = edge.from === selectedFeature.id || edge.to === selectedFeature.id;
                  if (!showDependencies && !selected) return null;
                  return <line key={`${edge.from}-${edge.to}-${edge.relationship}`} className={selected ? styles.selectedEdge : styles.dependencyEdge} x1={from.x} y1={from.y} x2={to.x} y2={to.y} markerEnd="url(#atlas-arrow)" />;
                })}
              </svg>
              {visibleFeatures.map((feature) => {
                const position = layout.positions.get(feature.id);
                if (!position) return null;
                const selected = selectedFeature.id === feature.id;
                const related = connectedToSelected.has(feature.id);
                return (
                  <button
                    key={feature.id}
                    type="button"
                    className={styles.featureNode}
                    data-state={feature.state}
                    data-related={related ? 'true' : 'false'}
                    aria-pressed={selected}
                    aria-label={`${feature.title}. ${stateLabels[feature.state]}. Select for evidence and relationships.`}
                    onClick={() => setSelectedId(feature.id)}
                    style={{ left: `${position.x}%`, top: position.y } as CSSProperties}
                  >
                    <i aria-hidden="true" />
                    <span>{feature.shortLabel}</span>
                    <small>{feature.kind === 'business' ? 'BIZ' : 'TECH'} · {feature.release.replace('3.8.3 ', '')}</small>
                  </button>
                );
              })}
            </div>
          ) : <div className={styles.emptyState}><Search size={20} /><h3>No capability matches this view.</h3><p>Clear one or more filters to restore the operating chain.</p><button type="button" onClick={resetFilters}>Reset filters</button></div>}

          <div className={styles.mobileRail}>
            <aside className={styles.mobileSelection} aria-label="Selected capability summary">
              <span>{getFeatureAtlasStage(selectedFeature.stageId)?.shortLabel} · selected</span>
              <strong>{selectedFeature.title}</strong>
              <button type="button" onClick={revealInspectorOnCompactLayout}>View KPI / KRI <ArrowRight size={15} /></button>
            </aside>
            {FEATURE_ATLAS_STAGES.map((stage) => {
              const features = visibleFeatures.filter((feature) => feature.stageId === stage.id);
              if (features.length === 0) return null;
              const isOpen = openMobileStages.has(stage.id) || selectedFeature.stageId === stage.id;
              return (
                <section key={stage.id} className={styles.mobileStage} aria-labelledby={`mobile-stage-${stage.id}`}>
                  <header>
                    <button
                      id={`mobile-stage-toggle-${stage.id}`}
                      type="button"
                      className={styles.mobileStageToggle}
                      aria-expanded={isOpen}
                      aria-controls={`mobile-stage-list-${stage.id}`}
                      onClick={() => toggleMobileStage(stage.id)}
                    >
                      <b>0{stage.index}</b>
                      <div><h3 id={`mobile-stage-${stage.id}`}>{stage.title}</h3><p>{stage.summary}</p></div>
                      <small>{features.length}</small>
                      <ChevronDown size={17} aria-hidden="true" />
                    </button>
                  </header>
                  <ul id={`mobile-stage-list-${stage.id}`} hidden={!isOpen}>
                    {features.map((feature) => (
                      <li key={feature.id}>
                        <button
                          id={`mobile-feature-${feature.id}`}
                          type="button"
                          aria-pressed={selectedFeature.id === feature.id}
                          onClick={() => selectFeature(feature.id)}
                        >
                          <i data-state={feature.state} />
                          <span><strong>{feature.title}</strong><small>{getFeatureAtlasDomain(feature.domainId)?.label} · {stateLabels[feature.state]}</small></span>
                          <ArrowRight size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>

        <Inspector
          feature={selectedFeature}
          onSelect={selectFeature}
          panelRef={inspectorRef}
          backTargetId={`mobile-stage-toggle-${selectedFeature.stageId}`}
        />
      </section>

      <section className={styles.changelog} aria-labelledby="changelog-chain-title">
        <header>
          <span>Compact changelog chain</span>
          <h2 id="changelog-chain-title">Step through Beta 2 → {POLICYWATCHER_VERSION_DISPLAY}</h2>
          <p>Select a milestone to isolate capabilities first represented in that release.</p>
        </header>
        <ol>
          {FEATURE_ATLAS_RELEASES.map((release, index) => {
            const count = getFeatureAtlasReleaseFeatures(release.id).length;
            const active = releaseId === release.id;
            return (
              <li key={release.id}>
                <button type="button" aria-pressed={active} onClick={() => setReleaseId(active ? 'all' : release.id)}>
                  <span>{release.shortLabel}</span><b>{count}</b><small>{release.current ? 'current' : 'features'}</small>
                </button>
                {index < FEATURE_ATLAS_RELEASES.length - 1 && <ArrowRight size={15} aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
        <div className={styles.chainNote}>
          <Check size={15} />
          <p><b>{releaseId === 'all' ? 'All milestones' : FEATURE_ATLAS_RELEASES.find((release) => release.id === releaseId)?.label ?? releaseId}</b> Release placement marks first delivery or target horizon; it is not an adoption measurement.</p>
        </div>
      </section>

      <section className={styles.methodNote}>
        <div><span>Reading protocol</span><h2>Trace the claim. Keep the boundary.</h2></div>
        <p>Feature evidence identifies an implementation surface. Delivery state describes repository inventory, not availability in a specific deployment. AI-assisted signals remain text-derived attention cues, and public data routes apply the configured evidence gate.</p>
        <Link href="/methodology/confidence">Read methodology <ArrowRight size={15} /></Link>
      </section>

      <Footer lang="en" />
      </main>
    </>
  );
}
