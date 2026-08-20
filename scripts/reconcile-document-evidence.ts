#!/usr/bin/env tsx

import fs from 'node:fs';
import path from 'node:path';
import { db } from '../src/lib/db';
import { reconcileDocumentEvidence } from '../src/lib/documentEvidenceReconciliation';

function argument(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

async function main(): Promise<void> {
  const report = await db.$transaction(
    async (tx) => reconcileDocumentEvidence(tx),
    { maxWait: 10_000, timeout: 120_000 },
  );
  const reportPath = argument(process.argv.slice(2), '--report');
  if (reportPath) {
    const absolutePath = path.resolve(reportPath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.status !== 'reconciled') process.exitCode = 2;
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
