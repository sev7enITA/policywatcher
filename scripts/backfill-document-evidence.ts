#!/usr/bin/env tsx

import fs from 'node:fs';
import path from 'node:path';
import { db } from '../src/lib/db';
import {
  DOCUMENT_EVIDENCE_BACKFILL_APPROVAL,
  runDocumentEvidenceBackfill,
} from '../src/lib/documentEvidenceMigration';

function argument(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

function writeReport(reportPath: string | undefined, report: unknown): void {
  if (!reportPath) return;
  const absolutePath = path.resolve(reportPath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const apply = argv.includes('--apply');
  const reportPath = argument(argv, '--report');
  if (apply && process.env.POLICYWATCHER_DOCUMENT_EVIDENCE_BACKFILL_ACK !== DOCUMENT_EVIDENCE_BACKFILL_APPROVAL) {
    throw new Error(
      `Apply requires POLICYWATCHER_DOCUMENT_EVIDENCE_BACKFILL_ACK=${DOCUMENT_EVIDENCE_BACKFILL_APPROVAL}`,
    );
  }

  const report = await runDocumentEvidenceBackfill({ apply, client: db });
  writeReport(reportPath, report);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.status === 'blocked') process.exitCode = 2;
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
