import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { NextRequest } from 'next/server';
import robots from '../../app/robots';
import { proxy } from '../../proxy';
import {
  validateHostingerEnvironment,
} from '../../../scripts/hostinger-environment-gate.mjs';

const sha = 'a'.repeat(64);
const originalTarget = process.env.POLICYWATCHER_DEPLOYMENT_TARGET;

afterEach(() => {
  if (originalTarget === undefined) delete process.env.POLICYWATCHER_DEPLOYMENT_TARGET;
  else process.env.POLICYWATCHER_DEPLOYMENT_TARGET = originalTarget;
});

function stagingEnvironment(): NodeJS.ProcessEnv {
  return {
    POLICYWATCHER_DEPLOYMENT_TARGET: 'staging',
    POLICYWATCHER_RELEASE_SHA256: sha,
    APP_URL: 'https://staging.policywatcher.online',
    NEXT_PUBLIC_APP_URL: 'https://staging.policywatcher.online',
    DATABASE_URL: 'file:/home/user/domains/staging.policywatcher.online/policywatcher-staging-data/staging.db',
    ADMIN_USER: 'staging-admin',
    ADMIN_PASSWORD: 'staging-password-long',
    API_SECRET: 'a-unique-staging-api-secret-value-123456',
    ADMIN_SESSION_HMAC_SECRET: 'a-different-staging-admin-session-secret-123456',
    INVESTOR_SESSION_HMAC_SECRET: 'a-different-staging-investor-secret-123456',
    ADMIN_SESSION_VERSION: '1',
    TRUSTED_CLIENT_IP_HEADER: 'x-hostinger-client-ip',
  };
}

function productionEnvironment(): NodeJS.ProcessEnv {
  return {
    POLICYWATCHER_DEPLOYMENT_TARGET: 'production',
    POLICYWATCHER_RELEASE_SHA256: sha,
    POLICYWATCHER_STAGING_VERIFIED_SHA256: sha,
    POLICYWATCHER_STAGING_VERIFIED_AT: '2026-08-17T10:00:00.000Z',
    APP_URL: 'https://policywatcher.online',
    NEXT_PUBLIC_APP_URL: 'https://policywatcher.online',
    DATABASE_URL: 'file:/home/user/domains/policywatcher.online/policywatcher-data/production.db',
    ADMIN_USER: 'production-admin',
    ADMIN_PASSWORD: 'production-password-long',
    API_SECRET: 'a-unique-production-api-secret-value-123456',
    ADMIN_SESSION_HMAC_SECRET: 'a-different-production-admin-session-secret-123456',
    INVESTOR_SESSION_HMAC_SECRET: 'a-different-production-investor-secret-123456',
    ADMIN_SESSION_VERSION: '1',
    TRUSTED_CLIENT_IP_HEADER: 'x-hostinger-client-ip',
    GEMINI_API_KEY: 'configured-production-key',
  };
}

describe('Hostinger staging-to-production gate', () => {
  it('accepts a separated staging configuration', () => {
    const result = validateHostingerEnvironment({
      target: 'staging',
      environment: stagingEnvironment(),
    });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('blocks production paths and delivery integrations in staging', () => {
    const environment = stagingEnvironment();
    environment.DATABASE_URL = 'file:/home/user/domains/policywatcher.online/policywatcher-data/production.db';
    environment.SMTP_HOST = 'smtp.example.test';
    const result = validateHostingerEnvironment({ target: 'staging', environment });
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('dedicated staging path');
    expect(result.errors.join(' ')).toContain('SMTP_HOST must be unset');
  });

  it('requires exactly one verified proxy identity source', () => {
    const missing = stagingEnvironment();
    delete missing.TRUSTED_CLIENT_IP_HEADER;
    const missingResult = validateHostingerEnvironment({ target: 'staging', environment: missing });
    expect(missingResult.ok).toBe(false);
    expect(missingResult.errors.join(' ')).toContain('TRUSTED_CLIENT_IP_HEADER');

    const ambiguous = stagingEnvironment();
    ambiguous.TRUST_PROXY_HEADERS = 'true';
    const ambiguousResult = validateHostingerEnvironment({ target: 'staging', environment: ambiguous });
    expect(ambiguousResult.ok).toBe(false);
    expect(ambiguousResult.errors.join(' ')).toContain('exactly one');
  });

  it('requires a recent matching staging checksum for production', () => {
    const valid = validateHostingerEnvironment({
      target: 'production',
      phase: 'build',
      environment: productionEnvironment(),
      now: new Date('2026-08-17T11:00:00.000Z'),
    });
    expect(valid.ok).toBe(true);

    const environment = productionEnvironment();
    environment.POLICYWATCHER_STAGING_VERIFIED_SHA256 = 'b'.repeat(64);
    environment.POLICYWATCHER_STAGING_VERIFIED_AT = '2026-08-15T10:00:00.000Z';
    const invalid = validateHostingerEnvironment({
      target: 'production',
      phase: 'build',
      environment,
      now: new Date('2026-08-17T11:00:00.000Z'),
    });
    expect(invalid.ok).toBe(false);
    expect(invalid.errors.join(' ')).toContain('does not match');
    expect(invalid.errors.join(' ')).toContain('expired');
  });

  it('allows bounded clock skew during production builds', () => {
    const environment = productionEnvironment();
    environment.POLICYWATCHER_STAGING_VERIFIED_AT = '2026-08-17T11:03:00.000Z';
    const result = validateHostingerEnvironment({
      target: 'production',
      phase: 'build',
      environment,
      now: new Date('2026-08-17T11:00:00.000Z'),
    });
    expect(result.ok).toBe(true);
  });

  it('keeps exact promotion evidence at runtime without expiring an approved release', () => {
    const environment = productionEnvironment();
    const valid = validateHostingerEnvironment({
      target: 'production',
      phase: 'runtime',
      environment,
      now: new Date('2026-09-17T11:00:00.000Z'),
    });
    expect(valid.ok).toBe(true);

    environment.POLICYWATCHER_STAGING_VERIFIED_SHA256 = 'b'.repeat(64);
    const mismatched = validateHostingerEnvironment({
      target: 'production',
      phase: 'runtime',
      environment,
      now: new Date('2026-09-17T11:00:00.000Z'),
    });
    expect(mismatched.ok).toBe(false);
    expect(mismatched.errors.join(' ')).toContain('does not match');
  });

  it('marks every staging response as non-indexable and disallows robots', () => {
    process.env.POLICYWATCHER_DEPLOYMENT_TARGET = 'staging';
    const response = proxy(new NextRequest('https://staging.policywatcher.online/trust'));
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow, noarchive');
    expect(robots()).toEqual({ rules: [{ userAgent: '*', disallow: '/' }] });
  });

  it('excludes confidential Executive Study inputs from every Hostinger archive', () => {
    const packager = readFileSync('scripts/package-release.sh', 'utf8');
    expect(packager).toContain('find "${STAGING_DIR}/src/private" -depth -delete');
    expect(packager).toContain('Archive contains confidential Executive Study material.');
    expect(packager).toContain('reports/policywatcher-executive-mba');
    expect(packager).toContain('internal-previews');
  });

  it('gates managed Hostinger builds before preparing the external database', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
      scripts: Record<string, string>;
    };
    const managedBuild = readFileSync('scripts/hostinger-managed-build.mjs', 'utf8');

    expect(packageJson.scripts.build).toBe('node scripts/hostinger-managed-build.mjs');
    expect(managedBuild).toContain("'--phase',\n    'build'");
    expect(managedBuild).toContain("run('bash', [path.join(APP_DIR, 'scripts', 'prepare-database.sh')])");
    expect(managedBuild.indexOf('hostinger-environment-gate.mjs'))
      .toBeLessThan(managedBuild.indexOf('prepare-database.sh'));
  });

  it('requires the authoritative publication-readiness contract in staging smoke', () => {
    const smoke = readFileSync('scripts/hostinger-staging-smoke.mjs', 'utf8');
    const promotion = readFileSync('scripts/hostinger-promote-release.mjs', 'utf8');

    expect(smoke).toContain("'publication-readiness-contract'");
    expect(smoke).toContain('/api/v1/publication-readiness');
    expect(smoke).toContain('https://policywatcher.online/schemas/publication-readiness/v1');
    expect(smoke).toContain("response.headers.get('cache-control') === 'no-store'");
    expect(smoke).toContain("['configured', 'retrieved', 'baseline-verified', 'public', 'analysed']");
    expect(smoke).toContain('payload?.schema?.presentTableCount === 31');
    expect(smoke).toContain('payload?.schema?.appliedMigrationCount === 16');
    expect(smoke).toContain("payload?.integrity?.quickCheck === 'ok'");
    expect(smoke).toContain("contractVersion: '1.2.0'");
    expect(promotion).toContain("['1.0.0', '1.1.0', '1.2.0']");
  });
});
