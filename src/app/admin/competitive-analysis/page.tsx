import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { unstable_noStore as noStore } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { CompetitiveConfidence } from '@/lib/competitiveAnalysis';
import { COOKIE_NAME, verifySessionToken } from '@/lib/adminAuth';
import { recordCompetitiveSnapshot } from './actions';
import styles from './competitive-analysis.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'Competitive Analysis | PolicyWatcher Admin',
  description: 'Internal competitive assessment with live metrics and an audit trail.',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
    googleBot: { index: false, follow: false, noarchive: true, noimageindex: true },
  },
};

const longDate = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/Rome',
});
const shortDate = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Europe/Rome',
});

function formatDate(value: string | null): string {
  if (!value) return 'Unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unavailable' : longDate.format(date);
}

function formatShortDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : shortDate.format(date);
}

function score(value: number | null, suffix = ''): string {
  return value === null ? '\u2014' : `${value.toLocaleString('en-GB', { maximumFractionDigits: 1 })}${suffix}`;
}

function signed(value: number | null, suffix = ''): string {
  if (value === null) return '\u2014';
  return `${value > 0 ? '+' : ''}${value.toLocaleString('en-GB', { maximumFractionDigits: 1 })}${suffix}`;
}

function pct(value: number | null, denominator: number | null): number | null {
  if (value === null || denominator === null || denominator <= 0) return null;
  return Math.min(100, Math.round(value / denominator * 100));
}

function confidenceLabel(value: CompetitiveConfidence): string {
  return { alta: 'High', media: 'Medium', bassa: 'Low' }[value];
}

function evidenceLabel(value: string): string {
  if (value === 'measured') return 'Measured';
  if (value === 'verified-capability') return 'Verified capability';
  if (value === 'observed') return 'Observed';
  if (value === 'unverified') return 'Unverified';
  return 'Unavailable';
}

export default async function CompetitiveAnalysisPage({ searchParams }: { searchParams: Promise<{ snapshot?: string | string[] }> }) {
  noStore();

  // Check the session before loading or serialising private benchmark data.
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(COOKIE_NAME)?.value);
  if (!session.valid || (session.role !== 'admin' && session.role !== 'auditor')) redirect('/admin/login');

  const { loadCompetitiveAnalysis } = await import('@/lib/competitiveAnalysisServer');
  const analysis = await loadCompetitiveAnalysis('en');
  const decisionLanes = [
    { number: 'A', title: 'Protect', summary: 'Controls that underpin trust in the product.', tone: 'protect', items: ['Fail-closed publication', 'Retrieval diagnostics and remediation', 'AI EvalOps with human approval', 'English and Italian, European and civic focus'] },
    { number: 'B', title: 'Close gaps', summary: 'The gap between collected evidence and usable search.', tone: 'close', items: ['Provision-level model and stable identifiers', 'Reconciled coverage figures', 'Natural-language retrieval with citations', 'PostgreSQL and object storage before multi-tenancy'] },
    { number: 'C', title: 'Avoid', summary: 'Shortcuts that undermine trust.', tone: 'avoid', items: ['Coverage claims without a denominator', 'Enterprise promises without operational evidence', 'Vanity metrics that obscure depth of coverage', 'Legal certainty based on AI alone'] },
  ] as const;
  const actionPlan = [
    { number: '01', title: 'Canonical coverage contract', body: 'Bring the configured, retrieved, baseline, public and analysed counts together with the last successful capture.', evidence: 'Use the same denominators and timestamps across Admin, Trust, the API and release reporting.' },
    { number: '02', title: 'Pilot the provision schema', body: 'Model the first clause families with stable identifiers linked to the versioned source.', evidence: 'Identifiers survive reprocessing and can be cited.' },
    { number: '03', title: 'Milestone for a focused corpus', body: 'Define the EU and Italian scope for AI and fintech so coverage and exceptions can be published.', evidence: 'A signed register lists included, excluded and blocked entries and their last verification.' },
    { number: '04', title: 'Retrieval with citations', body: 'Introduce clause search and comparison after provision-level QA passes.', evidence: 'Every answer links back to the provision, version, capture and official source.' },
  ] as const;
  const externalSources = [
    { label: 'Product overview', href: 'https://conductatlas.com/' },
    { label: 'Methodology', href: 'https://conductatlas.com/methodology/' },
    { label: 'Provision registry', href: 'https://conductatlas.com/registry/' },
    { label: 'Natural-language search', href: 'https://conductatlas.com/ask/' },
    { label: 'Pricing', href: 'https://conductatlas.com/pricing/' },
    { label: 'API and Enterprise', href: 'https://conductatlas.com/enterprise/' },
  ] as const;
  const params = await searchParams;
  const snapshotState = Array.isArray(params.snapshot) ? params.snapshot[0] : params.snapshot;
  const evaluation = analysis.evaluation;
  const configured = analysis.metrics.values.configuredPolicies.value;
  const benchmarkIndex = evaluation?.conductAtlasIndex ?? Math.round(
    analysis.dimensionCatalog.reduce((sum, dimension) => sum + analysis.benchmark.dimensions[dimension.id].score / 5 * dimension.weight, 0),
  );
  const fallbackAxes = (['market', 'evidence', 'operations'] as const).map((axisId) => {
    const dimensions = analysis.dimensionCatalog.filter((dimension) => dimension.axis === axisId);
    const weight = dimensions.reduce((sum, dimension) => sum + dimension.weight, 0);
    return {
      id: axisId,
      label: analysis.axisLabels[axisId],
      policyWatcherIndex: null,
      conductAtlasIndex: Math.round(dimensions.reduce((sum, dimension) => sum + analysis.benchmark.dimensions[dimension.id].score / 5 * dimension.weight, 0) / weight * 100),
      delta: null,
      coverage: 0,
    };
  });
  const axes = evaluation?.axes ?? fallbackAxes;
  const matrixRows = evaluation?.dimensions ?? analysis.dimensionCatalog.map((dimension) => ({
    ...dimension,
    policyWatcher: { score: null, confidence: 'bassa' as const, evidenceState: 'unavailable' as const, evidence: 'The operational database is unavailable.', calculation: 'The score excludes the weight for missing data.' },
    conductAtlas: { score: analysis.benchmark.dimensions[dimension.id].score, confidence: analysis.benchmark.dimensions[dimension.id].confidence, evidenceState: analysis.benchmark.dimensions[dimension.id].evidenceState, evidence: analysis.benchmark.dimensions[dimension.id].evidence, calculation: analysis.benchmark.dimensions[dimension.id].calculation },
    delta: null,
    weightedGap: null,
    comparability: 'unavailable' as const,
  }));
  const funnel = [
    { label: 'Configured', key: 'configuredPolicies' },
    { label: 'Retrieved', key: 'retrievedPolicies' },
    { label: 'Baseline verified', key: 'baselineVerifiedPolicies' },
    { label: 'Public', key: 'publicPolicies' },
    { label: 'Analysed', key: 'analysedPolicies' },
  ] as const;
  const snapshotNotice = snapshotState === 'created' ? 'Snapshot recorded in the audit ledger.'
    : snapshotState === 'unchanged' ? 'An identical snapshot is already on record.'
      : snapshotState === 'forbidden' ? 'Auditors have read-only access to snapshots.'
        : snapshotState === 'unavailable' ? 'Snapshot unavailable because essential metrics are missing.'
          : snapshotState === 'error' ? 'The ledger could not save the snapshot. The current assessment is still available.' : null;

  return (
    <article className={styles.page} data-competitive-analysis="true">
      <aside className={styles.confidentialityBand} role="note" aria-label="Confidentiality notice">
        <div><strong>Internal competitive intelligence</strong><span>Restricted to authenticated Admin and Auditor roles. Keep these indices internal.</span></div>
        <span className={styles.roleSeal}>{session.role === 'admin' ? 'Admin' : 'Auditor'} · {session.role === 'admin' ? 'read and record snapshots' : 'read only'}</span>
      </aside>

      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Live assessment · recalculated {formatDate(analysis.metrics.checkedAt)}</p>
          <h1>PolicyWatcher <span aria-hidden="true">×</span><span className={styles.srOnly}>compared with</span> ConductAtlas</h1>
          <p className={styles.heroLead}>A directional index calculated from PolicyWatcher operational data and compared with a dated, versioned benchmark based on public ConductAtlas sources.</p>
          <dl className={styles.heroMeta}>
            <div><dt>Build</dt><dd>{analysis.buildLabel}</dd></div>
            <div><dt>Method</dt><dd>{evaluation?.methodologyVersion ?? 'policywatcher-competitive-methodology.v1'}</dd></div>
            <div><dt>Benchmark</dt><dd>ConductAtlas · observed on {formatShortDate(analysis.benchmark.observedAt)}</dd></div>
            <div><dt>Latest retrieval</dt><dd>{formatDate(analysis.metrics.latestSuccessfulAt)}</dd></div>
          </dl>
        </div>
        <aside className={styles.verdict} aria-label="Current position overview">
          <span>Current position</span>
          <div className={styles.scoreBoard}>
            <div className={styles.primaryScore}><small>PolicyWatcher</small><strong>{score(evaluation?.policyWatcherIndex ?? null)}</strong><span>/ 100 · {evaluation?.label ?? 'Unavailable'}</span></div>
            <dl>
              <div><dt>ConductAtlas</dt><dd>{score(benchmarkIndex)} / 100</dd></div>
              <div><dt>Score difference</dt><dd>{signed(evaluation?.delta ?? null, ' pt')}</dd></div>
              <div><dt>Score coverage</dt><dd>{score(evaluation?.coverage ?? 0, '%')}</dd></div>
              <div><dt>Confidence</dt><dd>{evaluation ? confidenceLabel(evaluation.confidence) : 'Unavailable'}</dd></div>
            </dl>
          </div>
          <div className={styles.heroActions}>
            {session.role === 'admin' ? <form action={recordCompetitiveSnapshot}><button className={styles.snapshotButton} type="submit" disabled={!analysis.currentSnapshot}>Record snapshot</button></form> : <p className={styles.auditorNote}>Auditors have read-only access to scores and history.</p>}
            <a className={styles.recalculateLink} href="/admin/competitive-analysis">Recalculate now</a>
          </div>
          {snapshotNotice && <p className={styles.saveNotice} role="status">{snapshotNotice}</p>}
        </aside>
      </header>

      <nav className={styles.sectionIndex} aria-label="Competitive assessment sections">
        <span>Live assessment</span><div><a href="#radar">01 Radar</a><a href="#funnel">02 Funnel</a><a href="#matrix">03 Matrix</a><a href="#trend">04 Trend</a><a href="#impacts">05 Priorities</a><a href="#decisions">06 Decisions</a><a href="#evidence">07 Limitations</a></div>
      </nav>

      <div className={styles.memoBody}>
        {analysis.metrics.status !== 'available' && (
          <aside className={styles.availabilityNotice} role="status">
            <strong>{analysis.metrics.status === 'unavailable' ? 'PolicyWatcher assessment unavailable' : 'Partial PolicyWatcher assessment'}</strong>
            <p>{analysis.metrics.status === 'unavailable' ? 'The ConductAtlas benchmark is available. Missing PolicyWatcher data is shown as unavailable.' : 'Dimensions with missing data are excluded from the denominator and reduce score coverage.'}</p>
          </aside>
        )}

        <section id="radar" className={styles.section} aria-labelledby="radar-heading">
          <div className={styles.sectionHeading}><span>01 · Operational comparison</span><div><h2 id="radar-heading">Score differences by axis</h2><p>The centre marks parity. The distance and direction show where each product leads, with values readable without colour.</p></div></div>
          <figure className={styles.gapSpine}>
            <figcaption className={styles.srOnly}>Accessible comparison of the three axes for PolicyWatcher and ConductAtlas</figcaption>
            <div className={styles.spineHeader}><span>−100 · ConductAtlas leads</span><strong>Parity</strong><span>+100 · PolicyWatcher leads</span></div>
            {axes.map((axis, index) => {
              const delta = axis.delta === null ? null : Math.max(-100, Math.min(100, axis.delta));
              return (
                <article className={styles.axisRow} key={axis.id}>
                  <div className={styles.axisIdentity}><span>0{index + 1}</span><div><h3>{axis.label}</h3><small>Coverage {score(axis.coverage, '%')}</small></div></div>
                  <div className={styles.axisGraphic}>
                    <div className={`${styles.axisScale} ${delta === null ? styles.axisScaleUnavailable : ''}`} aria-hidden="true">
                      {delta !== null && <><span className={styles.axisZero} /><span className={styles.axisNeedle} style={{ '--gap-position': `${50 + delta / 2}%` } as CSSProperties} /></>}
                    </div>
                    {delta === null && <span className={styles.axisUnavailableLabel}>Score difference unavailable</span>}
                  </div>
                  <dl><div><dt>PW</dt><dd>{score(axis.policyWatcherIndex)}</dd></div><div><dt>CA</dt><dd>{score(axis.conductAtlasIndex)}</dd></div><div><dt>Δ</dt><dd>{signed(axis.delta)}</dd></div></dl>
                </article>
              );
            })}
          </figure>
          <p className={styles.methodBoundary}>{evaluation?.boundary ?? 'The PolicyWatcher index is unavailable. The benchmark uses dated public observations of ConductAtlas.'}</p>
        </section>

        <section id="funnel" className={`${styles.section} ${styles.funnelSection}`} aria-labelledby="funnel-heading">
          <div className={styles.sectionHeading}><span>02 · Live funnel</span><div><h2 id="funnel-heading">From configuration to public analysis</h2><p>Each stage uses persisted data from the same point in time. The <code>waze</code> test entry is excluded.</p></div></div>
          <ol className={styles.liveFunnel}>
            {funnel.map((stage, index) => {
              const metric = analysis.metrics.values[stage.key];
              const percentage = pct(metric.value, configured);
              const rateLabel = metric.state === 'unavailable'
                ? analysis.publicationStageReasons[stage.key] ?? 'Publication readiness metrics are unavailable.'
                : percentage === null ? 'Percentage unavailable because the denominator is missing.' : `${percentage}% of configured policies`;
              return <li key={stage.key} className={percentage === null ? styles.missingStage : undefined}><span className={styles.funnelNumber}>0{index + 1}</span><div><h3>{stage.label}</h3><p>{rateLabel}</p></div><strong>{metric.value ?? '\u2014'}</strong><div className={`${styles.funnelTrack} ${percentage === null ? styles.unavailableTrack : ''}`} aria-hidden="true">{percentage !== null && <span style={{ width: `${percentage}%` }} />}</div></li>;
            })}
          </ol>
          <dl className={styles.metricLedger}>
            <div><dt>Companies / sectors</dt><dd>{score(analysis.metrics.values.companies.value)} / {score(analysis.metrics.values.sectors.value)}</dd></div>
            <div><dt>Total / public snapshots</dt><dd>{score(analysis.metrics.values.snapshotsTotal.value)} / {score(analysis.metrics.values.snapshotsPublic.value)}</dd></div>
            <div><dt>Total / public changes</dt><dd>{score(analysis.metrics.values.changesTotal.value)} / {score(analysis.metrics.values.changesPublic.value)}</dd></div>
            <div><dt>Refreshed in the past 30 days</dt><dd>{score(analysis.metrics.values.freshPolicies30d.value)}</dd></div>
            <div><dt>Open remediation issues</dt><dd>{score(analysis.metrics.values.openRemediations.value)}</dd></div>
            <div><dt>Snapshot depth per policy</dt><dd>{score(analysis.metrics.values.snapshotDepth.value)}</dd></div>
          </dl>
        </section>

        <section id="matrix" className={`${styles.section} ${styles.matrixSection}`} aria-labelledby="matrix-heading">
          <div className={styles.sectionHeading}><span>03 · Live comparison matrix</span><div><h2 id="matrix-heading">Eleven dimensions and their formulas</h2><p>Scores use a 0–5 rubric. ConductAtlas scores come from a dated public benchmark.</p></div></div>
          <div className={styles.evidenceLegend} aria-label="Evidence status legend"><span className={styles.observed}>Measured or observed</span><span className={styles.assessment}>Verified capability</span><span className={styles.unverified}>Unverified</span></div>
          <p className={styles.scrollCue}>Scroll horizontally to see formulas and evidence on smaller screens.</p>
          <div className={styles.tableScroller} tabIndex={0} role="region" aria-label="Scrollable competitive scores table">
            <table className={styles.comparisonTable}>
              <caption className={styles.srOnly}>PolicyWatcher scores and ConductAtlas benchmark by dimension</caption>
              <thead><tr><th scope="col">Dimension</th><th scope="col">PW / CA</th><th scope="col">Δ / weight</th><th scope="col">PolicyWatcher evidence</th><th scope="col">ConductAtlas benchmark</th></tr></thead>
              <tbody>{matrixRows.map((row, index) => <tr key={row.id}><th scope="row"><span className={styles.rowNumber}>{String(index + 1).padStart(2, '0')}</span><strong>{row.label}</strong><small>{analysis.axisLabels[row.axis]}</small></th><td><strong className={styles.matrixScore}>{score(row.policyWatcher.score)} <span>/</span> {score(row.conductAtlas.score)}</strong><small>{row.comparability === 'comparable' ? 'Comparable' : 'Weight excluded'}</small></td><td><strong>{signed(row.delta)}</strong><small>Weight {row.weight}%</small></td><td><span className={styles.evidenceTag}>{evidenceLabel(row.policyWatcher.evidenceState)} · confidence {confidenceLabel(row.policyWatcher.confidence)}</span><p>{row.policyWatcher.evidence}</p><details><summary>Formula or rubric</summary><p>{row.policyWatcher.calculation}</p></details></td><td><span className={styles.evidenceTag}>{evidenceLabel(row.conductAtlas.evidenceState)} · confidence {confidenceLabel(row.conductAtlas.confidence)}</span><p>{row.conductAtlas.evidence}</p><details><summary>Benchmark scope</summary><p>{row.conductAtlas.calculation}</p></details></td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section id="trend" className={styles.section} aria-labelledby="trend-heading">
          <div className={styles.sectionHeading}><span>04 · Audit history</span><div><h2 id="trend-heading">Recorded snapshots</h2><p>Each snapshot records the method, benchmark, metrics and scores at the time it was recorded.</p></div></div>
          {analysis.historyStatus === 'unavailable' ? <div className={styles.emptyTrend}><strong>History unavailable</strong><p>The audit ledger is unavailable. The current assessment is still available.</p></div>
            : analysis.history.length === 0 ? <div className={styles.emptyTrend}><strong>No snapshots recorded</strong><p>An administrator can record the current state to start an audit history.</p></div>
              : <ol className={styles.trendTimeline}>{analysis.history.map((item, index) => <li key={item.fingerprint}><span className={styles.trendNode} aria-hidden="true" /><div><span>{String(analysis.history.length - index).padStart(2, '0')}</span><time dateTime={item.checkedAt}>{formatDate(item.checkedAt)}</time><code>{item.methodologyVersion} · {item.fingerprint.slice(0, 12)}</code></div><dl><div><dt>PW</dt><dd>{score(item.policyWatcherIndex)}</dd></div><div><dt>CA</dt><dd>{score(item.conductAtlasIndex)}</dd></div><div><dt>Δ</dt><dd>{signed(item.delta)}</dd></div><div><dt>Coverage</dt><dd>{score(item.coverage, '%')}</dd></div></dl></li>)}</ol>}
          {analysis.history.length === 1 && <p className={styles.singleTrend}>A trend requires at least two distinct recorded states. One is available.</p>}
        </section>

        <section id="impacts" className={styles.section} aria-labelledby="impacts-heading">
          <div className={styles.sectionHeading}><span>05 · Priority gaps</span><div><h2 id="impacts-heading">Priorities by weighted gap</h2><p>Priorities reflect the current score and inform roadmap decisions.</p></div></div>
          {analysis.priorities.length === 0 ? <div className={styles.emptyTrend}><strong>Live priorities unavailable</strong><p>Ranking requires comparable metrics.</p></div>
            : <ol className={styles.priorityList}>{analysis.priorities.map((priority) => <li key={priority.id}><span className={styles.priorityRank}>{String(priority.rank).padStart(2, '0')}</span><div><h3>{priority.title}</h3><p>Gap {score(priority.gap, '/5')} · weighted impact {score(priority.weightedGap)}</p></div><div><span>Measurable target</span><p>{priority.target}</p></div><div><span>Calculation basis</span><p>{priority.action}</p></div>{priority.href && <a href={priority.href}>Open admin console <span aria-hidden="true">→</span></a>}</li>)}</ol>}
        </section>

        <section id="decisions" className={styles.section} aria-labelledby="decisions-heading">
          <div className={styles.sectionHeading}><span>06 · Direction and 90-day plan</span><div><h2 id="decisions-heading">Protect strengths and close gaps</h2><p>The strategy explains how to use the live metrics and sets limits on their interpretation.</p></div></div>
          <div className={styles.decisionLanes}>{decisionLanes.map((lane) => <article key={lane.title} className={styles[lane.tone]}><header><span>{lane.number}</span><div><h3>{lane.title}</h3><p>{lane.summary}</p></div></header><ol>{lane.items.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, '0')}</span>{item}</li>)}</ol></article>)}</div>
          <ol className={styles.actionMap}>{actionPlan.map((action) => <li key={action.number}><span className={styles.actionNumber}>{action.number}</span><div><h3>{action.title}</h3><p>{action.body}</p></div><aside><span>Success criteria</span><p>{action.evidence}</p></aside></li>)}</ol>
          <aside className={styles.decisionGate} aria-label="90-day decision criteria"><span>Decision criteria</span><p>A commercial workspace depends on production verification of the data model and canonical coverage contract.</p></aside>
        </section>

        <section id="evidence" className={`${styles.section} ${styles.evidenceSection}`} aria-labelledby="evidence-heading">
          <div className={styles.sectionHeading}><span>07 · Evidence and limitations</span><div><h2 id="evidence-heading">Sources and interpretation</h2><p>PolicyWatcher uses live data. The ConductAtlas benchmark reflects public observations from 19 August 2026.</p></div></div>
          <div className={styles.ledgers}>
            <article><header><span>Repository and operational data</span><h3>PolicyWatcher evidence</h3></header><ol>{['src/lib/competitiveAnalysis.ts', 'src/lib/competitiveAnalysisServer.ts', 'prisma/schema.prisma', 'docs/dataset-confidence-audit-2026-07-05.md'].map((source, index) => <li key={source}><span>{String(index + 1).padStart(2, '0')}</span><code>{source}</code></li>)}</ol></article>
            <article><header><span>Public web · observed on 19 Aug 2026</span><h3>ConductAtlas sources</h3></header><ol>{externalSources.map((source, index) => <li key={source.href}><span>{String(index + 1).padStart(2, '0')}</span><a href={source.href} target="_blank" rel="noopener noreferrer">{source.label}<span aria-hidden="true"> ↗</span></a></li>)}</ol></article>
          </div>
          <aside className={styles.limitations}><div><span>Methodology note</span><h3>Limits of the assessment</h3></div><ul><li>{analysis.benchmark.boundary}</li><li>The index compares capabilities. Its scope excludes market share, company valuation, certification and legal quality.</li><li>Missing data is excluded from the denominator and reduces coverage.</li><li>The local comparison excludes the <code>waze</code> test entry. Remediation counts use global retrieval keys and do not establish a defect in a provider’s policy.</li><li>Repository checks cover implementation. Uptime, adoption, revenue, legal compliance and external certifications require separate evidence.</li></ul></aside>
        </section>
      </div>

      <footer className={styles.memoFooter}><span>FP {evaluation?.fingerprint.slice(0, 12) ?? 'unavailable'}</span><p>Method {evaluation?.methodologyVersion ?? 'v1'} · benchmark {analysis.benchmark.version} · recalculated {formatDate(analysis.metrics.checkedAt)}</p></footer>
    </article>
  );
}
