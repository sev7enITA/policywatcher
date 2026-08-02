import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/lib/adminAuth', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/db', () => ({
  db: {
    sourceRemediationIssue: { findUnique: mocks.findUnique, update: mocks.update },
  },
}));

import { PATCH } from '@/app/api/admin/source-reliability/route';

function request(status: 'Open' | 'Resolved') {
  return new NextRequest('https://policywatcher.online/api/admin/source-reliability', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ issueId: 'issue-1', status }),
  });
}

describe('source remediation transition API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockReturnValue({ valid: true, role: 'admin' });
    mocks.update.mockResolvedValue({ id: 'issue-1' });
  });

  it('allows an administrator to close a recovered issue', async () => {
    mocks.findUnique.mockResolvedValue({ status: 'Recovered' });
    const response = await PATCH(request('Resolved'));
    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'Resolved' }),
    }));
  });

  it.each(['Open', 'Watching'])('rejects closing a %s issue with a bounded conflict', async (currentStatus) => {
    mocks.findUnique.mockResolvedValue({ status: currentStatus });
    const response = await PATCH(request('Resolved'));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: 'issue_not_recovered', currentStatus });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('permits reopening only from the resolved state', async () => {
    mocks.findUnique.mockResolvedValue({ status: 'Resolved' });
    expect((await PATCH(request('Open'))).status).toBe(200);
    mocks.findUnique.mockResolvedValue({ status: 'Recovered' });
    const conflict = await PATCH(request('Open'));
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({ code: 'issue_not_resolved' });
  });

  it('keeps auditors read-only', async () => {
    mocks.getSession.mockReturnValue({ valid: true, role: 'auditor' });
    expect((await PATCH(request('Resolved'))).status).toBe(403);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
});
