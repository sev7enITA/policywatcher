import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { pressKitClaims, pressKitFacts, pressKitReleases } from '../pressKit';
import { buildPulseManifest, pulseCardDimensions, pulseLaunchKit, pulseStories } from '../editorialPulse';
import { buildDeterministicStoryZip, buildStoryPackFiles } from '../storyPack';

const read = (path: string) => readFileSync(path, 'utf8');

describe('Editorial Pulse contracts', () => {
  it('keeps every human-approved lead versioned, bounded, cited and linked to published records', () => {
    const claimIds = new Set(pressKitClaims.map((claim) => claim.id));
    const factIds = new Set(pressKitFacts.map((fact) => fact.id));
    const releaseSlugs = new Set(pressKitReleases.map((release) => release.slug));
    expect(pulseStories.length).toBeGreaterThanOrEqual(3);
    for (const story of pulseStories) {
      expect(story.status).toBe('verified');
      expect(story.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(story.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(story.boundary.en.length).toBeGreaterThan(30);
      expect(story.citation.en).toContain(`v${story.version}`);
      expect(story.sourceLinks.length).toBeGreaterThan(1);
      for (const fact of story.facts) {
        expect(claimIds.has(fact.claimId)).toBe(true);
        expect(fact.proofHref).toMatch(/^\//);
      }
      for (const source of story.sourceLinks) {
        if (source.claimId) expect(claimIds.has(source.claimId)).toBe(true);
        if (source.releaseSlug) expect(releaseSlugs.has(source.releaseSlug)).toBe(true);
      }
    }
    expect(factIds.has('monitored-companies')).toBe(true);
  });

  it('builds byte-identical, stable-order Story Packs', () => {
    const story = pulseStories[0];
    const first = buildDeterministicStoryZip(story, 'en');
    const second = buildDeterministicStoryZip(story, 'en');
    expect(first).toEqual(second);
    expect(Array.from(first.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    const files = buildStoryPackFiles(story, 'en').map((file) => file.name).sort();
    expect(files).toEqual(['README.txt', 'citation.txt', 'facts.csv', 'manifest.json', 'pitch.txt', 'sources.json']);
    expect(buildPulseManifest(story, 'en').files).toEqual(files);
  });

  it('publishes the exact social and launch asset formats without vote requests', () => {
    expect(pulseCardDimensions).toEqual({
      og: { width: 1200, height: 630, label: 'Open Graph' },
      square: { width: 1080, height: 1080, label: 'Square' },
      feed: { width: 1080, height: 1350, label: 'Portrait feed' },
      story: { width: 1080, height: 1920, label: 'Story' },
    });
    const launchCopy = JSON.stringify(pulseLaunchKit).toLowerCase();
    expect(launchCopy).not.toContain('upvote');
    expect(launchCopy).not.toContain('vote for');
    expect(pulseLaunchKit.productHunt.description.length).toBeLessThanOrEqual(260);
  });

  it('wires dataset metadata, specific OG routes, embeds, navigation and aggregate telemetry', () => {
    expect(read('src/app/press-kit/data/page.tsx')).toContain("'@type': 'Dataset'");
    expect(read('src/app/press-kit/data/page.tsx')).toContain("'@type': 'DataDownload'");
    expect(read('src/app/press-kit/releases/[slug]/page.tsx')).toContain('/api/og/release/');
    expect(read('src/app/pulse/[slug]/page.tsx')).toContain("'@type': 'NewsArticle'");
    expect(read('src/app/embed/pulse/[slug]/page.tsx')).toContain('Open evidence and sources');
    expect(read('src/components/PublicHeader.tsx')).toContain("href: '/pulse'");
    expect(read('src/app/sitemap.ts')).toContain('pulseEntries');
    expect(read('src/lib/pressMetrics.ts')).toContain('editorialFunnel');
    expect(read('src/app/admin/page.tsx')).toContain('Pulse story and reuse events');
  });
});
