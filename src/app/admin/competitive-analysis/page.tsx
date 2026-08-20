import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { unstable_noStore as noStore } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_NAME, verifySessionToken } from '@/lib/adminAuth';
import { recordCompetitiveSnapshot } from './actions';
import styles from './competitive-analysis.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'Analisi competitiva | PolicyWatcher Admin',
  description: 'Valutazione competitiva interna, dinamica e auditabile.',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
    googleBot: { index: false, follow: false, noarchive: true, noimageindex: true },
  },
};

const longDate = new Intl.DateTimeFormat('it-IT', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/Rome',
});
const shortDate = new Intl.DateTimeFormat('it-IT', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Europe/Rome',
});

function formatDate(value: string | null): string {
  if (!value) return 'Non disponibile';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Non disponibile' : longDate.format(date);
}

function formatShortDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data non disponibile' : shortDate.format(date);
}

function score(value: number | null, suffix = ''): string {
  return value === null ? '—' : `${value.toLocaleString('it-IT', { maximumFractionDigits: 1 })}${suffix}`;
}

function signed(value: number | null, suffix = ''): string {
  if (value === null) return '—';
  return `${value > 0 ? '+' : ''}${value.toLocaleString('it-IT', { maximumFractionDigits: 1 })}${suffix}`;
}

function pct(value: number | null, denominator: number | null): number | null {
  if (value === null || denominator === null || denominator <= 0) return null;
  return Math.min(100, Math.round(value / denominator * 100));
}

function evidenceLabel(value: string): string {
  if (value === 'measured') return 'Misurato';
  if (value === 'verified-capability') return 'Capacità verificata';
  if (value === 'observed') return 'Osservato';
  if (value === 'unverified') return 'Non verificato';
  return 'Non disponibile';
}

export default async function CompetitiveAnalysisPage({ searchParams }: { searchParams: Promise<{ snapshot?: string | string[] }> }) {
  noStore();

  // Il controllo resta prima dell'import del loader riservato: una sessione
  // invalida non deve costruire né serializzare dati competitivi interni.
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(COOKIE_NAME)?.value);
  if (!session.valid || (session.role !== 'admin' && session.role !== 'auditor')) redirect('/admin/login');

  const { loadCompetitiveAnalysis } = await import('@/lib/competitiveAnalysisServer');
  const analysis = await loadCompetitiveAnalysis();
  const decisionLanes = [
    { number: 'A', title: 'Proteggere', summary: 'I controlli che rendono credibile il prodotto.', tone: 'protect', items: ['Pubblicazione fail-closed', 'Diagnostica del retrieval e remediation', 'AI EvalOps con approvazione umana', 'Identità EN/IT, europea e civica'] },
    { number: 'B', title: 'Colmare', summary: 'Il divario strutturale tra evidenza e ricerca utile.', tone: 'close', items: ['Modello provision-level e identificativi stabili', 'Copertura canonica riconciliata', 'Retrieval citato in linguaggio naturale', 'PostgreSQL e object storage prima del multi-tenancy'] },
    { number: 'C', title: 'Non imitare', summary: 'Scorciatoie che indeboliscono la fiducia.', tone: 'avoid', items: ['Claim di ampiezza senza denominatore', 'Promesse enterprise senza prova operativa', 'Vanity metric al posto della profondità', 'Certezza legale derivata soltanto dall’AI'] },
  ] as const;
  const actionPlan = [
    { number: '01', title: 'Contratto canonico di copertura', body: 'Riconciliare configurato, recuperato, baseline, pubblico, analizzato e ultimo successo in una proiezione unica.', evidence: 'Stessi denominatori e timestamp tra Admin, Trust, API e release.' },
    { number: '02', title: 'Pilota dello schema delle provision', body: 'Modellare le prime famiglie di clausole con identità stabili collegate alla fonte versionata.', evidence: 'Gli identificativi sopravvivono al reprocessing e sono citabili.' },
    { number: '03', title: 'Milestone su un corpus mirato', body: 'Definire un perimetro UE/Italia per AI e fintech con completezza ed eccezioni pubblicabili.', evidence: 'Un registro firmato riporta inclusi, esclusi, bloccati e ultima verifica.' },
    { number: '04', title: 'Esperienza di retrieval citato', body: 'Introdurre ricerca e confronto tra clausole dopo il superamento della QA sulle provision.', evidence: 'Ogni risposta risale a provision, versione, acquisizione e fonte ufficiale.' },
  ] as const;
  const externalSources = [
    { label: 'Panoramica del prodotto', href: 'https://conductatlas.com/' },
    { label: 'Metodologia', href: 'https://conductatlas.com/methodology/' },
    { label: 'Registro delle provision', href: 'https://conductatlas.com/registry/' },
    { label: 'Ricerca in linguaggio naturale', href: 'https://conductatlas.com/ask/' },
    { label: 'Prezzi', href: 'https://conductatlas.com/pricing/' },
    { label: 'API ed Enterprise', href: 'https://conductatlas.com/enterprise/' },
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
    policyWatcher: { score: null, confidence: 'bassa' as const, evidenceState: 'unavailable' as const, evidence: 'Il database operativo non è disponibile.', calculation: 'Il peso è escluso: un dato mancante non viene trasformato in zero.' },
    conductAtlas: { score: analysis.benchmark.dimensions[dimension.id].score, confidence: analysis.benchmark.dimensions[dimension.id].confidence, evidenceState: analysis.benchmark.dimensions[dimension.id].evidenceState, evidence: analysis.benchmark.dimensions[dimension.id].evidence, calculation: analysis.benchmark.dimensions[dimension.id].calculation },
    delta: null,
    weightedGap: null,
    comparability: 'unavailable' as const,
  }));
  const funnel = [
    { label: 'Configurate', metric: analysis.metrics.values.configuredPolicies },
    { label: 'Recuperate', metric: analysis.metrics.values.retrievedPolicies },
    { label: 'Baseline verificata', metric: analysis.metrics.values.baselineVerifiedPolicies },
    { label: 'Pubbliche', metric: analysis.metrics.values.publicPolicies },
    { label: 'Analizzate', metric: analysis.metrics.values.analysedPolicies },
  ];
  const snapshotNotice = snapshotState === 'created' ? 'Snapshot registrato nel ledger di audit.'
    : snapshotState === 'unchanged' ? 'Stato invariato: lo snapshot identico era già presente.'
      : snapshotState === 'forbidden' ? 'Il ruolo Auditor può consultare, ma non registrare snapshot.'
        : snapshotState === 'unavailable' ? 'Snapshot non registrato: le metriche essenziali non sono disponibili.'
          : snapshotState === 'error' ? 'Snapshot non registrato per un errore del ledger. La valutazione corrente resta consultabile.' : null;

  return (
    <article className={styles.page} data-competitive-analysis="true">
      <aside className={styles.confidentialityBand} role="note" aria-label="Avviso di riservatezza">
        <div><strong>Intelligence competitiva interna</strong><span>Riservata ai ruoli Admin e Auditor autenticati. Non distribuire gli indici come claim di mercato esterno.</span></div>
        <span className={styles.roleSeal}>{session.role === 'admin' ? 'Admin' : 'Auditor'} · {session.role === 'admin' ? 'lettura e snapshot' : 'sola lettura'}</span>
      </aside>

      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Valutazione live · ricalcolata {formatDate(analysis.metrics.checkedAt)}</p>
          <h1>PolicyWatcher <span aria-hidden="true">×</span><span className={styles.srOnly}>a confronto con</span> ConductAtlas</h1>
          <p className={styles.heroLead}>Un indice direzionale spiegabile, calcolato dai dati operativi PolicyWatcher e confrontato con un benchmark pubblico ConductAtlas datato e versionato.</p>
          <dl className={styles.heroMeta}>
            <div><dt>Build</dt><dd>{analysis.buildLabel}</dd></div>
            <div><dt>Metodo</dt><dd>{evaluation?.methodologyVersion ?? 'policywatcher-competitive-methodology.v1'}</dd></div>
            <div><dt>Benchmark</dt><dd>ConductAtlas · osservato il {formatShortDate(analysis.benchmark.observedAt)}</dd></div>
            <div><dt>Ultimo retrieval</dt><dd>{formatDate(analysis.metrics.latestSuccessfulAt)}</dd></div>
          </dl>
        </div>
        <aside className={styles.verdict} aria-label="Quadro di posizione corrente">
          <span>Posizione corrente</span>
          <div className={styles.scoreBoard}>
            <div className={styles.primaryScore}><small>PolicyWatcher</small><strong>{score(evaluation?.policyWatcherIndex ?? null)}</strong><span>/ 100 · {evaluation?.label ?? 'Non disponibile'}</span></div>
            <dl>
              <div><dt>ConductAtlas</dt><dd>{score(benchmarkIndex)} / 100</dd></div>
              <div><dt>Scostamento</dt><dd>{signed(evaluation?.delta ?? null, ' pt')}</dd></div>
              <div><dt>Copertura score</dt><dd>{score(evaluation?.coverage ?? 0, '%')}</dd></div>
              <div><dt>Confidenza</dt><dd>{evaluation?.confidence ?? 'Non disponibile'}</dd></div>
            </dl>
          </div>
          <div className={styles.heroActions}>
            {session.role === 'admin' ? <form action={recordCompetitiveSnapshot}><button className={styles.snapshotButton} type="submit" disabled={!analysis.currentSnapshot}>Registra snapshot</button></form> : <p className={styles.auditorNote}>L’Auditor consulta score e storico senza modificare il ledger.</p>}
            <a className={styles.recalculateLink} href="/admin/competitive-analysis">Ricalcola ora</a>
          </div>
          {snapshotNotice && <p className={styles.saveNotice} role="status">{snapshotNotice}</p>}
        </aside>
      </header>

      <nav className={styles.sectionIndex} aria-label="Sezioni della valutazione competitiva">
        <span>Indice live</span><div><a href="#radar">01 Radar</a><a href="#funnel">02 Funnel</a><a href="#matrix">03 Matrice</a><a href="#trend">04 Trend</a><a href="#impacts">05 Impatti</a><a href="#decisions">06 Decisioni</a><a href="#evidence">07 Limiti</a></div>
      </nav>

      <div className={styles.memoBody}>
        {analysis.metrics.status !== 'available' && (
          <aside className={styles.availabilityNotice} role="status">
            <strong>{analysis.metrics.status === 'unavailable' ? 'Valutazione PolicyWatcher non disponibile' : 'Valutazione PolicyWatcher parziale'}</strong>
            <p>{analysis.metrics.status === 'unavailable' ? 'Il benchmark ConductAtlas resta visibile, ma nessun dato mancante viene mostrato come zero.' : 'Le dimensioni prive di dati sono escluse dal denominatore e riducono la copertura dello score.'}</p>
          </aside>
        )}

        <section id="radar" className={styles.section} aria-labelledby="radar-heading">
          <div className={styles.sectionHeading}><span>01 · Radar operativo</span><div><h2 id="radar-heading">La spina dorsale dei divari</h2><p>Tre assi leggibili senza colore: il centro è la parità, lo scostamento indica dove PolicyWatcher guadagna o perde terreno.</p></div></div>
          <figure className={styles.gapSpine}>
            <figcaption className={styles.srOnly}>Confronto accessibile dei tre assi tra PolicyWatcher e ConductAtlas</figcaption>
            <div className={styles.spineHeader}><span>−100 · vantaggio ConductAtlas</span><strong>Parità</strong><span>+100 · vantaggio PolicyWatcher</span></div>
            {axes.map((axis, index) => {
              const delta = axis.delta === null ? null : Math.max(-100, Math.min(100, axis.delta));
              return (
                <article className={styles.axisRow} key={axis.id}>
                  <div className={styles.axisIdentity}><span>0{index + 1}</span><div><h3>{axis.label}</h3><small>Copertura {score(axis.coverage, '%')}</small></div></div>
                  <div className={styles.axisGraphic}>
                    <div className={`${styles.axisScale} ${delta === null ? styles.axisScaleUnavailable : ''}`} aria-hidden="true">
                      {delta !== null && <><span className={styles.axisZero} /><span className={styles.axisNeedle} style={{ '--gap-position': `${50 + delta / 2}%` } as CSSProperties} /></>}
                    </div>
                    {delta === null && <span className={styles.axisUnavailableLabel}>Scostamento non calcolabile</span>}
                  </div>
                  <dl><div><dt>PW</dt><dd>{score(axis.policyWatcherIndex)}</dd></div><div><dt>CA</dt><dd>{score(axis.conductAtlasIndex)}</dd></div><div><dt>Δ</dt><dd>{signed(axis.delta)}</dd></div></dl>
                </article>
              );
            })}
          </figure>
          <p className={styles.methodBoundary}>{evaluation?.boundary ?? 'L’indice PolicyWatcher non è calcolabile. Il benchmark non rappresenta telemetria live del concorrente.'}</p>
        </section>

        <section id="funnel" className={`${styles.section} ${styles.funnelSection}`} aria-labelledby="funnel-heading">
          <div className={styles.sectionHeading}><span>02 · Funnel live</span><div><h2 id="funnel-heading">Dalla configurazione all’analisi pubblica</h2><p>Ogni passaggio usa dati persistiti e un unico istante di rilevazione. La fixture <code>waze</code> è esclusa.</p></div></div>
          <ol className={styles.liveFunnel}>
            {funnel.map((stage, index) => {
              const percentage = pct(stage.metric.value, configured);
              const rateLabel = stage.metric.reason ?? (percentage === null ? 'Percentuale non calcolabile: denominatore non disponibile.' : `${percentage}% del perimetro configurato`);
              return <li key={stage.label} className={stage.metric.state === 'unavailable' || percentage === null ? styles.missingStage : undefined}><span className={styles.funnelNumber}>0{index + 1}</span><div><h3>{stage.label}</h3><p>{rateLabel}</p></div><strong>{stage.metric.value ?? '—'}</strong><div className={`${styles.funnelTrack} ${percentage === null ? styles.unavailableTrack : ''}`} aria-hidden="true">{percentage !== null && <span style={{ width: `${percentage}%` }} />}</div></li>;
            })}
          </ol>
          <dl className={styles.metricLedger}>
            <div><dt>Aziende / settori</dt><dd>{score(analysis.metrics.values.companies.value)} / {score(analysis.metrics.values.sectors.value)}</dd></div>
            <div><dt>Snapshot totali / pubblici</dt><dd>{score(analysis.metrics.values.snapshotsTotal.value)} / {score(analysis.metrics.values.snapshotsPublic.value)}</dd></div>
            <div><dt>Modifiche totali / pubbliche</dt><dd>{score(analysis.metrics.values.changesTotal.value)} / {score(analysis.metrics.values.changesPublic.value)}</dd></div>
            <div><dt>Fresche entro 30 giorni</dt><dd>{score(analysis.metrics.values.freshPolicies30d.value)}</dd></div>
            <div><dt>Remediation aperte</dt><dd>{score(analysis.metrics.values.openRemediations.value)}</dd></div>
            <div><dt>Profondità snapshot / policy</dt><dd>{score(analysis.metrics.values.snapshotDepth.value)}</dd></div>
          </dl>
        </section>

        <section id="matrix" className={`${styles.section} ${styles.matrixSection}`} aria-labelledby="matrix-heading">
          <div className={styles.sectionHeading}><span>03 · Matrice dinamica</span><div><h2 id="matrix-heading">Undici dimensioni, formule visibili</h2><p>I punteggi sono rubriche 0–5. Il lato ConductAtlas è un benchmark pubblico datato, non un feed live.</p></div></div>
          <div className={styles.evidenceLegend} aria-label="Legenda dello stato delle evidenze"><span className={styles.observed}>Misurato o osservato</span><span className={styles.assessment}>Capacità verificata</span><span className={styles.unverified}>Non verificato</span></div>
          <p className={styles.scrollCue}>Scorri orizzontalmente per consultare formule ed evidenze sugli schermi più piccoli.</p>
          <div className={styles.tableScroller} tabIndex={0} role="region" aria-label="Tabella scorrevole degli score competitivi">
            <table className={styles.comparisonTable}>
              <caption className={styles.srOnly}>Score PolicyWatcher e benchmark ConductAtlas per dimensione</caption>
              <thead><tr><th scope="col">Dimensione</th><th scope="col">PW / CA</th><th scope="col">Δ / peso</th><th scope="col">Evidenza PolicyWatcher</th><th scope="col">Benchmark ConductAtlas</th></tr></thead>
              <tbody>{matrixRows.map((row, index) => <tr key={row.id}><th scope="row"><span className={styles.rowNumber}>{String(index + 1).padStart(2, '0')}</span><strong>{row.label}</strong><small>{analysis.axisLabels[row.axis]}</small></th><td><strong className={styles.matrixScore}>{score(row.policyWatcher.score)} <span>/</span> {score(row.conductAtlas.score)}</strong><small>{row.comparability === 'comparable' ? 'Confrontabile' : 'Peso escluso'}</small></td><td><strong>{signed(row.delta)}</strong><small>Peso {row.weight}%</small></td><td><span className={styles.evidenceTag}>{evidenceLabel(row.policyWatcher.evidenceState)} · confidenza {row.policyWatcher.confidence}</span><p>{row.policyWatcher.evidence}</p><details><summary>Formula o rubrica</summary><p>{row.policyWatcher.calculation}</p></details></td><td><span className={styles.evidenceTag}>{evidenceLabel(row.conductAtlas.evidenceState)} · confidenza {row.conductAtlas.confidence}</span><p>{row.conductAtlas.evidence}</p><details><summary>Confine del benchmark</summary><p>{row.conductAtlas.calculation}</p></details></td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section id="trend" className={styles.section} aria-labelledby="trend-heading">
          <div className={styles.sectionHeading}><span>04 · Storico auditabile</span><div><h2 id="trend-heading">Snapshot, non retrospettive riscritte</h2><p>Ogni punto conserva metodo, benchmark, metriche e score dell’istante in cui è stato registrato.</p></div></div>
          {analysis.historyStatus === 'unavailable' ? <div className={styles.emptyTrend}><strong>Storico non disponibile</strong><p>Il ledger non ha risposto; la valutazione corrente resta separata.</p></div>
            : analysis.history.length === 0 ? <div className={styles.emptyTrend}><strong>Nessuno snapshot registrato</strong><p>Un Admin può registrare lo stato corrente per iniziare una serie auditabile. Nessun trend viene inventato.</p></div>
              : <ol className={styles.trendTimeline}>{analysis.history.map((item, index) => <li key={item.fingerprint}><span className={styles.trendNode} aria-hidden="true" /><div><span>{String(analysis.history.length - index).padStart(2, '0')}</span><time dateTime={item.checkedAt}>{formatDate(item.checkedAt)}</time><code>{item.methodologyVersion} · {item.fingerprint.slice(0, 12)}</code></div><dl><div><dt>PW</dt><dd>{score(item.policyWatcherIndex)}</dd></div><div><dt>CA</dt><dd>{score(item.conductAtlasIndex)}</dd></div><div><dt>Δ</dt><dd>{signed(item.delta)}</dd></div><div><dt>Copertura</dt><dd>{score(item.coverage, '%')}</dd></div></dl></li>)}</ol>}
          {analysis.history.length === 1 && <p className={styles.singleTrend}>È presente un solo punto: serve almeno un secondo stato diverso per descrivere una direzione.</p>}
        </section>

        <section id="impacts" className={styles.section} aria-labelledby="impacts-heading">
          <div className={styles.sectionHeading}><span>05 · Impatti prioritari</span><div><h2 id="impacts-heading">Il gap pesato ordina la risposta</h2><p>Le priorità derivano dallo score corrente; non sostituiscono una decisione di roadmap.</p></div></div>
          {analysis.priorities.length === 0 ? <div className={styles.emptyTrend}><strong>Priorità dinamiche non disponibili</strong><p>Servono metriche confrontabili prima di ordinare gli impatti.</p></div>
            : <ol className={styles.priorityList}>{analysis.priorities.map((priority) => <li key={priority.id}><span className={styles.priorityRank}>{String(priority.rank).padStart(2, '0')}</span><div><h3>{priority.title}</h3><p>Divario {score(priority.gap, '/5')} · impatto pesato {score(priority.weightedGap)}</p></div><div><span>Target osservabile</span><p>{priority.target}</p></div><div><span>Base di calcolo</span><p>{priority.action}</p></div>{priority.href && <a href={priority.href}>Apri console Admin <span aria-hidden="true">→</span></a>}</li>)}</ol>}
        </section>

        <section id="decisions" className={styles.section} aria-labelledby="decisions-heading">
          <div className={styles.sectionHeading}><span>06 · Direttrici e 90 giorni</span><div><h2 id="decisions-heading">Proteggere il vantaggio, colmare il divario</h2><p>Il memo strategico resta stabile sotto le metriche live e ne delimita l’uso.</p></div></div>
          <div className={styles.decisionLanes}>{decisionLanes.map((lane) => <article key={lane.title} className={styles[lane.tone]}><header><span>{lane.number}</span><div><h3>{lane.title}</h3><p>{lane.summary}</p></div></header><ol>{lane.items.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, '0')}</span>{item}</li>)}</ol></article>)}</div>
          <ol className={styles.actionMap}>{actionPlan.map((action) => <li key={action.number}><span className={styles.actionNumber}>{action.number}</span><div><h3>{action.title}</h3><p>{action.body}</p></div><aside><span>Evidenza di successo</span><p>{action.evidence}</p></aside></li>)}</ol>
          <aside className={styles.decisionGate} aria-label="Gate decisionale a novanta giorni"><span>Gate decisionale</span><p>Nessun nuovo layer commerciale per workspace finché modello dati e contratto canonico di copertura non sono verificati in produzione.</p></aside>
        </section>

        <section id="evidence" className={`${styles.section} ${styles.evidenceSection}`} aria-labelledby="evidence-heading">
          <div className={styles.sectionHeading}><span>07 · Evidenze e limiti</span><div><h2 id="evidence-heading">Provenienza separata, conclusione delimitata</h2><p>I dati PolicyWatcher sono live; i claim ConductAtlas sono osservazioni pubbliche congelate al 19 agosto 2026.</p></div></div>
          <div className={styles.ledgers}>
            <article><header><span>Repository e dati operativi</span><h3>Evidenze PolicyWatcher</h3></header><ol>{['src/lib/competitiveAnalysis.ts', 'src/lib/competitiveAnalysisServer.ts', 'prisma/schema.prisma', 'docs/dataset-confidence-audit-2026-07-05.md'].map((source, index) => <li key={source}><span>{String(index + 1).padStart(2, '0')}</span><code>{source}</code></li>)}</ol></article>
            <article><header><span>Web pubblico · osservato il 19 ago 2026</span><h3>Fonti ConductAtlas</h3></header><ol>{externalSources.map((source, index) => <li key={source.href}><span>{String(index + 1).padStart(2, '0')}</span><a href={source.href} target="_blank" rel="noopener noreferrer">{source.label}<span aria-hidden="true"> ↗</span></a></li>)}</ol></article>
          </div>
          <aside className={styles.limitations}><div><span>Avviso metodologico</span><h3>Cosa non dimostra questa pagina</h3></div><ul><li>{analysis.benchmark.boundary}</li><li>L’indice è direzionale: non è quota di mercato, valutazione aziendale, certificazione o misura di qualità legale.</li><li>I dati mancanti sono esclusi dal denominatore e abbassano la copertura; non sono mai trasformati in zero.</li><li>{analysis.metrics.boundary}</li><li>Test e controlli del repository non dimostrano uptime, adozione, ricavi, conformità legale o certificazioni esterne.</li></ul></aside>
        </section>
      </div>

      <footer className={styles.memoFooter}><span>FP {evaluation?.fingerprint.slice(0, 12) ?? 'non-disponibile'}</span><p>Metodo {evaluation?.methodologyVersion ?? 'v1'} · benchmark {analysis.benchmark.version} · ricalcolato {formatDate(analysis.metrics.checkedAt)}</p></footer>
    </article>
  );
}
