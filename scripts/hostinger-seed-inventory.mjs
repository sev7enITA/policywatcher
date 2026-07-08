#!/usr/bin/env node
/**
 * Hostinger-safe PolicyWatcher inventory initializer.
 *
 * This script is intentionally different from prisma/seed.ts:
 * - it creates only the monitored company/policy inventory;
 * - it does not create PolicySnapshot, PolicyChange, RegionImpact, or AI data;
 * - every policy is stored as Configured + Seeded so public gates keep it hidden
 *   until the first verified fetch establishes a real baseline.
 *
 * Run after scripts/hostinger-init-db.sh when a production SQLite database is
 * empty or missing the source inventory.
 */
import crypto, { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);

if (!databaseUrl) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

if (!databaseUrl.startsWith('file:')) {
  console.error('Only SQLite file: DATABASE_URL values are supported by this initializer.');
  process.exit(1);
}

function normalizeDatabaseUrl(value) {
  if (!value) return '';
  const trimmed = value.trim().replace(/^DATABASE_URL=/, '').replace(/^['"]|['"]$/g, '');
  return trimmed;
}

function sqlitePathFromUrl(value) {
  const raw = value.slice('file:'.length);
  if (raw.startsWith('./') || raw.startsWith('../')) {
    return path.resolve(process.cwd(), 'prisma', raw);
  }
  return raw;
}

function nowIso() {
  return new Date().toISOString();
}

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function placeholderText(companyName, policy) {
  return [
    `Configured inventory placeholder for ${companyName} ${policy.name} (${policy.jurisdiction}).`,
    'This record is not public evidence and must be replaced by a verified retrieval before publication.',
    `Configured source URL: ${policy.url}`,
  ].join('\n');
}

const companies = [
  {
    name: 'Google',
    slug: 'google',
    logo: '#4285F4',
    industry: 'Tech Giant',
    website: 'https://policies.google.com',
    policies: [
      { name: 'Privacy Policy', type: 'privacy', jurisdiction: 'EU', url: 'https://policies.google.com/privacy?hl=it' },
      { name: 'Privacy Policy', type: 'privacy', jurisdiction: 'US', url: 'https://policies.google.com/privacy?hl=en' },
      { name: 'Privacy Policy', type: 'privacy', jurisdiction: 'Global', url: 'https://policies.google.com/privacy' },
      { name: 'AI Terms of Service', type: 'ai', jurisdiction: 'Global', url: 'https://policies.google.com/terms/generative-ai' },
    ],
  },
  {
    name: 'Anthropic',
    slug: 'anthropic',
    logo: '#E0B8A0',
    industry: 'Tech Giant',
    website: 'https://www.anthropic.com',
    policies: [
      { name: 'Terms of Service', type: 'terms', jurisdiction: 'Global', url: 'https://www.anthropic.com/legal/terms' },
      { name: 'Acceptable Use Policy', type: 'aup', jurisdiction: 'Global', url: 'https://www.anthropic.com/legal/aup' },
    ],
  },
  {
    name: 'Microsoft',
    slug: 'microsoft',
    logo: '#00A4EF',
    industry: 'Tech Giant',
    website: 'https://www.microsoft.com',
    policies: [
      { name: 'Privacy Statement', type: 'privacy', jurisdiction: 'EU', url: 'https://www.microsoft.com/en-gb/privacy/privacystatement' },
      { name: 'Privacy Statement', type: 'privacy', jurisdiction: 'US', url: 'https://www.microsoft.com/en-us/privacy/privacystatement' },
      { name: 'Privacy Statement', type: 'privacy', jurisdiction: 'Global', url: 'https://www.microsoft.com/en-us/privacy/privacystatement' },
      { name: 'Services Agreement', type: 'terms', jurisdiction: 'Global', url: 'https://www.microsoft.com/en/servicesagreement' },
    ],
  },
  {
    name: 'Meta',
    slug: 'meta',
    logo: '#0668E1',
    industry: 'Tech Giant',
    website: 'https://www.meta.com',
    policies: [
      { name: 'Privacy Policy', type: 'privacy', jurisdiction: 'EU', url: 'https://www.facebook.com/privacy/policy/' },
      { name: 'Privacy Policy', type: 'privacy', jurisdiction: 'US', url: 'https://www.facebook.com/privacy/policy/' },
      { name: 'Terms of Service', type: 'terms', jurisdiction: 'Global', url: 'https://www.facebook.com/legal/terms' },
    ],
  },
  {
    name: 'Stripe',
    slug: 'stripe',
    logo: '#635BFF',
    industry: 'FinTech',
    website: 'https://stripe.com',
    policies: [
      { name: 'Privacy Policy', type: 'privacy', jurisdiction: 'EU', url: 'https://stripe.com/it/privacy' },
      { name: 'Privacy Policy', type: 'privacy', jurisdiction: 'US', url: 'https://stripe.com/us/privacy' },
      { name: 'Privacy Policy', type: 'privacy', jurisdiction: 'Global', url: 'https://stripe.com/privacy' },
      { name: 'Services Agreement', type: 'terms', jurisdiction: 'EU', url: 'https://stripe.com/it/legal/ssa' },
      { name: 'Services Agreement', type: 'terms', jurisdiction: 'US', url: 'https://stripe.com/us/legal/ssa' },
    ],
  },
  {
    name: 'PayPal',
    slug: 'paypal',
    logo: '#003087',
    industry: 'FinTech',
    website: 'https://www.paypal.com',
    policies: [
      { name: 'Privacy Statement', type: 'privacy', jurisdiction: 'EU', url: 'https://www.paypal.com/lu/webapps/mpp/ua/privacy-full' },
      { name: 'Privacy Statement', type: 'privacy', jurisdiction: 'US', url: 'https://www.paypal.com/us/webapps/mpp/ua/privacy-full' },
      { name: 'User Agreement', type: 'terms', jurisdiction: 'EU', url: 'https://www.paypal.com/lu/legalhub/paypal/useragreement-full?locale.x=en_LU' },
      { name: 'User Agreement', type: 'terms', jurisdiction: 'US', url: 'https://www.paypal.com/us/legalhub/paypal/useragreement-full' },
    ],
  },
  {
    name: 'Revolut',
    slug: 'revolut',
    logo: '#1c1e21',
    industry: 'FinTech',
    website: 'https://www.revolut.com',
    policies: [
      { name: 'Privacy Policy', type: 'privacy', jurisdiction: 'EU', url: 'https://www.revolut.com/legal/privacy' },
      { name: 'Privacy Policy', type: 'privacy', jurisdiction: 'UK', url: 'https://www.revolut.com/legal/privacy' },
      { name: 'Terms of Use', type: 'terms', jurisdiction: 'EU', url: 'https://www.revolut.com/legal/terms' },
      { name: 'Terms of Use', type: 'terms', jurisdiction: 'UK', url: 'https://www.revolut.com/legal/terms' },
    ],
  },
  {
    name: 'Wise',
    slug: 'wise',
    logo: '#3751FF',
    industry: 'FinTech',
    website: 'https://wise.com',
    policies: [
      { name: 'Privacy Policy', type: 'privacy', jurisdiction: 'EU', url: 'https://wise.com/gb/legal/privacy-notice-personal-en' },
      { name: 'Privacy Policy', type: 'privacy', jurisdiction: 'US', url: 'https://wise.com/us/legal/privacy-policy' },
      { name: 'Privacy Policy', type: 'privacy', jurisdiction: 'Global', url: 'https://wise.com/gb/legal/privacy-notice-personal-en' },
      { name: 'Terms of Use', type: 'terms', jurisdiction: 'Global', url: 'https://wise.com/us/legal/terms-of-use' },
    ],
  },
  {
    name: 'Klarna',
    slug: 'klarna',
    logo: '#FFB3C6',
    industry: 'FinTech',
    website: 'https://www.klarna.com',
    policies: [
      { name: 'Privacy Notice', type: 'privacy', jurisdiction: 'EU', url: 'https://www.klarna.com/ie/privacy/' },
      { name: 'Privacy Notice', type: 'privacy', jurisdiction: 'US', url: 'https://www.klarna.com/us/privacy/' },
      { name: 'Terms of Service', type: 'terms', jurisdiction: 'EU', url: 'https://www.klarna.com/ie/terms-and-conditions/' },
      { name: 'Terms of Service', type: 'terms', jurisdiction: 'US', url: 'https://www.klarna.com/us/terms-of-use/' },
    ],
  },
  {
    name: 'Plaid',
    slug: 'plaid',
    logo: '#0A85EA',
    industry: 'FinTech',
    website: 'https://plaid.com',
    policies: [
      { name: 'Privacy Policy', type: 'privacy', jurisdiction: 'US', url: 'https://plaid.com/legal#end-user-privacy-policy' },
      { name: 'Privacy Policy', type: 'privacy', jurisdiction: 'EU', url: 'https://plaid.com/legal#end-user-privacy-policy' },
      { name: 'End User Services Agreement', type: 'terms', jurisdiction: 'US', url: 'https://plaid.com/legal#end-user-services-agreement-us' },
      { name: 'End User Services Agreement', type: 'terms', jurisdiction: 'EU', url: 'https://plaid.com/legal#end-user-services-agreement-eea' },
    ],
  },
  {
    name: 'OpenAI',
    slug: 'openai',
    logo: '#10A37F',
    industry: 'AI Provider',
    website: 'https://openai.com',
    policies: [
      { name: 'Terms of Use', type: 'terms', jurisdiction: 'Global', url: 'https://openai.com/policies/terms-of-use' },
      { name: 'Privacy Policy', type: 'privacy', jurisdiction: 'EU', url: 'https://openai.com/policies/eu-privacy-policy' },
    ],
  },
  {
    name: 'Amazon',
    slug: 'amazon',
    logo: '#FF9900',
    industry: 'E-Commerce',
    website: 'https://www.amazon.com',
    policies: [
      { name: 'Privacy Notice', type: 'privacy', jurisdiction: 'EU', url: 'https://www.amazon.com/gp/help/customer/display.html?nodeId=GX7NJQ4ZB8MHFRNJ' },
      { name: 'AWS Data Processing Addendum', type: 'dpa', jurisdiction: 'Global', url: 'https://docs.aws.amazon.com/whitepapers/latest/navigating-gdpr-compliance/aws-data-processing-addendum-dpa.html' },
    ],
  },
  {
    name: 'Apple',
    slug: 'apple',
    logo: '#A2AAAD',
    industry: 'Tech Giant',
    website: 'https://www.apple.com',
    policies: [
      { name: 'Privacy Policy', type: 'privacy', jurisdiction: 'EU', url: 'https://www.apple.com/legal/privacy/en-ww/' },
      { name: 'Apple Intelligence & Privacy', type: 'ai', jurisdiction: 'Global', url: 'https://www.apple.com/apple-intelligence/' },
    ],
  },
  {
    name: 'TikTok',
    slug: 'tiktok',
    logo: '#010101',
    industry: 'Social Media',
    website: 'https://www.tiktok.com',
    policies: [
      { name: 'Privacy Policy', type: 'privacy', jurisdiction: 'EU', url: 'https://www.tiktok.com/legal/privacy-policy-eea' },
      { name: 'Community Guidelines', type: 'community', jurisdiction: 'Global', url: 'https://www.tiktok.com/legal/page/global/community-guidelines' },
    ],
  },
  {
    name: 'Zoom',
    slug: 'zoom',
    logo: '#2D8CFF',
    industry: 'Cloud/SaaS',
    website: 'https://zoom.us',
    policies: [
      { name: 'Privacy Statement', type: 'privacy', jurisdiction: 'Global', url: 'https://www.zoom.com/en/trust/privacy/privacy-statement/' },
      { name: 'Terms of Service', type: 'terms', jurisdiction: 'Global', url: 'https://www.zoom.com/en/trust/terms/' },
    ],
  },
  {
    name: 'X (Twitter)',
    slug: 'x-twitter',
    logo: '#000000',
    industry: 'Social Media',
    website: 'https://x.com',
    policies: [
      { name: 'Privacy Policy', type: 'privacy', jurisdiction: 'Global', url: 'https://x.com/en/privacy' },
      { name: 'Terms of Service', type: 'terms', jurisdiction: 'Global', url: 'https://x.com/en/tos' },
    ],
  },
];

const dbPath = sqlitePathFromUrl(databaseUrl);
if (!fs.existsSync(dbPath)) {
  console.error(`Database file does not exist: ${dbPath}`);
  console.error('Run scripts/hostinger-init-db.sh first.');
  process.exit(1);
}

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON');

const stats = {
  companiesCreated: 0,
  companiesUpdated: 0,
  policiesCreated: 0,
  policiesUpdated: 0,
  policiesSkipped: 0,
  checkLogsCreated: 0,
};

const getCompanyBySlug = db.prepare('SELECT id FROM "Company" WHERE "slug" = ?');
const insertCompany = db.prepare(
  `INSERT INTO "Company" ("id", "name", "slug", "logo", "industry", "website", "createdAt", "updatedAt")
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
);
const updateCompany = db.prepare(
  `UPDATE "Company"
   SET "name" = ?, "logo" = ?, "industry" = ?, "website" = ?, "updatedAt" = ?
   WHERE "id" = ?`
);
const getPolicy = db.prepare(
  `SELECT "id", "dataStatus", "ingestionMethod"
   FROM "Policy"
   WHERE "companyId" = ? AND "type" = ? AND "jurisdiction" = ?`
);
const countPolicySourceEvidence = db.prepare(
  `SELECT COUNT(*) AS count
   FROM "PolicyCheckLog"
   WHERE "policyId" = ?
     AND "textHash" IS NOT NULL
     AND "source" IN ('direct', 'http2', 'rendered', 'wayback', 'commoncrawl')`
);
const countPolicyPublicSnapshots = db.prepare(
  `SELECT COUNT(*) AS count
   FROM "PolicySnapshot"
   WHERE "policyId" = ? AND "publicEvidence" = 1`
);
const countPolicyCheckLogs = db.prepare(
  `SELECT COUNT(*) AS count FROM "PolicyCheckLog" WHERE "policyId" = ?`
);
const insertPolicy = db.prepare(
  `INSERT INTO "Policy" (
    "id", "companyId", "name", "type", "url", "jurisdiction",
    "currentText", "currentHash", "dataStatus", "lastCheckDate",
    "lastSuccessfulCheckDate", "ingestionMethod", "createdAt", "updatedAt"
   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Configured', ?, ?, 'Seeded', ?, ?)`
);
const updateSeededPolicy = db.prepare(
  `UPDATE "Policy"
   SET "name" = ?, "url" = ?, "currentText" = ?, "currentHash" = ?,
       "dataStatus" = 'Configured', "ingestionMethod" = 'Seeded',
       "updatedAt" = ?
   WHERE "id" = ?`
);
const insertPolicyCheckLog = db.prepare(
  `INSERT INTO "PolicyCheckLog" (
    "id", "policyId", "status", "checkedAt", "source", "reason",
    "finalUrl", "textHash", "textLength", "createdAt"
   ) VALUES (?, ?, 'Configured', ?, 'seeded', 'inventory_only_initializer', ?, ?, ?, ?)`
);
const countCompanyRows = db.prepare('SELECT COUNT(*) AS count FROM "Company"');
const countPolicyRows = db.prepare('SELECT COUNT(*) AS count FROM "Policy"');
const countSnapshotRows = db.prepare('SELECT COUNT(*) AS count FROM "PolicySnapshot"');
const countChangeRows = db.prepare('SELECT COUNT(*) AS count FROM "PolicyChange"');

db.exec('BEGIN IMMEDIATE');
try {
  for (const company of companies) {
    const timestamp = nowIso();
    let companyId = getCompanyBySlug.get(company.slug)?.id;
    if (!companyId) {
      companyId = randomUUID();
      insertCompany.run(
        companyId,
        company.name,
        company.slug,
        company.logo,
        company.industry,
        company.website,
        timestamp,
        timestamp
      );
      stats.companiesCreated++;
    } else {
      updateCompany.run(company.name, company.logo, company.industry, company.website, timestamp, companyId);
      stats.companiesUpdated++;
    }

    for (const policy of company.policies) {
      const current = getPolicy.get(companyId, policy.type, policy.jurisdiction);
      const text = placeholderText(company.name, policy);
      const hash = sha256(text);
      const policyTimestamp = nowIso();

      if (!current) {
        const policyId = randomUUID();
        insertPolicy.run(
          policyId,
          companyId,
          policy.name,
          policy.type,
          policy.url,
          policy.jurisdiction,
          text,
          hash,
          policyTimestamp,
          policyTimestamp,
          policyTimestamp,
          policyTimestamp
        );
        insertPolicyCheckLog.run(randomUUID(), policyId, policyTimestamp, policy.url, hash, text.length, policyTimestamp);
        stats.policiesCreated++;
        stats.checkLogsCreated++;
        continue;
      }

      const realEvidence = Number(countPolicySourceEvidence.get(current.id)?.count || 0);
      const publicSnapshots = Number(countPolicyPublicSnapshots.get(current.id)?.count || 0);
      const seededIngestion = String(current.ingestionMethod || '').trim().toLowerCase() === 'seeded';

      if (!seededIngestion || realEvidence > 0 || publicSnapshots > 0) {
        stats.policiesSkipped++;
        continue;
      }

      updateSeededPolicy.run(policy.name, policy.url, text, hash, policyTimestamp, current.id);
      stats.policiesUpdated++;

      const checkLogs = Number(countPolicyCheckLogs.get(current.id)?.count || 0);
      if (checkLogs === 0) {
        insertPolicyCheckLog.run(randomUUID(), current.id, policyTimestamp, policy.url, hash, text.length, policyTimestamp);
        stats.checkLogsCreated++;
      }
    }
  }

  db.exec('COMMIT');
} catch (error) {
  db.exec('ROLLBACK');
  throw error;
}

const summary = {
  database: dbPath,
  ...stats,
  totals: {
    companies: Number(countCompanyRows.get()?.count || 0),
    policies: Number(countPolicyRows.get()?.count || 0),
    snapshots: Number(countSnapshotRows.get()?.count || 0),
    changes: Number(countChangeRows.get()?.count || 0),
  },
};

console.log(JSON.stringify(summary, null, 2));
console.log('Inventory initialized as Configured + Seeded. Run the admin Cron Manager in small batches to establish verified baselines.');
