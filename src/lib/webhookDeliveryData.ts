import { Prisma } from '@prisma/client';
import { db } from './db';
import { publicChangeWhere } from './publicDataGate';
import { buildPublicChangeEventFeed, type PublicChangeEventRow } from './publicChangeEvents';
import {
  deliverWebhookEvent,
  getWebhookRetryDelaySeconds,
  parseWebhookDeliveryConfiguration,
  WEBHOOK_DELIVERY_BOUNDARY,
  WEBHOOK_DELIVERY_MAX_ATTEMPTS,
  type WebhookDeliveryEndpoint,
} from './webhookDelivery';

const DISCOVERY_LIMIT_PER_ENDPOINT = 50;
const DELIVERY_LIMIT_PER_CYCLE = 25;
const PROCESSING_LEASE_MS = 15 * 60 * 1_000;

const eventSelect = {
  id: true,
  publicPublishedAt: true,
  overallRisk: true,
  overallScore: true,
  tldrEn: true,
  tldrIt: true,
  aiSummaryEn: true,
  aiSummaryIt: true,
  policy: {
    select: {
      id: true,
      name: true,
      type: true,
      jurisdiction: true,
      company: { select: { id: true, name: true, slug: true, industry: true } },
    },
  },
} as const;

function buildEvent(row: PublicChangeEventRow, endpoint: WebhookDeliveryEndpoint) {
  return buildPublicChangeEventFeed([row], {
    locale: endpoint.locale,
    limit: 1,
    inputCursor: null,
    hasMore: false,
    initialWindowTruncated: false,
  }).events[0];
}

async function recordDeliveryAttempt(input: {
  deliveryId: string;
  attemptNumber: number;
  attemptedAt: Date;
  outcome: 'delivered' | 'retry' | 'failed';
  statusCode: number | null;
  errorCode: string | null;
  durationMs: number | null;
  nextAttemptAt: Date | null;
  deliveredAt?: Date | null;
}) {
  await db.$transaction([
    db.webhookDeliveryAttempt.create({
      data: {
        deliveryId: input.deliveryId,
        attemptNumber: input.attemptNumber,
        outcome: input.outcome,
        statusCode: input.statusCode,
        errorCode: input.errorCode,
        durationMs: input.durationMs,
        attemptedAt: input.attemptedAt,
      },
    }),
    db.webhookDelivery.update({
      where: { id: input.deliveryId },
      data: {
        status: input.outcome,
        attemptCount: input.attemptNumber,
        nextAttemptAt: input.nextAttemptAt,
        lastStatusCode: input.statusCode,
        lastErrorCode: input.errorCode,
        deliveredAt: input.deliveredAt ?? null,
      },
    }),
  ]);
}

async function enqueueEndpoint(endpoint: WebhookDeliveryEndpoint): Promise<number> {
  const changes = await db.policyChange.findMany({
    where: publicChangeWhere({
      publicPublishedAt: { not: null, gte: new Date(endpoint.startAt) },
      webhookDeliveries: { none: { endpointId: endpoint.id } },
    }) as never,
    select: eventSelect,
    orderBy: [{ publicPublishedAt: 'asc' }, { id: 'asc' }],
    take: DISCOVERY_LIMIT_PER_ENDPOINT,
  }) as unknown as PublicChangeEventRow[];

  let created = 0;
  for (const change of changes) {
    const event = buildEvent(change, endpoint);
    try {
      await db.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          eventId: event.eventId,
          changeId: change.id,
          occurredAt: new Date(event.occurredAt),
          status: 'pending',
          nextAttemptAt: new Date(),
        },
      });
      created += 1;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
    }
  }
  return created;
}

export async function runWebhookDeliveryCycle(now = new Date()) {
  const configuration = parseWebhookDeliveryConfiguration();
  if (!configuration.configured) {
    return { configured: false, enqueued: 0, attempted: 0, delivered: 0, retry: 0, failed: 0, configurationIssues: configuration.issues, boundary: WEBHOOK_DELIVERY_BOUNDARY };
  }
  const activeEndpoints = configuration.endpoints.filter((endpoint) => endpoint.active);
  const endpointById = new Map(activeEndpoints.map((endpoint) => [endpoint.id, endpoint]));

  await db.webhookDelivery.updateMany({
    where: { status: 'processing', updatedAt: { lt: new Date(now.getTime() - PROCESSING_LEASE_MS) } },
    data: { status: 'retry', nextAttemptAt: now, lastErrorCode: 'processing_lease_expired' },
  });

  let enqueued = 0;
  for (const endpoint of activeEndpoints) enqueued += await enqueueEndpoint(endpoint);

  const due = await db.webhookDelivery.findMany({
    where: {
      endpointId: { in: [...endpointById.keys()] },
      OR: [
        { status: 'pending', nextAttemptAt: { lte: now } },
        { status: 'retry', nextAttemptAt: { lte: now } },
      ],
    },
    orderBy: [{ nextAttemptAt: 'asc' }, { createdAt: 'asc' }],
    take: DELIVERY_LIMIT_PER_CYCLE,
  });

  const summary = { configured: true, enqueued, attempted: 0, delivered: 0, retry: 0, failed: 0, configurationIssues: configuration.issues, boundary: WEBHOOK_DELIVERY_BOUNDARY };
  for (const delivery of due) {
    const endpoint = endpointById.get(delivery.endpointId);
    if (!endpoint) continue;
    const claimed = await db.webhookDelivery.updateMany({
      where: { id: delivery.id, status: delivery.status },
      data: { status: 'processing', lastAttemptAt: now },
    });
    if (claimed.count !== 1) continue;
    summary.attempted += 1;
    const attemptCount = delivery.attemptCount + 1;

    const change = await db.policyChange.findFirst({
      where: publicChangeWhere({ id: delivery.changeId, publicPublishedAt: { not: null } }) as never,
      select: eventSelect,
    }) as unknown as PublicChangeEventRow | null;
    if (!change) {
      await recordDeliveryAttempt({ deliveryId: delivery.id, attemptNumber: attemptCount, attemptedAt: now, outcome: 'failed', statusCode: null, errorCode: 'public_evidence_unavailable', durationMs: null, nextAttemptAt: null });
      summary.failed += 1;
      continue;
    }
    const event = buildEvent(change, endpoint);
    if (event.eventId !== delivery.eventId) {
      await recordDeliveryAttempt({ deliveryId: delivery.id, attemptNumber: attemptCount, attemptedAt: now, outcome: 'failed', statusCode: null, errorCode: 'event_identity_mismatch', durationMs: null, nextAttemptAt: null });
      summary.failed += 1;
      continue;
    }

    const result = await deliverWebhookEvent(endpoint, event, { now });
    if (result.delivered) {
      await recordDeliveryAttempt({ deliveryId: delivery.id, attemptNumber: attemptCount, attemptedAt: now, outcome: 'delivered', statusCode: result.statusCode, errorCode: null, durationMs: result.durationMs, nextAttemptAt: null, deliveredAt: now });
      summary.delivered += 1;
      continue;
    }

    const delaySeconds = result.retryable ? getWebhookRetryDelaySeconds(attemptCount) : null;
    const retry = delaySeconds !== null && attemptCount < WEBHOOK_DELIVERY_MAX_ATTEMPTS;
    await recordDeliveryAttempt({
      deliveryId: delivery.id,
      attemptNumber: attemptCount,
      attemptedAt: now,
      outcome: retry ? 'retry' : 'failed',
      statusCode: result.statusCode,
      errorCode: result.errorCode,
      durationMs: result.durationMs,
      nextAttemptAt: retry ? new Date(now.getTime() + delaySeconds * 1_000) : null,
    });
    if (retry) summary.retry += 1;
    else summary.failed += 1;
  }
  return summary;
}

export async function getWebhookDeliveryOperations() {
  const configuration = parseWebhookDeliveryConfiguration();
  const [grouped, recentDeliveries] = await Promise.all([
    db.webhookDelivery.groupBy({ by: ['status'], _count: { _all: true } }),
    db.webhookDelivery.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
  ]);
  const counts = new Map(grouped.map((entry) => [entry.status, entry._count._all]));
  return {
    configured: configuration.configured,
    configurationIssues: configuration.issues,
    endpoints: configuration.endpoints.map(({ id, origin, active, startAt, locale }) => ({ id, origin, active, startAt, locale })),
    metrics: {
      total: grouped.reduce((sum, entry) => sum + entry._count._all, 0),
      pending: counts.get('pending') || 0,
      processing: counts.get('processing') || 0,
      retry: counts.get('retry') || 0,
      delivered: counts.get('delivered') || 0,
      failed: counts.get('failed') || 0,
    },
    recentDeliveries,
    boundary: WEBHOOK_DELIVERY_BOUNDARY,
  };
}

export async function scheduleWebhookDeliveryRetry(deliveryId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(deliveryId)) return null;
  const result = await db.webhookDelivery.updateMany({
    where: { id: deliveryId, status: 'failed', attemptCount: { lt: WEBHOOK_DELIVERY_MAX_ATTEMPTS } },
    data: { status: 'retry', nextAttemptAt: new Date(), lastErrorCode: 'operator_retry_scheduled' },
  });
  return result.count === 1 ? { id: deliveryId, status: 'retry' as const } : null;
}
