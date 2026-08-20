import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import {
  generateInvestorMagicToken,
  hashInvestorMagicToken,
  INVESTOR_ACCESS_TTL_MS,
  normalizeInvestorRecipientLabel,
  verifyInvestorSessionToken,
} from '@/lib/investorAccess';

export type InvestorGrantStatus = 'active' | 'expired' | 'revoked';
export type InvestorAccessEventName = 'create' | 'revoke' | 'redeem' | 'denial' | 'logout';

export interface InvestorGrantView {
  id: string;
  recipientLabel: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  lastAccessedAt: string | null;
  accessCount: number;
  status: InvestorGrantStatus;
}

function boundedDetail(detail: string | undefined): string | null {
  if (!detail) return null;
  return detail.replace(/[^a-z0-9_.:-]/gi, '_').slice(0, 80) || null;
}

function statusFor(grant: { expiresAt: Date; revokedAt: Date | null }, now = new Date()): InvestorGrantStatus {
  if (grant.revokedAt) return 'revoked';
  if (grant.expiresAt.getTime() <= now.getTime()) return 'expired';
  return 'active';
}

function viewFor(grant: {
  id: string;
  recipientLabel: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  lastAccessedAt: Date | null;
  accessCount: number;
}, now = new Date()): InvestorGrantView {
  return {
    id: grant.id,
    recipientLabel: grant.recipientLabel,
    createdAt: grant.createdAt.toISOString(),
    expiresAt: grant.expiresAt.toISOString(),
    revokedAt: grant.revokedAt?.toISOString() || null,
    lastAccessedAt: grant.lastAccessedAt?.toISOString() || null,
    accessCount: grant.accessCount,
    status: statusFor(grant, now),
  };
}

export async function recordInvestorAccessEvent(input: {
  event: InvestorAccessEventName;
  grantId?: string | null;
  actorRole?: string;
  detail?: string;
}): Promise<void> {
  await db.investorAccessEvent.create({
    data: {
      id: randomUUID(),
      grantId: input.grantId || null,
      event: input.event,
      actorRole: input.actorRole?.slice(0, 24) || null,
      detail: boundedDetail(input.detail),
    },
  });
}

export async function listInvestorAccessGrants(now = new Date()): Promise<InvestorGrantView[]> {
  const grants = await db.investorAccessGrant.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      recipientLabel: true,
      createdAt: true,
      expiresAt: true,
      revokedAt: true,
      lastAccessedAt: true,
      accessCount: true,
    },
  });
  return grants.map((grant) => viewFor(grant, now));
}

export async function createInvestorAccessGrant(
  recipientLabelInput: unknown,
  now = new Date(),
): Promise<{ token: string; grant: InvestorGrantView }> {
  const recipientLabel = normalizeInvestorRecipientLabel(recipientLabelInput);
  if (!recipientLabel) throw new Error('INVALID_RECIPIENT_LABEL');

  const id = randomUUID();
  const token = generateInvestorMagicToken();
  const tokenHash = hashInvestorMagicToken(token);
  const expiresAt = new Date(now.getTime() + INVESTOR_ACCESS_TTL_MS);
  const [grant] = await db.$transaction([
    db.investorAccessGrant.create({
      data: {
        id,
        tokenHash,
        recipientLabel,
        createdByRole: 'admin',
        createdAt: now,
        expiresAt,
      },
      select: {
        id: true,
        recipientLabel: true,
        createdAt: true,
        expiresAt: true,
        revokedAt: true,
        lastAccessedAt: true,
        accessCount: true,
      },
    }),
    db.investorAccessEvent.create({
      data: { id: randomUUID(), grantId: id, event: 'create', actorRole: 'admin' },
    }),
  ]);
  return { token, grant: viewFor(grant, now) };
}

export async function revokeInvestorAccessGrant(id: string, now = new Date()): Promise<InvestorGrantView | null> {
  if (!id || id.length > 128) return null;
  return db.$transaction(async (transaction) => {
    const result = await transaction.investorAccessGrant.updateMany({
      where: { id, revokedAt: null, expiresAt: { gt: now } },
      data: { revokedAt: now },
    });
    if (result.count !== 1) return null;
    const grant = await transaction.investorAccessGrant.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        recipientLabel: true,
        createdAt: true,
        expiresAt: true,
        revokedAt: true,
        lastAccessedAt: true,
        accessCount: true,
      },
    });
    await transaction.investorAccessEvent.create({
      data: { id: randomUUID(), grantId: id, event: 'revoke', actorRole: 'admin' },
    });
    return viewFor(grant, now);
  });
}

export type InvestorRedemptionResult =
  | { ok: true; grant: { id: string; recipientLabel: string; expiresAt: Date } }
  | { ok: false; reason: 'invalid' | 'expired' | 'revoked' };

export async function redeemInvestorMagicToken(token: unknown, now = new Date()): Promise<InvestorRedemptionResult> {
  if (typeof token !== 'string' || token.length < 32 || token.length > 256) {
    await recordInvestorAccessEvent({ event: 'denial', detail: 'invalid_token_shape' });
    return { ok: false, reason: 'invalid' };
  }
  const tokenHash = hashInvestorMagicToken(token);
  const grant = await db.investorAccessGrant.findUnique({
    where: { tokenHash },
    select: { id: true, recipientLabel: true, expiresAt: true, revokedAt: true },
  });
  if (!grant) {
    await recordInvestorAccessEvent({ event: 'denial', detail: 'invalid_token' });
    return { ok: false, reason: 'invalid' };
  }
  if (grant.revokedAt) {
    await recordInvestorAccessEvent({ event: 'denial', grantId: grant.id, detail: 'revoked_grant' });
    return { ok: false, reason: 'revoked' };
  }
  if (grant.expiresAt.getTime() <= now.getTime()) {
    await recordInvestorAccessEvent({ event: 'denial', grantId: grant.id, detail: 'expired_grant' });
    return { ok: false, reason: 'expired' };
  }

  const updated = await db.investorAccessGrant.updateMany({
    where: { id: grant.id, revokedAt: null, expiresAt: { gt: now } },
    data: { lastAccessedAt: now, accessCount: { increment: 1 } },
  });
  if (updated.count !== 1) {
    await recordInvestorAccessEvent({ event: 'denial', grantId: grant.id, detail: 'grant_state_changed' });
    return { ok: false, reason: 'revoked' };
  }
  await recordInvestorAccessEvent({ event: 'redeem', grantId: grant.id });
  return { ok: true, grant };
}

export async function resolveInvestorSession(
  sessionToken: string | null | undefined,
  now = new Date(),
): Promise<{ id: string; recipientLabel: string; expiresAt: Date } | null> {
  const result = await resolveInvestorSessionState(sessionToken, now);
  return result.ok ? result.grant : null;
}

export type InvestorSessionResolution =
  | { ok: true; grant: { id: string; recipientLabel: string; expiresAt: Date } }
  | { ok: false; reason: 'invalid' | 'expired' | 'revoked' };

export async function resolveInvestorSessionState(
  sessionToken: string | null | undefined,
  now = new Date(),
): Promise<InvestorSessionResolution> {
  const session = verifyInvestorSessionToken(sessionToken, now.getTime());
  if (!session.valid) return { ok: false, reason: 'invalid' };
  const grant = await db.investorAccessGrant.findUnique({
    where: { id: session.grantId },
    select: { id: true, recipientLabel: true, expiresAt: true, revokedAt: true },
  });
  if (!grant || grant.expiresAt.getTime() !== session.expiresAt) {
    return { ok: false, reason: 'invalid' };
  }
  if (grant.revokedAt) return { ok: false, reason: 'revoked' };
  if (grant.expiresAt.getTime() <= now.getTime()) return { ok: false, reason: 'expired' };
  return { ok: true, grant };
}
