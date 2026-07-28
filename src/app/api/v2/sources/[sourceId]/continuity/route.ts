import { NextRequest } from 'next/server';
import {
  authorizeEnterpriseRequest,
  enterpriseJson,
  enterpriseProblem,
  isEnterpriseResourceId,
} from '@/lib/enterpriseApi';
import { getEnterpriseSourceContinuity } from '@/lib/enterpriseApiData';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const authorization = await authorizeEnterpriseRequest(request);
  if (!authorization.ok) return authorization.response;
  const { context } = authorization;
  const { sourceId } = await params;

  if (!isEnterpriseResourceId(sourceId)) {
    return enterpriseProblem(context.requestId, 400, 'invalid_resource_id', 'The source identifier is invalid.');
  }

  try {
    const continuity = await getEnterpriseSourceContinuity(sourceId);
    if (!continuity) {
      return enterpriseProblem(context.requestId, 404, 'source_not_found', 'The evidence-gated source was not found.');
    }
    return enterpriseJson(context, continuity);
  } catch (error) {
    console.error(`[Enterprise API] ${context.requestId} source continuity failed:`, error);
    return enterpriseProblem(context.requestId, 500, 'internal_error', 'Source continuity is temporarily unavailable.');
  }
}
