import { randomUUID } from 'node:crypto';
import { db } from '../db';
import { sendPolicyChangeAlert } from '../mailer';
import { classifyPolicyChange } from '../changeClassification';
import { normalizePreferenceKey, splitPreferenceKeys } from '../subscriberPreferences';
import { digest } from './document';
import { LEASE_MS } from './store';

/** Database fanout is exactly-once. SMTP acknowledgement is at-least-once; Message-ID is stable. */
export async function outboxStep(send = sendPolicyChangeAlert): Promise<boolean> {
  if (process.env.POLICYWATCHER_SCANS_PAUSED === '1' || process.env.POLICYWATCHER_ENGINE_NOTIFICATIONS !== '1') return false;
  const now = new Date();
  await db.engineOutbox.updateMany({ where: { status: 'sending', leaseExpiresAt: { lte: now }, attempt: { gte: 5 } },
    data: { status: 'failed', lastError: 'outbox_lease_expired', leaseToken: null, leaseExpiresAt: null } });
  await db.engineOutbox.updateMany({ where: { status: 'sending', leaseExpiresAt: { lte: now }, attempt: { lt: 5 } },
    data: { status: 'pending', leaseToken: null, leaseExpiresAt: null } });
  const item = await db.engineOutbox.findFirst({ where: { status: 'pending', nextAttemptAt: { lte: now }, attempt: { lt: 5 } }, orderBy: { createdAt: 'asc' } });
  if (!item) return false;
  const leaseToken = randomUUID();
  const claim = await db.engineOutbox.updateMany({ where: { id: item.id, status: 'pending', attempt: item.attempt },
    data: { status: 'sending', leaseToken, leaseExpiresAt: new Date(Date.now() + LEASE_MS), attempt: { increment: 1 } } });
  if (!claim.count) return true;
  const where = { id: item.id, status: 'sending', leaseToken, leaseExpiresAt: { gt: new Date() } };
  try {
    const change = await db.policyChange.findUniqueOrThrow({ where: { id: item.changeId }, include: {
      policy: { include: { company: true } }, oldSnapshot: true, newSnapshot: true } });
    if (!change.publicEvidence || !change.publicPublishedAt) throw new Error('notification_change_not_public');
    const payload = JSON.parse(item.payloadJson) as { subscriberId?: string };
    const matches = (subscriber: { regions: string; industries: string }) =>
      splitPreferenceKeys(subscriber.regions).includes(normalizePreferenceKey(change.policy.jurisdiction))
      && splitPreferenceKeys(subscriber.industries).includes(normalizePreferenceKey(change.policy.company.industry));
    if (!payload.subscriberId) {
      const subscribers = (await db.subscriber.findMany({ where: { isActive: true, confirmedAt: { not: null }, frequency: 'INSTANT' } })).filter(matches);
      await db.$transaction(async tx => {
        const own = await tx.engineOutbox.updateMany({ where: { ...where, leaseExpiresAt: { gt: new Date() } },
          data: { status: 'delivered', deliveredAt: new Date(), leaseToken: null, leaseExpiresAt: null } });
        if (!own.count) throw new Error('outbox_lease_lost');
        for (const subscriber of subscribers) {
          const eventKey = `${item.eventKey}:subscriber:${subscriber.id}`;
          await tx.engineOutbox.upsert({ where: { eventKey }, create: { eventKey, changeId: change.id,
            payloadJson: JSON.stringify({ subscriberId: subscriber.id }) }, update: {} });
        }
      });
      return true;
    }
    const subscriber = await db.subscriber.findUnique({ where: { id: payload.subscriberId } });
    // Re-check consent/preferences at delivery time, not only at fanout.
    if (subscriber?.isActive && subscriber.confirmedAt && subscriber.frequency === 'INSTANT' && matches(subscriber)) {
      const ok = await send(subscriber.email, subscriber.name || undefined, [{ changeId: change.id,
        classification: classifyPolicyChange(change), companyName: change.policy.company.name, policyName: change.policy.name,
        overallRisk: change.overallRisk, overallScore: change.overallScore, summaryEn: change.aiSummaryEn,
        region: change.policy.jurisdiction, industry: change.policy.company.industry, url: change.policy.url }],
      subscriber.unsubscribeToken, `<pw-${digest(item.eventKey)}@policywatcher.online>`);
      if (!ok) throw new Error('notification_not_acknowledged');
    }
    const delivered = await db.engineOutbox.updateMany({ where: { ...where, leaseExpiresAt: { gt: new Date() } },
      data: { status: 'delivered', deliveredAt: new Date(), leaseToken: null, leaseExpiresAt: null } });
    if (!delivered.count) throw new Error('outbox_lease_lost');
  } catch {
    await db.engineOutbox.updateMany({ where: { id: item.id, status: 'sending', leaseToken }, data: {
      status: item.attempt + 1 >= 5 ? 'failed' : 'pending', lastError: 'notification_delivery_failed', leaseToken: null,
      leaseExpiresAt: null, nextAttemptAt: new Date(Date.now() + 60_000 * 2 ** item.attempt) } });
  }
  return true;
}
