import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ send: vi.fn().mockResolvedValue({}), findMany: vi.fn(), count: vi.fn(), companies: vi.fn(), policy: vi.fn(), siblings: vi.fn(), subscribers: vi.fn() }));
vi.mock('nodemailer', () => ({ default: { createTransport: () => ({ sendMail: mocks.send }) } }));
vi.mock('@/lib/db', () => ({ db: {
  policyChange: { findMany: mocks.findMany, count: mocks.count },
  company: { findMany: mocks.companies },
  policy: { findFirst: mocks.policy, findMany: mocks.siblings },
  subscriber: { findMany: mocks.subscribers },
} }));
vi.mock('@/lib/rateLimit', () => ({ rateLimit: () => null }));
vi.mock('@/lib/auth', () => ({ isAuthorized: () => true }));
vi.mock('@/lib/adminAccessLog', () => ({ cleanupOldAdminAccessLogs: vi.fn() }));
vi.mock('@/lib/adminDashboardTelemetryStorage', () => ({ cleanupAdminDashboardTelemetry: vi.fn() }));

import { sendPolicyChangeAlert, sendMonthlyDigest, sendWeeklyDigest, type ChangedPolicySummary } from '../mailer';
import { classifyPolicyChange } from '../changeClassification';
import { GET as changesGET } from '@/app/api/changes/route';
import { GET as companiesGET } from '@/app/api/companies/route';
import { GET as policyGET } from '@/app/api/policies/[id]/route';
import { GET as weeklyGET } from '@/app/api/cron/weekly/route';
import { GET as monthlyGET } from '@/app/api/cron/monthly/route';

const snap = (text: string) => ({ policyId: 'p1', text, publicEvidence: true, version: 1 });
const makeRow = (id: string, old: string, next: string) => ({
  id, policyId: 'p1', oldSnapshot: snap(old), newSnapshot: snap(next), overallScore: 8, overallRisk: 'High',
  aiSummaryEn: 'Unreliable original AI summary', riskReasonsJson: '[]', createdAt: new Date(),
  policy: { id: 'p1', name: 'Privacy', url: 'https://example.test/privacy', jurisdiction: 'EU', company: { name: 'Example', industry: 'Tech Giant' } },
});
const editorial = makeRow('11111111-1111-4111-8111-111111111111', 'Your data.', 'Your  data.');
const unverified = makeRow('22222222-2222-4222-8222-222222222222', 'We retain for 30 days.', 'We retain for 90 days.');
const summary = (row: typeof editorial): ChangedPolicySummary => ({ changeId: row.id, classification: classifyPolicyChange(row), companyName: row.policy.company.name,
  policyName: row.policy.name, region: 'EU', industry: 'Tech Giant', overallRisk: 'High', overallScore: 8, summaryEn: row.aiSummaryEn });

beforeEach(() => {
  vi.clearAllMocks();
  for (const [key, value] of Object.entries({ SMTP_HOST: 'smtp.test', SMTP_PORT: '587', SMTP_USER: 'test', SMTP_PASS: 'test', APP_URL: 'https://example.test', ALLOW_SEEDED_PUBLIC_DATA: 'false' })) vi.stubEnv(key, value);
});
afterEach(() => vi.unstubAllEnvs());

describe('classification at public and delivery boundaries', () => {
  it('keeps archive pagination totals while returning bounded classified rows without full snapshots', async () => {
    mocks.count.mockResolvedValue(53); mocks.findMany.mockResolvedValue([editorial, unverified]);
    const response = await changesGET(new NextRequest('https://example.test/api/changes?pageSize=2&page=2'));
    const data = await response.json();
    expect(data).toMatchObject({ total: 53, page: 2, pageSize: 2, totalPages: 27 });
    expect(data.changes.map((c: { classification: { kind: string } }) => c.classification.kind)).toEqual(['editorial', 'needs_review']);
    expect(data.changes[0]).not.toHaveProperty('oldSnapshot');
    expect(data.changes[0]).not.toHaveProperty('newSnapshot');
    expect(mocks.findMany.mock.calls[0][0]).toMatchObject({ skip: 2, take: 2, where: { publicEvidence: true } });
  });

  it('classifies the same change consistently in dashboard and detail; private snapshots stay private', async () => {
    mocks.companies.mockResolvedValue([{ policies: [{ changes: [editorial] }] }]);
    const companies = await (await companiesGET(new NextRequest('https://example.test/api/companies'))).json();
    expect(companies[0].policies[0].changes[0].classification.kind).toBe('editorial');
    expect(companies[0].policies[0].changes[0]).not.toHaveProperty('oldSnapshot');
    mocks.policy.mockResolvedValue({ companyId: 'c1', changes: [editorial, { ...unverified, diff: 'PRIVATE DIFF', oldSnapshot: { ...snap('PRIVATE TEXT'), publicEvidence: false } }] });
    mocks.siblings.mockResolvedValue([]);
    const policy = await (await policyGET(new NextRequest('https://example.test/api/policies/p1'), { params: Promise.resolve({ id: 'p1' }) })).json();
    expect(policy.changes[0].classification.kind).toBe('editorial');
    expect(policy.changes[1]).toMatchObject({ oldSnapshot: null, diff: '', classification: { kind: 'needs_review', evidence: [] } });
    expect(JSON.stringify(policy)).not.toContain('PRIVATE TEXT');
    expect(JSON.stringify(policy)).not.toContain('PRIVATE DIFF');
  });

  it('suppresses editorial instant emails even when the caller passes them', async () => {
    expect(await sendPolicyChangeAlert('test@example.test', undefined, [summary(editorial)])).toBe(false);
    expect(mocks.send).not.toHaveBeenCalled();
    await sendPolicyChangeAlert('test@example.test', undefined, [summary(editorial), summary(unverified)]);
    const message = mocks.send.mock.calls[0][0];
    expect(message.subject).toContain('1 update to review');
    expect(message.html).toContain('Needs verification');
    expect(message.html).toContain('Policy risk (AI)');
    expect(message.html).toContain('Change impact: not assessed');
    expect(message.html).toContain(`/change/${unverified.id}`);
    expect(message.html).not.toContain('Unreliable original AI summary');
  });

  it.each([sendWeeklyDigest, sendMonthlyDigest])('preserves uncertainty in digest templates', async send => {
    await send('test@example.test', '<script>alert(1)</script>', [summary(editorial), summary(unverified)]);
    expect(mocks.send.mock.calls[0][0].html).toContain('Needs verification');
    expect(mocks.send.mock.calls[0][0].html).not.toContain('<script>');
    expect(mocks.send.mock.calls[0][0].subject).toContain('1 update');
    await send('test@example.test', undefined, [summary(editorial)]);
    expect(mocks.send.mock.calls[1][0].html).toContain('remain in the archive');
    expect(mocks.send.mock.calls[1][0].html).not.toContain('no significant policy changes');
  });

  it.each([weeklyGET, monthlyGET])('classifies real query rows before digest delivery without deleting archived records', async GET => {
    mocks.subscribers.mockResolvedValue([{ email: 'test@example.test', name: 'Test', regions: 'EU', industries: 'Tech Giant', unsubscribeToken: 'test' }]);
    mocks.findMany.mockResolvedValue([editorial, unverified]);
    const response = await GET(new NextRequest('https://example.test/api/cron/test'));
    expect(response.status).toBe(200);
    expect(mocks.findMany.mock.calls[0][0]).toMatchObject({ where: { publicEvidence: true }, include: { oldSnapshot: { select: { publicEvidence: true } }, newSnapshot: { select: { text: true } } } });
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.send.mock.calls[0][0].subject).toContain('1 update');
    expect(mocks.send.mock.calls[0][0].html).toContain('Needs verification');
  });
});
