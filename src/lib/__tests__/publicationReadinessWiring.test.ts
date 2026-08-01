import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('publication readiness wiring', () => {
  const page = readFileSync('src/app/admin/page.tsx', 'utf8');
  const component = readFileSync('src/app/admin/PublicationReadinessFunnel.tsx', 'utf8');
  const route = readFileSync('src/app/api/admin/metrics/route.ts', 'utf8');

  it('replaces Database Inventory while retaining the adjacent risk profile', () => {
    expect(page).not.toContain('Database Inventory');
    expect(page).toContain('<PublicationReadinessFunnel result={metrics.publicationReadiness} role={metrics.role} />');
    expect(page).toContain('Policy Risk Profiles');
  });

  it('exposes every stage, responsible action and a semantic table equivalent', () => {
    for (const label of ['Configured', 'Retrieved', 'Baseline verified', 'Public', 'Analysed']) {
      expect(readFileSync('src/lib/publicationReadiness.ts', 'utf8')).toContain(`label: '${label}'`);
    }
    for (const href of ['/admin/companies', '/admin/cron', '/admin/source-reliability', '/admin/dataset-quality', '/admin/kpi-audit']) {
      expect(component).toContain('stage.actionHref');
      expect(readFileSync('src/lib/publicationReadiness.ts', 'utf8')).toContain(`actionHref: '${href}'`);
    }
    expect(component).toContain('<table>');
    expect(component).toContain('<caption>');
    expect(component).toContain('scope="row"');
  });

  it('uses distinct semantic icons for measured, unavailable and consistency-review states', () => {
    expect(component).toContain("availability === 'review'");
    expect(component).toContain('<AlertTriangle size={13}');
    expect(component).toContain("availability === 'unavailable'");
    expect(component).toContain('<CircleHelp size={13}');
    expect(component).toContain('<ShieldCheck size={13}');
  });

  it('reuses the production publication gate and returns an unavailable 503 contract', () => {
    expect(route).toContain('publicPolicyWhere()');
    expect(route).toContain("publicPolicyWhere({ changes: { some: { publicEvidence: true } } })");
    expect(route).toContain('buildUnavailablePublicationReadiness(checkedAt)');
  });
});
