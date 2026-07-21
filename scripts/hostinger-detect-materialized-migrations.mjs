#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl?.startsWith('file:')) process.exit(0);

const raw = databaseUrl.slice('file:'.length);
const dbPath = raw.startsWith('./') || raw.startsWith('../')
  ? path.resolve(process.cwd(), 'prisma', raw)
  : raw;
if (!fs.existsSync(dbPath) || fs.statSync(dbPath).size === 0) process.exit(0);

const db = new DatabaseSync(dbPath, { readOnly: true });
const hasTable = (name) => Boolean(
  db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1").get(name)
);

const materialized = [
  ['20260706213500_init', [
    'Company',
    'Policy',
    'PolicyCheckLog',
    'PolicySnapshot',
    'PolicyChange',
    'DatasetQaIssueReview',
    'AdminReviewLog',
    'AdminAccessLog',
    'RegionImpact',
    'Subscriber',
  ]],
  ['20260719070000_policy_discovery', ['PolicyDiscoveryCandidate']],
  ['20260721090000_source_onboarding', ['SourceOnboardingBatch', 'SourceOnboardingItem']],
  ['20260721120000_policy_discovery_job', ['PolicyDiscoveryJob']],
  ['20260721150000_policy_inquiry', ['PolicyInquiry']],
];

for (const [migration, requiredTables] of materialized) {
  if (requiredTables.every(hasTable)) console.log(migration);
}

db.close();
