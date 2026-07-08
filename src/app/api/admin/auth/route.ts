/**
 * Admin Authentication API
 *
 * POST /api/admin/auth - Login with username/password, returns session cookie.
 * DELETE /api/admin/auth - Logout, clears session cookie.
 *
 * Security:
 *  - Rate limited: 5 attempts per minute per IP (brute force protection)
 *  - Constant-time password comparison (timing attack prevention)
 *  - Intentional delay on failed login (enumeration prevention)
 *  - HTTP-only signed cookie (XSS prevention)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  hasSessionSigningSecret,
  validateCredentials,
  setSessionCookie,
  clearSessionCookie,
} from '@/lib/adminAuth';
import { rateLimit } from '@/lib/rateLimit';
import { AdminAccessEvent, recordAdminAccess } from '@/lib/adminAccessLog';

function trackAccess(input: {
  event: AdminAccessEvent;
  request: NextRequest;
  username?: string;
  actorRole?: string;
  detail?: string;
}) {
  void recordAdminAccess(input);
}

/**
 * Authenticates admin/auditor credentials and sets a signed session cookie.
 * Rate limited to 5 attempts per minute to prevent brute force attacks.
 */
export async function POST(request: NextRequest) {
  // Strict rate limit on login: 5 attempts per minute per IP
  const limited = rateLimit(request, { intervalMs: 60_000, max: 5, name: 'admin-login' });
  if (limited) return limited;

  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      trackAccess({
        event: 'login_failed',
        request,
        username: typeof username === 'string' ? username : undefined,
        detail: 'missing_username_or_password',
      });
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    const role = validateCredentials(username, password);
    if (!role) {
      // Intentional delay on failed login to slow down brute force attempts
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.warn(`[Admin Auth] Failed login attempt for username: "${username}"`);
      trackAccess({
        event: 'login_failed',
        request,
        username,
        detail: 'invalid_credentials',
      });
      return NextResponse.json(
        { error: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    if (!hasSessionSigningSecret()) {
      trackAccess({
        event: 'config_error',
        request,
        username,
        actorRole: role,
        detail: 'SESSION_HMAC_SECRET_missing',
      });
      return NextResponse.json(
        { error: 'Admin session signing is not configured. Set SESSION_HMAC_SECRET and redeploy.' },
        { status: 503 }
      );
    }

    console.log(`[Admin Auth] Successful login: ${username} (role: ${role})`);
    trackAccess({
      event: 'login_success',
      request,
      username,
      actorRole: role,
    });
    const response = NextResponse.json({ success: true, role });
    return setSessionCookie(response, role);
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400 }
    );
  }
}

/**
 * Clears the admin session cookie (logout).
 */
export async function DELETE(request: NextRequest) {
  trackAccess({
    event: 'logout',
    request,
    detail: 'logout_requested',
  });
  const response = NextResponse.json({ success: true });
  return clearSessionCookie(response);
}
