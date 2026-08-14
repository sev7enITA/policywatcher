#!/usr/bin/env node
/** Read-only Hostinger inventory audit. Never mutates the SQLite database. */
import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

function sqlitePathFromUrl(value) {
  const raw = value.slice('file:'.length);
  return raw.startsWith('./') || raw.startsWith('../')
    ? path.resolve(process.cwd(), 'prisma', raw)
    : raw;
}

function acquisitionKey(value) {
  try {
    const url = new URL(value);
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '');
    const sorted = [...url.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
    url.search = '';
    for (const [key, item] of sorted) url.searchParams.append(key, item);
    return url.toString();
  } catch {
    return value.trim();
  }
}

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl?.startsWith('file:')) {
  console.error('DATABASE_URL must be a file: SQLite URL.');
  process.exit(1);
}
const dbPath = sqlitePathFromUrl(databaseUrl);
if (!fs.existsSync(dbPath)) {
  console.error(`Database file does not exist: ${dbPath}`);
  process.exit(1);
}

const db = new DatabaseSync(dbPath, { readOnly: true });
try {
  const policies = db.prepare(`
    SELECT p.id, c.name AS company, p.name AS policy, p.jurisdiction, p.url, p.retrievalUrl,
           p.dataStatus, p.lastCheckDate, p.lastSuccessfulCheckDate,
           EXISTS(
             SELECT 1 FROM PolicySnapshot s
             WHERE s.policyId = p.id AND s.publicEvidence = 1
           ) AS hasPublicEvidence
    FROM Policy p JOIN Company c ON c.id = p.companyId
    ORDER BY c.name, p.name, p.jurisdiction
  `).all();

  const groups = new Map();
  for (const policy of policies) {
    const key = acquisitionKey(policy.retrievalUrl || policy.url);
    groups.set(key, [...(groups.get(key) || []), policy]);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    databasePath: dbPath,
    readOnly: true,
    summary: {
      policyRecords: policies.length,
      uniqueRetrievalKeys: groups.size,
      duplicateRetrievalGroups: [...groups.values()].filter((rows) => rows.length > 1).length,
      publicEvidencePolicies: policies.filter((policy) => policy.hasPublicEvidence).length,
      withheldPolicies: policies.filter((policy) => !policy.hasPublicEvidence).length,
    },
    duplicateRetrievalGroups: [...groups.entries()]
      .filter(([, rows]) => rows.length > 1)
      .map(([retrievalKey, rows]) => ({ retrievalKey, records: rows })),
    policiesWithoutPublicEvidence: policies.filter((policy) => !policy.hasPublicEvidence),
  };

  console.log(JSON.stringify(report, null, 2));
} finally {
  db.close();
}
