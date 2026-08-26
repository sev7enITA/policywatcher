import {
  AGENTIC_INCIDENT_BOUNDARIES,
  AGENTIC_INCIDENT_MAPPING_VERSION,
  AGENTIC_INCIDENT_SCHEMA_VERSION,
  canonicalJsonDigest,
  type AgenticEntityAssociation,
  type ExternalIncidentProviderId,
  type NormalizedAgenticIncidentSignal,
} from './agenticIncidents';
import { getExternalIncidentProvider, isExternalIncidentProviderId } from './externalIncidentProviders';
import { listEnterpriseChanges, listEnterpriseCompanies } from './enterpriseApiData';

export const AGENTIC_INCIDENT_DEFAULT_LIMIT = 20;
export const AGENTIC_INCIDENT_MAX_LIMIT = 50;
export const VENDOR_RESPONSE_WINDOW_DAYS = 365;
export const AGENTIC_INCIDENT_MAX_ENTITY_ASSOCIATIONS = 50;
export const VENDOR_RESPONSE_MAX_COMPANIES = 8;

export interface PublicCompanyIdentity {
  id: string;
  name: string;
  slug: string;
}

export interface AgenticIncidentQuery {
  providerId: ExternalIncidentProviderId;
  companySlug?: string;
  capability?: string;
  limit: number;
  includeVendorResponses: boolean;
}

export type ParsedAgenticIncidentQuery =
  | { ok: true; value: AgenticIncidentQuery }
  | { ok: false; error: string };

function oneValue(searchParams: URLSearchParams, key: string) {
  return searchParams.getAll(key).length <= 1;
}

export function parseAgenticIncidentQuery(searchParams: URLSearchParams): ParsedAgenticIncidentQuery {
  const allowed = new Set(['provider', 'companySlug', 'capability', 'limit', 'vendorResponses']);
  if ([...searchParams.keys()].some((key) => !allowed.has(key))) {
    return { ok: false, error: 'Unsupported query parameter.' };
  }
  if ([...allowed].some((key) => !oneValue(searchParams, key))) {
    return { ok: false, error: 'Provide each query parameter at most once.' };
  }
  const providerRaw = searchParams.get('provider') || 'rogue-ai-tracker';
  if (!isExternalIncidentProviderId(providerRaw)) return { ok: false, error: 'Unsupported external incident provider.' };
  const companySlug = searchParams.get('companySlug')?.trim() || undefined;
  if (companySlug && (companySlug.length > 80 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(companySlug))) {
    return { ok: false, error: 'Invalid companySlug parameter.' };
  }
  const capability = searchParams.get('capability')?.trim() || undefined;
  if (capability && (capability.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(capability))) {
    return { ok: false, error: 'Invalid capability parameter.' };
  }
  const limitRaw = searchParams.get('limit');
  const limit = limitRaw === null ? AGENTIC_INCIDENT_DEFAULT_LIMIT : Number(limitRaw);
  if (!Number.isInteger(limit) || limit < 1 || limit > AGENTIC_INCIDENT_MAX_LIMIT) {
    return { ok: false, error: `limit must be an integer from 1 to ${AGENTIC_INCIDENT_MAX_LIMIT}.` };
  }
  const vendorResponses = searchParams.get('vendorResponses') || 'candidate';
  if (vendorResponses !== 'candidate' && vendorResponses !== 'none') {
    return { ok: false, error: 'vendorResponses must be candidate or none.' };
  }
  return {
    ok: true,
    value: {
      providerId: providerRaw,
      companySlug,
      capability,
      limit,
      includeVendorResponses: vendorResponses === 'candidate',
    },
  };
}

function normalizedWords(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function associateSignalsToPublicCompanies(
  signals: readonly NormalizedAgenticIncidentSignal[],
  companies: readonly PublicCompanyIdentity[],
): NormalizedAgenticIncidentSignal[] {
  const eligible = companies
    .map((company) => ({ company, phrase: normalizedWords(company.name) }))
    .filter(({ phrase }) => phrase.length >= 3)
    .sort((a, b) => a.company.slug.localeCompare(b.company.slug) || a.company.id.localeCompare(b.company.id));

  return signals.map((signal) => {
    const title = ` ${normalizedWords(signal.title)} `;
    const associations: AgenticEntityAssociation[] = eligible.flatMap(({ company, phrase }) => {
      if (!title.includes(` ${phrase} `)) return [];
      return [{
        companyId: company.id,
        companySlug: company.slug,
        companyName: company.name,
        matchBasis: 'canonical-company-name-exact-phrase' as const,
        mappingVersion: AGENTIC_INCIDENT_MAPPING_VERSION,
        localReview: {
          status: 'unreviewed' as const,
          reviewedAt: null,
          note: 'Candidate association from an exact canonical company-name phrase in provider metadata; human acceptance is still required.',
        },
      }];
    }).slice(0, AGENTIC_INCIDENT_MAX_ENTITY_ASSOCIATIONS);
    return { ...signal, entityAssociations: associations };
  });
}

async function loadPublicCompanies(): Promise<PublicCompanyIdentity[]> {
  const result = await listEnterpriseCompanies({ page: 1, pageSize: 100 });
  return result.data.map((company) => ({ id: company.id, name: company.name, slug: company.slug }));
}

type ChangeLoader = typeof listEnterpriseChanges;
type DatedAgenticIncidentSignal = NormalizedAgenticIncidentSignal & { occurredAt: string };

export async function buildVendorResponseMonitor(
  signals: readonly NormalizedAgenticIncidentSignal[],
  loadChanges: ChangeLoader = listEnterpriseChanges,
) {
  const associationsBySlug = new Map<string, { company: AgenticEntityAssociation; incidents: DatedAgenticIncidentSignal[] }>();
  for (const signal of signals) {
    if (!signal.occurredAt) continue;
    const datedSignal = signal as DatedAgenticIncidentSignal;
    for (const company of signal.entityAssociations) {
      const current = associationsBySlug.get(company.companySlug);
      if (current) current.incidents.push(datedSignal);
      else associationsBySlug.set(company.companySlug, { company, incidents: [datedSignal] });
    }
  }

  const companyCandidates = associationsBySlug.size;
  const selectedCompanies = [...associationsBySlug.values()]
    .sort((a, b) => a.company.companySlug.localeCompare(b.company.companySlug))
    .slice(0, VENDOR_RESPONSE_MAX_COMPANIES);
  const truncatedCompanies = Math.max(0, companyCandidates - selectedCompanies.length);
  const timelines = await Promise.all(selectedCompanies.map(async ({ company, incidents }) => {
    const earliest = new Date(Math.min(...incidents.map((incident) => Date.parse(incident.occurredAt))));
    const latest = new Date(Math.max(...incidents.map((incident) => Date.parse(incident.occurredAt))));
    latest.setUTCDate(latest.getUTCDate() + VENDOR_RESPONSE_WINDOW_DAYS);
    const result = await loadChanges({
      page: 1,
      pageSize: 100,
      companySlug: company.companySlug,
      since: earliest,
      until: latest < new Date() ? latest : new Date(),
    });
    const changes = result.data.map((change) => {
      const observedAt = change.evidence.observedAt instanceof Date
        ? change.evidence.observedAt.toISOString()
        : new Date(change.evidence.observedAt).toISOString();
      return {
        changeId: change.id,
        observedAt,
        company: {
          id: change.policy.company.id,
          slug: change.policy.company.slug,
          name: change.policy.company.name,
        },
        policy: {
          id: change.policy.id,
          name: change.policy.name,
          type: change.policy.type,
          jurisdiction: change.policy.jurisdiction,
        },
        evidence: {
          status: 'public-evidence-gated' as const,
          sourceUrl: change.evidence.sourceUrl,
          policyWatcherUrl: `https://policywatcher.online/change/${encodeURIComponent(change.id)}`,
        },
      };
    });
    return incidents.map((incident) => {
      const start = Date.parse(incident.occurredAt);
      const windowEnd = start + VENDOR_RESPONSE_WINDOW_DAYS * 86_400_000;
      const possibleChanges = changes
        .filter((change) => {
          const timestamp = Date.parse(change.observedAt);
          return timestamp >= start && timestamp <= windowEnd;
        })
        .map((change) => ({
          ...change,
          daysAfterIncident: Math.floor((Date.parse(change.observedAt) - start) / 86_400_000),
          association: 'temporal-after-incident' as const,
          causality: 'not-assessed' as const,
        }));
      return {
        incidentId: incident.id,
        incidentOccurredAt: incident.occurredAt,
        company,
        possibleChanges,
        boundary: 'Temporal association only. PolicyWatcher does not claim or infer that this incident caused any listed change.',
      };
    });
  }));
  return {
    timelines: timelines.flat().sort((a, b) => a.incidentOccurredAt.localeCompare(b.incidentOccurredAt)),
    companyCandidates,
    queriedCompanies: selectedCompanies.length,
    truncatedCompanies,
    truncated: truncatedCompanies > 0,
  };
}

export async function getAgenticIncidentObservatory(
  query: AgenticIncidentQuery,
  dependencies: {
    loadCompanies?: () => Promise<PublicCompanyIdentity[]>;
    loadChanges?: ChangeLoader;
  } = {},
) {
  const provider = getExternalIncidentProvider(query.providerId);
  const providerResult = await provider.retrieve();
  let associationState: 'available' | 'unavailable' = 'available';
  let associationMessage = 'Candidates use exact canonical public company names and remain unreviewed.';
  let associatedSignals = providerResult.signals;
  try {
    const companies = await (dependencies.loadCompanies || loadPublicCompanies)();
    associatedSignals = associateSignalsToPublicCompanies(providerResult.signals, companies);
  } catch (error) {
    console.error('[Agentic Incident Observatory] Public company association unavailable:', error);
    associationState = 'unavailable';
    associationMessage = 'Canonical public company records are temporarily unavailable; no entity association was attempted.';
  }

  const filtered = associatedSignals
    .filter((signal) => !query.companySlug || signal.entityAssociations.some((association) => association.companySlug === query.companySlug))
    .filter((signal) => !query.capability || signal.capabilityContext.some((capability) => capability.providerCapabilityId === query.capability))
    .sort((a, b) => (b.occurredAt || b.publishedAt).localeCompare(a.occurredAt || a.publishedAt) || a.id.localeCompare(b.id));
  const signals = filtered.slice(0, query.limit);

  let vendorResponseState: 'available' | 'unavailable' | 'not-requested' = query.includeVendorResponses ? 'available' : 'not-requested';
  let vendorResponseMessage = query.includeVendorResponses
    ? 'Possible public changes are evidence-gated and shown as temporal associations only.'
    : 'Vendor-response candidates were not requested.';
  let vendorResponseResult: Awaited<ReturnType<typeof buildVendorResponseMonitor>> = {
    timelines: [],
    companyCandidates: 0,
    queriedCompanies: 0,
    truncatedCompanies: 0,
    truncated: false,
  };
  if (query.includeVendorResponses && associationState === 'available') {
    try {
      vendorResponseResult = await buildVendorResponseMonitor(signals, dependencies.loadChanges || listEnterpriseChanges);
      if (vendorResponseResult.truncated) {
        vendorResponseMessage = `${vendorResponseMessage} Query fan-out was capped; ${vendorResponseResult.truncatedCompanies} company candidates were not queried.`;
      }
    } catch (error) {
      console.error('[Vendor Response Monitor] Evidence-gated change retrieval unavailable:', error);
      vendorResponseState = 'unavailable';
      vendorResponseMessage = 'Public change evidence is temporarily unavailable; no absence of vendor response may be inferred.';
    }
  } else if (query.includeVendorResponses) {
    vendorResponseState = 'unavailable';
    vendorResponseMessage = 'Vendor-response matching was not attempted because canonical entity association is unavailable.';
  }

  const generatedAt = new Date().toISOString();
  const digest = canonicalJsonDigest({
    providerDigest: providerResult.retrieval.digest,
    signals: signals.map((signal) => signal.provenance.digest),
    vendorResponses: vendorResponseResult.timelines.map((timeline) => ({
      incidentId: timeline.incidentId,
      companySlug: timeline.company.companySlug,
      changeIds: timeline.possibleChanges.map((change) => change.changeId),
    })),
  });
  return {
    schema: 'https://policywatcher.online/schemas/agentic-incident-signal/v1',
    schemaVersion: AGENTIC_INCIDENT_SCHEMA_VERSION,
    mappingVersion: AGENTIC_INCIDENT_MAPPING_VERSION,
    generatedAt,
    digest,
    provider: {
      descriptor: providerResult.descriptor,
      retrieval: providerResult.retrieval,
    },
    association: {
      state: associationState,
      mappingVersion: AGENTIC_INCIDENT_MAPPING_VERSION,
      message: associationMessage,
    },
    count: providerResult.retrieval.state === 'unavailable' || providerResult.retrieval.state === 'disabled'
      ? null
      : signals.length,
    signals,
    vendorResponseMonitor: {
      state: vendorResponseState,
      windowDays: VENDOR_RESPONSE_WINDOW_DAYS,
      message: vendorResponseMessage,
      companyCandidates: vendorResponseResult.companyCandidates,
      queriedCompanies: vendorResponseResult.queriedCompanies,
      truncatedCompanies: vendorResponseResult.truncatedCompanies,
      truncated: vendorResponseResult.truncated,
      timelines: vendorResponseResult.timelines,
      boundary: 'Temporal association only; not causation. An empty or unavailable timeline is not evidence that a vendor did not respond.',
    },
    provenance: {
      retrievedAt: providerResult.retrieval.retrievedAt,
      mappingVersion: AGENTIC_INCIDENT_MAPPING_VERSION,
      digest,
      metadataOnly: true,
    },
    boundaries: AGENTIC_INCIDENT_BOUNDARIES,
  };
}

export type AgenticIncidentObservatoryPayload = Awaited<ReturnType<typeof getAgenticIncidentObservatory>>;
