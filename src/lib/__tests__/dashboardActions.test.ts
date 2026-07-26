import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DASHBOARD_FILTER_STATE,
  reduceDashboardFilterState,
  validateDashboardAction,
  type DashboardAction,
} from '../dashboardActions';

describe('typed dashboard actions', () => {
  it('applies a validated filter transition without mutating prior state', () => {
    const initial = { ...DEFAULT_DASHBOARD_FILTER_STATE };
    const next = reduceDashboardFilterState(initial, {
      type: 'setFilter',
      source: 'commandPalette',
      target: 'risk',
      value: 'High',
    });

    expect(next.risk).toBe('High');
    expect(initial.risk).toBe('all');
    expect(next).not.toBe(initial);
  });

  it('resets every filter and context dimension through one action', () => {
    const next = reduceDashboardFilterState(
      {
        industry: 'FinTech',
        risk: 'High',
        region: 'US',
        perspective: 'Enterprise',
        dateRange: '30d',
        search: 'retention',
      },
      { type: 'resetFilters', source: 'filters', target: 'allFilters' }
    );

    expect(next).toEqual(DEFAULT_DASHBOARD_FILTER_STATE);
  });

  it('fails closed for an unknown source or payload', () => {
    const invalidSource = {
      type: 'setFilter',
      source: 'remote-script',
      target: 'risk',
      value: 'High',
    } as unknown as DashboardAction;
    const invalidValue = {
      type: 'setFilter',
      source: 'filters',
      target: 'region',
      value: 'PrivateCloud',
    } as unknown as DashboardAction;

    expect(validateDashboardAction(invalidSource).valid).toBe(false);
    expect(validateDashboardAction(invalidValue).valid).toBe(false);
    expect(
      reduceDashboardFilterState({ ...DEFAULT_DASHBOARD_FILTER_STATE }, invalidValue)
    ).toEqual(DEFAULT_DASHBOARD_FILTER_STATE);
  });

  it('rejects a type-correct payload when its source-target edge is not registered', () => {
    const undeclaredEdge = {
      type: 'setFilter',
      source: 'commandPalette',
      target: 'search',
      value: 'retention',
    } as DashboardAction;

    expect(validateDashboardAction(undeclaredEdge)).toEqual({
      valid: false,
      reason: 'Action edge setFilter:commandPalette->search is not registered.',
    });
  });
});
