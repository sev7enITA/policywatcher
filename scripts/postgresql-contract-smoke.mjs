#!/usr/bin/env node

import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { detectDatabaseProvider } from './database-provider.mjs';

if (detectDatabaseProvider(process.env.DATABASE_URL) !== 'postgresql') {
  console.error('The PostgreSQL contract smoke test requires a PostgreSQL DATABASE_URL.');
  process.exit(1);
}

const client = new PrismaClient();
const runId = randomUUID();
const companyId = randomUUID();
const policyId = randomUUID();

try {
  const providerRows = await client.$queryRawUnsafe('SELECT current_database() AS "database", current_schema() AS "schema"');
  if (!Array.isArray(providerRows) || providerRows.length !== 1) {
    throw new Error('PostgreSQL identity query returned an unexpected result.');
  }

  await client.$transaction(async (transaction) => {
    await transaction.company.create({
      data: {
        id: companyId,
        name: `PolicyWatcher CI ${runId}`,
        slug: `policywatcher-ci-${runId}`,
        industry: 'CI portability test',
        website: 'https://example.test',
        policies: {
          create: {
            id: policyId,
            name: 'Portability policy',
            type: 'ci-portability',
            url: 'https://example.test/policy',
            currentText: 'Portable baseline',
            currentHash: runId,
            snapshots: {
              create: {
                id: randomUUID(),
                version: 1,
                text: 'Portable baseline',
                hash: runId,
              },
            },
          },
        },
      },
    });

    const stored = await transaction.policy.findUnique({
      where: { id: policyId },
      include: { company: true, snapshots: true },
    });
    if (!stored || stored.company.id !== companyId || stored.snapshots.length !== 1) {
      throw new Error('Relational create/read contract failed.');
    }

    await transaction.policy.update({
      where: { id: policyId },
      data: { dataStatus: 'CI verified' },
    });
  });

  await client.company.delete({ where: { id: companyId } });
  const remainingPolicies = await client.policy.count({ where: { id: policyId } });
  if (remainingPolicies !== 0) {
    throw new Error('Cascade-delete contract failed.');
  }

  console.log('PostgreSQL portability smoke test passed.');
} catch (error) {
  await client.company.deleteMany({ where: { id: companyId } }).catch(() => undefined);
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : 'SMOKE_TEST_FAILED';
  console.error(`PostgreSQL portability smoke test failed (${code}).`);
  process.exitCode = 1;
} finally {
  await client.$disconnect();
}
