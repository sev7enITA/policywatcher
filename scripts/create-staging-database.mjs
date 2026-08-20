#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const SANITIZATION_VERSION = '1.0.0';
export const SENSITIVE_TABLES = [
  'WebhookDeliveryAttempt',
  'WebhookDelivery',
  'Subscriber',
  'PolicyInquiry',
  'AdminAccessLog',
  'InvestorAccessEvent',
  'InvestorAccessGrant',
  'PressMetricEvent',
  'AdminDashboardMetricEvent',
  'AiModelInvocation',
  'AdminReviewLog',
  'DatasetQaIssueReview',
];

function argument(argv, name) {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

function sha256(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function tableExists(database, table) {
  return Boolean(database.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table));
}

function tableCount(database, table) {
  if (!tableExists(database, table)) return null;
  return Number(database.prepare(`SELECT COUNT(*) AS count FROM "${table}"`).get().count);
}

export function createStagingDatabase({ sourcePath, outputPath }) {
  const source = path.resolve(sourcePath);
  const output = path.resolve(outputPath);
  if (!fs.existsSync(source)) throw new Error(`Source database not found: ${source}`);
  if (source === output) throw new Error('Source and output database paths must be different.');
  if (fs.existsSync(output)) throw new Error(`Output already exists; refusing to overwrite: ${output}`);
  if (fs.existsSync(`${source}-wal`) || fs.existsSync(`${source}-shm`)) {
    throw new Error('Source database has WAL/SHM sidecars. Create a consistent SQLite backup before sanitizing it.');
  }

  const sourceDb = new DatabaseSync(source, { readOnly: true });
  const sourceIntegrity = sourceDb.prepare('PRAGMA integrity_check').all();
  sourceDb.close();
  if (sourceIntegrity.length !== 1 || sourceIntegrity[0].integrity_check !== 'ok') {
    throw new Error('Source database integrity_check did not return ok.');
  }

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.copyFileSync(source, output, fs.constants.COPYFILE_EXCL);
  fs.chmodSync(output, 0o600);

  const database = new DatabaseSync(output);
  const removed = {};
  try {
    database.exec('PRAGMA foreign_keys = ON; BEGIN IMMEDIATE;');
    for (const table of SENSITIVE_TABLES) {
      const count = tableCount(database, table);
      if (count === null) continue;
      database.exec(`DELETE FROM "${table}";`);
      removed[table] = count;
    }
    database.exec('COMMIT;');
    database.exec('PRAGMA journal_mode = DELETE; VACUUM;');

    const integrity = database.prepare('PRAGMA integrity_check').all();
    if (integrity.length !== 1 || integrity[0].integrity_check !== 'ok') {
      throw new Error('Sanitized staging database integrity_check did not return ok.');
    }
    for (const table of Object.keys(removed)) {
      if (tableCount(database, table) !== 0) throw new Error(`Sanitization failed for ${table}.`);
    }
  } catch (error) {
    try { database.exec('ROLLBACK;'); } catch { /* transaction may already be closed */ }
    database.close();
    fs.rmSync(output);
    throw error;
  }
  database.close();

  return {
    sanitizationVersion: SANITIZATION_VERSION,
    sourceSha256: sha256(source),
    outputSha256: sha256(output),
    outputPath: output,
    removed,
  };
}

function runCli() {
  const argv = process.argv.slice(2);
  const sourcePath = argument(argv, '--source');
  const outputPath = argument(argv, '--output');
  if (!sourcePath || !outputPath) {
    throw new Error('Usage: node scripts/create-staging-database.mjs --source <stable-backup.db> --output <staging.db>');
  }
  const result = createStagingDatabase({ sourcePath, outputPath });
  console.log(`Staging database: ${result.outputPath}`);
  console.log(`Sanitization version: ${result.sanitizationVersion}`);
  console.log(`Output SHA-256: ${result.outputSha256}`);
  for (const [table, count] of Object.entries(result.removed)) {
    console.log(`Removed ${count} rows from ${table}.`);
  }
}

try {
  if (process.argv[1]?.endsWith('create-staging-database.mjs')) runCli();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
