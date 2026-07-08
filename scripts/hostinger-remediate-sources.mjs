#!/usr/bin/env node
/**
 * Hostinger-safe source URL remediation.
 *
 * This mirrors scripts/migrate-urls.ts without Prisma, tsx, npm, or npx.
 * It uses Node 22's built-in SQLite driver, so it can run from constrained
 * Hostinger SSH shells after exporting the Alt-Node PATH.
 */
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

const URL_UPDATES = [
  ['Microsoft', 'Privacy Statement', ['EU'], 'privacy.microsoft.com/it-it/privacystatement', 'https://www.microsoft.com/en-gb/privacy/privacystatement', 'Official final Microsoft Privacy Statement URL'],
  ['Microsoft', 'Privacy Statement', ['US'], 'privacy.microsoft.com/en-us/privacystatement', 'https://www.microsoft.com/en-us/privacy/privacystatement', 'Official final Microsoft Privacy Statement URL'],
  ['Microsoft', 'Privacy Statement', ['Global'], 'privacy.microsoft.com/en/privacystatement', 'https://www.microsoft.com/en-us/privacy/privacystatement', 'Official Microsoft Privacy Statement baseline'],
  ['Zoom', 'Privacy Statement', null, 'explore.zoom.us/en/privacy', 'https://www.zoom.com/en/trust/privacy/privacy-statement/', 'Current official Zoom Trust Center privacy URL'],
  ['Zoom', 'Terms of Service', null, 'explore.zoom.us/en/terms', 'https://www.zoom.com/en/trust/terms/', 'Current official Zoom Trust Center terms URL'],
  ['Klarna', 'Privacy Notice', ['US'], 'cdn.klarna.com/1.0/shared/content/legal/terms/en-us/privacy', 'https://www.klarna.com/us/privacy/', 'Replace previous CDN workaround with official US privacy page'],
  ['Klarna', 'Privacy Notice', null, 'klarna.com/us/privacy', 'https://www.klarna.com/us/privacy/', 'Official US privacy page is directly fetchable'],
  ['Klarna', 'Privacy Notice', ['EU'], 'klarna.com/international/privacy-policy', 'https://www.klarna.com/ie/privacy/', 'Official English EU/Ireland privacy page is directly fetchable'],
  ['Klarna', 'Terms of Service', ['US'], 'cdn.klarna.com/1.0/shared/content/legal/terms/en-us/terms', 'https://www.klarna.com/us/terms-of-use/', 'Replace previous CDN workaround with official US terms page'],
  ['Klarna', 'Terms of Service', null, 'klarna.com/us/terms', 'https://www.klarna.com/us/terms-of-use/', 'Official US terms page replaces stale CDN URL'],
  ['Klarna', 'Terms of Service', ['EU'], 'klarna.com/international/terms-and-conditions', 'https://www.klarna.com/ie/terms-and-conditions/', 'Official English EU/Ireland terms page; QA suspends if body is too short'],
  ['Plaid', 'Privacy Policy', ['US', 'EU'], 'plaid.com/legal', 'https://plaid.com/legal#end-user-privacy-policy', 'Anchor-scoped End User Privacy Policy'],
  ['Plaid', 'End User Services Agreement', ['US'], 'plaid.com/legal', 'https://plaid.com/legal#end-user-services-agreement-us', 'Anchor-scoped US EUSA'],
  ['Plaid', 'End User Services Agreement', ['EU'], 'plaid.com/legal', 'https://plaid.com/legal#end-user-services-agreement-eea', 'Anchor-scoped EEA EUSA'],
  ['Amazon', 'AWS Data Processing Addendum', null, 'aws.amazon.com/compliance/data-processing-addendum', 'https://docs.aws.amazon.com/whitepapers/latest/navigating-gdpr-compliance/aws-data-processing-addendum-dpa.html', 'Focused AWS DPA documentation'],
  ['Amazon', 'AWS Data Processing Addendum', null, 'aws.amazon.com/service-terms', 'https://docs.aws.amazon.com/whitepapers/latest/navigating-gdpr-compliance/aws-data-processing-addendum-dpa.html', 'Focused AWS DPA documentation'],
];

const dryRun = process.argv.includes('--dry-run');
const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);

if (!databaseUrl) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

if (!databaseUrl.startsWith('file:')) {
  console.error('Only SQLite file: DATABASE_URL values are supported.');
  process.exit(1);
}

const dbPath = sqlitePathFromUrl(databaseUrl);
if (!fs.existsSync(dbPath)) {
  console.error(`Database file does not exist: ${dbPath}`);
  process.exit(1);
}

const db = new DatabaseSync(dbPath);

const selectPolicies = db.prepare(`
  SELECT
    p.id,
    p.url,
    p.jurisdiction,
    p.name AS policyName,
    c.name AS companyName,
    (
      SELECT COUNT(*)
      FROM PolicySnapshot s
      WHERE s.policyId = p.id AND s.publicEvidence = 1
    ) AS publicEvidenceCount
  FROM Policy p
  JOIN Company c ON c.id = p.companyId
  WHERE c.name = ? AND p.name = ?
  ORDER BY p.jurisdiction ASC, p.createdAt ASC
`);

const updatePolicy = db.prepare(`
  UPDATE Policy
  SET url = ?, dataStatus = ?, updatedAt = ?
  WHERE id = ?
`);

const insertCheckLog = db.prepare(`
  INSERT INTO PolicyCheckLog (
    id, policyId, status, checkedAt, source, reason, finalUrl, createdAt
  ) VALUES (?, ?, ?, ?, 'source_remediation', 'source_url_remediation', ?, ?)
`);

let updated = 0;
let skipped = 0;
let notFound = 0;

console.log('\nPolicyWatcher Hostinger Source Remediation\n');
console.log(`${URL_UPDATES.length} source remediation rules loaded.`);
if (dryRun) console.log('DRY RUN: no database rows will be changed.');
console.log(`Database: ${dbPath}\n`);

if (!dryRun) db.exec('BEGIN');

try {
  for (const [company, policyName, jurisdictions, oldUrlPart, newUrl, reason] of URL_UPDATES) {
    const rows = selectPolicies.all(company, policyName)
      .filter((row) => !jurisdictions || jurisdictions.includes(row.jurisdiction))
      .filter((row) => row.url.includes(oldUrlPart) || row.url === newUrl);

    if (rows.length === 0) {
      console.log(`[NOT FOUND] ${company} / ${policyName} (url contains "${oldUrlPart}")`);
      notFound++;
      continue;
    }

    for (const row of rows) {
      const label = `${row.companyName} / ${row.policyName} / ${row.jurisdiction}`;
      if (row.url === newUrl) {
        console.log(`[SKIP] ${label} - already updated`);
        skipped++;
        continue;
      }

      const nextStatus = row.publicEvidenceCount > 0 ? 'Needs Review' : 'Configured';
      const now = new Date().toISOString();

      if (!dryRun) {
        updatePolicy.run(newUrl, nextStatus, now, row.id);
        insertCheckLog.run(randomUUID(), row.id, nextStatus, now, newUrl, now);
      }

      console.log(`[${dryRun ? 'DRY' : 'UPDATE'}] ${label}`);
      console.log(`   ${row.url}`);
      console.log(`   -> ${newUrl}`);
      console.log(`   status after URL change: ${nextStatus}`);
      console.log(`   (${reason})\n`);
      updated++;
    }
  }

  if (!dryRun) db.exec('COMMIT');
} catch (error) {
  if (!dryRun) db.exec('ROLLBACK');
  console.error('Source remediation failed:', error);
  process.exit(1);
} finally {
  db.close();
}

console.log('-'.repeat(50));
console.log(`Done. Updated: ${updated}, Skipped: ${skipped}, Not found: ${notFound}`);

function normalizeDatabaseUrl(value) {
  if (!value) return '';
  return value.trim().replace(/^DATABASE_URL=/, '').replace(/^['"]|['"]$/g, '');
}

function sqlitePathFromUrl(value) {
  const raw = value.slice('file:'.length);
  if (raw.startsWith('./') || raw.startsWith('../')) {
    return path.resolve(process.cwd(), 'prisma', raw);
  }
  return raw;
}
