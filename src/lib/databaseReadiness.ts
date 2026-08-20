import { db } from './db';
import { getDatabaseDiagnostics, type DatabaseDiagnostics } from './databaseConfig';
import type { DatabaseProvider } from './databaseUrl';

export const EXPECTED_DATABASE_TABLES = [
  'Entity',
  'Document',
  'Version',
  'Change',
  'Provision',
  'Company',
  'PolicyDiscoveryJob',
  'PolicyInquiry',
  'PolicyDiscoveryCandidate',
  'Policy',
  'PolicyCheckLog',
  'ScanRun',
  'SourceRetrieval',
  'SourceRemediationIssue',
  'HistoricalSourceReference',
  'PolicySnapshot',
  'PolicyChange',
  'WebhookDelivery',
  'WebhookDeliveryAttempt',
  'DatasetQaIssueReview',
  'AdminReviewLog',
  'SourceOnboardingBatch',
  'SourceOnboardingItem',
  'AdminAccessLog',
  'InvestorAccessGrant',
  'InvestorAccessEvent',
  'PressMetricEvent',
  'AdminDashboardMetricEvent',
  'AiModelInvocation',
  'RegionImpact',
  'Subscriber',
] as const;

export const EXPECTED_SQLITE_MIGRATIONS = [
  '20260706213500_init',
  '20260719070000_policy_discovery',
  '20260721090000_source_onboarding',
  '20260721120000_policy_discovery_job',
  '20260721150000_policy_inquiry',
  '20260727110000_press_metric_events',
  '20260729153000_public_change_publication_time',
  '20260730043000_source_reliability',
  '20260730162000_webhook_delivery_pilot',
  '20260801090000_admin_dashboard_telemetry',
  '20260814070000_ai_model_telemetry',
  '20260817090000_source_integrity_control',
  '20260819120000_investor_magic_links',
  '20260820100000_document_evidence_model',
] as const;

export const EXPECTED_POSTGRESQL_MIGRATIONS = [
  '00000000000000_postgresql_baseline',
] as const;

// Backward-compatible name for the production SQLite migration contract.
export const EXPECTED_DATABASE_MIGRATIONS = EXPECTED_SQLITE_MIGRATIONS;

export type DatabaseReadinessStatus = 'ready' | 'degraded' | 'unavailable';

export const ENVIRONMENT_READINESS_VARIABLES = [
  'GEMINI_API_KEY',
  'API_SECRET',
  'SESSION_HMAC_SECRET',
  'DATABASE_URL',
  'SMTP_HOST',
  'ADMIN_USER',
] as const;

export type EnvironmentReadinessVariable = (typeof ENVIRONMENT_READINESS_VARIABLES)[number];

export interface EnvironmentReadinessReport {
  configuredCount: number;
  expectedCount: number;
  variables: Array<{
    name: EnvironmentReadinessVariable;
    status: 'SET' | 'NOT SET';
  }>;
  boundary: string;
}

interface DatabaseNameRow { name: string }
interface DatabaseValueRow { [key: string]: unknown }
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
  environment: EnvironmentReadinessReport;
  diagnosticCode: string | null;
}

export function buildEnvironmentReadiness(
  environment: NodeJS.ProcessEnv = process.env,
): EnvironmentReadinessReport {
  const variables = ENVIRONMENT_READINESS_VARIABLES.map((name) => ({
    name,
    status: environment[name] ? 'SET' as const : 'NOT SET' as const,
  }));

  return {
    configuredCount: variables.filter((variable) => variable.status === 'SET').length,
    expectedCount: ENVIRONMENT_READINESS_VARIABLES.length,
    variables,
    boundary: 'Configuration presence only. It does not verify secret validity, service reachability, production health or operational readiness.',
  };
}

function firstValue(rows: DatabaseValueRow[]): unknown {
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
  const code = typeof candidate?.code === 'string' ? candidate.code.toUpperCase() : '';
  if (/^P\d{4}$/.test(code)) return code;
  if (code === '40001') return 'POSTGRES_SERIALIZATION_FAILURE';
  if (code === '40P01') return 'POSTGRES_DEADLOCK';
  if (code === '53300') return 'POSTGRES_CONNECTION_LIMIT';
  if (code === '42P01') return 'SCHEMA_MISSING';
  if (code === 'ECONNREFUSED') return 'DATABASE_UNREACHABLE';
  const detail = String(candidate?.message || error || '').toLowerCase();
  if (detail.includes('database is locked') || detail.includes('sqlite_busy')) return 'SQLITE_BUSY';
  if (detail.includes('readonly') || detail.includes('read-only')) return 'SQLITE_READONLY';
  if (detail.includes('malformed')) return 'SQLITE_CORRUPT';
  if (detail.includes('unable to open')) return 'SQLITE_CANTOPEN';
  if (detail.includes('serialization failure') || detail.includes('could not serialize')) return 'POSTGRES_SERIALIZATION_FAILURE';
  if (detail.includes('deadlock detected')) return 'POSTGRES_DEADLOCK';
  if (detail.includes('too many connections')) return 'POSTGRES_CONNECTION_LIMIT';
  if (detail.includes('connection refused') || detail.includes('connection terminated')) return 'DATABASE_UNREACHABLE';
  if (detail.includes('no such table') || detail.includes('does not exist')) return 'SCHEMA_MISSING';
  return 'DATABASE_QUERY_FAILED';
}

function expectedMigrations(provider: DatabaseProvider): readonly string[] {
  return provider === 'postgresql'
    ? EXPECTED_POSTGRESQL_MIGRATIONS
    : EXPECTED_SQLITE_MIGRATIONS;
}

function unavailableReport(
  diagnostics: DatabaseDiagnostics,
  diagnosticCode: string,
): DatabaseReadinessReport {
  const migrations = expectedMigrations(diagnostics.provider);
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
      expectedMigrationCount: migrations.length,
      appliedMigrationCount: 0,
      missingMigrations: [...migrations],
      migrationLedgerAvailable: false,
      lastAppliedMigration: null,
      lastAppliedAt: null,
    },
    environment: buildEnvironmentReadiness(),
    diagnosticCode,
  };
}

export async function getDatabaseReadinessReport(): Promise<DatabaseReadinessReport> {
  const diagnostics = await getDatabaseDiagnostics();
  if (diagnostics.provider === 'unknown') {
    return unavailableReport(diagnostics, 'UNSUPPORTED_DATABASE_PROVIDER');
  }
  if (
    diagnostics.provider === 'sqlite'
    && (!diagnostics.filePath || !diagnostics.fileExists || !diagnostics.fileReadable)
  ) {
    return unavailableReport(diagnostics, diagnostics.fileExists ? 'SQLITE_NOT_READABLE' : 'SQLITE_FILE_MISSING');
  }

  try {
    const provider = diagnostics.provider;
    const [tableRows, quickRows, journalRows, foreignKeyRows, pageRows, freePageRows, sizeRows] = provider === 'postgresql'
      ? await Promise.all([
        db.$queryRawUnsafe<DatabaseNameRow[]>(
          `SELECT table_name AS "name"
           FROM information_schema.tables
           WHERE table_schema = current_schema()
           ORDER BY table_name`,
        ),
        Promise.resolve([{ value: 'ok' }] as DatabaseValueRow[]),
        Promise.resolve([{ value: 'postgresql' }] as DatabaseValueRow[]),
        Promise.resolve([{ value: 1 }] as DatabaseValueRow[]),
        Promise.resolve([{ value: null }] as DatabaseValueRow[]),
        Promise.resolve([{ value: null }] as DatabaseValueRow[]),
        db.$queryRawUnsafe<DatabaseValueRow[]>('SELECT pg_database_size(current_database()) AS "value"'),
      ])
      : await Promise.all([
        db.$queryRawUnsafe<DatabaseNameRow[]>(
          `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
        ),
        db.$queryRawUnsafe<DatabaseValueRow[]>('PRAGMA quick_check(1)'),
        db.$queryRawUnsafe<DatabaseValueRow[]>('PRAGMA journal_mode'),
        db.$queryRawUnsafe<DatabaseValueRow[]>('PRAGMA foreign_keys'),
        db.$queryRawUnsafe<DatabaseValueRow[]>('PRAGMA page_count'),
        db.$queryRawUnsafe<DatabaseValueRow[]>('PRAGMA freelist_count'),
        Promise.resolve([] as DatabaseValueRow[]),
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
           ORDER BY migration_name ASC`,
        );
      } catch {
        migrationLedgerAvailable = false;
      }
    }

    const appliedMigrationNames = new Set(migrations.map((row) => row.migration_name));
    const providerMigrations = expectedMigrations(provider);
    const missingMigrations = providerMigrations.filter(
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
      || (provider === 'sqlite' && (!diagnostics.fileWritable || !diagnostics.directoryWritable))
    );
    const { url: _url, ...database } = diagnostics;
    void _url;
    if (provider === 'postgresql') {
      database.fileSizeBytes = toNumber(firstValue(sizeRows)) ?? 0;
    }

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
        expectedMigrationCount: providerMigrations.length,
        appliedMigrationCount: migrations.length,
        missingMigrations,
        migrationLedgerAvailable,
        lastAppliedMigration: lastMigration?.migration_name || null,
        lastAppliedAt: toIso(lastMigration?.finished_at || null),
      },
      environment: buildEnvironmentReadiness(),
      diagnosticCode: null,
    };
  } catch (error) {
    return unavailableReport(diagnostics, classifyDatabaseError(error));
  }
}
