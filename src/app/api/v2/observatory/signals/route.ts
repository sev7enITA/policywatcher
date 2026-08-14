import { NextRequest } from 'next/server';
import {
  authorizeEnterpriseRequest,
  boundedQueryValue,
  enterpriseJson,
  enterpriseProblem,
  hasOnlyQueryParameters,
  parseEnterpriseLocale,
} from '@/lib/enterpriseApi';
import { OBSERVATORY_VERIFIED_AT, observatorySignals, observatorySources } from '@/lib/observatory';

const ALLOWED_QUERY_PARAMETERS = ['lang', 'priority', 'region'] as const;
const PRIORITIES = ['high', 'medium', 'watch'] as const;

export async function GET(request: NextRequest) {
  const authorization = await authorizeEnterpriseRequest(request);
  if (!authorization.ok) return authorization.response;
  const { context } = authorization;
  const { searchParams } = request.nextUrl;

  if (!hasOnlyQueryParameters(searchParams, ALLOWED_QUERY_PARAMETERS)) {
    return enterpriseProblem(context.requestId, 400, 'invalid_query', 'The request contains an unsupported query parameter.');
  }

  const locale = parseEnterpriseLocale(searchParams.get('lang'));
  const region = boundedQueryValue(searchParams.get('region'), { maxLength: 50 });
  const priorityValue = boundedQueryValue(searchParams.get('priority'), { maxLength: 6 });
  const priority = priorityValue === undefined
    ? undefined
    : PRIORITIES.find((entry) => entry === priorityValue);
  if (!locale || region === null || priorityValue === null || (priorityValue !== undefined && !priority)) {
    return enterpriseProblem(context.requestId, 400, 'invalid_query', 'One or more query parameters are invalid.');
  }

  const sourcesById = new Map(observatorySources.map((source) => [source.id, source]));
  const signals = observatorySignals
    .filter((signal) => !region || signal.region === region)
    .filter((signal) => !priority || signal.priority === priority)
    .map((signal) => ({
      id: signal.id,
      title: signal.title[locale],
      summary: signal.summary[locale],
      contentType: signal.contentType,
      region: signal.region,
      priority: signal.priority,
      publishedOn: signal.publishedOn,
      reviewUtc: signal.reviewUtc,
      sourceUrl: signal.sourceUrl,
      source: (() => {
        const source = sourcesById.get(signal.sourceId);
        return source
          ? { id: source.id, name: source.name, authority: source.authority, url: source.url }
          : { id: signal.sourceId, name: signal.sourceId, authority: null, url: signal.sourceUrl };
      })(),
    }));

  return enterpriseJson(context, signals, {
    locale,
    total: signals.length,
    registryVerifiedAt: OBSERVATORY_VERIFIED_AT,
    registryMode: 'curated-local-registry',
  });
}
