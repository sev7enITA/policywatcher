import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ findMany: vi.fn(async () => []), session: vi.fn(() => ({ valid: true, role: 'admin' })) }));
vi.mock('@/lib/db', () => ({ db: { company: { findMany: mocks.findMany } } }));
vi.mock('@/lib/adminAuth', () => ({ getSession: mocks.session }));
import { GET } from '@/app/api/admin/kpi-audit/route';
describe('KPI audit common cohort', () => {
  it('applies privacy and EU filters together with current public eligibility', async () => {
    const response = await GET(new NextRequest('https://policywatcher.online/api/admin/kpi-audit?documents=privacy&jurisdiction=EU'));
    expect(response.status).toBe(200);
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ include: { policies: expect.objectContaining({ where: expect.objectContaining({ type: { in: ['privacy'] }, jurisdiction: 'EU', dataStatus: { in: ['Available', 'Reviewed'] } }) }) } }));
    expect((await response.json()).scope.documentTypes).toEqual(['privacy']);
  });
  it('fails closed for an invalid explicit document filter', async () => {
    mocks.findMany.mockClear();
    expect((await GET(new NextRequest('https://policywatcher.online/api/admin/kpi-audit?documents=invalid'))).status).toBe(400);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
