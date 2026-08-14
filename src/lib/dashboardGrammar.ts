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

export type DashboardModuleKind =
  | 'evidence-quality'
  | 'evidence-feed'
  | 'metric-summary'
  | 'control-group'
  | 'risk-visualization'
  | 'entity-collection';

export type DashboardRendererId =
  | 'source-quality-panel'
  | 'observatory-panel'
  | 'stats-grid'
  | 'policy-filters'
  | 'market-pulse'
  | 'company-card-grid';

export interface DashboardModuleDefinition {
  readonly id: DashboardModuleId;
  readonly kind: DashboardModuleKind;
  readonly renderer: DashboardRendererId;
  readonly safety: boolean;
  readonly provenanceRequired: boolean;
}

export const DASHBOARD_SCHEMA_VERSION = 1 as const;
export const PINNED_SAFETY_MODULE: DashboardModuleId = 'sourceQuality';

const WORKSPACE_INTENTS = ['citizen', 'grc', 'research', 'builder'] as const;
const ALLOWED_RENDERERS = new Set<DashboardRendererId>([
  'source-quality-panel',
  'observatory-panel',
  'stats-grid',
  'policy-filters',
  'market-pulse',
  'company-card-grid',
]);

export interface DashboardIntentSpec {
  readonly id: string;
  readonly schemaVersion: typeof DASHBOARD_SCHEMA_VERSION;
  readonly intent: WorkspaceIntent;
  readonly density: DashboardDensity;
  readonly view: DashboardView;
  readonly accent: DashboardAccent;
  readonly primaryModules: readonly DashboardModuleId[];
  readonly supportingModules: readonly DashboardModuleId[];
}

export interface DashboardRegistry {
  readonly schemaVersion: typeof DASHBOARD_SCHEMA_VERSION;
  readonly modules: Readonly<Record<DashboardModuleId, DashboardModuleDefinition>>;
  readonly intents: Readonly<Record<WorkspaceIntent, DashboardIntentSpec>>;
}

export type DashboardValidationCode =
  | 'schema.unsupported'
  | 'module.key_mismatch'
  | 'module.renderer_not_allowed'
  | 'module.safety_missing'
  | 'intent.missing'
  | 'intent.key_mismatch'
  | 'intent.id_not_deterministic'
  | 'intent.schema_mismatch'
  | 'intent.module_unknown'
  | 'intent.module_duplicate';

export interface DashboardValidationIssue {
  code: DashboardValidationCode;
  path: string;
  message: string;
}

export interface DashboardValidationResult {
  valid: boolean;
  issues: DashboardValidationIssue[];
}

export function getDashboardIntentSpecId(intent: WorkspaceIntent): string {
  return `policywatcher.dashboard.intent.${intent}.v${DASHBOARD_SCHEMA_VERSION}`;
}

export function getDashboardModuleInstanceId(
  intent: WorkspaceIntent,
  moduleId: DashboardModuleId
): string {
  return `pw-dashboard-${DASHBOARD_SCHEMA_VERSION}-${intent}-${moduleId}`;
}

export const DASHBOARD_MODULES: Readonly<Record<DashboardModuleId, DashboardModuleDefinition>> =
  Object.freeze({
    sourceQuality: Object.freeze({
      id: 'sourceQuality',
      kind: 'evidence-quality',
      renderer: 'source-quality-panel',
      safety: true,
      provenanceRequired: true,
    }),
    observatory: Object.freeze({
      id: 'observatory',
      kind: 'evidence-feed',
      renderer: 'observatory-panel',
      safety: false,
      provenanceRequired: true,
    }),
    stats: Object.freeze({
      id: 'stats',
      kind: 'metric-summary',
      renderer: 'stats-grid',
      safety: false,
      provenanceRequired: true,
    }),
    filters: Object.freeze({
      id: 'filters',
      kind: 'control-group',
      renderer: 'policy-filters',
      safety: false,
      provenanceRequired: false,
    }),
    marketPulse: Object.freeze({
      id: 'marketPulse',
      kind: 'risk-visualization',
      renderer: 'market-pulse',
      safety: false,
      provenanceRequired: true,
    }),
    companyCards: Object.freeze({
      id: 'companyCards',
      kind: 'entity-collection',
      renderer: 'company-card-grid',
      safety: false,
      provenanceRequired: true,
    }),
  });

function intentSpec(
  intent: WorkspaceIntent,
  presentation: Pick<DashboardIntentSpec, 'density' | 'view' | 'accent'>,
  primaryModules: readonly DashboardModuleId[],
  supportingModules: readonly DashboardModuleId[]
): DashboardIntentSpec {
  return Object.freeze({
    id: getDashboardIntentSpecId(intent),
    schemaVersion: DASHBOARD_SCHEMA_VERSION,
    intent,
    ...presentation,
    primaryModules: Object.freeze([...primaryModules]),
    supportingModules: Object.freeze([...supportingModules]),
  });
}

export const DASHBOARD_INTENT_SPECS: Readonly<Record<WorkspaceIntent, DashboardIntentSpec>> =
  Object.freeze({
    citizen: intentSpec(
      'citizen',
      { density: 'comfortable', view: 'cards', accent: 'teal' },
      ['marketPulse', 'companyCards'],
      ['observatory', 'stats', 'filters']
    ),
    grc: intentSpec(
      'grc',
      { density: 'comfortable', view: 'cards', accent: 'indigo' },
      ['stats', 'filters', 'companyCards'],
      ['observatory', 'marketPulse']
    ),
    research: intentSpec(
      'research',
      { density: 'comfortable', view: 'focus', accent: 'teal' },
      ['marketPulse', 'filters', 'stats', 'companyCards'],
      ['observatory']
    ),
    builder: intentSpec(
      'builder',
      { density: 'compact', view: 'focus', accent: 'slate' },
      ['observatory', 'filters', 'companyCards'],
      ['stats', 'marketPulse']
    ),
  });

export const DASHBOARD_REGISTRY: DashboardRegistry = Object.freeze({
  schemaVersion: DASHBOARD_SCHEMA_VERSION,
  modules: DASHBOARD_MODULES,
  intents: DASHBOARD_INTENT_SPECS,
});

/** Pure validation; it never registers renderers or mutates the candidate. */
export function validateDashboardRegistry(registry: DashboardRegistry): DashboardValidationResult {
  const issues: DashboardValidationIssue[] = [];

  if (registry.schemaVersion !== DASHBOARD_SCHEMA_VERSION) {
    issues.push({
      code: 'schema.unsupported',
      path: 'schemaVersion',
      message: `Expected dashboard schema ${DASHBOARD_SCHEMA_VERSION}.`,
    });
  }

  for (const [key, moduleDefinition] of Object.entries(registry.modules)) {
    if (key !== moduleDefinition.id) {
      issues.push({
        code: 'module.key_mismatch',
        path: `modules.${key}.id`,
        message: `Module key ${key} does not match id ${moduleDefinition.id}.`,
      });
    }
    if (!ALLOWED_RENDERERS.has(moduleDefinition.renderer)) {
      issues.push({
        code: 'module.renderer_not_allowed',
        path: `modules.${key}.renderer`,
        message: `Renderer ${moduleDefinition.renderer} is not allowlisted.`,
      });
    }
  }

  if (!registry.modules[PINNED_SAFETY_MODULE]?.safety) {
    issues.push({
      code: 'module.safety_missing',
      path: `modules.${PINNED_SAFETY_MODULE}`,
      message: 'The pinned Source QA safety module is missing or not marked as safety-critical.',
    });
  }

  for (const intent of WORKSPACE_INTENTS) {
    const spec = registry.intents[intent];
    if (!spec) {
      issues.push({
        code: 'intent.missing',
        path: `intents.${intent}`,
        message: `Missing dashboard intent ${intent}.`,
      });
      continue;
    }
    if (spec.intent !== intent) {
      issues.push({
        code: 'intent.key_mismatch',
        path: `intents.${intent}.intent`,
        message: `Intent key ${intent} does not match ${spec.intent}.`,
      });
    }
    if (spec.id !== getDashboardIntentSpecId(intent)) {
      issues.push({
        code: 'intent.id_not_deterministic',
        path: `intents.${intent}.id`,
        message: `Intent ${intent} must use its deterministic spec id.`,
      });
    }
    if (spec.schemaVersion !== registry.schemaVersion) {
      issues.push({
        code: 'intent.schema_mismatch',
        path: `intents.${intent}.schemaVersion`,
        message: `Intent ${intent} does not match the registry schema.`,
      });
    }

    const references = [...spec.primaryModules, ...spec.supportingModules];
    const seen = new Set<string>();
    for (const [index, moduleId] of references.entries()) {
      if (!registry.modules[moduleId]) {
        issues.push({
          code: 'intent.module_unknown',
          path: `intents.${intent}.modules.${index}`,
          message: `Intent ${intent} references unknown module ${moduleId}.`,
        });
      }
      if (seen.has(moduleId)) {
        issues.push({
          code: 'intent.module_duplicate',
          path: `intents.${intent}.modules.${index}`,
          message: `Intent ${intent} references module ${moduleId} more than once.`,
        });
      }
      seen.add(moduleId);
    }
  }

  return { valid: issues.length === 0, issues };
}

export const DASHBOARD_REGISTRY_VALIDATION = validateDashboardRegistry(DASHBOARD_REGISTRY);

if (!DASHBOARD_REGISTRY_VALIDATION.valid) {
  throw new Error(
    `Invalid built-in dashboard registry: ${DASHBOARD_REGISTRY_VALIDATION.issues
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join('; ')}`
  );
}
