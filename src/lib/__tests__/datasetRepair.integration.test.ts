import { afterAll, expect, it, vi } from 'vitest';
import { writeFileSync } from 'node:fs';
import { NextRequest } from 'next/server';
vi.mock('@/lib/adminAuth', () => ({ getSession: () => ({ valid: true, role: 'admin' }) }));
import { db } from '@/lib/db';
import { GET } from '@/app/api/admin/dataset-quality/route';
const enabled = process.env.DATABASE_URL?.endsWith('/presentation-test.db');
it.skipIf(!enabled)('retains real acquisition failures while resolving repaired hash and risk inconsistencies', async () => {
  const response = await GET(new NextRequest('http://localhost/api/admin/dataset-quality'));
  expect(response.status).toBe(200);
  const result = await response.json();
  expect(result.summary.hashFailures).toBe(0);
  expect(result.summary.criticalIssues).toBe(5);
  expect(result.summary.status).toBe('fail');
  expect(result.areaSummary.find((row: { area: string }) => row.area === 'Risk Scoring')).toBeUndefined();
  writeFileSync('/Users/fabriziodegni/Desktop/PolicyWatcher/docs/reports/presentation-consistency-2026-10-01/repaired-dataset-qa.json', JSON.stringify({ environment: 'sanitized local fixture; admin session mocked for integration test', summary: result.summary, checks: result.checks, areaSummary: result.areaSummary }, null, 2));
});
afterAll(async () => { if (enabled) await db.$disconnect(); });
