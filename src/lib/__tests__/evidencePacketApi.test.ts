import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/evidencePacketData', () => ({
  getPublicEvidencePacket: vi.fn(),
}));

vi.mock('@/lib/rateLimit', () => ({
  rateLimit: vi.fn(() => null),
}));

import { GET } from '@/app/api/evidence-packet/[changeId]/route';
import { getPublicEvidencePacket } from '@/lib/evidencePacketData';

const CHANGE_ID = '11111111-1111-4111-8111-111111111111';

describe('public evidence packet API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('serves the exact requested public change as a bounded JSON download', async () => {
    vi.mocked(getPublicEvidencePacket).mockResolvedValue({
      changeId: CHANGE_ID,
      publicationGate: 'published',
      company: { name: 'Example Company' },
    } as never);

    const response = await GET(
      new NextRequest(`https://policywatcher.online/api/evidence-packet/${CHANGE_ID}?format=json`),
      { params: Promise.resolve({ changeId: CHANGE_ID }) },
    );

    expect(getPublicEvidencePacket).toHaveBeenCalledExactlyOnceWith(CHANGE_ID);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-disposition')).toContain(`${CHANGE_ID}.json`);
    expect(response.headers.get('cache-control')).toContain('s-maxage=3600');
    expect((await response.json()).changeId).toBe(CHANGE_ID);
  });

  it('rejects malformed IDs, unsupported parameters and duplicate formats', async () => {
    const malformed = await GET(
      new NextRequest('https://policywatcher.online/api/evidence-packet/not-a-change?format=json'),
      { params: Promise.resolve({ changeId: 'not-a-change' }) },
    );
    expect(malformed.status).toBe(404);

    const unknown = await GET(
      new NextRequest(`https://policywatcher.online/api/evidence-packet/${CHANGE_ID}?format=json&scope=all`),
      { params: Promise.resolve({ changeId: CHANGE_ID }) },
    );
    expect(unknown.status).toBe(400);

    const duplicate = await GET(
      new NextRequest(`https://policywatcher.online/api/evidence-packet/${CHANGE_ID}?format=json&format=pdf`),
      { params: Promise.resolve({ changeId: CHANGE_ID }) },
    );
    expect(duplicate.status).toBe(400);
    expect(getPublicEvidencePacket).not.toHaveBeenCalled();
  });

  it('does not disclose withheld or unavailable evidence records', async () => {
    vi.mocked(getPublicEvidencePacket).mockResolvedValue(null);
    const response = await GET(
      new NextRequest(`https://policywatcher.online/api/evidence-packet/${CHANGE_ID}`),
      { params: Promise.resolve({ changeId: CHANGE_ID }) },
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Evidence packet not found.' });
  });
});
