import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

interface Correction {
  provider: string;
  policy: string;
  jurisdiction: string;
  canonicalUrl: string;
  retrievalUrl: string | null;
}

describe('17 August source integrity catalog', () => {
  const catalog = JSON.parse(
    readFileSync('data/source-integrity/catalog-corrections-2026-08-17.json', 'utf8')
  ) as { corrections: Correction[] };

  it('keeps every correction aligned with seed and Hostinger inventory assets', () => {
    const seed = readFileSync('prisma/seed.ts', 'utf8');
    const hostingerInventory = readFileSync('scripts/hostinger-seed-inventory.mjs', 'utf8');

    for (const correction of catalog.corrections) {
      expect(seed, `${correction.provider} ${correction.jurisdiction} canonical`).toContain(correction.canonicalUrl);
      expect(hostingerInventory, `${correction.provider} ${correction.jurisdiction} canonical`).toContain(correction.canonicalUrl);
      if (correction.retrievalUrl) {
        expect(seed, `${correction.provider} ${correction.jurisdiction} retrieval`).toContain(correction.retrievalUrl);
        expect(hostingerInventory, `${correction.provider} ${correction.jurisdiction} retrieval`).toContain(correction.retrievalUrl);
      }
    }
  });

  it('does not retain the Wise index or retired TikTok route in current inventory assets', () => {
    const seed = readFileSync('prisma/seed.ts', 'utf8');
    const hostingerInventory = readFileSync('scripts/hostinger-seed-inventory.mjs', 'utf8');
    for (const source of [seed, hostingerInventory]) {
      expect(source).not.toContain("url: 'https://wise.com/us/legal/privacy-policy'");
      expect(source).not.toContain("url: 'https://www.tiktok.com/legal/page/global/community-guidelines'");
    }
  });

  it('closes remediation rows for acquisition keys superseded by a controlled migration', () => {
    const remediation = readFileSync('scripts/hostinger-remediate-sources.mjs', 'utf8');
    const initializer = readFileSync('scripts/hostinger-init-db.sh', 'utf8');
    const packager = readFileSync('scripts/package-release.sh', 'utf8');

    expect(remediation).toContain("status = 'Resolved'");
    expect(remediation).toContain('Superseded by controlled source migration');
    expect(remediation).toContain('resolvePreviousSourceIssue.run');
    expect(initializer).toContain('hostinger-normalize-sqlite-datetimes.mjs');
    expect(packager).toContain('scripts/hostinger-normalize-sqlite-datetimes.mjs');
  });
});
