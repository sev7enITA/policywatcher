import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

export const INVESTOR_ACCESS_TTL_MS = 7 * 24 * 60 * 60 * 1_000;
export const INVESTOR_SESSION_COOKIE = 'pw_investor_session';
export const INVESTOR_TOKEN_BYTES = 32;
const SESSION_VERSION = 1;
const CLOCK_SKEW_MS = 60_000;

export type InvestorSessionVerification =
  | { valid: true; grantId: string; issuedAt: number; expiresAt: number }
  | { valid: false };

function sessionSecret(): string | null {
  const managedDeployment = ['staging', 'production'].includes(
    process.env.POLICYWATCHER_DEPLOYMENT_TARGET?.trim().toLowerCase() || '',
  );
  const raw = process.env.INVESTOR_SESSION_HMAC_SECRET
    || (!managedDeployment ? process.env.SESSION_HMAC_SECRET : undefined);
  if (typeof raw !== 'string') return null;
  let value = raw.trim();
  if (
    value.length >= 2
    && ((value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value || null;
}

export function hasInvestorSessionSigningSecret(): boolean {
  return Boolean(sessionSecret());
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function sign(payload: string): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function generateInvestorMagicToken(): string {
  return randomBytes(INVESTOR_TOKEN_BYTES).toString('base64url');
}

export function hashInvestorMagicToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function normalizeInvestorRecipientLabel(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length < 2 || normalized.length > 120) return null;
  if (/[\u0000-\u001F\u007F]/.test(normalized)) return null;
  return normalized;
}

export function createInvestorSessionToken(
  grantId: string,
  expiresAt: Date | number,
  now = Date.now(),
): string | null {
  const expiry = expiresAt instanceof Date ? expiresAt.getTime() : expiresAt;
  if (
    !grantId
    || grantId.length > 128
    || !Number.isSafeInteger(expiry)
    || expiry <= now
    || expiry - now > INVESTOR_ACCESS_TTL_MS
  ) {
    return null;
  }

  const payload = Buffer.from(JSON.stringify({
    v: SESSION_VERSION,
    gid: grantId,
    iat: now,
    exp: expiry,
  }), 'utf8').toString('base64url');
  const signature = sign(payload);
  return signature ? `v${SESSION_VERSION}.${payload}.${signature}` : null;
}

export function verifyInvestorSessionToken(
  token: string | null | undefined,
  now = Date.now(),
): InvestorSessionVerification {
  if (!token) return { valid: false };
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== `v${SESSION_VERSION}`) return { valid: false };
  const [, payload, providedSignature] = parts;
  const expectedSignature = sign(payload);
  if (!expectedSignature || !constantTimeEqual(providedSignature, expectedSignature)) return { valid: false };

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      v?: unknown;
      gid?: unknown;
      iat?: unknown;
      exp?: unknown;
    };
    if (
      parsed.v !== SESSION_VERSION
      || typeof parsed.gid !== 'string'
      || parsed.gid.length < 1
      || parsed.gid.length > 128
      || !Number.isSafeInteger(parsed.iat)
      || !Number.isSafeInteger(parsed.exp)
    ) {
      return { valid: false };
    }
    const issuedAt = parsed.iat as number;
    const expiresAt = parsed.exp as number;
    if (
      issuedAt > now + CLOCK_SKEW_MS
      || expiresAt <= now
      || expiresAt <= issuedAt
      || expiresAt - issuedAt > INVESTOR_ACCESS_TTL_MS
    ) {
      return { valid: false };
    }
    return { valid: true, grantId: parsed.gid, issuedAt, expiresAt };
  } catch {
    return { valid: false };
  }
}

export function setInvestorSessionCookie(
  response: NextResponse,
  grantId: string,
  expiresAt: Date,
  now = Date.now(),
): NextResponse {
  const token = createInvestorSessionToken(grantId, expiresAt, now);
  if (!token) throw new Error('Investor session signing is unavailable.');
  const maxAge = Math.max(1, Math.min(
    Math.floor((expiresAt.getTime() - now) / 1_000),
    INVESTOR_ACCESS_TTL_MS / 1_000,
  ));
  response.cookies.set(INVESTOR_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  });
  return response;
}

export function clearInvestorSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(INVESTOR_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
