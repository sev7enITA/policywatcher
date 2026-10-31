/** Engine regressions: isolated SQLite, synthetic transports, no external effects. */
import { beforeAll, beforeEach, afterAll, describe, it, expect, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { sha256, extractionEvidence } from '@/lib/extractionProfile';
import { formatScanCompletionLog } from '@/lib/adminScanSummary';
import { evaluateRetrieval } from '@/lib/aiEvaluation';

const fixtures = vi.hoisted(() => ({ results: new Map<string, unknown>(), forbidden: vi.fn(() => { throw new Error('external_effect_forbidden'); }) }));
vi.mock('@/lib/scraper', async original => ({ ...await original<typeof import('@/lib/scraper')>(),
  scrapePolicyText: vi.fn(async (url: string) => {
    if (!fixtures.results.has(url)) throw new Error('missing_fixture');
    return fixtures.results.get(url);
  }),
}));
vi.mock('@/lib/gemini', () => ({ analyzePolicyChange: fixtures.forbidden }));
vi.mock('@/lib/mailer', () => ({ sendPolicyChangeAlert: fixtures.forbidden,
  sendSourceSuspensionAdminAlert: fixtures.forbidden, maskEmailForLog: () => '[fixture]' }));
vi.mock('@/lib/documentEvidenceSync', () => ({ dualWriteCanonicalPolicyGraph: fixtures.forbidden }));

const dir = mkdtempSync(join(tmpdir(), 'pw-engine-audit-'));
const url = `file:${join(dir, 'audit.db')}`;
const database = new PrismaClient({ datasources: { db: { url } } });
let scan: typeof import('@/app/api/cron/check-all/route');
let scraper: typeof import('@/lib/scraper');
let guard: typeof import('@/lib/extractionGuard');
beforeAll(async () => {
  execFileSync(process.execPath, ['scripts/hostinger-init-db.mjs'], { env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe' });
  vi.doMock('@/lib/db', () => ({ db: database }));
  scan = await import('@/app/api/cron/check-all/route');
  scraper = await import('@/lib/scraper');
  guard = await import('@/lib/extractionGuard');
});
beforeEach(async () => {
  vi.stubEnv('POLICYWATCHER_EXTRACTION_GUARD', '1');
  vi.stubEnv('POLICYWATCHER_SCRAPING_SHADOW_CONFIG', '');
  vi.stubEnv('POLICYWATCHER_SCANS_PAUSED', '0');
  fixtures.results.clear(); fixtures.forbidden.mockClear();
  await database.company.deleteMany(); await database.scanRun.deleteMany(); await database.sourceRemediationIssue.deleteMany();
});
afterAll(async () => { await database.$disconnect(); vi.unstubAllEnvs(); rmSync(dir, { recursive: true, force: true }); });

async function seed(name: string, checkedAt: Date, source = 'direct') {
  const sourceUrl = `https://example.com/${name}`;
  const old = 'Prior verified policy baseline';
  const text = 'Different current policy document';
  const company = await database.company.create({ data: { name, slug: name, industry: 'Fixture', website: 'https://example.com' } });
  const policy = await database.policy.create({ data: { companyId: company.id, name, type: 'privacy', url: sourceUrl,
    currentText: old, currentHash: sha256(old), lastCheckDate: checkedAt, ingestionMethod: 'Direct Scrape',
    snapshots: { create: { version: 1, text: old, hash: sha256(old), publicEvidence: true } },
    checkLogs: { create: { status: 'Verified', source: 'direct', textHash: sha256(old), checkedAt } },
  } });
  const result = { status: 'ok' as const, text, hash: sha256(text), source, finalUrl: sourceUrl,
    httpStatus: 200, attempts: 1, reason: '', extraction: extractionEvidence('<main>fixture</main>', sourceUrl),
    diagnostics: [{ source, status: 'ok' as const, httpStatus: 200, durationMs: 1 }],
    ...(source === 'wayback' ? { archiveTimestamp: '2026-10-29T00:00:00.000Z' } : {}),
  };
  fixtures.results.set(sourceUrl, result);
  return { policy, result };
}

describe('Engine audit regressions, isolated SQLite and synthetic transport only', () => {
  it('D1: held-only summary requires attention and reports held records', () => {
    const run = { checked: 2, changed: 0, confirmationPending: 0, extractionHeld: 2, rebaselined: 0, partial: 0, errors: 0, unavailable: 0, invalid: 0 };
    const summary = formatScanCompletionLog(run);
    expect(summary).toContain('[ATTENTION]'); expect(summary).toContain('2 needing review');
  });
  it('D2: held attempts advance the scheduling timestamp without changing verified time', async () => {
    const { policy, result } = await seed('held', new Date('2026-01-01'));
    expect((await guard.guardExtraction(policy, result)).reason).toBe('extraction_baseline_missing');
    expect((await guard.guardExtraction(policy, result)).reason).toBe('extraction_baseline_missing');
    expect((await database.policy.findUniqueOrThrow({ where: { id: policy.id } })).lastCheckDate.getTime()).toBeGreaterThan(policy.lastCheckDate.getTime());
    const logs = await database.policyCheckLog.findMany({ where: { reason: 'extraction_baseline_missing' } });
    expect(logs).toHaveLength(2); expect(logs.every(l => l.scanRunId === null && l.sourceRetrievalId === null)).toBe(true);
  });
  it('D3: archive hold emits completion and keeps the live incident open', async () => {
    const { policy } = await seed('archive', new Date('2026-01-01'), 'wayback');
    await database.sourceRemediationIssue.create({ data: { retrievalKey: policy.url, sourceUrl: policy.url,
      status: 'Open', reasonCode: 'access_blocked', consecutiveFailures: 3, totalFailures: 3, affectedPolicyIdsJson: JSON.stringify([policy.id]) } });
    const progress: unknown[] = [];
    const result = await scan.runFullScan(event => { if (event.phase === 'policy_done') progress.push(event); }, { limit: 1, notificationMode: 'silent' });
    expect(result.extractionHeld).toBe(1); expect(result.retrievalMetrics.uniqueAvailableSources).toBe(0);
    expect(result.retrievalMetrics.uniqueUnavailableSources).toBe(1); expect(progress).toHaveLength(1);
    expect(result.details[0].source).toBe('wayback');
    expect((await database.sourceRemediationIssue.findUniqueOrThrow({ where: { retrievalKey: policy.url } })).status).toBe('Open');
    expect(fixtures.forbidden).not.toHaveBeenCalled();
  });
  it('D4: limited batches advance past held policies', async () => {
    const first = await seed('first', new Date('2026-01-01'));
    await seed('second', new Date('2026-01-02'));
    const a = await scan.runFullScan(undefined, { limit: 1, notificationMode: 'silent' });
    const b = await scan.runFullScan(undefined, { limit: 1, notificationMode: 'silent' });
    expect(a.details[0].policyId).toBe(first.policy.id); expect(b.details[0].policyId).not.toBe(first.policy.id);
    expect(a.extractionHeld).toBe(1); expect(b.extractionHeld).toBe(1);
    expect(fixtures.forbidden).not.toHaveBeenCalled();
  });
  it('D6: missing retrieval results remain in the denominator', () => {
    const base = { language: 'en' as const, category: 'fixture', query: 'privacy', answerable: true,
      passages: [{ id: 'p', text: 'privacy' }], relevantPassageIds: ['p'] };
    const metrics = evaluateRetrieval([{ ...base, id: 'a' }, { ...base, id: 'b' }],
      [{ caseId: 'a', ranked: [{ id: 'p', score: 1 }], predictedAnswerable: true }]);
    expect(metrics.cases).toBe(2); expect(metrics.hitAt1).toBe(0.5); expect(metrics.answerabilityAccuracy).toBe(0.5);
  });
  it('D7: extraction preserves No and repeated table cells', () => {
    const html = '<main><h1>Privacy Policy</h1><p>' +
      ('We collect personal data for services with privacy rights and consent controls. ').repeat(15) +
      '</p><table><tr><th>Use</th><th>Allowed</th><th>Retention</th></tr>' +
      '<tr><td>Advertising</td><td>No</td><td>30 days</td></tr>' +
      '<tr><td>Profiling</td><td>No</td><td>30 days</td></tr></table></main>';
    const text = scraper.extractPolicyText(html, 'https://example.com/privacy');
    expect(text.match(/\bNo\b/g)).toHaveLength(2);
    expect(text.match(/30 days/g)).toHaveLength(2);
  });
  it('D8: failed commit emits one terminal error and one detail', async () => {
    const { policy, result } = await seed('commit-failure', new Date('2026-01-01'));
    fixtures.results.set(policy.url, { ...result, text: policy.currentText, hash: policy.currentHash });
    const transaction = vi.spyOn(database, '$transaction').mockRejectedValueOnce(new Error('injected_audit_commit_failure'));
    const terminal: string[] = [];
    try {
      const run = await scan.runFullScan(event => {
        if (event.phase === 'policy_done') terminal.push(event.status || 'missing');
      }, { limit: 1, notificationMode: 'silent' });
      expect(run.checked).toBe(1); expect(run.errors).toBe(1);
      expect(run.details).toHaveLength(1);
      expect(run.details.every(detail => detail.policyId === policy.id && detail.status === 'error')).toBe(true);
      expect(terminal).toEqual(['error']);
      expect(fixtures.forbidden).not.toHaveBeenCalled();
    } finally { transaction.mockRestore(); }
  });
});
