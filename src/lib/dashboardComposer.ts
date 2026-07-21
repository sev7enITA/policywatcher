export type WorkspaceIntent = 'citizen' | 'grc' | 'research' | 'builder';
export type EvidenceDepth = 'snapshot' | 'operational' | 'forensic';
export type DashboardDensity = 'comfortable' | 'compact';
export type DashboardView = 'cards' | 'focus';
export type DashboardAccent = 'indigo' | 'teal' | 'slate';

export type DashboardModuleId =
  | 'sourceQuality'
  | 'observatory'
  | 'stats'
  | 'filters'
  | 'marketPulse'
  | 'companyCards';

export interface DashboardModuleDefinition {
  id: DashboardModuleId;
  safety: boolean;
}

export interface DashboardComposition {
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
export const PINNED_SAFETY_MODULE: DashboardModuleId = 'sourceQuality';

export const DASHBOARD_MODULES: Record<DashboardModuleId, DashboardModuleDefinition> = {
  sourceQuality: { id: 'sourceQuality', safety: true },
  observatory: { id: 'observatory', safety: false },
  stats: { id: 'stats', safety: false },
  filters: { id: 'filters', safety: false },
  marketPulse: { id: 'marketPulse', safety: false },
  companyCards: { id: 'companyCards', safety: false },
};

type IntentBlueprint = Pick<
  DashboardComposition,
  'density' | 'view' | 'accent' | 'primaryModules' | 'supportingModules'
>;

const INTENT_BLUEPRINTS: Record<WorkspaceIntent, IntentBlueprint> = {
  citizen: {
    density: 'comfortable',
    view: 'cards',
    accent: 'teal',
    primaryModules: ['marketPulse', 'companyCards'],
    supportingModules: ['observatory', 'stats', 'filters'],
  },
  grc: {
    density: 'comfortable',
    view: 'cards',
    accent: 'indigo',
    primaryModules: ['stats', 'filters', 'companyCards'],
    supportingModules: ['observatory', 'marketPulse'],
  },
  research: {
    density: 'comfortable',
    view: 'focus',
    accent: 'teal',
    primaryModules: ['marketPulse', 'filters', 'stats', 'companyCards'],
    supportingModules: ['observatory'],
  },
  builder: {
    density: 'compact',
    view: 'focus',
    accent: 'slate',
    primaryModules: ['observatory', 'filters', 'companyCards'],
    supportingModules: ['stats', 'marketPulse'],
  },
};

function uniqueModules(modules: DashboardModuleId[]): DashboardModuleId[] {
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
  const blueprint = INTENT_BLUEPRINTS[intent];
  let primaryModules = [...blueprint.primaryModules];
  let supportingModules = [...blueprint.supportingModules];

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
    intent,
    depth,
    density: depth === 'snapshot' ? 'comfortable' : depth === 'forensic' ? 'compact' : blueprint.density,
    view: depth === 'snapshot' ? 'cards' : blueprint.view,
    accent: blueprint.accent,
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
