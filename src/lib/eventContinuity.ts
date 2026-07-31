import type { PublicChangeEventFeed } from './publicChangeEvents';

export const EVENT_CONTINUITY_CHECKPOINT_SCHEMA =
  'https://policywatcher.online/schemas/event-continuity-checkpoint/v1' as const;
export const EVENT_CONTINUITY_CHECKPOINT_VERSION = 1 as const;
export const EVENT_CONTINUITY_STORAGE_KEY = 'policywatcher.event-continuity.checkpoint.v1' as const;
export const EVENT_CONTINUITY_MAX_OBSERVED_IDS = 100;

export type EventContinuitySeverity = 'info' | 'warning' | 'error';
export type EventContinuityStatus = 'clear' | 'attention' | 'empty';

export interface EventContinuityCheckpoint {
  schema: typeof EVENT_CONTINUITY_CHECKPOINT_SCHEMA;
  version: typeof EVENT_CONTINUITY_CHECKPOINT_VERSION;
  savedAt: string;
  feedSchemaVersion: string;
  locale: 'en' | 'it';
  cursor: string | null;
  watermark: {
    eventId: string;
    occurredAt: string;
  } | null;
  observedEventIds: string[];
  observedEventCount: number;
  boundary: string;
}

export interface EventContinuityFinding {
  code:
    | 'empty_window'
    | 'initial_window_truncated'
    | 'duplicate_event_id'
    | 'ordering_regression'
    | 'checkpoint_overlap'
    | 'checkpoint_regression';
  severity: EventContinuitySeverity;
  title: string;
  detail: string;
}

export interface EventContinuityReport {
  status: EventContinuityStatus;
  metrics: {
    received: number;
    unique: number;
    duplicates: number;
    crossWindowDuplicates: number;
    orderedChronologically: boolean;
    initialWindowTruncated: boolean;
    hasMore: boolean;
    resumedFromCheckpoint: boolean;
  };
  findings: EventContinuityFinding[];
  nextCursor: string | null;
  boundary: string;
}

export const EVENT_CONTINUITY_BOUNDARY =
  'This browser-local checkpoint helps inspect forward-polling continuity for already-public PolicyWatcher events. It cannot prove exhaustive source monitoring, external delivery, endpoint identity, legal status or the absence of events outside the returned feed window.';

const EVENT_ID_RE = /^pwe_[a-f0-9]{20}$/;
const CURSOR_RE = /^[A-Za-z0-9_-]{1,256}$/;
const CHECKPOINT_KEYS = [
  'boundary',
  'cursor',
  'feedSchemaVersion',
  'locale',
  'observedEventCount',
  'observedEventIds',
  'savedAt',
  'schema',
  'version',
  'watermark',
] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  return actual.length === keys.length && actual.every((key, index) => key === [...keys].sort()[index]);
}

function isCanonicalTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 40) return false;
  const time = new Date(value);
  return Number.isFinite(time.getTime()) && time.toISOString() === value;
}

function compareEvents(
  left: PublicChangeEventFeed['events'][number],
  right: PublicChangeEventFeed['events'][number],
): number {
  const timeDifference = Date.parse(left.occurredAt) - Date.parse(right.occurredAt);
  return timeDifference || left.subject.changeId.localeCompare(right.subject.changeId);
}

function distinctEventIds(feed: PublicChangeEventFeed): string[] {
  return [...new Set(feed.events.map((event) => event.eventId))];
}

export function inspectEventContinuity(
  feed: PublicChangeEventFeed,
  previousCheckpoint?: EventContinuityCheckpoint | null,
): EventContinuityReport {
  const findings: EventContinuityFinding[] = [];
  const ids = feed.events.map((event) => event.eventId);
  const uniqueIds = new Set(ids);
  const duplicates = ids.length - uniqueIds.size;
  const previousIds = new Set(previousCheckpoint?.observedEventIds || []);
  const crossWindowDuplicates = [...uniqueIds].filter((eventId) => previousIds.has(eventId)).length;
  const orderedChronologically = feed.events.every((event, index) => (
    index === 0 || compareEvents(feed.events[index - 1], event) <= 0
  ));

  if (feed.events.length === 0) {
    findings.push({
      code: 'empty_window',
      severity: 'info',
      title: 'No new public events in this window',
      detail: 'The cursor may be retained and used again later. An empty poll is not evidence that monitored sources did not change.',
    });
  }
  if (feed.initialWindowTruncated) {
    findings.push({
      code: 'initial_window_truncated',
      severity: 'warning',
      title: 'Initial window is truncated',
      detail: 'The first request returned only the most recent bounded window. Save its cursor to establish a forward checkpoint; earlier events are not recovered by this feed.',
    });
  }
  if (duplicates > 0) {
    findings.push({
      code: 'duplicate_event_id',
      severity: 'error',
      title: 'Duplicate event identity detected',
      detail: `${duplicates} repeated event occurrence${duplicates === 1 ? '' : 's'} appeared inside the returned window. Do not process the repeated identity twice.`,
    });
  }
  if (!orderedChronologically) {
    findings.push({
      code: 'ordering_regression',
      severity: 'error',
      title: 'Chronological ordering regressed',
      detail: 'At least one event precedes the event before it. Preserve the checkpoint and inspect the response before advancing a consumer.',
    });
  }
  if (crossWindowDuplicates > 0) {
    findings.push({
      code: 'checkpoint_overlap',
      severity: 'warning',
      title: 'Returned window overlaps the local checkpoint',
      detail: `${crossWindowDuplicates} event identit${crossWindowDuplicates === 1 ? 'y is' : 'ies are'} already present in the bounded local history. Apply idempotent processing.`,
    });
  }

  const first = feed.events[0];
  if (first && previousCheckpoint?.watermark) {
    const firstTime = Date.parse(first.occurredAt);
    const watermarkTime = Date.parse(previousCheckpoint.watermark.occurredAt);
    if (firstTime < watermarkTime) {
      findings.push({
        code: 'checkpoint_regression',
        severity: 'error',
        title: 'Window begins before the checkpoint watermark',
        detail: 'The returned event time is earlier than the locally saved watermark. Do not advance the checkpoint until the cursor and response are reviewed.',
      });
    }
  }

  const hasAttention = findings.some((finding) => finding.severity !== 'info');
  return {
    status: feed.events.length === 0 ? 'empty' : hasAttention ? 'attention' : 'clear',
    metrics: {
      received: ids.length,
      unique: uniqueIds.size,
      duplicates,
      crossWindowDuplicates,
      orderedChronologically,
      initialWindowTruncated: feed.initialWindowTruncated,
      hasMore: feed.hasMore,
      resumedFromCheckpoint: Boolean(previousCheckpoint?.cursor),
    },
    findings,
    nextCursor: feed.nextCursor,
    boundary: EVENT_CONTINUITY_BOUNDARY,
  };
}

export function createEventContinuityCheckpoint(
  feed: PublicChangeEventFeed,
  previousCheckpoint?: EventContinuityCheckpoint | null,
  savedAt = new Date().toISOString(),
): EventContinuityCheckpoint {
  if (!isCanonicalTimestamp(savedAt)) throw new Error('Checkpoint time must be a canonical ISO timestamp.');

  const latestEvent = feed.events.at(-1);
  const observedEventIds = [
    ...(previousCheckpoint?.observedEventIds || []),
    ...distinctEventIds(feed),
  ].filter((eventId, index, values) => values.indexOf(eventId) === index)
    .slice(-EVENT_CONTINUITY_MAX_OBSERVED_IDS);

  return {
    schema: EVENT_CONTINUITY_CHECKPOINT_SCHEMA,
    version: EVENT_CONTINUITY_CHECKPOINT_VERSION,
    savedAt,
    feedSchemaVersion: feed.schemaVersion,
    locale: feed.locale,
    cursor: feed.nextCursor,
    watermark: latestEvent
      ? { eventId: latestEvent.eventId, occurredAt: latestEvent.occurredAt }
      : previousCheckpoint?.watermark || null,
    observedEventIds,
    observedEventCount: (previousCheckpoint?.observedEventCount || 0) + feed.events.length,
    boundary: EVENT_CONTINUITY_BOUNDARY,
  };
}

export function parseEventContinuityCheckpoint(raw: string): EventContinuityCheckpoint | null {
  if (typeof raw !== 'string' || raw.length < 2 || raw.length > 16_384) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isPlainObject(value) || !hasExactKeys(value, CHECKPOINT_KEYS)) return null;
    if (value.schema !== EVENT_CONTINUITY_CHECKPOINT_SCHEMA || value.version !== EVENT_CONTINUITY_CHECKPOINT_VERSION) return null;
    if (!isCanonicalTimestamp(value.savedAt)) return null;
    if (typeof value.feedSchemaVersion !== 'string' || !/^\d+\.\d+\.\d+$/.test(value.feedSchemaVersion)) return null;
    if (value.locale !== 'en' && value.locale !== 'it') return null;
    if (value.cursor !== null && (typeof value.cursor !== 'string' || !CURSOR_RE.test(value.cursor))) return null;
    if (typeof value.observedEventCount !== 'number' || !Number.isSafeInteger(value.observedEventCount) || value.observedEventCount < 0) return null;
    if (!Array.isArray(value.observedEventIds) || value.observedEventIds.length > EVENT_CONTINUITY_MAX_OBSERVED_IDS) return null;
    if (!value.observedEventIds.every((eventId) => typeof eventId === 'string' && EVENT_ID_RE.test(eventId))) return null;
    if (new Set(value.observedEventIds).size !== value.observedEventIds.length) return null;
    if (value.observedEventCount < value.observedEventIds.length) return null;
    if (value.boundary !== EVENT_CONTINUITY_BOUNDARY) return null;
    if (value.watermark !== null) {
      if (!isPlainObject(value.watermark) || !hasExactKeys(value.watermark, ['eventId', 'occurredAt'])) return null;
      if (typeof value.watermark.eventId !== 'string' || !EVENT_ID_RE.test(value.watermark.eventId)) return null;
      if (!isCanonicalTimestamp(value.watermark.occurredAt)) return null;
      if (!value.observedEventIds.includes(value.watermark.eventId)) return null;
    }
    return value as unknown as EventContinuityCheckpoint;
  } catch {
    return null;
  }
}

export function serializeEventContinuityCheckpoint(checkpoint: EventContinuityCheckpoint): string {
  const parsed = parseEventContinuityCheckpoint(JSON.stringify(checkpoint));
  if (!parsed) throw new Error('Cannot serialize an invalid event continuity checkpoint.');
  return JSON.stringify(parsed, null, 2);
}
