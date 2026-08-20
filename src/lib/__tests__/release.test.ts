import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import {
  POLICYWATCHER_BROWSER_EXTENSION_RELEASE_BADGE,
  POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATE,
  POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS,
  POLICYWATCHER_BROWSER_EXTENSION_DISPLAY_VERSION,
  POLICYWATCHER_BROWSER_EXTENSION_VERSION,
  POLICYWATCHER_BUILD_LABEL,
  POLICYWATCHER_RELEASE_BADGE,
  POLICYWATCHER_RELEASE_CHANNEL,
  POLICYWATCHER_RELEASE_CHANNEL_LABEL,
  POLICYWATCHER_RELEASE_DATE,
  POLICYWATCHER_RELEASE_DATE_LABEL,
  POLICYWATCHER_RELEASE_MONTH_LABEL,
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
  'src/lib/encryptedBackup.ts',
  'src/components/Footer.tsx',
  'src/components/MethodologyModal.tsx',
  'src/components/Navigation.tsx',
];

describe('release metadata', () => {
  it('matches the package version and composes one build label', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };
    expect(POLICYWATCHER_VERSION).toBe(packageJson.version);
    expect(POLICYWATCHER_RELEASE_NAME).toBe('Production Readiness Hardening');
    expect(POLICYWATCHER_BUILD_LABEL).toBe('v4.0.0-beta.2 Production Readiness Hardening');
    expect(POLICYWATCHER_RELEASE_DATE).toBe('2026-08-20');
    expect(POLICYWATCHER_RELEASE_DATE_LABEL).toEqual({ en: '20 August 2026', it: '20 agosto 2026' });
    expect(POLICYWATCHER_RELEASE_MONTH_LABEL).toEqual({ en: 'August 2026', it: 'agosto 2026' });
    expect(POLICYWATCHER_RELEASE_CHANNEL).toBe('beta');
    expect(POLICYWATCHER_RELEASE_CHANNEL_LABEL).toBe('BETA');
    expect(POLICYWATCHER_RELEASE_BADGE).toBe('v4.0.0-beta.2 · BETA');
    expect(POLICYWATCHER_BROWSER_EXTENSION_VERSION).toBe('3.8.3-beta.3');
    expect(POLICYWATCHER_BROWSER_EXTENSION_DISPLAY_VERSION).toBe('3.8.3 Beta 3');
    expect(POLICYWATCHER_BROWSER_EXTENSION_RELEASE_BADGE).toBe('v3.8.3 Beta 3 · EXTENSION BETA');
    expect(POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATE).toBe('chrome-edge-store-published');
    expect(POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS.en).toBe(
      'Chrome Web Store and Microsoft Edge Add-ons published · Safari not yet available',
    );

    const typedChannel: PolicyWatcherReleaseChannel = POLICYWATCHER_RELEASE_CHANNEL;
    expect(typedChannel).toBe('beta');
  });

  it('keeps current release surfaces connected to centralized metadata', () => {
    for (const file of releaseSurfaces) {
      expect(readFileSync(file, 'utf8'), file).toMatch(/POLICYWATCHER_(VERSION|BUILD_LABEL)/);
    }
  });

  it('keeps literal em dash characters out of tracked source and documentation', () => {
    const prohibitedCharacter = String.fromCodePoint(0x2014);
    const result = spawnSync(
      'git',
      [
        'grep',
        '-n',
        prohibitedCharacter,
        '--',
        '*.ts',
        '*.tsx',
        '*.js',
        '*.mjs',
        '*.cjs',
        '*.json',
        '*.md',
        '*.html',
        '*.css',
        '*.scss',
        '*.yml',
        '*.yaml',
      ],
      { encoding: 'utf8' },
    );

    expect(result.status, result.stdout || result.stderr).toBe(1);
  }, 15_000);
});
