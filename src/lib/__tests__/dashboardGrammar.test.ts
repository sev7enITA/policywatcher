import { describe, expect, it } from 'vitest';
import {
  DASHBOARD_REGISTRY,
  DASHBOARD_REGISTRY_VALIDATION,
  DASHBOARD_SCHEMA_VERSION,
  getDashboardIntentSpecId,
  getDashboardModuleInstanceId,
  validateDashboardRegistry,
  type DashboardRegistry,
} from '../dashboardGrammar';

describe('native dashboard grammar', () => {
  it('ships an immutable, valid built-in registry', () => {
    expect(DASHBOARD_REGISTRY_VALIDATION).toEqual({ valid: true, issues: [] });
    expect(Object.isFrozen(DASHBOARD_REGISTRY)).toBe(true);
    expect(Object.isFrozen(DASHBOARD_REGISTRY.modules)).toBe(true);
    expect(Object.isFrozen(DASHBOARD_REGISTRY.intents.citizen.primaryModules)).toBe(true);
  });

  it('generates deterministic spec and module instance identifiers', () => {
    expect(getDashboardIntentSpecId('research')).toBe(
      `policywatcher.dashboard.intent.research.v${DASHBOARD_SCHEMA_VERSION}`
    );
    expect(getDashboardModuleInstanceId('research', 'sourceQuality')).toBe(
      `pw-dashboard-${DASHBOARD_SCHEMA_VERSION}-research-sourceQuality`
    );
  });

  it('rejects unknown renderers, missing safety, unknown targets, and duplicates', () => {
    const invalidRegistry = {
      ...DASHBOARD_REGISTRY,
      modules: {
        ...DASHBOARD_REGISTRY.modules,
        sourceQuality: {
          ...DASHBOARD_REGISTRY.modules.sourceQuality,
          safety: false,
          renderer: 'execute-arbitrary-module',
        },
      },
      intents: {
        ...DASHBOARD_REGISTRY.intents,
        citizen: {
          ...DASHBOARD_REGISTRY.intents.citizen,
          primaryModules: ['unknownModule', 'companyCards'],
          supportingModules: ['companyCards'],
        },
      },
    } as unknown as DashboardRegistry;

    const before = JSON.stringify(invalidRegistry);
    const result = validateDashboardRegistry(invalidRegistry);

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'module.renderer_not_allowed',
        'module.safety_missing',
        'intent.module_unknown',
        'intent.module_duplicate',
      ])
    );
    expect(JSON.stringify(invalidRegistry)).toBe(before);
  });
});
