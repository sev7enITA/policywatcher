import { describe, expect, it } from 'vitest';
import {
  DASHBOARD_LAYOUT_ISSUES,
  DASHBOARD_LAYOUT_SPEC,
  getDashboardModuleDomProps,
  validateDashboardLayout,
  type DashboardLayoutSpec,
} from '../dashboardLayout';
import { DASHBOARD_MODULES, PINNED_SAFETY_MODULE } from '../dashboardGrammar';

describe('declarative dashboard layout', () => {
  it('covers every module and provides a linear mobile fallback', () => {
    expect(DASHBOARD_LAYOUT_ISSUES).toEqual([]);
    expect(Object.isFrozen(DASHBOARD_LAYOUT_SPEC)).toBe(true);
    const mobile = DASHBOARD_LAYOUT_SPEC.breakpoints.mobile;

    expect(mobile.columns).toBe(1);
    expect(mobile.linearFallback).toBe(true);
    expect(mobile.placements.map((placement) => placement.moduleId).sort()).toEqual(
      Object.keys(DASHBOARD_MODULES).sort()
    );
    expect(mobile.placements[0].moduleId).toBe(PINNED_SAFETY_MODULE);
    expect(mobile.placements.every((placement) => placement.columnSpan === 1)).toBe(true);
  });

  it('exposes deterministic module identity and breakpoint placement metadata', () => {
    expect(getDashboardModuleDomProps('research', 'observatory')).toEqual({
      id: 'pw-dashboard-1-research-observatory',
      'data-dashboard-module': 'observatory',
      'data-wide-span': 1,
      'data-compact-span': 1,
      'data-mobile-span': 1,
    });
    expect(getDashboardModuleDomProps('grc', 'sourceQuality')['data-wide-span']).toBe(2);
  });

  it('rejects missing modules, invalid spans, and non-linear mobile layouts', () => {
    const invalid = {
      ...DASHBOARD_LAYOUT_SPEC,
      breakpoints: {
        ...DASHBOARD_LAYOUT_SPEC.breakpoints,
        mobile: {
          ...DASHBOARD_LAYOUT_SPEC.breakpoints.mobile,
          columns: 2,
          linearFallback: false,
          placements: [
            { moduleId: 'sourceQuality', columnSpan: 3 },
          ],
        },
      },
    } as DashboardLayoutSpec;

    const codes = validateDashboardLayout(invalid).map((issue) => issue.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        'layout.module_missing',
        'layout.span_invalid',
        'layout.mobile_not_linear',
      ])
    );
  });
});
