#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HOSTINGER_DEPLOYMENT_TARGETS = ['staging', 'production'];
export const HOSTINGER_GATE_PHASES = ['build', 'runtime'];
export const STAGING_ORIGIN = 'https://staging.policywatcher.online';
export const PRODUCTION_ORIGIN = 'https://policywatcher.online';
export const PROMOTION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const PROMOTION_CLOCK_SKEW_MS = 5 * 60 * 1000;

const HEX_SHA256 = /^[a-f0-9]{64}$/i;
const FALSE_VALUES = new Set(['', '0', 'false', 'no', 'off']);

function normalized(value) {
  if (typeof value !== 'string') return '';
  let result = value.trim();
  if (
    result.length >= 2
    && ((result.startsWith('"') && result.endsWith('"'))
      || (result.startsWith("'") && result.endsWith("'")))
  ) {
    result = result.slice(1, -1).trim();
  }
  return result;
}

function isDisabled(value) {
  return FALSE_VALUES.has(normalized(value).toLowerCase());
}

function cleanOrigin(value) {
  const candidate = normalized(value);
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash) return null;
    if (parsed.pathname !== '/' && parsed.pathname !== '') return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function sqlitePath(value) {
  const candidate = normalized(value);
  if (!candidate.startsWith('file:')) return null;
  const rawPath = candidate.slice('file:'.length);
  return path.isAbsolute(rawPath) ? path.normalize(rawPath) : null;
}

function requireValue(errors, environment, key) {
  if (!normalized(environment[key])) errors.push(`${key} is required.`);
}

function requireSecretLength(errors, environment, key, minimum) {
  const value = normalized(environment[key]);
  if (!value) {
    errors.push(`${key} is required.`);
  } else if (value.length < minimum) {
    errors.push(`${key} must contain at least ${minimum} characters.`);
  }
}

function validateSharedEnvironment(errors, environment, expectedOrigin) {
  const appOrigin = cleanOrigin(environment.APP_URL);
  const publicOrigin = cleanOrigin(environment.NEXT_PUBLIC_APP_URL);
  if (appOrigin !== expectedOrigin) errors.push(`APP_URL must be exactly ${expectedOrigin}.`);
  if (publicOrigin !== expectedOrigin) errors.push(`NEXT_PUBLIC_APP_URL must be exactly ${expectedOrigin}.`);

  requireValue(errors, environment, 'ADMIN_USER');
  requireSecretLength(errors, environment, 'ADMIN_PASSWORD', 16);
  requireSecretLength(errors, environment, 'API_SECRET', 32);
  requireSecretLength(errors, environment, 'SESSION_HMAC_SECRET', 32);

  const apiSecret = normalized(environment.API_SECRET);
  const sessionSecret = normalized(environment.SESSION_HMAC_SECRET);
  if (apiSecret && sessionSecret && apiSecret === sessionSecret) {
    errors.push('API_SECRET and SESSION_HMAC_SECRET must be different.');
  }

  const releaseSha = normalized(environment.POLICYWATCHER_RELEASE_SHA256);
  if (!HEX_SHA256.test(releaseSha)) {
    errors.push('POLICYWATCHER_RELEASE_SHA256 must be the 64-character SHA-256 of the candidate ZIP.');
  }

  for (const key of [
    'ALLOW_DATABASE_SEED_ENDPOINT',
    'ALLOW_SEEDED_PUBLIC_DATA',
    'ADMIN_MUTATION_ALLOW_MISSING_PROVENANCE',
    'ALLOW_DEMO_AI_FALLBACK',
  ]) {
    if (!isDisabled(environment[key])) errors.push(`${key} must be unset or false.`);
  }
}

export function validateHostingerEnvironment({
  target,
  phase = 'build',
  environment = process.env,
  now = new Date(),
} = {}) {
  const normalizedTarget = normalized(target || environment.POLICYWATCHER_DEPLOYMENT_TARGET).toLowerCase();
  const normalizedPhase = normalized(phase).toLowerCase();
  const errors = [];
  const warnings = [];

  if (!HOSTINGER_DEPLOYMENT_TARGETS.includes(normalizedTarget)) {
    return {
      target: normalizedTarget || null,
      ok: false,
      errors: ['POLICYWATCHER_DEPLOYMENT_TARGET must be staging or production.'],
      warnings,
    };
  }

  if (!HOSTINGER_GATE_PHASES.includes(normalizedPhase)) {
    return {
      target: normalizedTarget,
      phase: normalizedPhase || null,
      ok: false,
      errors: ['Hostinger environment gate phase must be build or runtime.'],
      warnings,
    };
  }

  if (normalized(environment.POLICYWATCHER_DEPLOYMENT_TARGET).toLowerCase() !== normalizedTarget) {
    errors.push(`POLICYWATCHER_DEPLOYMENT_TARGET must be exactly ${normalizedTarget}.`);
  }

  const expectedOrigin = normalizedTarget === 'staging' ? STAGING_ORIGIN : PRODUCTION_ORIGIN;
  validateSharedEnvironment(errors, environment, expectedOrigin);

  const databasePath = sqlitePath(environment.DATABASE_URL);
  if (!databasePath) {
    errors.push('DATABASE_URL must be an absolute SQLite file: path outside the extracted release.');
  } else if (normalizedTarget === 'staging') {
    const lowerPath = databasePath.toLowerCase();
    if (!lowerPath.includes('staging') || lowerPath.endsWith('/production.db')) {
      errors.push('Staging DATABASE_URL must point to a dedicated staging path and must not end in production.db.');
    }
  } else if (!databasePath.endsWith('/domains/policywatcher.online/policywatcher-data/production.db')) {
    errors.push('Production DATABASE_URL must end in /domains/policywatcher.online/policywatcher-data/production.db.');
  }

  if (normalizedTarget === 'staging') {
    for (const key of [
      'SMTP_HOST',
      'SMTP_USER',
      'SMTP_PASS',
      'POLICYWATCHER_WEBHOOK_ENDPOINTS_JSON',
      'VPS_AGENT_URL',
      'VPS_AGENT_SECRET',
    ]) {
      if (normalized(environment[key])) errors.push(`${key} must be unset in staging to prevent external delivery or operations.`);
    }
    if (normalized(environment.GEMINI_API_KEY)) {
      warnings.push('GEMINI_API_KEY is configured in staging; run AI scans only as an explicit controlled test.');
    }
  } else {
    requireValue(errors, environment, 'GEMINI_API_KEY');
    const verifiedSha = normalized(environment.POLICYWATCHER_STAGING_VERIFIED_SHA256);
    const releaseSha = normalized(environment.POLICYWATCHER_RELEASE_SHA256);
    if (!HEX_SHA256.test(verifiedSha)) {
      errors.push('POLICYWATCHER_STAGING_VERIFIED_SHA256 must contain the SHA-256 approved in staging.');
    } else if (HEX_SHA256.test(releaseSha) && verifiedSha.toLowerCase() !== releaseSha.toLowerCase()) {
      errors.push('Production artifact SHA-256 does not match the staging-verified SHA-256.');
    }

    const verifiedAtRaw = normalized(environment.POLICYWATCHER_STAGING_VERIFIED_AT);
    const verifiedAt = new Date(verifiedAtRaw);
    const ageMs = now.getTime() - verifiedAt.getTime();
    if (!verifiedAtRaw || Number.isNaN(verifiedAt.getTime())) {
      errors.push('POLICYWATCHER_STAGING_VERIFIED_AT must be a valid ISO-8601 timestamp.');
    } else if (
      normalizedPhase === 'build'
      && (ageMs < -PROMOTION_CLOCK_SKEW_MS || ageMs > PROMOTION_MAX_AGE_MS)
    ) {
      errors.push('The staging verification is expired or dated in the future; rerun it before production promotion.');
    }
  }

  return {
    target: normalizedTarget,
    phase: normalizedPhase,
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

function parseTarget(argv) {
  const index = argv.indexOf('--target');
  return index >= 0 ? argv[index + 1] : undefined;
}

function parsePhase(argv) {
  const index = argv.indexOf('--phase');
  return index >= 0 ? argv[index + 1] : undefined;
}

function runCli() {
  const argv = process.argv.slice(2);
  const result = validateHostingerEnvironment({
    target: parseTarget(argv),
    phase: parsePhase(argv) || 'build',
  });
  if (!result.ok) {
    console.error(`Hostinger ${result.target || 'deployment'} ${result.phase || 'unknown'} environment gate failed:`);
    for (const error of result.errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(`Hostinger ${result.target} ${result.phase} environment gate passed.`);
  for (const warning of result.warnings) console.warn(`Warning: ${warning}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runCli();
}
