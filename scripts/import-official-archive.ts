/** Usage: DATABASE_URL=... tsx scripts/import-official-archive.ts captures.json [--apply] */
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { importOfficialComparison, validateOfficialComparison, type OfficialComparison } from '../src/lib/officialArchive';
async function main() {
  const input = process.argv[2];
  if (!input) throw new Error('A reviewed capture manifest is required');
  const pairs = JSON.parse(fs.readFileSync(input, 'utf8')) as OfficialComparison[];
  pairs.forEach(pair => validateOfficialComparison(pair));
  if (!process.argv.includes('--apply')) { console.log(JSON.stringify({ dryRun: true, validPairs: pairs.length })); return; }
  const db = new PrismaClient();
  try { for (const pair of pairs) { const result = await db.$transaction(tx => importOfficialComparison(tx, pair), { timeout: 30000 }); console.log(JSON.stringify({ company: pair.companySlug, title: pair.title, ...result })); } }
  finally { await db.$disconnect(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
