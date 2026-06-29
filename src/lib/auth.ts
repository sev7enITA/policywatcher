/**
 * @module auth
 *
 * Lightweight Bearer-token authentication guard for server-side API routes.
 *
 * Validates incoming requests against the `API_SECRET` environment variable.
 * Used by cron and admin endpoints that must not be publicly accessible.
 * If `API_SECRET` is not set, ALL requests are rejected as a safety default.
 */

import { NextRequest } from 'next/server';
import { timingSafeEqual } from 'crypto';

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Validates the Authorization header Bearer token against API_SECRET.
 */
export function isAuthorized(request: Request | NextRequest): boolean {
  const secret = process.env.API_SECRET;
  if (!secret) {
    console.warn('[Auth] API_SECRET not set. Rejecting all requests.');
    return false;
  }

  const authHeader = request.headers.get('Authorization');

  if (!authHeader) return false;

  // Expect exactly "Bearer <token>" format — reject malformed headers.
  const parts = authHeader.split(' ');
  if (parts.length !== 2) return false;
  
  const [scheme, token] = parts;
  return scheme === 'Bearer' && safeCompare(token, secret);
}
