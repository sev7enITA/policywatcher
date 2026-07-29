import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync('src/app/developers/webhook-readiness/page.tsx', 'utf8');
const client = readFileSync(
  'src/app/developers/webhook-readiness/WebhookReadinessClient.tsx',
  'utf8',
);
const styles = readFileSync(
  'src/app/developers/webhook-readiness/webhook-readiness.module.css',
  'utf8',
);

describe('webhook readiness public workbench', () => {
  it('states the delivery and historical-vector boundaries', () => {
    expect(page).toContain('Push delivery not enabled');
    expect(page).toContain('Historical compatibility vector');
    expect(page).toContain('never by disabling production freshness');
    expect(page).toContain('Not available in this release');
  });

  it('performs verification locally and rejects malformed or empty inputs', () => {
    expect(client).toContain('globalThis.crypto.subtle.sign');
    expect(client).toContain('globalThis.crypto.subtle.verify');
    expect(client).toContain('if (secret.length === 0)');
    expect(client).toContain('[0-9a-f]{64}');
    expect(client).not.toMatch(/\bfetch\s*\(/);
    expect(client).not.toMatch(/\b(?:localStorage|sessionStorage)\b/);
  });

  it('provides responsive layout and scroll containment for exact evidence', () => {
    expect(styles).toMatch(/@media\s*\(max-width:\s*780px\)/);
    expect(styles).toMatch(/@media\s*\(max-width:\s*520px\)/);
    expect(styles).toMatch(/\.signedBlock pre\s*\{[\s\S]*?overflow:\s*auto/);
    expect(styles).toMatch(/\.codePanel pre\s*\{[\s\S]*?overflow:\s*auto/);
  });
});
