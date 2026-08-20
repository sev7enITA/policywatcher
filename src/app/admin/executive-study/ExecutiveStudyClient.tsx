'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, Clipboard, Database, ExternalLink, RotateCcw, Search, Table2 } from 'lucide-react';
import {
  formatInternalStudyCurrencyMillions,
  parseInternalStudyScenario,
  selectInternalStudyFinancialScenario,
  selectInternalStudyMarketScenario,
  type InternalStudyCardCopy,
  type InternalStudyPayload,
  type InternalStudyRow,
  type InternalStudyScenario,
} from '@/lib/internalExecutiveStudyTypes';
import styles from './executiveStudy.module.css';

type ExplorerMode = 'chapters' | 'datasets';
type FrameworkKey = 'swot' | 'vrio' | 'five_forces' | 'pestel' | 'strategic_alternatives';
type RiskSortKey = 'impact' | 'probability' | 'owner';

const scenarios: readonly InternalStudyScenario[] = ['low', 'base', 'high'];
const frameworkLabels: Record<FrameworkKey, string> = {
  swot: 'SWOT',
  vrio: 'VRIO',
  five_forces: 'Five Forces',
  pestel: 'PESTEL',
  strategic_alternatives: 'Alternatives',
};
const riskWeight: Record<string, number> = { Critical: 5, High: 4, 'Medium-high': 3, Medium: 2, Low: 1 };

function rowsFor(study: InternalStudyPayload, key: string): readonly InternalStudyRow[] {
  return study.datasets[key] ?? [];
}

function humanize(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayValue(value: string | number | undefined): string {
  return typeof value === 'number' ? new Intl.NumberFormat('en').format(value) : String(value ?? 'Not stated');
}

function SectionHeading({ id, number, eyebrow, title, body }: { id: string; number: string; eyebrow: string; title: string; body: string }) {
  return <header className={styles.sectionHeading}><span className={styles.sectionNumber}>{number}</span><div><p>{eyebrow}</p><h2 id={id}>{title}</h2><span>{body}</span></div></header>;
}

function EvidenceLabel({ kind }: { kind: 'Observed' | 'Directional' | 'Modeled' | 'Proposed' }) {
  return <span className={styles.evidenceLabel} data-kind={kind.toLowerCase()}>{kind}</span>;
}

function StudyTable({ rows, caption, compact = false }: { rows: readonly InternalStudyRow[]; caption: string; compact?: boolean }) {
  const columns = useMemo(() => [...new Set(rows.flatMap((row) => Object.keys(row)))], [rows]);
  if (!rows.length) return <p className={styles.emptyState}>No rows match this view.</p>;
  return (
    <div className={styles.tableScroller} data-compact={compact ? 'true' : 'false'} tabIndex={0}>
      <table className={styles.dataTable}>
        <caption>{caption}</caption>
        <thead><tr>{columns.map((column) => <th key={column} scope="col">{humanize(column)}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={`${caption}-${index}`}>{columns.map((column) => <td key={column}>{displayValue(row[column])}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function CardGrid({ items, className }: { items: readonly InternalStudyCardCopy[]; className: string }) {
  return <div className={className}>{items.map((item) => <article key={`${item.label}-${item.title}`}>{item.kind && <EvidenceLabel kind={item.kind} />}{item.value && <strong>{item.value}</strong>}<span>{item.label}</span><h3>{item.title}</h3><p>{item.body}</p>{item.bullets && <ul>{item.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}</article>)}</div>;
}

function InlineText({ value }: { value: string }) {
  const tokens = value.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g).filter(Boolean);
  return tokens.map((token, index) => {
    if (token.startsWith('**') && token.endsWith('**')) return <strong key={`${token}-${index}`}>{token.slice(2, -2)}</strong>;
    const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    return link ? <a key={`${token}-${index}`} href={link[2]} target="_blank" rel="noopener noreferrer">{link[1]} <ExternalLink size={12} aria-label="opens in a new tab" /></a> : token;
  });
}

function ChapterBody({ body }: { body: string }) {
  const nodes: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (!list.length) return;
    const items = list;
    list = [];
    nodes.push(<ul key={`list-${nodes.length}`}>{items.map((item, index) => <li key={`${item}-${index}`}><InlineText value={item} /></li>)}</ul>);
  };
  body.split('\n').filter((line) => line.trim()).forEach((line) => {
    const value = line.trim();
    if (/^([-*]|\d+\.)\s+/.test(value)) { list.push(value.replace(/^([-*]|\d+\.)\s+/, '')); return; }
    flush();
    if (value.startsWith('### ')) nodes.push(<h4 key={`h4-${nodes.length}`}>{value.slice(4)}</h4>);
    else if (value.startsWith('## ')) nodes.push(<h3 key={`h3-${nodes.length}`}>{value.slice(3)}</h3>);
    else if (!value.startsWith('# ')) nodes.push(<p key={`p-${nodes.length}`}><InlineText value={value} /></p>);
  });
  flush();
  return <div className={styles.chapterBody}>{nodes}</div>;
}

function seriesPath(values: readonly number[], width: number, height: number, min: number, max: number): string {
  const span = Math.max(max - min, 1);
  return values.map((value, index) => {
    const x = 48 + (index / Math.max(values.length - 1, 1)) * (width - 76);
    const y = 24 + ((max - value) / span) * (height - 60);
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

function FinancialTrajectory({ study }: { study: InternalStudyPayload }) {
  const rows = rowsFor(study, 'financials');
  const revenue = rows.map((row) => Number(row.revenue_eur_m));
  const ebitda = rows.map((row) => Number(row.ebitda_eur_m));
  const values = [...revenue, ...ebitda, 0].filter(Number.isFinite);
  const min = Math.floor(Math.min(...values));
  const max = Math.ceil(Math.max(...values));
  const span = Math.max(max - min, 1);
  const width = 760;
  const height = 300;
  const zeroY = 24 + ((max - 0) / span) * (height - 60);
  const c = study.copy.strings;

  return (
    <figure className={styles.chartFigure} aria-labelledby="financial-chart-title" aria-describedby="financial-chart-summary">
      <figcaption><div><span>{c.financialChartLabel}</span><h3 id="financial-chart-title">{c.financialChartTitle}</h3></div><p id="financial-chart-summary">{c.financialChartSummary}</p></figcaption>
      <div className={styles.legend} aria-hidden="true"><span data-series="revenue">Revenue</span><span data-series="ebitda">EBITDA</span></div>
      <p className={styles.chartSwipeCue}>Swipe horizontally to inspect the full trajectory. Exact values remain in the table.</p>
      <svg className={styles.financialSvg} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={c.financialChartAria}>
        <line x1="48" y1={zeroY} x2={width - 28} y2={zeroY} className={styles.zeroLine} />
        <path d={seriesPath(revenue, width, height, min, max)} className={styles.revenueLine} />
        <path d={seriesPath(ebitda, width, height, min, max)} className={styles.ebitdaLine} />
        {rows.map((row, index) => {
          const x = 48 + (index / Math.max(rows.length - 1, 1)) * (width - 76);
          const revenueY = 24 + ((max - revenue[index]) / span) * (height - 60);
          const ebitdaY = 24 + ((max - ebitda[index]) / span) * (height - 60);
          return <g key={String(row.year)}><circle cx={x} cy={revenueY} r="5" className={styles.revenuePoint} /><circle cx={x} cy={ebitdaY} r="5" className={styles.ebitdaPoint} /><text x={x} y={height - 9} textAnchor="middle" className={styles.yearLabel}>{row.year}</text><text x={x} y={revenueY - 10} textAnchor="middle" className={styles.valueLabel}>{row.revenue_eur_m}</text></g>;
        })}
      </svg>
      <footer><EvidenceLabel kind="Modeled" /> {c.financialChartCaveat}</footer>
    </figure>
  );
}

export default function ExecutiveStudyClient({ study, initialScenario }: { study: InternalStudyPayload; initialScenario: InternalStudyScenario }) {
  const [scenario, setScenario] = useState(initialScenario);
  const [copyStatus, setCopyStatus] = useState('');
  const [framework, setFramework] = useState<FrameworkKey>('swot');
  const [frameworkQuery, setFrameworkQuery] = useState('');
  const [competitorCategory, setCompetitorCategory] = useState('All');
  const [riskImpact, setRiskImpact] = useState('All');
  const [riskSort, setRiskSort] = useState<RiskSortKey>('impact');
  const [riskDescending, setRiskDescending] = useState(true);
  const [openGate, setOpenGate] = useState(0);
  const [explorerMode, setExplorerMode] = useState<ExplorerMode>('chapters');
  const [explorerQuery, setExplorerQuery] = useState('');
  const [selectedDataset, setSelectedDataset] = useState(() => Object.keys(study.datasets)[0] ?? '');
  const [sourceQuery, setSourceQuery] = useState('');
  const c = study.copy.strings;

  useEffect(() => {
    const sync = () => setScenario(parseInternalStudyScenario(new URL(window.location.href).searchParams.get('scenario')));
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  const applyScenario = (next: InternalStudyScenario) => {
    setScenario(next);
    const url = new URL(window.location.href);
    url.searchParams.set('scenario', next);
    window.history.replaceState({ ...window.history.state, internalStudyScenario: next }, '', url);
  };
  const copyView = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopyStatus('Internal URL copied. Authorization is still required.'); }
    catch { setCopyStatus('Copy unavailable. Use the address bar to copy this internal URL.'); }
    window.setTimeout(() => setCopyStatus(''), 3000);
  };

  const { rows: marketRows, tam, sam, som } = selectInternalStudyMarketScenario(
    rowsFor(study, 'market_sizing_scenarios'),
    scenario,
  );
  const financial = selectInternalStudyFinancialScenario(
    rowsFor(study, 'financial_scenarios'),
    scenario,
  ) ?? {};
  const frameworkRows = rowsFor(study, framework).filter((row) => !frameworkQuery || Object.values(row).some((value) => String(value).toLowerCase().includes(frameworkQuery.toLowerCase())));
  const competitors = rowsFor(study, 'competitive_position');
  const competitorCategories = ['All', ...new Set(competitors.map((row) => String(row.category)))];
  const filteredCompetitors = competitors.filter((row) => competitorCategory === 'All' || row.category === competitorCategory);
  const riskRows = rowsFor(study, 'risk_register').filter((row) => riskImpact === 'All' || row.impact === riskImpact);
  const sortedRisks = [...riskRows].sort((left, right) => {
    const leftValue = displayValue(left[riskSort]);
    const rightValue = displayValue(right[riskSort]);
    const result = riskSort === 'owner' ? leftValue.localeCompare(rightValue) : (riskWeight[leftValue] ?? 0) - (riskWeight[rightValue] ?? 0);
    return riskDescending ? -result : result;
  });
  const datasetKeys = Object.keys(study.datasets).filter((key) => !explorerQuery || humanize(key).toLowerCase().includes(explorerQuery.toLowerCase()) || rowsFor(study, key).some((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(explorerQuery.toLowerCase()))));
  const chapters = study.chapters.filter((chapter) => !explorerQuery || chapter.id.includes(explorerQuery.toLowerCase()) || chapter.body.toLowerCase().includes(explorerQuery.toLowerCase()));
  const sources = study.sources.filter((source) => !sourceQuery || `${source.id} ${source.label}`.toLowerCase().includes(sourceQuery.toLowerCase()));

  return <>
    <section id="decision-desk" className={styles.decisionDesk} aria-labelledby="decision-heading">
      <SectionHeading id="decision-heading" number="01" eyebrow={c.decisionEyebrow} title={c.decisionTitle} body={c.decisionBody} />
      <div className={styles.scenarioToolbar}>
        <div className={styles.scenarioControl} role="group" aria-label="Management scenario">{scenarios.map((value) => <button key={value} type="button" aria-pressed={scenario === value} onClick={() => applyScenario(value)}>{humanize(value)}<small>{value === 'base' ? 'Operating case' : value === 'low' ? 'Downside' : 'Upside'}</small></button>)}</div>
        <button type="button" className={styles.copyButton} onClick={copyView}><Clipboard size={16} aria-hidden="true" /> Copy internal URL</button>
        <span className={styles.liveRegion} role="status" aria-live="polite">{copyStatus || `${humanize(scenario)} management case selected.`}</span>
      </div>
      <div className={styles.decisionChain}>
        <article><span>{c.decisionAssumptionLabel}</span><strong>{displayValue(tam?.fit_share)}</strong><p>{displayValue(tam?.account_pool)}</p><EvidenceLabel kind="Modeled" /></article>
        <article><span>{c.decisionOpportunityLabel}</span><strong>{formatInternalStudyCurrencyMillions(Number(tam?.opportunity_eur_m ?? 0))}</strong><p>{formatInternalStudyCurrencyMillions(Number(sam?.opportunity_eur_m ?? 0))}</p><EvidenceLabel kind="Modeled" /></article>
        <article><span>{c.decisionOutcomeLabel}</span><strong>{displayValue(financial.customers)}</strong><p>{displayValue(financial.revenue_eur_m)} / {displayValue(financial.ebitda_eur_m)}</p><EvidenceLabel kind="Modeled" /></article>
        <article className={styles.capitalNode}><span>{c.decisionCapitalLabel}</span><strong>{displayValue(financial.capital_need_eur_m)}</strong><p>{study.copy.scenarioInterpretation[scenario]}</p><EvidenceLabel kind="Modeled" /></article>
        <article className={styles.gateNode}><span>{c.decisionGateLabel}</span><strong>{c.decisionGateTitle}</strong><p>{c.decisionGateBody}</p><EvidenceLabel kind="Proposed" /></article>
      </div>
    </section>

    <section className={styles.thesisSection} aria-labelledby="thesis-heading"><div className={styles.sectionIntro}><span>{c.thesisEyebrow}</span><h2 id="thesis-heading">{c.thesisTitle}</h2><p>{c.thesisBody}</p></div><CardGrid items={study.copy.thesisItems} className={styles.thesisLedger} /><aside className={styles.methodologyNote}>{study.copy.methodologyItems.map((item) => <div key={item.label}><span>{item.label}</span><p>{item.body}</p></div>)}</aside></section>

    <section id="market" className={styles.studySection} aria-labelledby="market-heading">
      <SectionHeading id="market-heading" number="02" eyebrow={c.marketEyebrow} title={c.marketTitle} body={c.marketBody} />
      <div className={styles.marketGrid}><div className={styles.marketBars}>{([{ key: 'tam', label: 'TAM', row: tam }, { key: 'sam', label: 'SAM', row: sam }, { key: 'som', label: 'SOM', row: som }] as const).filter((item) => item.row).map((item) => <article key={item.key}><span>{item.label}</span><strong>{formatInternalStudyCurrencyMillions(Number(item.row?.opportunity_eur_m ?? 0))}</strong><p>{displayValue(item.row?.scope)}</p></article>)}<footer>{c.marketFootnote}</footer></div><aside className={styles.marketTakeaway}><span>{c.marketWarningLabel}</span><h3>{c.marketWarningTitle}</h3><p>{c.marketWarningBody}</p><strong>{c.marketWarningConclusion}</strong></aside></div>
      <StudyTable rows={marketRows} caption="Selected market scenario" />
      <div className={styles.competitorExplorer}><div className={styles.explorerFilters}><label>Category<select value={competitorCategory} onChange={(event) => setCompetitorCategory(event.target.value)}>{competitorCategories.map((category) => <option key={category}>{category}</option>)}</select></label></div><StudyTable rows={filteredCompetitors} caption="Competitive positions" /><details><summary>Complete landscape <ChevronDown size={16} /></summary><StudyTable rows={rowsFor(study, 'competition')} caption="Competitive landscape" /></details></div>
    </section>

    <section id="strategy" className={styles.studySection} aria-labelledby="strategy-heading"><SectionHeading id="strategy-heading" number="03" eyebrow={c.strategyEyebrow} title={c.strategyTitle} body={c.strategyBody} /><div className={styles.frameworkConsole}><div className={styles.frameworkTabs} role="tablist" aria-label="Strategy framework">{(Object.keys(frameworkLabels) as FrameworkKey[]).map((key) => <button key={key} type="button" role="tab" aria-selected={framework === key} onClick={() => setFramework(key)}>{frameworkLabels[key]}</button>)}</div><label className={styles.searchField}><Search size={17} /><span className={styles.srOnly}>Search framework</span><input value={frameworkQuery} onChange={(event) => setFrameworkQuery(event.target.value)} placeholder="Search framework evidence" /></label><StudyTable rows={frameworkRows} caption={`${frameworkLabels[framework]} analysis`} /></div></section>

    <section id="business-model" className={styles.studySection} aria-labelledby="business-heading"><SectionHeading id="business-heading" number="04" eyebrow={c.businessEyebrow} title={c.businessTitle} body={c.businessBody} /><CardGrid items={study.copy.businessColumns} className={styles.businessColumns} /><div className={styles.dualDisclosure}>{[['value_proposition', 'Value Proposition Canvas'], ['business_model', 'Business Model Canvas'], ['pricing', 'Pricing model'], ['go_to_market', 'Go-to-market program']].map(([key, label]) => <details key={key}><summary>{label} <ChevronDown size={16} /></summary><StudyTable rows={rowsFor(study, key)} caption={label} /></details>)}</div></section>

    <section id="product-governance" className={styles.studySection} aria-labelledby="product-heading"><SectionHeading id="product-heading" number="05" eyebrow={c.productEyebrow} title={c.productTitle} body={c.productBody} /><CardGrid items={study.copy.readinessCards} className={styles.readinessLedger} /><div className={styles.governancePanels}>{[['product_readiness', 'Current readiness and gaps'], ['architecture', 'Target architecture'], ['ai_governance', 'AI and data governance'], ['regulatory_boundary', 'Regulatory and legal boundary']].map(([key, label], index) => <details key={key} open={index === 0 ? true : undefined}><summary>{label} <ChevronDown size={16} /></summary><StudyTable rows={rowsFor(study, key)} caption={label} /></details>)}</div><aside className={styles.nonAdvice}><div><strong>{c.nonAdviceTitle}</strong><p>{c.nonAdviceBody}</p></div></aside></section>

    <section id="financial-plan" className={styles.studySection} aria-labelledby="financial-heading"><SectionHeading id="financial-heading" number="06" eyebrow={c.financialEyebrow} title={c.financialTitle} body={c.financialBody} /><FinancialTrajectory study={study} /><div className={styles.financialTableWrap}><StudyTable rows={rowsFor(study, 'financials')} caption={c.financialChartTitle} /></div><div className={styles.financialDetails}>{[['cash_flow', 'Cash flow and funding bridge'], ['unit_economics', 'Unit economics targets'], ['staffing', 'Staffing plan'], ['financial_scenarios', 'Scenario comparison']].map(([key, label]) => <details key={key}><summary>{label} <ChevronDown size={16} /></summary><StudyTable rows={rowsFor(study, key)} caption={label} /></details>)}</div></section>

    <section id="validation" className={styles.studySection} aria-labelledby="validation-heading"><SectionHeading id="validation-heading" number="07" eyebrow={c.validationEyebrow} title={c.validationTitle} body={c.validationBody} /><ol className={styles.gatePath}>{rowsFor(study, 'roadmap').map((gate, index) => { const open = openGate === index; return <li key={String(gate.window)} data-open={open ? 'true' : 'false'}><button type="button" aria-expanded={open} onClick={() => setOpenGate(open ? -1 : index)}><span>{String(index).padStart(2, '0')}</span><div><small>{gate.window} / {gate.workstream}</small><strong>{gate.deliverable}</strong></div><ChevronDown size={18} /></button>{open && <div className={styles.gateDetail}><p><b>Evidence required</b>{gate.gate}</p><p><b>Decision rule</b>{gate.investment_decision}</p></div>}</li>; })}</ol><div className={styles.validationTables}>{[['hypotheses', 'Falsifiable hypotheses'], ['test_cards', 'Lean test cards'], ['lean_evidence', 'Evidence status']].map(([key, label]) => <details key={key}><summary>{label} <ChevronDown size={16} /></summary><StudyTable rows={rowsFor(study, key)} caption={label} /></details>)}</div></section>

    <section id="risks" className={styles.studySection} aria-labelledby="risk-heading"><SectionHeading id="risk-heading" number="08" eyebrow={c.riskEyebrow} title={c.riskTitle} body={c.riskBody} /><div className={styles.riskToolbar}><label>Impact<select value={riskImpact} onChange={(event) => setRiskImpact(event.target.value)}><option>All</option><option>Critical</option><option>High</option><option>Medium-high</option></select></label><label>Sort<select value={riskSort} onChange={(event) => setRiskSort(event.target.value as RiskSortKey)}><option value="impact">Impact</option><option value="probability">Probability</option><option value="owner">Owner</option></select></label><button type="button" onClick={() => setRiskDescending((value) => !value)}>{riskDescending ? '↓ Descending' : '↑ Ascending'}</button><button type="button" onClick={() => setRiskImpact('All')}><RotateCcw size={15} /> Reset</button><p role="status" aria-live="polite">{riskRows.length} risks</p></div><StudyTable rows={sortedRisks} caption="Risk register" /></section>

    <section id="full-study" className={styles.studySection} aria-labelledby="explorer-heading"><SectionHeading id="explorer-heading" number="09" eyebrow={c.explorerEyebrow} title={c.explorerTitle} body={c.explorerBody} /><div className={styles.explorerToolbar}><div role="tablist" aria-label="Study explorer mode"><button type="button" role="tab" aria-selected={explorerMode === 'chapters'} onClick={() => setExplorerMode('chapters')}><Database size={16} /> Chapters</button><button type="button" role="tab" aria-selected={explorerMode === 'datasets'} onClick={() => setExplorerMode('datasets')}><Table2 size={16} /> Datasets</button></div><label className={styles.searchField}><Search size={17} /><span className={styles.srOnly}>Search study</span><input value={explorerQuery} onChange={(event) => setExplorerQuery(event.target.value)} placeholder={`Search ${explorerMode}`} /></label></div>{explorerMode === 'chapters' ? <div className={styles.chapterExplorer}><p>{chapters.length} chapters match.</p>{chapters.map((chapter) => <details key={chapter.id}><summary>{humanize(chapter.id)} <ChevronDown size={17} /></summary><ChapterBody body={chapter.body} /></details>)}</div> : <div className={styles.datasetExplorer}><aside aria-label="Dataset list"><span>{datasetKeys.length} datasets match.</span>{datasetKeys.map((key) => <button key={key} type="button" aria-pressed={selectedDataset === key} onClick={() => setSelectedDataset(key)}>{humanize(key)}<small>{rowsFor(study, key).length} rows</small></button>)}</aside><div><h3>{humanize(selectedDataset)}</h3><StudyTable rows={rowsFor(study, selectedDataset)} caption={humanize(selectedDataset)} compact /></div></div>}</section>

    <section id="sources" className={styles.studySection} aria-labelledby="sources-heading"><SectionHeading id="sources-heading" number="10" eyebrow={c.sourcesEyebrow} title={c.sourcesTitle} body={c.sourcesBody} /><label className={styles.searchField}><Search size={17} /><span className={styles.srOnly}>Search sources</span><input value={sourceQuery} onChange={(event) => setSourceQuery(event.target.value)} placeholder="Search source ledger" /></label><div className={styles.sourceLedger}>{sources.map((source, index) => <article key={source.id}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{source.label}</h3><p>{source.href ? 'External source' : 'Internal evidence snapshot'}</p></div>{source.href ? <a href={source.href} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /> Open</a> : <small>Restricted source</small>}</article>)}</div><aside className={styles.methodologyNote}>{study.copy.methodologyItems.map((item) => <div key={item.label}><span>{item.label}</span><p>{item.body}</p></div>)}</aside></section>
  </>;
}
