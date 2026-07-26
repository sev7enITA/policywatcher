import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const dashboard = readFileSync('src/app/page.tsx', 'utf8');
const trends = readFileSync('src/components/charts/RiskTrendPanel.tsx', 'utf8');
const matrix = readFileSync('src/components/CrossCompanyMatrix.tsx', 'utf8');
const policyDetails = readFileSync('src/components/PolicyDetails.tsx', 'utf8');
const compare = readFileSync('src/components/CompareModal.tsx', 'utf8');
const compareApi = readFileSync('src/app/api/compare/route.ts', 'utf8');

describe('evidence-first data-source wiring', () => {
  it('routes public dashboard loads through the allowlisted registry', () => {
    expect(dashboard).toContain("loadPublicDataSource<Company[]>('dashboardCompanies')");
    expect(dashboard).toContain("('sourceSuspensions')");
    expect(dashboard).toContain("('marketPulse', query)");
  });

  it('routes trends and KPI matrix through registered sources', () => {
    expect(trends).toContain("'riskTrends'");
    expect(matrix).toContain("loadPublicDataSource<MatrixResponse>('kpiMatrix')");
  });

  it('routes dynamic public policy details through the registered path template', () => {
    expect(policyDetails).toContain("loadPublicDataSource<FullPolicyDetails>('policyDetails', { policyId })");
    expect(policyDetails).not.toContain('fetch(`/api/policies/${policyId}`)');
  });

  it('routes public company benchmarks through the registered comparison source', () => {
    expect(compare).toContain("loadPublicDataSource<CompareResponse>('companyComparison'");
    expect(compare).not.toContain('fetch(`/api/compare');
  });

  it('uses canonical KPI semantics and keeps missing comparison evidence unassessed', () => {
    expect(compareApi).toContain("from '@/lib/metricsCatalog'");
    expect(compareApi).toContain('getMoreConcerningKpiValue');
    expect(compareApi).toContain('isAssessedKpiValue');
    expect(compareApi).toContain('let overallScore: number | null = null');
    expect(compareApi).not.toContain('const kpiWeights');
  });

  it('uses one dashboard view for rendering and export', () => {
    expect(dashboard).toContain('const filteredCompanies = dashboardDataView.companies');
    expect(dashboard).toContain('exportDashboardViewToCSV(');
    expect(dashboard).toContain('dashboardDataView,');
  });
});
