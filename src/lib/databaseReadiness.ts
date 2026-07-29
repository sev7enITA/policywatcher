import { db } from './db';
import { getDatabaseDiagnostics, type DatabaseDiagnostics } from './databaseConfig';

export const EXPECTED_DATABASE_TABLES = [
  'Company',
  'PolicyDiscoveryJob',
  'PolicyInquiry',
  'PolicyDiscoveryCandidate',
  'Policy',
  'PolicyCheckLog',
  'PolicySnapshot',
  'PolicyChange',
  'DatasetQaIssueReview',
  'AdminReviewLog',
  'SourceOnboardingBatch',
  'SourceOnboardingItem',
  'AdminAccessLog',
  'PressMetricEvent',
  'RegionImpact',
  'Subscriber',
] as const;

export const EXPECTED_DATABASE_MIGRATIONS = [
  '20260706213500_init',
  '20260719070000_policy_discovery',
  '20260721090000_source_onboarding',
  '20260721120000_policy_discovery_job',
  '20260721150000_policy_inquiry',
  '20260727110000_press_metric_events',
] as const;

export type DatabaseReadinessStatus = 'ready' | 'degraded' | 'unavailable';

interface SqliteNameRow { name: string }
interface SqliteValueRow { [key: string]: unknown }
interface MigrationRow {
  migration_name: string;
  finished_at: Date | string | null;
  rolled_back_at: Date | string | null;
}

export interface DatabaseReadinessReport {
  status: DatabaseReadinessStatus;
  checkedAt: string;
  database: Omit<DatabaseDiagnostics, 'url'>;
  integrity: {
    quickCheck: string;
    journalMode: string;
    foreignKeysEnabled: boolean;
    pageCount: number | null;
    freePageCount: number | null;
  };
  schema: {
    expectedTableCount: number;
    presentTableCount: number;
    missingTables: string[];
    expectedMigrationCount: number;
    appliedMigrationCount: number;
    missingMigrations: string[];
    migrationLedgerAvailable: boolean;
    lastAppliedMigration: string | null;
    lastAppliedAt: string | null;
  };
  diagnosticCode: string | null;
}

function firstValue(rows: SqliteValueRow[]): unknown {
  const row = rows[0];
  return row ? Object.values(row)[0] : undefined;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function toIso(value: Date | string | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function classifyDatabaseError(error: unknown): string {
  const candidate = error as { code?: unknown; message?: unknown } | null;
  if (typeof candidate?.code === 'string' && /^P\d{4}$/.test(candidate.code)) return candidate.code;
  const detail = String(candidate?.message || error || '').toLowerCase();
  if (detail.includes('database is locked') || detail.includes('sqlite_busy')) return 'SQLITE_BUSY';
  if (detail.includes('readonly') || detail.includes('read-only')) return 'SQLITE_READONLY';
  if (detail.includes('malformed')) return 'SQLITE_CORRUPT';
  if (detail.includes('unable to open')) return 'SQLITE_CANTOPEN';
  if (detail.includes('no such table') || detail.includes('does not exist')) return 'SCHEMA_MISSING';
  return 'DATABASE_QUERY_FAILED';
}

function unavailableReport(
  diagnostics: DatabaseDiagnostics,
  diagnosticCode: string,
): DatabaseReadinessReport {
  const { url: _url, ...database } = diagnostics;
  void _url;
  return {
    status: 'unavailable',
    checkedAt: new Date().toISOString(),
    database,
    integrity: {
      quickCheck: 'not-run',
      journalMode: 'unknown',
      foreignKeysEnabled: false,
      pageCount: null,
      freePageCount: null,
    },
    schema: {
      expectedTableCount: EXPECTED_DATABASE_TABLES.length,
      presentTableCount: 0,
      missingTables: [...EXPECTED_DATABASE_TABLES],
      expectedMigrationCount: EXPECTED_DATABASE_MIGRATIONS.length,
      appliedMigrationCount: 0,
      missingMigrations: [...EXPECTED_DATABASE_MIGRATIONS],
      migrationLedgerAvailable: false,
      lastAppliedMigration: null,
      lastAppliedAt: null,
    },
    diagnosticCode,
  };
}

export async function getDatabaseReadinessReport(): Promise<DatabaseReadinessReport> {
  const diagnostics = await getDatabaseDiagnostics();
  if (!diagnostics.filePath || !diagnostics.fileExists || !diagnostics.fileReadable) {
    return unavailableReport(diagnostics, diagnostics.fileExists ? 'SQLITE_NOT_READABLE' : 'SQLITE_FILE_MISSING');
  }

  try {
    const [tableRows, quickRows, journalRows, foreignKeyRows, pageRows, freePageRows] = await Promise.all([
      db.$queryRawUnsafe<SqliteNameRow[]>(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
      ),
      db.$queryRawUnsafe<SqliteValueRow[]>('PRAGMA quick_check(1)'),
      db.$queryRawUnsafe<SqliteValueRow[]>('PRAGMA journal_mode'),
      db.$queryRawUnsafe<SqliteValueRow[]>('PRAGMA foreign_keys'),
      db.$queryRawUnsafe<SqliteValueRow[]>('PRAGMA page_count'),
      db.$queryRawUnsafe<SqliteValueRow[]>('PRAGMA freelist_count'),
    ]);

    const presentTables = new Set(tableRows.map((row) => row.name));
    const missingTables = EXPECTED_DATABASE_TABLES.filter((table) => !presentTables.has(table));

    let migrationLedgerAvailable = presentTables.has('_prisma_migrations');
    let migrations: MigrationRow[] = [];
    if (migrationLedgerAvailable) {
      try {
        migrations = await db.$queryRawUnsafe<MigrationRow[]>(
          `SELECT migration_name, finished_at, rolled_back_at
           FROM "_prisma_migrations"
           WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
           ORDER BY finished_at ASC`,
        );
      } catch {
        migrationLedgerAvailable = false;
      }
    }

    const appliedMigrationNames = new Set(migrations.map((row) => row.migration_name));
    const missingMigrations = EXPECTED_DATABASE_MIGRATIONS.filter(
      (migration) => !appliedMigrationNames.has(migration),
    );
    const lastMigration = migrations.at(-1) || null;
    const quickCheck = String(firstValue(quickRows) ?? 'unknown');
    const journalMode = String(firstValue(journalRows) ?? 'unknown');
    const foreignKeysEnabled = toNumber(firstValue(foreignKeyRows)) === 1;

    const degraded = (
      quickCheck.toLowerCase() !== 'ok'
      || missingTables.length > 0
      || !migrationLedgerAvailable
      || missingMigrations.length > 0
      || !foreignKeysEnabled
      || !diagnostics.fileWritable
      || !diagnostics.directoryWritable
    );
    const { url: _url, ...database } = diagnostics;
    void _url;

    return {
      status: degraded ? 'degraded' : 'ready',
      checkedAt: new Date().toISOString(),
      database,
      integrity: {
        quickCheck,
        journalMode,
        foreignKeysEnabled,
        pageCount: toNumber(firstValue(pageRows)),
        freePageCount: toNumber(firstValue(freePageRows)),
      },
      schema: {
        expectedTableCount: EXPECTED_DATABASE_TABLES.length,
        presentTableCount: EXPECTED_DATABASE_TABLES.length - missingTables.length,
        missingTables,
        expectedMigrationCount: EXPECTED_DATABASE_MIGRATIONS.length,
        appliedMigrationCount: migrations.length,
        missingMigrations,
        migrationLedgerAvailable,
        lastAppliedMigration: lastMigration?.migration_name || null,
        lastAppliedAt: toIso(lastMigration?.finished_at || null),
      },
      diagnosticCode: null,
    };
  } catch (error) {
    return unavailableReport(diagnostics, classifyDatabaseError(error));
  }
}
