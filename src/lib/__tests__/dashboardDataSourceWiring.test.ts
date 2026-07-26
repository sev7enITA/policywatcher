import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const dashboard = readFileSync('src/app/page.tsx', 'utf8');
const trends = readFileSync('src/components/charts/RiskTrendPanel.tsx', 'utf8');
const matrix = readFileSync('src/components/CrossCompanyMatrix.tsx', 'utf8');

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

  it('uses one dashboard view for rendering and export', () => {
    expect(dashboard).toContain('const filteredCompanies = dashboardDataView.companies');
    expect(dashboard).toContain('exportDashboardViewToCSV(');
    expect(dashboard).toContain('dashboardDataView,');
  });
});
