import { NextResponse } from 'next/server';
import {
  authenticateEnterpriseRequest,
  getEnterpriseRequestId,
  type EnterpriseAuthContext,
  type EnterpriseAuthFailure,
} from './enterpriseApiAuth';
import { POLICYWATCHER_VERSION } from './release';

export const ENTERPRISE_API_VERSION = 'v2' as const;
export const ENTERPRISE_API_DEFAULT_PAGE_SIZE = 25;
export const ENTERPRISE_API_MAX_PAGE_SIZE = 100;

export interface EnterpriseRequestContext extends EnterpriseAuthContext {
  requestId: string;
}

export interface EnterprisePagination {
  page: number;
  pageSize: number;
}

export interface EnterpriseProblem {
  type: string;
  title: string;
  status: number;
  detail: string;
  code: string;
  requestId: string;
}

export type EnterpriseAuthorization =
  | { ok: true; context: EnterpriseRequestContext }
  | { ok: false; response: NextResponse<EnterpriseProblem> };

const PRIVATE_API_HEADERS = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
  Vary: 'Authorization',
};

function titleForStatus(status: number): string {
  if (status === 400) return 'Bad Request';
  if (status === 401) return 'Unauthorized';
  if (status === 403) return 'Forbidden';
  if (status === 404) return 'Not Found';
  if (status === 503) return 'Service Unavailable';
  return 'Internal Server Error';
}

export function enterpriseProblem(
  requestId: string,
  status: number,
  code: string,
  detail: string,
  title = titleForStatus(status)
): NextResponse<EnterpriseProblem> {
  const headers: Record<string, string> = {
    ...PRIVATE_API_HEADERS,
    'Content-Type': 'application/problem+json',
    'X-Request-Id': requestId,
  };
  if (status === 401) {
    headers['WWW-Authenticate'] = 'Bearer realm="PolicyWatcher Enterprise API"';
  }

  return NextResponse.json(
    {
      type: `https://policywatcher.online/problems/${code}`,
      title,
      status,
      detail,
      code,
      requestId,
    },
    { status, headers }
  );
}

function authFailureResponse(requestId: string, failure: EnterpriseAuthFailure) {
  return enterpriseProblem(requestId, failure.status, failure.code, failure.detail);
}

export async function authorizeEnterpriseRequest(request: Request): Promise<EnterpriseAuthorization> {
  const requestId = getEnterpriseRequestId(request);
  const result = await authenticateEnterpriseRequest(request);
  if (!result.ok) {
    return { ok: false, response: authFailureResponse(requestId, result) };
  }

  return {
    ok: true,
    context: {
      ...result.context,
      requestId,
    },
  };
}

export function enterpriseJson<T>(
  context: EnterpriseRequestContext,
  data: T,
  meta: Record<string, unknown> = {},
  init: { status?: number; headers?: Record<string, string> } = {}
) {
  return NextResponse.json(
    {
      apiVersion: ENTERPRISE_API_VERSION,
      data,
      meta: {
        generatedAt: new Date().toISOString(),
        tenantId: context.tenantId,
        requestId: context.requestId,
        ...meta,
      },
    },
    {
      status: init.status ?? 200,
      headers: {
        ...PRIVATE_API_HEADERS,
        'X-Request-Id': context.requestId,
        ...init.headers,
      },
    }
  );
}

export function parseEnterprisePagination(searchParams: URLSearchParams): EnterprisePagination | null {
  const pageValue = searchParams.get('page');
  const pageSizeValue = searchParams.get('pageSize');
  const page = pageValue === null ? 1 : Number(pageValue);
  const pageSize = pageSizeValue === null ? ENTERPRISE_API_DEFAULT_PAGE_SIZE : Number(pageSizeValue);

  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > ENTERPRISE_API_MAX_PAGE_SIZE
  ) {
    return null;
  }

  return { page, pageSize };
}

export function parseIsoDate(value: string | null, endOfDay = false): Date | null | undefined {
  if (value === null) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  return date;
}

export function parseEnterpriseLocale(value: string | null): 'en' | 'it' | null {
  if (value === null || value === '') return 'en';
  return value === 'en' || value === 'it' ? value : null;
}

export function parseJsonArray(value: string | null): unknown[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isEnterpriseResourceId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function hasOnlyQueryParameters(
  searchParams: URLSearchParams,
  allowedParameters: readonly string[]
): boolean {
  const allowed = new Set(allowedParameters);
  return [...searchParams.keys()].every((key) => allowed.has(key));
}

export function boundedQueryValue(
  value: string | null,
  options: { minLength?: number; maxLength: number; pattern?: RegExp }
): string | null | undefined {
  if (value === null || value === '') return undefined;
  const trimmed = value.trim();
  if (
    trimmed.length < (options.minLength ?? 1) ||
    trimmed.length > options.maxLength ||
    (options.pattern && !options.pattern.test(trimmed))
  ) {
    return null;
  }
  return trimmed;
}

export function getEnterpriseApiManifest() {
  return {
    release: POLICYWATCHER_VERSION,
    readOnly: true,
    authentication: {
      provider: 'Microsoft Entra ID',
      delegatedScope: 'policywatcher.read',
      applicationRole: 'PolicyWatcher.Read.All',
      tenantBound: true,
    },
    contract: '/api/v2/openapi.json',
    endpoints: [
      { method: 'GET', path: '/api/v2/manifest', capability: 'integration-directory' },
      { method: 'GET', path: '/api/v2/companies', capability: 'companies.read' },
      { method: 'GET', path: '/api/v2/changes', capability: 'changes.read' },
      { method: 'GET', path: '/api/v2/changes/{changeId}', capability: 'changes.read' },
      { method: 'GET', path: '/api/v2/sources/{sourceId}/continuity', capability: 'sources.read' },
      { method: 'GET', path: '/api/v2/observatory/signals', capability: 'observatory.read' },
    ],
    boundaries: [
      'Only evidence-gated records and curated reference metadata are returned.',
      'Raw policy text, snapshot hashes, private retrieval diagnostics, credentials, and admin logs are excluded.',
      'Tenant identity is derived only from a verified Microsoft Entra access token.',
      'This read-only wave does not persist tenant watchlists, entitlements, or delegated user preferences.',
    ],
  };
}
