import {
  DASHBOARD_MODULES,
  PINNED_SAFETY_MODULE,
  getDashboardModuleInstanceId,
  type DashboardModuleId,
  type WorkspaceIntent,
} from './dashboardGrammar';

export type DashboardLayoutBreakpoint = 'wide' | 'compact' | 'mobile';

export interface DashboardModulePlacement {
  readonly moduleId: DashboardModuleId;
  readonly columnSpan: number;
}

export interface DashboardBreakpointLayout {
  readonly id: DashboardLayoutBreakpoint;
  readonly columns: number;
  readonly linearFallback: boolean;
  readonly placements: readonly DashboardModulePlacement[];
}

export interface DashboardLayoutSpec {
  readonly id: string;
  readonly breakpoints: Readonly<Record<DashboardLayoutBreakpoint, DashboardBreakpointLayout>>;
}

export interface DashboardLayoutIssue {
  code:
    | 'layout.columns_invalid'
    | 'layout.module_unknown'
    | 'layout.module_duplicate'
    | 'layout.module_missing'
    | 'layout.span_invalid'
    | 'layout.mobile_not_linear'
    | 'layout.safety_missing';
  path: string;
  message: string;
}

const MODULE_IDS = Object.keys(DASHBOARD_MODULES) as DashboardModuleId[];

function placements(columns: number, wide = false): readonly DashboardModulePlacement[] {
  return Object.freeze(
    MODULE_IDS.map((moduleId) => Object.freeze({
      moduleId,
      columnSpan: wide && (moduleId === 'observatory' || moduleId === 'stats') ? 1 : columns,
    }))
  );
}

export const DASHBOARD_LAYOUT_SPEC: DashboardLayoutSpec = Object.freeze({
  id: 'policywatcher.dashboard.layout.evidence-flow.v1',
  breakpoints: Object.freeze({
    wide: Object.freeze({
      id: 'wide',
      columns: 2,
      linearFallback: false,
      placements: placements(2, true),
    }),
    compact: Object.freeze({
      id: 'compact',
      columns: 1,
      linearFallback: true,
      placements: placements(1),
    }),
    mobile: Object.freeze({
      id: 'mobile',
      columns: 1,
      linearFallback: true,
      placements: placements(1),
    }),
  }),
});

export function validateDashboardLayout(spec: DashboardLayoutSpec): DashboardLayoutIssue[] {
  const issues: DashboardLayoutIssue[] = [];

  for (const [breakpoint, layout] of Object.entries(spec.breakpoints)) {
    if (!Number.isInteger(layout.columns) || layout.columns < 1) {
      issues.push({
        code: 'layout.columns_invalid',
        path: `breakpoints.${breakpoint}.columns`,
        message: `Breakpoint ${breakpoint} must define at least one column.`,
      });
    }
    const seen = new Set<string>();
    for (const [index, placement] of layout.placements.entries()) {
      if (!DASHBOARD_MODULES[placement.moduleId]) {
        issues.push({
          code: 'layout.module_unknown',
          path: `breakpoints.${breakpoint}.placements.${index}`,
          message: `Unknown layout module ${placement.moduleId}.`,
        });
      }
      if (seen.has(placement.moduleId)) {
        issues.push({
          code: 'layout.module_duplicate',
          path: `breakpoints.${breakpoint}.placements.${index}`,
          message: `Module ${placement.moduleId} is placed more than once.`,
        });
      }
      seen.add(placement.moduleId);
      if (
        !Number.isInteger(placement.columnSpan) ||
        placement.columnSpan < 1 ||
        placement.columnSpan > layout.columns
      ) {
        issues.push({
          code: 'layout.span_invalid',
          path: `breakpoints.${breakpoint}.placements.${index}.columnSpan`,
          message: `Module ${placement.moduleId} has an invalid column span.`,
        });
      }
    }
    for (const moduleId of MODULE_IDS) {
      if (!seen.has(moduleId)) {
        issues.push({
          code: 'layout.module_missing',
          path: `breakpoints.${breakpoint}.placements`,
          message: `Module ${moduleId} is missing from breakpoint ${breakpoint}.`,
        });
      }
    }
    if (!seen.has(PINNED_SAFETY_MODULE)) {
      issues.push({
        code: 'layout.safety_missing',
        path: `breakpoints.${breakpoint}.placements`,
        message: `Breakpoint ${breakpoint} omits the Source QA safety module.`,
      });
    }
  }

  const mobile = spec.breakpoints.mobile;
  if (
    mobile.columns !== 1 ||
    !mobile.linearFallback ||
    mobile.placements.some((placement) => placement.columnSpan !== 1)
  ) {
    issues.push({
      code: 'layout.mobile_not_linear',
      path: 'breakpoints.mobile',
      message: 'Mobile layout must be a single-column linear fallback.',
    });
  }

  return issues;
}

export const DASHBOARD_LAYOUT_ISSUES = validateDashboardLayout(DASHBOARD_LAYOUT_SPEC);

if (DASHBOARD_LAYOUT_ISSUES.length > 0) {
  throw new Error(
    `Invalid built-in dashboard layout: ${DASHBOARD_LAYOUT_ISSUES
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join('; ')}`
  );
}

export function getDashboardModuleDomProps(
  intent: WorkspaceIntent,
  moduleId: DashboardModuleId
): {
  id: string;
  'data-dashboard-module': DashboardModuleId;
  'data-wide-span': number;
  'data-compact-span': number;
  'data-mobile-span': number;
} {
  const placement = (breakpoint: DashboardLayoutBreakpoint) =>
    DASHBOARD_LAYOUT_SPEC.breakpoints[breakpoint].placements.find(
      (candidate) => candidate.moduleId === moduleId
    )!;

  return {
    id: getDashboardModuleInstanceId(intent, moduleId),
    'data-dashboard-module': moduleId,
    'data-wide-span': placement('wide').columnSpan,
    'data-compact-span': placement('compact').columnSpan,
    'data-mobile-span': placement('mobile').columnSpan,
  };
}
