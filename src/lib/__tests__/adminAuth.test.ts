import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  COOKIE_NAME,
  clearSessionCookie,
  createSessionToken,
  getSession,
  setSessionCookie,
  validateCredentials,
  verifySessionToken,
} from '../adminAuth';

describe('adminAuth', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('creates and verifies signed admin and auditor session tokens', () => {
    vi.stubEnv('ADMIN_SESSION_HMAC_SECRET', 'session-secret');
    vi.stubEnv('ADMIN_SESSION_VERSION', '1');

    const adminToken = createSessionToken('admin');
    const auditorToken = createSessionToken('auditor');

    expect(verifySessionToken(adminToken)).toEqual({ valid: true, role: 'admin' });
    expect(verifySessionToken(auditorToken)).toEqual({ valid: true, role: 'auditor' });
  });

  it('rejects malformed, tampered, invalid-role, and expired tokens', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-02T00:00:00Z'));
    vi.stubEnv('ADMIN_SESSION_HMAC_SECRET', 'session-secret');
    vi.stubEnv('ADMIN_SESSION_VERSION', '1');

    const token = createSessionToken('admin');
    expect(token).not.toBeNull();
    if (!token) throw new Error('Expected an admin session token.');
    const [, role, timestamp, sessionVersion, signature] = token.split(':');

    expect(verifySessionToken('not-a-token')).toEqual({ valid: false });
    expect(verifySessionToken(`v2:superadmin:${timestamp}:${sessionVersion}:${signature}`)).toEqual({ valid: false });
    expect(verifySessionToken(`v2:${role}:${timestamp}:${sessionVersion}:bad-signature`)).toEqual({ valid: false });
    expect(verifySessionToken(`v2:${role}:not-a-number:${sessionVersion}:${signature}`)).toEqual({ valid: false });

    vi.setSystemTime(new Date('2026-07-03T00:00:01Z'));
    expect(verifySessionToken(token)).toEqual({ valid: false });
  });

  it('invalidates sessions when no signing secret exists', () => {
    vi.stubEnv('ADMIN_SESSION_HMAC_SECRET', '');
    vi.stubEnv('SESSION_HMAC_SECRET', '');
    vi.stubEnv('API_SECRET', '');
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const token = createSessionToken('admin');

    expect(verifySessionToken(token)).toEqual({ valid: false });
    expect(error).toHaveBeenCalledWith('[AdminAuth] ADMIN_SESSION_HMAC_SECRET is not set. Sessions will be invalid.');
  });

  it('does not fall back to API_SECRET for admin session signing', () => {
    vi.stubEnv('ADMIN_SESSION_HMAC_SECRET', '');
    vi.stubEnv('SESSION_HMAC_SECRET', '');
    vi.stubEnv('API_SECRET', 'cron-secret');

    const token = createSessionToken('admin');

    expect(verifySessionToken(token)).toEqual({ valid: false });
  });

  it('revokes existing admin sessions when the configured version changes', () => {
    vi.stubEnv('ADMIN_SESSION_HMAC_SECRET', 'session-secret');
    vi.stubEnv('ADMIN_SESSION_VERSION', 'wave-1');
    const token = createSessionToken('admin');
    expect(verifySessionToken(token)).toMatchObject({ valid: true });

    vi.stubEnv('ADMIN_SESSION_VERSION', 'wave-2');
    expect(verifySessionToken(token)).toEqual({ valid: false });
  });

  it('does not accept the legacy shared secret on managed deployments', () => {
    vi.stubEnv('POLICYWATCHER_DEPLOYMENT_TARGET', 'production');
    vi.stubEnv('SESSION_HMAC_SECRET', 'legacy-shared-secret');
    vi.stubEnv('ADMIN_SESSION_HMAC_SECRET', '');
    vi.stubEnv('ADMIN_SESSION_VERSION', '1');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(createSessionToken('admin')).toBeNull();
  });

  it('validates admin and auditor credentials from environment variables', () => {
    vi.stubEnv('ADMIN_USER', 'root');
    vi.stubEnv('ADMIN_PASSWORD', 'root-pass');
    vi.stubEnv('AUDITOR_USER', 'reviewer');
    vi.stubEnv('AUDITOR_PASSWORD', 'review-pass');

    expect(validateCredentials('root', 'root-pass')).toBe('admin');
    expect(validateCredentials('reviewer', 'review-pass')).toBe('auditor');
    expect(validateCredentials('root', 'wrong')).toBeNull();
    expect(validateCredentials('missing', 'root-pass')).toBeNull();
  });

  it('does not accept default usernames in production when usernames are not configured', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_USER', '');
    vi.stubEnv('ADMIN_PASSWORD', 'root-pass');
    vi.stubEnv('AUDITOR_USER', '');
    vi.stubEnv('AUDITOR_PASSWORD', 'review-pass');

    expect(validateCredentials('admin', 'root-pass')).toBeNull();
    expect(validateCredentials('auditor', 'review-pass')).toBeNull();
  });

  it('tolerates quoted or padded Hostinger environment values', () => {
    vi.stubEnv('ADMIN_USER', ' adm ');
    vi.stubEnv('ADMIN_PASSWORD', '"admin-pass" ');
    vi.stubEnv('AUDITOR_USER', "'auditor'");
    vi.stubEnv('AUDITOR_PASSWORD', ' auditor-pass\n');

    expect(validateCredentials('adm ', 'admin-pass')).toBe('admin');
    expect(validateCredentials('auditor', 'auditor-pass')).toBe('auditor');
    expect(validateCredentials('adm', '"admin-pass"')).toBeNull();
  });

  it('reads, sets, and clears the signed admin session cookie', () => {
    vi.stubEnv('ADMIN_SESSION_HMAC_SECRET', 'session-secret');
    vi.stubEnv('ADMIN_SESSION_VERSION', '1');

    const response = setSessionCookie(NextResponse.json({ success: true }), 'admin');
    const cookie = response.cookies.get(COOKIE_NAME);

    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('strict');
    expect(cookie?.path).toBe('/');
    expect(cookie?.value).toBeTruthy();

    const request = new NextRequest('https://policywatcher.test/admin', {
      headers: { Cookie: `${COOKIE_NAME}=${cookie?.value}` },
    });
    expect(getSession(request)).toEqual({ valid: true, role: 'admin' });

    const cleared = clearSessionCookie(NextResponse.json({ success: true }));
    expect(cleared.cookies.get(COOKIE_NAME)?.value).toBe('');
    expect(cleared.cookies.get(COOKIE_NAME)?.maxAge).toBe(0);
  });
});
