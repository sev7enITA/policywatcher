import { describe, expect, it, vi } from 'vitest';
import {
  buildWebhookDeliveryHeaders,
  deliverWebhookEvent,
  getWebhookRetryDelaySeconds,
  isRetryableWebhookStatus,
  parseWebhookDeliveryConfiguration,
  WEBHOOK_DELIVERY_BOUNDARY,
} from '../webhookDelivery';
import { verifyWebhookSignature } from '../webhookVerification';

const secret = '0123456789abcdef0123456789abcdef';
const rawConfig = JSON.stringify([{
  id: 'grc-pilot',
  url: 'https://receiver.example/hooks/policywatcher',
  secret,
  startAt: '2026-07-30T00:00:00.000Z',
  locale: 'en',
  active: true,
}]);

describe('configured webhook delivery contract', () => {
  it('accepts an exact allowlisted HTTPS destination and retains secrets only in private configuration', () => {
    const result = parseWebhookDeliveryConfiguration(rawConfig, 'https://receiver.example');
    expect(result).toMatchObject({ configured: true, issues: [] });
    expect(result.endpoints[0]).toMatchObject({
      id: 'grc-pilot',
      origin: 'https://receiver.example',
      secret,
      active: true,
      locale: 'en',
    });
    expect(WEBHOOK_DELIVERY_BOUNDARY).toMatch(/deployment-controlled beta pilot/i);
  });

  it('fails closed for malformed, unallowlisted, private-address and extended configuration', () => {
    expect(parseWebhookDeliveryConfiguration('{', '')).toMatchObject({ configured: false, issues: [{ code: 'invalid_json' }] });
    expect(parseWebhookDeliveryConfiguration(rawConfig, '')).toMatchObject({ configured: false, issues: [{ code: 'origin_not_allowlisted' }] });
    const privateTarget = rawConfig.replace('https://receiver.example/hooks/policywatcher', 'https://127.0.0.1/hooks');
    expect(parseWebhookDeliveryConfiguration(privateTarget, 'https://127.0.0.1')).toMatchObject({ configured: false, issues: [{ code: 'unsafe_endpoint_url' }] });
    const extended = JSON.stringify([{ ...JSON.parse(rawConfig)[0], note: 'not accepted' }]);
    expect(parseWebhookDeliveryConfiguration(extended, 'https://receiver.example')).toMatchObject({ configured: false, issues: [{ code: 'unknown_endpoint_field' }] });
  });

  it('builds a receiver-compatible signature over the exact serialized event', () => {
    const endpoint = parseWebhookDeliveryConfiguration(rawConfig, 'https://receiver.example').endpoints[0];
    const rawBody = '{"eventId":"pwe_7d94a2e87c1f1af16a93"}';
    const headers = buildWebhookDeliveryHeaders(endpoint, 'pwe_7d94a2e87c1f1af16a93', rawBody, 1_785_326_400);
    expect(headers['PolicyWatcher-Event-Id']).toBe('pwe_7d94a2e87c1f1af16a93');
    expect(verifyWebhookSignature({
      secret,
      timestamp: 1_785_326_400,
      rawBody,
      signatureHeader: headers['PolicyWatcher-Signature'],
      nowSeconds: 1_785_326_400,
    })).toMatchObject({ valid: true });
  });

  it('classifies bounded retry delays and terminal HTTP responses', () => {
    expect([1, 2, 3, 4, 5, 6].map(getWebhookRetryDelaySeconds)).toEqual([60, 300, 1_800, 7_200, 43_200, null]);
    expect(isRetryableWebhookStatus(408)).toBe(true);
    expect(isRetryableWebhookStatus(429)).toBe(true);
    expect(isRetryableWebhookStatus(503)).toBe(true);
    expect(isRetryableWebhookStatus(400)).toBe(false);
  });

  it('records 2xx, retryable and terminal attempts without reading response content', async () => {
    const endpoint = parseWebhookDeliveryConfiguration(rawConfig, 'https://receiver.example').endpoints[0];
    const event = { eventId: 'pwe_7d94a2e87c1f1af16a93', eventType: 'policy.change.published' };
    const delivered = await deliverWebhookEvent(endpoint, event, { fetchImpl: vi.fn(async () => new Response(null, { status: 204 })) as typeof fetch });
    const retry = await deliverWebhookEvent(endpoint, event, { fetchImpl: vi.fn(async () => new Response('ignored', { status: 429 })) as typeof fetch });
    const failed = await deliverWebhookEvent(endpoint, event, { fetchImpl: vi.fn(async () => new Response('ignored', { status: 400 })) as typeof fetch });
    expect(delivered).toMatchObject({ delivered: true, statusCode: 204 });
    expect(retry).toMatchObject({ delivered: false, retryable: true, errorCode: 'http_429' });
    expect(failed).toMatchObject({ delivered: false, retryable: false, errorCode: 'http_400' });
    expect(JSON.stringify([delivered, retry, failed])).not.toContain('ignored');
  });

  it('reduces network failures to a bounded code without persisting an exception message', async () => {
    const endpoint = parseWebhookDeliveryConfiguration(rawConfig, 'https://receiver.example').endpoints[0];
    const result = await deliverWebhookEvent(endpoint, { eventId: 'pwe_7d94a2e87c1f1af16a93' }, {
      fetchImpl: vi.fn(async () => { throw new Error('secret internal resolver detail'); }) as typeof fetch,
    });
    expect(result).toMatchObject({ delivered: false, retryable: true, statusCode: null, errorCode: 'network_error' });
    expect(JSON.stringify(result)).not.toContain('resolver');
  });
});
