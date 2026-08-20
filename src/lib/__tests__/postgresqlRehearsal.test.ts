import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { backup, DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import {
  REHEARSAL_ACK,
  SENSITIVE_DATA_ACK,
  assertRehearsalSafety,
  digestModelRows,
  orderModelsByDependencies,
  parsePostgresqlTarget,
  parsePrismaModels,
} from '../../../scripts/postgresql-rehearsal-lib.mjs';

describe('SQLite to PostgreSQL rehearsal contract', () => {
  it('accepts only explicitly isolated PostgreSQL database names', () => {
    expect(parsePostgresqlTarget('postgresql://user:secret@db.example/policywatcher_ci?schema=public'))
      .toMatchObject({ databaseName: 'policywatcher_ci', schema: 'public' });
    expect(() => parsePostgresqlTarget('postgresql://db.example/policywatcher_production?schema=public'))
      .toThrow('REHEARSAL_TARGET_NAME_MUST_SIGNAL_ISOLATION');
    expect(() => parsePostgresqlTarget('mysql://db.example/policywatcher_test'))
      .toThrow('REHEARSAL_TARGET_MUST_BE_POSTGRESQL');
  });

  it('requires separate acknowledgments for target writes and sensitive data', () => {
    const input = {
      targetUrl: 'postgresql://pool.example/policywatcher_rehearsal?schema=public',
      directUrl: 'postgresql://direct.example/policywatcher_rehearsal?schema=public',
    };
    expect(() => assertRehearsalSafety({ ...input })).toThrow('REHEARSAL_ACK_REQUIRED');
    expect(() => assertRehearsalSafety({
      ...input,
      acknowledgment: REHEARSAL_ACK,
      includeSensitive: true,
    })).toThrow('REHEARSAL_SENSITIVE_DATA_ACK_REQUIRED');
    expect(assertRehearsalSafety({
      ...input,
      acknowledgment: REHEARSAL_ACK,
      includeSensitive: true,
      sensitiveAcknowledgment: SENSITIVE_DATA_ACK,
    }).target.databaseName).toBe('policywatcher_rehearsal');
  });

  it('derives a complete dependency-safe import order from the canonical schema', () => {
    const models = orderModelsByDependencies(
      parsePrismaModels(readFileSync('prisma/schema.prisma', 'utf8')),
    );
    const names = models.map((model) => model.name);
    expect(names).toHaveLength(31);
    expect(names.indexOf('Entity')).toBeLessThan(names.indexOf('Document'));
    expect(names.indexOf('Document')).toBeLessThan(names.indexOf('Version'));
    expect(names.indexOf('Version')).toBeLessThan(names.indexOf('Change'));
    expect(names.indexOf('Change')).toBeLessThan(names.indexOf('Provision'));
    expect(names.indexOf('Company')).toBeLessThan(names.indexOf('Policy'));
    expect(names.indexOf('ScanRun')).toBeLessThan(names.indexOf('SourceRetrieval'));
    expect(names.indexOf('SourceRetrieval')).toBeLessThan(names.indexOf('PolicyCheckLog'));
    expect(names.indexOf('PolicySnapshot')).toBeLessThan(names.indexOf('PolicyChange'));
    expect(names.indexOf('InvestorAccessGrant')).toBeLessThan(names.indexOf('InvestorAccessEvent'));
  });

  it('produces identical reconciliation digests across SQLite and Prisma value representations', () => {
    const model = {
      name: 'Example',
      idFields: ['id'],
      fields: [
        { name: 'id', type: 'String', optional: false, id: true },
        { name: 'enabled', type: 'Boolean', optional: false, id: false },
        { name: 'createdAt', type: 'DateTime', optional: false, id: false },
      ],
    };
    const timestamp = Date.parse('2026-08-19T12:00:00.000Z');
    expect(digestModelRows(model, [{ id: 'one', enabled: 1, createdAt: timestamp }]))
      .toBe(digestModelRows(model, [{ id: 'one', enabled: true, createdAt: new Date(timestamp) }]));
  });

  it('keeps plan mode read-only and free of connection credentials', () => {
    const directory = mkdtempSync(join(tmpdir(), 'policywatcher-rehearsal-plan-'));
    const source = join(directory, 'copy.db');
    writeFileSync(source, 'plan-only');
    try {
      const result = spawnSync('node', [
        'scripts/postgresql-rehearsal.mjs', '--plan', '--source', source,
      ], {
        cwd: process.cwd(),
        encoding: 'utf8',
        env: {
          ...process.env,
          REHEARSAL_DATABASE_URL: 'postgresql://user:secret@db.example/policywatcher_test?schema=public',
        },
      });
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain('"writesPerformed": false');
      expect(result.stdout).not.toContain('secret');
      expect(result.stdout).not.toContain(directory);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('creates a consistent copy from a read-only SQLite connection', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'policywatcher-rehearsal-copy-'));
    const sourcePath = join(directory, 'source.db');
    const copyPath = join(directory, 'copy.db');
    const source = new DatabaseSync(sourcePath);
    source.exec('CREATE TABLE evidence (id TEXT PRIMARY KEY, value TEXT NOT NULL); INSERT INTO evidence VALUES (\'one\', \'original\');');
    source.close();

    try {
      const readOnlySource = new DatabaseSync(sourcePath, { readOnly: true });
      readOnlySource.exec('PRAGMA query_only = ON');
      await backup(readOnlySource, copyPath);
      readOnlySource.close();

      const copy = new DatabaseSync(copyPath, { readOnly: true });
      expect(copy.prepare('SELECT id, value FROM evidence').get()).toEqual({ id: 'one', value: 'original' });
      copy.close();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('runs backup, sanitization, target-empty preflight, reconciliation and smoke in CI', () => {
    const orchestrator = readFileSync('scripts/postgresql-rehearsal.mjs', 'utf8');
    const sanitizer = readFileSync('scripts/create-staging-database.mjs', 'utf8');
    const workflow = readFileSync('.github/workflows/quality.yml', 'utf8');
    expect(orchestrator).toContain('new DatabaseSync(sourcePath, { readOnly: true })');
    expect(orchestrator).toContain('await backup(sourceDatabase, consistentCopyPath)');
    expect(orchestrator).toContain('postgresql-rehearsal-target-preflight.mjs');
    expect(orchestrator).toContain('postgresql-rehearsal-worker.mjs');
    expect(orchestrator).toContain('postgresql-contract-smoke.mjs');
    expect(sanitizer).toContain("'InvestorAccessGrant'");
    expect(sanitizer).toContain("'Subscriber'");
    expect(workflow).toContain('Rehearse SQLite-to-PostgreSQL import and reconciliation');
    const rehearsal = workflow.indexOf('Rehearse SQLite-to-PostgreSQL import and reconciliation');
    const regenerate = workflow.indexOf('Regenerate PostgreSQL client after the rehearsal restores SQLite');
    const dualWriteSmoke = workflow.indexOf('Verify canonical dual-write on PostgreSQL');
    expect(rehearsal).toBeGreaterThanOrEqual(0);
    expect(regenerate).toBeGreaterThan(rehearsal);
    expect(dualWriteSmoke).toBeGreaterThan(regenerate);
  });
});
