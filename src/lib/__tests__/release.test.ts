import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { POLICYWATCHER_BUILD_LABEL, POLICYWATCHER_RELEASE_NAME, POLICYWATCHER_VERSION } from '../release';

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
    expect(POLICYWATCHER_RELEASE_NAME).toBe('Mobile Inquiry Reliability Release');
    expect(POLICYWATCHER_BUILD_LABEL).toBe('v3.8.1 Mobile Inquiry Reliability Release');
  });

  it('keeps current release surfaces connected to centralized metadata', () => {
    for (const file of releaseSurfaces) {
      expect(readFileSync(file, 'utf8'), file).toMatch(/POLICYWATCHER_(VERSION|BUILD_LABEL)/);
    }
  });
});
