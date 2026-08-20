import { describe, expect, it } from 'vitest';
import {
  COMPETITIVE_TOTAL_WEIGHT,
  CONDUCT_ATLAS_BENCHMARK,
  buildCompetitivePriorities,
  buildCompetitiveSnapshot,
  calculateCompetitiveEvaluation,
  parseCompetitiveSnapshot,
  type CompetitiveLiveMetrics,
  type CompetitiveMetricKey,
} from '../competitiveAnalysis';

const metricKeys: CompetitiveMetricKey[] = [
  'companies', 'sectors', 'configuredPolicies', 'retrievedPolicies', 'baselineVerifiedPolicies',
  'publicPolicies', 'analysedPolicies', 'snapshotsTotal', 'snapshotsPublic', 'changesTotal',
  'changesPublic', 'freshPolicies30d', 'openRemediations', 'snapshotDepth',
];

const baseValues: Record<CompetitiveMetricKey, number> = {
  companies: 16,
  sectors: 6,
  configuredPolicies: 50,
  retrievedPolicies: 32,
  baselineVerifiedPolicies: 25,
  publicPolicies: 18,
  analysedPolicies: 12,
  snapshotsTotal: 91,
  snapshotsPublic: 20,
  changesTotal: 40,
  changesPublic: 8,
  freshPolicies30d: 24,
  openRemediations: 2,
  snapshotDepth: 1.82,
};

function metrics(overrides: Partial<CompetitiveLiveMetrics> = {}): CompetitiveLiveMetrics {
  return {
    status: 'available',
    checkedAt: '2026-08-19T10:00:00.000Z',
    latestSuccessfulAt: '2026-08-18T10:00:00.000Z',
    values: Object.fromEntries(metricKeys.map((key) => [key, { value: baseValues[key], state: 'measured', reason: null }])) as CompetitiveLiveMetrics['values'],
    boundary: 'Fixture waze esclusa.',
    ...overrides,
  };
}

describe('metodo competitivo puro', () => {
  it('usa undici dimensioni e pesi che sommano a 100', () => {
    const evaluation = calculateCompetitiveEvaluation(metrics());
    expect(COMPETITIVE_TOTAL_WEIGHT).toBe(100);
    expect(evaluation?.dimensions).toHaveLength(11);
    expect(evaluation?.coverage).toBe(100);
    expect(evaluation?.policyWatcherIndex).toBeGreaterThan(0);
  });

  it('esclude i dati mancanti dal denominatore invece di trasformarli in zero', () => {
    const partial = metrics();
    partial.status = 'partial';
    partial.values.configuredPolicies = { value: null, state: 'unavailable', reason: 'Query fallita.' };
    const evaluation = calculateCompetitiveEvaluation(partial);
    const retrieval = evaluation?.dimensions.find((dimension) => dimension.id === 'retrieval');
    expect(retrieval?.policyWatcher.score).toBeNull();
    expect(retrieval?.comparability).toBe('unavailable');
    expect(evaluation?.coverage).toBeLessThan(100);
    expect(evaluation?.policyWatcherIndex).not.toBe(0);
  });

  it('non produce uno score PolicyWatcher quando il nucleo dati è indisponibile', () => {
    expect(calculateCompetitiveEvaluation(metrics({ status: 'unavailable' }))).toBeNull();
  });

  it('mantiene il fingerprint idempotente rispetto al timestamp e sensibile ai dati', () => {
    const first = calculateCompetitiveEvaluation(metrics());
    const later = calculateCompetitiveEvaluation(metrics({ checkedAt: '2026-08-20T10:00:00.000Z' }));
    const changedMetrics = metrics();
    changedMetrics.values.publicPolicies = { value: 19, state: 'measured', reason: null };
    const changed = calculateCompetitiveEvaluation(changedMetrics);
    expect(first?.fingerprint).toBe(later?.fingerprint);
    expect(changed?.fingerprint).not.toBe(first?.fingerprint);
  });

  it('conserva e valida lo snapshot storico senza ricalcolarlo', () => {
    const live = metrics();
    const evaluation = calculateCompetitiveEvaluation(live);
    expect(evaluation).not.toBeNull();
    const snapshot = buildCompetitiveSnapshot({ buildLabel: '3.9.0-beta.42', metrics: live, evaluation: evaluation! });
    expect(parseCompetitiveSnapshot(JSON.stringify(snapshot))).toEqual(snapshot);
    const legacy = {
      ...snapshot,
      methodologyVersion: 'policywatcher-competitive-methodology.v0',
      evaluation: { ...snapshot.evaluation, methodologyVersion: 'policywatcher-competitive-methodology.v0' },
    };
    expect(parseCompetitiveSnapshot(legacy)?.methodologyVersion).toBe('policywatcher-competitive-methodology.v0');
    expect(parseCompetitiveSnapshot('{malformed')).toBeNull();
    expect(parseCompetitiveSnapshot({ ...snapshot, schemaVersion: 'future.v2' })).toBeNull();
  });

  it('mantiene i claim non verificati del benchmark separati e ordina i gap pesati', () => {
    expect(Object.values(CONDUCT_ATLAS_BENCHMARK.dimensions).some((item) => item.evidenceState === 'unverified')).toBe(true);
    const priorities = buildCompetitivePriorities(calculateCompetitiveEvaluation(metrics()));
    expect(priorities.length).toBeGreaterThan(0);
    expect(priorities.map((item) => item.weightedGap)).toEqual([...priorities.map((item) => item.weightedGap)].sort((a, b) => b - a));
  });
});
