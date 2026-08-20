import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DATABASE_PROVIDERS = ['sqlite', 'postgresql'];
export const SQLITE_SCHEMA_PATH = 'prisma/schema.prisma';
export const POSTGRESQL_SCHEMA_PATH = 'prisma/postgresql/schema.prisma';

export function normalizeDatabaseUrl(value) {
  if (typeof value !== 'string') return '';
  let normalized = value.trim();
  if (normalized.startsWith('DATABASE_URL=')) {
    normalized = normalized.slice('DATABASE_URL='.length).trim();
  }
  if (
    normalized.length >= 2
    && ((normalized.startsWith('"') && normalized.endsWith('"'))
      || (normalized.startsWith("'") && normalized.endsWith("'")))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }
  return normalized;
}

export function detectDatabaseProvider(value) {
  const normalized = normalizeDatabaseUrl(value).toLowerCase();
  if (normalized.startsWith('file:')) return 'sqlite';
  if (normalized.startsWith('postgresql://') || normalized.startsWith('postgres://')) return 'postgresql';
  return 'unknown';
}

export function renderPostgresqlSchema(source) {
  const datasourcePattern = /(datasource\s+db\s*\{[\s\S]*?provider\s*=\s*)"sqlite"/;
  if (!datasourcePattern.test(source)) {
    throw new Error('The canonical Prisma schema does not contain the expected SQLite datasource.');
  }
  return source.replace(datasourcePattern, '$1"postgresql"');
}

export function materializePostgresqlSchema({
  root = process.cwd(),
  sourcePath = SQLITE_SCHEMA_PATH,
  targetPath = POSTGRESQL_SCHEMA_PATH,
} = {}) {
  const absoluteSource = path.resolve(root, sourcePath);
  const absoluteTarget = path.resolve(root, targetPath);
  const rendered = renderPostgresqlSchema(fs.readFileSync(absoluteSource, 'utf8'));
  fs.mkdirSync(path.dirname(absoluteTarget), { recursive: true });
  fs.writeFileSync(absoluteTarget, rendered);
  return absoluteTarget;
}

function runCli() {
  const command = process.argv[2];
  if (command !== 'materialize-postgresql') {
    console.error('Usage: node scripts/database-provider.mjs materialize-postgresql');
    process.exit(1);
  }
  materializePostgresqlSchema();
  console.log('PostgreSQL Prisma schema materialized from the canonical data model.');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runCli();
}
