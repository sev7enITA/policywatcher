export const LIVE_DEV_DIARY_PATH = '/live-dev-diary';
export const LIVE_DEV_EPISODE_001 = {
  number: '001',
  publishedOn: '2026-11-24',
  deckPath: '/live-dev-diary/episode-001.html',
  klarnaCompany: '/knowledge/companies/klarna',
  klarnaEu: '/change/c76db656-7902-40a8-a02a-4f6aebe36246',
  klarnaUs: '/change/1ee4e96e-0be3-46bf-8c66-10c4e8f3718a',
} as const;

// Hashes cover only the inline JS and CSS of the self-contained public deck.
// The regression test checks the bytes against the committed HTML.
export const LIVE_DEV_EPISODE_001_CSP = [
  "default-src 'none'",
  "script-src 'sha256-/x7W7R75k8Roq0WaVRQX9blP4OufE5xbAdzklGxsgpw=' 'sha256-oHffb7yGc36aiNKOkn6iNnNQ0g5hE8nvn4x4THFtfEU='",
  "style-src 'sha256-UH5GgEt3bApwRYyHyCXCOzl8oca3tVCDPmpaQlE6Mjc='",
  'img-src data:',
  'font-src data:',
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join('; ');
