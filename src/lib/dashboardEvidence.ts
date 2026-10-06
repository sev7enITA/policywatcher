import { KPI_ALLOWED_VALUES, KPI_FIELD_KEYS } from '@/lib/metricsCatalog';

export interface EvidencePolicy {
  id: string;
  dataStatus: string;
  ingestionMethod: string;
  snapshots: { publicEvidence: boolean }[];
  checkLogs: { checkedAt: Date; status: string; source: string | null; reason: string | null; archiveTimestamp: Date | null }[];
  changes: ({ createdAt: Date } & Partial<Record<typeof KPI_FIELD_KEYS[number], string | null>>)[];
}

/** Aggregates independent facts; no confidence probability is inferred. */
export function summarizeDashboardEvidence(policies: EvidencePolicy[]) {
  const result = { totalPolicies: policies.length, publicBaselines: 0, liveChecks: 0, archiveChecks: 0,
    pendingChanges: 0, unavailableChecks: 0, otherChecks: 0, assessedPolicies: 0,
    assessedKpis: 0, totalKpis: 0, latestCheckAt: null as string | null };
  for (const policy of policies) {
    const latest = [...policy.checkLogs].sort((a, b) => b.checkedAt.getTime() - a.checkedAt.getTime())[0];
    const published = ['Available', 'Reviewed'].includes(policy.dataStatus)
      && policy.ingestionMethod.toLowerCase() !== 'seeded'
      && policy.snapshots.some(s => s.publicEvidence);
    if (published) {
      result.publicBaselines++;
      result.totalKpis += KPI_FIELD_KEYS.length;
      const change = [...policy.changes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      if (change) {
        result.assessedPolicies++;
        result.assessedKpis += KPI_FIELD_KEYS.filter(field => KPI_ALLOWED_VALUES[field].includes(change[field] || '')).length;
      }
    }
    if (latest && (!result.latestCheckAt || latest.checkedAt.getTime() > Date.parse(result.latestCheckAt))) result.latestCheckAt = latest.checkedAt.toISOString();
    if (latest?.reason === 'change_confirmation_pending') result.pendingChanges++;
    else if (latest?.status === 'Unavailable') result.unavailableChecks++;
    else if (latest?.status === 'Available' && ['direct', 'http2', 'rendered'].includes(latest.source || '')) result.liveChecks++;
    else if (latest?.status === 'Available' && ['wayback', 'commoncrawl'].includes(latest.source || '') && latest.archiveTimestamp) result.archiveChecks++;
    else result.otherChecks++;
  }
  return result;
}

export type DashboardEvidenceSummary = ReturnType<typeof summarizeDashboardEvidence>;
