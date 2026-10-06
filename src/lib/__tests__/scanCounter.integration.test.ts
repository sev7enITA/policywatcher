import { createHash } from 'node:crypto';
import { afterAll, describe, it, expect, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ scrape: vi.fn(), analyze: vi.fn() }));
vi.mock('@/lib/scraper', () => ({ scrapePolicyText: mocks.scrape }));
vi.mock('@/lib/gemini', () => ({ analyzePolicyChange: mocks.analyze }));
vi.mock('@/lib/mailer', () => ({ sendPolicyChangeAlert: vi.fn(), sendSourceSuspensionAdminAlert: vi.fn(), maskEmailForLog: () => 'masked' }));
import { db } from '@/lib/db';
import { runFullScan } from '@/app/api/cron/check-all/route';
const enabled = process.env.DATABASE_URL?.endsWith('/scan-counter-test.db');
describe.skipIf(!enabled)('Scan results reflect committed changes (isolated SQLite fixture)', () => {
  it('does not report a change when analysis fails after confirmed acquisition', async () => {
    const policy = await db.policy.findFirstOrThrow({ where: { company: { slug: 'stripe' }, name: 'Privacy Policy', jurisdiction: 'EU' } });
    const text = policy.currentText + '\nRegression fixture: the provider adds a new explicit retention obligation.\n';
    const hash = createHash('sha256').update(text).digest('hex');
    await db.policy.update({ where: { id: policy.id }, data: { lastCheckDate: new Date(0) } });
    await db.policyCheckLog.create({ data: { policyId: policy.id, checkedAt: new Date(), status: 'Needs Review', reason: 'change_confirmation_pending', textHash: hash, source: 'direct' } });
    mocks.scrape.mockResolvedValue({ status: 'ok', source: 'direct', text, hash, finalUrl: policy.url, httpStatus: 200, reason: '', attempts: 1 });
    mocks.analyze.mockRejectedValue(new Error('fixture_analysis_failure'));
    const before = await db.policySnapshot.count();
    const result = await runFullScan(undefined, { companySlug: 'stripe', limit: 1 });
    expect(mocks.analyze).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ checked: 1, changed: 0, errors: 1 });
    expect(result.details[0].status).toBe('error');
    expect(await db.policySnapshot.count()).toBe(before);
    expect((await db.policy.findUniqueOrThrow({ where: { id: policy.id } })).currentHash).toBe(policy.currentHash);
  });
});
afterAll(async () => { if (enabled) await db.$disconnect(); });
