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
const ledgerTaskId = `ci-ledger-${runId}`;

/** Record, approve, rollback, uniqueness and cascade for the claim ledger. */
async function claimLedgerContract() {
  const claim = (claimKey) => ({
    taskId: ledgerTaskId, claimKey, ordinal: 0, policyId: 'ci-ledger-policy', operation: 'modified', category: 'content',
    textEn: 'Retention changes.', textIt: 'La conservazione cambia.', impact: 3, deltaIdsJson: '["d1","d2"]',
    analystModel: 'ci-analyst', promptVersion: 'ci-1', analysisOutputHash: runId,
    verifierModel: 'ci-verifier', verifierVerdict: 'supported', verifierReason: 'CI verdict.',
    evidence: { create: [
      { ordinal: 0, side: 'old', documentHash: 'old', startOffset: 0, endOffset: 7, quote: '30 days', quoteHash: 'q0' },
      { ordinal: 1, side: 'new', documentHash: 'new', startOffset: 0, endOffset: 7, quote: '60 days', quoteHash: 'q1' },
    ] },
  });
  await client.$transaction(async (transaction) => { await transaction.engineClaim.create({ data: claim('c1') }); });
  const stored = await client.engineClaim.findUnique({ where: { taskId_claimKey: { taskId: ledgerTaskId, claimKey: 'c1' } }, include: { evidence: true } });
  if (!stored || stored.interpretationStatus !== 'inferred' || stored.evidence.length !== 2
    || stored.evidence.some((span) => span.status !== 'observed')) throw new Error('Claim ledger record contract failed.');

  const approved = await client.engineClaim.updateMany({ where: { taskId: ledgerTaskId },
    data: { interpretationStatus: 'approved', approvedBy: 'admin', approvedAt: new Date() } });
  if (approved.count !== 1) throw new Error('Claim ledger approval contract failed.');

  await client.$transaction(async (transaction) => {
    await transaction.engineClaim.create({ data: claim('c2') });
    throw new Error('ci_intentional_rollback');
  }).catch((error) => { if (error?.message !== 'ci_intentional_rollback') throw error; });
  if (await client.engineClaim.count({ where: { taskId: ledgerTaskId } }) !== 1) throw new Error('Claim ledger rollback contract failed.');

  const duplicate = await client.engineClaim.create({ data: claim('c1') }).then(() => null, (error) => error?.code);
  if (duplicate !== 'P2002') throw new Error('Claim ledger uniqueness contract failed.');

  await client.engineClaim.delete({ where: { id: stored.id } });
  if (await client.engineClaimEvidence.count({ where: { claimId: stored.id } }) !== 0) throw new Error('Claim ledger cascade contract failed.');
}

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

  await claimLedgerContract();
  console.log('PostgreSQL portability smoke test passed.');
} catch (error) {
  await client.company.deleteMany({ where: { id: companyId } }).catch(() => undefined);
  await client.engineClaim.deleteMany({ where: { taskId: ledgerTaskId } }).catch(() => undefined);
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : 'SMOKE_TEST_FAILED';
  console.error(`PostgreSQL portability smoke test failed (${code}).`);
  process.exitCode = 1;
} finally {
  await client.$disconnect();
}
