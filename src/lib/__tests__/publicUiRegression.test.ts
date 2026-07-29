import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { POLICYWATCHER_VERSION } from '../release';
import { FEATURE_ATLAS_CURRENT_RELEASE_ID, FEATURE_ATLAS_FEATURES, FEATURE_ATLAS_RELEASES } from '../featureAtlas';
import { RELEASE_COLUMNS, RELEASE_IMPACT_ITEMS, RELEASE_IMPACT_UPDATED_AT } from '../releaseImpact';
import { TERMS_OF_USE, TERMS_STORAGE_KEY } from '../termsOfUse';

const read = (path: string) => readFileSync(path, 'utf8');

describe('public UI regression fixes', () => {
  it('opens What Changed in English while retaining the language toggle', () => {
    const source = read('src/app/what-changed/WhatChangedClient.tsx');
    expect(source).toContain("useState<Lang>('en')");
    expect(source).toContain("setLang(lang === 'it' ? 'en' : 'it')");
  });

  it('uses the shared public shell and current release metadata for infographics', () => {
    const source = read('src/app/infographics/page.tsx');
    expect(source).toContain('<PublicHeader current="infographics" />');
    expect(source).toContain('<Footer lang="en" />');
    expect(source).toContain('POLICYWATCHER_VERSION');
    expect(source).toContain('href="/timeline"');
    expect(source).toContain('href="/feature-atlas"');
    expect(source).toContain('aria-pressed={activeIntent === intent}');
    expect(source).toContain('Canonical Shareable View State');
    expect(source).toContain('Regional Context Drill-down');
    expect(source).toContain('Benchmark KPI Inspector');
    expect(source.match(/mobileDiagramLegend/g)).toHaveLength(2);
    expect(source).not.toContain('v3.6.3');
  });

  it('makes the press kit reachable from primary public navigation', () => {
    const navigation = read('src/components/Navigation.tsx');
    const palette = read('src/components/CommandPalette.tsx');
    const header = read('src/components/PublicHeader.tsx');
    const footer = read('src/components/Footer.tsx');

    expect(navigation).toContain("{ id: 'press-kit'");
    expect(navigation).toContain("href: '/press-kit'");
    expect(palette).toContain("id: 'act-press-kit'");
    expect(palette).toContain("window.location.href = '/press-kit'");
    expect(header).toContain("{ id: 'press-kit', href: '/press-kit'");
    expect(footer).toContain('href="/press-kit"');
  });

  it('makes the public integration directory discoverable without placing it in the crowded header', () => {
    const navigation = read('src/components/Navigation.tsx');
    const palette = read('src/components/CommandPalette.tsx');
    const footer = read('src/components/Footer.tsx');
    const atlas = read('src/lib/publicSections.ts');
    const sitemap = read('src/app/sitemap.ts');
    const developers = read('src/app/developers/page.tsx');

    expect(navigation).toContain("href: '/developers'");
    expect(palette).toContain("id: 'act-developers'");
    expect(footer).toContain('href="/developers"');
    expect(atlas).toContain("id: 'developers'");
    expect(sitemap).toContain('${BASE_URL}/developers');
    expect(developers).toContain('<PublicHeader current="developers" />');
    expect(developers).toContain('/api/v1/manifest');
  });

  it('makes the cross-platform integration map discoverable with honest readiness labels', () => {
    const navigation = read('src/components/Navigation.tsx');
    const palette = read('src/components/CommandPalette.tsx');
    const footer = read('src/components/Footer.tsx');
    const atlas = read('src/lib/publicSections.ts');
    const sitemap = read('src/app/sitemap.ts');
    const integrations = read('src/app/integrations/page.tsx');

    expect(navigation).toContain("href: '/integrations'");
    expect(palette).toContain("id: 'act-integrations'");
    expect(footer).toContain('href="/integrations"');
    expect(atlas).toContain("id: 'integrations'");
    expect(sitemap).toContain('${BASE_URL}/integrations');
    expect(integrations).toContain('<PublicHeader current="integrations" />');
    expect(integrations).toContain('Pilot ready');
    expect(integrations).toContain('Planned');
    expect(integrations).toContain('Commercial later');
    expect(integrations).toContain('/api/v2/openapi.json');
  });

  it('restores release impact and feature KPI/KRI discovery surfaces', () => {
    const discoveryFiles = [
      'src/components/Navigation.tsx',
      'src/components/CommandPalette.tsx',
      'src/components/Footer.tsx',
      'src/app/sitemap.ts',
      'src/lib/publicSections.ts',
    ];
    for (const file of discoveryFiles) expect(read(file), file).toContain('/feature-atlas');

    const roadmap = read('src/app/roadmap/RoadmapClient.tsx');
    expect(roadmap).toContain('<ReleaseImpactMap />');
    expect(FEATURE_ATLAS_FEATURES.some((feature) => feature.id === 'governed-regional-benchmark-visualizations')).toBe(true);
    expect(RELEASE_IMPACT_ITEMS.some((item) => item.kpi && item.kri)).toBe(true);
    expect(RELEASE_IMPACT_ITEMS.filter((item) => ['shareable-evidence-views', 'coordinated-evidence-drilldown'].includes(item.id))).toHaveLength(2);
    expect(RELEASE_IMPACT_UPDATED_AT).toBe('29 July 2026');
    expect(FEATURE_ATLAS_CURRENT_RELEASE_ID).toBe(POLICYWATCHER_VERSION);
    expect(FEATURE_ATLAS_RELEASES.filter((release) => release.current)).toHaveLength(1);
    expect(RELEASE_COLUMNS.filter((release) => release.state === 'current').map((release) => release.id)).toEqual([POLICYWATCHER_VERSION]);

    const featureAtlas = read('src/app/feature-atlas/FeatureAtlasClient.tsx');
    expect(featureAtlas).toContain('aria-expanded={isOpen}');
    expect(featureAtlas).toContain('mobileSelection');
    expect(featureAtlas).toContain('Back to selected capability');
  });

  it('documents the current evidence wave across public product guidance', () => {
    const roadmap = read('src/app/roadmap/RoadmapClient.tsx');
    const showcase = read('src/app/showcase/page.tsx');
    const howTo = read('src/components/HowToModal.tsx');
    const howToStyles = read('src/components/HowToModal.module.css');
    const readme = read('README.md');
    const guide = read('docs/native-dashboard-user-guide.md');

    expect(roadmap).toContain('Shareable evidence views');
    expect(roadmap).toContain('Coordinated visual evidence drill-down');
    expect(showcase).toContain('<b>v{POLICYWATCHER_VERSION}</b>');
    expect(showcase).not.toContain('<b>v3.6</b>');
    expect(showcase).toContain('Canonical share URL');
    expect(showcase).toContain('KPI value inspector');
    expect(howTo.match(/id: '[a-zA-Z]+'/g)).toHaveLength(18);
    expect(howTo).toContain("id: 'share'");
    expect(howTo).toContain("id: 'drilldown'");
    expect(howToStyles).toContain('repeat(9, minmax(0, 1fr))');
    expect(readme).toContain('9-step bilingual How To guide');
    expect(readme).toContain('docs/native-dashboard-user-guide.md');
    expect(guide).toContain('not legal advice, compliance certifications, or company-performance ratings');
  });

  it('routes Terms of Use to a real bilingual page with explicit acknowledgement renewal', () => {
    const footer = read('src/components/Footer.tsx');
    const page = read('src/app/terms/TermsPageClient.tsx');
    expect(footer).toContain('href="/terms"');
    expect(footer).not.toContain('href="#terms-gate"');
    expect(page).toContain(`localStorage.removeItem(TERMS_STORAGE_KEY)`);
    expect(TERMS_STORAGE_KEY).toBe('policywatcher_terms_accepted_v2');
    expect(TERMS_OF_USE.en.boundaries).toHaveLength(5);
    expect(TERMS_OF_USE.it.boundaries).toHaveLength(5);
  });

  it('uses a disclosure menu instead of clipped mobile public navigation', () => {
    const header = read('src/components/PublicHeader.tsx');
    const styles = read('src/components/PublicHeader.module.css');
    expect(header).toContain('aria-expanded={mobileOpen}');
    expect(header).toContain('aria-controls="public-mobile-navigation"');
    expect(styles).toContain(".navWrap[data-open='true']");
    expect(styles).not.toContain('overflow-x: auto');
  });

  it('keeps configured dashboard evidence views shareable and history-aware', () => {
    const dashboard = read('src/app/page.tsx');
    const palette = read('src/components/CommandPalette.tsx');
    expect(dashboard).toContain('decodeDashboardShareQuery(window.location.search)');
    expect(dashboard).toContain("window.history.pushState({}, '', nextUrl)");
    expect(dashboard).toContain("window.addEventListener('popstate', handlePopState)");
    expect(dashboard).toContain('handleCopyDashboardView');
    expect(dashboard).toContain('onCopyView={() => void handleCopyDashboardView()}');
    expect(palette).toContain("id: 'act-copy-view'");
  });

  it('keeps public navigation free of dead review routes and stale analysis release labels', () => {
    const publicRegistryFiles = [
      'src/components/PublicHeader.tsx',
      'src/lib/publicSections.ts',
      'src/lib/featureAtlas.ts',
      'src/lib/releaseImpact.ts',
    ];
    for (const file of publicRegistryFiles) expect(read(file), file).not.toContain('/review-request');

    const analysisFiles = [
      'src/app/change/[id]/page.tsx',
      'src/app/share/[id]/page.tsx',
      'src/components/CrossCompanyMatrix.tsx',
      'src/pdf/ExecutiveReport.tsx',
      'src/app/security/page.tsx',
    ];
    for (const file of analysisFiles) {
      const source = read(file);
      expect(source, file).not.toContain('CONFIDENCE RELEASE v3.5');
      expect(source, file).not.toContain('3.5 Confidence Track');
    }
    expect(read('src/app/change/[id]/page.tsx')).toContain('PUBLIC_ANALYSIS_DISCLAIMER_COMPACT');
    expect(read('src/components/CrossCompanyMatrix.tsx')).toContain('PUBLIC_ANALYSIS_DISCLAIMER[lang]');
  });

  it('centralizes extension and evidence freshness states without advancing legal dates', () => {
    const release = read('src/lib/release.ts');
    const extension = read('src/app/browser-extension/BrowserExtensionClient.tsx');
    const home = read('src/app/page.tsx');
    const trust = read('src/app/trust/page.tsx');
    const leaderboard = read('src/app/leaderboard/page.tsx');
    const observatory = read('src/app/observatory/page.tsx');
    const privacy = read('src/app/privacy/page.tsx');

    expect(release).toContain('POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATE');
    expect(extension).toContain('POLICYWATCHER_BROWSER_EXTENSION_STORE_STATUS[id]');
    expect(home).toContain('POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS[lang]');
    expect(trust).toContain('Historical snapshot · 5 July 2026');
    expect(leaderboard).toContain('snapshot.generatedAt');
    expect(observatory).toContain('OBSERVATORY_VERIFIED_AT');
    expect(privacy).toContain('Last updated: July 27, 2026');
  });

  it('uses the shared public shell on conventional editorial and evidence pages', () => {
    const shellFiles = [
      'src/app/about/page.tsx',
      'src/app/atlas/SiteAtlasClient.tsx',
      'src/app/feature-atlas/FeatureAtlasClient.tsx',
      'src/app/methodology/confidence/page.tsx',
      'src/app/privacy/page.tsx',
      'src/app/security/page.tsx',
      'src/app/press/page.tsx',
      'src/app/timeline/page.tsx',
      'src/app/leaderboard/page.tsx',
      'src/app/observatory/page.tsx',
      'src/app/integrations/page.tsx',
      'src/app/trust/page.tsx',
      'src/app/what-changed/WhatChangedClient.tsx',
    ];
    for (const file of shellFiles) {
      const source = read(file);
      expect(source, file).toContain('<PublicHeader');
      expect(source, file).toContain('<Footer');
    }
    expect(read('src/app/unsubscribe/page.tsx')).toContain('href="/terms"');
  });

  it('keeps reviewed mobile reference pages readable and within the evidence-console system', () => {
    const aboutStyles = read('src/app/about/about.module.css');
    const privacyStyles = read('src/app/privacy/privacy.module.css');
    const security = read('src/app/security/page.tsx');
    const securityStyles = read('src/app/security/security.module.css');

    expect(aboutStyles).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))');
    expect(aboutStyles).toContain('white-space: normal');
    expect(aboutStyles).toMatch(/\.intro,\s*\n\.authorPanel \{[\s\S]*?box-sizing: border-box;[\s\S]*?width: 100%;[\s\S]*?min-width: 0;/);
    expect(privacyStyles).toContain('font-size: 0.95rem');
    expect(privacyStyles).toContain('line-height: 1.65');
    expect(security).toContain("import styles from './security.module.css'");
    expect(security).not.toContain('style={');
    expect(securityStyles).toContain('--security-teal: #146c6a');
    expect(securityStyles).toContain('grid-template-columns: 1fr');
  });
});
