import { afterEach, expect, it, vi } from 'vitest';
import { liveAnalysis } from '../engine/claims';
import { compareDocuments, structureDocument } from '../engine/document';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it('passes the installed Developer API SDK converters and counts system text without network access', async () => {
  vi.stubEnv('GEMINI_API_KEY', 'offline-dummy-key');
  vi.stubEnv('POLICYWATCHER_ENGINE_ANALYST_MODEL', 'test-analyst');
  vi.stubEnv('POLICYWATCHER_ENGINE_VERIFIER_MODEL', 'test-verifier');
  const requests: Array<{ url: string; body: string }> = [];
  vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    const body = typeof init?.body === 'string' ? init.body : input instanceof Request ? await input.text() : '';
    requests.push({ url, body });
    const response = url.includes(':countTokens') ? { totalTokens: 100 } : {
      candidates: [{ finishReason: 'STOP', content: { role: 'model', parts: [{ text: '{"schema":"pw-claims-1","claims":[]}' }] } }],
      modelVersion: 'offline-provider-model', usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 10 },
    };
    return new Response(JSON.stringify(response), { status: 200, headers: { 'content-type': 'application/json' } });
  }));
  const old = structureDocument('# Policy\n\nResponse within 30 days.');
  const next = structureDocument('# Policy\n\nResponse within 60 days.');
  await liveAnalysis.analyze({ old, next, deltas: compareDocuments(old, next).deltas });
  expect(requests).toHaveLength(2);
  expect(requests[0].url).toContain(':countTokens');
  expect(requests[0].body).toContain('untrusted');
  expect(requests[0].body).toContain('30 days');
  expect(requests[1].url).toContain(':generateContent');
});
