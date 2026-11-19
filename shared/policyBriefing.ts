import { citizenFreshness, citizenSafeUrl, type CitizenChange, type CitizenFeed, type CitizenLocale, type CitizenPolicy, type CitizenService } from './citizen';

export const BRIEFING_STORAGE_KEY = 'policywatcher:briefing:v1';
export const BRIEFING_MAX_REVIEWS = 200;
export const BRIEFING_TOPICS = {
  training: { en: 'AI training', it: 'Addestramento IA', terms: ['training', 'train our', 'addestramento', 'addestrare', 'model improvement'] },
  retention: { en: 'Retention and deletion', it: 'Conservazione e cancellazione', terms: ['retention', 'retain', 'retained', 'delete', 'deletion', 'conservazione', 'conservati', 'cancellazione', 'cancellare'] },
  sharing: { en: 'Sharing and subprocessors', it: 'Condivisione e subfornitori', terms: ['share', 'sharing', 'third parties', 'subprocessor', 'subprocessors', 'condivisione', 'condividere', 'terze parti', 'subfornitori'] },
  transfers: { en: 'International transfers', it: 'Trasferimenti internazionali', terms: ['international transfer', 'international transfers', 'cross-border', 'transfer abroad', 'trasferimenti internazionali', 'paesi terzi'] },
  choices: { en: 'Consent and choices', it: 'Consenso e scelte', terms: ['consent', 'opt out', 'opt-out', 'withdraw', 'consenso', 'opposizione', 'revocare'] },
  commercial: { en: 'Prices and renewal', it: 'Prezzi e rinnovo', terms: ['price', 'prices', 'pricing', 'renewal', 'subscription', 'prezzo', 'prezzi', 'rinnovo', 'abbonamento'] },
} as const;
export type BriefingTopic = keyof typeof BRIEFING_TOPICS;
export type ReviewStatus = 'todo' | 'reviewing' | 'reviewed';
export interface BriefingFilters { serviceIds: string[]; topics: BriefingTopic[]; days: 7 | 30 | 90 | 0 }
export interface BriefingReview { changeId: string; policyId: string; status: ReviewStatus; role: string; dueDate: string; updatedAt: string }
export interface BriefingPreferences { version: 1; filters: BriefingFilters; reviews: BriefingReview[] }
export interface BriefingRow { change: CitizenChange; policy: CitizenPolicy; service: CitizenService; matches: Array<{ topic: BriefingTopic; term: string; location: 'summary' | 'excerpt' }>; freshness: 'recent' | 'dated' | 'unavailable'; review: BriefingReview | null; reviewState: ReviewStatus | 'reopened' | 'unknown' }
export function emptyBriefing(): BriefingPreferences { return { version: 1, filters: { serviceIds: [], topics: [], days: 30 }, reviews: [] }; }
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const clean = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const identifier = (v: unknown): v is string => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,120}$/.test(v);
export function validBriefingDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function parseBriefingPreferences(raw: string | null): BriefingPreferences | null {
  if (!raw || raw.length > 160_000) return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (!object(v) || v.version !== 1 || !object(v.filters) || !Array.isArray(v.filters.serviceIds)
      || v.filters.serviceIds.length > 500 || !v.filters.serviceIds.every(identifier)
      || new Set(v.filters.serviceIds).size !== v.filters.serviceIds.length
      || !Array.isArray(v.filters.topics) || v.filters.topics.length > 6
      || !v.filters.topics.every(t => typeof t === 'string' && Object.hasOwn(BRIEFING_TOPICS, t))
      || new Set(v.filters.topics).size !== v.filters.topics.length
      || ![0, 7, 30, 90].includes(Number(v.filters.days)) || typeof v.filters.days !== 'number'
      || !Array.isArray(v.reviews) || v.reviews.length > BRIEFING_MAX_REVIEWS) return null;
    const reviews: BriefingReview[] = [];
    for (const r of v.reviews) {
      if (!object(r) || !identifier(r.changeId) || !identifier(r.policyId)
        || !['todo', 'reviewing', 'reviewed'].includes(String(r.status))
        || typeof r.role !== 'string' || r.role.length > 80 || /[\r\n\u0000-\u001f]/.test(r.role)
        || typeof r.dueDate !== 'string' || (r.dueDate !== '' && !validBriefingDate(r.dueDate))
        || typeof r.updatedAt !== 'string' || !Number.isFinite(Date.parse(r.updatedAt))
        || reviews.some(x => x.changeId === r.changeId)) return null;
      reviews.push({ changeId: r.changeId, policyId: r.policyId, status: r.status as ReviewStatus, role: r.role, dueDate: r.dueDate, updatedAt: r.updatedAt });
    }
    return { version: 1, filters: { serviceIds: [...v.filters.serviceIds], topics: [...v.filters.topics] as BriefingTopic[], days: v.filters.days as BriefingFilters['days'] }, reviews };
  } catch { return null; }
}
export function mergeBriefingHistory(current: CitizenFeed, older: CitizenFeed): CitizenFeed {
  const known = new Set(current.services.flatMap(service => service.policies.map(policy => JSON.stringify([service.id, policy.id]))));
  const changes = new Map(current.changes.map(change => [change.id, change]));
  let clipped = false;
  for (const change of older.changes) {
    if (changes.has(change.id) || !known.has(JSON.stringify([change.serviceId, change.policyId]))) continue;
    if (changes.size === 2000) { clipped = true; break; }
    changes.set(change.id, change);
  }
  return { ...current, changes: [...changes.values()], history: clipped ? current.history : older.history,
    catalogTruncated: current.catalogTruncated || older.catalogTruncated };
}
export function briefingMatches(change: CitizenChange, locale: CitizenLocale): BriefingRow['matches'] {
  const summary = clean(change.summary[locale]);
  const excerpt = clean(change.evidence.map(e => `${e.before}\n${e.after}`).join('\n'));
  const matches: BriefingRow['matches'] = [];
  for (const [topic, spec] of Object.entries(BRIEFING_TOPICS)) {
    for (const term of spec.terms) {
      const pattern = new RegExp(`(^|[^a-z0-9])${clean(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9])`);
      const location = pattern.test(excerpt) ? 'excerpt' : pattern.test(summary) ? 'summary' : null;
      if (location) { matches.push({ topic: topic as BriefingTopic, term, location }); break; }
    }
  }
  return matches;
}
export function briefingReviewState(review: BriefingReview | null, change: CitizenChange, policy: CitizenPolicy, feed: CitizenFeed, now: Date, available = true): BriefingRow['reviewState'] {
  if (!review) return 'todo';
  if (!available || !Number.isFinite(now.getTime()) || !Number.isFinite(Date.parse(review.updatedAt))
    || !Number.isFinite(Date.parse(change.publishedAt)) || (policy.latestChange && !Number.isFinite(Date.parse(policy.latestChange.publishedAt)))
    || review.policyId !== policy.id || review.changeId !== change.id || citizenFreshness(feed.generatedAt, now) !== 'recent'
    || citizenFreshness(policy.lastRetrievedAt, now) !== 'recent' || !policy.latestChange
    || Date.parse(review.updatedAt) > now.getTime() || Date.parse(review.updatedAt) < Date.parse(change.publishedAt) || Date.parse(policy.latestChange.publishedAt) < Date.parse(change.publishedAt)) return 'unknown';
  if (policy.latestChange.id !== change.id) return 'reopened';
  return review.status;
}
export function buildBriefingRows(feed: CitizenFeed, preferences: BriefingPreferences, locale: CitizenLocale, now = new Date(), available = true): BriefingRow[] {
  const filters = preferences.filters;
  const rows: BriefingRow[] = [];
  for (const change of feed.changes) {
    const service = feed.services.find(s => s.id === change.serviceId);
    const policy = service?.policies.find(p => p.id === change.policyId);
    if (!service || !policy || !citizenSafeUrl(policy.sourceUrl)) continue;
    const age = now.getTime() - Date.parse(change.publishedAt);
    if (!Number.isFinite(age) || age < 0 || (filters.days && age > filters.days * 86_400_000)
      || (filters.serviceIds.length && !filters.serviceIds.includes(service.id))) continue;
    const matches = briefingMatches(change, locale);
    if (filters.topics.length && !matches.some(m => filters.topics.includes(m.topic))) continue;
    const review = preferences.reviews.find(r => r.changeId === change.id) ?? null;
    rows.push({ change, policy, service, matches, review, freshness: available ? citizenFreshness(policy.lastRetrievedAt, now) : 'unavailable', reviewState: briefingReviewState(review, change, policy, feed, now, available) });
  }
  return rows.sort((a, b) => b.change.publishedAt.localeCompare(a.change.publishedAt) || a.change.id.localeCompare(b.change.id));
}
export function buildPolicyBriefing(feed: CitizenFeed, preferences: BriefingPreferences, locale: CitizenLocale, includeLocalReviews = false, now = new Date(), available = true) {
  const rows = buildBriefingRows(feed, preferences, locale, now, available);
  return {
    schemaVersion: '1.0', generatedAt: now.toISOString(), catalogGeneratedAt: feed.generatedAt, locale,
    filters: preferences.filters, coverage: { liveAvailable: available, loadedChanges: feed.changes.length, matchingChanges: rows.length, hasMoreHistory: feed.history.hasMore, catalogTruncated: feed.catalogTruncated, missingSelectedServices: preferences.filters.serviceIds.filter(id => !feed.services.some(s => s.id === id)), catalogFreshness: available ? citizenFreshness(feed.generatedAt, now) : 'unavailable' },
    records: rows.map(row => ({ changeId: row.change.id, service: row.service.name, policyId: row.policy.id, policy: row.policy.name, jurisdiction: row.policy.jurisdiction,
      publishedAt: row.change.publishedAt, summary: row.change.summary[locale], kind: row.change.kind, matches: row.matches, source: { url: row.policy.sourceUrl, retrievedAt: row.policy.lastRetrievedAt, freshness: row.freshness },
      excerpts: row.change.evidence, links: { change: `https://policywatcher.online/change/${encodeURIComponent(row.change.id)}`, evidence: `https://policywatcher.online/api/evidence-packet/${encodeURIComponent(row.change.id)}` },
      ...(includeLocalReviews ? { localReview: row.review ? { ...row.review, effectiveState: row.reviewState } : null } : {}),
    })),
    localReviewsIncluded: includeLocalReviews,
    boundary: locale === 'it'
      ? 'I temi sono corrispondenze testuali nei riassunti o negli estratti caricati, non valutazioni di rischio o applicabilità. Nessun risultato non significa nessun cambiamento. Storico e catalogo possono essere parziali. Le scadenze sono promemoria scelti dall’utente, non termini legali. Le annotazioni locali non sono assegnazioni condivise né prove di conformità.'
      : 'Topics are text matches in loaded summaries or excerpts, not risk or applicability assessments. No matches does not mean no changes. History and catalog may be partial. Due dates are user-selected reminders, not legal deadlines. Local reviews are not shared assignments or compliance evidence.',
  };
}
export function briefingMarkdown(brief: ReturnType<typeof buildPolicyBriefing>): string {
  const it = brief.locale === 'it';
  const text = (value: string) => value.replace(/([\\`*_[\]<>#|])/g, '\\$1').replace(/\r?\n/g, ' ');
  return [`# PolicyWatcher · ${it ? 'Briefing policy' : 'Policy briefing'}`, `${it ? 'Preparato' : 'Prepared'}: ${brief.generatedAt}`, `${it ? 'Catalogo acquisito' : 'Catalog retrieved'}: ${brief.catalogGeneratedAt}`,
    ...(!brief.coverage.liveAvailable ? [it ? 'Aggiornamento non riuscito. I record provengono dall’ultima acquisizione indicata sopra. La copertura attuale è sconosciuta.' : 'Refresh failed. These records come from the last catalog retrieval shown above. Current coverage is unknown.'] : []),
    JSON.stringify(brief.coverage), brief.boundary, ...brief.records.flatMap(r => [
      `## ${text(r.service)} · ${text(r.policy)}`, `${it ? 'Pubblicato' : 'Published'}: ${r.publishedAt}`, text(r.summary),
      `${it ? 'Fonte' : 'Source'}: ${r.source.url}`, `${it ? 'Ultima acquisizione' : 'Last retrieval'}: ${r.source.retrievedAt ?? 'unavailable'} (${r.source.freshness})`,
      `${it ? 'Riscontri testuali' : 'Text matches'}: ${r.matches.map(m => `${BRIEFING_TOPICS[m.topic][brief.locale]}: ${m.term} (${m.location})`).join('; ') || (it ? 'non individuati' : 'none identified')}`,
      ...r.excerpts.map(e => `${it ? 'Prima' : 'Before'}: ${text(e.before)}\n\n${it ? 'Dopo' : 'After'}: ${text(e.after)}`), r.links.change, r.links.evidence,
      ...('localReview' in r && r.localReview ? [`${it ? 'Annotazione locale' : 'Local review'}: ${r.localReview.effectiveState}; ${text(r.localReview.role)}; ${r.localReview.dueDate}`] : []),
    ])].join('\n\n');
}
export function briefingCalendar(brief: ReturnType<typeof buildPolicyBriefing>): string {
  const escape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PolicyWatcher//Local Review Reminders//EN', 'CALSCALE:GREGORIAN'];
  for (const r of brief.records) {
    if (!('localReview' in r) || !r.localReview?.dueDate || !validBriefingDate(r.localReview.dueDate) || r.localReview.effectiveState === 'reviewed') continue;
    lines.push('BEGIN:VEVENT', `UID:pw-review-${r.changeId}@policywatcher.local`, `DTSTAMP:${brief.generatedAt.replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`, `DTSTART;VALUE=DATE:${r.localReview.dueDate.replace(/-/g, '')}`, `SUMMARY:${escape(`PolicyWatcher review: ${r.service} - ${r.policy}`)}`, `DESCRIPTION:${escape(`User-selected review date, not a legal deadline. ${r.links.change}`)}`, 'TRANSP:TRANSPARENT', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  // RFC 5545 folding is based on UTF-8 octets, never split a Unicode code point.
  return lines.map(line => { let result = '', bytes = 0; for (const c of line) { const n = new TextEncoder().encode(c).length; if (bytes + n > 75) { result += '\r\n '; bytes = 1; } result += c; bytes += n; } return result; }).join('\r\n') + '\r\n';
}
