import { existsSync, readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  findGrant: vi.fn(),
  createEvent: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    investorAccessGrant: {
      findUnique: dbMocks.findGrant,
      updateMany: dbMocks.updateMany,
    },
    investorAccessEvent: { create: dbMocks.createEvent },
  },
}));

import {
  createInvestorSessionToken,
  generateInvestorMagicToken,
  hashInvestorMagicToken,
  INVESTOR_ACCESS_TTL_MS,
  INVESTOR_TOKEN_BYTES,
  normalizeInvestorRecipientLabel,
  verifyInvestorSessionToken,
} from '@/lib/investorAccess';
import { resolveInvestorSession, resolveInvestorSessionState } from '@/lib/investorAccessService';
import { evaluateInvestorMutationRequest } from '@/lib/investorMutationBoundary';
import { formatAccessExpiry } from '@/app/admin/executive-study/ExecutiveStudyDocument';

describe('investor token and signed session contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SESSION_HMAC_SECRET = 'test-only-session-secret-with-sufficient-entropy';
  });

  it('generates at least 256 bits and stores a deterministic SHA-256 hash', () => {
    const token = generateInvestorMagicToken();
    expect(Buffer.from(token, 'base64url')).toHaveLength(INVESTOR_TOKEN_BYTES);
    expect(INVESTOR_TOKEN_BYTES).toBeGreaterThanOrEqual(32);
    expect(hashInvestorMagicToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashInvestorMagicToken(token)).not.toContain(token);
  });

  it('normalizes bounded recipient labels and rejects control characters', () => {
    expect(normalizeInvestorRecipientLabel('  Northstar   Ventures  ')).toBe('Northstar Ventures');
    expect(normalizeInvestorRecipientLabel('x')).toBeNull();
    expect(normalizeInvestorRecipientLabel('x'.repeat(121))).toBeNull();
    expect(normalizeInvestorRecipientLabel('Fund\u0007Name')).toBeNull();
  });

  it('binds the session to the grant and exact seven-day expiry', () => {
    const now = Date.UTC(2026, 7, 19, 10, 0, 0);
    const expiry = now + INVESTOR_ACCESS_TTL_MS;
    const token = createInvestorSessionToken('grant-123', expiry, now);
    expect(token).toBeTruthy();
    expect(verifyInvestorSessionToken(token, now + 1_000)).toEqual({
      valid: true,
      grantId: 'grant-123',
      issuedAt: now,
      expiresAt: expiry,
    });
    expect(verifyInvestorSessionToken(token, expiry)).toEqual({ valid: false });
    expect(verifyInvestorSessionToken(`${token}tampered`, now + 1_000)).toEqual({ valid: false });
    expect(createInvestorSessionToken('grant-123', expiry + 1, now)).toBeNull();
  });

  it('formats the investor expiry with a production-safe explicit timezone', () => {
    expect(() => formatAccessExpiry(new Date('2026-08-26T10:00:00.000Z'))).not.toThrow();
    expect(formatAccessExpiry(new Date('2026-08-26T10:00:00.000Z'))).toContain('2026');
  });

  it('rechecks current database expiry and revocation for every investor request', async () => {
    const now = new Date('2026-08-19T10:00:00.000Z');
    const expiresAt = new Date(now.getTime() + INVESTOR_ACCESS_TTL_MS);
    const token = createInvestorSessionToken('grant-123', expiresAt, now.getTime());
    dbMocks.findGrant.mockResolvedValue({ id: 'grant-123', recipientLabel: 'Northstar', expiresAt, revokedAt: null });
    await expect(resolveInvestorSession(token, new Date(now.getTime() + 10_000))).resolves.toMatchObject({ recipientLabel: 'Northstar' });

    dbMocks.findGrant.mockResolvedValue({ id: 'grant-123', recipientLabel: 'Northstar', expiresAt, revokedAt: now });
    await expect(resolveInvestorSession(token, new Date(now.getTime() + 10_000))).resolves.toBeNull();
    await expect(resolveInvestorSessionState(token, new Date(now.getTime() + 10_000))).resolves.toEqual({ ok: false, reason: 'revoked' });

    dbMocks.findGrant.mockResolvedValue({ id: 'grant-123', recipientLabel: 'Northstar', expiresAt: new Date(expiresAt.getTime() - 1), revokedAt: null });
    await expect(resolveInvestorSession(token, new Date(now.getTime() + 10_000))).resolves.toBeNull();
  });
});

describe('investor mutation provenance', () => {
  const base = {
    method: 'POST',
    requestOrigin: 'https://policywatcher.online',
    originHeader: 'https://policywatcher.online',
    fetchSiteHeader: 'same-origin',
    contentTypeHeader: 'application/json',
    contentLengthHeader: '80',
    bodyMode: 'json' as const,
    environment: 'production',
  };

  it('allows same-origin JSON and rejects cross-site, missing provenance and non-JSON bodies', () => {
    expect(evaluateInvestorMutationRequest(base)).toEqual({ allowed: true });
    expect(evaluateInvestorMutationRequest({ ...base, fetchSiteHeader: 'cross-site' })).toMatchObject({ allowed: false, status: 403 });
    expect(evaluateInvestorMutationRequest({ ...base, fetchSiteHeader: null, originHeader: null })).toMatchObject({ allowed: false, status: 403 });
    expect(evaluateInvestorMutationRequest({ ...base, contentTypeHeader: 'text/plain' })).toMatchObject({ allowed: false, status: 415 });
  });
});

describe('investor access wiring and confidentiality boundaries', () => {
  it('enforces admin-only grant management and hides the panel from auditors', () => {
    const adminRoute = readFileSync('src/app/api/admin/investor-access/route.ts', 'utf8');
    const revokeRoute = readFileSync('src/app/api/admin/investor-access/[grantId]/route.ts', 'utf8');
    const dashboard = readFileSync('src/app/admin/page.tsx', 'utf8');
    expect(adminRoute).toContain("session.role !== 'admin'");
    expect(revokeRoute).toContain("session.role !== 'admin'");
    expect(adminRoute).toContain("status: 403");
    expect(dashboard).toContain("metrics.role === 'admin' ? <InvestorAccessPanel /> : null");
  });

  it('clears the fragment before redemption and never navigates with the raw token', () => {
    const client = readFileSync('src/app/investor/access/InvestorAccessClient.tsx', 'utf8');
    const clearIndex = client.indexOf('window.history.replaceState');
    const fetchIndex = client.indexOf("fetch('/api/investor/redeem'");
    expect(client).toContain('window.location.hash');
    expect(clearIndex).toBeGreaterThan(0);
    expect(fetchIndex).toBeGreaterThan(clearIndex);
    expect(client).toContain("window.location.replace('/investor/executive-study')");
    expect(client).toContain("outcome === 'revoked'");
  });

  it('checks the signed session and live database grant before importing the private loader', () => {
    const page = readFileSync('src/app/investor/executive-study/page.tsx', 'utf8');
    expect(page.indexOf('resolveInvestorSession')).toBeLessThan(page.indexOf("await import('@/lib/internalExecutiveStudyServer')"));
    expect(page).toContain("resolution.reason === 'revoked'");
    expect(page).toContain('redirect(`/investor/access?outcome=${outcome}`)');
    expect(page).not.toContain('src/private');
  });

  it('keeps investor surfaces no-store, noindex, no-referrer and frame denied', () => {
    const proxy = readFileSync('src/proxy.ts', 'utf8');
    const page = readFileSync('src/app/investor/access/page.tsx', 'utf8');
    expect(proxy).toContain("request.nextUrl.pathname.startsWith('/investor/')");
    expect(proxy).toContain('applyInvestorResponseHeaders');
    expect(proxy).toContain("frame-ancestors ${isEmbed");
    expect(page).toContain("referrer: 'no-referrer'");
    expect(page).toContain('noarchive: true');
  });

  it('keeps public study routes absent and packages all investor runtime files without private data', () => {
    const packager = readFileSync('scripts/package-release.sh', 'utf8');
    expect(existsSync('src/app/executive-study/page.tsx')).toBe(false);
    expect(existsSync('src/app/strategy/page.tsx')).toBe(false);
    expect(packager).toContain('src/app/investor/access/page.tsx');
    expect(packager).toContain('src/app/investor/executive-study/page.tsx');
    expect(packager).toContain('20260819120000_investor_magic_links/migration.sql');
    expect(packager).toContain('src/private');
    expect(packager).toContain('Archive contains confidential Executive Study material.');
  });

  it('keeps the investor migration, Prisma schema and both Hostinger fallbacks aligned', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf8');
    const migration = readFileSync('prisma/migrations/20260819120000_investor_magic_links/migration.sql', 'utf8');
    const nodeFallback = readFileSync('scripts/hostinger-init-db.mjs', 'utf8');
    const pythonFallback = readFileSync('scripts/hostinger-init-db.py', 'utf8');
    for (const table of ['InvestorAccessGrant', 'InvestorAccessEvent']) {
      expect(schema).toContain(`model ${table}`);
      expect(migration).toContain(`CREATE TABLE "${table}"`);
      expect(nodeFallback).toContain(`CREATE TABLE IF NOT EXISTS "${table}"`);
      expect(pythonFallback).toContain(`CREATE TABLE IF NOT EXISTS "${table}"`);
    }
    for (const index of [
      'InvestorAccessGrant_tokenHash_key',
      'InvestorAccessGrant_expiresAt_idx',
      'InvestorAccessGrant_revokedAt_idx',
      'InvestorAccessGrant_createdAt_idx',
      'InvestorAccessEvent_grantId_createdAt_idx',
    ]) {
      expect(migration).toContain(index);
      expect(nodeFallback).toContain(index);
      expect(pythonFallback).toContain(index);
    }
  });

  it('keeps the mobile recipient field single-line and gives ledger overflow one owner', () => {
    const css = readFileSync('src/app/admin/admin.module.css', 'utf8');
    const panel = readFileSync('src/app/admin/InvestorAccessPanel.tsx', 'utf8');
    expect(css).toMatch(/\.investorAccessFieldRow input \{[^}]*height: 44px;[^}]*flex: 0 0 auto;/s);
    expect(css).toMatch(/\.investorLedgerScroller \{[^}]*inline-size: 100%;[^}]*contain: inline-size;[^}]*overflow-x: auto;/s);
    expect(css).toMatch(/\.investorAccessPanel \{[^}]*min-inline-size: 0;[^}]*contain: inline-size;/s);
    expect(panel).toContain('scope="col" aria-label="Access control"');
    expect(panel).not.toContain('<span className={styles.srOnly}>Actions</span>');
  });
});
