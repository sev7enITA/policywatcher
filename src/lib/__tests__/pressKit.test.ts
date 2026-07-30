import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { POLICYWATCHER_VERSION } from '../release';
import {
  PRESS_KIT_ARTICLE_50_URL,
  PRESS_KIT_RELEASE_DATE,
  PRESS_KIT_JSON_URL,
  buildPressKitPayload,
  pressKitAssets,
  pressKitClaims,
  pressKitContactRoutes,
  pressKitDataSnapshots,
  pressKitFacts,
  pressKitGlossary,
  pressKitPackages,
  pressKitRegistryEvents,
  pressKitReleases,
} from '../pressKit';
import { FEATURE_ATLAS_FEATURES } from '../featureAtlas';
import { RELEASE_COLUMNS, RELEASE_IMPACT_ITEMS } from '../releaseImpact';
import { pressKitSchemas } from '../pressKitSchemas';

const read = (path: string) => readFileSync(path, 'utf8');

describe('public press kit', () => {
  it('publishes bounded current release facts and a versioned claim ledger', () => {
    const payload = buildPressKitPayload();
    expect(payload.schemaVersion).toBe('2.0.0');
    expect(payload.canonicalUrl).toBe('https://policywatcher.online/press-kit');
    expect(PRESS_KIT_JSON_URL).toBe('https://policywatcher.online/press-kit/press-kit.json');
    expect(payload.product.version).toBe(POLICYWATCHER_VERSION);
    expect(payload.browserExtension.separateReleaseTrack).toBe(true);
    expect(payload.integrityBoundary.contentCredentials).toBe('not-attached');
    expect(pressKitFacts.map((fact) => fact.value)).toEqual(['16', '6', '15', 'EN / IT']);
    expect(pressKitFacts[0].scope.en).toContain('excludes the WAZE admin-onboarding fixture');
    expect(pressKitFacts.every((fact) => fact.asOf && fact.verifiedAt && fact.reviewCadence.en && fact.permalink)).toBe(true);
    expect(pressKitClaims).toHaveLength(6);
    expect(pressKitClaims.every((claim) => claim.proofHref && claim.boundary.en && claim.boundary.it && claim.asOf && claim.verifiedAt && claim.permalink)).toBe(true);
    expect(pressKitPackages.map((pressPackage) => pressPackage.locale)).toEqual(['en', 'it']);
    expect(pressKitReleases.some((release) => release.version === POLICYWATCHER_VERSION && release.status === 'current')).toBe(true);
    expect(pressKitReleases.find((release) => release.version === '3.9.0-beta.16')?.status).toBe('archived');
    expect(pressKitDataSnapshots[0].files.map((file) => file.format)).toEqual(['PNG', 'SVG', 'CSV', 'JSON']);
    expect(pressKitContactRoutes.map((route) => route.id)).toEqual(['press', 'fact-checking', 'interview', 'speaking']);
    expect(pressKitGlossary.length).toBeGreaterThanOrEqual(5);
    expect(pressKitRegistryEvents.length).toBeGreaterThanOrEqual(3);
    expect(PRESS_KIT_ARTICLE_50_URL).toContain('digital-strategy.ec.europa.eu');
  });

  it('keeps every owned download checksummed and aligned with the static manifest', () => {
    const manifest = JSON.parse(read('public/press-kit/asset-manifest.json')) as {
      contentCredentials: string;
      assets: Array<{ filename: string; bytes: number; sha256: string }>;
    };
    expect(manifest.contentCredentials).toBe('not-attached');
    expect(manifest.assets.length).toBeGreaterThanOrEqual(pressKitAssets.length);

    for (const manifestAsset of manifest.assets) {
      const path = `public/press-kit/${manifestAsset.filename}`;
      expect(existsSync(path), path).toBe(true);
      const content = readFileSync(path);
      expect(createHash('sha256').update(content).digest('hex'), manifestAsset.filename).toBe(manifestAsset.sha256);
      expect(content.byteLength, manifestAsset.filename).toBe(manifestAsset.bytes);
    }

    for (const asset of pressKitAssets) {
      const path = `public${asset.href}`;
      expect(existsSync(path), path).toBe(true);
      const content = readFileSync(path);
      const digest = createHash('sha256').update(content).digest('hex');
      const manifestAsset = manifest.assets.find((candidate) => candidate.filename === asset.filename);
      expect(digest, asset.filename).toBe(asset.sha256);
      expect(manifestAsset?.sha256, asset.filename).toBe(asset.sha256);
      expect(manifestAsset?.bytes, asset.filename).toBe(content.byteLength);
      expect(asset.contentCredentials).toBe('not-attached');
    }
  });

  it('publishes localized packages, reusable data and embedded media metadata', () => {
    const packageManifest = JSON.parse(read('public/press-kit/package-manifest.json')) as {
      release: string;
      packages: Array<{ locale: string; filename: string; bytes: number; sha256: string }>;
    };
    expect(packageManifest.release).toBe(POLICYWATCHER_VERSION);
    expect(packageManifest.packages.map((pressPackage) => pressPackage.locale)).toEqual(['en', 'it']);
    for (const pressPackage of packageManifest.packages) {
      const path = `public/press-kit/${pressPackage.filename}`;
      const content = readFileSync(path);
      expect(content.subarray(0, 2).toString()).toBe('PK');
      expect(content.byteLength).toBe(pressPackage.bytes);
      expect(createHash('sha256').update(content).digest('hex')).toBe(pressPackage.sha256);
    }

    const snapshot = JSON.parse(read(`public/press-kit/policywatcher-configured-scope-${PRESS_KIT_RELEASE_DATE}.json`)) as {
      asOf: string;
      facts: Array<{ id: string; value: string; scope: string }>;
    };
    expect(snapshot.asOf).toBe(PRESS_KIT_RELEASE_DATE);
    expect(snapshot.facts.map((fact) => fact.value)).toEqual(['16', '6', '15', 'EN / IT']);
    expect(snapshot.facts[0].scope).toContain('WAZE admin-onboarding fixture');

    for (const asset of pressKitAssets.filter((candidate) => candidate.mediaType === 'image/png' || candidate.mediaType === 'image/jpeg')) {
      const binary = readFileSync(`public${asset.href}`).toString('latin1');
      expect(binary, asset.filename).toContain('Iptc4xmpCore:AltTextAccessibility');
      expect(binary, asset.filename).toContain('Content Credentials are not attached');
    }
  });

  it('defaults to English, emits person/software JSON-LD and exposes bounded copy controls', () => {
    const client = read('src/app/press-kit/PressKitClient.tsx');
    const newsroomClient = read('src/app/press-kit/NewsroomPageClient.tsx');
    const page = read('src/app/press-kit/page.tsx');
    const route = read('src/app/press-kit/press-kit.json/route.ts');
    expect(client).toContain("useState<PressKitLocale>('en')");
    expect(client).toContain("navigator.clipboard.writeText(value)");
    expect(client).toContain("copySucceeded = document.execCommand('copy')");
    expect(client).toContain('if (!copySucceeded)');
    expect(client).toContain('Select the text and copy it manually.');
    expect(client).toContain('Seleziona il testo e copialo manualmente.');
    expect(client).toContain('loading="eager"');
    expect(client).toContain('sizes="200px"');
    expect(client).toContain('unoptimized');
    expect(client).toContain('Content Credentials not attached');
    expect(client).toContain('update intervals depend on retrieval and review');
    expect(client).toContain('Not assessed without assigning a numerical value');
    expect(client).toContain('className={styles.page} lang={lang}');
    expect(newsroomClient).toContain('className={styles.page} lang={lang}');
    expect(page).toContain("'@type': 'SoftwareApplication'");
    expect(page).toContain("'@type': 'Person'");
    expect(page).not.toContain("'@type': 'Organization'");
    expect(route).toContain('buildPressKitPayload()');
  });

  it('exposes release feeds, release metadata and public JSON schemas', () => {
    const rss = read('src/app/press-kit/feed.xml/route.ts');
    const jsonFeed = read('src/app/press-kit/feed.json/route.ts');
    const releaseDetail = read('src/app/press-kit/releases/[slug]/page.tsx');
    const schemaRoute = read('src/app/schemas/[schema]/v1/route.ts');
    expect(rss).toContain('application/rss+xml');
    expect(jsonFeed).toContain('https://jsonfeed.org/version/1.1');
    expect(releaseDetail).toContain("'@type': 'NewsArticle'");
    expect(releaseDetail).not.toContain("'@type': 'PressRelease'");
    expect(schemaRoute).toContain('pressKitSchemas');
    expect(pressKitSchemas['evidence-handoff'].$id).toBe('https://policywatcher.online/schemas/evidence-handoff/v1');
    expect(pressKitSchemas['change-event-feed'].$id).toBe('https://policywatcher.online/schemas/change-event-feed/v1');
    expect(pressKitSchemas['webhook-verification-kit'].$id).toBe('https://policywatcher.online/schemas/webhook-verification-kit/v1');
    expect(pressKitSchemas['webhook-conformance-suite'].$id).toBe('https://policywatcher.online/schemas/webhook-conformance-suite/v1');
  });

  it('connects the Press Kit through public navigation and supporting surfaces', () => {
    const footer = read('src/components/Footer.tsx');
    const header = read('src/components/PublicHeader.tsx');
    const sitemap = read('src/app/sitemap.ts');
    const press = read('src/app/press/page.tsx');
    const about = read('src/app/about/page.tsx');
    const sections = read('src/lib/publicSections.ts');
    expect(footer).toContain('href="/press-kit"');
    expect(header).toContain("| 'press-kit'");
    expect(header).toContain("{ id: 'press-kit', href: '/press-kit'");
    expect(sitemap).toContain('`${BASE_URL}/press-kit`');
    expect(press).toContain('href="/press-kit"');
    expect(about).toContain("href: '/press-kit'");
    expect(sections).toContain("id: 'press-kit'");
  });

  it('places Press Kit navigation in the current release and keeps prior press capabilities in the feature atlas', () => {
    expect(RELEASE_COLUMNS.filter((release) => release.state === 'current').map((release) => release.id)).toEqual([POLICYWATCHER_VERSION]);
    const releaseItem = RELEASE_IMPACT_ITEMS.find((item) => item.id === 'editorial-briefing-room');
    expect(releaseItem).toMatchObject({ status: 'delivered', startRelease: '3.9.0-beta.3', endRelease: '3.9.0-beta.3' });
    const atlasItem = FEATURE_ATLAS_FEATURES.find((feature) => feature.id === 'editorial-briefing-room');
    expect(atlasItem?.route).toEqual({ href: '/press-kit', label: 'Press Kit', access: 'public' });
    expect(atlasItem?.dependencies).toHaveLength(2);
    const governanceItem = RELEASE_IMPACT_ITEMS.find((item) => item.id === 'public-claim-language-governance');
    expect(governanceItem).toMatchObject({ status: 'delivered', startRelease: '3.9.0-beta.4', endRelease: '3.9.0-beta.4' });
    const navigationItem = RELEASE_IMPACT_ITEMS.find((item) => item.id === 'press-kit-navigation-discovery');
    expect(navigationItem).toMatchObject({ status: 'delivered', startRelease: '3.9.0-beta.5', endRelease: '3.9.0-beta.5' });
    const newsroomItem = RELEASE_IMPACT_ITEMS.find((item) => item.id === 'evidence-newsroom');
    expect(newsroomItem).toMatchObject({ status: 'delivered', startRelease: '3.9.0-beta.6', endRelease: '3.9.0-beta.6' });
    const assuranceItem = RELEASE_IMPACT_ITEMS.find((item) => item.id === 'newsroom-measurement-and-release-assurance');
    expect(assuranceItem).toMatchObject({ status: 'delivered', startRelease: '3.9.0-beta.7', endRelease: '3.9.0-beta.7' });
    const assistantItem = RELEASE_IMPACT_ITEMS.find((item) => item.id === 'assistant-entry-point-consolidation');
    expect(assistantItem).toMatchObject({ status: 'delivered', startRelease: '3.9.0-beta.8', endRelease: '3.9.0-beta.8' });
    const distributionItem = RELEASE_IMPACT_ITEMS.find((item) => item.id === 'verified-browser-store-distribution');
    expect(distributionItem).toMatchObject({ status: 'delivered', startRelease: '3.9.0-beta.9', endRelease: '3.9.0-beta.9' });
    const continuityItem = RELEASE_IMPACT_ITEMS.find((item) => item.id === 'historical-suspensions');
    expect(continuityItem).toMatchObject({ status: 'delivered', startRelease: '3.9.0-beta.10', endRelease: '3.9.0-beta.10' });
    const integrationItem = RELEASE_IMPACT_ITEMS.find((item) => item.id === 'public-integration-directory');
    expect(integrationItem).toMatchObject({ status: 'delivered', startRelease: '3.9.0-beta.11', endRelease: '3.9.0-beta.11' });
    const emailIntakeItem = RELEASE_IMPACT_ITEMS.find((item) => item.id === 'mobile-email-intake');
    expect(emailIntakeItem).toMatchObject({ status: 'delivered', startRelease: '3.9.0-beta.12', endRelease: '3.9.0-beta.12' });
    const pulseItem = RELEASE_IMPACT_ITEMS.find((item) => item.id === 'editorial-pulse-distribution');
    expect(pulseItem).toMatchObject({ status: 'delivered', startRelease: '3.9.0-beta.13', endRelease: '3.9.0-beta.13' });
    const outreachItem = RELEASE_IMPACT_ITEMS.find((item) => item.id === 'protected-press-outreach-desk');
    expect(outreachItem).toMatchObject({ status: 'delivered', startRelease: '3.9.0-beta.14', endRelease: '3.9.0-beta.14' });
    const coverageItem = RELEASE_IMPACT_ITEMS.find((item) => item.id === 'citable-coverage-registry');
    expect(coverageItem).toMatchObject({ status: 'delivered', startRelease: '3.9.0-beta.15', endRelease: '3.9.0-beta.15' });
    const packetItem = RELEASE_IMPACT_ITEMS.find((item) => item.id === 'evidence-governance-packets');
    expect(packetItem).toMatchObject({ status: 'delivered', startRelease: '3.9.0-beta.16', endRelease: '3.9.0-beta.16' });
    const packetAtlasItem = FEATURE_ATLAS_FEATURES.find((feature) => feature.id === 'evidence-governance-packets');
    expect(packetAtlasItem?.route).toEqual({ href: '/evidence', label: 'Evidence Packets', access: 'public' });
    const collectionItem = RELEASE_IMPACT_ITEMS.find((item) => item.id === 'shareable-evidence-collections');
    expect(collectionItem).toMatchObject({ status: 'delivered', startRelease: '3.9.0-beta.17', endRelease: '3.9.0-beta.17' });
    const collectionAtlasItem = FEATURE_ATLAS_FEATURES.find((feature) => feature.id === 'shareable-evidence-collections');
    expect(collectionAtlasItem?.route).toEqual({ href: '/collections', label: 'Evidence Collections', access: 'public' });
    const workflowItem = RELEASE_IMPACT_ITEMS.find((item) => item.id === 'evidence-workflow-refinements');
    expect(workflowItem).toMatchObject({ status: 'delivered', startRelease: '3.9.0-beta.18', endRelease: '3.9.0-beta.18' });
    const handoffItem = RELEASE_IMPACT_ITEMS.find((item) => item.id === 'collaboration-handoff-manifest');
    expect(handoffItem).toMatchObject({ status: 'delivered', startRelease: '3.9.0-beta.19', endRelease: '3.9.0-beta.19' });
    const handoffAtlasItem = FEATURE_ATLAS_FEATURES.find((feature) => feature.id === 'collaboration-handoff-manifest');
    expect(handoffAtlasItem?.route).toEqual({ href: '/collections', label: 'Evidence Collections', access: 'public' });
    const eventItem = RELEASE_IMPACT_ITEMS.find((item) => item.id === 'public-change-event-feed');
    expect(eventItem).toMatchObject({ status: 'delivered', startRelease: '3.9.0-beta.19', endRelease: '3.9.0-beta.19' });
    const eventAtlasItem = FEATURE_ATLAS_FEATURES.find((feature) => feature.id === 'public-change-event-feed');
    expect(eventAtlasItem?.route).toEqual({ href: '/developers', label: 'Developer contract', access: 'public' });
    const webhookItem = RELEASE_IMPACT_ITEMS.find((item) => item.id === 'webhook-verification-readiness');
    expect(webhookItem).toMatchObject({ status: 'delivered', startRelease: '3.9.0-beta.20', endRelease: '3.9.0-beta.20' });
    const webhookAtlasItem = FEATURE_ATLAS_FEATURES.find((feature) => feature.id === 'webhook-verification-readiness');
    expect(webhookAtlasItem?.route).toEqual({ href: '/developers/webhook-readiness', label: 'Webhook Readiness Kit', access: 'public' });
    const reliabilityItem = RELEASE_IMPACT_ITEMS.find((item) => item.id === 'source-reliability-control-plane');
    expect(reliabilityItem).toMatchObject({ status: 'current', startRelease: POLICYWATCHER_VERSION, endRelease: POLICYWATCHER_VERSION });
    const reliabilityAtlasItem = FEATURE_ATLAS_FEATURES.find((feature) => feature.id === 'source-reliability-control-plane');
    expect(reliabilityAtlasItem?.route).toEqual({ href: '/admin/source-reliability', label: 'Source Reliability', access: 'protected' });
    const conformanceItem = RELEASE_IMPACT_ITEMS.find((item) => item.id === 'receiver-conformance-lab');
    expect(conformanceItem).toMatchObject({ status: 'current', startRelease: POLICYWATCHER_VERSION, endRelease: POLICYWATCHER_VERSION });
    const conformanceAtlasItem = FEATURE_ATLAS_FEATURES.find((feature) => feature.id === 'receiver-conformance-lab');
    expect(conformanceAtlasItem?.route).toEqual({ href: '/developers/webhook-readiness', label: 'Receiver Conformance Lab', access: 'public' });
  });
});
