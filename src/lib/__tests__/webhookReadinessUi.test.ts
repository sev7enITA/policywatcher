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

const forbiddenExportFields = ['secret:', 'rawBody:', 'signatureHeader:', 'userAgent', 'ipAddress'];

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

  it('runs the deterministic conformance suite locally in contract decision order', () => {
    expect(page).toContain('getWebhookConformanceSuite()');
    expect(client).toContain('Run ${conformanceSuite.caseCount} local cases');
    expect(client).toContain('evaluateConformanceCase');
    expect(client.indexOf("return 'invalid_secret'")).toBeLessThan(client.indexOf("return 'invalid_timestamp'"));
    expect(client.indexOf("return 'invalid_timestamp'")).toBeLessThan(client.indexOf("return 'invalid_signature_header'"));
    expect(client.indexOf("return 'invalid_signature_header'")).toBeLessThan(client.indexOf("return 'timestamp_outside_tolerance'"));
    expect(client).toContain("return matches ? 'valid' : 'signature_mismatch'");
    expect(client).not.toMatch(/\bfetch\s*\(/);
  });

  it('exports bounded local evidence without fixture or fingerprint data', () => {
    expect(client).toContain("formatVersion: '1.0.0'");
    expect(client).toContain("executionMode: 'browser-web-crypto'");
    expect(client).toContain('new Blob');
    expect(client).toContain('URL.createObjectURL');
    expect(client).toContain('URL.revokeObjectURL');
    expect(client).toContain('local compatibility evidence');
    const exportSection = client.slice(client.indexOf('const exportPayload'), client.indexOf('const blob'));
    forbiddenExportFields.forEach((field) => expect(exportSection).not.toContain(field));
  });

  it('provides accessible run states and a mobile-stacked ledger', () => {
    expect(client).toContain('aria-live="polite"');
    expect(client).toContain("actualCode = 'execution_error'");
    expect(client).toContain('disabled={!completedRun || runState === \'running\'}');
    expect(client).toContain('/api/v1/webhook-conformance-suite');
    expect(styles).toMatch(/\.caseLedger tbody td\s*\{[\s\S]*?display:\s*grid/);
    expect(styles).toMatch(/@media\s*\(max-width:\s*520px\)/);
  });
});
