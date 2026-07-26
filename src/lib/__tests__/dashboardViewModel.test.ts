import { describe, expect, it } from 'vitest';
import type { Company, PolicyChange } from '@/types';
import {
  buildDashboardViewModel,
  type DashboardViewFilters,
} from '../dashboardViewModel';

function change(risk: PolicyChange['overallRisk'], score: number, createdAt: string): PolicyChange {
  return {
    id: `${risk}-${createdAt}`,
    policyId: 'policy',
    oldSnapshotId: null,
    newSnapshotId: 'snapshot',
    diff: '[]',
    aiSummaryEn: 'Summary',
    aiSummaryIt: 'Sommario',
    overallRisk: risk,
    overallScore: score,
    remediationsJson: '[]',
    publicEvidence: true,
    aiTrainingOptOut: 'Available',
    aiDataScrapingRestricted: 'Restricted',
    aiIpLicensing: 'User Retained',
    aiPromptRetention: 'Defined',
    createdAt,
    regionImpacts: [],
  };
}

function company(
  id: string,
  name: string,
  industry: string,
  policyChange: PolicyChange
): Company {
  return {
    id,
    name,
    slug: id,
    logo: '#000',
    industry,
    website: `https://${id}.example`,
    policies: [
      {
        id: `${id}-policy`,
        companyId: id,
        name: `${name} Privacy`,
        type: 'privacy',
        url: `https://${id}.example/privacy`,
        jurisdiction: 'Global',
        currentText: '',
        currentHash: '',
        dataStatus: 'Available',
        ingestionMethod: 'Live',
        updatedAt: policyChange.createdAt,
        changes: [policyChange],
      },
    ],
  };
}

const DEFAULT_FILTERS: DashboardViewFilters = {
  search: '',
  industry: 'all',
  risk: 'all',
  dateRange: 'all',
  sortBy: 'risk-desc',
  region: 'EU',
  perspective: 'Individual',
};

describe('dashboard view model', () => {
  const source = [
    company('low', 'Alpha', 'Tech Giant', change('Low', 2, '2026-05-01T00:00:00.000Z')),
    company('high', 'Beta', 'FinTech', change('High', 8, '2026-07-20T00:00:00.000Z')),
  ];

  it('applies the screen filters and reports coverage without mutating source order', () => {
    const view = buildDashboardViewModel(
      source,
      { ...DEFAULT_FILTERS, industry: 'FinTech', risk: 'High', dateRange: '30d' },
      new Date('2026-07-26T00:00:00.000Z')
    );

    expect(view.companies.map((item) => item.name)).toEqual(['Beta']);
    expect(source.map((item) => item.name)).toEqual(['Alpha', 'Beta']);
    expect(view.activeFilterCount).toBe(3);
    expect(view.manifest.coverage).toEqual({
      sourceCompanies: 2,
      visibleCompanies: 1,
      sourcePolicies: 2,
      visiblePolicies: 1,
      visibleChangeRows: 1,
    });
  });

  it('uses deterministic sorting, source identity, and evidence metadata', () => {
    const view = buildDashboardViewModel(source, DEFAULT_FILTERS);

    expect(view.companies.map((item) => item.name)).toEqual(['Beta', 'Alpha']);
    expect(view.manifest).toMatchObject({
      schema: 'policywatcher.dashboard-view.v1',
      sourceId: 'dashboardCompanies',
      visibilityContext: 'public',
      evidenceGate: 'public-policy',
    });
    expect(view.manifest.sourceQueryKey).toContain('/api/companies');
    expect(view.manifest.viewId).toContain('region=EU');
  });

  it('keeps context dimensions in the view identity even when rows are unchanged', () => {
    const individual = buildDashboardViewModel(source, DEFAULT_FILTERS);
    const enterprise = buildDashboardViewModel(source, {
      ...DEFAULT_FILTERS,
      region: 'US',
      perspective: 'Enterprise',
    });

    expect(enterprise.companies).toEqual(individual.companies);
    expect(enterprise.manifest.viewId).not.toBe(individual.manifest.viewId);
  });
});
