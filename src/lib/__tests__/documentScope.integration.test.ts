import { afterAll, describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('@/lib/rateLimit', () => ({ rateLimit: () => null }));
const ai = vi.hoisted(() => ({ answer: vi.fn().mockResolvedValue('Fixture response') }));
vi.mock('@/lib/gemini', () => ({ answerPolicyQuestion: ai.answer }));
import { db } from '@/lib/db';
import { GET as evidence } from '@/app/api/evidence-status/route';
import { GET as matrix } from '@/app/api/matrix/route';
import { GET as compare } from '@/app/api/compare/route';
import { GET as changes } from '@/app/api/changes/route';
import { GET as suspended } from '@/app/api/source-suspensions/route';
import { POST as chat } from '@/app/api/chat/route';
import { publicPolicyWhere } from '../publicDataGate';
const enabled = process.env.DATABASE_URL?.endsWith('/presentation-test.db');
const req = (path: string) => new NextRequest(`http://localhost${path}`);
describe.skipIf(!enabled)('document scope against sanitized repaired database (read only)', () => {
 it('reconciles privacy-only inventory and preserves publication gates', async () => {
   const data = await (await evidence(req('/api/evidence-status?documents=privacy'))).json();
   expect(data.totalPolicies).toBe(await db.policy.count({ where: { type:'privacy' } }));
   expect(data.publicBaselines).toBe(await db.policy.count({ where: publicPolicyWhere({ type:'privacy' }) }));
   expect(data.totalPolicies).toBe(28);
 });
 it('filters changes before pagination and count', async () => {
   const data = await (await changes(req('/api/changes?documents=privacy&pageSize=50'))).json();
   expect(data.changes.length).toBeGreaterThan(0);
   expect(data.changes.every((r: { policy: { type: string } }) => r.policy.type === 'privacy')).toBe(true);
 });
 it('keeps only selected suspended sources', async () => {
   const data = await (await suspended(req('/api/source-suspensions?documents=privacy'))).json();
   expect(data.sources.every((r: { policyType: string }) => r.policyType === 'privacy')).toBe(true);
 });
 it('matrix and compare use identical per-type KPI populations', async () => {
   const data = await (await matrix(req('/api/matrix?documents=privacy,terms'))).json();
   const [a,b] = data.companies;
   const result = await (await compare(req(`/api/compare?documents=privacy,terms&companyA=${a.id}&companyB=${b.id}`))).json();
   expect(result.companyA.coverage.requestedTypes).toEqual(['privacy','terms']);
   for (const point of result.companyA.radar) expect(point.rawValue).toBe(a.kpis[point.key]);
   expect(a.byType.map((r: { type: string }) => r.type)).toEqual(['privacy','terms']);
 });
 it('retains missing-type companies without manufacturing KPI scores', async () => {
   const data = await (await matrix(req('/api/matrix?documents=dpa'))).json();
   const missing = data.companies.find((c: { coverage: { availableTypes: string[] } }) => c.coverage.availableTypes.length === 0);
   expect(missing).toBeTruthy();
   expect(Object.values(missing.kpis).every(v => v === 'Not assessed')).toBe(true);
 });
 it.each([evidence, matrix, compare, changes, suspended])('rejects invalid explicit API scope', async handler => {
   expect((await handler(req('/api/test?documents=privacy,invalid'))).status).toBe(400);
 });
 it('empty assistant company scope never falls back to the full inventory', async () => {
   ai.answer.mockClear();
   const response = await chat(new NextRequest('http://localhost/api/chat', { method:'POST', body:JSON.stringify({ question:'Summarize', documentTypes:['privacy'], companyIds:[] }) }));
   expect((await response.json()).contextPoliciesCount).toBe(0);
   expect(ai.answer).not.toHaveBeenCalled();
 });
 it('assistant only receives selected document text and reports context limits', async () => {
   ai.answer.mockClear();
   const response = await chat(new NextRequest('http://localhost/api/chat', { method:'POST', body:JSON.stringify({ question:'Summarize', documentTypes:['dpa'] }) }));
   const data = await response.json();
   expect(data.contextPoliciesCount).toBe(data.availablePoliciesCount);
   expect(data.documentTypes).toEqual(['dpa']);
   expect(ai.answer).toHaveBeenCalledOnce();
 });
});
afterAll(async () => { if (enabled) await db.$disconnect(); });
