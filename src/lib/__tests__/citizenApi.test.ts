import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('@/lib/citizenData', async importOriginal => ({ ...await importOriginal<typeof import('../citizenData')>(), getCitizenFeed: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: {} }));
vi.mock('@/lib/rateLimit', () => ({ rateLimit: vi.fn(() => null) }));
import { GET, OPTIONS } from '@/app/api/v1/citizen-feed/route';
import { getCitizenFeed } from '../citizenData';
import { rateLimit } from '../rateLimit';
describe('citizen read-only route', () => {
  beforeEach(() => vi.clearAllMocks());
  it('returns public data with no-store and open read-only CORS', async () => {
    vi.mocked(getCitizenFeed).mockResolvedValue({ schemaVersion: '1.0', generatedAt: new Date().toISOString(), services: [], changes: [], history: { limit: 25, hasMore: false, nextCursor: null }, catalogTruncated: false });
    const response = await GET(new NextRequest('https://policywatcher.online/api/v1/citizen-feed'));
    expect(response.status).toBe(200); expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(rateLimit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ logClientIp: false }));
    expect(OPTIONS().headers.get('access-control-allow-methods')).toBe('GET, OPTIONS');
  });
  it('does not accept pasted documents or personal filters', async () => {
    const response = await GET(new NextRequest('https://policywatcher.online/api/v1/citizen-feed?notice=private'));
    expect(response.status).toBe(400); expect(getCitizenFeed).not.toHaveBeenCalled();
  });
  it('returns explicit unavailability instead of demo data or private error details', async () => {
    vi.mocked(getCitizenFeed).mockRejectedValue(new Error('private-database-connection-string'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await GET(new NextRequest('https://policywatcher.online/api/v1/citizen-feed'));
    expect(response.status).toBe(503); expect(await response.text()).not.toContain('private-database');
    expect(log.mock.calls.flat().join(' ')).not.toContain('private-database'); log.mockRestore();
  });
});
