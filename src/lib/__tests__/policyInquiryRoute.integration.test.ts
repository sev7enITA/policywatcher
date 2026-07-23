import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

describe('POST /api/policy-inquiries integration', () => {
  const directory = mkdtempSync(join(tmpdir(), 'policy-inquiry-route-'));
  const databasePath = join(directory, 'integration.db');
  const databaseUrl = `file:${databasePath}`;
  const afterTask = vi.fn();
  let client: PrismaClient;
  let POST: (request: NextRequest) => Promise<Response>;

  beforeAll(async () => {
    const sqlite = new DatabaseSync(databasePath);
    sqlite.exec('PRAGMA foreign_keys = ON;');
    const migrationsRoot = join(process.cwd(), 'prisma', 'migrations');
    for (const migration of readdirSync(migrationsRoot).filter((name) => /^\d/.test(name)).sort()) {
      const migrationPath = join(migrationsRoot, migration, 'migration.sql');
      try {
        sqlite.exec(readFileSync(migrationPath, 'utf8'));
      } catch (error) {
        throw new Error(`Could not apply integration migration ${migration}`, { cause: error });
      }
    }
    sqlite.close();

    client = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    await client.$connect();

    vi.resetModules();
    vi.doMock('@/lib/db', () => ({ db: client }));
    vi.doMock('@/lib/mailer', () => ({ sendPolicyInquiryAdminAlert: vi.fn().mockResolvedValue(true) }));
    vi.doMock('next/server', async () => {
      const actual = await vi.importActual<typeof import('next/server')>('next/server');
      return { ...actual, after: afterTask };
    });

    ({ POST } = await import('../../app/api/policy-inquiries/route'));
  });

  afterAll(async () => {
    await client?.$disconnect();
    vi.doUnmock('@/lib/db');
    vi.doUnmock('@/lib/mailer');
    vi.doUnmock('next/server');
    vi.resetModules();
    rmSync(directory, { recursive: true, force: true });
  });

  it('persists a minimized unknown-company inquiry through the real handler and schema', async () => {
    const response = await POST(new NextRequest('https://www.policywatcher.online/api/policy-inquiries', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        companyName: 'Northwind Research',
        senderDomain: 'updates.northwind.example',
        sourceUrl: 'https://northwind.example/privacy?recipient=private@example.com#notice',
        noticeDate: '2026-07-22',
        effectiveDate: '2026-08-22',
        policyTypes: ['privacy', 'cookies'],
        lang: 'en',
        honeypot: '',
      }),
    }));

    expect(response.status).toBe(202);
    const payload = await response.json();
    expect(payload).toMatchObject({ state: 'queued', companyHint: 'Northwind Research' });
    expect(payload.reference).toMatch(/^inq_[A-Za-z0-9_-]+$/);

    const saved = await client.policyInquiry.findUnique({ where: { publicToken: payload.reference } });
    expect(saved).toMatchObject({
      status: 'Proposed',
      kind: 'unknown_company',
      companyHint: 'Northwind Research',
      normalizedDomain: 'northwind.example',
      sourceUrl: 'https://northwind.example/privacy',
      policyTypesJson: JSON.stringify(['privacy', 'cookies']),
    });
    expect(JSON.stringify(saved)).not.toContain('private@example.com');
    expect(afterTask).toHaveBeenCalledOnce();
  });

  it('rejects raw notification content before persistence', async () => {
    const before = await client.policyInquiry.count();
    const response = await POST(new NextRequest('https://www.policywatcher.online/api/policy-inquiries', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        companyName: 'Contoso',
        policyTypes: ['privacy'],
        rawText: 'private notification contents',
        lang: 'en',
      }),
    }));

    expect(response.status).toBe(400);
    expect(await client.policyInquiry.count()).toBe(before);
  });
});
