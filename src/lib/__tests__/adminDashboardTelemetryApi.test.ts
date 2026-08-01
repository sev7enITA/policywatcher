import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  findMany: vi.fn(),
  record: vi.fn(),
}));
vi.mock('@/lib/adminAuth', () => ({ getSession: mocks.session }));
vi.mock('@/lib/db', () => ({ db: { adminDashboardMetricEvent: { findMany: mocks.findMany } } }));
vi.mock('@/lib/rateLimit', () => ({ rateLimit: vi.fn(() => null) }));
vi.mock('@/lib/adminDashboardTelemetryStorage', () => ({ recordAdminDashboardTelemetry: mocks.record }));

import { GET, POST } from '@/app/api/admin/dashboard-telemetry/route';

const visitId = 'e0d8d3af-37f2-4f3f-8d65-635e505bc047';
function post(body: unknown) {
  return new NextRequest('https://policywatcher.online/api/admin/dashboard-telemetry', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
}

describe('admin dashboard telemetry API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.session.mockReturnValue({ valid: true, role: 'auditor' });
    mocks.findMany.mockResolvedValue([]);
    mocks.record.mockResolvedValue('recorded');
  });

  it('requires authentication for GET and POST', async () => {
    mocks.session.mockReturnValue({ valid: false });
    expect((await GET(new NextRequest('https://policywatcher.online/api/admin/dashboard-telemetry'))).status).toBe(401);
    expect((await POST(post({}))).status).toBe(401);
  });

  it('returns bounded aggregate semantics for both protected roles', async () => {
    const response = await GET(new NextRequest('https://policywatcher.online/api/admin/dashboard-telemetry'));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      role: 'auditor', telemetry: { minimumSample: 10, firstActionElapsed: { status: 'measurement-enabled', sample: 0, value: null } },
    });
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: { createdAt: 'desc' },
      take: 5_000,
    }));
  });

  it('derives actor role from the authenticated session and rejects noncanonical or privacy-bearing payloads', async () => {
    const payload = { eventType: 'action-center-cta-attempt', visitId, priorityId: 'scan-stale', destination: '/admin/cron', viewportClass: 'desktop' };
    const accepted = await POST(post(payload));
    expect(accepted.status).toBe(202);
    expect(mocks.record).toHaveBeenCalledWith(expect.objectContaining(payload), 'auditor');

    expect((await POST(post({ ...payload, destination: '/admin/inquiries' }))).status).toBe(400);
    expect((await POST(post({ ...payload, email: 'private@example.test' }))).status).toBe(400);
  });

  it('reports deduplication and requires a prior CTA attempt for arrival confirmation', async () => {
    const payload = { eventType: 'canonical-route-arrival', visitId, priorityId: 'scan-stale', destination: '/admin/cron', viewportClass: 'desktop' };
    mocks.record.mockResolvedValueOnce('arrival-unconfirmed');
    expect((await POST(post(payload))).status).toBe(409);
    mocks.record.mockResolvedValueOnce('deduplicated');
    const duplicate = await POST(post({ ...payload, eventType: 'action-center-cta-attempt' }));
    expect(duplicate.status).toBe(200);
    expect(await duplicate.json()).toMatchObject({ accepted: true, recorded: false });
  });
});
