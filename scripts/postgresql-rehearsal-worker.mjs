#!/usr/bin/env node

import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { PrismaClient } from '@prisma/client';
import {
  assertRehearsalSafety,
  digestModelRows,
  normalizeModelRow,
  orderModelsByDependencies,
  parsePrismaModels,
} from './postgresql-rehearsal-lib.mjs';

const BATCH_SIZE = 200;

function argument(argv, name) {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

function quoteSqliteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function chunks(values, size) {
  const result = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

function boundedDiagnostic(error) {
  const candidate = error && typeof error === 'object' ? error : {};
  if (typeof candidate.code === 'string' && /^[A-Z0-9_:-]{1,80}$/.test(candidate.code)) return candidate.code;
  if (error instanceof Error && /^[A-Z0-9_]+(?::[A-Za-z0-9_.-]+){0,3}$/.test(error.message)) return error.message;
  return 'POSTGRESQL_REHEARSAL_IMPORT_FAILED';
}

const argv = process.argv.slice(2);
const sourcePath = argument(argv, '--source');
const resultPath = argument(argv, '--result');
const targetUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

if (!sourcePath || !resultPath) {
  console.error('Usage: node scripts/postgresql-rehearsal-worker.mjs --source <copy.db> --result <result.json>');
  process.exit(1);
}

const startedAt = new Date();
const client = new PrismaClient({ datasources: { db: { url: targetUrl } } });
let sourceDatabase;

try {
  assertRehearsalSafety({
    targetUrl,
    directUrl,
    acknowledgment: process.env.POLICYWATCHER_REHEARSAL_ACK,
    includeSensitive: process.env.POLICYWATCHER_REHEARSAL_INCLUDE_SENSITIVE === '1',
    sensitiveAcknowledgment: process.env.POLICYWATCHER_REHEARSAL_DATA_ACK,
  });
  if (!fs.existsSync(sourcePath)) throw new Error('REHEARSAL_SOURCE_COPY_MISSING');

  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  const models = orderModelsByDependencies(parsePrismaModels(schema));
  sourceDatabase = new DatabaseSync(sourcePath, { readOnly: true });
  sourceDatabase.exec('PRAGMA query_only = ON');

  const integrity = sourceDatabase.prepare('PRAGMA quick_check(1)').all();
  if (integrity.length !== 1 || integrity[0].quick_check !== 'ok') {
    throw new Error('REHEARSAL_SOURCE_COPY_INTEGRITY_FAILED');
  }

  const sourceRowsByModel = new Map();
  for (const model of models) {
    const exists = sourceDatabase.prepare(
      "SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = ?",
    ).get(model.name);
    if (!exists) throw new Error(`REHEARSAL_SOURCE_TABLE_MISSING:${model.name}`);
    const columns = model.fields.map((field) => quoteSqliteIdentifier(field.name)).join(', ');
    const rows = sourceDatabase.prepare(
      `SELECT ${columns} FROM ${quoteSqliteIdentifier(model.name)}`,
    ).all().map((row) => normalizeModelRow(model, row));
    sourceRowsByModel.set(model.name, rows);
  }

  const nonEmptyTarget = [];
  for (const model of models) {
    const delegate = client[model.delegate];
    if (!delegate || typeof delegate.count !== 'function') {
      throw new Error(`PRISMA_DELEGATE_MISSING:${model.name}`);
    }
    const count = await delegate.count();
    if (count > 0) nonEmptyTarget.push({ model: model.name, count });
  }
  if (nonEmptyTarget.length > 0) throw new Error('REHEARSAL_TARGET_NOT_EMPTY');

  const operations = [];
  for (const model of models) {
    const delegate = client[model.delegate];
    for (const batch of chunks(sourceRowsByModel.get(model.name), BATCH_SIZE)) {
      operations.push(delegate.createMany({ data: batch }));
    }
  }
  if (operations.length > 0) await client.$transaction(operations);

  const tables = [];
  for (const model of models) {
    const select = Object.fromEntries(model.fields.map((field) => [field.name, true]));
    const sourceRows = sourceRowsByModel.get(model.name);
    const targetRows = await client[model.delegate].findMany({ select });
    const sourceChecksum = digestModelRows(model, sourceRows);
    const targetChecksum = digestModelRows(model, targetRows);
    tables.push({
      model: model.name,
      sourceCount: sourceRows.length,
      targetCount: targetRows.length,
      sourceChecksum,
      targetChecksum,
      match: sourceRows.length === targetRows.length && sourceChecksum === targetChecksum,
    });
  }

  const mismatches = tables.filter((table) => !table.match);
  const result = {
    contractVersion: '1.0.0',
    status: mismatches.length === 0 ? 'passed' : 'failed',
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    importedRowCount: tables.reduce((total, table) => total + table.sourceCount, 0),
    modelOrder: models.map((model) => model.name),
    tables,
    diagnosticCode: mismatches.length === 0 ? null : 'REHEARSAL_RECONCILIATION_MISMATCH',
  };
  fs.writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  if (mismatches.length > 0) process.exitCode = 1;
} catch (error) {
  const diagnosticCode = boundedDiagnostic(error);
  fs.writeFileSync(resultPath, `${JSON.stringify({
    contractVersion: '1.0.0',
    status: 'failed',
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    diagnosticCode,
  }, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  console.error(`PostgreSQL rehearsal import failed (${diagnosticCode}).`);
  process.exitCode = 1;
} finally {
  sourceDatabase?.close();
  await client.$disconnect();
}
