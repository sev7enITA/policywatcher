import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { POLICYWATCHER_RELEASE_DATE, POLICYWATCHER_RELEASE_NAME, POLICYWATCHER_VERSION } from '../release';
import { FEATURE_ATLAS_CURRENT_RELEASE_ID, FEATURE_ATLAS_FEATURES } from '../featureAtlas';
import { pressKitReleases } from '../pressKit';
import { RELEASE_COLUMNS, RELEASE_IMPACT_ITEMS } from '../releaseImpact';

const read = (path: string) => readFileSync(path, 'utf8');

describe('Beta 38 public consistency', () => {
  it('keeps one current release across release, impact, atlas and newsroom records', () => {
    expect(POLICYWATCHER_VERSION).toBe('3.9.0-beta.38');
    expect(POLICYWATCHER_RELEASE_NAME).toBe('Git-hosted Press Distribution');
    expect(POLICYWATCHER_RELEASE_DATE).toBe('2026-08-02');
    expect(FEATURE_ATLAS_CURRENT_RELEASE_ID).toBe(POLICYWATCHER_VERSION);
    expect(RELEASE_COLUMNS.filter((release) => release.state === 'current').map((release) => release.id)).toEqual([POLICYWATCHER_VERSION]);
    expect(pressKitReleases.filter((release) => release.status === 'current').map((release) => release.version)).toEqual([POLICYWATCHER_VERSION]);
    expect(pressKitReleases.find((release) => release.version === '3.9.0-beta.27')?.status).toBe('archived');
  });

  it('publishes prior waves and the current Git-hosted press distribution', () => {
    expect(RELEASE_IMPACT_ITEMS.some((item) => item.id === 'residency-assurance' && item.status === 'delivered' && item.startRelease === '3.9.0-beta.31')).toBe(true);
    expect(RELEASE_IMPACT_ITEMS.some((item) => item.id === 'production-validation' && item.status === 'delivered' && item.startRelease === '3.9.0-beta.32')).toBe(true);
    expect(RELEASE_IMPACT_ITEMS.some((item) => item.id === 'renderer-hardening' && item.status === 'delivered' && item.startRelease === '3.9.0-beta.33')).toBe(true);
    expect(RELEASE_IMPACT_ITEMS.some((item) => item.id === 'source-remediation-workbench-ux' && item.status === 'delivered' && item.startRelease === '3.9.0-beta.34')).toBe(true);
    expect(RELEASE_IMPACT_ITEMS.some((item) => item.id === 'community-signal-composer' && item.status === 'delivered' && item.startRelease === '3.9.0-beta.35')).toBe(true);
    expect(RELEASE_IMPACT_ITEMS.some((item) => item.id === 'admin-mutation-hardening' && item.status === 'delivered' && item.startRelease === '3.9.0-beta.36')).toBe(true);
    expect(RELEASE_IMPACT_ITEMS.some((item) => item.id === 'categorized-resource-navigation' && item.status === 'delivered' && item.startRelease === '3.9.0-beta.37')).toBe(true);
    expect(RELEASE_IMPACT_ITEMS.some((item) => item.id === 'retrieval-deduplication-diagnostics' && item.status === 'delivered' && item.startRelease === '3.9.0-beta.37')).toBe(true);
    expect(RELEASE_IMPACT_ITEMS.some((item) => item.id === 'github-press-kit-distribution' && item.status === 'current' && item.startRelease === '3.9.0-beta.38')).toBe(true);
    expect(FEATURE_ATLAS_FEATURES.some((feature) => feature.id === 'source-remediation-workbench-ux' && feature.route?.href === '/admin/source-reliability')).toBe(true);
    expect(FEATURE_ATLAS_FEATURES.some((feature) => feature.id === 'community-signal-composer' && feature.route?.href === '/roadmap')).toBe(true);
    expect(read('src/app/roadmap/RoadmapClient.tsx')).toContain('Administrative mutation hardening');
    expect(read('src/app/roadmap/RoadmapSignalComposer.tsx')).toContain('Browser-local signal composer');
    expect(read('src/app/admin/source-reliability/page.tsx')).toContain('Source Remediation Workbench');
    expect(read('src/proxy.ts')).toContain('evaluateAdminMutationBoundary');
    expect(read('CHANGELOG.md')).toContain('## 3.9.0-beta.36 - 2026-08-02');
    expect(read('CHANGELOG.md')).toContain('## 3.9.0-beta.37 - 2026-08-02');
    expect(read('CHANGELOG.md')).toContain('## 3.9.0-beta.38 - 2026-08-02');
    expect(read('scripts/package-release.sh')).toContain('docs/audit-v3.9.0-beta.38.md');
  });
});
