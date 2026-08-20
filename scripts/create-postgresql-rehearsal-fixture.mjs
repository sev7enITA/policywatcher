#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

function argument(argv, name) {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

const databaseInput = argument(process.argv.slice(2), '--database');
if (!databaseInput) {
  console.error('Usage: node scripts/create-postgresql-rehearsal-fixture.mjs --database <sqlite.db>');
  process.exit(1);
}

const databasePath = path.resolve(databaseInput);
if (!fs.existsSync(databasePath)) {
  console.error('Rehearsal fixture database does not exist.');
  process.exit(1);
}

const database = new DatabaseSync(databasePath);
const timestamp = Date.now();
const evidenceText = 'Rehearsal evidence';
const evidenceHash = createHash('sha256').update(evidenceText, 'utf8').digest('hex');

try {
  database.exec('PRAGMA foreign_keys = ON; BEGIN IMMEDIATE;');
  database.prepare(`INSERT INTO "Company" (
    id, name, slug, industry, website, createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    'rehearsal-company', 'Rehearsal Company', 'rehearsal-company',
    'CI portability', 'https://example.test', timestamp, timestamp,
  );
  database.prepare(`INSERT INTO "Policy" (
    id, companyId, name, type, url, sourceMigrationPending, jurisdiction,
    currentText, currentHash, dataStatus, lastCheckDate,
    lastSuccessfulCheckDate, ingestionMethod, createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    'rehearsal-policy', 'rehearsal-company', 'Rehearsal Privacy', 'privacy',
    'https://example.test/privacy', 0, 'Global', evidenceText,
    evidenceHash, 'Available', timestamp, timestamp, 'CI fixture', timestamp, timestamp,
  );
  database.prepare(`INSERT INTO "PolicySnapshot" (
    id, policyId, version, text, hash, publicEvidence, createdAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    'rehearsal-snapshot', 'rehearsal-policy', 1, evidenceText,
    evidenceHash, 0, timestamp,
  );
  database.prepare(`INSERT INTO "Subscriber" (
    id, email, regions, industries, frequency, unsubscribeToken,
    isActive, createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    'rehearsal-subscriber', 'removed-before-import@example.test', 'Global',
    'CI portability', 'INSTANT', 'rehearsal-sensitive-token', 1, timestamp, timestamp,
  );
  database.prepare(`INSERT INTO "InvestorAccessGrant" (
    id, tokenHash, recipientLabel, createdByRole, createdAt, expiresAt, accessCount
  ) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    'rehearsal-grant', 'rehearsal-sensitive-token-hash', 'CI investor',
    'admin', timestamp, timestamp + 86_400_000, 0,
  );
  database.prepare(`INSERT INTO "InvestorAccessEvent" (
    id, grantId, event, actorRole, detail, createdAt
  ) VALUES (?, ?, ?, ?, ?, ?)`).run(
    'rehearsal-investor-event', 'rehearsal-grant', 'created', 'admin',
    'removed before rehearsal import', timestamp,
  );
  database.exec('COMMIT;');
  console.log('SQLite rehearsal fixture created.');
} catch {
  try { database.exec('ROLLBACK;'); } catch { /* transaction may already be closed */ }
  console.error('Unable to create the SQLite rehearsal fixture.');
  process.exitCode = 1;
} finally {
  database.close();
}
