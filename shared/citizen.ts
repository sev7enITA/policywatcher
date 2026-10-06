/** Public, platform-neutral contract. Personal selections never belong in API requests. */
export type CitizenLocale = 'it' | 'en';
export type CitizenChangeKind = 'substantive' | 'editorial' | 'unchanged' | 'needs_review';
export type CitizenFreshness = 'recent' | 'dated' | 'unavailable';
export interface CitizenPolicy {
  id: string;
  name: string;
  type: string;
  jurisdiction: string;
  sourceUrl: string;
  lastRetrievedAt: string | null;
  freshness: CitizenFreshness;
  latestChange: { id: string; publishedAt: string } | null;
}
export interface CitizenService {
  id: string;
  name: string;
  slug: string;
  website: string;
  policies: CitizenPolicy[];
}
export interface CitizenChange {
  id: string;
  serviceId: string;
  policyId: string;
  publishedAt: string;
  detectedAt: string;
  summary: { it: string; en: string };
  kind: CitizenChangeKind;
  impact: 'not_assessed';
  evidence: Array<{ before: string; after: string }>;
  detailPath: string;
  evidencePath: string;
}
export interface CitizenFeed {
  schemaVersion: '1.0';
  generatedAt: string;
  services: CitizenService[];
  changes: CitizenChange[];
  /** A bounded descending history, never a claim to complete historical coverage. */
  history: { limit: number; hasMore: boolean; nextCursor: string | null };
  catalogTruncated: boolean;
}
export interface FollowedCitizenService {
  serviceId: string;
  name: string;
  slug: string;
  /** Self-reported context only; the dataset cannot establish plan applicability. */
  plan: string;
}
export type CitizenChoiceStatus = 'reviewed' | 'action_recorded' | 'remind_me';
export interface CitizenChoice {
  id: string;
  serviceId: string;
  serviceName: string;
  policyId: string;
  policyName: string;
  changeId: string;
  baselinePublishedAt: string;
  status: CitizenChoiceStatus;
  guideId?: string;
  recordedAt: string;
}
export interface CitizenPreferences {
  version: 1;
  country: string;
  followed: FollowedCitizenService[];
  choices: CitizenChoice[];
  savedChangeIds: string[];
}
export interface CitizenGuide {
  id: string;
  serviceSlugs: string[];
  title: { it: string; en: string };
  scope: { it: string; en: string };
  steps: { it: string[]; en: string[] };
  boundary: { it: string; en: string };
  officialUrl: string;
  reviewedAt: string;
}
export const CITIZEN_STORAGE_KEY = 'policywatcher:citizen:v1';
export const CITIZEN_MAX_SERVICES = 200;
export const CITIZEN_MAX_CHOICES = 200;
export const CITIZEN_MAX_SAVED = 100;
export function emptyCitizenPreferences(): CitizenPreferences {
  return { version: 1, country: 'all', followed: [], choices: [], savedChangeIds: [] };
}
export function citizenFreshness(value: string | null, now = new Date()): CitizenFreshness {
  const timestamp = value ? Date.parse(value) : NaN;
  const age = now.getTime() - timestamp;
  return !Number.isFinite(age) || age < 0 ? 'unavailable' : age > 7 * 86400000 ? 'dated' : 'recent';
}
export type CitizenChoiceReview = 'recorded' | 'revisit' | 'unknown';
export function evaluateCitizenChoice(choice: CitizenChoice, feed: CitizenFeed | null, live: boolean, now = new Date()): CitizenChoiceReview {
  if (!feed || !live || citizenFreshness(feed.generatedAt, now) !== 'recent') return 'unknown';
  const policy = feed.services.find(s => s.id === choice.serviceId)?.policies.find(p => p.id === choice.policyId);
  if (!policy || citizenFreshness(policy.lastRetrievedAt, now) !== 'recent') return 'unknown';
  const latest = policy.latestChange;
  if (!latest || Date.parse(latest.publishedAt) < Date.parse(choice.baselinePublishedAt)) return 'unknown';
  if (latest.id !== choice.changeId || Date.parse(latest.publishedAt) > Date.parse(choice.baselinePublishedAt)) return 'revisit';
  if (choice.status === 'remind_me') return 'revisit';
  return 'recorded';
}
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const short = (value: unknown, max = 120): value is string => typeof value === 'string' && value.length > 0 && value.length <= max;
const date = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
export function parseCitizenPreferences(raw: string | null): CitizenPreferences | null {
  if (!raw || raw.length > 250_000) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!object(value) || value.version !== 1 || typeof value.country !== 'string' || !/^(all|[a-z]{2})$/.test(value.country)
      || !Array.isArray(value.followed) || !Array.isArray(value.choices) || !Array.isArray(value.savedChangeIds)
      || value.followed.length > CITIZEN_MAX_SERVICES || value.choices.length > CITIZEN_MAX_CHOICES || value.savedChangeIds.length > CITIZEN_MAX_SAVED) return null;
    const followed: FollowedCitizenService[] = [];
    for (const item of value.followed) {
      if (!object(item) || !short(item.serviceId) || !short(item.name, 200) || !short(item.slug)
        || typeof item.plan !== 'string' || item.plan.length > 80 || followed.some(s => s.serviceId === item.serviceId)) return null;
      followed.push({ serviceId: item.serviceId, name: item.name, slug: item.slug, plan: item.plan });
    }
    const choices: CitizenChoice[] = [];
    for (const item of value.choices) {
      if (!object(item) || !short(item.id) || !short(item.serviceId) || !short(item.serviceName, 200) || !short(item.policyId)
        || !short(item.policyName, 300) || !short(item.changeId) || !date(item.baselinePublishedAt) || !date(item.recordedAt)
        || !['reviewed', 'action_recorded', 'remind_me'].includes(String(item.status))
        || (item.guideId !== undefined && !short(item.guideId)) || choices.some(c => c.id === item.id)) return null;
      choices.push({ id: item.id, serviceId: item.serviceId, serviceName: item.serviceName, policyId: item.policyId,
        policyName: item.policyName, changeId: item.changeId, baselinePublishedAt: item.baselinePublishedAt,
        status: item.status as CitizenChoiceStatus, recordedAt: item.recordedAt,
        ...(typeof item.guideId === 'string' ? { guideId: item.guideId } : {}) });
    }
    if (!value.savedChangeIds.every(id => short(id)) || new Set(value.savedChangeIds).size !== value.savedChangeIds.length) return null;
    return { version: 1, country: value.country, followed, choices, savedChangeIds: value.savedChangeIds as string[] };
  } catch { return null; }
}

/** Restrict external navigation to plain HTTPS links, never credentials or executable schemes. */
export function citizenSafeUrl(value: string): string | null {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : null; }
  catch { return null; }
}

/** Match downloaded public metadata only. No network access or authentication inference. */
export function matchCitizenNotice(input: string, services: CitizenService[]): CitizenService[] {
  let bytes = 0;
  for (const character of input) {
    const point = character.codePointAt(0)!;
    bytes += point < 0x80 ? 1 : point < 0x800 ? 2 : point < 0x10000 ? 3 : 4;
    if (bytes > 20 * 1024) throw new Error('INPUT_TOO_LARGE');
  }
  // Brand strings inside attacker-controlled URLs/email addresses are not name evidence.
  const normalized = input.replace(/https?:\/\/[^\s<>"']+/gi, ' ')
    .replace(/\S+@\S+/g, ' ').replace(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b/gi, ' ')
    .normalize('NFKC').toLocaleLowerCase('en');
  const urls = (input.match(/https?:\/\/[^\s<>"']+/gi) || []).flatMap(value => {
    try { return [new URL(value.replace(/[),.;!?]+$/, '')).hostname.toLowerCase().replace(/^www\./, '')]; } catch { return []; }
  });
  return services.filter(service => {
    const hosts = [service.website, ...service.policies.map(p => p.sourceUrl)].flatMap(value => {
      try { return [new URL(value).hostname.toLowerCase().replace(/^www\./, '')]; } catch { return []; }
    });
    const name = service.name.normalize('NFKC').toLocaleLowerCase('en');
    const namePattern = new RegExp(`(?:^|[^\\p{L}\\p{N}])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[^\\p{L}\\p{N}])`, 'u');
    return (name.length >= 3 && namePattern.test(normalized)) || urls.some(host => hosts.some(known => host === known || host.endsWith(`.${known}`)));
  }).slice(0, 8);
}

export function buildCitizenDossier(input: { locale: CitizenLocale; choice?: CitizenChoice; service?: Pick<CitizenService, 'id' | 'name'>; change?: CitizenChange; policy?: CitizenPolicy; note?: string; generatedAt?: string }): string {
  const { choice, change, policy, locale } = input;
  const it = locale === 'it';
  const choiceLabel = choice ? {
    reviewed: it ? 'Ho letto la modifica' : 'I reviewed the change',
    action_recorded: it ? 'Ho eseguito un’azione' : 'I took an action',
    remind_me: it ? 'Voglio rivedere la modifica' : 'I want to review the change again',
  }[choice.status] : '';
  return [it ? 'PolicyWatcher - bozza per chiedere supporto' : 'PolicyWatcher - draft support request',
    `${it ? 'Preparata il' : 'Prepared on'}: ${input.generatedAt || new Date().toISOString()}`,
    `${it ? 'Servizio' : 'Service'}: ${choice?.serviceName || input.service?.name || (it ? 'non selezionato' : 'not selected')}`,
    `${it ? 'Documento' : 'Document'}: ${choice?.policyName || policy?.name || (it ? 'non selezionato' : 'not selected')}`,
    ...((change?.id || choice?.changeId) ? [`${it ? 'Record pubblico' : 'Public record'}: https://policywatcher.online/change/${encodeURIComponent(change?.id || choice!.changeId)}`] : []),
    ...(policy && citizenSafeUrl(policy.sourceUrl) ? [`${it ? 'Fonte' : 'Source'}: ${policy.sourceUrl}`, `${it ? 'Ultima acquisizione' : 'Last retrieval'}: ${policy.lastRetrievedAt || (it ? 'non disponibile' : 'unavailable')}`] : []),
    ...(change ? [`${it ? 'Sintesi automatica da verificare' : 'Automatic summary to review'}: ${change.summary[locale]}`] : []),
    choice ? `${it ? 'Scelta dichiarata dall’utente' : 'User-reported choice'}: ${choiceLabel} (${choice.recordedAt})` : (it ? 'Nessuna scelta dichiarata dall’utente.' : 'No user-reported choice.'),
    it ? 'L’effetto sul servizio non è stato verificato. L’applicabilità al mio account e piano resta da confermare.' : 'The effect on the service has not been verified. Applicability to my account and plan remains unconfirmed.',
    `${it ? 'La mia domanda' : 'My question'}: ${(input.note || '').slice(0, 2000)}`,
    it ? 'Bozza preparata sul dispositivo. Nessun invio automatico. Controllare contenuti e destinatario prima di condividerla.' : 'Draft prepared on this device. Nothing is sent automatically. Review the contents and recipient before sharing.',
  ].join('\n\n');
}

/** Validate network/cache payloads before either browser or companion renders them. */
export function parseCitizenFeed(value: unknown): CitizenFeed | null {
  if (!object(value) || value.schemaVersion !== '1.0' || !date(value.generatedAt)
    || !Array.isArray(value.services) || value.services.length > 500
    || !Array.isArray(value.changes) || value.changes.length > 2000
    || typeof value.catalogTruncated !== 'boolean' || !object(value.history)
    || !Number.isInteger(value.history.limit) || Number(value.history.limit) < 1 || Number(value.history.limit) > 50
    || typeof value.history.hasMore !== 'boolean'
    || !(value.history.nextCursor === null || short(value.history.nextCursor, 500))
    || value.history.hasMore !== (value.history.nextCursor !== null)) return null;
  const services: CitizenService[] = [];
  const policyIds = new Set<string>();
  for (const s of value.services) {
    if (!object(s) || !short(s.id) || !short(s.name, 200) || !short(s.slug) || !short(s.website, 2048) || !citizenSafeUrl(s.website)
      || !Array.isArray(s.policies) || s.policies.length > 1000 || services.some(x => x.id === s.id)) return null;
    const policies: CitizenPolicy[] = [];
    for (const p of s.policies) {
      if (!object(p) || !short(p.id) || policyIds.has(p.id) || !short(p.name, 300) || !short(p.type) || !short(p.jurisdiction)
        || !short(p.sourceUrl, 2048) || !citizenSafeUrl(p.sourceUrl) || !(p.lastRetrievedAt === null || date(p.lastRetrievedAt))
        || !['recent', 'dated', 'unavailable'].includes(String(p.freshness))
        || !(p.latestChange === null || (object(p.latestChange) && short(p.latestChange.id) && date(p.latestChange.publishedAt)))) return null;
      policyIds.add(p.id);
      policies.push({ id: p.id, name: p.name, type: p.type, jurisdiction: p.jurisdiction, sourceUrl: p.sourceUrl,
        lastRetrievedAt: p.lastRetrievedAt, freshness: p.freshness as CitizenFreshness,
        latestChange: p.latestChange === null ? null : { id: p.latestChange.id as string, publishedAt: p.latestChange.publishedAt as string } });
    }
    services.push({ id: s.id, name: s.name, slug: s.slug, website: s.website, policies });
  }
  if (policyIds.size > 1000) return null;
  const changes: CitizenChange[] = [];
  for (const c of value.changes) {
    if (!object(c) || !short(c.id) || changes.some(x => x.id === c.id) || !short(c.serviceId) || !short(c.policyId)
      || !services.find(s => s.id === c.serviceId)?.policies.some(p => p.id === c.policyId)
      || !date(c.publishedAt) || !date(c.detectedAt) || !object(c.summary)
      || !short(c.summary.it, 1200) || !short(c.summary.en, 1200) || c.impact !== 'not_assessed'
      || !['substantive', 'editorial', 'unchanged', 'needs_review'].includes(String(c.kind))
      || !Array.isArray(c.evidence) || c.evidence.length > 4
      || !c.evidence.every(e => object(e) && typeof e.before === 'string' && e.before.length <= 640 && typeof e.after === 'string' && e.after.length <= 640)
      || c.detailPath !== `/change/${encodeURIComponent(c.id)}` || c.evidencePath !== `/api/evidence-packet/${encodeURIComponent(c.id)}`) return null;
    changes.push({ id: c.id, serviceId: c.serviceId, policyId: c.policyId, publishedAt: c.publishedAt, detectedAt: c.detectedAt,
      summary: { it: c.summary.it, en: c.summary.en }, kind: c.kind as CitizenChangeKind, impact: 'not_assessed',
      evidence: c.evidence.map(e => ({ before: e.before, after: e.after })), detailPath: c.detailPath as string, evidencePath: c.evidencePath as string });
  }
  return { schemaVersion: '1.0', generatedAt: value.generatedAt, services, changes, catalogTruncated: value.catalogTruncated,
    history: { limit: value.history.limit as number, hasMore: value.history.hasMore, nextCursor: value.history.nextCursor as string | null } };
}
