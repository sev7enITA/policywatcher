/**
 * @module adminAuth
 *
 * Session-based authentication for the admin dashboard.
 *
 * Uses HMAC-SHA256 signed cookies to store the session. The cookie payload
 * includes the role (admin or auditor) and a timestamp. SESSION_HMAC_SECRET
 * is mandatory and deliberately separate from API_SECRET.
 *
 * Two roles are supported:
 *   - **admin**: full read/write access (cron, company management, etc.)
 *   - **auditor**: read-only access (metrics, KPI audit, dataset QA, explainability)
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

/** Role type for admin dashboard users. */
export type AdminRole = 'admin' | 'auditor';

/** Result of session verification. */
export interface SessionResult {
  valid: boolean;
  role?: AdminRole;
}

/** Cookie name used for admin sessions. */
const COOKIE_NAME = 'pw_admin_session';

/** Session TTL: 24 hours in milliseconds. */
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Signs a payload string with HMAC-SHA256 using SESSION_HMAC_SECRET.
 * @param payload - The string to sign.
 * @returns Hex-encoded HMAC signature.
 */
function getSigningSecret(): string | null {
  const secret = normalizeConfiguredSecret(process.env.SESSION_HMAC_SECRET);
  if (!secret) {
    console.error('[AdminAuth] SESSION_HMAC_SECRET is not set. Sessions will be invalid.');
    return null;
  }
  return secret;
}

export function hasSessionSigningSecret(): boolean {
  return Boolean(getSigningSecret());
}

function sign(payload: string): string | null {
  const secret = getSigningSecret();
  if (!secret) return null;
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Performs a constant-time string comparison to prevent timing attacks.
 * Both strings are compared as UTF-8 buffers of equal length.
 */
function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Hostinger and similar panels sometimes preserve pasted wrapping quotes or
 * trailing whitespace in environment variables. Normalize only configuration
 * edges; never log the resulting values.
 */
function normalizeConfiguredSecret(value: string | undefined): string | null {
  if (typeof value !== 'string') return null;

  let normalized = value.trim();
  if (
    normalized.length >= 2 &&
    ((normalized.startsWith('"') && normalized.endsWith('"')) ||
      (normalized.startsWith("'") && normalized.endsWith("'")))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }

  return normalized || null;
}

function normalizedCandidates(value: string | undefined): string[] {
  if (typeof value !== 'string') return [];
  const normalized = normalizeConfiguredSecret(value);
  return [...new Set([value, normalized].filter((candidate): candidate is string => Boolean(candidate)))];
}

function matchesConfiguredValue(provided: string, configured: string | undefined): boolean {
  const providedCandidates = [...new Set([provided, provided.trim()])];
  return providedCandidates.some((input) =>
    normalizedCandidates(configured).some((expected) => safeCompare(input, expected))
  );
}

/**
 * Creates a signed session cookie value.
 * Format: `role:timestamp:signature`
 *
 * @param role - The admin role to encode.
 * @returns The cookie value string.
 */
export function createSessionToken(role: AdminRole): string | null {
  const timestamp = Date.now().toString();
  const payload = `${role}:${timestamp}`;
  const signature = sign(payload);
  if (!signature) return null;
  return `${payload}:${signature}`;
}

/**
 * Verifies a session cookie value.
 * Checks both the HMAC signature and the TTL.
 *
 * @param token - The raw cookie value.
 * @returns Session result with validity and role.
 */
export function verifySessionToken(token: string | null | undefined): SessionResult {
  if (!token) return { valid: false };
  const parts = token.split(':');
  if (parts.length !== 3) return { valid: false };

  const [role, timestamp, providedSig] = parts;
  if (role !== 'admin' && role !== 'auditor') return { valid: false };

  // Verify signature
  const payload = `${role}:${timestamp}`;
  const expectedSig = sign(payload);
  if (!expectedSig) return { valid: false };
  if (!safeCompare(providedSig, expectedSig)) return { valid: false };

  // Verify TTL
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Date.now() - ts > SESSION_TTL_MS) return { valid: false };

  return { valid: true, role: role as AdminRole };
}

/**
 * Validates credentials against environment variables.
 *
 * @param username - Provided username.
 * @param password - Provided password.
 * @returns The role if valid, or null.
 */
export function validateCredentials(username: string, password: string): AdminRole | null {
  const adminUser = normalizeConfiguredSecret(process.env.ADMIN_USER) || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD;
  const auditorUser = normalizeConfiguredSecret(process.env.AUDITOR_USER) || 'auditor';
  const auditorPass = process.env.AUDITOR_PASSWORD;
  const providedUser = username.trim();

  if (providedUser === adminUser && matchesConfiguredValue(password, adminPass)) return 'admin';
  if (providedUser === auditorUser && matchesConfiguredValue(password, auditorPass)) return 'auditor';

  return null;
}

/**
 * Extracts and verifies the admin session from a request's cookies.
 *
 * @param request - The incoming Next.js request.
 * @returns Session result with validity and role.
 */
export function getSession(request: NextRequest): SessionResult {
  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie?.value) return { valid: false };
  return verifySessionToken(cookie.value);
}

/**
 * Sets the session cookie on a response.
 *
 * @param response - The NextResponse to modify.
 * @param role - The admin role.
 * @returns The modified response.
 */
export function setSessionCookie(response: NextResponse, role: AdminRole): NextResponse {
  const token = createSessionToken(role);
  if (!token) {
    throw new Error('SESSION_HMAC_SECRET is not configured.');
  }
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_TTL_MS / 1000,
    path: '/',
  });
  return response;
}

/**
 * Clears the session cookie on a response.
 *
 * @param response - The NextResponse to modify.
 * @returns The modified response.
 */
export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  return response;
}

/** The cookie name constant, exported for middleware usage. */
export { COOKIE_NAME };
