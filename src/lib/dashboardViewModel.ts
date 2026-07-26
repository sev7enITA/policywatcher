import type { Company, Perspective, Region } from '@/types';
import type { DateRangeFilter, RiskFilter } from './dashboardActions';
import {
  PUBLIC_DATA_SOURCES,
  getPublicDataSourceQueryKey,
  type EvidenceGate,
  type PublicDataSourceId,
} from './dataSourceRegistry';

export type DashboardSortBy =
  | 'risk-desc'
  | 'risk-asc'
  | 'date-desc'
  | 'date-asc'
  | 'name-asc'
  | 'name-desc';

export interface DashboardViewFilters {
  search: string;
  industry: string;
  risk: RiskFilter;
  dateRange: DateRangeFilter;
  sortBy: DashboardSortBy;
  region: Region;
  perspective: Perspective;
}

export interface DashboardViewManifest {
  schema: 'policywatcher.dashboard-view.v1';
  viewId: string;
  sourceId: PublicDataSourceId;
  sourceQueryKey: string;
  visibilityContext: 'public';
  evidenceGate: EvidenceGate;
  filters: DashboardViewFilters;
  coverage: {
    sourceCompanies: number;
    visibleCompanies: number;
    sourcePolicies: number;
    visiblePolicies: number;
    visibleChangeRows: number;
  };
  limitationKeys: readonly string[];
}

export interface DashboardViewModel {
  companies: Company[];
  activeFilterCount: number;
  manifest: DashboardViewManifest;
}

function dateCutoff(dateRange: DateRangeFilter, now: Date): Date | null {
  if (dateRange === 'all') return null;
  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function latestCompanyChange(company: Company) {
  return company.policies[0]?.changes[0];
}

function canonicalViewId(filters: DashboardViewFilters): string {
  const params = new URLSearchParams({
    dateRange: filters.dateRange,
    industry: filters.industry,
    perspective: filters.perspective,
    region: filters.region,
    risk: filters.risk,
    search: filters.search.trim(),
    sortBy: filters.sortBy,
  });
  params.sort();
  return `policywatcher.dashboard-view.v1?${params.toString()}`;
}

/** Builds the exact authorized view consumed by both the home and export. */
export function buildDashboardViewModel(
  companies: readonly Company[],
  filters: DashboardViewFilters,
  now: Date = new Date()
): DashboardViewModel {
  const normalizedSearch = filters.search.trim().toLowerCase();
  const cutoff = dateCutoff(filters.dateRange, now);

  const visibleCompanies = companies
    .filter((company) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        company.name.toLowerCase().includes(normalizedSearch) ||
        company.policies.some(
          (policy) =>
            policy.name.toLowerCase().includes(normalizedSearch) ||
            policy.type.toLowerCase().includes(normalizedSearch) ||
            policy.jurisdiction.toLowerCase().includes(normalizedSearch)
        );
      const matchesIndustry = filters.industry === 'all' || company.industry === filters.industry;
      const matchesRisk =
        filters.risk === 'all' ||
        company.policies.some((policy) => policy.changes[0]?.overallRisk === filters.risk);
      const matchesDate =
        !cutoff ||
        company.policies.some((policy) => {
          const createdAt = policy.changes[0]?.createdAt;
          return Boolean(createdAt && new Date(createdAt) >= cutoff);
        });

      return matchesSearch && matchesIndustry && matchesRisk && matchesDate;
    })
    .sort((left, right) => {
      const leftChange = latestCompanyChange(left);
      const rightChange = latestCompanyChange(right);

      switch (filters.sortBy) {
        case 'risk-desc':
          return (rightChange?.overallScore || 0) - (leftChange?.overallScore || 0);
        case 'risk-asc':
          return (leftChange?.overallScore || 0) - (rightChange?.overallScore || 0);
        case 'date-desc':
          return new Date(rightChange?.createdAt || 0).getTime() - new Date(leftChange?.createdAt || 0).getTime();
        case 'date-asc':
          return new Date(leftChange?.createdAt || 0).getTime() - new Date(rightChange?.createdAt || 0).getTime();
        case 'name-asc':
          return left.name.localeCompare(right.name);
        case 'name-desc':
          return right.name.localeCompare(left.name);
      }

      return 0;
    });

  const activeFilterCount = [
    filters.risk !== 'all',
    filters.dateRange !== 'all',
    filters.industry !== 'all',
    normalizedSearch.length > 0,
  ].filter(Boolean).length;
  const sourceSpec = PUBLIC_DATA_SOURCES.dashboardCompanies;

  return {
    companies: visibleCompanies,
    activeFilterCount,
    manifest: {
      schema: 'policywatcher.dashboard-view.v1',
      viewId: canonicalViewId(filters),
      sourceId: sourceSpec.id,
      sourceQueryKey: getPublicDataSourceQueryKey(sourceSpec.id),
      visibilityContext: sourceSpec.visibilityContext,
      evidenceGate: sourceSpec.evidenceGate,
      filters: { ...filters, search: filters.search.trim() },
      coverage: {
        sourceCompanies: companies.length,
        visibleCompanies: visibleCompanies.length,
        sourcePolicies: companies.reduce((total, company) => total + company.policies.length, 0),
        visiblePolicies: visibleCompanies.reduce((total, company) => total + company.policies.length, 0),
        visibleChangeRows: visibleCompanies.reduce(
          (total, company) =>
            total + company.policies.filter((policy) => Boolean(policy.changes[0])).length,
          0
        ),
      },
      limitationKeys: Object.freeze([
        'latest-public-change-per-policy',
        'company-match-exports-all-visible-company-policies',
      ]),
    },
  };
}
