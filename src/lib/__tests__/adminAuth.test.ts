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
    vi.stubEnv('SESSION_HMAC_SECRET', 'session-secret');

    const adminToken = createSessionToken('admin');
    const auditorToken = createSessionToken('auditor');

    expect(verifySessionToken(adminToken)).toEqual({ valid: true, role: 'admin' });
    expect(verifySessionToken(auditorToken)).toEqual({ valid: true, role: 'auditor' });
  });

  it('rejects malformed, tampered, invalid-role, and expired tokens', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-02T00:00:00Z'));
    vi.stubEnv('SESSION_HMAC_SECRET', 'session-secret');

    const token = createSessionToken('admin');
    const [role, timestamp, signature] = token.split(':');

    expect(verifySessionToken('not-a-token')).toEqual({ valid: false });
    expect(verifySessionToken(`superadmin:${timestamp}:${signature}`)).toEqual({ valid: false });
    expect(verifySessionToken(`${role}:${timestamp}:bad-signature`)).toEqual({ valid: false });
    expect(verifySessionToken(`${role}:not-a-number:${signature}`)).toEqual({ valid: false });

    vi.setSystemTime(new Date('2026-07-03T00:00:01Z'));
    expect(verifySessionToken(token)).toEqual({ valid: false });
  });

  it('invalidates sessions when no signing secret exists', () => {
    vi.stubEnv('SESSION_HMAC_SECRET', '');
    vi.stubEnv('API_SECRET', '');
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const token = createSessionToken('admin');

    expect(verifySessionToken(token)).toEqual({ valid: false });
    expect(error).toHaveBeenCalledWith('[AdminAuth] SESSION_HMAC_SECRET/API_SECRET is not set. Sessions will be invalid.');
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

  it('reads, sets, and clears the signed admin session cookie', () => {
    vi.stubEnv('SESSION_HMAC_SECRET', 'session-secret');

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
