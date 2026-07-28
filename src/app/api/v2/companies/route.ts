import { NextRequest } from 'next/server';
import {
  authorizeEnterpriseRequest,
  boundedQueryValue,
  enterpriseJson,
  enterpriseProblem,
  hasOnlyQueryParameters,
  parseEnterprisePagination,
} from '@/lib/enterpriseApi';
import { listEnterpriseCompanies } from '@/lib/enterpriseApiData';

const ALLOWED_QUERY_PARAMETERS = ['industry', 'page', 'pageSize', 'q'] as const;

export async function GET(request: NextRequest) {
  const authorization = await authorizeEnterpriseRequest(request);
  if (!authorization.ok) return authorization.response;
  const { context } = authorization;
  const { searchParams } = request.nextUrl;

  if (!hasOnlyQueryParameters(searchParams, ALLOWED_QUERY_PARAMETERS)) {
    return enterpriseProblem(context.requestId, 400, 'invalid_query', 'The request contains an unsupported query parameter.');
  }

  const pagination = parseEnterprisePagination(searchParams);
  const industry = boundedQueryValue(searchParams.get('industry'), { maxLength: 80 });
  const query = boundedQueryValue(searchParams.get('q'), { minLength: 2, maxLength: 100 });
  if (!pagination || industry === null || query === null) {
    return enterpriseProblem(context.requestId, 400, 'invalid_query', 'One or more query parameters are invalid.');
  }

  try {
    const result = await listEnterpriseCompanies({ ...pagination, industry, query });
    return enterpriseJson(context, result.data, result.meta);
  } catch (error) {
    console.error(`[Enterprise API] ${context.requestId} companies failed:`, error);
    return enterpriseProblem(context.requestId, 500, 'internal_error', 'Companies are temporarily unavailable.');
  }
}
