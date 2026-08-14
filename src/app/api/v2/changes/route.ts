import { NextRequest } from 'next/server';
import {
  authorizeEnterpriseRequest,
  boundedQueryValue,
  enterpriseJson,
  enterpriseProblem,
  hasOnlyQueryParameters,
  isEnterpriseResourceId,
  parseEnterprisePagination,
  parseIsoDate,
} from '@/lib/enterpriseApi';
import { ENTERPRISE_RISKS, listEnterpriseChanges } from '@/lib/enterpriseApiData';

const ALLOWED_QUERY_PARAMETERS = [
  'companyId',
  'companySlug',
  'page',
  'pageSize',
  'region',
  'risk',
  'since',
  'until',
] as const;
const COMPANY_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REGION_RE = /^[A-Za-z][A-Za-z .()/-]{1,49}$/;

export async function GET(request: NextRequest) {
  const authorization = await authorizeEnterpriseRequest(request);
  if (!authorization.ok) return authorization.response;
  const { context } = authorization;
  const { searchParams } = request.nextUrl;

  if (!hasOnlyQueryParameters(searchParams, ALLOWED_QUERY_PARAMETERS)) {
    return enterpriseProblem(context.requestId, 400, 'invalid_query', 'The request contains an unsupported query parameter.');
  }

  const pagination = parseEnterprisePagination(searchParams);
  const companyId = boundedQueryValue(searchParams.get('companyId'), { maxLength: 36 });
  const companySlug = boundedQueryValue(searchParams.get('companySlug'), {
    maxLength: 100,
    pattern: COMPANY_SLUG_RE,
  });
  const region = boundedQueryValue(searchParams.get('region'), { maxLength: 50, pattern: REGION_RE });
  const riskValue = boundedQueryValue(searchParams.get('risk'), { maxLength: 6 });
  const since = parseIsoDate(searchParams.get('since'));
  const until = parseIsoDate(searchParams.get('until'), true);
  const risk = riskValue === undefined
    ? undefined
    : ENTERPRISE_RISKS.find((entry) => entry === riskValue);

  if (
    !pagination ||
    companyId === null ||
    (companyId !== undefined && !isEnterpriseResourceId(companyId)) ||
    companySlug === null ||
    region === null ||
    riskValue === null ||
    (riskValue !== undefined && !risk) ||
    since === null ||
    until === null ||
    (since && until && since > until)
  ) {
    return enterpriseProblem(context.requestId, 400, 'invalid_query', 'One or more query parameters are invalid.');
  }

  try {
    const result = await listEnterpriseChanges({
      ...pagination,
      companyId,
      companySlug,
      region,
      risk,
      since,
      until,
    });
    return enterpriseJson(context, result.data, result.meta);
  } catch (error) {
    console.error(`[Enterprise API] ${context.requestId} changes failed:`, error);
    return enterpriseProblem(context.requestId, 500, 'internal_error', 'Policy changes are temporarily unavailable.');
  }
}
