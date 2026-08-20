import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { PrismaClient } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createOrReuseActiveInquiry } from '../policyInquiryStore';

describe('active policy inquiry deduplication', () => {
  const cleanup: Array<() => Promise<void> | void> = [];

  afterEach(async () => {
    while (cleanup.length) await cleanup.pop()?.();
  });

  it('atomically reuses a concurrent active inquiry and permits a new request after resolution', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'policy-inquiry-race-'));
    const databasePath = join(directory, 'test.db');
    const sqlite = new DatabaseSync(databasePath);
    sqlite.exec(`
      CREATE TABLE "PolicyInquiry" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "publicToken" TEXT NOT NULL,
        "dedupeKey" TEXT NOT NULL,
        "activeDedupeKey" TEXT,
        "status" TEXT NOT NULL DEFAULT 'Proposed',
        "kind" TEXT NOT NULL,
        "companyHint" TEXT,
        "normalizedDomain" TEXT,
        "sourceUrl" TEXT,
        "noticeDate" DATETIME,
        "effectiveDate" DATETIME,
        "policyTypesJson" TEXT,
        "matchedCompanyId" TEXT,
        "matchedPolicyId" TEXT,
        "resolvedChangeId" TEXT,
        "adminNote" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        "resolvedAt" DATETIME
      );
      CREATE UNIQUE INDEX "PolicyInquiry_publicToken_key" ON "PolicyInquiry"("publicToken");
      CREATE UNIQUE INDEX "PolicyInquiry_activeDedupeKey_key" ON "PolicyInquiry"("activeDedupeKey");
    `);
    sqlite.close();

    const client = new PrismaClient({ datasources: { db: { url: `file:${databasePath}` } } });
    cleanup.push(async () => {
      await client.$disconnect();
      rmSync(directory, { recursive: true, force: true });
    });

    const dedupeKey = 'unknown_company:waze.com:privacy';
    const create = (publicToken: string) => createOrReuseActiveInquiry(client, {
      data: {
        publicToken,
        dedupeKey,
        activeDedupeKey: dedupeKey,
        status: 'Proposed',
        kind: 'unknown_company',
      },
    });

    const [first, second] = await Promise.all([create('inq_first'), create('inq_second')]);
    expect(first.inquiry.id).toBe(second.inquiry.id);
    expect([first.created, second.created].sort()).toEqual([false, true]);
    expect(await client.policyInquiry.count()).toBe(1);

    await client.policyInquiry.update({
      where: { id: first.inquiry.id },
      data: { status: 'Resolved', activeDedupeKey: null, resolvedAt: new Date() },
    });
    const later = await create('inq_later');
    expect(later.created).toBe(true);
    expect(later.inquiry.id).not.toBe(first.inquiry.id);
    expect(await client.policyInquiry.count()).toBe(2);
  });

  it('retries bounded transient database contention before persisting the inquiry', async () => {
    const inquiry = { id: 'inquiry-1', publicToken: 'inq_retry' };
    const create = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error('database is locked'), { code: 'P1008' }))
      .mockRejectedValueOnce(new Error('SQLITE_BUSY: database is locked'))
      .mockResolvedValueOnce(inquiry);
    const findUnique = vi.fn();

    const result = await createOrReuseActiveInquiry({
      policyInquiry: { create, findUnique },
    } as never, {
      data: {
        publicToken: 'inq_retry',
        dedupeKey: 'retry-key',
        activeDedupeKey: 'retry-key',
        status: 'Proposed',
        kind: 'unknown_company',
      },
    });

    expect(result).toEqual({ inquiry, created: true });
    expect(create).toHaveBeenCalledTimes(3);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('retries a PostgreSQL serialization failure before persisting the inquiry', async () => {
    const inquiry = { id: 'inquiry-pg', publicToken: 'inq_pg_retry' };
    const create = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error('could not serialize access'), { code: '40001' }))
      .mockResolvedValueOnce(inquiry);

    const result = await createOrReuseActiveInquiry({
      policyInquiry: { create, findUnique: vi.fn() },
    } as never, {
      data: {
        publicToken: 'inq_pg_retry',
        dedupeKey: 'pg-retry-key',
        activeDedupeKey: 'pg-retry-key',
        status: 'Proposed',
        kind: 'unknown_company',
      },
    });

    expect(result).toEqual({ inquiry, created: true });
    expect(create).toHaveBeenCalledTimes(2);
  });
});
