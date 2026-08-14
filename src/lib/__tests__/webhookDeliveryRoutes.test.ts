import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getOperations: vi.fn(),
  runCycle: vi.fn(),
  scheduleRetry: vi.fn(),
  isAuthorized: vi.fn(),
}));

vi.mock('@/lib/adminAuth', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/auth', () => ({ isAuthorized: mocks.isAuthorized }));
vi.mock('@/lib/webhookDeliveryData', () => ({
  getWebhookDeliveryOperations: mocks.getOperations,
  runWebhookDeliveryCycle: mocks.runCycle,
  scheduleWebhookDeliveryRetry: mocks.scheduleRetry,
}));

import { GET, PATCH, POST } from '@/app/api/admin/webhook-delivery/route';
import { POST as CRON_POST } from '@/app/api/cron/webhook-delivery/route';

const deliveryId = '11111111-1111-4111-8111-111111111111';

function request(method: string, body?: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('https://policywatcher.online/api/admin/webhook-delivery', {
    method,
    headers: body === undefined ? headers : { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('webhook delivery protected routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getOperations.mockResolvedValue({ configured: false, metrics: { total: 0 }, endpoints: [], configurationIssues: [], recentDeliveries: [], boundary: 'bounded' });
    mocks.runCycle.mockResolvedValue({ configured: true, enqueued: 1, attempted: 1, delivered: 1, retry: 0, failed: 0 });
    mocks.scheduleRetry.mockResolvedValue({ id: deliveryId, status: 'retry' });
  });

  it('permits admin and auditor reads but rejects unauthenticated access', async () => {
    mocks.getSession.mockReturnValueOnce({ valid: false });
    expect((await GET(request('GET'))).status).toBe(403);

    mocks.getSession.mockReturnValueOnce({ valid: true, role: 'auditor' });
    const response = await GET(request('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect((await response.json()).role).toBe('auditor');
  });

  it('allows only an administrator to run a same-origin bounded cycle', async () => {
    mocks.getSession.mockReturnValueOnce({ valid: true, role: 'auditor' });
    expect((await POST(request('POST', {}))).status).toBe(403);

    mocks.getSession.mockReturnValueOnce({ valid: true, role: 'admin' });
    expect((await POST(request('POST', {}, { Origin: 'https://attacker.example' }))).status).toBe(403);

    mocks.getSession.mockReturnValueOnce({ valid: true, role: 'admin' });
    expect((await POST(request('POST', {}, { Origin: 'https://policywatcher.online' }))).status).toBe(200);
    expect(mocks.runCycle).toHaveBeenCalledTimes(1);
  });

  it('validates the retry mutation and never schedules ineligible records', async () => {
    mocks.getSession.mockReturnValue({ valid: true, role: 'admin' });
    expect((await PATCH(request('PATCH', { deliveryId, action: 'retry', note: 'extra' }))).status).toBe(400);
    expect((await PATCH(request('PATCH', { deliveryId, action: 'retry' }, { 'Content-Type': 'text/plain' }))).status).toBe(415);

    mocks.scheduleRetry.mockResolvedValueOnce(null);
    expect((await PATCH(request('PATCH', { deliveryId, action: 'retry' }))).status).toBe(409);
    expect(mocks.scheduleRetry).toHaveBeenCalledWith(deliveryId);
  });

  it('keeps the cron cycle behind the bearer guard', async () => {
    mocks.isAuthorized.mockReturnValueOnce(false);
    expect((await CRON_POST(request('POST'))).status).toBe(401);

    mocks.isAuthorized.mockReturnValueOnce(true);
    const response = await CRON_POST(request('POST'));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
  });
});
