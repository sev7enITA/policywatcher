import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { readBoundedJsonObject, readJsonObject } from '../requestBody';

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

describe('readBoundedJsonObject', () => {
  it('accepts an object whose observed body is within the limit', async () => {
    const request = new Request('https://policywatcher.test/api/chat', {
      method: 'POST',
      body: JSON.stringify({ question: 'What changed?' }),
    });
    await expect(readBoundedJsonObject(request, 1_024)).resolves.toEqual({
      ok: true,
      value: { question: 'What changed?' },
    });
  });

  it('rejects declared and streamed bodies above the limit before JSON parsing', async () => {
    const declared = new Request('https://policywatcher.test/api/chat', {
      method: 'POST',
      headers: { 'content-length': '2048' },
      body: '{}',
    });
    await expect(readBoundedJsonObject(declared, 1_024)).resolves.toEqual({
      ok: false,
      reason: 'body_too_large',
    });

    const streamed = new Request('https://policywatcher.test/api/chat', {
      method: 'POST',
      body: JSON.stringify({ question: 'x'.repeat(2_000) }),
    });
    await expect(readBoundedJsonObject(streamed, 1_024)).resolves.toEqual({
      ok: false,
      reason: 'body_too_large',
    });
  });

  it('rejects malformed or non-object JSON', async () => {
    for (const body of ['{"broken"', '[]', 'null']) {
      const request = new Request('https://policywatcher.test/api/chat', { method: 'POST', body });
      await expect(readBoundedJsonObject(request, 1_024)).resolves.toEqual({
        ok: false,
        reason: 'invalid_json',
      });
    }
  });
});
