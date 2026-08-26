import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  AGENTIC_INCIDENT_BOUNDARIES,
  buildAgenticIncidentSchema,
  canonicalJsonDigest,
  stableAgenticIncidentId,
  type NormalizedAgenticIncidentSignal,
} from '../agenticIncidents';
import {
  associateSignalsToPublicCompanies,
  AGENTIC_INCIDENT_MAX_ENTITY_ASSOCIATIONS,
  buildVendorResponseMonitor,
  parseAgenticIncidentQuery,
  VENDOR_RESPONSE_MAX_COMPANIES,
} from '../agenticIncidentService';
import {
  resetRogueAiTrackerCacheForTests,
  retrieveRogueAiTracker,
  ROGUE_AI_TRACKER_MAX_STALE_MS,
  ROGUE_AI_TRACKER_MAX_RESPONSE_BYTES,
} from '../providers/rogueAiTracker';
import { listExternalIncidentProviders } from '../externalIncidentProviders';
import {
  formatAgenticVendorResponseCoverage,
  formatAgenticVendorResponses,
} from '../agenticIncidentAgent';

const previousEnabled = process.env.POLICYWATCHER_ROGUE_AI_TRACKER_ENABLED;

afterEach(() => {
  resetRogueAiTrackerCacheForTests();
  if (previousEnabled === undefined) delete process.env.POLICYWATCHER_ROGUE_AI_TRACKER_ENABLED;
  else process.env.POLICYWATCHER_ROGUE_AI_TRACKER_ENABLED = previousEnabled;
  vi.restoreAllMocks();
});

function providerIncident(overrides: Record<string, unknown> = {}) {
  return {
    id: 'incident-1',
    slug: 'incident-one',
    title: 'OpenAI agent exceeded its assigned task',
    summary: 'Narrative summary must not cross the adapter.',
    details: 'Narrative full text must not cross the adapter.',
    whyItMatters: 'Narrative analysis must not cross the adapter.',
    occurredAt: '2026-08-01T12:00:00Z',
    dateBasis: 'source-event-date',
    publishedAt: '2026-08-02T12:00:00Z',
    sourceName: 'Primary source',
    sourceUrl: 'https://example.com/report',
    evidenceAttribution: 'human-directed',
    attributionReview: { status: 'proposed', rationale: 'External rationale.' },
    tags: ['Task overreach', 'Field evidence'],
    gateImpacts: [{ gateId: 'scope-breach', score: 5, justification: { evidence: 'Excluded.' } }],
    ...overrides,
  };
}

function normalizedSignal(title = 'OpenAI agent exceeded its assigned task'): NormalizedAgenticIncidentSignal {
  return {
    id: stableAgenticIncidentId('rogue-ai-tracker', 'incident-1'),
    schemaVersion: '1.0.0',
    providerId: 'rogue-ai-tracker',
    externalId: 'incident-1',
    title,
    occurredAt: '2026-08-01T12:00:00.000Z',
    publishedAt: '2026-08-02T12:00:00.000Z',
    dateBasis: 'source-event-date',
    source: { name: 'Primary source', url: 'https://example.com/report' },
    providerUrl: 'https://rogueaitracker.com/incidents/incident-one',
    tags: ['Task overreach'],
    capabilityContext: [{ providerCapabilityId: 'scope-breach', score: 5 }],
    evidenceAttribution: 'human-directed',
    externalProviderReview: { status: 'proposed' },
    localReview: { status: 'unreviewed', reviewedAt: null, note: 'Not local evidence.' },
    entityAssociations: [],
    provenance: {
      providerId: 'rogue-ai-tracker',
      providerEndpoint: 'https://rogueaitracker.com/api/incidents',
      retrievedAt: '2026-08-26T08:00:00.000Z',
      mappingVersion: '2026-08-26',
      digest: 'a'.repeat(64),
      metadataOnly: true,
    },
    boundaries: AGENTIC_INCIDENT_BOUNDARIES,
  };
}

describe('agentic incident canonical contract', () => {
  it('derives stable provider-neutral IDs and canonical digests', () => {
    expect(stableAgenticIncidentId('rogue-ai-tracker', 'incident-1')).toMatch(/^pwai_[0-9a-f]{24}$/);
    expect(stableAgenticIncidentId('rogue-ai-tracker', 'incident-1')).toBe(stableAgenticIncidentId('rogue-ai-tracker', 'incident-1'));
    expect(canonicalJsonDigest({ b: 2, a: 1 })).toBe(canonicalJsonDigest({ a: 1, b: 2 }));
    expect(buildAgenticIncidentSchema().$id).toBe('https://policywatcher.online/schemas/agentic-incident-signal/v1');
  });

  it('publishes strict nested schema boundaries matching a normalized signal', () => {
    const schema = buildAgenticIncidentSchema();
    const signal = normalizedSignal();
    expect(schema.additionalProperties).toBe(false);
    expect(new Set(schema.required)).toEqual(new Set(Object.keys(signal)));
    expect(Object.keys(signal).every((key) => key in schema.properties)).toBe(true);
    expect(schema.properties.source).toMatchObject({ additionalProperties: false, required: ['name', 'url'] });
    expect(schema.properties.externalProviderReview).toMatchObject({ additionalProperties: false, required: ['status'] });
    expect('rationale' in schema.properties.externalProviderReview.properties).toBe(false);
    expect(schema.properties.localReview).toMatchObject({ additionalProperties: false, required: ['status', 'reviewedAt', 'note'] });
    expect(schema.properties.provenance).toMatchObject({
      additionalProperties: false,
      properties: { digest: { pattern: '^[0-9a-f]{64}$' }, metadataOnly: { const: true } },
    });
    expect(schema.properties.entityAssociations.items).toMatchObject({ additionalProperties: false });
    expect(schema.properties.boundaries).toMatchObject({
      additionalProperties: false,
      properties: {
        temporalAssociationNotCausation: { const: true },
        externalScoreNotPolicyRisk: { const: true },
        providerUnavailableNotNoIncidents: { const: true },
      },
    });
  });

  it('parses only bounded provider-neutral filters', () => {
    expect(parseAgenticIncidentQuery(new URLSearchParams())).toMatchObject({ ok: true, value: { providerId: 'rogue-ai-tracker', limit: 20 } });
    expect(parseAgenticIncidentQuery(new URLSearchParams('companySlug=openai&capability=scope-breach&vendorResponses=none'))).toMatchObject({ ok: true });
    expect(parseAgenticIncidentQuery(new URLSearchParams('limit=51'))).toMatchObject({ ok: false });
    expect(parseAgenticIncidentQuery(new URLSearchParams('provider=unknown'))).toMatchObject({ ok: false });
    expect(parseAgenticIncidentQuery(new URLSearchParams('admin=true'))).toMatchObject({ ok: false });
  });

  it('registers Rogue as an optional metadata-only provider, not a core evidence dependency', () => {
    expect(listExternalIncidentProviders()).toEqual([
      expect.objectContaining({
        id: 'rogue-ai-tracker',
        dataPolicy: 'metadata-only',
        evidenceRole: 'external-research-context',
      }),
    ]);
    expect(ROGUE_AI_TRACKER_MAX_RESPONSE_BYTES).toBeGreaterThan(0);
    expect(ROGUE_AI_TRACKER_MAX_STALE_MS).toBeGreaterThan(0);
    expect(Number.isFinite(ROGUE_AI_TRACKER_MAX_STALE_MS)).toBe(true);
  });
});

describe('Rogue AI Tracker optional adapter', () => {
  it('is fail-closed and disabled unless explicitly enabled', async () => {
    delete process.env.POLICYWATCHER_ROGUE_AI_TRACKER_ENABLED;
    const fetchMock = vi.fn();
    const result = await retrieveRogueAiTracker({ fetchImpl: fetchMock, bypassCache: true });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.retrieval).toMatchObject({ state: 'disabled', acceptedRecords: null });
    expect(result.signals).toEqual([]);
  });

  it('normalizes metadata, deduplicates IDs and excludes narrative provider content', async () => {
    process.env.POLICYWATCHER_ROGUE_AI_TRACKER_ENABLED = 'true';
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      incidents: [
        providerIncident(),
        providerIncident(),
        providerIncident({ id: '', slug: '' }),
        providerIncident({ id: 'incident-2', slug: 'incident-two', occurredAt: null }),
      ],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    const result = await retrieveRogueAiTracker({ fetchImpl: fetchMock, bypassCache: true, now: new Date('2026-08-26T08:00:00Z') });
    expect(result.retrieval).toMatchObject({
      state: 'live',
      acceptedRecords: 2,
      rejectedRecords: 2,
      rejectedReasonCounts: { duplicate_external_id: 1, invalid_schema: 1 },
      warningCounts: { missing_occurred_at: 1 },
    });
    expect(result.signals[0]).toMatchObject({
      externalProviderReview: { status: 'proposed' },
      localReview: { status: 'unreviewed' },
      provenance: { metadataOnly: true, mappingVersion: '2026-08-26' },
      boundaries: { temporalAssociationNotCausation: true, externalScoreNotPolicyRisk: true },
    });
    expect(result.signals.find((signal) => signal.externalId === 'incident-2')).toMatchObject({
      occurredAt: null,
      dateBasis: 'provider-published-date-only',
    });
    expect(JSON.stringify(result)).not.toMatch(/Narrative summary|Narrative full text|Narrative analysis|External rationale|rationale|justification/i);
  });

  it('digests every selected provider-derived public metadata field but not excluded rationale', async () => {
    process.env.POLICYWATCHER_ROGUE_AI_TRACKER_ENABLED = 'true';
    const digestFor = async (overrides: Record<string, unknown>) => {
      const result = await retrieveRogueAiTracker({
        fetchImpl: vi.fn(async () => new Response(JSON.stringify({ incidents: [providerIncident(overrides)] }), { status: 200 })),
        bypassCache: true,
        now: new Date('2026-08-26T08:00:00Z'),
      });
      return result.signals[0]?.provenance.digest;
    };
    const base = await digestFor({});
    const mutations = [
      { id: 'incident-changed' },
      { title: 'Changed public title' },
      { occurredAt: '2026-08-03T12:00:00Z' },
      { publishedAt: '2026-08-04T12:00:00Z' },
      { evidenceAttribution: 'agent-initiated' },
      { attributionReview: { status: 'accepted', rationale: 'External rationale.' } },
      { dateBasis: 'first-public-evidence' },
      { slug: 'changed-provider-slug' },
      { sourceName: 'Changed primary source' },
      { sourceUrl: 'https://example.com/changed-report' },
      { tags: ['Different tag'] },
      { gateImpacts: [{ gateId: 'scope-breach', score: 6 }] },
    ];
    for (const mutation of mutations) expect(await digestFor(mutation)).not.toBe(base);
    expect(await digestFor({ attributionReview: { status: 'proposed', rationale: 'Changed excluded rationale.' } })).toBe(base);
  });

  it('rejects oversized provider responses without reporting zero incidents', async () => {
    process.env.POLICYWATCHER_ROGUE_AI_TRACKER_ENABLED = 'true';
    const response = new Response('{}', {
      status: 200,
      headers: { 'Content-Length': String(ROGUE_AI_TRACKER_MAX_RESPONSE_BYTES + 1) },
    });
    const result = await retrieveRogueAiTracker({ fetchImpl: vi.fn(async () => response), bypassCache: true });
    expect(result.retrieval).toMatchObject({ state: 'unavailable', acceptedRecords: null });
    expect(result.retrieval.message).toMatch(/does not mean that no incidents/i);
  });

  it('does not serve a validated cache beyond its finite maximum stale age', async () => {
    process.env.POLICYWATCHER_ROGUE_AI_TRACKER_ENABLED = 'true';
    const firstAt = new Date('2026-08-01T00:00:00Z');
    await retrieveRogueAiTracker({
      fetchImpl: vi.fn(async () => new Response(JSON.stringify({ incidents: [providerIncident()] }), { status: 200 })),
      bypassCache: true,
      now: firstAt,
    });
    const failed = await retrieveRogueAiTracker({
      fetchImpl: vi.fn(async () => { throw new Error('network_down'); }),
      bypassCache: true,
      now: new Date(firstAt.getTime() + ROGUE_AI_TRACKER_MAX_STALE_MS + 1),
    });
    expect(failed.retrieval.state).toBe('unavailable');
    expect(failed.signals).toEqual([]);
  });
});

describe('entity candidates and vendor response monitor', () => {
  it('proposes only exact canonical company-name phrases and keeps review local', () => {
    const companies = [
      { id: 'company-openai', slug: 'openai', name: 'OpenAI' },
      { id: 'company-meta', slug: 'meta', name: 'Meta' },
    ];
    const [match, falsePositive] = associateSignalsToPublicCompanies(
      [normalizedSignal(), normalizedSignal('Agent metadata exposure did not name a vendor')],
      companies,
    );
    expect(match.entityAssociations).toEqual([
      expect.objectContaining({ companySlug: 'openai', matchBasis: 'canonical-company-name-exact-phrase', localReview: { status: 'unreviewed', reviewedAt: null, note: expect.any(String) } }),
    ]);
    expect(falsePositive.entityAssociations).toEqual([]);
  });

  it('caps entity candidates deterministically at the public schema maximum', () => {
    const companies = Array.from({ length: 60 }, (_, index) => ({
      id: `company-${String(index).padStart(2, '0')}`,
      slug: `vendor-${String(index).padStart(2, '0')}`,
      name: `V${String(index).padStart(2, '0')}`,
    })).reverse();
    const title = companies.map((company) => company.name).join(' and ');
    const [signal] = associateSignalsToPublicCompanies([normalizedSignal(title)], companies);
    expect(signal.entityAssociations).toHaveLength(AGENTIC_INCIDENT_MAX_ENTITY_ASSOCIATIONS);
    expect(signal.entityAssociations.map((association) => association.companySlug)).toEqual(
      [...signal.entityAssociations.map((association) => association.companySlug)].sort(),
    );
    expect(signal.entityAssociations.at(-1)?.companySlug).toBe('vendor-49');
  });

  it('returns only post-incident public-evidence changes with a non-causation boundary', async () => {
    const [signal] = associateSignalsToPublicCompanies(
      [normalizedSignal()],
      [{ id: 'company-openai', slug: 'openai', name: 'OpenAI' }],
    );
    const loadChanges = vi.fn(async () => ({
      data: [{
        id: 'change-1',
        createdAt: new Date('2026-08-10T00:00:00Z'),
        overallRisk: 'Medium',
        overallScore: 5,
        tldrEn: 'Summary',
        tldrIt: 'Sommario',
        aiSummaryEn: 'Summary',
        aiSummaryIt: 'Sommario',
        keyPoints: [],
        riskReasons: [],
        policy: {
          id: 'policy-1', name: 'Usage Policy', type: 'acceptable-use', jurisdiction: 'Global', url: 'https://example.com/policy',
          company: { id: 'company-openai', name: 'OpenAI', slug: 'openai', industry: 'AI' },
        },
        newSnapshot: { version: 2, createdAt: new Date('2026-08-10T00:00:00Z'), publicEvidence: true },
        regionImpacts: [],
        evidence: { publicEvidence: true, snapshotVersion: 2, observedAt: new Date('2026-08-10T00:00:00Z'), sourceUrl: 'https://example.com/policy' },
      }],
      meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
    }));
    const monitor = await buildVendorResponseMonitor([signal], loadChanges as never);
    expect(monitor.timelines[0]).toMatchObject({
      incidentId: signal.id,
      company: { companySlug: 'openai', localReview: { status: 'unreviewed' } },
      possibleChanges: [{
        changeId: 'change-1',
        association: 'temporal-after-incident',
        causality: 'not-assessed',
        evidence: { status: 'public-evidence-gated' },
      }],
    });
    expect(monitor.timelines[0].boundary).toMatch(/does not claim or infer/i);
    expect(monitor).toMatchObject({ companyCandidates: 1, queriedCompanies: 1, truncatedCompanies: 0, truncated: false });
  });

  it('bounds vendor-response database fan-out and reports deterministic truncation', async () => {
    const signal = normalizedSignal();
    signal.entityAssociations = Array.from({ length: 20 }, (_, index) => ({
      companyId: `company-${index}`,
      companySlug: `vendor-${String(index).padStart(2, '0')}`,
      companyName: `Vendor ${index}`,
      matchBasis: 'canonical-company-name-exact-phrase',
      mappingVersion: '2026-08-26',
      localReview: { status: 'unreviewed', reviewedAt: null, note: 'Candidate.' },
    }));
    const loadChanges = vi.fn(async () => ({
      data: [],
      meta: { page: 1, pageSize: 100, total: 0, totalPages: 1 },
    }));
    const monitor = await buildVendorResponseMonitor([signal], loadChanges as never);
    expect(loadChanges).toHaveBeenCalledTimes(VENDOR_RESPONSE_MAX_COMPANIES);
    expect(monitor).toMatchObject({
      companyCandidates: 20,
      queriedCompanies: VENDOR_RESPONSE_MAX_COMPANIES,
      truncatedCompanies: 20 - VENDOR_RESPONSE_MAX_COMPANIES,
      truncated: true,
    });
    expect(monitor.timelines).toHaveLength(VENDOR_RESPONSE_MAX_COMPANIES);
  });
});

describe('agent and UI vendor-response consumers', () => {
  it('aggregates every company timeline for one incident and reports truncation coverage', () => {
    const company = (slug: string, name: string) => ({
      companyId: `company-${slug}`,
      companySlug: slug,
      companyName: name,
      matchBasis: 'canonical-company-name-exact-phrase' as const,
      mappingVersion: '2026-08-26' as const,
      localReview: { status: 'unreviewed' as const, reviewedAt: null, note: 'Candidate.' },
    });
    const change = {
      changeId: 'change-alpha',
      observedAt: '2026-08-10T00:00:00.000Z',
      company: { id: 'company-alpha', slug: 'alpha', name: 'Alpha' },
      policy: { id: 'policy-alpha', name: 'Alpha Usage Policy', type: 'acceptable-use', jurisdiction: 'Global' },
      evidence: {
        status: 'public-evidence-gated' as const,
        sourceUrl: 'https://example.com/alpha-policy',
        policyWatcherUrl: 'https://policywatcher.online/change/change-alpha',
      },
      daysAfterIncident: 9,
      association: 'temporal-after-incident' as const,
      causality: 'not-assessed' as const,
    };
    const monitor = {
      state: 'available' as const,
      windowDays: 365,
      message: 'Bounded monitor result.',
      companyCandidates: 3,
      queriedCompanies: 2,
      truncatedCompanies: 1,
      truncated: true,
      timelines: [
        { incidentId: 'incident-1', incidentOccurredAt: '2026-08-01T00:00:00.000Z', company: company('alpha', 'Alpha'), possibleChanges: [change], boundary: 'Temporal only.' },
        { incidentId: 'incident-1', incidentOccurredAt: '2026-08-01T00:00:00.000Z', company: company('beta', 'Beta'), possibleChanges: [], boundary: 'Temporal only.' },
        { incidentId: 'incident-other', incidentOccurredAt: '2026-08-01T00:00:00.000Z', company: company('gamma', 'Gamma'), possibleChanges: [], boundary: 'Temporal only.' },
      ],
      boundary: 'Temporal association only.',
    };
    const context = formatAgenticVendorResponses('incident-1', monitor);
    expect(context).toContain('Alpha (unreviewed association)');
    expect(context).toContain('Alpha Usage Policy');
    expect(context).toContain('Beta (unreviewed association)');
    expect(context).toContain('do not infer no response');
    expect(context).not.toContain('Gamma');
    expect(formatAgenticVendorResponseCoverage(monitor)).toBe('Vendor response coverage: queried 2/3; truncated 1.');
  });

  it('keeps global monitor status, message and zero/truncation metrics visible in the Observatory UI', () => {
    const page = readFileSync(join(process.cwd(), 'src/app/observatory/agentic-incidents/page.tsx'), 'utf8');
    expect(page).toContain('payload.vendorResponseMonitor.message');
    expect(page).toContain('payload.vendorResponseMonitor.companyCandidates');
    expect(page).toContain('payload.vendorResponseMonitor.queriedCompanies');
    expect(page).toContain('payload.vendorResponseMonitor.truncatedCompanies');
    expect(page).toContain('payload.vendorResponseMonitor.truncated');
    expect(page).toContain('Showing 4 of {timeline.possibleChanges.length} bounded changes');
    expect(page.indexOf('className={styles.vendorMonitorPanel}')).toBeLessThan(page.indexOf('{!providerAvailable ?'));
  });
});
