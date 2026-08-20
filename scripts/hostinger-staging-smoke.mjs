#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROMOTION_MAX_AGE_MS, STAGING_ORIGIN } from './hostinger-environment-gate.mjs';

export const REQUIRED_STAGING_CHECKS = [
  'homepage',
  'staging-banner',
  'search-engine-boundary',
  'robots-boundary',
  'release-identity',
  'publication-readiness-contract',
  'health-auth-boundary',
  'database-health',
  'admin-authentication',
  'database-readiness',
  'public-dataset',
];

function argument(argv, name) {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

function sha256(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function readReleaseManifest(artifactPath) {
  const raw = execFileSync('unzip', ['-p', artifactPath, 'release-manifest.json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(raw);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, redirect: 'manual', signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function bodyJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON, received ${text.slice(0, 120) || 'an empty body'}.`);
  }
}

async function record(checks, id, action) {
  try {
    const detail = await action();
    checks.push({ id, status: 'passed', detail });
  } catch (error) {
    checks.push({
      id,
      status: 'failed',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

export async function runStagingSmoke({
  artifactPath,
  baseUrl,
  outputPath,
  apiSecret,
  adminUser,
  adminPassword,
  now = new Date(),
}) {
  const origin = new URL(baseUrl).origin;
  if (origin !== STAGING_ORIGIN || baseUrl.replace(/\/$/, '') !== STAGING_ORIGIN) {
    throw new Error(`Staging smoke is restricted to ${STAGING_ORIGIN}.`);
  }
  if (!fs.existsSync(artifactPath)) throw new Error(`Artifact not found: ${artifactPath}`);
  if (!apiSecret || !adminUser || !adminPassword) {
    throw new Error('STAGING_API_SECRET, STAGING_ADMIN_USER and STAGING_ADMIN_PASSWORD are required.');
  }

  const artifactSha256 = sha256(artifactPath);
  const manifest = readReleaseManifest(artifactPath);
  const checks = [];
  let adminCookie = '';

  await record(checks, 'homepage', async () => {
    const response = await fetchWithTimeout(`${origin}/`);
    expect(response.status === 200, `Expected HTTP 200, received ${response.status}.`);
    const html = await response.text();
    expect(
      html.includes(`data-policywatcher-release="${manifest.version}"`),
      `Homepage does not identify release ${manifest.version}.`,
    );
    return `HTTP 200; release ${manifest.version} present in initial HTML.`;
  });

  await record(checks, 'staging-banner', async () => {
    const response = await fetchWithTimeout(`${origin}/`);
    const html = await response.text();
    expect(html.includes('STAGING ENVIRONMENT'), 'Visible staging banner is missing.');
    expect(html.includes('data-deployment-target="staging"'), 'Deployment target marker is missing.');
    return 'Visible staging identity and DOM marker are present.';
  });

  await record(checks, 'search-engine-boundary', async () => {
    const response = await fetchWithTimeout(`${origin}/trust`);
    expect(response.status === 200, `Expected HTTP 200, received ${response.status}.`);
    expect(
      response.headers.get('x-robots-tag') === 'noindex, nofollow, noarchive',
      'Staging X-Robots-Tag is missing or incorrect.',
    );
    return 'Staging pages return noindex, nofollow, noarchive.';
  });

  await record(checks, 'robots-boundary', async () => {
    const response = await fetchWithTimeout(`${origin}/robots.txt`);
    expect(response.status === 200, `Expected HTTP 200, received ${response.status}.`);
    const body = await response.text();
    expect(/Disallow:\s*\//i.test(body), 'robots.txt does not disallow the complete staging site.');
    return 'robots.txt disallows the staging origin.';
  });

  await record(checks, 'release-identity', async () => {
    const response = await fetchWithTimeout(`${origin}/api/v1/manifest`);
    expect(response.status === 200, `Expected HTTP 200, received ${response.status}.`);
    const payload = await bodyJson(response);
    expect(payload?.release === manifest.version, `Expected ${manifest.version}, received ${payload?.release || 'no release'}.`);
    return `Public manifest matches artifact release ${manifest.version}.`;
  });

  await record(checks, 'publication-readiness-contract', async () => {
    const response = await fetchWithTimeout(`${origin}/api/v1/publication-readiness`);
    expect(response.status === 200, `Expected HTTP 200, received ${response.status}.`);
    expect(response.headers.get('cache-control') === 'no-store', 'Publication readiness must not be cached.');
    const payload = await bodyJson(response);
    expect(
      payload?.schema === 'https://policywatcher.online/schemas/publication-readiness/v1',
      'Publication readiness schema identifier is missing or incorrect.',
    );
    expect(payload?.metricId === 'publication-readiness', 'Publication readiness metric identifier is incorrect.');
    expect(payload?.contractVersion === '1.0.0', 'Publication readiness contract version is incorrect.');
    expect(payload?.source === 'database', 'Publication readiness is not identified as database-derived.');
    expect(
      JSON.stringify(payload?.stages?.map((stage) => stage.id))
        === JSON.stringify(['configured', 'retrieved', 'baseline-verified', 'public', 'analysed']),
      'Publication readiness stages are missing or out of order.',
    );
    expect(
      payload?.latestCapture && Object.hasOwn(payload.latestCapture, 'capturedAt'),
      'Publication readiness latest-capture evidence is missing.',
    );
    expect(!/policyText|internalId|rawFailure/i.test(JSON.stringify(payload)), 'Publication readiness leaked a prohibited field.');
    return 'Database-derived publication readiness contract, stage order, no-store boundary and latest capture are valid.';
  });

  await record(checks, 'health-auth-boundary', async () => {
    const response = await fetchWithTimeout(`${origin}/api/health`);
    expect(response.status === 401, `Expected HTTP 401, received ${response.status}.`);
    return 'Operational health rejects unauthenticated requests.';
  });

  await record(checks, 'database-health', async () => {
    const response = await fetchWithTimeout(`${origin}/api/health`, {
      headers: { Authorization: `Bearer ${apiSecret}` },
    });
    expect(response.status === 200, `Expected HTTP 200, received ${response.status}.`);
    const payload = await bodyJson(response);
    expect(payload?.status === 'ok', `Health status is ${payload?.status || 'missing'}.`);
    expect(payload?.database?.configured === true, 'DATABASE_URL is not explicitly configured.');
    expect(payload?.database?.exists === true, 'Staging database file does not exist.');
    expect(payload?.database?.readable === true && payload?.database?.writable === true, 'Staging database is not readable and writable.');
    expect(payload?.database?.companyCount > 0, 'Staging database has no companies.');
    return `${payload.database.companyCount} companies; database is configured, readable and writable.`;
  });

  await record(checks, 'admin-authentication', async () => {
    const response = await fetchWithTimeout(`${origin}/api/admin/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
        'Sec-Fetch-Site': 'same-origin',
      },
      body: JSON.stringify({ username: adminUser, password: adminPassword }),
    });
    expect(response.status === 200, `Expected HTTP 200, received ${response.status}.`);
    const cookie = (response.headers.get('set-cookie') || '').split(';')[0];
    expect(cookie.startsWith('pw_admin_session='), 'Admin session cookie was not issued.');
    adminCookie = cookie;
    return 'Dedicated staging administrator can establish a signed session.';
  });

  await record(checks, 'database-readiness', async () => {
    expect(adminCookie, 'Admin authentication did not produce a session cookie.');
    const response = await fetchWithTimeout(`${origin}/api/admin/database-readiness`, {
      headers: { Cookie: adminCookie },
    });
    expect(response.status === 200, `Expected HTTP 200, received ${response.status}.`);
    const payload = await bodyJson(response);
    expect(payload?.status === 'ready', `Database readiness is ${payload?.status || 'missing'}.`);
    expect(payload?.database?.provider === 'sqlite', `Expected SQLite staging provider, received ${payload?.database?.provider || 'missing'}.`);
    expect(
      payload?.schema?.presentTableCount === 31 && payload?.schema?.expectedTableCount === 31,
      `Expected 31/31 tables, received ${payload?.schema?.presentTableCount ?? '?'}/${payload?.schema?.expectedTableCount ?? '?'}.`,
    );
    expect(
      payload?.schema?.appliedMigrationCount === 14 && payload?.schema?.expectedMigrationCount === 14,
      `Expected 14/14 migrations, received ${payload?.schema?.appliedMigrationCount ?? '?'}/${payload?.schema?.expectedMigrationCount ?? '?'}.`,
    );
    expect(payload?.integrity?.quickCheck === 'ok', `Database integrity is ${payload?.integrity?.quickCheck || 'missing'}.`);
    return `${payload.schema?.presentTableCount ?? '?'} tables and ${payload.schema?.appliedMigrationCount ?? '?'} migrations reported ready.`;
  });

  await record(checks, 'public-dataset', async () => {
    const response = await fetchWithTimeout(`${origin}/api/companies`);
    expect(response.status === 200, `Expected HTTP 200, received ${response.status}.`);
    const payload = await bodyJson(response);
    expect(Array.isArray(payload), 'Expected a public company array.');
    if (payload.length > 0) {
      return `${payload.length} public companies pass the staging evidence gate.`;
    }

    const knowledgeResponse = await fetchWithTimeout(`${origin}/knowledge`);
    expect(knowledgeResponse.status === 200, `Expected /knowledge HTTP 200, received ${knowledgeResponse.status}.`);
    const knowledgeHtml = await knowledgeResponse.text();
    expect(
      knowledgeHtml.includes('empty publication state')
        && knowledgeHtml.includes('Configured or withheld records are not included'),
      'The public dataset is empty without the explicit fail-closed publication boundary.',
    );
    return '0 public companies; the public knowledge page explicitly reports the fail-closed empty publication state.';
  });

  const missingChecks = REQUIRED_STAGING_CHECKS.filter((id) => !checks.some((check) => check.id === id));
  const failedChecks = checks.filter((check) => check.status !== 'passed');
  const status = missingChecks.length === 0 && failedChecks.length === 0 ? 'passed' : 'failed';
  const report = {
    contractVersion: '1.2.0',
    target: 'staging',
    status,
    release: manifest.version,
    releaseName: manifest.releaseName,
    sourceRevision: manifest.sourceRevision,
    sourceState: manifest.sourceState,
    artifact: path.basename(artifactPath),
    artifactSha256,
    stagingOrigin: origin,
    checkedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + PROMOTION_MAX_AGE_MS).toISOString(),
    checks,
    missingChecks,
    boundary: 'This report verifies one staging deployment and one immutable artifact. It does not authorize production automatically or attest third-party service availability.',
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  return report;
}

async function runCli() {
  const argv = process.argv.slice(2);
  const artifactArg = argument(argv, '--artifact');
  const baseUrl = argument(argv, '--base-url') || process.env.SMOKE_BASE_URL || '';
  if (!artifactArg) throw new Error('--artifact is required.');
  const artifactPath = path.resolve(artifactArg);
  const outputPath = path.resolve(argument(argv, '--output') || `${artifactPath}.staging-verification.json`);
  const report = await runStagingSmoke({
    artifactPath,
    baseUrl,
    outputPath,
    apiSecret: process.env.STAGING_API_SECRET,
    adminUser: process.env.STAGING_ADMIN_USER,
    adminPassword: process.env.STAGING_ADMIN_PASSWORD,
  });
  console.log(`Staging verification: ${report.status}`);
  console.log(`Artifact SHA-256: ${report.artifactSha256}`);
  console.log(`Report: ${outputPath}`);
  if (report.status !== 'passed') process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
