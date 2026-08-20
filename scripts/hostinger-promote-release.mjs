#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROMOTION_MAX_AGE_MS, STAGING_ORIGIN } from './hostinger-environment-gate.mjs';
import { REQUIRED_STAGING_CHECKS } from './hostinger-staging-smoke.mjs';

const SUPPORTED_STAGING_VERIFICATION_CONTRACTS = new Set(['1.0.0', '1.1.0']);

function argument(argv, name) {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

function sha256(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function releaseManifest(artifactPath) {
  const raw = execFileSync('unzip', ['-p', artifactPath, 'release-manifest.json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(raw);
}

export function evaluatePromotion({ artifactPath, report, now = new Date() }) {
  const errors = [];
  const manifest = releaseManifest(artifactPath);
  const artifactSha256 = sha256(artifactPath);
  const checkedAt = new Date(report?.checkedAt || '');
  const expiresAt = new Date(report?.expiresAt || '');
  const ageMs = now.getTime() - checkedAt.getTime();

  if (!SUPPORTED_STAGING_VERIFICATION_CONTRACTS.has(report?.contractVersion)) {
    errors.push('Unsupported staging verification contract.');
  }
  if (report?.target !== 'staging' || report?.stagingOrigin !== STAGING_ORIGIN) errors.push('Verification did not run against the approved staging origin.');
  if (report?.status !== 'passed') errors.push('Staging verification did not pass.');
  if (report?.artifactSha256 !== artifactSha256) errors.push('Artifact SHA-256 differs from the staging-verified SHA-256.');
  if (report?.release !== manifest.version) errors.push('Artifact release differs from the staging-verified release.');
  if (report?.sourceRevision !== manifest.sourceRevision) errors.push('Artifact source revision differs from the staging-verified revision.');
  if (Number.isNaN(checkedAt.getTime()) || Number.isNaN(expiresAt.getTime())) {
    errors.push('Verification timestamps are invalid.');
  } else if (ageMs < 0 || ageMs > PROMOTION_MAX_AGE_MS || expiresAt.getTime() < now.getTime()) {
    errors.push('Staging verification is expired or dated in the future.');
  }

  const passedIds = new Set(
    Array.isArray(report?.checks)
      ? report.checks.filter((check) => check?.status === 'passed').map((check) => check.id)
      : [],
  );
  const missingChecks = REQUIRED_STAGING_CHECKS.filter((id) => !passedIds.has(id));
  if (missingChecks.length > 0) errors.push(`Required staging checks are missing: ${missingChecks.join(', ')}.`);

  return { ok: errors.length === 0, errors, manifest, artifactSha256 };
}

function runCli() {
  const argv = process.argv.slice(2);
  const artifactArg = argument(argv, '--artifact');
  const reportArg = argument(argv, '--report');
  const approval = argument(argv, '--approve');
  const approvedBy = argument(argv, '--approved-by') || 'operator';
  if (!artifactArg || !reportArg) throw new Error('--artifact and --report are required.');
  if (approval !== 'STAGING-TO-PRODUCTION') {
    throw new Error('Explicit human approval is required: --approve STAGING-TO-PRODUCTION');
  }

  const artifactPath = path.resolve(artifactArg);
  const reportPath = path.resolve(reportArg);
  if (!fs.existsSync(artifactPath)) throw new Error(`Artifact not found: ${artifactPath}`);
  if (!fs.existsSync(reportPath)) throw new Error(`Verification report not found: ${reportPath}`);
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const evaluation = evaluatePromotion({ artifactPath, report });
  if (!evaluation.ok) {
    for (const error of evaluation.errors) console.error(`- ${error}`);
    process.exit(1);
  }

  const outputPath = path.resolve(argument(argv, '--output') || `${artifactPath}.promotion.json`);
  const promotion = {
    contractVersion: '1.1.0',
    stagingVerificationContractVersion: report.contractVersion,
    productionReady: true,
    release: evaluation.manifest.version,
    releaseName: evaluation.manifest.releaseName,
    sourceRevision: evaluation.manifest.sourceRevision,
    sourceState: evaluation.manifest.sourceState,
    artifact: path.basename(artifactPath),
    artifactSha256: evaluation.artifactSha256,
    stagingOrigin: report.stagingOrigin,
    stagingVerifiedAt: report.checkedAt,
    stagingVerificationExpiresAt: report.expiresAt,
    approvedAt: new Date().toISOString(),
    approvedBy,
    boundary: 'This is an explicit human promotion authorization for the exact staging-verified ZIP checksum. Any code, artifact or environment change requires a new staging verification.',
  };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(promotion, null, 2)}\n`, { mode: 0o600 });

  console.log('Production promotion gate passed.');
  console.log(`Promotion record: ${outputPath}`);
  console.log(`POLICYWATCHER_RELEASE_SHA256=${evaluation.artifactSha256}`);
  console.log(`POLICYWATCHER_STAGING_VERIFIED_SHA256=${evaluation.artifactSha256}`);
  console.log(`POLICYWATCHER_STAGING_VERIFIED_AT=${report.checkedAt}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
