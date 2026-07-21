import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { readJsonObject } from '../requestBody';

describe('readJsonObject', () => {
  it('returns null for empty, malformed, primitive, or array bodies', async () => {
    expect(await readJsonObject({ json: vi.fn().mockRejectedValue(new SyntaxError('bad json')) })).toBeNull();
    expect(await readJsonObject({ json: vi.fn().mockResolvedValue(null) })).toBeNull();
    expect(await readJsonObject({ json: vi.fn().mockResolvedValue('text') })).toBeNull();
    expect(await readJsonObject({ json: vi.fn().mockResolvedValue([]) })).toBeNull();
  });

  it('returns a JSON object for validated route input', async () => {
    const body = { companyId: 'company-1' };
    expect(await readJsonObject({ json: vi.fn().mockResolvedValue(body) })).toEqual(body);
  });

  it('is used by both policy discovery mutation handlers', () => {
    const route = readFileSync('src/app/api/admin/policy-discovery/route.ts', 'utf8');
    expect(route.match(/readJsonObject\(request\)/g)).toHaveLength(2);
    expect(route).not.toContain('const body = await request.json();');
  });
});
