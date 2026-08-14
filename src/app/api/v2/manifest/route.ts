import { NextRequest } from 'next/server';
import {
  authorizeEnterpriseRequest,
  enterpriseJson,
  enterpriseProblem,
  getEnterpriseApiManifest,
} from '@/lib/enterpriseApi';

export async function GET(request: NextRequest) {
  const authorization = await authorizeEnterpriseRequest(request);
  if (!authorization.ok) return authorization.response;

  try {
    return enterpriseJson(authorization.context, getEnterpriseApiManifest());
  } catch (error) {
    console.error(`[Enterprise API] ${authorization.context.requestId} manifest failed:`, error);
    return enterpriseProblem(
      authorization.context.requestId,
      500,
      'internal_error',
      'The enterprise API manifest is temporarily unavailable.'
    );
  }
}
