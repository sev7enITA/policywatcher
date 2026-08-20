export type Locale = 'it' | 'en';
export type Risk = 'High' | 'Medium' | 'Low';

export interface ChangeEvent {
  eventId: string;
  occurredAt: string;
  changeId: string;
  company: { id: string; name: string; slug: string; industry: string };
  policy: { id: string; name: string; type: string; jurisdiction: string };
  screening: { overallRisk: Risk; overallScore: number; summary: string; boundary: string };
  links: { change: string; evidence: string; evidenceJson: string };
}

export interface ChangeFeed {
  schemaVersion: '1.0.0';
  mode: 'forward-polling';
  locale: Locale;
  events: ChangeEvent[];
  boundary: string;
}

export const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_ID_RE = /^[a-zA-Z0-9_-]{1,128}$/;
const SAFE_SLUG_RE = /^[a-z0-9-]{1,100}$/;

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown, max: number): string | null {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max && !/[\u0000-\u001f\u007f]/.test(value)
    ? value.trim()
    : null;
}

function safeId(value: unknown): string | null {
  return typeof value === 'string' && SAFE_ID_RE.test(value) ? value : null;
}

function canonicalDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value ? value : null;
}

function risk(value: unknown): Risk | null {
  if (typeof value !== 'string') return null;
  const normalized = value.toLowerCase();
  if (normalized === 'high') return 'High';
  if (normalized === 'medium') return 'Medium';
  if (normalized === 'low') return 'Low';
  return null;
}

function canonicalLink(value: unknown, origin: string, path: RegExp): string | null {
  if (typeof value !== 'string' || value.length > 500) return null;
  try {
    const parsed = new URL(value);
    const expected = new URL(origin);
    return parsed.protocol === 'https:' && parsed.origin === expected.origin && path.test(parsed.pathname + parsed.search)
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

export function validateChangeEvent(value: unknown, origin: string): ChangeEvent | null {
  const item = record(value);
  const subject = record(item?.subject);
  const company = record(subject?.company);
  const policy = record(subject?.policy);
  const screening = record(item?.screening);
  const links = record(item?.links);
  if (!item || !subject || !company || !policy || !screening || !links) return null;

  const eventId = text(item.eventId, 80);
  const occurredAt = canonicalDate(item.occurredAt);
  const changeId = typeof subject.changeId === 'string' && UUID_V4_RE.test(subject.changeId)
    ? subject.changeId.toLowerCase()
    : null;
  const companyId = safeId(company.id);
  const companyName = text(company.name, 160);
  const companySlug = typeof company.slug === 'string' && SAFE_SLUG_RE.test(company.slug) ? company.slug : null;
  const companyIndustry = text(company.industry, 160);
  const policyId = safeId(policy.id);
  const policyName = text(policy.name, 240);
  const policyType = text(policy.type, 120);
  const jurisdiction = text(policy.jurisdiction, 120);
  const overallRisk = risk(screening.overallRisk);
  const score = typeof screening.overallScore === 'number' && Number.isFinite(screening.overallScore) && screening.overallScore >= 0 && screening.overallScore <= 100
    ? screening.overallScore
    : null;
  const summary = text(screening.summary, 5000);
  const boundary = text(screening.boundary, 1000);
  const change = canonicalLink(links.change, origin, /^\/change\/[0-9a-f-]{36}\/?$/i);
  const evidence = canonicalLink(links.evidence, origin, /^\/evidence\/[0-9a-f-]{36}\/?$/i);
  const evidenceJson = canonicalLink(links.evidenceJson, origin, /^\/api\/evidence-packet\/[0-9a-f-]{36}\?format=json$/i);

  if (
    item.eventType !== 'policy.change.published' || item.schemaVersion !== '1.0.0' || !eventId || !occurredAt || !changeId ||
    !companyId || !companyName || !companySlug || !companyIndustry || !policyId || !policyName || !policyType || !jurisdiction ||
    !overallRisk || score === null || !summary || !boundary || !change || !evidence || !evidenceJson
  ) return null;

  if (!change.includes(changeId) || !evidence.includes(changeId) || !evidenceJson.includes(changeId)) return null;
  return {
    eventId,
    occurredAt,
    changeId,
    company: { id: companyId, name: companyName, slug: companySlug, industry: companyIndustry },
    policy: { id: policyId, name: policyName, type: policyType, jurisdiction },
    screening: { overallRisk, overallScore: score, summary, boundary },
    links: { change, evidence, evidenceJson },
  };
}

export type FeedValidation = { ok: true; feed: ChangeFeed } | { ok: false; reason: string };

export function validateFeed(value: unknown, origin: string): FeedValidation {
  const envelope = record(value);
  if (!envelope || envelope.schemaVersion !== '1.0.0' || envelope.mode !== 'forward-polling') {
    return { ok: false, reason: 'unsupported-envelope' };
  }
  if (envelope.locale !== 'it' && envelope.locale !== 'en') return { ok: false, reason: 'invalid-locale' };
  if (!Array.isArray(envelope.events) || envelope.events.length > 100) return { ok: false, reason: 'invalid-events' };
  if (typeof envelope.count !== 'number' || envelope.count !== envelope.events.length) return { ok: false, reason: 'invalid-count' };
  const boundary = text(envelope.boundary, 2000);
  if (!boundary) return { ok: false, reason: 'invalid-boundary' };
  const events: ChangeEvent[] = [];
  for (const candidate of envelope.events) {
    const parsed = validateChangeEvent(candidate, origin);
    if (!parsed) return { ok: false, reason: 'invalid-event' };
    events.push(parsed);
  }
  return { ok: true, feed: { schemaVersion: '1.0.0', mode: 'forward-polling', locale: envelope.locale, events, boundary } };
}

/** Revalidates device cache as untrusted JSON before it can return to UI state. */
export function validateCachedFeed(value: unknown, origin: string): ChangeFeed | null {
  const cached = record(value);
  if (!cached || cached.schemaVersion !== '1.0.0' || cached.mode !== 'forward-polling' || (cached.locale !== 'it' && cached.locale !== 'en')) return null;
  const boundary = text(cached.boundary, 2000);
  if (!boundary || !Array.isArray(cached.events) || cached.events.length > 100) return null;
  const events: ChangeEvent[] = [];
  for (const valueEvent of cached.events) {
    const candidate = record(valueEvent);
    if (!candidate) return null;
    const parsed = validateChangeEvent({
      eventId: candidate.eventId,
      eventType: 'policy.change.published',
      schemaVersion: '1.0.0',
      occurredAt: candidate.occurredAt,
      subject: { changeId: candidate.changeId, company: candidate.company, policy: candidate.policy },
      screening: candidate.screening,
      links: candidate.links,
    }, origin);
    if (!parsed) return null;
    events.push(parsed);
  }
  return { schemaVersion: '1.0.0', mode: 'forward-polling', locale: cached.locale, events, boundary };
}
