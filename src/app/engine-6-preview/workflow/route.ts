import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public documentation only. The fixed artifact cannot read a query-selected file.
// Reuse the proxy nonce rather than weakening its global content-security policy.
export async function GET() {
  const nonce = (await headers()).get('x-nonce');
  if (!nonce || !/^[A-Za-z0-9+/=_-]{16,128}$/.test(nonce)) {
    return new Response('Documentation security context unavailable.', { status: 503 });
  }
  const root = path.join(process.cwd(), 'public', 'research', 'engine-workflow-20261122');
  const source = await readFile(path.join(root, 'interactive-it', 'index.html'), 'utf8');
  const body = source
    .replace('<head>', '<head><base href="/research/engine-workflow-20261122/interactive-it/">')
    .replace(/<(script|style)(?=[\s>])/g, `<$1 nonce="${nonce}"`);
  return new Response(body, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
