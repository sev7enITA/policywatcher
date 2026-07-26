import { describe, expect, it } from 'vitest';
import {
  composeDashboard,
  getDashboardModuleOrder,
  isDashboardModuleVisible,
  normalizeEvidenceDepth,
  normalizeWorkspaceIntent,
  PINNED_SAFETY_MODULE,
} from '../dashboardComposer';

describe('dashboard composer normalization', () => {
  it('normalizes supported intent and depth values', () => {
    expect(normalizeWorkspaceIntent(' Research ')).toBe('research');
    expect(normalizeEvidenceDepth('FORENSIC')).toBe('forensic');
  });

  it('rejects missing or unsupported values', () => {
    expect(normalizeWorkspaceIntent(null)).toBeNull();
    expect(normalizeWorkspaceIntent('auditor')).toBeNull();
    expect(normalizeEvidenceDepth('deep')).toBeNull();
  });
});

describe('composeDashboard', () => {
  it('keeps Source QA visible and pinned for every composition', () => {
    const intents = ['citizen', 'grc', 'research', 'builder'] as const;
    const depths = ['snapshot', 'operational', 'forensic'] as const;

    for (const intent of intents) {
      for (const depth of depths) {
        const composition = composeDashboard(intent, depth);
        expect(isDashboardModuleVisible(composition, PINNED_SAFETY_MODULE)).toBe(true);
        expect(composition.orderedModules[0]).toBe(PINNED_SAFETY_MODULE);
        expect(getDashboardModuleOrder(composition, PINNED_SAFETY_MODULE)).toBe(10);
      }
    }
  });

  it('uses intent order and hides supporting modules in snapshot mode', () => {
    const composition = composeDashboard('citizen', 'snapshot');

    expect(composition.primaryModules).toEqual(['marketPulse', 'companyCards']);
    expect(composition.visibleModules).toEqual(['sourceQuality', 'marketPulse', 'companyCards']);
    expect(composition.showStats).toBe(false);
    expect(getDashboardModuleOrder(composition, 'marketPulse')).toBeLessThan(
      getDashboardModuleOrder(composition, 'companyCards')
    );
  });

  it('uses the default low-noise presentation for citizen snapshot', () => {
    const composition = composeDashboard('citizen', 'snapshot');

    expect(composition).toMatchObject({
      specId: 'policywatcher.dashboard.intent.citizen.v1',
      schemaVersion: 1,
      actionGraphId: 'policywatcher.dashboard.actions.v1',
      layoutId: 'policywatcher.dashboard.layout.evidence-flow.v1',
      density: 'comfortable',
      view: 'cards',
      accent: 'teal',
      showMarketPulse: true,
    });
  });

  it('expands forensic mode to audit evidence with compact density', () => {
    const composition = composeDashboard('citizen', 'forensic');

    expect(composition.density).toBe('compact');
    expect(composition.primaryModules.slice(0, 3)).toEqual(['observatory', 'stats', 'filters']);
    expect(composition.visibleModules).toEqual(composition.orderedModules);
    expect(composition.showStats).toBe(true);
  });
});
