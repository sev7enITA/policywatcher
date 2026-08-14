import { isIP } from 'node:net';
import { computeWebhookSignature, WEBHOOK_SIGNATURE_VERSION } from './webhookVerification';

export const WEBHOOK_DELIVERY_MAX_ENDPOINTS = 10;
export const WEBHOOK_DELIVERY_MAX_ATTEMPTS = 6;
export const WEBHOOK_DELIVERY_TIMEOUT_MS = 8_000;
export const WEBHOOK_DELIVERY_BOUNDARY =
  'Configured webhook delivery is a deployment-controlled beta pilot for already-public events. It does not provide public endpoint registration, tenant self-service, guaranteed delivery, automatic key rotation, receiver availability assurance or a service-level commitment.';

export interface WebhookDeliveryEndpoint {
  id: string;
  url: string;
  origin: string;
  secret: string;
  startAt: string;
  locale: 'en' | 'it';
  active: boolean;
}

export interface WebhookDeliveryConfigurationIssue {
  code: string;
  detail: string;
}

export interface WebhookDeliveryConfiguration {
  configured: boolean;
  endpoints: WebhookDeliveryEndpoint[];
  issues: WebhookDeliveryConfigurationIssue[];
}

export type WebhookAttemptResult =
  | { delivered: true; statusCode: number; durationMs: number }
  | { delivered: false; retryable: boolean; statusCode: number | null; errorCode: string; durationMs: number };

const ENDPOINT_ID_RE = /^[a-z0-9][a-z0-9_-]{1,47}$/;
const RETRY_DELAYS_SECONDS = [60, 300, 1_800, 7_200, 43_200] as const;

function canonicalTimestamp(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 40) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const canonical = date.toISOString();
  return canonical === value ? canonical : null;
}

function parseAllowedOrigins(raw: string | undefined): Set<string> {
  const origins = new Set<string>();
  for (const entry of (raw || '').split(',').map((item) => item.trim()).filter(Boolean)) {
    try {
      const url = new URL(entry);
      if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) continue;
      if (isIP(url.hostname) || url.hostname === 'localhost' || url.hostname.endsWith('.localhost')) continue;
      origins.add(url.origin);
    } catch {
      // Invalid allowlist entries are ignored and reported by endpoint validation.
    }
  }
  return origins;
}

export function parseWebhookDeliveryConfiguration(
  raw = process.env.POLICYWATCHER_WEBHOOK_ENDPOINTS_JSON,
  allowedOriginsRaw = process.env.POLICYWATCHER_WEBHOOK_ALLOWED_ORIGINS,
): WebhookDeliveryConfiguration {
  if (!raw?.trim()) return { configured: false, endpoints: [], issues: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { configured: false, endpoints: [], issues: [{ code: 'invalid_json', detail: 'Webhook endpoint configuration is not valid JSON.' }] };
  }
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > WEBHOOK_DELIVERY_MAX_ENDPOINTS) {
    return { configured: false, endpoints: [], issues: [{ code: 'invalid_endpoint_count', detail: `Configure between 1 and ${WEBHOOK_DELIVERY_MAX_ENDPOINTS} webhook endpoints.` }] };
  }

  const allowedOrigins = parseAllowedOrigins(allowedOriginsRaw);
  const issues: WebhookDeliveryConfigurationIssue[] = [];
  const endpoints: WebhookDeliveryEndpoint[] = [];
  const ids = new Set<string>();

  parsed.forEach((candidate, index) => {
    const reference = `Endpoint ${index + 1}`;
    if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) {
      issues.push({ code: 'invalid_endpoint', detail: `${reference} must be an object.` });
      return;
    }
    const value = candidate as Record<string, unknown>;
    const allowedKeys = new Set(['id', 'url', 'secret', 'startAt', 'locale', 'active']);
    if (Object.keys(value).some((key) => !allowedKeys.has(key))) {
      issues.push({ code: 'unknown_endpoint_field', detail: `${reference} contains an unsupported field.` });
      return;
    }
    if (typeof value.id !== 'string' || !ENDPOINT_ID_RE.test(value.id) || ids.has(value.id)) {
      issues.push({ code: 'invalid_endpoint_id', detail: `${reference} has an invalid or duplicate ID.` });
      return;
    }
    if (typeof value.secret !== 'string' || value.secret.length < 32 || value.secret.length > 256) {
      issues.push({ code: 'invalid_endpoint_secret', detail: `${reference} requires a 32 to 256 character secret.` });
      return;
    }
    const startAt = canonicalTimestamp(value.startAt);
    if (!startAt) {
      issues.push({ code: 'invalid_start_time', detail: `${reference} requires a canonical ISO activation timestamp.` });
      return;
    }
    if (value.locale !== 'en' && value.locale !== 'it') {
      issues.push({ code: 'invalid_locale', detail: `${reference} supports locale en or it only.` });
      return;
    }
    if (typeof value.active !== 'boolean') {
      issues.push({ code: 'invalid_active_state', detail: `${reference} requires an explicit active boolean.` });
      return;
    }

    let url: URL;
    try {
      if (typeof value.url !== 'string' || value.url.length > 2_048) throw new Error('invalid');
      url = new URL(value.url);
    } catch {
      issues.push({ code: 'invalid_endpoint_url', detail: `${reference} has an invalid destination URL.` });
      return;
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.hash || isIP(url.hostname) || url.hostname === 'localhost' || url.hostname.endsWith('.localhost')) {
      issues.push({ code: 'unsafe_endpoint_url', detail: `${reference} must use an allowlisted public HTTPS origin without credentials or fragments.` });
      return;
    }
    if (!allowedOrigins.has(url.origin)) {
      issues.push({ code: 'origin_not_allowlisted', detail: `${reference} origin is not present in the deployment allowlist.` });
      return;
    }

    ids.add(value.id);
    endpoints.push({
      id: value.id,
      url: url.toString(),
      origin: url.origin,
      secret: value.secret,
      startAt,
      locale: value.locale,
      active: value.active,
    });
  });

  return { configured: endpoints.length > 0 && issues.length === 0, endpoints, issues };
}

export function getWebhookRetryDelaySeconds(attemptCount: number): number | null {
  if (!Number.isInteger(attemptCount) || attemptCount < 1) return null;
  return RETRY_DELAYS_SECONDS[attemptCount - 1] ?? null;
}

export function isRetryableWebhookStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

export function buildWebhookDeliveryHeaders(endpoint: WebhookDeliveryEndpoint, eventId: string, rawBody: string, timestamp: number) {
  const signature = computeWebhookSignature(endpoint.secret, timestamp, rawBody);
  return {
    'Content-Type': 'application/json',
    'User-Agent': 'PolicyWatcher-Webhook/1.0',
    'PolicyWatcher-Event-Id': eventId,
    'PolicyWatcher-Timestamp': String(timestamp),
    'PolicyWatcher-Signature': `${WEBHOOK_SIGNATURE_VERSION}=${signature}`,
  } as const;
}

export async function deliverWebhookEvent(
  endpoint: WebhookDeliveryEndpoint,
  event: { eventId: string } & Record<string, unknown>,
  options: { fetchImpl?: typeof fetch; now?: Date; timeoutMs?: number } = {},
): Promise<WebhookAttemptResult> {
  const fetchImpl = options.fetchImpl || fetch;
  const now = options.now || new Date();
  const timestamp = Math.floor(now.getTime() / 1_000);
  const rawBody = JSON.stringify(event);
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? WEBHOOK_DELIVERY_TIMEOUT_MS);
  try {
    const response = await fetchImpl(endpoint.url, {
      method: 'POST',
      headers: buildWebhookDeliveryHeaders(endpoint, event.eventId, rawBody, timestamp),
      body: rawBody,
      redirect: 'error',
      credentials: 'omit',
      cache: 'no-store',
      signal: controller.signal,
    });
    await response.body?.cancel().catch(() => undefined);
    const durationMs = Date.now() - startedAt;
    if (response.ok) return { delivered: true, statusCode: response.status, durationMs };
    return {
      delivered: false,
      retryable: isRetryableWebhookStatus(response.status),
      statusCode: response.status,
      errorCode: `http_${response.status}`,
      durationMs,
    };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError';
    return {
      delivered: false,
      retryable: true,
      statusCode: null,
      errorCode: timedOut ? 'request_timeout' : 'network_error',
      durationMs: Date.now() - startedAt,
    };
  } finally {
    clearTimeout(timeout);
  }
}
