import { NextRequest } from 'next/server';
import { db } from './db';
import { getClientIp } from './rateLimit';

export const ADMIN_ACCESS_LOG_RETENTION_DAYS = 90;

export type AdminAccessEvent =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'session_invalid'
  | 'config_error'
  | 'vps_operation';

interface AdminAccessLogInput {
  event: AdminAccessEvent;
  request: NextRequest;
  username?: string;
  actorRole?: string;
  detail?: string;
}

function normalizeUserAgent(value: string | null): string | null {
  if (!value) return null;
  return value.length > 500 ? `${value.slice(0, 497)}...` : value;
}

export function maskIpAddress(ipAddress: string | null | undefined): string | null {
  if (!ipAddress) return null;

  const value = ipAddress.trim();
  if (!value || value === 'unknown') return value || null;

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) {
    return value.replace(/\.\d{1,3}$/, '.xxx');
  }

  if (value.includes(':')) {
    const parts = value.split(':');
    for (let index = parts.length - 1; index >= 0; index -= 1) {
      if (parts[index]) {
        parts[index] = 'xxxx';
        return parts.join(':');
      }
    }
    return 'xxxx';
  }

  return value;
}

export async function cleanupOldAdminAccessLogs(
  now: Date = new Date(),
  retentionDays = ADMIN_ACCESS_LOG_RETENTION_DAYS
): Promise<number> {
  const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
  const result = await db.adminAccessLog.deleteMany({
    where: {
      createdAt: { lt: cutoff },
    },
  });
  return result.count;
}

export async function recordAdminAccess(input: AdminAccessLogInput): Promise<void> {
  const ipAddress = maskIpAddress(getClientIp(input.request));
  const userAgent = normalizeUserAgent(input.request.headers.get('user-agent'));
  const path = input.request.nextUrl.pathname;
  const method = input.request.method;

  try {
    await Promise.race([
      db.adminAccessLog.create({
        data: {
          event: input.event,
          username: input.username || null,
          actorRole: input.actorRole || null,
          ipAddress,
          userAgent,
          path,
          method,
          detail: input.detail || null,
        },
      }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('admin_access_log_timeout')), 1_000);
      }),
    ]);
  } catch (error) {
    console.warn('[AdminAccessLog] DB write failed, falling back to console log:', {
      event: input.event,
      username: input.username,
      actorRole: input.actorRole,
      ipAddress,
      userAgent,
      path,
      method,
      detail: input.detail,
      error: error instanceof Error ? error.message : 'unknown error',
    });
  }
}
