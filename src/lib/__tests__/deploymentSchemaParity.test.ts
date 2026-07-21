import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Hostinger runtime schema parity', () => {
  const prismaSchema = readFileSync('prisma/schema.prisma', 'utf8');
  const nodeFallback = readFileSync('scripts/hostinger-init-db.mjs', 'utf8');
  const pythonFallback = readFileSync('scripts/hostinger-init-db.py', 'utf8');
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const hostingerBridge = readFileSync('server.js', 'utf8');

  const modelNames = [...prismaSchema.matchAll(/^model\s+(\w+)\s+\{/gm)].map((match) => match[1]);

  it('creates every Prisma model in both CLI-free fallback initializers', () => {
    expect(modelNames.length).toBeGreaterThan(0);
    for (const model of modelNames) {
      const createTable = `CREATE TABLE IF NOT EXISTS "${model}"`;
      expect(nodeFallback, `Node fallback is missing ${model}`).toContain(createTable);
      expect(pythonFallback, `Python fallback is missing ${model}`).toContain(createTable);
    }
  });

  it('runs the idempotent schema initializer for npm and direct Hostinger starts', () => {
    expect(packageJson.scripts?.prestart).toContain('bash scripts/hostinger-init-db.sh');
    expect(hostingerBridge).toContain("['scripts/hostinger-init-db.sh']");
    expect(hostingerBridge).toContain('schemaCheck.status !== 0');
  });

  it('reconciles materialized fallback tables before Prisma deploy runs', () => {
    const initShell = readFileSync('scripts/hostinger-init-db.sh', 'utf8');
    const detector = readFileSync('scripts/hostinger-detect-materialized-migrations.mjs', 'utf8');
    expect(initShell).toContain('hostinger-detect-materialized-migrations.mjs');
    expect(initShell).toContain('migrate resolve --applied');
    expect(detector).toContain('20260721120000_policy_discovery_job');
    expect(detector).toContain("['PolicyDiscoveryJob']");
    expect(detector).toContain('20260721150000_policy_inquiry');
    expect(detector).toContain("['PolicyInquiry']");
    expect(pythonFallback).toContain('20260721150000_policy_inquiry');
    expect(pythonFallback).toContain('{"PolicyInquiry"}');
    for (const model of modelNames.filter((model) => ![
      'PolicyDiscoveryCandidate',
      'SourceOnboardingBatch',
      'SourceOnboardingItem',
      'PolicyDiscoveryJob',
      'PolicyInquiry',
    ].includes(model))) {
      expect(detector, `Migration detector is missing base model ${model}`).toContain(`'${model}'`);
    }
    expect(pythonFallback).toContain('--detect-materialized-migrations');
  });

  it('keeps the policy inquiry migration and fallback indexes aligned', () => {
    const migration = readFileSync(
      'prisma/migrations/20260721150000_policy_inquiry/migration.sql',
      'utf8',
    );
    const requiredIndexes = [
      'PolicyInquiry_publicToken_key',
      'PolicyInquiry_status_createdAt_idx',
      'PolicyInquiry_dedupeKey_idx',
      'PolicyInquiry_matchedCompanyId_idx',
    ];

    expect(migration).toContain('CREATE TABLE "PolicyInquiry"');
    for (const index of requiredIndexes) {
      expect(migration, `Migration is missing ${index}`).toContain(index);
      expect(nodeFallback, `Node fallback is missing ${index}`).toContain(index);
      expect(pythonFallback, `Python fallback is missing ${index}`).toContain(index);
    }
  });
});
