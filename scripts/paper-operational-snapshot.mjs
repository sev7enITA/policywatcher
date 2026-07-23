#!/usr/bin/env node

/**
 * Capture the public, read-only operational snapshot cited by the arXiv paper.
 *
 * Usage:
 *   node scripts/paper-operational-snapshot.mjs
 *   node scripts/paper-operational-snapshot.mjs --local http://127.0.0.1:3000
 *
 * The script deliberately consumes only public endpoints. It never reads the
 * database, authenticated admin APIs, secrets, or raw policy text.
 */
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const productionBaseUrl = 'https://policywatcher.online';
const localFlagIndex = process.argv.indexOf('--local');
const localBaseUrl = localFlagIndex >= 0 ? process.argv[localFlagIndex + 1] : null;
const outputFlagIndex = process.argv.indexOf('--output');
const repositoryDataDirectory = resolve(process.cwd(), 'docs/paper/data');
const bundledDataDirectory = resolve(process.cwd(), 'data');
const outputPath = outputFlagIndex >= 0
  ? resolve(process.cwd(), process.argv[outputFlagIndex + 1])
  : resolve(
      existsSync(repositoryDataDirectory) ? repositoryDataDirectory : bundledDataDirectory,
      'operational-snapshot-2026-07-11.json'
    );

function cleanBaseUrl(value) {
  return value.replace(/\/$/, '');
}

async function getJson(baseUrl, path) {
  const response = await fetch(`${cleanBaseUrl(baseUrl)}${path}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}`);
  }

  return {
    status: response.status,
    cacheControl: response.headers.get('cache-control'),
    body: await response.json(),
  };
}

function retrievalTotals(rows) {
  const totals = { direct: 0, http2: 0, rendered: 0, archive: 0, seeded: 0, none: 0 };

  for (const row of rows) {
    for (const key of Object.keys(totals)) {
      totals[key] += Number(row.retrievalMix?.[key] ?? 0);
    }
  }

  return totals;
}

function publicCompanyCount(companiesPayload) {
  if (Array.isArray(companiesPayload)) return companiesPayload.length;
  if (Array.isArray(companiesPayload.companies)) return companiesPayload.companies.length;
  if (Array.isArray(companiesPayload.data)) return companiesPayload.data.length;
  return null;
}

async function capture(baseUrl) {
  const [leaderboard, suspensions, changes, companies] = await Promise.all([
    getJson(baseUrl, '/api/leaderboard'),
    getJson(baseUrl, '/api/source-suspensions'),
    getJson(baseUrl, '/api/changes?page=1&pageSize=50'),
    getJson(baseUrl, '/api/companies'),
  ]);

  const summary = leaderboard.body.summary;
  const rows = leaderboard.body.rows;

  return {
    endpoint: cleanBaseUrl(baseUrl),
    endpointResponses: {
      leaderboard: { status: leaderboard.status, cacheControl: leaderboard.cacheControl },
      sourceSuspensions: { status: suspensions.status, cacheControl: suspensions.cacheControl },
      changes: { status: changes.status, cacheControl: changes.cacheControl },
      companies: { status: companies.status, cacheControl: companies.cacheControl },
    },
    metrics: {
      configuredCompanies: summary.companyCount,
      configuredPolicies: summary.policyCount,
      publicEvidencePolicies: summary.verifiedPolicyCount,
      suspendedPolicies: summary.suspendedPolicyCount,
      publicChangeRecords: summary.publicChangeCount,
      rendererBackedPolicies: summary.rendererBackedPolicyCount,
      archiveBackedPolicies: summary.archiveBackedPolicyCount,
      publiclyListedCompanies: publicCompanyCount(companies.body),
      publicApiChangeRecords: changes.body.total,
      publicSuspensionNotices: suspensions.body.total,
      retrievalTotals: retrievalTotals(rows),
    },
    suspendedSources: suspensions.body.sources.map((source) => ({
      company: source.company.name,
      policyName: source.policyName,
      jurisdiction: source.jurisdiction,
      dataStatus: source.dataStatus,
      sourceHost: source.sourceHost,
      suspensionReason: source.suspensionReason,
      lastCheckDate: source.lastCheckDate,
    })),
  };
}

const snapshot = {
  schemaVersion: 1,
  collectedAt: new Date().toISOString(),
  collectionMethod: 'Unauthenticated public PolicyWatcher JSON APIs',
  scope: {
    included: [
      'public evidence availability',
      'retrieval-path inventory',
      'public suspension notices',
      'publicly exposed change-record inventory',
    ],
    excluded: [
      'semantic accuracy of change detection',
      'legal interpretation accuracy',
      'latency distribution',
      'private check logs and raw policy text',
    ],
  },
  production: await capture(productionBaseUrl),
};

if (localBaseUrl) {
  snapshot.localFixture = await capture(localBaseUrl);
}

await mkdir(resolve(outputPath, '..'), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outputPath}`);
console.log(JSON.stringify(snapshot, null, 2));
