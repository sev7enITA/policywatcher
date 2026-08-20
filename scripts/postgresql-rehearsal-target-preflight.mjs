#!/usr/bin/env node

import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { assertRehearsalSafety, parsePrismaModels } from './postgresql-rehearsal-lib.mjs';

function quotePostgresqlIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

const client = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

try {
  assertRehearsalSafety({
    targetUrl: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
    acknowledgment: process.env.POLICYWATCHER_REHEARSAL_ACK,
    includeSensitive: process.env.POLICYWATCHER_REHEARSAL_INCLUDE_SENSITIVE === '1',
    sensitiveAcknowledgment: process.env.POLICYWATCHER_REHEARSAL_DATA_ACK,
  });
  const modelNames = new Set(parsePrismaModels(fs.readFileSync('prisma/schema.prisma', 'utf8')).map((model) => model.name));
  const tableRows = await client.$queryRawUnsafe(
    `SELECT table_name AS "name" FROM information_schema.tables WHERE table_schema = current_schema()`,
  );
  const applicationTables = tableRows
    .map((row) => String(row.name))
    .filter((name) => modelNames.has(name));

  for (const table of applicationTables) {
    const rows = await client.$queryRawUnsafe(
      `SELECT COUNT(*)::bigint AS "count" FROM ${quotePostgresqlIdentifier(table)}`,
    );
    if (Number(rows[0]?.count || 0) > 0) throw new Error('REHEARSAL_TARGET_NOT_EMPTY');
  }
  console.log('PostgreSQL rehearsal target preflight passed.');
} catch (error) {
  const diagnosticCode = error instanceof Error && /^[A-Z0-9_]+$/.test(error.message)
    ? error.message
    : 'REHEARSAL_TARGET_PREFLIGHT_FAILED';
  console.error(`PostgreSQL rehearsal target preflight failed (${diagnosticCode}).`);
  process.exitCode = 1;
} finally {
  await client.$disconnect();
}
