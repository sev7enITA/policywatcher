import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import {
  detectDatabaseProvider,
  renderPostgresqlSchema,
} from '../../../scripts/database-provider.mjs';

describe('PostgreSQL portability contract', () => {
  const sqliteSchema = readFileSync('prisma/schema.prisma', 'utf8');
  const baseline = readFileSync(
    'prisma/postgresql/migrations/00000000000000_postgresql_baseline/migration.sql',
    'utf8',
  );
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
    scripts?: Record<string, string>;
  };

  it('detects supported database URLs without accepting an ambiguous protocol', () => {
    expect(detectDatabaseProvider('file:./dev.db')).toBe('sqlite');
    expect(detectDatabaseProvider('DATABASE_URL="postgresql://db.example/policywatcher"')).toBe('postgresql');
    expect(detectDatabaseProvider('postgres://db.example/policywatcher')).toBe('postgresql');
    expect(detectDatabaseProvider('mysql://db.example/policywatcher')).toBe('unknown');
  });

  it('derives PostgreSQL from the canonical model without changing model blocks', () => {
    const postgresqlSchema = renderPostgresqlSchema(sqliteSchema);
    const sqliteModels = [...sqliteSchema.matchAll(/^model\s+(\w+)\s+\{/gm)].map((match) => match[1]);
    const postgresqlModels = [...postgresqlSchema.matchAll(/^model\s+(\w+)\s+\{/gm)].map((match) => match[1]);

    expect(postgresqlSchema).toContain('provider = "postgresql"');
    expect(postgresqlSchema).not.toContain('provider = "sqlite"');
    expect(postgresqlModels).toEqual(sqliteModels);
  });

  it('keeps a complete, provider-specific PostgreSQL baseline under version control', () => {
    const models = [...sqliteSchema.matchAll(/^model\s+(\w+)\s+\{/gm)].map((match) => match[1]);
    for (const model of models) {
      expect(baseline, `PostgreSQL baseline is missing ${model}`).toContain(`CREATE TABLE "${model}"`);
    }
    expect(readFileSync('prisma/postgresql/migrations/migration_lock.toml', 'utf8'))
      .toContain('provider = "postgresql"');
    expect(readFileSync('prisma/migrations/migration_lock.toml', 'utf8'))
      .toContain('provider = "sqlite"');
  });

  it('routes generation through the active provider and keeps production cutover fail-closed', () => {
    const managedBuild = readFileSync('scripts/hostinger-managed-build.mjs', 'utf8');
    expect(packageJson.scripts?.build).toBe('node scripts/hostinger-managed-build.mjs');
    expect(managedBuild).toContain("'prisma-active-schema.mjs'), 'generate'");
    expect(packageJson.scripts?.postinstall).toContain('prisma-active-schema.mjs generate');
    expect(packageJson.scripts?.['db:postgresql:migrate']).toContain('prisma-active-schema.mjs migrate-deploy');

    const result = spawnSync('bash', ['scripts/prepare-database.sh'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: 'postgresql://policywatcher:secret@127.0.0.1:5432/policywatcher',
        POLICYWATCHER_POSTGRESQL_CUTOVER_APPROVED: '0',
      },
      encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('PostgreSQL cutover is disabled.');
    expect(result.stdout).not.toContain('secret');
  });

  it('runs migration, drift and relational smoke checks against a PostgreSQL CI service', () => {
    const workflow = readFileSync('.github/workflows/quality.yml', 'utf8');
    expect(workflow).toContain('postgresql-portability:');
    expect(workflow).toContain('image: postgres:16-alpine');
    expect(workflow).toContain('npm run db:postgresql:migrate');
    expect(workflow).toContain('migrate diff --exit-code');
    expect(workflow).toContain('npm run db:postgresql:smoke');
  });
});
