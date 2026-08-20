import 'server-only';

import { db } from './db';
import { getAuthoritativePublicationReadiness } from './publicationReadinessServer';
import { POLICYWATCHER_VERSION } from './release';
import {
  COMPETITIVE_SNAPSHOT_ACTION,
  COMPETITIVE_SNAPSHOT_TARGET_TYPE,
  COMPETITIVE_AXIS_LABELS,
  COMPETITIVE_DIMENSION_CATALOG,
  CONDUCT_ATLAS_BENCHMARK,
  buildCompetitivePriorities,
  buildCompetitiveSnapshot,
  calculateCompetitiveEvaluation,
  parseCompetitiveSnapshot,
  type CompetitiveLiveMetrics,
  type CompetitiveMetric,
  type CompetitiveMetricKey,
  type CompetitiveSnapshotPayload,
} from './competitiveAnalysis';

const FIXTURE_COMPANY_SLUG = 'waze';
const SNAPSHOT_HISTORY_LIMIT = 12;

interface QueryResult<T> {
  available: boolean;
  value: T | null;
  reason: string | null;
}

async function query<T>(label: string, run: () => Promise<T>): Promise<QueryResult<T>> {
  try {
    return { available: true, value: await run(), reason: null };
  } catch {
    console.warn(`[Competitive Analysis] ${label} unavailable.`);
    return { available: false, value: null, reason: `${label} non disponibile.` };
  }
}

function measured(value: number): CompetitiveMetric {
  return { value, state: 'measured', reason: null };
}

function unavailable(reason: string): CompetitiveMetric {
  return { value: null, state: 'unavailable', reason };
}

function fromCount(result: QueryResult<number>): CompetitiveMetric {
  return result.available && result.value !== null ? measured(result.value) : unavailable(result.reason || 'Metrica non disponibile.');
}

function allMetricKeys(): CompetitiveMetricKey[] {
  return [
    'companies',
    'sectors',
    'configuredPolicies',
    'retrievedPolicies',
    'baselineVerifiedPolicies',
    'publicPolicies',
    'analysedPolicies',
    'snapshotsTotal',
    'snapshotsPublic',
    'changesTotal',
    'changesPublic',
    'freshPolicies30d',
    'openRemediations',
    'snapshotDepth',
  ];
}

function historySummary(snapshot: CompetitiveSnapshotPayload) {
  return {
    fingerprint: snapshot.fingerprint,
    checkedAt: snapshot.checkedAt,
    buildLabel: snapshot.buildLabel,
    methodologyVersion: snapshot.methodologyVersion,
    benchmarkVersion: snapshot.benchmarkVersion,
    policyWatcherIndex: snapshot.evaluation.policyWatcherIndex,
    conductAtlasIndex: snapshot.evaluation.conductAtlasIndex,
    delta: snapshot.evaluation.delta,
    coverage: snapshot.evaluation.coverage,
    axes: snapshot.evaluation.axes,
  };
}

export async function loadCompetitiveAnalysis() {
  const checkedAt = new Date();
  const cutoff30d = new Date(checkedAt.getTime() - 30 * 24 * 60 * 60 * 1000);
  const companyScope = { slug: { not: FIXTURE_COMPANY_SLUG } };
  const policyScope = { company: companyScope };

  const [
    companies,
    publicationReadiness,
    retrievalLogs,
    snapshotCount,
    publicSnapshotCount,
    changeCount,
    publicChangeCount,
    remediationCount,
    snapshotLogs,
  ] = await Promise.all([
    query('Inventario aziende', () => db.company.findMany({
      where: companyScope,
      select: { id: true, industry: true },
    })),
    query('Readiness di pubblicazione', () => getAuthoritativePublicationReadiness({
      checkedAt,
      policyWhere: policyScope,
      scopeBoundary: 'Perimetro competitivo locale: conteggia l’inventario monitorato ed esclude esplicitamente la fixture amministrativa waze.',
    })),
    query('Evidenze di retrieval', () => db.policyCheckLog.findMany({
      where: {
        policy: policyScope,
        status: { in: ['Available', 'Reviewed'] },
        source: { notIn: ['seeded', 'none'], not: null },
        OR: [{ textHash: { not: null } }, { textLength: { gt: 0 } }],
      },
      orderBy: { checkedAt: 'desc' },
      select: { policyId: true, checkedAt: true },
    })),
    query('Snapshot totali', () => db.policySnapshot.count({ where: { policy: policyScope } })),
    query('Snapshot pubblici', () => db.policySnapshot.count({ where: { policy: policyScope, publicEvidence: true } })),
    query('Modifiche totali', () => db.policyChange.count({ where: { policy: policyScope } })),
    query('Modifiche pubbliche', () => db.policyChange.count({ where: { policy: policyScope, publicEvidence: true } })),
    query('Remediation aperte', () => db.sourceRemediationIssue.count({ where: { status: { in: ['Watching', 'Open'] } } })),
    query('Storico snapshot competitivi', () => db.adminReviewLog.findMany({
      where: { targetType: COMPETITIVE_SNAPSHOT_TARGET_TYPE, action: COMPETITIVE_SNAPSHOT_ACTION },
      orderBy: { createdAt: 'desc' },
      take: SNAPSHOT_HISTORY_LIMIT,
      select: { metadataJson: true },
    })),
  ]);

  const values = Object.fromEntries(allMetricKeys().map((key) => [key, unavailable('Metrica non caricata.')])) as CompetitiveLiveMetrics['values'];
  values.companies = companies.available && companies.value ? measured(companies.value.length) : unavailable(companies.reason || 'Inventario aziende non disponibile.');
  values.sectors = companies.available && companies.value ? measured(new Set(companies.value.map((company) => company.industry)).size) : unavailable(companies.reason || 'Settori non disponibili.');
  const readinessStages = new Map(
    (publicationReadiness.value?.stages || []).map((stage) => [stage.id, stage]),
  );
  const readinessMetric = (id: 'configured' | 'retrieved' | 'baseline-verified' | 'public' | 'analysed') => {
    const stage = readinessStages.get(id);
    return stage && stage.availability !== 'unavailable' && stage.count !== null
      ? measured(stage.count)
      : unavailable(stage?.reason || publicationReadiness.reason || 'Readiness di pubblicazione non disponibile.');
  };
  values.configuredPolicies = readinessMetric('configured');
  values.retrievedPolicies = readinessMetric('retrieved');
  values.baselineVerifiedPolicies = readinessMetric('baseline-verified');
  values.publicPolicies = readinessMetric('public');
  values.analysedPolicies = readinessMetric('analysed');
  values.snapshotsTotal = fromCount(snapshotCount);
  values.snapshotsPublic = fromCount(publicSnapshotCount);
  values.changesTotal = fromCount(changeCount);
  values.changesPublic = fromCount(publicChangeCount);
  values.openRemediations = fromCount(remediationCount);

  const latestSuccessfulAt = publicationReadiness.value?.latestCapture.capturedAt || null;
  if (retrievalLogs.available && retrievalLogs.value) {
    const latestByPolicy = new Map<string, Date>();
    for (const log of retrievalLogs.value) {
      if (!latestByPolicy.has(log.policyId)) latestByPolicy.set(log.policyId, log.checkedAt);
    }
    const latestDates = [...latestByPolicy.values()].sort((left, right) => right.getTime() - left.getTime());
    values.freshPolicies30d = measured(latestDates.filter((date) => date >= cutoff30d).length);
  } else {
    values.freshPolicies30d = unavailable(retrievalLogs.reason || 'Freschezza non disponibile.');
  }

  if (values.snapshotsTotal.state === 'measured' && values.configuredPolicies.state === 'measured') {
    const policies = values.configuredPolicies.value || 0;
    values.snapshotDepth = measured(policies > 0 ? (values.snapshotsTotal.value || 0) / policies : 0);
  } else {
    values.snapshotDepth = unavailable('Profondità snapshot non calcolabile.');
  }

  const measuredCount = Object.values(values).filter((item) => item.state === 'measured').length;
  const coreAvailable = values.companies.state === 'measured' && values.configuredPolicies.state === 'measured';
  const metrics: CompetitiveLiveMetrics = {
    status: !coreAvailable ? 'unavailable' : measuredCount === allMetricKeys().length ? 'available' : 'partial',
    checkedAt: checkedAt.toISOString(),
    latestSuccessfulAt,
    values,
    boundary: 'Perimetro competitivo locale: esclude esplicitamente la fixture amministrativa waze. Le remediation sono conteggiate a livello di retrieval key globale e non provano un difetto della policy del provider.',
  };

  const evaluation = calculateCompetitiveEvaluation(metrics);
  const currentSnapshot = evaluation ? buildCompetitiveSnapshot({ buildLabel: POLICYWATCHER_VERSION, metrics, evaluation }) : null;
  const history = snapshotLogs.available && snapshotLogs.value
    ? snapshotLogs.value
      .map((record) => parseCompetitiveSnapshot(record.metadataJson))
      .filter((snapshot): snapshot is CompetitiveSnapshotPayload => Boolean(snapshot))
      .map(historySummary)
    : [];

  return {
    metrics,
    evaluation,
    benchmark: CONDUCT_ATLAS_BENCHMARK,
    axisLabels: COMPETITIVE_AXIS_LABELS,
    dimensionCatalog: COMPETITIVE_DIMENSION_CATALOG,
    currentSnapshot,
    priorities: buildCompetitivePriorities(evaluation),
    history,
    historyStatus: snapshotLogs.available ? 'available' as const : 'unavailable' as const,
    buildLabel: POLICYWATCHER_VERSION,
  };
}

export async function persistCompetitiveSnapshot(input: {
  snapshot: CompetitiveSnapshotPayload;
  actorRole: 'admin';
}): Promise<'created' | 'unchanged'> {
  return db.$transaction(async (transaction) => {
    const existing = await transaction.adminReviewLog.findFirst({
      where: {
        targetType: COMPETITIVE_SNAPSHOT_TARGET_TYPE,
        action: COMPETITIVE_SNAPSHOT_ACTION,
        targetId: input.snapshot.fingerprint,
      },
      select: { id: true },
    });
    if (existing) return 'unchanged';

    await transaction.adminReviewLog.create({
      data: {
        actorRole: input.actorRole,
        action: COMPETITIVE_SNAPSHOT_ACTION,
        targetType: COMPETITIVE_SNAPSHOT_TARGET_TYPE,
        targetId: input.snapshot.fingerprint,
        targetLabel: `PolicyWatcher × ConductAtlas · ${input.snapshot.checkedAt.slice(0, 10)}`,
        newValue: input.snapshot.fingerprint.slice(0, 12),
        note: 'Snapshot competitivo ricalcolato server-side e registrato senza payload client.',
        metadataJson: JSON.stringify(input.snapshot),
      },
    });
    return 'created';
  });
}
