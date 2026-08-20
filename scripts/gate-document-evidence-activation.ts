#!/usr/bin/env tsx

import { db } from '../src/lib/db';
import { reconcileDocumentEvidence } from '../src/lib/documentEvidenceReconciliation';
import { isDocumentEvidenceDualWriteEnabled } from '../src/lib/documentEvidenceSync';

async function main(): Promise<void> {
  if (!isDocumentEvidenceDualWriteEnabled()) {
    process.stdout.write('Canonical evidence activation gate: dual-write disabled.\n');
    return;
  }

  const report = await db.$transaction(
    async (tx) => reconcileDocumentEvidence(tx),
    { maxWait: 10_000, timeout: 120_000 },
  );
  if (report.status !== 'reconciled' || report.errorCount !== 0 || report.warningCount !== 0) {
    const issueCodes = [...new Set(report.issues.map((issue) => issue.code))].sort();
    console.error(
      `Canonical evidence activation gate blocked: errors=${report.errorCount}; warnings=${report.warningCount}; codes=${issueCodes.join(',') || 'unknown'}.`,
    );
    process.exitCode = 2;
    return;
  }

  process.stdout.write(
    `Canonical evidence activation gate passed: entities=${report.canonical.entities}; documents=${report.canonical.documents}; versions=${report.canonical.versions}; changes=${report.canonical.changes}; provisions=${report.canonical.provisions}.\n`,
  );
}

main()
  .catch(() => {
    console.error('Canonical evidence activation gate failed: reconciliation unavailable.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
