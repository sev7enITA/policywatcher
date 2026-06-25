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

/**
 * Validates the Authorization header Bearer token against API_SECRET.
 */
export function isAuthorized(request: Request | NextRequest): boolean {
  const secret = process.env.API_SECRET;
  if (!secret) {
    console.warn('[Auth] API_SECRET not set. Rejecting all requests.');
    return false;
  }

  // Support both standard Headers (NextRequest) and plain Request objects
  // to allow this guard to work in middleware, route handlers, and tests.
  const authHeader = request.headers instanceof Headers 
    ? request.headers.get('Authorization') 
    : (request as any).headers?.get?.('Authorization');

  if (!authHeader) return false;

  // Expect exactly "Bearer <token>" format — reject malformed headers.
  const parts = authHeader.split(' ');
  if (parts.length !== 2) return false;
  
  const [scheme, token] = parts;
  // Constant-time comparison is not strictly needed here since API_SECRET
  // is a server-only value, but the check is intentionally simple.
  return scheme === 'Bearer' && token === secret;
}
