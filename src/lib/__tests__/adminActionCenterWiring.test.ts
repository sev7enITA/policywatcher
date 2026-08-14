import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('admin operational action center wiring', () => {
  const page = readFileSync('src/app/admin/page.tsx', 'utf8');
  const component = readFileSync('src/app/admin/OperationalActionCenter.tsx', 'utf8');
  const route = readFileSync('src/app/api/admin/metrics/route.ts', 'utf8');
  const styles = readFileSync('src/app/admin/admin.module.css', 'utf8');

  it('renders the queue directly after the dashboard header', () => {
    expect(page.indexOf('<DashboardHeader role={metrics.role} />')).toBeLessThan(page.indexOf('<OperationalActionCenter result={metrics.actionCenter} role={metrics.role} />'));
    expect(component).toContain('<ol className={styles.priorityList}');
    expect(component).toContain('Maximum five priorities are shown');
    expect(component).toContain('is not a health certification');
  });

  it('keeps severity, timestamp and metric availability textual with one action link per row', () => {
    expect(component).toContain('Severity: {item.severityLabel}');
    expect(component).toContain("item.metricState === 'available' ? 'Available' : 'Unavailable'");
    expect(component).toContain('Timestamp unavailable');
    expect(component.match(/className={styles\.priorityAction}/g)).toHaveLength(1);
  });

  it('queries each optional action-center metric independently and sanitizes core failures', () => {
    expect(route).toContain('buildAdminActionCenter');
    expect(route).toContain('buildUnavailableAdminActionCenter');
    expect(route).toContain('Webhook terminal-failure metric unavailable');
    expect(route).toContain('Source remediation metric unavailable');
    expect(route).not.toContain('directoryPath: database.directoryPath');
    expect(route).not.toContain('path: database.filePath');
  });

  it('provides narrow-screen vertical hierarchy and visible focus states', () => {
    expect(styles).toContain('.priorityAction:focus-visible');
    expect(styles).toContain('grid-template-columns: 40px minmax(0, 1fr)');
    expect(styles).toContain('.actionCenter:focus-visible');
    expect(styles).toContain('overflow-wrap: anywhere');
  });

  it('keeps operational supporting text at the 12px minimum', () => {
    for (const selector of [
      'actionCenterEyebrow',
      'actionCenterCheck span',
      'actionCenterCheck time',
      'prioritySeverity',
      'priorityMeta dt',
      'priorityMeta dd',
      'actionCenterBoundary',
    ]) {
      const escapedSelector = selector.replace(' ', '\\s+');
      const rules = [...styles.matchAll(new RegExp(`\\.${escapedSelector}\\s*\\{[^}]+\\}`, 'g'))];
      const fontSizes = rules
        .map((match) => Number(match[0].match(/font-size:\s*([\d.]+)rem/)?.[1] || 0))
        .filter((size) => size > 0);
      expect(Math.max(...fontSizes), selector).toBeGreaterThanOrEqual(0.75);
    }
  });
});
