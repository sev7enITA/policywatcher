import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  create: vi.fn(),
  ensure: vi.fn(),
  nextDate: vi.fn(),
}));

vi.mock('@/lib/adminAuth', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/db', () => ({ db: { pressMetricEvent: { create: mocks.create } } }));
vi.mock('@/lib/pressMetricStorage', () => ({
  ensurePressMetricStorage: mocks.ensure,
  nextPressMetricEventDate: mocks.nextDate,
}));

import { POST } from '@/app/api/admin/outreach-events/route';

function request(body: unknown) {
  return new Request('https://policywatcher.online/api/admin/outreach-events', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }) as never;
}

function rawRequest(body: string, headers: Record<string, string> = { 'Content-Type': 'application/json' }) {
  return new Request('https://policywatcher.online/api/admin/outreach-events', {
    method: 'POST', headers, body,
  }) as never;
}

describe('protected aggregate outreach operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensure.mockResolvedValue(undefined);
    mocks.create.mockResolvedValue({});
    mocks.nextDate.mockReturnValue(new Date('2026-07-29T12:00:00.000Z'));
  });

  it('rejects unauthenticated and auditor writes', async () => {
    mocks.getSession.mockReturnValueOnce({ valid: false });
    expect((await POST(request({ eventType: 'pitch_sent', target: 'beta13-press-it', locale: 'it' }))).status).toBe(401);
    mocks.getSession.mockReturnValueOnce({ valid: true, role: 'auditor' });
    expect((await POST(request({ eventType: 'pitch_sent', target: 'beta13-press-it', locale: 'it' }))).status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('accepts an admin allowlisted payload and stores only bounded fields', async () => {
    mocks.getSession.mockReturnValue({ valid: true, role: 'admin' });
    const response = await POST(request({ eventType: 'pitch_sent', target: 'beta13-press-it', locale: 'it' }));
    expect(response.status).toBe(202);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.create.mock.calls[0][0].data).toEqual({
      eventType: 'pitch_sent', target: 'beta13-press-it', locale: 'it', createdAt: new Date('2026-07-29T12:00:00.000Z'),
    });
  });

  it('rejects extra fields, arbitrary targets and locale mismatches', async () => {
    mocks.getSession.mockReturnValue({ valid: true, role: 'admin' });
    const invalid = [
      { eventType: 'pitch_sent', target: 'beta13-press-it', locale: 'it', recipient: 'person@example.test' },
      { eventType: 'pitch_sent', target: 'custom-outlet', locale: 'it' },
      { eventType: 'reply_received', target: 'beta13-press-it', locale: 'en' },
    ];
    for (const body of invalid) expect((await POST(request(body))).status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('fails closed for unsupported content types, malformed JSON and oversized bodies', async () => {
    mocks.getSession.mockReturnValue({ valid: true, role: 'admin' });
    expect((await POST(rawRequest('{}', { 'Content-Type': 'text/plain' }))).status).toBe(415);
    expect((await POST(rawRequest('{not-json'))).status).toBe(400);
    expect((await POST(rawRequest(JSON.stringify({ padding: 'x'.repeat(300) })))).status).toBe(413);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('reports aggregate storage failure without exposing database details', async () => {
    mocks.getSession.mockReturnValue({ valid: true, role: 'admin' });
    mocks.ensure.mockRejectedValue(new Error('/private/production.db is locked'));
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await POST(request({ eventType: 'pitch_sent', target: 'beta13-press-it', locale: 'it' }));
    const payload = await response.json() as { error: string };
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(payload).toEqual({ error: 'Event storage unavailable.' });
    expect(JSON.stringify(payload)).not.toContain('production.db');
    expect(errorLog).toHaveBeenCalledWith('[Admin Outreach] Aggregate event write failed.');
  });
});
