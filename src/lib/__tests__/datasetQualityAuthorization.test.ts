import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ getSession: vi.fn() }));

vi.mock('@/lib/adminAuth', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/db', () => ({ db: {} }));

import { PATCH } from '@/app/api/admin/dataset-quality/route';

function patchRequest() {
  return new NextRequest('https://policywatcher.online/api/admin/dataset-quality', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}

describe('Dataset QA mutation authorization', () => {
  it('returns 401 for an invalid session and 403 for an auditor', async () => {
    mocks.getSession.mockReturnValueOnce({ valid: false });
    expect((await PATCH(patchRequest())).status).toBe(401);

    mocks.getSession.mockReturnValueOnce({ valid: true, role: 'auditor' });
    expect((await PATCH(patchRequest())).status).toBe(403);
  });

  it('allows an administrator to reach payload validation', async () => {
    mocks.getSession.mockReturnValueOnce({ valid: true, role: 'admin' });
    expect((await PATCH(patchRequest())).status).toBe(400);
  });
});
