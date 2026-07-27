export const PRESS_METRIC_TARGETS = {
  press_package_download: ['en', 'it'],
  data_room_view: ['data-room'],
  press_contact_intent: ['press', 'fact-checking', 'interview', 'speaking'],
} as const;

export type PressMetricEventType = keyof typeof PRESS_METRIC_TARGETS;
export type PressMetricLocale = 'en' | 'it';
export type PressMetricTarget = (typeof PRESS_METRIC_TARGETS)[PressMetricEventType][number];

export interface PressMetricPayload {
  eventType: PressMetricEventType;
  target: PressMetricTarget;
  locale: PressMetricLocale;
}

export interface PressMetricGroup {
  eventType: string;
  target: string;
  _count: { _all: number };
}

export interface PressMetricCounts {
  pressPackageDownloadIntents: { total: number; en: number; it: number };
  dataRoomViews: { total: number };
  pressContactIntents: {
    total: number;
    press: number;
    factChecking: number;
    interview: number;
    speaking: number;
  };
}

const PAYLOAD_KEYS = ['eventType', 'target', 'locale'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function parsePressMetricPayload(value: unknown): PressMetricPayload | null {
  if (!isRecord(value)) return null;
  const keys = Object.keys(value);
  if (keys.length !== PAYLOAD_KEYS.length || keys.some((key) => !PAYLOAD_KEYS.includes(key as typeof PAYLOAD_KEYS[number]))) {
    return null;
  }

  const { eventType, target, locale } = value;
  if (typeof eventType !== 'string' || !(eventType in PRESS_METRIC_TARGETS)) return null;
  if (locale !== 'en' && locale !== 'it') return null;
  if (typeof target !== 'string') return null;
  const allowedTargets = PRESS_METRIC_TARGETS[eventType as PressMetricEventType] as readonly string[];
  if (!allowedTargets.includes(target)) return null;

  return { eventType: eventType as PressMetricEventType, target: target as PressMetricTarget, locale };
}

export function createPressMetricRecord(payload: PressMetricPayload, createdAt: Date) {
  return {
    eventType: payload.eventType,
    target: payload.target,
    locale: payload.locale,
    createdAt,
  };
}

export function emptyPressMetricCounts(): PressMetricCounts {
  return {
    pressPackageDownloadIntents: { total: 0, en: 0, it: 0 },
    dataRoomViews: { total: 0 },
    pressContactIntents: { total: 0, press: 0, factChecking: 0, interview: 0, speaking: 0 },
  };
}

export function buildPressMetricCounts(groups: PressMetricGroup[]): PressMetricCounts {
  const counts = emptyPressMetricCounts();

  for (const group of groups) {
    const count = Number.isFinite(group._count._all) ? Math.max(0, group._count._all) : 0;
    if (group.eventType === 'press_package_download' && (group.target === 'en' || group.target === 'it')) {
      counts.pressPackageDownloadIntents[group.target] += count;
      counts.pressPackageDownloadIntents.total += count;
    } else if (group.eventType === 'data_room_view' && group.target === 'data-room') {
      counts.dataRoomViews.total += count;
    } else if (group.eventType === 'press_contact_intent') {
      const key = group.target === 'fact-checking' ? 'factChecking' : group.target;
      if (key === 'press' || key === 'factChecking' || key === 'interview' || key === 'speaking') {
        counts.pressContactIntents[key] += count;
        counts.pressContactIntents.total += count;
      }
    }
  }

  return counts;
}

export function recordPressMetric(eventType: PressMetricEventType, target: PressMetricTarget, locale: PressMetricLocale): void {
  if (typeof window === 'undefined') return;
  const payload = parsePressMetricPayload({ eventType, target, locale });
  if (!payload) return;

  void fetch('/api/press-metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
    credentials: 'omit',
    keepalive: true,
  }).catch(() => undefined);
}
