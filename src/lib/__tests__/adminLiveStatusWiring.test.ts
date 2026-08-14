import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('admin live status wiring', () => {
  const page = readFileSync('src/app/admin/page.tsx', 'utf8');
  const component = readFileSync('src/app/admin/LiveStatusCards.tsx', 'utf8');
  const helper = readFileSync('src/lib/adminLiveStatus.ts', 'utf8');
  const styles = readFileSync('src/app/admin/admin.module.css', 'utf8');
  const datasetPage = readFileSync('src/app/admin/dataset-quality/page.tsx', 'utf8');

  it('renders the independent live section after the Action Center and removes duplicate static cards', () => {
    expect(page.indexOf('<LiveStatusCards role={metrics.role} />')).toBeGreaterThan(page.indexOf('<OperationalActionCenter'));
    expect(page).not.toContain('VPS Service Monitoring');
    expect(page).not.toContain('Dataset QA Status');
  });

  it('fetches all four protected endpoints independently without cache', () => {
    for (const endpoint of ['/api/admin/dataset-quality', '/api/admin/database-readiness', '/api/admin/webhook-delivery', '/api/admin/vps-services']) {
      expect(helper).toContain(`endpoint: '${endpoint}'`);
    }
    expect(component).toContain('Promise.allSettled');
    expect(component).toContain("credentials: 'include'");
    expect(component).toContain("cache: 'no-store'");
  });

  it('exposes explicit availability, one action per card and accessible refresh behavior', () => {
    expect(component).toContain('metricAvailabilityLabel(card)');
    expect(component).toContain('<Link href={card.action.href}');
    expect(component).toContain('aria-live="polite"');
    expect(component).toContain('window.requestAnimationFrame(() => sectionRef.current?.focus())');
    expect(styles).toMatch(/\.liveStatusRefresh\s*\{[\s\S]*?min-height:\s*44px/);
    expect(styles).toMatch(/\.liveStatusAction\s*\{[\s\S]*?min-height:\s*44px/);
  });

  it('keeps Dataset QA mutation controls admin-only in the client presentation', () => {
    expect(datasetPage).toContain("data.role === 'admin'");
    expect(datasetPage).toContain('Auditor access is read-only.');
  });
});
