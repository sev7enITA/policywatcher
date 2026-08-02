import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('source reliability admin experience', () => {
  const page = readFileSync('src/app/admin/source-reliability/page.tsx', 'utf8');
  const dashboard = readFileSync('src/app/admin/page.tsx', 'utf8');
  const metricsRoute = readFileSync('src/app/api/admin/metrics/route.ts', 'utf8');
  const layout = readFileSync('src/app/admin/layout.tsx', 'utf8');

  it('exposes evidence-gate state and direct operator actions', () => {
    expect(page).toContain('No policy currently passes the public-evidence baseline gate');
    expect(page).toContain('Open Cron Manager');
    expect(page).toContain('Evidence method');
    expect(page).toContain('role="region"');
    expect(page).toContain('tabIndex={0}');
    expect(page).toContain('Source Remediation Workbench');
    expect(page).toContain('Deterministic next action');
    expect(page).toContain('Close recovered issue');
    expect(page).toContain('No filter matches');
    expect(page).toContain('mobileLedger');
  });

  it('keeps the dashboard summary derived from database state', () => {
    expect(metricsRoute).toContain('publicEvidencePolicies');
    expect(metricsRoute).toContain('openRemediationIssues');
    expect(metricsRoute).toContain('buildAcquisitionKey');
    expect(dashboard).toContain('Evidence publication readiness');
    expect(dashboard).toContain('Public surfaces remain empty until exact source-verified baselines');
  });

  it('groups the protected navigation by operational purpose', () => {
    for (const section of ['Overview', 'Monitor', 'Assure', 'Govern', 'Registry', 'Outreach']) {
      expect(layout).toContain(`section: '${section}'`);
    }
    expect(layout).toContain('navSection');
  });
});
