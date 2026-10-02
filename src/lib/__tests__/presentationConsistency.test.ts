import { describe, it, expect } from 'vitest';
import { summarizeDashboardEvidence, type EvidencePolicy } from '@/lib/dashboardEvidence';
import { riskFromScore } from '@/lib/riskScale';
import { getKpiConcernLevel } from '@/lib/metricsCatalog';
const policy = (patch: Partial<EvidencePolicy> = {}): EvidencePolicy => ({
  id: 'p', dataStatus: 'Available', ingestionMethod: 'Direct scrape', snapshots: [{ publicEvidence: true }],
  checkLogs: [{ checkedAt: new Date('2026-10-01T10:00:00Z'), status: 'Available', source: 'direct', reason: null, archiveTimestamp: null }],
  changes: [{ createdAt: new Date('2026-10-01'), kpiDataCollection: 'Minimal', kpiThirdPartySharing: 'Not assessed', kpiDataRetention: 'invented value' }], ...patch,
});
describe('Evidence summary', () => {
  it('keeps unknown and invalid KPI values out of assessed coverage', () => {
    expect(summarizeDashboardEvidence([policy()])).toMatchObject({ totalPolicies: 1, publicBaselines: 1, liveChecks: 1, assessedKpis: 1, totalKpis: 15 });
  });
  it('counts public baselines without analysis in the KPI denominator', () => {
    expect(summarizeDashboardEvidence([policy({ changes: [] })])).toMatchObject({ publicBaselines: 1, assessedPolicies: 0, assessedKpis: 0, totalKpis: 15 });
  });
  it('excludes suspended analyses without hiding failed checks', () => {
    const p = policy({ dataStatus: 'Unavailable', checkLogs: [{ checkedAt: new Date(), status: 'Unavailable', source: 'none', reason: null, archiveTimestamp: null }] });
    expect(summarizeDashboardEvidence([p])).toMatchObject({ publicBaselines: 0, unavailableChecks: 1, totalKpis: 0, assessedKpis: 0 });
  });
  it('keeps archive recovery separate from live retrieval', () => {
    const p = policy({ checkLogs: [{ checkedAt: new Date(), status: 'Available', source: 'wayback', reason: null, archiveTimestamp: new Date('2026-09-29') }] });
    expect(summarizeDashboardEvidence([p])).toMatchObject({ liveChecks: 0, archiveChecks: 1 });
  });
  it('does not accept an archive without its capture date', () => {
    const p = policy({ checkLogs: [{ checkedAt: new Date(), status: 'Available', source: 'wayback', reason: null, archiveTimestamp: null }] });
    expect(summarizeDashboardEvidence([p])).toMatchObject({ archiveChecks: 0, otherChecks: 1 });
  });
  it('orders checks chronologically and distinguishes pending from accepted baselines', () => {
    const p = policy(); p.checkLogs.push({ checkedAt: new Date('2026-10-02'), status: 'Needs Review', source: 'direct', reason: 'change_confirmation_pending', archiveTimestamp: null });
    expect(summarizeDashboardEvidence([p])).toMatchObject({ pendingChanges: 1, liveChecks: 0, publicBaselines: 1 });
  });
  it('never publishes a seeded or quarantined baseline', () => {
    expect(summarizeDashboardEvidence([policy({ ingestionMethod: 'Seeded' }), policy({ snapshots: [{ publicEvidence: false }] })]).publicBaselines).toBe(0);
  });
  it('uses the latest public analysis, not an older more complete row', () => {
    const p = policy(); p.changes.push({ createdAt: new Date('2026-10-02') });
    expect(summarizeDashboardEvidence([p]).assessedKpis).toBe(0);
  });
  it('handles an empty inventory without inventing coverage', () => {
    expect(summarizeDashboardEvidence([])).toMatchObject({ totalPolicies: 0, totalKpis: 0, latestCheckAt: null });
  });
});
describe('Shared risk scale', () => {
  it.each([[1,'Low'],[3,'Low'],[4,'Medium'],[6,'Medium'],[7,'High'],[10,'High']] as const)('maps %s to %s', (score, risk) => expect(riskFromScore(score)).toBe(risk));
  it.each([0,11,NaN,Infinity])('rejects invalid score %s', score => expect(() => riskFromScore(score)).toThrow());
  it('does not turn an unrecognized KPI into high risk', () => expect(getKpiConcernLevel('kpiDataCollection','invented value')).toBe('pending'));
});
