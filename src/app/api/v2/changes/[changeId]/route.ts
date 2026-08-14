import { NextRequest } from 'next/server';
import {
  authorizeEnterpriseRequest,
  enterpriseJson,
  enterpriseProblem,
  isEnterpriseResourceId,
} from '@/lib/enterpriseApi';
import { getEnterpriseChange } from '@/lib/enterpriseApiData';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ changeId: string }> }
) {
  const authorization = await authorizeEnterpriseRequest(request);
  if (!authorization.ok) return authorization.response;
  const { context } = authorization;
  const { changeId } = await params;

  if (!isEnterpriseResourceId(changeId)) {
    return enterpriseProblem(context.requestId, 400, 'invalid_resource_id', 'The change identifier is invalid.');
  }

  try {
    const change = await getEnterpriseChange(changeId);
    if (!change) {
      return enterpriseProblem(context.requestId, 404, 'change_not_found', 'The evidence-gated change was not found.');
    }
    return enterpriseJson(context, change);
  } catch (error) {
    console.error(`[Enterprise API] ${context.requestId} change detail failed:`, error);
    return enterpriseProblem(context.requestId, 500, 'internal_error', 'The policy change is temporarily unavailable.');
  }
}
