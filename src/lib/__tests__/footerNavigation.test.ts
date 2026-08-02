import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const footer = readFileSync('src/components/Footer.tsx', 'utf8');
const styles = readFileSync('src/components/Footer.module.css', 'utf8');

describe('categorized global footer', () => {
  it('preserves every resource destination exactly once in the shared group model', () => {
    const groupModel = footer.slice(
      footer.indexOf('const resourceGroups'),
      footer.indexOf('const renderLinks'),
    );
    const destinations = [
      '/knowledge',
      '/observatory',
      '/collections',
      '/leaderboard',
      '/roadmap',
      '/atlas',
      '/feature-atlas',
      '/showcase',
      '/trust',
      '/developers',
      '/integrations',
      'https://www.paloframework.org',
      '/press',
      '/press-kit',
      '/pulse',
      '/infographics',
    ];

    for (const destination of destinations) {
      expect(groupModel.split(`'${destination}'`)).toHaveLength(2);
    }
    expect(footer).toContain('href="/about"');
  });

  it('provides four bounded navigation groups in English and Italian', () => {
    expect(footer).toContain("explore: 'Explore'");
    expect(footer).toContain("product: 'Product'");
    expect(footer).toContain("build: 'Build'");
    expect(footer).toContain("media: 'Media'");
    expect(footer).toContain("explore: 'Esplora'");
    expect(footer).toContain("product: 'Prodotto'");
    expect(footer).toContain("build: 'Sviluppo'");
    expect(footer.match(/id: '(explore|product|build|media)'/g)).toHaveLength(4);
    expect(footer).toContain('aria-labelledby={`footer-${lang}-${group.id}`}');
  });

  it('uses native mobile disclosures with accessible, touch-sized controls', () => {
    expect(footer).toContain('<details className={styles.disclosure}');
    expect(footer).toContain('<summary className={styles.mobileSummary}>');
    expect(footer).toContain('aria-label={t.mobileResourceNavigation}');
    expect(styles).toContain('.mobileSummary');
    expect(styles).toContain('min-height: 48px');
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('keeps legal and contact essentials visible and preserves the compact API', () => {
    expect(footer).toContain("variant?: 'full' | 'compact'");
    expect(footer).toContain("if (variant === 'compact')");
    expect(footer).toContain('aria-label={t.utilityNavigation}');
    expect(footer).toContain('href="/privacy"');
    expect(footer).toContain('href="/terms"');
    expect(footer).toContain('href="/security"');
    expect(footer).toContain('href="mailto:info@policywatcher.online"');
  });
});
