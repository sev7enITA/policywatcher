import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';

describe('Hostinger runtime schema parity', () => {
  const prismaSchema = readFileSync('prisma/schema.prisma', 'utf8');
  const nodeFallback = readFileSync('scripts/hostinger-init-db.mjs', 'utf8');
  const pythonFallback = readFileSync('scripts/hostinger-init-db.py', 'utf8');
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const hostingerBridge = readFileSync('server.js', 'utf8');
  const migrationLock = readFileSync('prisma/migrations/migration_lock.toml', 'utf8');

  const modelNames = [...prismaSchema.matchAll(/^model\s+(\w+)\s+\{/gm)].map((match) => match[1]);

  it('creates every Prisma model in both CLI-free fallback initializers', () => {
    expect(modelNames.length).toBeGreaterThan(0);
    for (const model of modelNames) {
      const createTable = `CREATE TABLE IF NOT EXISTS "${model}"`;
      expect(nodeFallback, `Node fallback is missing ${model}`).toContain(createTable);
      expect(pythonFallback, `Python fallback is missing ${model}`).toContain(createTable);
    }
  });

  it('routes npm and direct Hostinger starts through the schema-checking bridge', () => {
    expect(packageJson.scripts?.start).toBe('node server.js');
    expect(packageJson.scripts?.prestart).toBeUndefined();
    expect(packageJson.scripts?.postinstall).toContain('hostinger-postinstall-db.mjs');
    expect(hostingerBridge).toContain("'.builds', 'last-source', 'scripts', 'hostinger-init-db.sh'");
    expect(hostingerBridge).toContain('schemaScriptCandidates.find');
    expect(hostingerBridge).toContain('schemaCheck.status !== 0');
    expect(hostingerBridge).toContain('await cli.nextStart({ port })');
    expect(hostingerBridge).not.toContain("cli.nextStart(['-p'");
    expect(hostingerBridge).toContain('port > 65535');
    expect(migrationLock).toContain('provider = "sqlite"');
  });

  it('keeps admin authentication independent from database metrics', () => {
    const authRoute = readFileSync('src/app/api/admin/auth/route.ts', 'utf8');
    const adminLayout = readFileSync('src/app/admin/layout.tsx', 'utf8');
    const metricsRoute = readFileSync('src/app/api/admin/metrics/route.ts', 'utf8');

    expect(authRoute).toContain('export async function GET(request: NextRequest)');
    expect(authRoute).toContain('getSession(request)');
    expect(authRoute).not.toContain("from '@/lib/db'");
    expect(adminLayout).toContain("fetch('/api/admin/auth'");
    expect(metricsRoute).toContain('metricAvailability');
    expect(metricsRoute).toContain('ensurePressMetricStorage');
  });

  it('runs the database initializer during managed installs when DATABASE_URL is configured', () => {
    const postinstall = readFileSync('scripts/hostinger-postinstall-db.mjs', 'utf8');
    expect(postinstall).toContain('DATABASE_URL is not available during install');
    expect(postinstall).toContain('hostinger-init-db.sh');
    expect(postinstall).toContain("POLICYWATCHER_SKIP_DB_BACKUP: '1'");
    expect(postinstall).not.toMatch(/\bnpx\b/);
  });

  it('reconciles materialized fallback tables before Prisma deploy runs', () => {
    const initShell = readFileSync('scripts/hostinger-init-db.sh', 'utf8');
    const detector = readFileSync('scripts/hostinger-detect-materialized-migrations.mjs', 'utf8');
    expect(initShell).toContain('hostinger-detect-materialized-migrations.mjs');
    expect(initShell).toContain('migrate resolve --applied');
    expect(detector).toContain('migrationIsMaterialized');
    expect(detector).toContain('PRAGMA table_info');
    expect(detector).toContain('PRAGMA foreign_key_list');
    expect(detector).toContain('PRAGMA index_info');
    expect(pythonFallback).toContain('hostinger-detect-materialized-migrations.mjs');
    expect(detector).toContain("fs.readdirSync(migrationsRoot).sort()");
    expect(pythonFallback).toContain('--detect-materialized-migrations');
  });

  it('does not require /dev/fd during Hostinger database initialization', () => {
    const initShell = readFileSync('scripts/hostinger-init-db.sh', 'utf8');
    expect(initShell).not.toContain('< <(');
    expect(initShell).toContain('materialized_migrations="$(node');
    expect(initShell).toContain('done <<< "${materialized_migrations}"');
  });

  it('falls back when Hostinger cannot execute the native Prisma schema engine', () => {
    const initShell = readFileSync('scripts/hostinger-init-db.sh', 'utf8');
    expect(initShell).toContain('repair_prisma_schema_engine_mode');
    expect(initShell).toContain('chmod u+x -- "${engine}"');
    expect(initShell).toContain('if ! run_prisma migrate deploy; then');
    expect(initShell).toContain('run_local_sqlite_initializer');
    expect(initShell).toContain('POLICYWATCHER_FORCE_SQLITE_FALLBACK');
    expect(initShell).not.toMatch(/curl|wget|\bnpx\s+prisma\b/);
  });

  it('fails closed for a partial migration and recognizes a complete fallback schema', () => {
    const directory = mkdtempSync(join(tmpdir(), 'policywatcher-schema-detector-'));
    try {
      const partialPath = join(directory, 'partial.db');
      const partial = new DatabaseSync(partialPath);
      partial.exec('CREATE TABLE "PolicyInquiry" ("id" TEXT NOT NULL PRIMARY KEY)');
      partial.close();
      const partialResult = spawnSync('node', ['scripts/hostinger-detect-materialized-migrations.mjs'], {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: `file:${partialPath}`, NODE_NO_WARNINGS: '1' },
        encoding: 'utf8',
      });
      expect(partialResult.status).toBe(0);
      expect(partialResult.stdout).not.toContain('20260721150000_policy_inquiry');

      const completePath = join(directory, 'complete.db');
      const initialized = spawnSync('node', ['scripts/hostinger-init-db.mjs'], {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: `file:${completePath}`, NODE_NO_WARNINGS: '1' },
        encoding: 'utf8',
      });
      expect(initialized.status, initialized.stderr).toBe(0);
      const completeResult = spawnSync('node', ['scripts/hostinger-detect-materialized-migrations.mjs'], {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: `file:${completePath}`, NODE_NO_WARNINGS: '1' },
        encoding: 'utf8',
      });
      expect(completeResult.status).toBe(0);
      expect(completeResult.stdout).toContain('20260706213500_init');
      expect(completeResult.stdout).toContain('20260721150000_policy_inquiry');
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('never downloads a mutable Prisma CLI during production startup', () => {
    const initShell = readFileSync('scripts/hostinger-init-db.sh', 'utf8');
    expect(initShell).toContain('LOCAL_PRISMA');
    expect(initShell).not.toMatch(/\bnpx\s+prisma\b/);
    expect(initShell).not.toMatch(/npm\s+exec\s+--\s+prisma/);
    expect(initShell).toContain('Refusing to download or execute an unpinned CLI');
  });

  it('keeps the policy inquiry migration and fallback indexes aligned', () => {
    const migration = readFileSync(
      'prisma/migrations/20260721150000_policy_inquiry/migration.sql',
      'utf8',
    );
    const requiredIndexes = [
      'PolicyInquiry_publicToken_key',
      'PolicyInquiry_activeDedupeKey_key',
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

  it('never materializes notification content or content-derived fingerprints', () => {
    const migration = readFileSync(
      'prisma/migrations/20260721150000_policy_inquiry/migration.sql',
      'utf8',
    );
    const inquiryModel = prismaSchema.match(/model PolicyInquiry \{[\s\S]*?\n\}/)?.[0] || '';
    const forbiddenColumns = ['fingerprint', 'noticeSubject', 'redactedExcerpt'];

    for (const column of forbiddenColumns) {
      expect(inquiryModel).not.toContain(column);
      expect(migration).not.toContain(`"${column}"`);
      expect(nodeFallback).not.toContain(`"${column}"`);
      expect(pythonFallback).not.toContain(`"${column}"`);
    }
  });
});
