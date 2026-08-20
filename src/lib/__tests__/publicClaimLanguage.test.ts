import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const publicClaimSurfaces = [
  'README.md',
  'CHANGELOG.md',
  'docs/press-outreach-2026-07-27.md',
  'public/press-kit/policywatcher-fact-sheet-2026-07-27.md',
  'src/app/about/page.tsx',
  'src/app/associazioni/page.tsx',
  'src/app/associazioni/LocalizedAssociationsPage.tsx',
  'src/app/associazioni/AssociationsClient.tsx',
  'src/app/browser-extension/BrowserExtensionClient.tsx',
  'src/app/press-kit/PressKitClient.tsx',
  'src/app/press-kit/page.tsx',
  'src/app/security/page.tsx',
  'src/app/trust/page.tsx',
  'src/app/what-changed/WhatChangedClient.tsx',
  'src/components/AboutModal.tsx',
  'src/components/ChangelogModal.tsx',
  'src/components/MethodologyModal.tsx',
  'src/components/PolicyDetails.tsx',
  'src/lib/pressKit.ts',
  'src/lib/publicSections.ts',
] as const;

const prohibitedClaims = [
  /zero vulnerabilities/i,
  /zero high-severity/i,
  /evidence, not hype/i,
  /honest provenance/i,
  /publication-ready/i,
  /world-class/i,
  /\btruthful\b/i,
  /state of the art report/i,
  /not a black box/i,
  /always under your control/i,
  /strongest editorial story/i,
  /non-magical ai/i,
  /compounding evidence loop/i,
  /deterministic, factual output/i,
  /real-time alerts/i,
  /real-time stats/i,
] as const;

const headlineCopySurfaces = [
  'mobile/android-companion/src/i18n/copy.ts',
  'src/app/DashboardClient.tsx',
  'src/components/HowToModal.tsx',
  'src/components/TermsGate.tsx',
  'src/components/ExperienceControlCenter.tsx',
  'src/components/ReleaseEvidencePulse.tsx',
  'src/components/ReleaseImpactMap.tsx',
  'src/app/roadmap/RoadmapClient.tsx',
  'src/app/roadmap/page.tsx',
  'src/app/atlas/SiteAtlasClient.tsx',
  'src/app/developers/page.tsx',
  'src/app/developers/webhook-readiness/page.tsx',
  'src/app/developers/event-continuity/page.tsx',
  'src/app/integrations/page.tsx',
  'src/app/associazioni/AssociationsClient.tsx',
  'src/app/associazioni/LocalizedAssociationsPage.tsx',
  'src/app/browser-extension/BrowserExtensionClient.tsx',
  'src/app/collections/CollectionsClient.tsx',
  'src/app/feature-atlas/FeatureAtlasClient.tsx',
  'src/app/trust/page.tsx',
  'src/app/knowledge/page.tsx',
  'src/app/methodology/confidence/page.tsx',
  'src/app/infographics/page.tsx',
  'src/app/observatory/page.tsx',
  'src/app/showcase/page.tsx',
  'src/app/timeline/page.tsx',
  'src/app/office-addin/contract-review/ContractReviewClient.tsx',
  'src/app/about/page.tsx',
  'src/components/pulse/PulseIndexClient.tsx',
  'src/app/pulse/[slug]/page.tsx',
  'src/app/press-kit/PressKitClient.tsx',
  'src/app/press/page.tsx',
  'src/app/trust/residency/page.tsx',
  'src/app/what-changed/WhatChangedClient.tsx',
] as const;

const removedLegacyHeadlines = [
  /evidence to read, not alerts to chase/i,
  /evidenze da leggere, non notifiche da inseguire/i,
  /a companion, not a control room/i,
  /un companion, non una sala controllo/i,
  /start from the question, not from (?:the dashboard|the menu)/i,
  /parti dalla domanda, non dalla dashboard/i,
  /from the email to real links, without sending the email/i,
  /dalla mail ai link reali, senza inviare la mail/i,
  /publications, not real time/i,
  /pubblicazioni, non tempo reale/i,
  /connect to the evidence, not around it/i,
  /integrations receive bounded evidence, not the machinery behind it/i,
  /residency and processor evidence, without inferred certainty/i,
  /inspect what a forward cursor can and cannot show/i,
  /set up (?:your|the) workspace/i,
  /configura il workspace/i,
  /find the right starting point/i,
  /use the published evidence apis/i,
  /check links in policy notices/i,
  /editorial leads and cited sources/i,
  /inspect the forward event window/i,
  /explore the public platform as an evidence graph/i,
  /suggested exploration paths/i,
  /adaptive orientation/i,
  /evolves into adaptive lenses/i,
  /policywatcher is api-first/i,
  /explore integration map/i,
] as const;

const requiredCurrentHeadlines = [
  ['mobile/android-companion/src/i18n/copy.ts', "title: 'Updates'"],
  ['mobile/android-companion/src/i18n/copy.ts', "title: 'Settings'"],
  ['src/app/DashboardClient.tsx', "title: 'Workspace configuration'"],
  ['src/app/DashboardClient.tsx', "title: 'Configurazione workspace'"],
  ['src/app/DashboardClient.tsx', "title: 'Dashboard overview'"],
  ['src/components/HowToModal.tsx', "title: 'Dashboard sections'"],
  ['src/components/TermsGate.tsx', "title: 'Workspace access'"],
  ['src/components/ExperienceControlCenter.tsx', "title: 'Interface settings'"],
  ['src/components/ReleaseEvidencePulse.tsx', "headline: 'Release evidence'"],
  ['src/components/ReleaseImpactMap.tsx', 'Release impact details'],
  ['src/app/roadmap/RoadmapClient.tsx', 'Workspace configuration'],
  ['src/app/roadmap/RoadmapClient.tsx', '<h1>Product roadmap</h1>'],
  ['src/app/atlas/SiteAtlasClient.tsx', '<h1>Site map</h1>'],
  ['src/app/atlas/SiteAtlasClient.tsx', '<h2>Route groups</h2>'],
  ['src/app/atlas/SiteAtlasClient.tsx', "title: 'Dashboard view settings'"],
  ['src/lib/publicSections.ts', "label: 'Core routes'"],
  ['src/lib/publicSections.ts', "label: 'Quality assurance'"],
  ['src/app/developers/page.tsx', '<h1>Developer APIs and tools</h1>'],
  ['src/app/developers/webhook-readiness/page.tsx', '<h1>Webhook verification</h1>'],
  ['src/app/developers/event-continuity/page.tsx', '<h1>Event feed continuity</h1>'],
  ['src/app/integrations/page.tsx', '<h1>Integrations</h1>'],
  ['src/app/integrations/page.tsx', 'Data shared with integrations'],
  ['src/app/integrations/page.tsx', 'Open integration map'],
  ['src/app/associazioni/AssociationsClient.tsx', "tr('Associazioni dei consumatori', 'Consumer associations')"],
  ['src/app/browser-extension/BrowserExtensionClient.tsx', "title: 'Link verification'"],
  ['src/app/collections/CollectionsClient.tsx', '<h1>Evidence collections</h1>'],
  ['src/app/feature-atlas/FeatureAtlasClient.tsx', '<h1>Feature atlas</h1>'],
  ['src/app/trust/page.tsx', '<h1>Trust and quality controls</h1>'],
  ['src/app/knowledge/page.tsx', '<h1>Public policy records</h1>'],
  ['src/app/methodology/confidence/page.tsx', "title: 'Evidence methodology'"],
  ['src/app/infographics/page.tsx', '<h1>Infographics</h1>'],
  ['src/app/infographics/page.tsx', 'title="Product architecture"'],
  ['src/app/observatory/page.tsx', "title: 'Policy, privacy and AI observatory'"],
  ['src/app/observatory/page.tsx', "title: 'Osservatorio su policy, privacy e IA'"],
  ['src/app/showcase/page.tsx', '<h1>Product overview</h1>'],
  ['src/app/timeline/page.tsx', '<h2 id="continuity-boundary-title">Evidence boundaries</h2>'],
  ['src/app/office-addin/contract-review/ContractReviewClient.tsx', '<h2 id="search-title">Related public evidence</h2>'],
  ['src/app/about/page.tsx', '<h2>Project repository</h2>'],
  ['src/components/pulse/PulseIndexClient.tsx', '<h1>PolicyWatcher Pulse</h1>'],
  ['src/app/press/page.tsx', 'Registry scope and limitations'],
  ['src/app/trust/residency/page.tsx', 'Residency and processor evidence'],
  ['src/app/what-changed/WhatChangedClient.tsx', "title: 'Policy notice verification'"],
] as const;

function extractPromotionalHeadlines(content: string) {
  const jsxHeadings = [...content.matchAll(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi)]
    .map((match) => match[1] ?? '');
  const copyTitles = [...content.matchAll(/\b(?:title|pollingTitle):\s*(['"`])([^'"`\n]+)\1/g)]
    .map((match) => match[2] ?? '');
  return [...jsxHeadings, ...copyTitles]
    .filter((headline) => !/\b(?:not found|not available|unavailable|invalid|error|non disponibile|nessun|errore)\b/i.test(headline))
    .join('\n');
}

function extractSectionHeadlines(content: string) {
  return [...content.matchAll(/<h[1-2]\b[^>]*>([\s\S]*?)<\/h[1-2]>/gi)]
    .map((match) => match[1] ?? '')
    .join('\n');
}

const narrativeHeadlinePatterns = [
  /\b(?:start|find|discover|explore|help|choose)\b/i,
  /\b(?:parti|trova|scopri|esplora|scegli)\b/i,
  /\b(?:calm|clarity|confident|confidence)\b/i,
  /\bfrom\b.{1,80}\bto\b/i,
  /\bd(?:a|al|alla)\b.{1,80}\b(?:a|al|alla)\b/i,
] as const;

describe('public claim language', () => {
  it.each(publicClaimSurfaces)('%s avoids prohibited promotional and absolute claims', (file) => {
    const content = readFileSync(file, 'utf8');
    for (const claim of prohibitedClaims) {
      expect(content, `${file} contains ${claim}`).not.toMatch(claim);
    }
  });

  it('keeps dependency-audit wording scoped to a point in time and non-certifying', () => {
    const readme = readFileSync('README.md', 'utf8');
    expect(readme).toContain('point-in-time deployable dependency audit');
    expect(readme).toContain('not a security certification');
  });

  it.each(headlineCopySurfaces)('%s keeps interface headings direct and affirmative', (file) => {
    const content = readFileSync(file, 'utf8');
    const headlines = extractPromotionalHeadlines(content);
    expect(headlines, `${file} contains an English contrastive headline`).not.toMatch(/\b(?:not|without)\b/i);
    expect(headlines, `${file} contains an Italian contrastive headline`).not.toMatch(/\b(?:non|senza)\b/i);
  });

  it.each(headlineCopySurfaces)('%s uses functional section labels instead of narrative headlines', (file) => {
    const content = readFileSync(file, 'utf8');
    const headlines = extractSectionHeadlines(content);
    for (const pattern of narrativeHeadlinePatterns) {
      expect(headlines, `${file} contains ${pattern}`).not.toMatch(pattern);
    }
  });

  it.each(headlineCopySurfaces)('%s does not restore removed synthetic headlines', (file) => {
    const content = readFileSync(file, 'utf8');
    for (const headline of removedLegacyHeadlines) {
      expect(content, `${file} contains ${headline}`).not.toMatch(headline);
    }
  });

  it.each(requiredCurrentHeadlines)('%s keeps the approved heading "%s"', (file, headline) => {
    expect(readFileSync(file, 'utf8')).toContain(headline);
  });

  it('keeps the Atlas route graph and integration hero functional', () => {
    const content = [
      readFileSync('src/app/atlas/SiteAtlasClient.tsx', 'utf8'),
      readFileSync('src/lib/publicSections.ts', 'utf8'),
      readFileSync('src/app/integrations/page.tsx', 'utf8'),
    ].join('\n');

    for (const headline of removedLegacyHeadlines) {
      expect(content, `functional route copy contains ${headline}`).not.toMatch(headline);
    }
  });

  it('keeps mobile Settings content clear of the fixed tab bar', () => {
    const companion = readFileSync('mobile/android-companion/app/(tabs)/companion.tsx', 'utf8');
    expect(companion).toContain('<Screen contentContainerStyle={styles.screenContent}>');
    expect(companion).toContain('screenContent: { paddingBottom: 112 }');
  });
});
