import { html } from './deck.generated.json';

export function GET() {
  // The public deck travels inside the server build and bypasses the hosting
  // static-file shortcut. The proxy provides its hash-locked security policy.
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
