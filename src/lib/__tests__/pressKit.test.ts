import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { POLICYWATCHER_VERSION } from '../release';
import {
  PRESS_KIT_ARTICLE_50_URL,
  PRESS_KIT_JSON_URL,
  buildPressKitPayload,
  pressKitAssets,
  pressKitClaims,
  pressKitFacts,
} from '../pressKit';
import { FEATURE_ATLAS_FEATURES } from '../featureAtlas';
import { RELEASE_COLUMNS, RELEASE_IMPACT_ITEMS } from '../releaseImpact';

const read = (path: string) => readFileSync(path, 'utf8');

describe('public press kit', () => {
  it('publishes bounded current release facts and a six-entry claim ledger', () => {
    const payload = buildPressKitPayload();
    expect(payload.schemaVersion).toBe('1.0.0');
    expect(payload.canonicalUrl).toBe('https://policywatcher.online/press-kit');
    expect(PRESS_KIT_JSON_URL).toBe('https://policywatcher.online/press-kit/press-kit.json');
    expect(payload.product.version).toBe(POLICYWATCHER_VERSION);
    expect(payload.browserExtension.separateReleaseTrack).toBe(true);
    expect(payload.integrityBoundary.contentCredentials).toBe('not-attached');
    expect(pressKitFacts.map((fact) => fact.value)).toEqual(['16', '6', '15', 'EN / IT']);
    expect(pressKitClaims).toHaveLength(6);
    expect(pressKitClaims.every((claim) => claim.proofHref && claim.boundary.en && claim.boundary.it)).toBe(true);
    expect(PRESS_KIT_ARTICLE_50_URL).toContain('digital-strategy.ec.europa.eu');
  });

  it('keeps every owned download checksummed and aligned with the static manifest', () => {
    const manifest = JSON.parse(read('public/press-kit/asset-manifest.json')) as {
      contentCredentials: string;
      assets: Array<{ filename: string; bytes: number; sha256: string }>;
    };
    expect(manifest.contentCredentials).toBe('not-attached');
    expect(manifest.assets).toHaveLength(pressKitAssets.length);

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

  it('defaults to English, emits person/software JSON-LD and exposes bounded copy controls', () => {
    const client = read('src/app/press-kit/PressKitClient.tsx');
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
    expect(page).toContain("'@type': 'SoftwareApplication'");
    expect(page).toContain("'@type': 'Person'");
    expect(page).not.toContain("'@type': 'Organization'");
    expect(route).toContain('buildPressKitPayload()');
  });

  it('connects the newsroom without crowding the primary navigation', () => {
    const footer = read('src/components/Footer.tsx');
    const header = read('src/components/PublicHeader.tsx');
    const sitemap = read('src/app/sitemap.ts');
    const press = read('src/app/press/page.tsx');
    const about = read('src/app/about/page.tsx');
    const sections = read('src/lib/publicSections.ts');
    expect(footer).toContain('href="/press-kit"');
    expect(header).toContain("| 'press-kit'");
    expect(header).not.toContain("{ id: 'press-kit', href: '/press-kit'");
    expect(sitemap).toContain('`${BASE_URL}/press-kit`');
    expect(press).toContain('Open the press kit');
    expect(about).toContain("href: '/press-kit'");
    expect(sections).toContain("id: 'press-kit'");
  });

  it('places claim-language governance in the current release and keeps the briefing room in the feature atlas', () => {
    expect(RELEASE_COLUMNS.filter((release) => release.state === 'current').map((release) => release.id)).toEqual([POLICYWATCHER_VERSION]);
    const releaseItem = RELEASE_IMPACT_ITEMS.find((item) => item.id === 'editorial-briefing-room');
    expect(releaseItem).toMatchObject({ status: 'delivered', startRelease: '3.9.0-beta.3', endRelease: '3.9.0-beta.3' });
    const atlasItem = FEATURE_ATLAS_FEATURES.find((feature) => feature.id === 'editorial-briefing-room');
    expect(atlasItem?.route).toEqual({ href: '/press-kit', label: 'Press Kit', access: 'public' });
    expect(atlasItem?.dependencies).toHaveLength(2);
    const governanceItem = RELEASE_IMPACT_ITEMS.find((item) => item.id === 'public-claim-language-governance');
    expect(governanceItem).toMatchObject({ status: 'current', startRelease: POLICYWATCHER_VERSION, endRelease: POLICYWATCHER_VERSION });
  });
});
