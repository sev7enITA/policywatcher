import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const dashboard = readFileSync('src/app/DashboardClient.tsx', 'utf8');
const styles = readFileSync('src/app/Dashboard.module.css', 'utf8');

describe('dashboard action and layout wiring', () => {
  it('publishes the validated action graph and layout identity on the dashboard', () => {
    expect(dashboard).toContain('data-dashboard-layout={workspaceSettings.layoutId}');
    expect(dashboard).toContain(
      'data-dashboard-action-graph={workspaceSettings.actionGraphId}'
    );
  });

  it('assigns deterministic placement metadata to every rendered dashboard module', () => {
    for (const moduleId of [
      'sourceQuality',
      'observatory',
      'stats',
      'filters',
      'marketPulse',
      'companyCards',
    ]) {
      expect(dashboard).toContain(`getDashboardModuleDomProps(workspaceIntent, '${moduleId}')`);
    }
  });

  it('keeps the mobile compatibility renderer single-column', () => {
    expect(styles).toContain('[data-dashboard-module][data-mobile-span="1"]');
    expect(styles).toContain('grid-column: 1 / -1');
  });
});
