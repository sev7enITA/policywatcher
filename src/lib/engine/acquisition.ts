import { load } from 'cheerio';
import { acquireEngineTransport, hasLiveHostDrift, hasLivePathDrift, extractPolicyText, detectBlockPage, detectSoft404, type TransportResult } from '../scraper';
import { db } from '../db';
import { digest, structureDocument, assessDocument, type StructuredDocument } from './document';
import { DAILY_MS, putArtifact, readArtifact, type TaskInput, type Tx } from './store';

export interface CaptureBody { html: string; document: StructuredDocument; language?: string }
export interface Observation {
  artifactId: string | null; observedAt: string; source: string; httpStatus: number; finalUrl: string;
  notModified: boolean; eligible: boolean; reasons: string[]; retryAfterMs?: number;
  diagnostics: Array<{ source: string; status: number; reason: string }>;
  cache?: { key: string; etag: string | null; lastModified: string | null; profileHash: string };
}
/** Called only inside a fenced baseline/unchanged commit, never for an unconfirmed candidate. */
export async function saveRepresentation(tx: Tx, observation: Observation) {
  if (!observation.cache || !observation.artifactId) return;
  const { key, ...validators } = observation.cache;
  const data = { ...validators, artifactId: observation.artifactId, validatedAt: new Date(), expiresAt: new Date(Date.now() + 7 * DAILY_MS) };
  await tx.engineHttpCache.upsert({ where: { key }, create: { key, ...data }, update: data });
}
export type Transport = typeof acquireEngineTransport;
export function extractEngineBody(html: string, sourceUrl: string, contentLanguage?: string): CaptureBody {
  if (Buffer.byteLength(html) > 5_000_000) throw new Error('response_body_too_large');
  if (detectBlockPage(html) || detectSoft404(html)) throw new Error('source_block_or_soft_404');
  // Identity is established by the reviewed contract, not English keyword counts.
  const text = extractPolicyText(html, sourceUrl, { minimumTextLength: 100 });
  if (text.length < 100 || text.length > 500_000) throw new Error('extraction_size_out_of_bounds');
  const language = load(html)('html').attr('lang') || contentLanguage;
  return { html, document: structureDocument(text), ...(language ? { language } : {}) };
}
export function cacheable(result: TransportResult, sourceUrl: string): boolean {
  const v = result.validators;
  // Conservative: no redirects and no Vary. Representation has a fixed client profile.
  return result.status === 200 && result.finalUrl === sourceUrl && Boolean(v?.etag || v?.lastModified)
    && !v?.vary && !/no-store|private/i.test(v?.cacheControl || '');
}

export async function acquire(input: TaskInput, transport: Transport = acquireEngineTransport): Promise<Observation> {
  const observedAt = new Date().toISOString();
  if (!input.contract || input.contract.sourceUrl !== input.sourceUrl) return { artifactId: null, observedAt, source: 'none', httpStatus: 0, finalUrl: input.sourceUrl,
    notModified: false, eligible: false, reasons: [input.contract ? 'source_contract_mismatch' : 'source_contract_missing'], diagnostics: [] };
  const key = digest(JSON.stringify([input.sourceUrl, input.profileHash, 'engine-http-client-1']));
  const cached = !input.forceFresh ? await db.engineHttpCache.findUnique({ where: { key } }) : null;
  let cachedBody: CaptureBody | null = null;
  if (cached && cached.profileHash === input.profileHash && cached.expiresAt > new Date()) {
    try {
      cachedBody = await readArtifact<CaptureBody>(cached.artifactId);
      if (cachedBody.document.hash !== input.baselineHash) cachedBody = null;
    } catch { /* Corrupt cache forces a full retrieval. */ }
  }
  const diagnostics: Observation['diagnostics'] = [];
  const order: Array<'direct' | 'http2' | 'rendered'> = input.contract?.preferredTransport === 'rendered'
    ? ['rendered', 'direct', 'http2'] : ['direct', 'http2', 'rendered'];
  let lastStatus = 0, finalUrl = input.sourceUrl;
  let lastCandidate: Observation | null = null;
  for (const source of order) {
    let result: TransportResult;
    try { result = await transport(input.sourceUrl, source, source === 'direct' && cachedBody && cached
      ? { etag: cached.etag || undefined, lastModified: cached.lastModified || undefined } : undefined); }
    catch { diagnostics.push({ source, status: 0, reason: 'transport_failed' }); continue; }
    lastStatus = result.status; finalUrl = result.finalUrl;
    if (result.status === 429 || result.status === 503) {
      return { artifactId: null, observedAt, source, httpStatus: result.status, finalUrl, notModified: false,
        eligible: false, reasons: ['origin_backoff'], retryAfterMs: result.retryAfterMs || 60_000,
        diagnostics: [...diagnostics, { source, status: result.status, reason: 'origin_backoff' }] };
    }
    if (hasLiveHostDrift(input.sourceUrl, finalUrl, source) || hasLivePathDrift(input.sourceUrl, finalUrl, source)) {
      diagnostics.push({ source, status: result.status, reason: 'source_drift' }); continue;
    }
    if (result.status === 304) {
      if (input.forceFresh || source !== 'direct' || !cached || !cachedBody || finalUrl !== input.sourceUrl
        || result.validators?.vary || /no-store|private/i.test(result.validators?.cacheControl || '')) {
        diagnostics.push({ source, status: 304, reason: 'conditional_cache_ineligible' }); continue;
      }
      const assessment = assessDocument(cachedBody.document, input.contract, input.sourceUrl, cachedBody.language);
      return { artifactId: cached.artifactId, observedAt, source, httpStatus: 304, finalUrl, notModified: true,
        eligible: assessment.eligible, reasons: assessment.reasons, cache: { key, etag: cached.etag, lastModified: cached.lastModified, profileHash: input.profileHash },
        diagnostics: [...diagnostics, { source, status: 304, reason: 'cached_representation_revalidated' }] };
    }
    if (!result.ok) { diagnostics.push({ source, status: result.status, reason: 'transport_rejected' }); continue; }
    let body: CaptureBody;
    try { body = extractEngineBody(result.html, input.sourceUrl, result.validators?.contentLanguage); }
    catch { diagnostics.push({ source, status: result.status, reason: 'extraction_rejected' }); continue; }
    const { document, language } = body;
    const artifactId = await putArtifact(body);
    const assessment = assessDocument(document, input.contract, input.sourceUrl, language);
    diagnostics.push({ source, status: result.status, reason: assessment.eligible ? 'contract_satisfied' : assessment.reasons.join(',') });
    // A successful HTTP response with incomplete identity/coverage triggers the next transport.
    if (!assessment.eligible && source !== order[order.length - 1]) {
      lastCandidate = { artifactId, observedAt, source, httpStatus: result.status, finalUrl, notModified: false,
        eligible: false, reasons: assessment.reasons, diagnostics };
      continue;
    }
    const cache = assessment.eligible && source === 'direct' && cacheable(result, input.sourceUrl)
      ? { key, etag: result.validators?.etag || null, lastModified: result.validators?.lastModified || null, profileHash: input.profileHash } : undefined;
    return { artifactId, observedAt, source, httpStatus: result.status, finalUrl, notModified: false,
      eligible: assessment.eligible, reasons: assessment.reasons, diagnostics, cache };
  }
  if (lastCandidate) return { ...lastCandidate, diagnostics };
  return { artifactId: null, observedAt, source: 'none', httpStatus: lastStatus, finalUrl, notModified: false,
    eligible: false, reasons: ['live_source_unverified'], diagnostics };
}
