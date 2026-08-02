/**
 * Admin VPS Services API
 *
 * GET  /api/admin/vps-services - Inspect configured VPS companion services.
 * POST /api/admin/vps-services - Run controlled renderer or VPS agent actions.
 *
 * Secrets remain server-side. Responses expose only operational status,
 * masked endpoint data and non-sensitive diagnostics.
 */

import { createHash, createHmac, randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { recordAdminAccess } from '@/lib/adminAccessLog';

type ServiceStatus = 'online' | 'offline' | 'misconfigured' | 'degraded';

interface RendererHealthPayload {
  ok?: boolean;
  active?: number;
  uptimeSeconds?: number;
  capacity?: number;
  maxConcurrency?: number;
  navTimeoutMs?: number;
  service?: string;
  version?: string;
  state?: string;
  secretRotation?: string;
  targetAllowlistCount?: number;
  subresourceAllowlistCount?: number;
  browserVersionMajor?: string;
  userAgentMode?: string;
}

interface AgentStatusPayload {
  ok?: boolean;
  service?: string;
  agentVersion?: string;
  state?: string;
  locked?: { operation: string; startedAt: string } | null;
  renderer?: {
    current?: { ok?: boolean; reason?: string; path?: string; version?: string };
    health?: {
      ok?: boolean;
      httpStatus?: number | null;
      latencyMs?: number | null;
      payload?: RendererHealthPayload | null;
      error?: string | null;
    };
    serviceName?: string;
  };
  paths?: {
    rendererRoot?: string;
    current?: string;
    packages?: string;
    backups?: string;
  };
  lastOperation?: unknown;
  generatedAt?: string;
  error?: string;
}

const HEALTH_TIMEOUT_MS = 8_000;
const SMOKE_TIMEOUT_MS = 20_000;
const AGENT_TIMEOUT_MS = 30_000;
const DEFAULT_SMOKE_URL = 'https://www.policywatcher.online';

function getSmokeUrl(): string {
  return (
    process.env.VPS_RENDERER_SMOKE_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    DEFAULT_SMOKE_URL
  );
}

function hasEnvValue(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function normalizeHttpServiceUrl(rawValue: string | undefined): string | null {
  const raw = rawValue?.trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    if (parsed.username || parsed.password || parsed.search || parsed.hash) return null;
    return raw.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

function serviceUrlError(name: string): string {
  if (!hasEnvValue(name)) return `${name} is not configured.`;
  return `${name} must be an absolute http(s) URL without credentials, query string or hash.`;
}

function getRendererUrl(): string | null {
  return normalizeHttpServiceUrl(process.env.RENDERER_URL);
}

function getRendererSecret(): string | null {
  const raw = process.env.RENDERER_SECRET?.trim();
  return raw || null;
}

function getAgentUrl(): string | null {
  return normalizeHttpServiceUrl(process.env.VPS_AGENT_URL);
}

function getAgentSecret(): string | null {
  const raw = process.env.VPS_AGENT_SECRET?.trim();
  return raw || null;
}

function publicEndpoint(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return url;
  }
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function signAgentRequest(method: string, path: string, body: string, secret: string) {
  const timestamp = new Date().toISOString();
  const nonce = randomUUID();
  const canonical = `${method.toUpperCase()}\n${path}\n${timestamp}\n${nonce}\n${sha256Text(body)}`;
  const signature = createHmac('sha256', secret).update(canonical).digest('hex');
  return { timestamp, nonce, signature };
}

async function timedFetch(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<{ response: Response; latencyMs: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(url, {
      ...init,
      cache: 'no-store',
      signal: controller.signal,
    });
    return { response, latencyMs: Date.now() - started };
  } finally {
    clearTimeout(timeout);
  }
}

async function callAgent(path: string, options: { method?: 'GET' | 'POST'; body?: unknown } = {}) {
  const agentUrl = getAgentUrl();
  const secret = getAgentSecret();
  const method = options.method || 'GET';

  if (!agentUrl || !secret) {
    return {
      ok: false,
      httpStatus: null,
      latencyMs: null,
      payload: { error: 'VPS agent URL or secret is not configured.' },
      error: 'agent_not_configured',
    };
  }

  const rawBody = method === 'GET' ? '' : JSON.stringify(options.body || {});
  const signed = signAgentRequest(method, path, rawBody, secret);
  try {
    const { response, latencyMs } = await timedFetch(
      `${agentUrl}${path}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-policywatcher-timestamp': signed.timestamp,
          'x-policywatcher-nonce': signed.nonce,
          'x-policywatcher-signature': signed.signature,
        },
        body: method === 'GET' ? undefined : rawBody,
      },
      AGENT_TIMEOUT_MS
    );
    const text = await response.text();
    let payload: unknown = {};
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: 'invalid_agent_json' };
    }
    return {
      ok: response.ok,
      httpStatus: response.status,
      latencyMs,
      payload,
      error: response.ok ? null : (payload as { error?: string }).error || `agent_http_${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      httpStatus: null,
      latencyMs: null,
      payload: { error: error instanceof Error ? error.message : 'agent_request_failed' },
      error: error instanceof Error ? error.message : 'agent_request_failed',
    };
  }
}

async function checkRendererHealth() {
  const rendererUrl = getRendererUrl();
  const secret = getRendererSecret();

  if (!rendererUrl) {
    return {
      id: 'renderer',
      name: 'Renderer VPS',
      status: 'misconfigured' as ServiceStatus,
      endpoint: publicEndpoint(process.env.RENDERER_URL?.trim() || null),
      configured: false,
      secretConfigured: Boolean(secret),
      latencyMs: null,
      health: null,
      error: serviceUrlError('RENDERER_URL'),
      checkedAt: new Date().toISOString(),
    };
  }

  if (!secret) {
    return {
      id: 'renderer',
      name: 'Renderer VPS',
      status: 'misconfigured' as ServiceStatus,
      endpoint: publicEndpoint(rendererUrl),
      configured: false,
      secretConfigured: false,
      latencyMs: null,
      health: null,
      error: 'RENDERER_SECRET is not configured.',
      checkedAt: new Date().toISOString(),
    };
  }

  try {
    const { response, latencyMs } = await timedFetch(
      `${rendererUrl}/readyz`,
      { method: 'GET', headers: { Authorization: `Bearer ${secret}` } },
      HEALTH_TIMEOUT_MS
    );
    const text = await response.text();
    let health: RendererHealthPayload | null = null;
    try {
      health = JSON.parse(text) as RendererHealthPayload;
    } catch {
      health = null;
    }

    const ok = response.ok && health?.ok === true;
    return {
      id: 'renderer',
      name: 'Renderer VPS',
      status: (ok ? 'online' : 'degraded') as ServiceStatus,
      endpoint: publicEndpoint(rendererUrl),
      configured: true,
      secretConfigured: true,
      latencyMs,
      httpStatus: response.status,
      health,
      error: ok ? null : `Unexpected readiness response: HTTP ${response.status}`,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      id: 'renderer',
      name: 'Renderer VPS',
      status: 'offline' as ServiceStatus,
      endpoint: publicEndpoint(rendererUrl),
      configured: true,
      secretConfigured: true,
      latencyMs: null,
      health: null,
      error: message,
      checkedAt: new Date().toISOString(),
    };
  }
}

async function checkAgentStatus() {
  const agentUrl = getAgentUrl();
  const secret = getAgentSecret();

  if (!agentUrl) {
    return {
      id: 'agent',
      name: 'VPS Operations Agent',
      status: 'misconfigured' as ServiceStatus,
      endpoint: publicEndpoint(process.env.VPS_AGENT_URL?.trim() || null),
      configured: false,
      secretConfigured: Boolean(secret),
      latencyMs: null,
      health: null,
      error: serviceUrlError('VPS_AGENT_URL'),
      checkedAt: new Date().toISOString(),
    };
  }

  if (!secret) {
    return {
      id: 'agent',
      name: 'VPS Operations Agent',
      status: 'misconfigured' as ServiceStatus,
      endpoint: publicEndpoint(agentUrl),
      configured: false,
      secretConfigured: false,
      latencyMs: null,
      health: null,
      error: 'VPS_AGENT_SECRET is not configured.',
      checkedAt: new Date().toISOString(),
    };
  }

  const result = await callAgent('/status');
  const health = result.payload as AgentStatusPayload;
  const ok = result.ok && health?.ok !== false;
  return {
    id: 'agent',
    name: 'VPS Operations Agent',
    status: (ok ? 'online' : health?.state === 'manual_intervention_required' ? 'degraded' : 'offline') as ServiceStatus,
    endpoint: publicEndpoint(agentUrl),
    configured: true,
    secretConfigured: true,
    latencyMs: result.latencyMs,
    httpStatus: result.httpStatus,
    health,
    error: ok ? null : result.error,
    checkedAt: new Date().toISOString(),
  };
}

async function runRendererSmoke() {
  const rendererUrl = getRendererUrl();
  const secret = getRendererSecret();

  if (!rendererUrl || !secret) {
    return {
      ok: false,
      status: 'misconfigured' as ServiceStatus,
      error: 'Renderer URL or secret is missing.',
      testedAt: new Date().toISOString(),
    };
  }

  const smokeUrl = getSmokeUrl();

  try {
    const { response, latencyMs } = await timedFetch(
      `${rendererUrl}/render`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: smokeUrl }),
      },
      SMOKE_TIMEOUT_MS
    );

    const body = await response.text();
    let parsed: { html?: string; finalUrl?: string; status?: number; error?: string } = {};
    try {
      parsed = JSON.parse(body);
    } catch {
      parsed = {};
    }

    const htmlLength = parsed.html?.length ?? 0;
    const ok = response.ok && htmlLength > 100;
    return {
      ok,
      status: (ok ? 'online' : 'degraded') as ServiceStatus,
      latencyMs,
      httpStatus: response.status,
      sourceUrl: smokeUrl,
      finalUrl: parsed.finalUrl || null,
      renderedStatus: parsed.status ?? null,
      htmlLength,
      error: ok ? null : parsed.error || `Unexpected render response: HTTP ${response.status}`,
      testedAt: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      status: 'offline' as ServiceStatus,
      latencyMs: null,
      httpStatus: null,
      sourceUrl: smokeUrl,
      finalUrl: null,
      renderedStatus: null,
      htmlLength: 0,
      error: message,
      testedAt: new Date().toISOString(),
    };
  }
}

function auditVpsOperation(request: NextRequest, action: string, username?: string, actorRole?: string, detail?: string) {
  void recordAdminAccess({
    event: 'vps_operation',
    request,
    username,
    actorRole,
    detail: `${action}${detail ? `: ${detail}` : ''}`,
  });
}

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [renderer, agent] = await Promise.all([
    checkRendererHealth(),
    checkAgentStatus(),
  ]);

  return NextResponse.json({
    role: session.role,
    generatedAt: new Date().toISOString(),
    services: [renderer, agent],
    appRuntime: {
      nodeEnv: process.env.NODE_ENV || 'development',
      rendererUrlConfigured: hasEnvValue('RENDERER_URL'),
      rendererUrlValid: Boolean(getRendererUrl()),
      rendererSecretConfigured: Boolean(getRendererSecret()),
      agentUrlConfigured: hasEnvValue('VPS_AGENT_URL'),
      agentUrlValid: Boolean(getAgentUrl()),
      agentSecretConfigured: Boolean(getAgentSecret()),
    },
  });
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  let body: { action?: string; serviceId?: string; version?: string; sha256?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (body.serviceId === 'renderer' && body.action === 'smoke-render') {
    const result = await runRendererSmoke();
    auditVpsOperation(request, 'renderer_smoke_render', undefined, session.role, result.ok ? 'ok' : result.error || 'failed');
    return NextResponse.json({
      serviceId: 'renderer',
      action: 'smoke-render',
      result,
    });
  }

  if (body.serviceId !== 'agent') {
    return NextResponse.json({ error: 'Unsupported service action.' }, { status: 400 });
  }

  const actionToEndpoint: Record<string, { path: string; method: 'GET' | 'POST'; payload?: unknown }> = {
    'agent-smoke': { path: '/smoke-test', method: 'POST' },
    backup: { path: '/backup', method: 'POST' },
    rollback: { path: '/rollback', method: 'POST' },
    logs: { path: '/logs', method: 'GET' },
    update: {
      path: '/update',
      method: 'POST',
      payload: { version: body.version, sha256: body.sha256 },
    },
  };

  const operation = body.action ? actionToEndpoint[body.action] : null;
  if (!operation) {
    return NextResponse.json({ error: 'Unsupported agent action.' }, { status: 400 });
  }

  if (body.action === 'update') {
    if (!body.version || !/^[0-9A-Za-z._-]{1,64}$/.test(body.version)) {
      return NextResponse.json({ error: 'Invalid update version.' }, { status: 400 });
    }
    if (!body.sha256 || !/^[a-fA-F0-9]{64}$/.test(body.sha256)) {
      return NextResponse.json({ error: 'Invalid SHA256 checksum.' }, { status: 400 });
    }
  }

  const result = await callAgent(operation.path, {
    method: operation.method,
    body: operation.payload,
  });
  const payload = result.payload as { error?: string };
  auditVpsOperation(
    request,
    `agent_${body.action}`,
    undefined,
    session.role,
    result.ok ? 'ok' : payload?.error || result.error || 'failed'
  );

  return NextResponse.json({
    serviceId: 'agent',
    action: body.action,
    ok: result.ok,
    httpStatus: result.httpStatus,
    latencyMs: result.latencyMs,
    result: result.payload,
    error: result.ok ? null : payload?.error || result.error,
  }, { status: result.ok ? 200 : result.httpStatus === 423 ? 423 : 502 });
}
