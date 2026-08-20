import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { proxy } from '../../proxy';
import {
  formatInternalStudyCurrencyMillions,
  parseInternalStudyScenario,
  selectInternalStudyFinancialScenario,
  selectInternalStudyMarketScenario,
} from '../internalExecutiveStudyTypes';

const read = (path: string) => readFileSync(path, 'utf8');
const require = createRequire(import.meta.url);
const {
  SAFE_CONFIGURATION_ERROR,
  validateInternalStudyConfiguration,
} = require('../../../scripts/validate-internal-study-config.cjs') as {
  SAFE_CONFIGURATION_ERROR: string;
  validateInternalStudyConfiguration: (environment: Record<string, string | undefined>) => void;
};

describe('internal executive study access boundary', () => {
  it('keeps the former public routes and all public discovery removed', () => {
    expect(existsSync('src/app/executive-study/page.tsx')).toBe(false);
    expect(existsSync('src/app/strategy/page.tsx')).toBe(false);

    const publicSources = [
      read('src/components/PublicHeader.tsx'),
      read('src/components/Footer.tsx'),
      read('src/app/sitemap.ts'),
      read('src/lib/publicSections.ts'),
    ].join('\n');
    expect(publicSources).not.toContain('/executive-study');
    expect(publicSources).not.toContain('/strategy');
  });

  it('verifies the signed session before importing or loading private content', () => {
    const page = read('src/app/admin/executive-study/page.tsx');
    const cookieCheck = page.indexOf('await cookies()');
    const verification = page.indexOf('verifySessionToken');
    const rejection = page.indexOf("redirect('/admin/login')");
    const privateImport = page.indexOf("await import('@/lib/internalExecutiveStudyServer')");

    expect(cookieCheck).toBeGreaterThan(-1);
    expect(verification).toBeGreaterThan(-1);
    expect(rejection).toBeGreaterThan(verification);
    expect(privateImport).toBeGreaterThan(rejection);
    expect(page).toContain("session.role !== 'admin' && session.role !== 'auditor'");
  });

  it('returns an explicit HTTP redirect before an anonymous request reaches the page', () => {
    const response = proxy(new NextRequest('http://localhost/admin/executive-study'));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get('location') ?? '').pathname).toBe('/admin/login');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('x-robots-tag')).toContain('noindex');
  });

  it('is dynamic, non-cacheable and explicitly excluded from indexing', () => {
    const page = read('src/app/admin/executive-study/page.tsx');
    expect(page).toContain("export const dynamic = 'force-dynamic'");
    expect(page).toContain('export const revalidate = 0');
    expect(page).toContain("export const fetchCache = 'force-no-store'");
    expect(page).toContain('noStore()');
    expect(page).toContain('index: false');
    expect(page).toContain('follow: false');
    expect(page).toContain('noarchive: true');
  });

  it('never imports the server loader or a private payload from a client component', () => {
    const client = read('src/app/admin/executive-study/ExecutiveStudyClient.tsx');
    expect(client).toContain("'use client'");
    expect(client).not.toContain('internalExecutiveStudyServer');
    expect(client).not.toContain('executiveStudyData.private');
    expect(client).not.toContain('src/private');
    expect(client).toContain('study: InternalStudyPayload');
  });

  it('makes the study discoverable to both authenticated admin roles only', () => {
    const adminLayout = read('src/app/admin/layout.tsx');
    const start = adminLayout.indexOf("label: 'Executive Study'");
    const item = adminLayout.slice(start, adminLayout.indexOf('},', start) + 2);
    expect(start).toBeGreaterThan(-1);
    expect(item).toContain("href: '/admin/executive-study'");
    expect(item).toContain("section: 'Govern'");
    expect(item).not.toContain('adminOnly');
  });

  it('keeps confidential inputs outside tracked public source boundaries', () => {
    const ignore = read('.gitignore');
    const loader = read('src/lib/internalExecutiveStudyServer.ts');
    expect(ignore).toContain('/src/private/executiveStudyData.private.json');
    expect(ignore).toContain('/reports/policywatcher-executive-mba/');
    expect(loader).toContain("import 'server-only'");
    expect(loader).toContain('POLICYWATCHER_INTERNAL_STUDY_PATH');
    expect(loader).toContain("readFile(privateStudyPath(), 'utf8')");
  });

  it('fails startup validation safely for missing, relative, unreadable or malformed input', () => {
    const directory = mkdtempSync(join(tmpdir(), 'policywatcher-study-config-'));
    const malformedPath = join(directory, 'confidential-malformed.json');
    const validPath = join(directory, 'confidential-valid.json');
    writeFileSync(malformedPath, '{malformed', 'utf8');
    writeFileSync(validPath, JSON.stringify({
      version: 1,
      researchCutoff: 'test',
      datasets: {},
      sources: [],
      chapters: [],
      copy: {
        strings: {},
        scenarioInterpretation: {},
        recommendationItems: [],
        thesisItems: [],
        businessColumns: [],
        readinessCards: [],
        methodologyItems: [],
      },
    }), 'utf8');

    try {
      expect(() => validateInternalStudyConfiguration({})).toThrow(SAFE_CONFIGURATION_ERROR);
      expect(() => validateInternalStudyConfiguration({ POLICYWATCHER_INTERNAL_STUDY_PATH: 'relative.json' })).toThrow(SAFE_CONFIGURATION_ERROR);
      expect(() => validateInternalStudyConfiguration({ POLICYWATCHER_INTERNAL_STUDY_PATH: join(directory, 'missing.json') })).toThrow(SAFE_CONFIGURATION_ERROR);
      expect(() => validateInternalStudyConfiguration({ POLICYWATCHER_INTERNAL_STUDY_PATH: malformedPath })).toThrow(SAFE_CONFIGURATION_ERROR);
      expect(() => validateInternalStudyConfiguration({ POLICYWATCHER_INTERNAL_STUDY_PATH: validPath })).not.toThrow();

      try {
        validateInternalStudyConfiguration({ POLICYWATCHER_INTERNAL_STUDY_PATH: malformedPath });
      } catch (error) {
        expect((error as Error).message).toBe(SAFE_CONFIGURATION_ERROR);
        expect((error as Error).message).not.toContain(malformedPath);
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

describe('internal executive study interaction contracts', () => {
  it('normalizes scenario state and formats market values', () => {
    expect(parseInternalStudyScenario(' LOW ')).toBe('low');
    expect(parseInternalStudyScenario('high')).toBe('high');
    expect(parseInternalStudyScenario('unexpected')).toBe('base');
    expect(parseInternalStudyScenario(null)).toBe('base');
    expect(formatInternalStudyCurrencyMillions(1196)).toBe('EUR 1.196bn');
    expect(formatInternalStudyCurrencyMillions(7.99)).toBe('EUR 7.99m');
  });

  it('maps public scenario keys to the report field vocabulary', () => {
    const marketRows = [
      { scope: 'Region TAM', scenario: 'Base', opportunity_eur_m: 11 },
      { scope: 'Country SAM', scenario: 'Base', opportunity_eur_m: 7 },
      { scope: 'Plan SOM', scenario: 'Base', account_pool: 3 },
      { scope: 'Region TAM', scenario: 'Low', opportunity_eur_m: 4 },
    ];
    const market = selectInternalStudyMarketScenario(marketRows, 'base');
    expect(market.rows).toHaveLength(3);
    expect(market.tam?.opportunity_eur_m).toBe(11);
    expect(market.sam?.opportunity_eur_m).toBe(7);
    expect(market.som?.account_pool).toBe(3);

    const financialRows = [
      { scenario: 'Downside', customers: 1 },
      { scenario: 'Base', customers: 2 },
      { scenario: 'Upside', customers: 3 },
    ];
    expect(selectInternalStudyFinancialScenario(financialRows, 'low')?.customers).toBe(1);
    expect(selectInternalStudyFinancialScenario(financialRows, 'base')?.customers).toBe(2);
    expect(selectInternalStudyFinancialScenario(financialRows, 'high')?.customers).toBe(3);
  });

  it('preserves accessible interactive exploration and responsive safeguards', () => {
    const client = read('src/app/admin/executive-study/ExecutiveStudyClient.tsx');
    const css = read('src/app/admin/executive-study/executiveStudy.module.css');
    expect(client).toContain('aria-label="Management scenario"');
    expect(client).toContain('aria-live="polite"');
    expect(client).toContain('aria-expanded={open}');
    expect(client).toContain('role="tablist"');
    expect(client).toContain('<StudyTable');
    expect(client).toContain('<FinancialTrajectory study={study} />');
    expect(client).toContain('Copy internal URL');
    expect(css).toContain('@media (max-width: 680px)');
    expect(css).toContain('@media (max-width: 360px)');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('overflow-x: auto');
  });
});
