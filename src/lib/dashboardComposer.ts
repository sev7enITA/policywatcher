import {
  DASHBOARD_INTENT_SPECS,
  DASHBOARD_MODULES,
  DASHBOARD_SCHEMA_VERSION,
  PINNED_SAFETY_MODULE,
  type DashboardAccent,
  type DashboardDensity,
  type DashboardModuleId,
  type DashboardView,
  type EvidenceDepth,
  type WorkspaceIntent,
} from './dashboardGrammar';
import { DASHBOARD_ACTION_GRAPH } from './dashboardActionGraph';
import { DASHBOARD_LAYOUT_SPEC } from './dashboardLayout';

export {
  DASHBOARD_MODULES,
  DASHBOARD_REGISTRY,
  DASHBOARD_REGISTRY_VALIDATION,
  DASHBOARD_SCHEMA_VERSION,
  PINNED_SAFETY_MODULE,
  getDashboardIntentSpecId,
  getDashboardModuleInstanceId,
  validateDashboardRegistry,
} from './dashboardGrammar';
export type {
  DashboardAccent,
  DashboardDensity,
  DashboardIntentSpec,
  DashboardModuleDefinition,
  DashboardModuleId,
  DashboardRegistry,
  DashboardValidationIssue,
  DashboardValidationResult,
  DashboardView,
  EvidenceDepth,
  WorkspaceIntent,
} from './dashboardGrammar';

export interface DashboardComposition {
  specId: string;
  schemaVersion: typeof DASHBOARD_SCHEMA_VERSION;
  actionGraphId: string;
  layoutId: string;
  intent: WorkspaceIntent;
  depth: EvidenceDepth;
  density: DashboardDensity;
  view: DashboardView;
  accent: DashboardAccent;
  primaryModules: DashboardModuleId[];
  supportingModules: DashboardModuleId[];
  visibleModules: DashboardModuleId[];
  orderedModules: DashboardModuleId[];
  showStats: boolean;
  showMarketPulse: boolean;
}

export const DEFAULT_WORKSPACE_INTENT: WorkspaceIntent = 'citizen';
export const DEFAULT_EVIDENCE_DEPTH: EvidenceDepth = 'snapshot';

function uniqueModules(modules: readonly DashboardModuleId[]): DashboardModuleId[] {
  return Array.from(new Set(modules));
}

export function normalizeWorkspaceIntent(value: string | null | undefined): WorkspaceIntent | null {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'citizen' || normalized === 'grc' || normalized === 'research' || normalized === 'builder') {
    return normalized;
  }
  return null;
}

export function normalizeEvidenceDepth(value: string | null | undefined): EvidenceDepth | null {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'snapshot' || normalized === 'operational' || normalized === 'forensic') {
    return normalized;
  }
  return null;
}

export function composeDashboard(intent: WorkspaceIntent, depth: EvidenceDepth): DashboardComposition {
  const spec = DASHBOARD_INTENT_SPECS[intent];
  let primaryModules = [...spec.primaryModules];
  let supportingModules = [...spec.supportingModules];

  if (depth === 'forensic') {
    primaryModules = uniqueModules(['observatory', 'stats', 'filters', ...primaryModules]);
    supportingModules = supportingModules.filter((moduleId) => !primaryModules.includes(moduleId));
  }

  const orderedModules = uniqueModules([
    PINNED_SAFETY_MODULE,
    ...primaryModules,
    ...supportingModules,
  ]);
  const visibleModules = depth === 'snapshot'
    ? uniqueModules([PINNED_SAFETY_MODULE, ...primaryModules])
    : orderedModules;

  return {
    specId: spec.id,
    schemaVersion: spec.schemaVersion,
    actionGraphId: DASHBOARD_ACTION_GRAPH.id,
    layoutId: DASHBOARD_LAYOUT_SPEC.id,
    intent,
    depth,
    density: depth === 'snapshot' ? 'comfortable' : depth === 'forensic' ? 'compact' : spec.density,
    view: depth === 'snapshot' ? 'cards' : spec.view,
    accent: spec.accent,
    primaryModules,
    supportingModules,
    visibleModules,
    orderedModules,
    showStats: visibleModules.includes('stats'),
    showMarketPulse: visibleModules.includes('marketPulse'),
  };
}

export function isDashboardModuleVisible(
  composition: DashboardComposition,
  moduleId: DashboardModuleId
): boolean {
  return DASHBOARD_MODULES[moduleId].safety || composition.visibleModules.includes(moduleId);
}

export function getDashboardModuleOrder(
  composition: DashboardComposition,
  moduleId: DashboardModuleId
): number {
  if (DASHBOARD_MODULES[moduleId].safety) return 10;
  const index = composition.orderedModules.indexOf(moduleId);
  return index >= 0 ? 10 + index : 80;
}
