import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';

const mocks = vi.hoisted(() => ({
  diagnostics: vi.fn(),
  queryRawUnsafe: vi.fn(),
}));

vi.mock('@/lib/databaseConfig', () => ({
  getDatabaseDiagnostics: mocks.diagnostics,
}));
vi.mock('@/lib/db', () => ({
  db: { $queryRawUnsafe: mocks.queryRawUnsafe },
}));

import {
  classifyDatabaseError,
  EXPECTED_DATABASE_MIGRATIONS,
  EXPECTED_DATABASE_TABLES,
  getDatabaseReadinessReport,
} from '@/lib/databaseReadiness';

const healthyDiagnostics = {
  configured: true,
  url: 'file:/tmp/policywatcher.db',
  filePath: '/tmp/policywatcher.db',
  directoryPath: '/tmp',
  directoryExists: true,
  directoryWritable: true,
  fileExists: true,
  fileReadable: true,
  fileWritable: true,
  fileSizeBytes: 11_284_480,
};

describe('database readiness report', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.diagnostics.mockResolvedValue(healthyDiagnostics);
  });

  it('keeps the runtime contract aligned with Prisma models and migration directories', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf8');
    const models = [...schema.matchAll(/^model\s+(\w+)\s+\{/gm)].map((match) => match[1]).sort();
    const migrations = readdirSync('prisma/migrations', { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    expect([...EXPECTED_DATABASE_TABLES].sort()).toEqual(models);
    expect([...EXPECTED_DATABASE_MIGRATIONS].sort()).toEqual(migrations);
  });

  it('reports ready only when integrity, schema, ledger and file access are current', async () => {
    mocks.queryRawUnsafe.mockImplementation(async (sql: string) => {
      if (sql.includes('sqlite_master')) {
        return [...EXPECTED_DATABASE_TABLES, '_prisma_migrations'].map((name) => ({ name }));
      }
      if (sql.includes('quick_check')) return [{ quick_check: 'ok' }];
      if (sql.includes('journal_mode')) return [{ journal_mode: 'wal' }];
      if (sql.includes('foreign_keys')) return [{ foreign_keys: 1n }];
      if (sql.includes('page_count')) return [{ page_count: 3000n }];
      if (sql.includes('freelist_count')) return [{ freelist_count: 12n }];
      if (sql.includes('_prisma_migrations')) {
        return EXPECTED_DATABASE_MIGRATIONS.map((migration_name, index) => ({
          migration_name,
          finished_at: new Date(`2026-07-${String(20 + index).padStart(2, '0')}T10:00:00.000Z`),
          rolled_back_at: null,
        }));
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    });

    const report = await getDatabaseReadinessReport();

    expect(report.status).toBe('ready');
    expect(report.integrity).toMatchObject({
      quickCheck: 'ok',
      journalMode: 'wal',
      foreignKeysEnabled: true,
      pageCount: 3000,
      freePageCount: 12,
    });
    expect(report.schema.missingTables).toEqual([]);
    expect(report.schema.missingMigrations).toEqual([]);
    expect(report.schema.lastAppliedMigration).toBe(EXPECTED_DATABASE_MIGRATIONS.at(-1));
    expect(report.database).not.toHaveProperty('url');
  });

  it('reports an unreadable file without issuing database queries', async () => {
    mocks.diagnostics.mockResolvedValue({
      ...healthyDiagnostics,
      fileReadable: false,
      fileWritable: false,
    });

    const report = await getDatabaseReadinessReport();

    expect(report.status).toBe('unavailable');
    expect(report.diagnosticCode).toBe('SQLITE_NOT_READABLE');
    expect(report.schema.missingTables).toEqual([...EXPECTED_DATABASE_TABLES]);
    expect(mocks.queryRawUnsafe).not.toHaveBeenCalled();
  });

  it('uses bounded diagnostic codes instead of returning raw database errors', () => {
    expect(classifyDatabaseError({ code: 'P2021', message: 'sensitive detail' })).toBe('P2021');
    expect(classifyDatabaseError(new Error('database is locked'))).toBe('SQLITE_BUSY');
    expect(classifyDatabaseError(new Error('database disk image is malformed'))).toBe('SQLITE_CORRUPT');
    expect(classifyDatabaseError(new Error('arbitrary internal statement'))).toBe('DATABASE_QUERY_FAILED');
  });

  it('keeps the protected endpoint and interface read-only', () => {
    const route = readFileSync('src/app/api/admin/database-readiness/route.ts', 'utf8');
    const page = readFileSync('src/app/admin/database/page.tsx', 'utf8');
    expect(route).toContain('getSession(request)');
    expect(route).toContain("'Cache-Control': 'no-store, max-age=0'");
    expect(route).not.toContain('export async function POST');
    expect(page).toContain('Read-only production check');
    expect(page).toContain('Do not reset or replace the production database.');
  });
});
