import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  POLICYWATCHER_BUILD_LABEL,
  POLICYWATCHER_RELEASE_BADGE,
  POLICYWATCHER_RELEASE_CHANNEL,
  POLICYWATCHER_RELEASE_CHANNEL_LABEL,
  POLICYWATCHER_RELEASE_NAME,
  POLICYWATCHER_VERSION,
  type PolicyWatcherReleaseChannel,
} from '../release';

const releaseSurfaces = [
  'src/app/page.tsx',
  'src/app/trust/page.tsx',
  'src/app/admin/layout.tsx',
  'src/app/admin/login/page.tsx',
  'src/app/admin/page.tsx',
  'src/app/admin/kpi-audit/page.tsx',
  'src/app/api/admin/export-encrypted/route.ts',
  'src/components/Footer.tsx',
  'src/components/MethodologyModal.tsx',
  'src/components/Navigation.tsx',
];

describe('release metadata', () => {
  it('matches the package version and composes one build label', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };
    expect(POLICYWATCHER_VERSION).toBe(packageJson.version);
    expect(POLICYWATCHER_RELEASE_NAME).toBe('Extension-First Evidence Release');
    expect(POLICYWATCHER_BUILD_LABEL).toBe('v3.8.3-beta.2 Extension-First Evidence Release');
    expect(POLICYWATCHER_RELEASE_CHANNEL).toBe('beta');
    expect(POLICYWATCHER_RELEASE_CHANNEL_LABEL).toBe('BETA');
    expect(POLICYWATCHER_RELEASE_BADGE).toBe('v3.8.3-beta.2 · BETA');

    const typedChannel: PolicyWatcherReleaseChannel = POLICYWATCHER_RELEASE_CHANNEL;
    expect(typedChannel).toBe('beta');
  });

  it('keeps current release surfaces connected to centralized metadata', () => {
    for (const file of releaseSurfaces) {
      expect(readFileSync(file, 'utf8'), file).toMatch(/POLICYWATCHER_(VERSION|BUILD_LABEL)/);
    }
  });
});
