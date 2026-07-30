#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl?.startsWith('file:')) process.exit(0);

const raw = databaseUrl.slice('file:'.length);
const dbPath = raw.startsWith('./') || raw.startsWith('../')
  ? path.resolve(process.cwd(), 'prisma', raw)
  : raw;
if (!fs.existsSync(dbPath) || fs.statSync(dbPath).size === 0) process.exit(0);

const migrationsRoot = path.resolve(process.cwd(), 'prisma', 'migrations');
if (!fs.existsSync(migrationsRoot)) process.exit(0);

const db = new DatabaseSync(dbPath, { readOnly: true });
const normalizedDefault = (value) => String(value ?? '')
  .trim()
  .replace(/^\((.*)\)$/s, '$1')
  .replace(/^['"]|['"]$/g, '')
  .toUpperCase();

function tableInfo(table) {
  return db.prepare(`PRAGMA table_info("${table.replaceAll('"', '""')}")`).all();
}

function indexInfo(index) {
  return db.prepare(`PRAGMA index_info("${index.replaceAll('"', '""')}")`).all();
}

function migrationIsMaterialized(sql) {
  const tableMatches = [...sql.matchAll(/CREATE TABLE\s+"([^"]+)"\s*\(([\s\S]*?)\);/g)];
  for (const [, table, body] of tableMatches) {
    const actualColumns = new Map(tableInfo(table).map((column) => [column.name, column]));
    if (actualColumns.size === 0) return false;

    const expectedColumns = [...body.matchAll(/^\s*"([^"]+)"\s+([A-Za-z]+)([^,\n]*)[,]?$/gm)];
    for (const [, name, type, suffix] of expectedColumns) {
      const actual = actualColumns.get(name);
      if (!actual || String(actual.type).toUpperCase() !== type.toUpperCase()) return false;
      if (/\bNOT NULL\b/i.test(suffix) && Number(actual.notnull) !== 1) return false;
      if (/\bPRIMARY KEY\b/i.test(suffix) && Number(actual.pk) !== 1) return false;
      const expectedDefault = suffix.match(/\bDEFAULT\s+(.+?)(?=\s+(?:PRIMARY|UNIQUE|REFERENCES|CHECK|COLLATE)\b|$)/i)?.[1];
      if (expectedDefault !== undefined && normalizedDefault(actual.dflt_value) !== normalizedDefault(expectedDefault)) {
        return false;
      }
    }

    const expectedForeignKeys = [...body.matchAll(/FOREIGN KEY\s*\("([^"]+)"\)\s+REFERENCES\s+"([^"]+)"\s*\("([^"]+)"\)\s+ON DELETE\s+([A-Z ]+)\s+ON UPDATE\s+([A-Z ]+)/gi)];
    const actualForeignKeys = db.prepare(`PRAGMA foreign_key_list("${table.replaceAll('"', '""')}")`).all();
    for (const [, from, targetTable, to, onDelete, onUpdate] of expectedForeignKeys) {
      const found = actualForeignKeys.some((foreignKey) => (
        foreignKey.from === from
        && foreignKey.table === targetTable
        && foreignKey.to === to
        && String(foreignKey.on_delete).toUpperCase() === onDelete.trim().toUpperCase()
        && String(foreignKey.on_update).toUpperCase() === onUpdate.trim().toUpperCase()
      ));
      if (!found) return false;
    }
  }

  const alterColumnMatches = [...sql.matchAll(
    /ALTER TABLE\s+"([^"]+)"\s+ADD COLUMN\s+"([^"]+)"\s+([A-Za-z]+)([^;]*);/gi,
  )];
  for (const [, table, name, type, suffix] of alterColumnMatches) {
    const actual = tableInfo(table).find((column) => column.name === name);
    if (!actual || String(actual.type).toUpperCase() !== type.toUpperCase()) return false;
    if (/\bNOT NULL\b/i.test(suffix) && Number(actual.notnull) !== 1) return false;
    const expectedDefault = suffix.match(/\bDEFAULT\s+(.+?)(?=\s+(?:REFERENCES|CHECK|COLLATE)\b|$)/i)?.[1];
    if (expectedDefault !== undefined && normalizedDefault(actual.dflt_value) !== normalizedDefault(expectedDefault)) {
      return false;
    }
  }

  const indexes = [...sql.matchAll(/CREATE\s+(UNIQUE\s+)?INDEX\s+"([^"]+)"\s+ON\s+"([^"]+)"\s*\(([^)]+)\)/gi)];
  for (const [, unique, index, table, columns] of indexes) {
    const actual = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'index' AND name = ? AND tbl_name = ?").get(index, table);
    if (!actual) return false;
    const actualUnique = /CREATE\s+UNIQUE\s+INDEX/i.test(String(actual.sql));
    if (actualUnique !== Boolean(unique)) return false;
    const expectedColumns = [...columns.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
    const actualColumns = indexInfo(index).sort((left, right) => Number(left.seqno) - Number(right.seqno)).map((entry) => entry.name);
    if (expectedColumns.length !== actualColumns.length || expectedColumns.some((column, position) => column !== actualColumns[position])) {
      return false;
    }
  }

  return tableMatches.length > 0 || alterColumnMatches.length > 0;
}

for (const migration of fs.readdirSync(migrationsRoot).sort()) {
  const migrationFile = path.join(migrationsRoot, migration, 'migration.sql');
  if (!fs.existsSync(migrationFile)) continue;
  const sql = fs.readFileSync(migrationFile, 'utf8');
  if (migrationIsMaterialized(sql)) console.log(migration);
}

db.close();
