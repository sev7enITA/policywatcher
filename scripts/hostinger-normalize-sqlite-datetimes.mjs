#!/usr/bin/env node
/**
 * Normalize SQLite DATETIME values to Prisma's epoch-millisecond format.
 *
 * Older Hostinger maintenance scripts and SQLite CURRENT_TIMESTAMP defaults
 * could create ISO/SQL text dates beside Prisma's integer dates. SQLite sorts
 * storage classes before values, so a text row could appear newer than every
 * integer row and break consecutive-scan confirmation. Dry-run is the default.
 */
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const apply = process.argv.includes('--apply');
const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);

if (!databaseUrl?.startsWith('file:')) {
  console.error('DATABASE_URL must be a file: SQLite URL.');
  process.exit(1);
}

const dbPath = sqlitePathFromUrl(databaseUrl);
if (!fs.existsSync(dbPath)) {
  console.error(`Database file does not exist: ${dbPath}`);
  process.exit(1);
}

const db = new DatabaseSync(dbPath, { readOnly: !apply });
const tables = db.prepare(`
  SELECT name
  FROM sqlite_master
  WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
  ORDER BY name
`).all();

let convertible = 0;
let skipped = 0;
const updates = [];

for (const { name: table } of tables) {
  const columns = db.prepare(`PRAGMA table_info(${quoteIdentifier(table)})`).all()
    .filter((column) => String(column.type).toUpperCase().includes('DATETIME'));

  for (const { name: column } of columns) {
    const rows = db.prepare(`
      SELECT rowid AS rowId, ${quoteIdentifier(column)} AS value
      FROM ${quoteIdentifier(table)}
      WHERE typeof(${quoteIdentifier(column)}) = 'text'
    `).all();

    for (const row of rows) {
      const epochMs = Date.parse(String(row.value));
      if (!Number.isFinite(epochMs)) {
        skipped++;
        continue;
      }
      convertible++;
      updates.push({ table, column, rowId: row.rowId, epochMs });
    }
  }
}

console.log('\nPolicyWatcher SQLite DateTime normalization\n');
console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN (use --apply to mutate)'}`);
console.log(`Convertible text values: ${convertible}`);
console.log(`Unparseable text values retained: ${skipped}`);

if (!apply || updates.length === 0) {
  db.close();
  console.log(apply ? 'No rows required normalization.' : 'No database rows changed.');
  process.exit(0);
}

db.exec('BEGIN IMMEDIATE');
try {
  const statements = new Map();
  for (const update of updates) {
    const key = `${update.table}\u0000${update.column}`;
    let statement = statements.get(key);
    if (!statement) {
      statement = db.prepare(`
        UPDATE ${quoteIdentifier(update.table)}
        SET ${quoteIdentifier(update.column)} = ?
        WHERE rowid = ? AND typeof(${quoteIdentifier(update.column)}) = 'text'
      `);
      statements.set(key, statement);
    }
    statement.run(update.epochMs, update.rowId);
  }
  db.exec('COMMIT');
} catch (error) {
  db.exec('ROLLBACK');
  db.close();
  console.error('DateTime normalization failed:', error);
  process.exit(1);
}

db.close();
console.log(`Normalized ${updates.length} DateTime value(s).`);

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function normalizeDatabaseUrl(value) {
  return value?.trim().replace(/^DATABASE_URL=/, '').replace(/^['"]|['"]$/g, '') || '';
}

function sqlitePathFromUrl(value) {
  const raw = value.slice('file:'.length);
  return raw.startsWith('./') || raw.startsWith('../')
    ? path.resolve(process.cwd(), 'prisma', raw)
    : raw;
}
