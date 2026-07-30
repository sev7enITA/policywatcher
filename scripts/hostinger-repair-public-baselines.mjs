#!/usr/bin/env node
/**
 * Repair verified public baselines that were withheld by the legacy scan path.
 *
 * The script is intentionally conservative:
 * - dry-run is the default; mutation requires --apply;
 * - a successful source check must exist for the policy's current hash;
 * - an exact snapshot with that hash must already exist;
 * - source-onboarding records awaiting QA are never promoted;
 * - no PolicyChange, score, alert, or notification is created.
 */
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

const apply = process.argv.includes('--apply');
const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);

if (!databaseUrl?.startsWith('file:')) {
  console.error('DATABASE_URL must be a file: SQLite URL.');
  process.exit(1);
}

const dbPath = sqlitePathFromUrl(databaseUrl);
if (!fs.existsSync(dbPath)) {
  console.error(`Database file does not exist: ${dbPath}`);
  process.exit(1);
}

const db = new DatabaseSync(dbPath, { readOnly: !apply });

function tableExists(name) {
  return Boolean(db.prepare(
    "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
  ).get(name));
}

for (const required of ['Policy', 'Company', 'PolicySnapshot', 'PolicyCheckLog']) {
  if (!tableExists(required)) {
    console.error(`Required table is missing: ${required}`);
    db.close();
    process.exit(1);
  }
}

const hasOnboarding = tableExists('SourceOnboardingItem');
const hasReviewLog = tableExists('AdminReviewLog');
const pendingOnboardingClause = hasOnboarding
  ? `AND NOT EXISTS (
       SELECT 1 FROM SourceOnboardingItem oi
       WHERE oi.policyId = p.id
         AND (oi.stage IN ('BaselinePending', 'QaReview') OR oi.qaStatus = 'Pending')
     )`
  : '';

const candidates = db.prepare(`
  SELECT
    p.id,
    p.currentHash,
    p.dataStatus,
    p.ingestionMethod,
    c.name AS companyName,
    p.name AS policyName,
    p.jurisdiction,
    (
      SELECT l.id FROM PolicyCheckLog l
      WHERE l.policyId = p.id
        AND l.status = 'Available'
        AND l.textHash = p.currentHash
        AND l.source IN ('direct', 'http2', 'rendered', 'wayback', 'commoncrawl')
      ORDER BY l.checkedAt DESC, l.createdAt DESC
      LIMIT 1
    ) AS verifiedLogId,
    (
      SELECT s.id FROM PolicySnapshot s
      WHERE s.policyId = p.id AND s.hash = p.currentHash
      ORDER BY s.version DESC, s.createdAt DESC
      LIMIT 1
    ) AS matchingSnapshotId
  FROM Policy p
  JOIN Company c ON c.id = p.companyId
  WHERE NOT EXISTS (
    SELECT 1 FROM PolicySnapshot published
    WHERE published.policyId = p.id AND published.publicEvidence = 1
  )
  ${pendingOnboardingClause}
  ORDER BY c.name, p.name, p.jurisdiction
`).all();

const eligible = candidates.filter(
  (candidate) => candidate.currentHash && candidate.verifiedLogId && candidate.matchingSnapshotId,
);
const skipped = candidates.filter(
  (candidate) => !candidate.currentHash || !candidate.verifiedLogId || !candidate.matchingSnapshotId,
);

console.log('\nPolicyWatcher verified public baseline repair\n');
console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN (use --apply to mutate)'}`);
console.log(`Database: ${dbPath}`);
console.log(`Eligible: ${eligible.length}; retained private: ${skipped.length}\n`);

for (const candidate of eligible) {
  console.log(`[${apply ? 'PROMOTE' : 'ELIGIBLE'}] ${label(candidate)}`);
}
for (const candidate of skipped) {
  const reasons = [];
  if (!candidate.currentHash) reasons.push('missing current hash');
  if (!candidate.verifiedLogId) reasons.push('no matching successful source check');
  if (!candidate.matchingSnapshotId) reasons.push('no exact matching snapshot');
  console.log(`[KEEP PRIVATE] ${label(candidate)} — ${reasons.join('; ')}`);
}

if (!apply) {
  db.close();
  console.log('\nNo database rows changed. Review the list, then rerun with --apply.');
  process.exit(0);
}

const promoteSnapshot = db.prepare(
  'UPDATE PolicySnapshot SET publicEvidence = 1 WHERE id = ? AND publicEvidence = 0',
);
const updatePolicy = db.prepare(`
  UPDATE Policy
  SET dataStatus = 'Available', lastSuccessfulCheckDate = ?, updatedAt = ?
  WHERE id = ?
`);
const insertReviewLog = hasReviewLog
  ? db.prepare(`
      INSERT INTO AdminReviewLog (
        id, actorRole, action, targetType, targetId, targetLabel,
        oldValue, newValue, note, metadataJson, createdAt
      ) VALUES (?, 'System', 'verified_public_baseline_repaired', 'Policy', ?, ?,
                ?, 'publicEvidence=true', ?, ?, ?)
    `)
  : null;

const now = new Date().toISOString();
db.exec('BEGIN IMMEDIATE');
try {
  for (const candidate of eligible) {
    promoteSnapshot.run(candidate.matchingSnapshotId);
    updatePolicy.run(now, now, candidate.id);
    insertReviewLog?.run(
      randomUUID(),
      candidate.id,
      label(candidate),
      `dataStatus=${candidate.dataStatus}; ingestionMethod=${candidate.ingestionMethod}`,
      'Exact snapshot hash matched a successful source retrieval recorded before the public baseline gate repair.',
      JSON.stringify({
        verifiedCheckLogId: candidate.verifiedLogId,
        snapshotId: candidate.matchingSnapshotId,
        currentHash: candidate.currentHash,
        createsPolicyChange: false,
        sendsNotification: false,
      }),
      now,
    );
  }
  db.exec('COMMIT');
} catch (error) {
  db.exec('ROLLBACK');
  console.error('Public baseline repair failed:', error);
  db.close();
  process.exit(1);
}

db.close();
console.log(`\nCompleted. Promoted ${eligible.length} exact verified baseline(s).`);

function label(candidate) {
  return `${candidate.companyName} / ${candidate.policyName} / ${candidate.jurisdiction}`;
}

function normalizeDatabaseUrl(value) {
  return value?.trim().replace(/^DATABASE_URL=/, '').replace(/^['"]|['"]$/g, '') || '';
}

function sqlitePathFromUrl(value) {
  const raw = value.slice('file:'.length);
  return raw.startsWith('./') || raw.startsWith('../')
    ? path.resolve(process.cwd(), 'prisma', raw)
    : raw;
}
