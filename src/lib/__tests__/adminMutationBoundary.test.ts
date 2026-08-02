import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  AdminMutationRateLimiter,
  evaluateAdminMutationBoundary,
  getAdminMutationRoutePolicy,
} from '../adminMutationBoundary';
import { proxy } from '../../proxy';

function input(overrides: Partial<Parameters<typeof evaluateAdminMutationBoundary>[0]> = {}) {
  return {
    pathname: '/api/admin/companies',
    method: 'POST',
    requestOrigin: 'https://policywatcher.online',
    originHeader: 'https://policywatcher.online',
    fetchSiteHeader: 'same-origin',
    contentTypeHeader: 'application/json',
    contentLengthHeader: '32',
    environment: 'production',
    allowMissingProvenance: false,
    ...overrides,
  };
}

describe('administrative mutation boundary', () => {
  it('accepts a same-origin JSON mutation and ignores safe or public requests', () => {
    expect(evaluateAdminMutationBoundary(input())).toMatchObject({ applies: true, allowed: true });
    expect(evaluateAdminMutationBoundary(input({ method: 'GET' }))).toEqual({ applies: false, allowed: true });
    expect(evaluateAdminMutationBoundary(input({ pathname: '/api/v1/manifest' }))).toEqual({ applies: false, allowed: true });
  });

  it('rejects cross-site fetch metadata even when Origin appears same-origin', () => {
    expect(evaluateAdminMutationBoundary(input({ fetchSiteHeader: 'cross-site' }))).toMatchObject({
      allowed: false,
      reason: 'cross_site_request',
      status: 403,
    });
  });

  it('rejects a mismatched Origin unless the browser asserts exact same-origin provenance', () => {
    expect(evaluateAdminMutationBoundary(input({
      originHeader: 'https://attacker.policywatcher.online',
      fetchSiteHeader: 'same-site',
    }))).toMatchObject({
      allowed: false,
      reason: 'origin_mismatch',
      status: 403,
    });
  });

  it('accepts browser-confirmed same-origin mutations behind a rewriting reverse proxy', () => {
    expect(evaluateAdminMutationBoundary(input({
      requestOrigin: 'http://127.0.0.1:3000',
      originHeader: 'https://policywatcher.online',
      fetchSiteHeader: 'same-origin',
    }))).toMatchObject({ applies: true, allowed: true });
  });

  it('fails closed in production without trustworthy provenance', () => {
    expect(evaluateAdminMutationBoundary(input({ originHeader: null, fetchSiteHeader: null }))).toMatchObject({
      allowed: false,
      reason: 'provenance_missing',
    });
    expect(evaluateAdminMutationBoundary(input({ originHeader: null, fetchSiteHeader: 'same-site' }))).toMatchObject({
      allowed: true,
    });
  });

  it('has an explicit controlled missing-provenance path only outside production', () => {
    expect(evaluateAdminMutationBoundary(input({
      environment: 'test',
      originHeader: null,
      fetchSiteHeader: null,
      allowMissingProvenance: true,
    }))).toMatchObject({ allowed: true });
    expect(evaluateAdminMutationBoundary(input({
      environment: 'production',
      originHeader: null,
      fetchSiteHeader: null,
      allowMissingProvenance: true,
    }))).toMatchObject({ allowed: false, reason: 'provenance_missing' });
  });

  it.each(['-1', '1.5', 'not-a-number', '9007199254740992'])(
    'rejects malformed Content-Length %s',
    (contentLengthHeader) => {
      expect(evaluateAdminMutationBoundary(input({ contentLengthHeader }))).toMatchObject({
        allowed: false,
        reason: 'invalid_content_length',
        status: 400,
      });
    },
  );

  it('enforces an intentionally larger encrypted-backup cap than onboarding', () => {
    const onboarding = getAdminMutationRoutePolicy('/api/admin/source-onboarding', 'POST');
    const encryptedBackup = getAdminMutationRoutePolicy('/api/admin/decrypt-backup', 'POST');
    expect(onboarding.maxBodyBytes).toBe(512 * 1_024);
    expect(encryptedBackup.maxBodyBytes).toBe(32 * 1_024 * 1_024);
    expect(encryptedBackup.maxBodyBytes).toBeGreaterThan(onboarding.maxBodyBytes);

    expect(evaluateAdminMutationBoundary(input({
      pathname: '/api/admin/source-onboarding',
      contentLengthHeader: String(onboarding.maxBodyBytes + 1),
    }))).toMatchObject({ allowed: false, reason: 'payload_too_large', status: 413 });
    expect(evaluateAdminMutationBoundary(input({
      pathname: '/api/admin/decrypt-backup',
      contentLengthHeader: String(onboarding.maxBodyBytes + 1),
    }))).toMatchObject({ allowed: true });
  });

  it('requires JSON for body mutations and permits the known no-body logout', () => {
    expect(evaluateAdminMutationBoundary(input({ contentTypeHeader: 'text/plain' }))).toMatchObject({
      allowed: false,
      reason: 'json_content_type_required',
      status: 415,
    });
    expect(evaluateAdminMutationBoundary(input({
      pathname: '/api/admin/auth',
      method: 'DELETE',
      contentTypeHeader: null,
      contentLengthHeader: null,
    }))).toMatchObject({ allowed: true });
  });

  it('rate limits a process-local key and resets it after the bounded window', () => {
    const limiter = new AdminMutationRateLimiter(1_000, 2, 8);
    expect(limiter.check('admin:route', 1_000).allowed).toBe(true);
    expect(limiter.check('admin:route', 1_100).allowed).toBe(true);
    expect(limiter.check('admin:route', 1_200)).toEqual({ allowed: false, retryAfterSeconds: 1 });
    expect(limiter.check('admin:route', 2_000).allowed).toBe(true);
  });

  it('integrates safe admin response headers without changing page nonce CSP', async () => {
    const adminResponse = proxy(new NextRequest('https://policywatcher.online/api/admin/companies', {
      method: 'POST',
      headers: {
        Origin: 'https://policywatcher.online',
        'Sec-Fetch-Site': 'same-origin',
        'Content-Type': 'application/json',
        'Content-Length': '2',
      },
      body: '{}',
    }));
    expect(adminResponse.headers.get('cache-control')).toBe('private, no-store');
    expect(adminResponse.headers.get('x-content-type-options')).toBe('nosniff');
    expect(adminResponse.headers.get('vary')).toBe('Origin, Sec-Fetch-Site');

    const denied = proxy(new NextRequest('https://policywatcher.online/api/admin/companies', {
      method: 'POST',
      headers: {
        Origin: 'https://attacker.example',
        'Content-Type': 'application/json',
      },
      body: '{}',
    }));
    expect(denied.status).toBe(403);
    await expect(denied.json()).resolves.toMatchObject({ reason: 'origin_mismatch' });

    const pageResponse = proxy(new NextRequest('https://policywatcher.online/press-kit'));
    const officeResponse = proxy(new NextRequest('https://policywatcher.online/office-addin/taskpane'));
    expect(pageResponse.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
    expect(officeResponse.headers.get('content-security-policy')).toContain('frame-ancestors https://*.office.com');
    expect(pageResponse.headers.get('x-middleware-request-x-nonce')).toBeTruthy();
  });

  it('logs only bounded route, method and reason metadata on denial', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    proxy(new NextRequest('https://policywatcher.online/api/admin/companies?token=secret', {
      method: 'POST',
      headers: {
        Origin: 'https://attacker.example',
        Cookie: 'admin_session=secret',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: 'do-not-log' }),
    }));
    expect(warn).toHaveBeenCalledWith('[Admin mutation boundary] request denied', {
      route: '/api/admin/companies',
      method: 'POST',
      reason: 'origin_mismatch',
    });
    expect(JSON.stringify(warn.mock.calls)).not.toContain('secret');
    expect(JSON.stringify(warn.mock.calls)).not.toContain('do-not-log');
  });
});
