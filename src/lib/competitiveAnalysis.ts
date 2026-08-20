import { createHash } from 'node:crypto';

export const COMPETITIVE_METHODOLOGY_VERSION = 'policywatcher-competitive-methodology.v1' as const;
export const COMPETITIVE_SNAPSHOT_SCHEMA_VERSION = 'policywatcher-competitive-snapshot.v1' as const;
export const COMPETITIVE_BENCHMARK_VERSION = 'conduct-atlas-public-2026-08-19.v1' as const;
export const COMPETITIVE_SNAPSHOT_TARGET_TYPE = 'CompetitiveAnalysisSnapshot' as const;
export const COMPETITIVE_SNAPSHOT_ACTION = 'competitive_analysis_snapshot_created' as const;

export type CompetitiveAxisId = 'market' | 'evidence' | 'operations';
export type CompetitiveMetricKey =
  | 'companies'
  | 'sectors'
  | 'configuredPolicies'
  | 'retrievedPolicies'
  | 'baselineVerifiedPolicies'
  | 'publicPolicies'
  | 'analysedPolicies'
  | 'snapshotsTotal'
  | 'snapshotsPublic'
  | 'changesTotal'
  | 'changesPublic'
  | 'freshPolicies30d'
  | 'openRemediations'
  | 'snapshotDepth';

export type CompetitiveMetricState = 'measured' | 'unavailable';
export type CompetitiveConfidence = 'alta' | 'media' | 'bassa';
export type CompetitiveEvidenceState = 'measured' | 'verified-capability' | 'observed' | 'unverified' | 'unavailable';

export interface CompetitiveMetric {
  value: number | null;
  state: CompetitiveMetricState;
  reason: string | null;
}

export interface CompetitiveLiveMetrics {
  status: 'available' | 'partial' | 'unavailable';
  checkedAt: string;
  latestSuccessfulAt: string | null;
  values: Record<CompetitiveMetricKey, CompetitiveMetric>;
  boundary: string;
}

export interface CompetitiveBenchmarkDimension {
  score: number;
  confidence: CompetitiveConfidence;
  evidenceState: 'observed' | 'unverified';
  evidence: string;
  calculation: string;
}

export interface CompetitiveBenchmark {
  version: typeof COMPETITIVE_BENCHMARK_VERSION;
  label: 'ConductAtlas';
  observedAt: string;
  boundary: string;
  dimensions: Record<string, CompetitiveBenchmarkDimension>;
}

export interface CompetitiveSideScore {
  score: number | null;
  confidence: CompetitiveConfidence;
  evidenceState: CompetitiveEvidenceState;
  evidence: string;
  calculation: string;
}

export interface CompetitiveDimensionResult {
  id: string;
  axis: CompetitiveAxisId;
  label: string;
  weight: number;
  adminHref: string | null;
  policyWatcher: CompetitiveSideScore;
  conductAtlas: CompetitiveSideScore;
  delta: number | null;
  weightedGap: number | null;
  comparability: 'comparable' | 'unavailable';
}

export interface CompetitiveAxisResult {
  id: CompetitiveAxisId;
  label: string;
  policyWatcherIndex: number | null;
  conductAtlasIndex: number | null;
  delta: number | null;
  coverage: number;
}

export interface CompetitiveEvaluation {
  methodologyVersion: string;
  benchmarkVersion: string;
  policyWatcherIndex: number | null;
  conductAtlasIndex: number;
  delta: number | null;
  coverage: number;
  confidence: CompetitiveConfidence;
  label: string;
  dimensions: CompetitiveDimensionResult[];
  axes: CompetitiveAxisResult[];
  fingerprint: string;
  boundary: string;
}

export interface CompetitiveSnapshotPayload {
  schemaVersion: typeof COMPETITIVE_SNAPSHOT_SCHEMA_VERSION;
  methodologyVersion: string;
  benchmarkVersion: string;
  buildLabel: string;
  checkedAt: string;
  fingerprint: string;
  metrics: CompetitiveLiveMetrics;
  evaluation: CompetitiveEvaluation;
}

export interface CompetitivePriority {
  id: string;
  rank: number;
  title: string;
  gap: number;
  weightedGap: number;
  target: string;
  action: string;
  href: string | null;
}

export const COMPETITIVE_AXIS_LABELS: Record<CompetitiveAxisId, string> = {
  market: 'Mercato e corpus',
  evidence: 'Evidence control',
  operations: 'Prodotto e operazioni',
};

export const CONDUCT_ATLAS_BENCHMARK: CompetitiveBenchmark = {
  version: COMPETITIVE_BENCHMARK_VERSION,
  label: 'ConductAtlas',
  observedAt: '2026-08-19',
  boundary: 'Benchmark datato costruito da pagine pubbliche. I claim enterprise e di scala non sono telemetria live né verifica indipendente.',
  dimensions: {
    corpus: { score: 4.1, confidence: 'media', evidenceState: 'observed', evidence: '352+ piattaforme, 844+ documenti e claim pubblico di circa 59.000 provision.', calculation: 'Rubrica corpus: ampiezza pubblica superiore a 200 entità, con denominatori non perfettamente allineati tra pagine.' },
    granularity: { score: 4.8, confidence: 'alta', evidenceState: 'observed', evidence: 'Modello entity/document/version/change/provision con identificativi stabili.', calculation: 'Rubrica granularità: provision versionate, identificabili e citabili.' },
    search: { score: 4.4, confidence: 'alta', evidenceState: 'observed', evidence: 'Ricerca in linguaggio naturale, confronto tra clausole e pattern cross-platform.', calculation: 'Rubrica ricerca: ricerca citata e confronto provision-level disponibili pubblicamente.' },
    citability: { score: 4.5, confidence: 'alta', evidenceState: 'observed', evidence: 'Identificativi CA-E/D/V/C/P, hash, fonte e formato «cite as».', calculation: 'Rubrica citabilità: identità stabili fino alla provision e formato di citazione.' },
    retrieval: { score: 3.4, confidence: 'media', evidenceState: 'observed', evidence: 'Acquisizione giornaliera dichiarata con Playwright, hash, archivio raw e Wayback.', calculation: 'Rubrica retrieval: più controlli osservabili, ma nessuna metrica pubblica comparabile di fail-closed o remediation.' },
    publication: { score: 2.6, confidence: 'media', evidenceState: 'observed', evidence: 'Metodologia e limiti pubblici; conteggi di copertura non allineati tra alcune superfici.', calculation: 'Rubrica claim governance: metodo visibile, ma denominatore pubblico non ancora canonico.' },
    aiGovernance: { score: 3, confidence: 'bassa', evidenceState: 'unverified', evidence: 'Claude, confidence/uncertainty e supervisione umana dichiarati.', calculation: 'Claim pubblico senza benchmark di valutazione comparabile trovato.' },
    euCivic: { score: 1.5, confidence: 'alta', evidenceState: 'observed', evidence: 'Esperienza inglese e metodologia principalmente orientata agli Stati Uniti.', calculation: 'Rubrica UE/civica: localizzazione e contesto civico europeo limitati nelle superfici esaminate.' },
    enterprise: { score: 3, confidence: 'bassa', evidenceState: 'unverified', evidence: 'API limitata e capacità SSO/RBAC/webhook/GRC/SLA pubblicizzate.', calculation: 'Claim enterprise non verificato con credenziali, demo o SLA osservati.' },
    commercial: { score: 4, confidence: 'alta', evidenceState: 'observed', evidence: 'Funnel Free, Monitor, Insight, Team ed Enterprise.', calculation: 'Rubrica commerciale: packaging e progressione di offerta chiaramente leggibili.' },
    scale: { score: 3, confidence: 'bassa', evidenceState: 'unverified', evidence: 'Architettura Railway/R2 e sottoscrizioni dichiarate.', calculation: 'Direzione di scala visibile; maturità operativa e isolamento tenant non verificati.' },
  },
};

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clampScore(value: number): number {
  return round(Math.max(0, Math.min(5, value)), 2);
}

function unavailable(reason: string): CompetitiveSideScore {
  return { score: null, confidence: 'bassa', evidenceState: 'unavailable', evidence: reason, calculation: 'Peso escluso dallo score; il dato mancante non vale zero.' };
}

function metric(metrics: CompetitiveLiveMetrics, key: CompetitiveMetricKey): number | null {
  const item = metrics.values[key];
  return item.state === 'measured' && item.value !== null && Number.isFinite(item.value) ? item.value : null;
}

function need(metrics: CompetitiveLiveMetrics, keys: CompetitiveMetricKey[]): number[] | null {
  const values = keys.map((key) => metric(metrics, key));
  return values.every((value): value is number => value !== null) ? values : null;
}

function measured(score: number, evidence: string, calculation: string, confidence: CompetitiveConfidence = 'alta'): CompetitiveSideScore {
  return { score: clampScore(score), confidence, evidenceState: 'measured', evidence, calculation };
}

function capability(score: number, evidence: string, calculation: string, confidence: CompetitiveConfidence = 'alta'): CompetitiveSideScore {
  return { score: clampScore(score), confidence, evidenceState: 'verified-capability', evidence, calculation };
}

function corpusScore(metrics: CompetitiveLiveMetrics): CompetitiveSideScore {
  const values = need(metrics, ['companies', 'sectors', 'publicPolicies']);
  if (!values) return unavailable('Inventario o copertura pubblica non disponibili.');
  const [companies, sectors, publicPolicies] = values;
  const score = publicPolicies === 0 ? 0 : publicPolicies < 25 ? 1 : publicPolicies < 75 ? 2 : publicPolicies < 200 ? 3 : publicPolicies < 500 ? 4 : 5;
  return measured(score, `${companies} aziende reali, ${sectors} settori e ${publicPolicies} policy pubbliche verificate.`, '0: nessuna policy pubblica; 1: 1–24; 2: 25–74; 3: 75–199; 4: 200–499; 5: almeno 500.');
}

function granularityScore(metrics: CompetitiveLiveMetrics): CompetitiveSideScore {
  const values = need(metrics, ['configuredPolicies', 'snapshotsTotal', 'changesTotal', 'snapshotDepth']);
  if (!values) return unavailable('Profondità storica o inventario non disponibili.');
  const [policies, snapshots, changes, depth] = values;
  const score = Number(policies > 0) + Number(depth >= 1) + Number(changes > 0);
  return measured(score, `${snapshots} snapshot, ${changes} modifiche e profondità media ${round(depth, 2)} per policy.`, 'Un punto per inventario, storico snapshot e cambiamenti; fino a due punti ulteriori richiedono provision stabili e QA di citazione, oggi assenti.');
}

function retrievalScore(metrics: CompetitiveLiveMetrics): CompetitiveSideScore {
  const values = need(metrics, ['configuredPolicies', 'retrievedPolicies', 'freshPolicies30d', 'openRemediations']);
  if (!values) return unavailable('Metriche di retrieval, freschezza o remediation non disponibili.');
  const [configured, retrieved, fresh, remediation] = values;
  if (configured === 0) return measured(0, 'Nessuna policy configurata.', 'Un inventario vuoto produce un valore misurato pari a zero.');
  const retrievalRate = retrieved / configured;
  const freshnessRate = fresh / configured;
  const penalty = Math.min(0.5, remediation * 0.1);
  const score = 5 * (0.65 * retrievalRate + 0.35 * freshnessRate) - penalty;
  return measured(score, `${retrieved}/${configured} recuperate, ${fresh}/${configured} fresche entro 30 giorni, ${remediation} remediation aperte.`, '5 × (65% copertura retrieval + 35% freschezza) − 0,1 per remediation aperta, con penalità massima 0,5.');
}

function publicationScore(metrics: CompetitiveLiveMetrics): CompetitiveSideScore {
  const values = need(metrics, ['configuredPolicies', 'baselineVerifiedPolicies', 'publicPolicies', 'analysedPolicies']);
  if (!values) return unavailable('Uno o più stadi del funnel di pubblicazione non sono disponibili.');
  const [configured, baseline, published, analysed] = values;
  if (configured === 0) return measured(0, 'Nessuna policy configurata.', 'Un inventario vuoto produce un valore misurato pari a zero.');
  const live = 5 * (0.35 * baseline / configured + 0.35 * published / configured + 0.3 * analysed / configured);
  const score = 0.8 * live + 0.2 * 4;
  return measured(score, `${baseline} baseline verificate, ${published} policy pubbliche e ${analysed} analizzate su ${configured}.`, '80% funnel live (35% baseline, 35% pubblico, 30% analizzato) + 20% capacità fail-closed/release audit verificata nel repository.');
}

function citabilityScore(metrics: CompetitiveLiveMetrics): CompetitiveSideScore {
  const values = need(metrics, ['configuredPolicies', 'snapshotsPublic', 'changesPublic', 'publicPolicies']);
  if (!values) return unavailable('Snapshot o modifiche pubbliche non disponibili.');
  const [configured, publicSnapshots, publicChanges, publicPolicies] = values;
  const snapshotCoverage = configured > 0 ? Math.min(1, publicSnapshots / configured) : 0;
  const changeCoverage = publicPolicies > 0 ? Math.min(1, publicChanges / publicPolicies) : 0;
  const score = 1 + 1.5 * snapshotCoverage + 2.5 * changeCoverage;
  return measured(score, `${publicSnapshots} snapshot e ${publicChanges} modifiche con evidenza pubblica.`, '1 punto per identità/evidence packet implementati + 1,5 × copertura snapshot pubblici + 2,5 × copertura modifiche pubbliche.');
}

interface DimensionDefinition {
  id: keyof typeof CONDUCT_ATLAS_BENCHMARK.dimensions;
  axis: CompetitiveAxisId;
  label: string;
  weight: number;
  adminHref: string | null;
  scorePolicyWatcher: (metrics: CompetitiveLiveMetrics) => CompetitiveSideScore;
}

const DIMENSIONS: readonly DimensionDefinition[] = [
  { id: 'corpus', axis: 'market', label: 'Copertura del corpus', weight: 14, adminHref: '/admin/companies', scorePolicyWatcher: corpusScore },
  { id: 'granularity', axis: 'market', label: 'Granularità dei dati', weight: 10, adminHref: '/admin/database', scorePolicyWatcher: granularityScore },
  { id: 'search', axis: 'market', label: 'Ricerca e confronto', weight: 8, adminHref: '/admin/explainability', scorePolicyWatcher: () => capability(2.3, 'Dashboard, timeline, matrice e raccolte; nessun retrieval provision-level citato.', 'Rubrica v1: 2,3/5 per confronto strutturato senza ricerca naturale citata a livello di clausola.') },
  { id: 'citability', axis: 'market', label: 'Citabilità operativa', weight: 8, adminHref: '/admin/dataset-quality', scorePolicyWatcher: citabilityScore },
  { id: 'retrieval', axis: 'evidence', label: 'Affidabilità del retrieval', weight: 14, adminHref: '/admin/source-reliability', scorePolicyWatcher: retrievalScore },
  { id: 'publication', axis: 'evidence', label: 'Pubblicazione e claim governance', weight: 12, adminHref: '/admin/dataset-quality', scorePolicyWatcher: publicationScore },
  { id: 'aiGovernance', axis: 'evidence', label: 'Governance dell’AI', weight: 10, adminHref: '/admin/kpi-audit', scorePolicyWatcher: () => capability(4.2, 'Registry versionato, golden set congelato, gate e promozione umana.', 'Rubrica v1: controlli verificabili e nessuna promozione automatica; resta il limite di un golden set piccolo e sintetico.') },
  { id: 'euCivic', axis: 'operations', label: 'Differenziazione UE / civica', weight: 9, adminHref: '/admin/companies', scorePolicyWatcher: () => capability(4.2, 'Esperienza EN/IT, prospettiva UE e directory civica source-backed.', 'Rubrica v1: localizzazione e infrastruttura civica implementate, senza prova di adozione territoriale.') },
  { id: 'enterprise', axis: 'operations', label: 'Workflow enterprise', weight: 6, adminHref: '/admin/production-verification', scorePolicyWatcher: () => capability(2.7, 'API, Entra v2, APIM, source package e webhook pilota.', 'Rubrica v1: integrazioni tecniche disponibili o pilot-ready, senza workspace multi-tenant operativo.') },
  { id: 'commercial', axis: 'operations', label: 'Readiness commerciale', weight: 4, adminHref: '/admin/executive-study', scorePolicyWatcher: () => capability(1, 'Nessun account, billing o workspace di team maturo.', 'Rubrica v1: capacità commerciale non implementata; il valore non misura domanda o ricavi.') },
  { id: 'scale', axis: 'operations', label: 'Preparazione alla scala', weight: 5, adminHref: '/admin/database', scorePolicyWatcher: () => capability(1.5, 'Beta su SQLite/Hostinger/VPS con gate multi-tenant espliciti.', 'Rubrica v1: deployment operativo limitato, senza isolamento tenant e object storage verificati.') },
];

export const COMPETITIVE_DIMENSION_CATALOG = DIMENSIONS.map((dimension) => ({
  id: dimension.id,
  axis: dimension.axis,
  label: dimension.label,
  weight: dimension.weight,
  adminHref: dimension.adminHref,
}));

export const COMPETITIVE_TOTAL_WEIGHT = DIMENSIONS.reduce((sum, dimension) => sum + dimension.weight, 0);

function confidenceValue(value: CompetitiveConfidence): number {
  return value === 'alta' ? 3 : value === 'media' ? 2 : 1;
}

function confidenceLabel(value: number): CompetitiveConfidence {
  return value >= 2.5 ? 'alta' : value >= 1.65 ? 'media' : 'bassa';
}

function directionalLabel(index: number | null): string {
  if (index === null) return 'Non disponibile';
  if (index < 35) return 'Iniziale';
  if (index < 55) return 'In costruzione';
  if (index < 70) return 'Competitivo';
  if (index < 85) return 'Avanzato';
  return 'Molto avanzato';
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item)]),
  );
}

export function competitiveFingerprint(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex');
}

export function calculateCompetitiveEvaluation(metrics: CompetitiveLiveMetrics): CompetitiveEvaluation | null {
  if (metrics.status === 'unavailable') return null;

  const dimensions = DIMENSIONS.map((definition): CompetitiveDimensionResult => {
    const policyWatcher = definition.scorePolicyWatcher(metrics);
    const benchmark = CONDUCT_ATLAS_BENCHMARK.dimensions[definition.id];
    const conductAtlas: CompetitiveSideScore = {
      score: benchmark.score,
      confidence: benchmark.confidence,
      evidenceState: benchmark.evidenceState,
      evidence: benchmark.evidence,
      calculation: benchmark.calculation,
    };
    const comparable = policyWatcher.score !== null && conductAtlas.score !== null;
    const delta = comparable ? round(policyWatcher.score! - conductAtlas.score!, 2) : null;
    return {
      id: definition.id,
      axis: definition.axis,
      label: definition.label,
      weight: definition.weight,
      adminHref: definition.adminHref,
      policyWatcher,
      conductAtlas,
      delta,
      weightedGap: delta === null ? null : round(Math.max(0, -delta) * definition.weight / 5, 2),
      comparability: comparable ? 'comparable' : 'unavailable',
    };
  });

  const known = dimensions.filter((dimension) => dimension.policyWatcher.score !== null && dimension.conductAtlas.score !== null);
  const knownWeight = known.reduce((sum, dimension) => sum + dimension.weight, 0);
  const policyWatcherIndex = knownWeight > 0
    ? round(known.reduce((sum, dimension) => sum + dimension.policyWatcher.score! / 5 * dimension.weight, 0) / knownWeight * 100)
    : null;
  const conductAtlasIndex = knownWeight > 0
    ? round(known.reduce((sum, dimension) => sum + dimension.conductAtlas.score! / 5 * dimension.weight, 0) / knownWeight * 100)
    : round(DIMENSIONS.reduce((sum, definition) => sum + CONDUCT_ATLAS_BENCHMARK.dimensions[definition.id].score / 5 * definition.weight, 0));
  const coverage = round(knownWeight / COMPETITIVE_TOTAL_WEIGHT * 100);
  const confidence = knownWeight > 0
    ? confidenceLabel(known.reduce((sum, dimension) => sum + Math.min(confidenceValue(dimension.policyWatcher.confidence), confidenceValue(dimension.conductAtlas.confidence)) * dimension.weight, 0) / knownWeight)
    : 'bassa';

  const axes = (Object.keys(COMPETITIVE_AXIS_LABELS) as CompetitiveAxisId[]).map((axis): CompetitiveAxisResult => {
    const axisDimensions = dimensions.filter((dimension) => dimension.axis === axis);
    const comparable = axisDimensions.filter((dimension) => dimension.comparability === 'comparable');
    const totalWeight = axisDimensions.reduce((sum, dimension) => sum + dimension.weight, 0);
    const knownAxisWeight = comparable.reduce((sum, dimension) => sum + dimension.weight, 0);
    const policyIndex = knownAxisWeight > 0 ? round(comparable.reduce((sum, dimension) => sum + dimension.policyWatcher.score! / 5 * dimension.weight, 0) / knownAxisWeight * 100) : null;
    const competitorIndex = knownAxisWeight > 0 ? round(comparable.reduce((sum, dimension) => sum + dimension.conductAtlas.score! / 5 * dimension.weight, 0) / knownAxisWeight * 100) : null;
    return { id: axis, label: COMPETITIVE_AXIS_LABELS[axis], policyWatcherIndex: policyIndex, conductAtlasIndex: competitorIndex, delta: policyIndex !== null && competitorIndex !== null ? round(policyIndex - competitorIndex) : null, coverage: round(knownAxisWeight / totalWeight * 100) };
  });

  const fingerprint = competitiveFingerprint({
    methodologyVersion: COMPETITIVE_METHODOLOGY_VERSION,
    benchmarkVersion: COMPETITIVE_BENCHMARK_VERSION,
    metrics: Object.fromEntries(Object.entries(metrics.values).map(([key, item]) => [key, { value: item.value, state: item.state, reason: item.reason }])),
    dimensions: dimensions.map((dimension) => ({ id: dimension.id, weight: dimension.weight, policyWatcher: dimension.policyWatcher, conductAtlas: dimension.conductAtlas })),
  });

  return {
    methodologyVersion: COMPETITIVE_METHODOLOGY_VERSION,
    benchmarkVersion: COMPETITIVE_BENCHMARK_VERSION,
    policyWatcherIndex,
    conductAtlasIndex,
    delta: policyWatcherIndex === null ? null : round(policyWatcherIndex - conductAtlasIndex),
    coverage,
    confidence,
    label: directionalLabel(policyWatcherIndex),
    dimensions,
    axes,
    fingerprint,
    boundary: 'Indice direzionale di capacità, non quota di mercato, valutazione aziendale, certificazione o misura di qualità legale. I dati mancanti sono esclusi dal denominatore.',
  };
}

export function buildCompetitivePriorities(evaluation: CompetitiveEvaluation | null): CompetitivePriority[] {
  if (!evaluation) return [];
  return evaluation.dimensions
    .filter((dimension) => dimension.weightedGap !== null && dimension.weightedGap > 0)
    .sort((left, right) => right.weightedGap! - left.weightedGap!)
    .slice(0, 6)
    .map((dimension, index) => ({
      id: dimension.id,
      rank: index + 1,
      title: dimension.label,
      gap: round(Math.abs(dimension.delta!)),
      weightedGap: dimension.weightedGap!,
      target: `Portare la dimensione ad almeno ${round(Math.min(5, dimension.conductAtlas.score! - 0.5), 1)}/5 con evidenza verificabile.`,
      action: dimension.policyWatcher.calculation,
      href: dimension.adminHref,
    }));
}

export function buildCompetitiveSnapshot(input: {
  buildLabel: string;
  metrics: CompetitiveLiveMetrics;
  evaluation: CompetitiveEvaluation;
}): CompetitiveSnapshotPayload {
  return {
    schemaVersion: COMPETITIVE_SNAPSHOT_SCHEMA_VERSION,
    methodologyVersion: COMPETITIVE_METHODOLOGY_VERSION,
    benchmarkVersion: COMPETITIVE_BENCHMARK_VERSION,
    buildLabel: input.buildLabel,
    checkedAt: input.metrics.checkedAt,
    fingerprint: input.evaluation.fingerprint,
    metrics: input.metrics,
    evaluation: input.evaluation,
  };
}

export function parseCompetitiveSnapshot(value: unknown): CompetitiveSnapshotPayload | null {
  let candidate: unknown = value;
  if (typeof value === 'string') {
    try {
      candidate = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!candidate || typeof candidate !== 'object') return null;
  const snapshot = candidate as Partial<CompetitiveSnapshotPayload>;
  if (
    snapshot.schemaVersion !== COMPETITIVE_SNAPSHOT_SCHEMA_VERSION
    || typeof snapshot.methodologyVersion !== 'string'
    || snapshot.methodologyVersion.length === 0
    || typeof snapshot.benchmarkVersion !== 'string'
    || snapshot.benchmarkVersion.length === 0
    || typeof snapshot.checkedAt !== 'string'
    || typeof snapshot.buildLabel !== 'string'
    || typeof snapshot.fingerprint !== 'string'
    || !/^[a-f0-9]{64}$/.test(snapshot.fingerprint)
    || !snapshot.metrics
    || !snapshot.evaluation
    || snapshot.evaluation.fingerprint !== snapshot.fingerprint
    || snapshot.evaluation.methodologyVersion !== snapshot.methodologyVersion
    || snapshot.evaluation.benchmarkVersion !== snapshot.benchmarkVersion
  ) return null;
  return snapshot as CompetitiveSnapshotPayload;
}
