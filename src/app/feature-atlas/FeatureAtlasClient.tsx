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
import PlanningResearchStatus from '@/components/PlanningResearchStatus';
import { planningHref, type PlanningLanguage } from '@/lib/planningLocale';
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
  lang,
}: {
  feature: FeatureAtlasFeature;
  onSelect: (id: string) => void;
  panelRef: RefObject<HTMLElement | null>;
  backTargetId: string;
  lang: PlanningLanguage;
}) {
  const domain = getFeatureAtlasDomain(feature.domainId);
  const stage = getFeatureAtlasStage(feature.stageId);
  const connections = getFeatureAtlasConnections(feature.id).flatMap((connection) => {
    const connectedFeature = FEATURE_ATLAS_FEATURES.find((candidate) => candidate.id === connection.featureId);
    return connectedFeature ? [{ ...connection, feature: connectedFeature }] : [];
  });

  return (
    <aside lang="en" ref={panelRef} className={styles.inspector} aria-labelledby="inspector-title" tabIndex={-1}>
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
        <Link href={planningHref(feature.route.href, lang)} className={styles.routeLink}>
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

export default function FeatureAtlasClient({ lang = 'en' }: { lang?: PlanningLanguage }) {
  const tr = (en: string, it: string) => lang === 'it' ? it : en;
  const filterLabel = (value: string) => lang === 'it' ? ({ all: 'tutte', business: 'utente', technical: 'tecniche', delivered: 'consegnate', current: 'correnti', planned: 'pianificate' } as Record<string, string>)[value] ?? value : value;
  const local = (href: string) => planningHref(href, lang);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<KindFilter>('all');
  const [state, setState] = useState<StateFilter>('all');
  const [domainId, setDomainId] = useState('all');
  const [releaseId, setReleaseId] = useState('all');
  const [showDependencies, setShowDependencies] = useState(false);
  const [selectedId, setSelectedId] = useState('citizen-journey');
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
      <PublicHeader current="feature-atlas" lang={lang} lockLang />
      <main className={styles.page} lang={lang}>
      <nav className={styles.topbar} aria-label="Feature Atlas navigation">
        <Link href={local('/')} className={styles.brand} aria-label="PolicyWatcher home">
          <Image src="/logo-mark.png" width={34} height={34} alt="" priority />
          <span><strong>PolicyWatcher</strong><small>{tr('Feature intelligence','Inventario delle funzioni')}</small></span>
        </Link>
        <div className={styles.topLinks}>
          <Link href={local('/atlas')}>{tr('Site Atlas','Mappa del sito')}</Link>
          <Link href={local('/roadmap')}>{tr('Roadmap','Roadmap')}</Link>
          <Link href={local('/methodology/confidence')}>{tr('Method','Metodo')}</Link>
        </div>
      </nav>

      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <Link href={local('/')} className={styles.backLink}><ArrowLeft size={15} /> {tr('Evidence Console', 'Area delle evidenze')}</Link>
          <span className={styles.eyebrow}><GitBranch size={14} /> {tr('Operational constellation', 'Mappa operativa')} · {POLICYWATCHER_VERSION_DISPLAY}</span>
          <h1>{tr('Feature atlas','Atlante delle funzioni')}</h1>
          <p>
            {tr('Follow PolicyWatcher from a user signal to official evidence, qualified analysis, public distribution and recorded remediation. Nodes include outcome, implementation proof and remaining limit.', 'Segui il percorso dal segnale di un utente alle fonti ufficiali, all’analisi, alla pubblicazione e alle correzioni. Ogni nodo conserva risultato, riferimento di implementazione e limite residuo.')}
          </p>
        </div>
        <aside className={styles.heroNote}>
          <span>{tr('Interpretation boundary','Limiti di interpretazione')}</span>
          <p>{tr('Inventory KPIs and Residual KRIs are qualitative release and assurance indicators.', 'KPI di inventario e KRI residui sono indicatori qualitativi della release e dei controlli.')}</p>
          <small>{tr('They are not measured adoption, legal findings or compliance certification.','Non misurano adozione e non costituiscono valutazioni legali o certificazioni di conformità.')}</small>
        </aside>
      </header>

      <PlanningResearchStatus lang={lang} path="/feature-atlas" />
      <section className={styles.summaryStrip} aria-label="Visible inventory summary">
        <article><span>{tr('Inventory KPI','KPI di inventario')}</span><strong>{summary.visible}</strong><small>{tr('visible features','funzioni visibili')}</small></article>
        <article><span>{tr('Coverage','Copertura')}</span><strong>{summary.domains}</strong><small>{tr('visible domains','ambiti visibili')}</small></article>
        <article className={styles.splitStat}><span>{tr('Delivery split','Stati di consegna')}</span><strong>{summary.delivered}<i>/</i>{summary.current}<i>/</i>{summary.planned}</strong><small>{tr('delivered / current / planned','consegnate / correnti / pianificate')}</small></article>
        <article><span>{tr('External','Esterne')}</span><strong>{summary.external}</strong><small>{tr('named dependencies','dipendenze dichiarate')}</small></article>
        <article className={styles.riskStat}><span>{tr('Residual KRI','KRI residui')}</span><strong>{summary.openKri}</strong><small>{tr('pending or open','aperti o da verificare')}</small></article>
      </section>

      <section className={styles.controls} aria-label="Feature Atlas filters">
        <label className={styles.searchField}>
          <span>{tr('Search capability or proof','Cerca una funzione o un’evidenza')}</span>
          <span><Search size={16} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tr('Search retrieval, correction, PDF…', 'Cerca retrieval, correzioni, PDF…')} /></span>
        </label>
        <fieldset className={styles.segmented}>
          <legend>{tr('Kind','Tipo')}</legend>
          <div>
            {(['all', 'business', 'technical'] as KindFilter[]).map((value) => (
              <button key={value} type="button" aria-pressed={kind === value} onClick={() => setKind(value)}>{filterLabel(value)}</button>
            ))}
          </div>
        </fieldset>
        <fieldset className={styles.segmented}>
          <legend>{tr('Delivery','Consegna')}</legend>
          <div>
            {(['all', 'delivered', 'current', 'planned'] as StateFilter[]).map((value) => (
              <button key={value} type="button" aria-pressed={state === value} onClick={() => setState(value)}>{filterLabel(value)}</button>
            ))}
          </div>
        </fieldset>
        <label className={styles.selectField}>{tr('Domain', 'Ambito')}
          <select value={domainId} onChange={(event) => setDomainId(event.target.value)}>
            <option value="all">{tr('All domains','Tutti gli ambiti')}</option>
            {FEATURE_ATLAS_DOMAINS.map((domain) => <option key={domain.id} value={domain.id}>{domain.label}</option>)}
          </select>
        </label>
        <label className={styles.selectField}>{tr('Release / horizon', 'Release / orizzonte')}
          <select value={releaseId} onChange={(event) => setReleaseId(event.target.value)}>
            <option value="all">{tr('All releases','Tutte le release')}</option>
            {availableReleases.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
        <div className={styles.controlActions}>
          <button type="button" className={styles.dependencyToggle} aria-pressed={showDependencies} onClick={() => setShowDependencies((value) => !value)}>
            <Network size={16} /> {tr('Show dependencies', 'Mostra le dipendenze')}
          </button>
          <button type="button" className={styles.resetButton} onClick={resetFilters}><RotateCcw size={15} /> {tr('Clear', 'Azzera')}</button>
        </div>
      </section>

      <section className={styles.workspace} aria-label="Feature dependency workspace">
        <div className={styles.mapPanel} id="feature-atlas-map">
          <header className={styles.panelHeader}>
            <div><span>{tr('System map / evidence chain','Mappa del sistema / catena delle evidenze')}</span><h2>{tr('Operating stages','Fasi operative')}</h2></div>
            <p>{visibleFeatures.length} of {FEATURE_ATLAS_FEATURES.length} nodes shown</p>
          </header>

          {visibleFeatures.length > 0 ? (
            <div lang="en" className={styles.desktopConstellation} style={{ '--graph-height': `${layout.height}px` } as CSSProperties}>
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
          ) : <div className={styles.emptyState}><Search size={20} /><h3>{tr('No capability matches this view.','Nessuna funzione corrisponde ai filtri.')}</h3><p>{tr('Clear one or more filters to restore the operating chain.','Azzera uno o più filtri per ripristinare la catena operativa.')}</p><button type="button" onClick={resetFilters}>{tr('Reset filters','Azzera i filtri')}</button></div>}

          <div lang="en" className={styles.mobileRail}>
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

        <Inspector lang={lang}
          feature={selectedFeature}
          onSelect={selectFeature}
          panelRef={inspectorRef}
          backTargetId={`mobile-stage-toggle-${selectedFeature.stageId}`}
        />
      </section>

      <section className={styles.changelog} aria-labelledby="changelog-chain-title">
        <header>
          <span>{tr('Compact changelog chain','Cronologia sintetica')}</span>
          <h2 id="changelog-chain-title">{tr('Release history through', 'Cronologia fino alla versione')} {POLICYWATCHER_VERSION_DISPLAY}</h2>
          <p>{tr('Select a milestone to isolate capabilities first represented in that release.','Seleziona una release per mostrare le funzioni introdotte in quella fase.')}</p>
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
        <div><span>{tr('Reading protocol','Criteri di lettura')}</span><h2>{tr('Claim verification procedure','Procedura di verifica delle affermazioni')}</h2></div>
        <p>{tr('Feature evidence identifies an implementation surface. Delivery state describes repository inventory, not availability in a specific deployment. AI-assisted signals remain text-derived attention cues, and public data routes apply the configured evidence gate.', 'L’evidenza di una funzione identifica un’implementazione. Lo stato descrive l’inventario del repository, non garantisce la disponibilità in uno specifico deployment. Le indicazioni AI derivano dal testo e i dati pubblici superano i controlli sulle evidenze.')}</p>
        <Link href={local('/methodology/confidence')}>Read methodology <ArrowRight size={15} /></Link>
      </section>

      <Footer lang={lang} lockLang />
      </main>
    </>
  );
}
