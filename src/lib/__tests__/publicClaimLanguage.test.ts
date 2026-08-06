import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const publicClaimSurfaces = [
  'README.md',
  'CHANGELOG.md',
  'docs/press-outreach-2026-07-27.md',
  'public/press-kit/policywatcher-fact-sheet-2026-07-27.md',
  'src/app/about/page.tsx',
  'src/app/associazioni/page.tsx',
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
});
