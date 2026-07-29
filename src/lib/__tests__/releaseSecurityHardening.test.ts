import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { readFileSync } from 'node:fs';

const mocks = vi.hoisted(() => ({
  answerPolicyQuestion: vi.fn(),
  companyCount: vi.fn(),
  policyFindMany: vi.fn(),
  databaseDiagnostics: vi.fn(),
}));

vi.mock('@/lib/gemini', () => ({
  answerPolicyQuestion: mocks.answerPolicyQuestion,
}));

vi.mock('@/lib/db', () => ({
  db: {
    company: { count: mocks.companyCount },
    policy: { findMany: mocks.policyFindMany },
  },
}));

vi.mock('@/lib/databaseConfig', () => ({
  getDatabaseDiagnostics: mocks.databaseDiagnostics,
}));

import { POST as chatPost } from '@/app/api/chat/route';
import { GET as healthGet } from '@/app/api/health/route';
import { maskEmailForLog } from '@/lib/mailer';
import { proxy } from '../../proxy';

describe('Beta 7 release security hardening', () => {
  beforeEach(() => {
    mocks.policyFindMany.mockReset();
    mocks.answerPolicyQuestion.mockReset();
    mocks.companyCount.mockReset();
    mocks.databaseDiagnostics.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('keeps upstream chat exception details in server logs and returns only a reference', async () => {
    mocks.policyFindMany.mockResolvedValue([{ company: { name: 'Example' }, name: 'Privacy', currentText: 'Public policy text' }]);
    mocks.answerPolicyQuestion.mockRejectedValue(new Error('Gemini transport detail with secret-token-value'));
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await chatPost(new NextRequest('https://policywatcher.online/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'What changed?' }),
    }));
    const payload = await response.json() as { error: string; reference: string };

    expect(response.status).toBe(500);
    expect(payload.error).toBe('Unable to process the question at this time.');
    expect(payload.reference).toMatch(/^chat_[a-f0-9]{12}$/);
    expect(JSON.stringify(payload)).not.toContain('secret-token-value');
    expect(errorLog).toHaveBeenCalledWith(expect.stringMatching(/^\[Chat\] Error reference chat_[a-f0-9]{12}: Gemini transport detail/));
  });

  it('keeps authenticated health diagnostics free of physical filesystem paths', async () => {
    vi.stubEnv('API_SECRET', 'health-secret');
    mocks.databaseDiagnostics.mockResolvedValue({
      configured: true,
      filePath: '/var/www/private/policywatcher.db',
      directoryPath: '/var/www/private',
      directoryExists: true,
      directoryWritable: true,
      fileExists: true,
      fileSizeBytes: 2048,
    });
    mocks.companyCount.mockResolvedValue(16);

    const response = await healthGet(new NextRequest('https://policywatcher.online/api/health', {
      headers: { Authorization: 'Bearer health-secret' },
    }));
    const payload = await response.json() as Record<string, unknown>;
    const serialized = JSON.stringify(payload);

    expect(response.status).toBe(200);
    expect(serialized).not.toContain('/var/www/private');
    expect(payload).toMatchObject({ status: 'ok', database: { configured: true, exists: true, companyCount: 16 } });
  });

  it('executes the Next.js 16 proxy handler with nonce CSP and frame boundaries', () => {
    const pageResponse = proxy(new NextRequest('https://policywatcher.online/press-kit'));
    const embedResponse = proxy(new NextRequest('https://policywatcher.online/embed/change/example'));
    const pageCsp = pageResponse.headers.get('content-security-policy');
    const embedCsp = embedResponse.headers.get('content-security-policy');

    expect(pageCsp).toContain("script-src 'self' 'nonce-");
    expect(pageCsp).toContain("frame-ancestors 'none'");
    expect(embedCsp).toContain('frame-ancestors *');
    expect(pageResponse.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
  });

  it('masks recipient addresses before operational email logging', () => {
    expect(maskEmailForLog('alice@example.test')).toBe('a***@masked-domain');
    expect(maskEmailForLog('invalid-address')).toBe('masked-recipient');

    const mailer = readFileSync('src/lib/mailer.ts', 'utf8');
    const cron = readFileSync('src/app/api/cron/check-all/route.ts', 'utf8');
    expect(mailer).not.toContain('Email sent to ${to}');
    expect(mailer).not.toContain('To: ${to}');
    expect(cron).not.toContain('subscriber ${subscriber.email}');
    expect(cron).not.toContain('notify ${subscriber.email}');
  });
});
