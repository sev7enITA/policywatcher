import type { Lang, Perspective, Region } from '@/types';
import {
  DEFAULT_DASHBOARD_FILTER_STATE,
  type DashboardFilterState,
  type DateRangeFilter,
  type RiskFilter,
} from './dashboardActions';
import type { DashboardSortBy } from './dashboardViewModel';

export const DASHBOARD_SHARE_SCHEMA = '1' as const;

export interface DashboardShareState extends DashboardFilterState {
  sortBy: DashboardSortBy;
  lang: Lang;
}

export interface DecodedDashboardShareQuery {
  hasDashboardParams: boolean;
  state: DashboardShareState;
  issues: readonly string[];
}

export const DEFAULT_DASHBOARD_SHARE_STATE: Readonly<DashboardShareState> = Object.freeze({
  ...DEFAULT_DASHBOARD_FILTER_STATE,
  sortBy: 'risk-desc',
  lang: 'en',
});

const DASHBOARD_QUERY_KEYS = Object.freeze([
  'dv',
  'industry',
  'risk',
  'region',
  'audience',
  'range',
  'q',
  'sort',
  'lang',
] as const);

const RISK_VALUES = new Set<RiskFilter>(['all', 'Low', 'Medium', 'High']);
const REGION_VALUES = new Set<Region>(['EU', 'US', 'Global']);
const PERSPECTIVE_VALUES = new Set<Perspective>(['Individual', 'Enterprise']);
const DATE_RANGE_VALUES = new Set<DateRangeFilter>(['all', '7d', '30d', '90d']);
const SORT_VALUES = new Set<DashboardSortBy>([
  'risk-desc',
  'risk-asc',
  'date-desc',
  'date-asc',
  'name-asc',
  'name-desc',
]);
const LANG_VALUES = new Set<Lang>(['en', 'it']);

function paramsFrom(search: string | URLSearchParams): URLSearchParams {
  return typeof search === 'string'
    ? new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
    : new URLSearchParams(search);
}

function isBoundedText(value: string, maxLength: number): boolean {
  return value.length <= maxLength && !/[\u0000-\u001f\u007f]/.test(value);
}

/** Decodes a compact public dashboard view while failing closed to safe defaults. */
export function decodeDashboardShareQuery(
  search: string | URLSearchParams,
): DecodedDashboardShareQuery {
  const params = paramsFrom(search);
  const issues: string[] = [];
  const state: DashboardShareState = { ...DEFAULT_DASHBOARD_SHARE_STATE };
  const hasDashboardParams = DASHBOARD_QUERY_KEYS.some((key) => params.has(key));

  const schema = params.get('dv');
  if (schema && schema !== DASHBOARD_SHARE_SCHEMA) issues.push('Unsupported dashboard view schema.');

  const industry = params.get('industry');
  if (industry !== null) {
    const normalized = industry.trim();
    if (normalized && isBoundedText(normalized, 80)) state.industry = normalized;
    else issues.push('Invalid industry filter.');
  }

  const risk = params.get('risk');
  if (risk !== null) {
    if (RISK_VALUES.has(risk as RiskFilter)) state.risk = risk as RiskFilter;
    else issues.push('Invalid risk filter.');
  }

  const region = params.get('region');
  if (region !== null) {
    if (REGION_VALUES.has(region as Region)) state.region = region as Region;
    else issues.push('Invalid region filter.');
  }

  const perspective = params.get('audience');
  if (perspective !== null) {
    if (PERSPECTIVE_VALUES.has(perspective as Perspective)) {
      state.perspective = perspective as Perspective;
    } else issues.push('Invalid audience filter.');
  }

  const dateRange = params.get('range');
  if (dateRange !== null) {
    if (DATE_RANGE_VALUES.has(dateRange as DateRangeFilter)) {
      state.dateRange = dateRange as DateRangeFilter;
    } else issues.push('Invalid date range.');
  }

  const searchQuery = params.get('q');
  if (searchQuery !== null) {
    if (isBoundedText(searchQuery, 200)) state.search = searchQuery;
    else issues.push('Invalid search query.');
  }

  const sortBy = params.get('sort');
  if (sortBy !== null) {
    if (SORT_VALUES.has(sortBy as DashboardSortBy)) state.sortBy = sortBy as DashboardSortBy;
    else issues.push('Invalid sort order.');
  }

  const lang = params.get('lang');
  if (lang !== null) {
    if (LANG_VALUES.has(lang as Lang)) state.lang = lang as Lang;
    else issues.push('Invalid language.');
  }

  return { hasDashboardParams, state, issues: Object.freeze(issues) };
}

/**
 * Produces a deterministic, minimal query and preserves unrelated route state.
 * Default values are omitted; `dv=1` is emitted only for a configured view.
 */
export function encodeDashboardShareQuery(
  search: string | URLSearchParams,
  state: DashboardShareState,
): string {
  const params = paramsFrom(search);
  for (const key of DASHBOARD_QUERY_KEYS) params.delete(key);

  const normalizedSearch = state.search.trim();
  const entries: Array<[string, string, boolean]> = [
    ['industry', state.industry.trim(), state.industry.trim() !== DEFAULT_DASHBOARD_SHARE_STATE.industry],
    ['risk', state.risk, state.risk !== DEFAULT_DASHBOARD_SHARE_STATE.risk],
    ['region', state.region, state.region !== DEFAULT_DASHBOARD_SHARE_STATE.region],
    ['audience', state.perspective, state.perspective !== DEFAULT_DASHBOARD_SHARE_STATE.perspective],
    ['range', state.dateRange, state.dateRange !== DEFAULT_DASHBOARD_SHARE_STATE.dateRange],
    ['q', normalizedSearch, normalizedSearch !== DEFAULT_DASHBOARD_SHARE_STATE.search],
    ['sort', state.sortBy, state.sortBy !== DEFAULT_DASHBOARD_SHARE_STATE.sortBy],
    ['lang', state.lang, state.lang !== DEFAULT_DASHBOARD_SHARE_STATE.lang],
  ];

  const configured = entries.some(([, , include]) => include);
  if (configured) params.set('dv', DASHBOARD_SHARE_SCHEMA);
  for (const [key, value, include] of entries) {
    if (include) params.set(key, value);
  }

  params.sort();
  return params.toString();
}
