#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { backup, DatabaseSync } from 'node:sqlite';
import { createStagingDatabase } from './create-staging-database.mjs';
import {
  REHEARSAL_ACK,
  SENSITIVE_DATA_ACK,
  assertRehearsalSafety,
  parsePostgresqlTarget,
} from './postgresql-rehearsal-lib.mjs';

function argument(argv, name) {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

function sha256File(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function safeDiagnostic(error) {
  if (error instanceof Error && /^[A-Z0-9_]+(?::[A-Za-z0-9_.-]+){0,3}$/.test(error.message)) return error.message;
  return 'POSTGRESQL_REHEARSAL_FAILED';
}

function runStage(stage, command, args, environment) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: environment,
    stdio: 'inherit',
  });
  if (result.error || result.status !== 0) throw new Error(`REHEARSAL_STAGE_FAILED:${stage}`);
}

function defaultReportPath() {
  const timestamp = new Date().toISOString().replaceAll(':', '-').replace('.000Z', 'Z');
  return path.resolve('artifacts', 'postgresql-rehearsals', `rehearsal-${timestamp}.json`);
}

const argv = process.argv.slice(2);
const planOnly = argv.includes('--plan');
const includeSensitive = argv.includes('--include-sensitive');
const sourceInput = argument(argv, '--source');
const targetUrl = process.env.REHEARSAL_DATABASE_URL || process.env.DATABASE_URL;
const directUrl = process.env.REHEARSAL_DIRECT_URL || process.env.DIRECT_URL || targetUrl;
const reportPath = path.resolve(argument(argv, '--report') || defaultReportPath());
const startedAt = new Date();

if (!sourceInput || !targetUrl) {
  console.error('Usage: REHEARSAL_DATABASE_URL=<postgresql-url> node scripts/postgresql-rehearsal.mjs --source <sqlite.db> [--report <report.json>] [--include-sensitive] [--plan]');
  process.exit(1);
}

const sourcePath = fs.existsSync(sourceInput) ? fs.realpathSync(sourceInput) : path.resolve(sourceInput);
let target;
try {
  target = parsePostgresqlTarget(targetUrl);
  const direct = parsePostgresqlTarget(directUrl);
  if (target.databaseName !== direct.databaseName || target.schema !== direct.schema) {
    throw new Error('REHEARSAL_DIRECT_TARGET_MISMATCH');
  }
  if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) {
    throw new Error('REHEARSAL_SOURCE_FILE_MISSING');
  }
} catch (error) {
  console.error(`PostgreSQL rehearsal plan rejected (${safeDiagnostic(error)}).`);
  process.exit(1);
}

if (planOnly) {
  console.log(JSON.stringify({
    mode: 'plan',
    sourceFile: path.basename(sourcePath),
    targetDatabase: target.databaseName,
    targetFingerprint: target.fingerprint,
    sanitizedCopy: !includeSensitive,
    requiresAcknowledgment: REHEARSAL_ACK,
    requiresSensitiveDataAcknowledgment: includeSensitive ? SENSITIVE_DATA_ACK : null,
    writesPerformed: false,
  }, null, 2));
  process.exit(0);
}

if (fs.existsSync(reportPath)) {
  console.error('PostgreSQL rehearsal report already exists; refusing to overwrite it.');
  process.exit(1);
}

let safety;
try {
  safety = assertRehearsalSafety({
    targetUrl,
    directUrl,
    acknowledgment: process.env.POLICYWATCHER_REHEARSAL_ACK,
    includeSensitive,
    sensitiveAcknowledgment: process.env.POLICYWATCHER_REHEARSAL_DATA_ACK,
  });
} catch (error) {
  console.error(`PostgreSQL rehearsal rejected (${safeDiagnostic(error)}).`);
  process.exit(1);
}

const workDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'policywatcher-pg-rehearsal-'));
const consistentCopyPath = path.join(workDirectory, 'consistent-copy.db');
const sanitizedCopyPath = path.join(workDirectory, 'sanitized-copy.db');
const workerResultPath = path.join(workDirectory, 'worker-result.json');
const schemaPath = path.resolve('prisma/schema.prisma');
const baselinePath = path.resolve(
  'prisma/postgresql/migrations/00000000000000_postgresql_baseline/migration.sql',
);
let currentStage = 'source-copy';
let sanitization = { applied: false, version: null, removed: {} };
let workerResult = null;
let verdict = 'no-go';
let diagnosticCode = null;
let sqliteClientRestored = false;
let consistentCopySha256 = null;
let importCopySha256 = null;

try {
  const sourceDatabase = new DatabaseSync(sourcePath, { readOnly: true });
  try {
    sourceDatabase.exec('PRAGMA query_only = ON');
    const integrity = sourceDatabase.prepare('PRAGMA quick_check(1)').all();
    if (integrity.length !== 1 || integrity[0].quick_check !== 'ok') {
      throw new Error('REHEARSAL_SOURCE_INTEGRITY_FAILED');
    }
    await backup(sourceDatabase, consistentCopyPath);
  } finally {
    sourceDatabase.close();
  }
  fs.chmodSync(consistentCopyPath, 0o600);
  consistentCopySha256 = sha256File(consistentCopyPath);

  let importSourcePath = consistentCopyPath;
  if (!includeSensitive) {
    currentStage = 'source-sanitization';
    const result = createStagingDatabase({
      sourcePath: consistentCopyPath,
      outputPath: sanitizedCopyPath,
    });
    sanitization = {
      applied: true,
      version: result.sanitizationVersion,
      removed: result.removed,
    };
    importSourcePath = sanitizedCopyPath;
  }
  importCopySha256 = sha256File(importSourcePath);

  const rehearsalEnvironment = {
    ...process.env,
    DATABASE_URL: safety.target.url,
    DIRECT_URL: safety.direct.url,
    POLICYWATCHER_REHEARSAL_ACK: REHEARSAL_ACK,
    POLICYWATCHER_REHEARSAL_INCLUDE_SENSITIVE: includeSensitive ? '1' : '0',
  };

  currentStage = 'postgresql-client-generation';
  runStage(currentStage, process.execPath, ['scripts/prisma-active-schema.mjs', 'generate'], rehearsalEnvironment);
  currentStage = 'target-empty-preflight';
  runStage(currentStage, process.execPath, ['scripts/postgresql-rehearsal-target-preflight.mjs'], rehearsalEnvironment);
  currentStage = 'postgresql-migrations';
  runStage(currentStage, process.execPath, ['scripts/prisma-active-schema.mjs', 'migrate-deploy'], rehearsalEnvironment);
  currentStage = 'data-import-and-reconciliation';
  runStage(currentStage, process.execPath, [
    'scripts/postgresql-rehearsal-worker.mjs',
    '--source', importSourcePath,
    '--result', workerResultPath,
  ], rehearsalEnvironment);
  workerResult = JSON.parse(fs.readFileSync(workerResultPath, 'utf8'));
  if (workerResult.status !== 'passed') throw new Error('REHEARSAL_RECONCILIATION_FAILED');
  currentStage = 'application-smoke-test';
  runStage(currentStage, process.execPath, ['scripts/postgresql-contract-smoke.mjs'], rehearsalEnvironment);
  verdict = 'go';
} catch (error) {
  diagnosticCode = safeDiagnostic(error);
  if (!workerResult && fs.existsSync(workerResultPath)) {
    try { workerResult = JSON.parse(fs.readFileSync(workerResultPath, 'utf8')); } catch { /* bounded report below */ }
  }
} finally {
  const restoreEnvironment = {
    ...process.env,
    DATABASE_URL: 'file:./dev.db',
  };
  delete restoreEnvironment.DIRECT_URL;
  const restore = spawnSync(process.execPath, ['scripts/prisma-active-schema.mjs', 'generate'], {
    cwd: process.cwd(),
    env: restoreEnvironment,
    stdio: 'ignore',
  });
  sqliteClientRestored = restore.status === 0;
  fs.rmSync(workDirectory, { recursive: true, force: true });
}

const report = {
  contractVersion: '1.0.0',
  verdict: verdict === 'go' && sqliteClientRestored ? 'go' : 'no-go',
  startedAt: startedAt.toISOString(),
  completedAt: new Date().toISOString(),
  source: {
    fileName: path.basename(sourcePath),
    sizeBytes: fs.statSync(sourcePath).size,
  },
  target: {
    databaseName: target.databaseName,
    schema: target.schema,
    fingerprint: target.fingerprint,
  },
  sanitization,
  evidence: {
    sourceOpenedReadOnly: true,
    sourceIntegrity: consistentCopySha256 ? 'passed' : 'not-passed',
    canonicalSchemaSha256: sha256File(schemaPath),
    postgresqlBaselineSha256: sha256File(baselinePath),
    consistentCopySha256,
    importCopySha256,
    importedRowCount: workerResult?.importedRowCount ?? null,
    tables: workerResult?.tables ?? [],
    applicationSmokeTest: verdict === 'go' ? 'passed' : 'not-passed',
    sqliteClientRestored,
  },
  failedStage: verdict === 'go' && sqliteClientRestored
    ? null
    : sqliteClientRestored ? currentStage : 'sqlite-client-restore',
  diagnosticCode: verdict === 'go' && sqliteClientRestored
    ? null
    : diagnosticCode || (sqliteClientRestored ? 'POSTGRESQL_REHEARSAL_FAILED' : 'SQLITE_CLIENT_RESTORE_FAILED'),
  boundary: 'The report proves only this isolated rehearsal run. It does not authorize production cutover or prove backup recovery, load capacity, continuous availability or data residency.',
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
console.log(`PostgreSQL rehearsal verdict: ${report.verdict}.`);
console.log(`Report: ${reportPath}`);
if (report.verdict !== 'go') process.exitCode = 1;
