import {
  KPI_FIELD_KEYS,
  isAssessedKpiValue,
  type KpiField,
} from './metricsCatalog';

export { getKpiConcernLevel } from './metricsCatalog';
export type { KpiConcernLevel } from './metricsCatalog';

export interface KpiAuditChange extends Partial<Record<KpiField, string | null>> {
  id: string;
  policyName: string;
  overallScore: number;
  overallRisk: string;
  createdAt: Date | string;
}

export interface KpiEvidence {
  changeId: string;
  policyName: string;
  assessedAt: string;
}

export interface CompanyKpiAuditRow {
  companyId: string;
  companyName: string;
  industry: string;
  overallScore: number | null;
  overallRisk: string | null;
  latestPolicyName: string | null;
  lastAnalysis: string | null;
  kpiValues: Record<KpiField, string>;
  kpiEvidence: Partial<Record<KpiField, KpiEvidence>>;
  assessedCount: number;
  totalKpis: number;
  coveragePercent: number;
  assessmentState: 'pending' | 'partial' | 'complete';
}

function timestamp(value: Date | string): number {
  const parsed = value instanceof Date ? value : new Date(value);
  const result = parsed.getTime();
  return Number.isFinite(result) ? result : 0;
}

function iso(value: Date | string): string {
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : String(value);
}

export function buildCompanyKpiAuditRow(input: {
  companyId: string;
  companyName: string;
  industry: string;
  changes: KpiAuditChange[];
}): CompanyKpiAuditRow {
  const changes = [...input.changes].sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt));
  const latestChange = changes[0] || null;
  const kpiValues = Object.fromEntries(
    KPI_FIELD_KEYS.map((field) => [field, 'Not assessed'])
  ) as Record<KpiField, string>;
  const kpiEvidence: Partial<Record<KpiField, KpiEvidence>> = {};

  for (const change of changes) {
    for (const field of KPI_FIELD_KEYS) {
      if (kpiEvidence[field]) continue;
      const value = change[field];
      if (!isAssessedKpiValue(value)) continue;
      kpiValues[field] = value.trim();
      kpiEvidence[field] = {
        changeId: change.id,
        policyName: change.policyName,
        assessedAt: iso(change.createdAt),
      };
    }
  }

  const assessedCount = Object.keys(kpiEvidence).length;
  const totalKpis = KPI_FIELD_KEYS.length;

  return {
    companyId: input.companyId,
    companyName: input.companyName,
    industry: input.industry,
    overallScore: latestChange?.overallScore ?? null,
    overallRisk: latestChange?.overallRisk ?? null,
    latestPolicyName: latestChange?.policyName ?? null,
    lastAnalysis: latestChange ? iso(latestChange.createdAt) : null,
    kpiValues,
    kpiEvidence,
    assessedCount,
    totalKpis,
    coveragePercent: Math.round((assessedCount / totalKpis) * 100),
    assessmentState: assessedCount === 0 ? 'pending' : assessedCount === totalKpis ? 'complete' : 'partial',
  };
}
