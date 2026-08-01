import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { POLICYWATCHER_RELEASE_DATE, POLICYWATCHER_RELEASE_NAME, POLICYWATCHER_VERSION } from '../release';
import { FEATURE_ATLAS_CURRENT_RELEASE_ID, FEATURE_ATLAS_FEATURES } from '../featureAtlas';
import { pressKitReleases } from '../pressKit';
import { RELEASE_COLUMNS, RELEASE_IMPACT_ITEMS } from '../releaseImpact';

const read = (path: string) => readFileSync(path, 'utf8');

describe('Beta 27 public consistency', () => {
  it('keeps one current release across release, impact, atlas and newsroom records', () => {
    expect(POLICYWATCHER_VERSION).toBe('3.9.0-beta.27');
    expect(POLICYWATCHER_RELEASE_NAME).toBe('Admin Operational Readiness');
    expect(POLICYWATCHER_RELEASE_DATE).toBe('2026-08-01');
    expect(FEATURE_ATLAS_CURRENT_RELEASE_ID).toBe(POLICYWATCHER_VERSION);
    expect(RELEASE_COLUMNS.filter((release) => release.state === 'current').map((release) => release.id)).toEqual([POLICYWATCHER_VERSION]);
    expect(pressKitReleases.filter((release) => release.status === 'current').map((release) => release.version)).toEqual([POLICYWATCHER_VERSION]);
    expect(pressKitReleases.find((release) => release.version === '3.9.0-beta.26')?.status).toBe('archived');
  });

  it('publishes the bounded operational-readiness contract without changing the public board', () => {
    expect(RELEASE_IMPACT_ITEMS.some((item) => item.id === 'admin-operational-readiness' && item.status === 'current')).toBe(true);
    expect(FEATURE_ATLAS_FEATURES.some((feature) => feature.id === 'admin-operational-readiness')).toBe(true);
    expect(read('src/app/roadmap/RoadmapClient.tsx')).toContain('five-priority Action Center');
    expect(read('src/app/methodology/confidence/page.tsx')).toContain('False-positive prevention');
    expect(read('src/app/leaderboard/page.tsx')).toContain('separate from the protected');
    expect(read('src/app/privacy/page.tsx')).toContain('Protected dashboard measurement');
    expect(read('CHANGELOG.md')).toContain('## 3.9.0-beta.27 - 2026-08-01');
    expect(read('scripts/package-release.sh')).toContain('docs/audit-v3.9.0-beta.27.md');
  });
});
