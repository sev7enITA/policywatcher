import type { Perspective, Region, RiskLevel } from '@/types';
import {
  isDashboardActionEdgeAllowed,
  type DashboardActionGraphSource,
} from './dashboardActionGraph';

export type RiskFilter = 'all' | RiskLevel;
export type DateRangeFilter = 'all' | '7d' | '30d' | '90d';
export type DashboardActionSource = DashboardActionGraphSource;

export type DashboardAction =
  | { type: 'setFilter'; source: DashboardActionSource; target: 'industry'; value: string }
  | { type: 'setFilter'; source: DashboardActionSource; target: 'risk'; value: RiskFilter }
  | { type: 'setFilter'; source: DashboardActionSource; target: 'region'; value: Region }
  | { type: 'setFilter'; source: DashboardActionSource; target: 'perspective'; value: Perspective }
  | { type: 'setFilter'; source: DashboardActionSource; target: 'dateRange'; value: DateRangeFilter }
  | { type: 'setFilter'; source: DashboardActionSource; target: 'search'; value: string }
  | {
      type: 'setContext';
      source: DashboardActionSource;
      target: 'regionalContext';
      value: { region: Region; perspective: Perspective };
    }
  | { type: 'resetFilters'; source: DashboardActionSource; target: 'allFilters' };

export interface DashboardFilterState {
  industry: string;
  risk: RiskFilter;
  region: Region;
  perspective: Perspective;
  dateRange: DateRangeFilter;
  search: string;
}

export interface DashboardActionValidation {
  valid: boolean;
  reason?: string;
}

export const DEFAULT_DASHBOARD_FILTER_STATE: Readonly<DashboardFilterState> = Object.freeze({
  industry: 'all',
  risk: 'all',
  region: 'EU',
  perspective: 'Individual',
  dateRange: 'all',
  search: '',
});

const RISK_VALUES = new Set<RiskFilter>(['all', 'Low', 'Medium', 'High']);
const REGION_VALUES = new Set<Region>(['EU', 'US', 'Global']);
const PERSPECTIVE_VALUES = new Set<Perspective>(['Individual', 'Enterprise']);
const DATE_RANGE_VALUES = new Set<DateRangeFilter>(['all', '7d', '30d', '90d']);

/** Runtime guard for action payloads entering from UI events or serialized state. */
export function validateDashboardAction(action: DashboardAction): DashboardActionValidation {
  if (!isDashboardActionEdgeAllowed(action.type, action.source, action.target)) {
    return {
      valid: false,
      reason: `Action edge ${action.type}:${action.source}->${action.target} is not registered.`,
    };
  }
  if (action.type === 'resetFilters') {
    return action.target === 'allFilters'
      ? { valid: true }
      : { valid: false, reason: 'Reset actions can target only allFilters.' };
  }
  if (action.type === 'setContext') {
    return REGION_VALUES.has(action.value.region) && PERSPECTIVE_VALUES.has(action.value.perspective)
      ? { valid: true }
      : { valid: false, reason: 'Unsupported regional context.' };
  }

  if (action.target === 'industry') {
    const value = action.value.trim();
    return value.length > 0 && value.length <= 80 && !/[\u0000-\u001f]/.test(value)
      ? { valid: true }
      : { valid: false, reason: 'Industry must be a non-empty display value of at most 80 characters.' };
  }
  if (action.target === 'search') {
    return action.value.length <= 200
      ? { valid: true }
      : { valid: false, reason: 'Search input exceeds 200 characters.' };
  }
  if (action.target === 'risk') {
    return RISK_VALUES.has(action.value)
      ? { valid: true }
      : { valid: false, reason: `Unsupported risk filter: ${action.value}` };
  }
  if (action.target === 'region') {
    return REGION_VALUES.has(action.value)
      ? { valid: true }
      : { valid: false, reason: `Unsupported region: ${action.value}` };
  }
  if (action.target === 'perspective') {
    return PERSPECTIVE_VALUES.has(action.value)
      ? { valid: true }
      : { valid: false, reason: `Unsupported perspective: ${action.value}` };
  }
  if (action.target === 'dateRange') {
    return DATE_RANGE_VALUES.has(action.value)
      ? { valid: true }
      : { valid: false, reason: `Unsupported date range: ${action.value}` };
  }

  return { valid: false, reason: 'Unsupported dashboard action.' };
}

/** Pure state transition shared by tests and non-React consumers. */
export function reduceDashboardFilterState(
  state: DashboardFilterState,
  action: DashboardAction
): DashboardFilterState {
  if (!validateDashboardAction(action).valid) return state;
  if (action.type === 'resetFilters') return { ...DEFAULT_DASHBOARD_FILTER_STATE };
  if (action.type === 'setContext') {
    return {
      ...state,
      region: action.value.region,
      perspective: action.value.perspective,
    };
  }
  return { ...state, [action.target]: action.value };
}
