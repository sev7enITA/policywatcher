import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildPressMetricCounts,
  createPressMetricRecord,
  parsePressMetricPayload,
} from '../pressMetrics';

const mocks = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('@/lib/db', () => ({
  db: { pressMetricEvent: { create: mocks.create } },
}));

import { POST } from '@/app/api/press-metrics/route';

const read = (path: string) => readFileSync(path, 'utf8');

describe('privacy-minimized press metrics', () => {
  beforeEach(() => {
    mocks.create.mockReset();
    mocks.create.mockResolvedValue({});
  });

  it('accepts only the documented event and target combinations', () => {
    expect(parsePressMetricPayload({ eventType: 'press_package_download', target: 'en', locale: 'en' })).toEqual({ eventType: 'press_package_download', target: 'en', locale: 'en' });
    expect(parsePressMetricPayload({ eventType: 'press_package_download', target: 'it', locale: 'en' })).not.toBeNull();
    expect(parsePressMetricPayload({ eventType: 'data_room_view', target: 'data-room', locale: 'it' })).not.toBeNull();
    for (const target of ['press', 'fact-checking', 'interview', 'speaking']) {
      expect(parsePressMetricPayload({ eventType: 'press_contact_intent', target, locale: 'en' })).not.toBeNull();
    }
    expect(parsePressMetricPayload({ eventType: 'data_room_view', target: 'press', locale: 'en' })).toBeNull();
    expect(parsePressMetricPayload({ eventType: 'press_contact_intent', target: 'email', locale: 'en' })).toBeNull();
    expect(parsePressMetricPayload({ eventType: 'press_package_download', target: 'en', locale: 'fr' })).toBeNull();
  });

  it('rejects extra or identifying payload fields and persists only four allowed record fields', () => {
    const forbiddenFields = ['ipAddress', 'userAgent', 'referrer', 'query', 'sessionId', 'fingerprint', 'email', 'outlet', 'freeText', 'recipient'];
    for (const field of forbiddenFields) {
      expect(parsePressMetricPayload({ eventType: 'data_room_view', target: 'data-room', locale: 'en', [field]: 'value' })).toBeNull();
    }

    const payload = parsePressMetricPayload({ eventType: 'press_package_download', target: 'en', locale: 'it' });
    expect(payload).not.toBeNull();
    const record = createPressMetricRecord(payload!, new Date('2026-07-27T10:00:00.000Z'));
    expect(Object.keys(record).sort()).toEqual(['createdAt', 'eventType', 'locale', 'target']);
  });

  it('returns 202 without caching and does not add request metadata to the stored record', async () => {
    const response = await POST(new Request('https://policywatcher.online/api/press-metrics?campaign=ignored', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'test-agent',
        Referer: 'https://example.test/story',
      },
      body: JSON.stringify({ eventType: 'press_contact_intent', target: 'interview', locale: 'en' }),
    }));

    expect(response.status).toBe(202);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(mocks.create).toHaveBeenCalledTimes(1);
    const data = mocks.create.mock.calls[0][0].data as Record<string, unknown>;
    expect(Object.keys(data).sort()).toEqual(['createdAt', 'eventType', 'locale', 'target']);
    expect(data).not.toHaveProperty('userAgent');
    expect(data).not.toHaveProperty('referrer');
  });

  it('rejects non-allowlisted and oversized API payloads before persistence', async () => {
    const extraField = await POST(new Request('https://policywatcher.online/api/press-metrics', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'data_room_view', target: 'data-room', locale: 'en', email: 'person@example.test' }),
    }));
    expect(extraField.status).toBe(400);

    const oversized = await POST(new Request('https://policywatcher.online/api/press-metrics', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: 'x'.repeat(300) }),
    }));
    expect(oversized.status).toBe(413);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('builds all-time or trailing aggregate contracts with explicit zero states', () => {
    const counts = buildPressMetricCounts([
      { eventType: 'press_package_download', target: 'en', _count: { _all: 4 } },
      { eventType: 'press_package_download', target: 'it', _count: { _all: 2 } },
      { eventType: 'data_room_view', target: 'data-room', _count: { _all: 9 } },
      { eventType: 'press_contact_intent', target: 'fact-checking', _count: { _all: 3 } },
      { eventType: 'press_contact_intent', target: 'speaking', _count: { _all: 1 } },
    ]);
    expect(counts.pressPackageDownloadIntents).toEqual({ total: 6, en: 4, it: 2 });
    expect(counts.dataRoomViews.total).toBe(9);
    expect(counts.pressContactIntents).toMatchObject({ total: 4, factChecking: 3, speaking: 1, press: 0, interview: 0 });
    expect(buildPressMetricCounts([]).pressPackageDownloadIntents.total).toBe(0);
  });

  it('wires non-blocking client events, protected aggregates and public privacy wording', () => {
    const pressKit = read('src/app/press-kit/PressKitClient.tsx');
    const newsroom = read('src/app/press-kit/NewsroomPageClient.tsx');
    const endpoint = read('src/app/api/press-metrics/route.ts');
    const adminMetrics = read('src/app/api/admin/metrics/route.ts');
    const adminPage = read('src/app/admin/page.tsx');
    const privacy = read('src/app/privacy/page.tsx');

    expect(pressKit).toContain("recordPressMetric('press_package_download', pressPackage.locale, lang)");
    expect(pressKit).toContain("recordPressMetric('press_contact_intent', route.id, lang)");
    expect(newsroom).toContain("recordPressMetric('data_room_view', 'data-room', lang)");
    expect(newsroom).toContain('dataRoomViewRecorded.current');
    expect(read('src/lib/pressMetrics.ts')).toContain("credentials: 'omit'");
    expect(endpoint).toContain('logClientIp: false');
    expect(adminMetrics).toContain('getSession(request)');
    expect(adminMetrics).toContain('trailing30Days: buildPressMetricCounts');
    expect(adminPage).toContain('Aggregate event counts');
    expect(adminMetrics).toContain('not unique visitors');
    expect(adminPage).toContain('{pressNewsroom.boundary}');
    expect(privacy).toContain('Cookie-free newsroom event counting');
    expect(privacy).toContain('Automated traffic can affect all counts');
    expect(privacy).toContain('does not retain an IP address, user agent, referrer, URL query');
  });
});
