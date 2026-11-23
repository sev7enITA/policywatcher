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

type CompetitiveCopy = (archive: string, english: string) => string;
const archiveCopy: CompetitiveCopy = (archive) => archive;
const englishCopy: CompetitiveCopy = (_archive, english) => english;

const axisLabels = (copy: CompetitiveCopy): Record<CompetitiveAxisId, string> => ({
  market: copy('Mercato e corpus', 'Market and corpus'),
  evidence: 'Evidence control',
  operations: copy('Prodotto e operazioni', 'Product and operations'),
});

const benchmarkFor = (copy: CompetitiveCopy): CompetitiveBenchmark => ({
  version: COMPETITIVE_BENCHMARK_VERSION,
  label: 'ConductAtlas',
  observedAt: '2026-08-19',
  boundary: copy('Benchmark datato costruito da pagine pubbliche. I claim enterprise e di scala non sono telemetria live né verifica indipendente.', 'Dated benchmark based on public pages. Enterprise and scale claims remain independently unverified and live telemetry was unavailable.'),
  dimensions: {
    corpus: { score: 4.1, confidence: 'media', evidenceState: 'observed', evidence: copy('352+ piattaforme, 844+ documenti e claim pubblico di circa 59.000 provision.', '352+ platforms, 844+ documents and a public claim of around 59,000 provisions.'), calculation: copy('Rubrica corpus: ampiezza pubblica superiore a 200 entità, con denominatori non perfettamente allineati tra pagine.', 'Corpus rubric. Public coverage exceeds 200 entities, with some variation in denominators across pages.') },
    granularity: { score: 4.8, confidence: 'alta', evidenceState: 'observed', evidence: copy('Modello entity/document/version/change/provision con identificativi stabili.', 'Entity, document, version, change and provision model with stable identifiers.'), calculation: copy('Rubrica granularità: provision versionate, identificabili e citabili.', 'Granularity rubric. Provisions are versioned, identifiable and citable.') },
    search: { score: 4.4, confidence: 'alta', evidenceState: 'observed', evidence: copy('Ricerca in linguaggio naturale, confronto tra clausole e pattern cross-platform.', 'Natural-language search, clause comparison and cross-platform patterns.'), calculation: copy('Rubrica ricerca: ricerca citata e confronto provision-level disponibili pubblicamente.', 'Search rubric. Search with citations and provision-level comparison are publicly available.') },
    citability: { score: 4.5, confidence: 'alta', evidenceState: 'observed', evidence: copy('Identificativi CA-E/D/V/C/P, hash, fonte e formato «cite as».', 'CA-E/D/V/C/P identifiers, hashes, sources and a citation format.'), calculation: copy('Rubrica citabilità: identità stabili fino alla provision e formato di citazione.', 'Citation rubric. Stable identifiers extend to individual provisions, with a defined citation format.') },
    retrieval: { score: 3.4, confidence: 'media', evidenceState: 'observed', evidence: copy('Acquisizione giornaliera dichiarata con Playwright, hash, archivio raw e Wayback.', 'Reported daily acquisition with Playwright, hashes, a raw archive and Wayback.'), calculation: copy('Rubrica retrieval: più controlli osservabili, ma nessuna metrica pubblica comparabile di fail-closed o remediation.', 'Retrieval rubric. Several controls were visible, with comparable public metrics for fail-closed behaviour and remediation unavailable.') },
    publication: { score: 2.6, confidence: 'media', evidenceState: 'observed', evidence: copy('Metodologia e limiti pubblici; conteggi di copertura non allineati tra alcune superfici.', 'Public methodology and limitations, with coverage counts differing across some pages.'), calculation: copy('Rubrica claim governance: metodo visibile, ma denominatore pubblico non ancora canonico.', 'Claims governance rubric. The method is visible, while the public denominator varies across pages.') },
    aiGovernance: { score: 3, confidence: 'bassa', evidenceState: 'unverified', evidence: copy('Claude, confidence/uncertainty e supervisione umana dichiarati.', 'Reported use of Claude, confidence and uncertainty measures, and human oversight.'), calculation: copy('Claim pubblico senza benchmark di valutazione comparabile trovato.', 'Public claim. The review found no comparable evaluation benchmark.') },
    euCivic: { score: 1.5, confidence: 'alta', evidenceState: 'observed', evidence: copy('Esperienza inglese e metodologia principalmente orientata agli Stati Uniti.', 'English-language experience and a methodology focused primarily on the United States.'), calculation: copy('Rubrica UE/civica: localizzazione e contesto civico europeo limitati nelle superfici esaminate.', 'EU and civic rubric. The pages reviewed showed limited localisation and European civic context.') },
    enterprise: { score: 3, confidence: 'bassa', evidenceState: 'unverified', evidence: copy('API limitata e capacità SSO/RBAC/webhook/GRC/SLA pubblicizzate.', 'Limited API and advertised SSO, RBAC, webhook, GRC and SLA capabilities.'), calculation: copy('Claim enterprise non verificato con credenziali, demo o SLA osservati.', 'Enterprise claim remains unverified. Credentials, demos and SLAs were unavailable to the review.') },
    commercial: { score: 4, confidence: 'alta', evidenceState: 'observed', evidence: copy('Funnel Free, Monitor, Insight, Team ed Enterprise.', 'Free, Monitor, Insight, Team and Enterprise tiers.'), calculation: copy('Rubrica commerciale: packaging e progressione di offerta chiaramente leggibili.', 'Commercial rubric. Product tiers and upgrade paths are clearly described.') },
    scale: { score: 3, confidence: 'bassa', evidenceState: 'unverified', evidence: copy('Architettura Railway/R2 e sottoscrizioni dichiarate.', 'Reported Railway/R2 architecture and subscriptions.'), calculation: copy('Direzione di scala visibile; maturità operativa e isolamento tenant non verificati.', 'The architecture indicates a path to scale. Operational maturity and tenant isolation remain unverified.') },
  },
});

export const COMPETITIVE_AXIS_LABELS = axisLabels(archiveCopy);
export const CONDUCT_ATLAS_BENCHMARK = benchmarkFor(archiveCopy);

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clampScore(value: number): number {
  return round(Math.max(0, Math.min(5, value)), 2);
}

function unavailable(copy: CompetitiveCopy, reason: string): CompetitiveSideScore {
  return { score: null, confidence: 'bassa', evidenceState: 'unavailable', evidence: reason, calculation: copy('Peso escluso dallo score; il dato mancante non vale zero.', 'The score excludes the weight for missing data.') };
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

function corpusScore(copy: CompetitiveCopy, metrics: CompetitiveLiveMetrics): CompetitiveSideScore {
  const values = need(metrics, ['companies', 'sectors', 'publicPolicies']);
  if (!values) return unavailable(copy, copy('Inventario o copertura pubblica non disponibili.', 'Inventory or public coverage is unavailable.'));
  const [companies, sectors, publicPolicies] = values;
  const score = publicPolicies === 0 ? 0 : publicPolicies < 25 ? 1 : publicPolicies < 75 ? 2 : publicPolicies < 200 ? 3 : publicPolicies < 500 ? 4 : 5;
  return measured(score, copy(`${companies} aziende reali, ${sectors} settori e ${publicPolicies} policy pubbliche verificate.`, `${companies} real companies, ${sectors} sectors and ${publicPolicies} verified public policies.`), copy('0: nessuna policy pubblica; 1: 1–24; 2: 25–74; 3: 75–199; 4: 200–499; 5: almeno 500.', 'Scores by public policy count. 0 for none, 1 for 1–24, 2 for 25–74, 3 for 75–199, 4 for 200–499 and 5 for 500 or more.'));
}

function granularityScore(copy: CompetitiveCopy, metrics: CompetitiveLiveMetrics): CompetitiveSideScore {
  const values = need(metrics, ['configuredPolicies', 'snapshotsTotal', 'changesTotal', 'snapshotDepth']);
  if (!values) return unavailable(copy, copy('Profondità storica o inventario non disponibili.', 'Snapshot depth or inventory is unavailable.'));
  const [policies, snapshots, changes, depth] = values;
  const score = Number(policies > 0) + Number(depth >= 1) + Number(changes > 0);
  return measured(score, copy(`${snapshots} snapshot, ${changes} modifiche e profondità media ${round(depth, 2)} per policy.`, `${snapshots} snapshots, ${changes} changes and an average depth of ${round(depth, 2)} snapshots per policy.`), copy('Un punto per inventario, storico snapshot e cambiamenti; fino a due punti ulteriori richiedono provision stabili e QA di citazione, oggi assenti.', 'One point each for inventory, snapshot history and changes. Stable provisions and citation QA would add up to two points.'));
}

function retrievalScore(copy: CompetitiveCopy, metrics: CompetitiveLiveMetrics): CompetitiveSideScore {
  const values = need(metrics, ['configuredPolicies', 'retrievedPolicies', 'freshPolicies30d', 'openRemediations']);
  if (!values) return unavailable(copy, copy('Metriche di retrieval, freschezza o remediation non disponibili.', 'Retrieval, freshness or remediation metrics are unavailable.'));
  const [configured, retrieved, fresh, remediation] = values;
  if (configured === 0) return measured(0, copy('Nessuna policy configurata.', 'No policies configured.'), copy('Un inventario vuoto produce un valore misurato pari a zero.', 'An empty inventory has a measured score of zero.'));
  const retrievalRate = retrieved / configured;
  const freshnessRate = fresh / configured;
  const penalty = Math.min(0.5, remediation * 0.1);
  const score = 5 * (0.65 * retrievalRate + 0.35 * freshnessRate) - penalty;
  return measured(score, copy(`${retrieved}/${configured} recuperate, ${fresh}/${configured} fresche entro 30 giorni, ${remediation} remediation aperte.`, `${retrieved}/${configured} retrieved, ${fresh}/${configured} refreshed in the past 30 days and ${remediation} open remediation issues.`), copy('5 × (65% copertura retrieval + 35% freschezza) − 0,1 per remediation aperta, con penalità massima 0,5.', '5 × (65% retrieval coverage + 35% freshness), minus 0.1 per open remediation issue, up to 0.5.'));
}

function publicationScore(copy: CompetitiveCopy, metrics: CompetitiveLiveMetrics): CompetitiveSideScore {
  const values = need(metrics, ['configuredPolicies', 'baselineVerifiedPolicies', 'publicPolicies', 'analysedPolicies']);
  if (!values) return unavailable(copy, copy('Uno o più stadi del funnel di pubblicazione non sono disponibili.', 'One or more publication stages are unavailable.'));
  const [configured, baseline, published, analysed] = values;
  if (configured === 0) return measured(0, copy('Nessuna policy configurata.', 'No policies configured.'), copy('Un inventario vuoto produce un valore misurato pari a zero.', 'An empty inventory has a measured score of zero.'));
  const live = 5 * (0.35 * baseline / configured + 0.35 * published / configured + 0.3 * analysed / configured);
  const score = 0.8 * live + 0.2 * 4;
  return measured(score, copy(`${baseline} baseline verificate, ${published} policy pubbliche e ${analysed} analizzate su ${configured}.`, `${baseline} verified baselines, ${published} public policies and ${analysed} analysed out of ${configured}.`), copy('80% funnel live (35% baseline, 35% pubblico, 30% analizzato) + 20% capacità fail-closed/release audit verificata nel repository.', '80% live funnel (35% baseline, 35% public, 30% analysed) + 20% repository-verified fail-closed and release audit capability.'));
}

function citabilityScore(copy: CompetitiveCopy, metrics: CompetitiveLiveMetrics): CompetitiveSideScore {
  const values = need(metrics, ['configuredPolicies', 'snapshotsPublic', 'changesPublic', 'publicPolicies']);
  if (!values) return unavailable(copy, copy('Snapshot o modifiche pubbliche non disponibili.', 'Public snapshots or changes are unavailable.'));
  const [configured, publicSnapshots, publicChanges, publicPolicies] = values;
  const snapshotCoverage = configured > 0 ? Math.min(1, publicSnapshots / configured) : 0;
  const changeCoverage = publicPolicies > 0 ? Math.min(1, publicChanges / publicPolicies) : 0;
  const score = 1 + 1.5 * snapshotCoverage + 2.5 * changeCoverage;
  return measured(score, copy(`${publicSnapshots} snapshot e ${publicChanges} modifiche con evidenza pubblica.`, `${publicSnapshots} snapshots and ${publicChanges} changes with public evidence.`), copy('1 punto per identità/evidence packet implementati + 1,5 × copertura snapshot pubblici + 2,5 × copertura modifiche pubbliche.', '1 point for identifiers and evidence packets + 1.5 × public snapshot coverage + 2.5 × public change coverage.'));
}

interface DimensionDefinition {
  id: keyof typeof CONDUCT_ATLAS_BENCHMARK.dimensions;
  axis: CompetitiveAxisId;
  label: string;
  weight: number;
  adminHref: string | null;
  scorePolicyWatcher: (metrics: CompetitiveLiveMetrics) => CompetitiveSideScore;
}

const dimensionsFor = (copy: CompetitiveCopy): readonly DimensionDefinition[] => [
  { id: 'corpus', axis: 'market', label: copy('Copertura del corpus', 'Corpus coverage'), weight: 14, adminHref: '/admin/companies', scorePolicyWatcher: (metrics) => corpusScore(copy, metrics) },
  { id: 'granularity', axis: 'market', label: copy('Granularità dei dati', 'Data granularity'), weight: 10, adminHref: '/admin/database', scorePolicyWatcher: (metrics) => granularityScore(copy, metrics) },
  { id: 'search', axis: 'market', label: copy('Ricerca e confronto', 'Search and comparison'), weight: 8, adminHref: '/admin/explainability', scorePolicyWatcher: () => capability(2.3, copy('Dashboard, timeline, matrice e raccolte; nessun retrieval provision-level citato.', 'Dashboard, timeline, matrix and collections. Provision-level retrieval with citations remains unavailable.'), copy('Rubrica v1: 2,3/5 per confronto strutturato senza ricerca naturale citata a livello di clausola.', 'Rubric v1. 2.3/5 for structured comparison. Natural-language clause search with citations remains unavailable.')) },
  { id: 'citability', axis: 'market', label: copy('Citabilità operativa', 'Operational citability'), weight: 8, adminHref: '/admin/dataset-quality', scorePolicyWatcher: (metrics) => citabilityScore(copy, metrics) },
  { id: 'retrieval', axis: 'evidence', label: copy('Affidabilità del retrieval', 'Retrieval reliability'), weight: 14, adminHref: '/admin/source-reliability', scorePolicyWatcher: (metrics) => retrievalScore(copy, metrics) },
  { id: 'publication', axis: 'evidence', label: copy('Pubblicazione e claim governance', 'Publication and claims governance'), weight: 12, adminHref: '/admin/dataset-quality', scorePolicyWatcher: (metrics) => publicationScore(copy, metrics) },
  { id: 'aiGovernance', axis: 'evidence', label: copy('Governance dell’AI', 'AI governance'), weight: 10, adminHref: '/admin/kpi-audit', scorePolicyWatcher: () => capability(4.2, copy('Registry versionato, golden set congelato, gate e promozione umana.', 'Versioned registry, frozen golden set, gates and human approval.'), copy('Rubrica v1: controlli verificabili e nessuna promozione automatica; resta il limite di un golden set piccolo e sintetico.', 'Rubric v1. Verifiable controls and promotion by human approval, with a small synthetic golden set.')) },
  { id: 'euCivic', axis: 'operations', label: copy('Differenziazione UE / civica', 'EU and civic focus'), weight: 9, adminHref: '/admin/companies', scorePolicyWatcher: () => capability(4.2, copy('Esperienza EN/IT, prospettiva UE e directory civica source-backed.', 'English and Italian experience, EU perspective and a civic directory backed by sources.'), copy('Rubrica v1: localizzazione e infrastruttura civica implementate, senza prova di adozione territoriale.', 'Rubric v1. Localisation and civic infrastructure are implemented. Regional adoption remains unverified.')) },
  { id: 'enterprise', axis: 'operations', label: copy('Workflow enterprise', 'Enterprise workflows'), weight: 6, adminHref: '/admin/production-verification', scorePolicyWatcher: () => capability(2.7, copy('API, Entra v2, APIM, source package e webhook pilota.', 'API, Entra v2, APIM, source package and pilot webhook.'), copy('Rubrica v1: integrazioni tecniche disponibili o pilot-ready, senza workspace multi-tenant operativo.', 'Rubric v1. Technical integrations are available or pilot-ready. An operational multi-tenant workspace remains unavailable.')) },
  { id: 'commercial', axis: 'operations', label: copy('Readiness commerciale', 'Commercial readiness'), weight: 4, adminHref: '/admin/executive-study', scorePolicyWatcher: () => capability(1, copy('Nessun account, billing o workspace di team maturo.', 'Accounts, billing and a mature team workspace remain unavailable.'), copy('Rubrica v1: capacità commerciale non implementata; il valore non misura domanda o ricavi.', 'Rubric v1. Commercial capabilities await implementation. The score excludes demand and revenue.')) },
  { id: 'scale', axis: 'operations', label: copy('Preparazione alla scala', 'Readiness for scale'), weight: 5, adminHref: '/admin/database', scorePolicyWatcher: () => capability(1.5, copy('Beta su SQLite/Hostinger/VPS con gate multi-tenant espliciti.', 'Beta on SQLite, Hostinger and a VPS with explicit multi-tenant gates.'), copy('Rubrica v1: deployment operativo limitato, senza isolamento tenant e object storage verificati.', 'Rubric v1. Limited operational deployment. Tenant isolation and object storage remain unverified.')) },
];

const DIMENSIONS = dimensionsFor(archiveCopy);
const ENGLISH_DIMENSIONS = dimensionsFor(englishCopy);
const ENGLISH_AXIS_LABELS = axisLabels(englishCopy);
const ENGLISH_BENCHMARK = benchmarkFor(englishCopy);

const dimensionCatalog = (dimensions: readonly DimensionDefinition[]) => dimensions.map((dimension) => ({
  id: dimension.id,
  axis: dimension.axis,
  label: dimension.label,
  weight: dimension.weight,
  adminHref: dimension.adminHref,
}));

export const COMPETITIVE_DIMENSION_CATALOG = dimensionCatalog(DIMENSIONS);

export const COMPETITIVE_TOTAL_WEIGHT = DIMENSIONS.reduce((sum, dimension) => sum + dimension.weight, 0);

function confidenceValue(value: CompetitiveConfidence): number {
  return value === 'alta' ? 3 : value === 'media' ? 2 : 1;
}

function confidenceLabel(value: number): CompetitiveConfidence {
  return value >= 2.5 ? 'alta' : value >= 1.65 ? 'media' : 'bassa';
}

function directionalLabel(copy: CompetitiveCopy, index: number | null): string {
  if (index === null) return copy('Non disponibile', 'Unavailable');
  if (index < 35) return copy('Iniziale', 'Early stage');
  if (index < 55) return copy('In costruzione', 'In development');
  if (index < 70) return copy('Competitivo', 'Competitive');
  if (index < 85) return copy('Avanzato', 'Advanced');
  return copy('Molto avanzato', 'Highly advanced');
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

const evaluationBoundary = (copy: CompetitiveCopy) => copy('Indice direzionale di capacità, non quota di mercato, valutazione aziendale, certificazione o misura di qualità legale. I dati mancanti sono esclusi dal denominatore.', 'The index gives a directional view of comparable capabilities. Its scope excludes market share, company valuation, certification and legal quality. Missing data is excluded from the denominator.');

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
    label: directionalLabel(archiveCopy, policyWatcherIndex),
    dimensions,
    axes,
    fingerprint,
    boundary: evaluationBoundary(archiveCopy),
  };
}

// The audit ledger hashes the original evidence and rubric text. Localise only the
// presentation, retaining the canonical fingerprint and the scores computed from it.
export function presentCompetitiveAnalysisInEnglish(metrics: CompetitiveLiveMetrics, evaluation: CompetitiveEvaluation | null) {
  const copy = englishCopy;
  const localized = evaluation && {
    ...evaluation,
    label: directionalLabel(copy, evaluation.policyWatcherIndex),
    boundary: evaluationBoundary(copy),
    axes: evaluation.axes.map((axis) => ({ ...axis, label: ENGLISH_AXIS_LABELS[axis.id] })),
    dimensions: ENGLISH_DIMENSIONS.map((definition, index) => {
      const dimension = evaluation.dimensions[index];
      const { evidence, calculation } = definition.scorePolicyWatcher(metrics);
      const benchmark = ENGLISH_BENCHMARK.dimensions[dimension.id];
      return {
        ...dimension,
        label: definition.label,
        policyWatcher: { ...dimension.policyWatcher, evidence, calculation },
        conductAtlas: { ...dimension.conductAtlas, evidence: benchmark.evidence, calculation: benchmark.calculation },
      };
    }),
  };
  return {
    evaluation: localized,
    benchmark: ENGLISH_BENCHMARK,
    axisLabels: ENGLISH_AXIS_LABELS,
    dimensionCatalog: dimensionCatalog(ENGLISH_DIMENSIONS),
    priorities: buildCompetitivePriorities(localized, copy),
  };
}

export function buildCompetitivePriorities(evaluation: CompetitiveEvaluation | null, copy = archiveCopy): CompetitivePriority[] {
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
      target: copy(`Portare la dimensione ad almeno ${round(Math.min(5, dimension.conductAtlas.score! - 0.5), 1)}/5 con evidenza verificabile.`, `Reach at least ${round(Math.min(5, dimension.conductAtlas.score! - 0.5), 1)}/5 with verifiable evidence.`),
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
