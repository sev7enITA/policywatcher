import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync('src/app/admin/webhook-delivery/page.tsx', 'utf8');
const styles = readFileSync('src/app/admin/webhook-delivery/webhook-delivery.module.css', 'utf8');
const layout = readFileSync('src/app/admin/layout.tsx', 'utf8');

describe('configured webhook delivery admin console', () => {
  it('adds the monitor route for administrators and auditors', () => {
    expect(layout).toContain("label: 'Webhook Delivery'");
    expect(layout).toContain("href: '/admin/webhook-delivery'");
    expect(layout).toMatch(/label: 'Webhook Delivery',[\s\S]*?section: 'Monitor'/);
    const item = layout.slice(layout.indexOf("label: 'Webhook Delivery'"), layout.indexOf("label: 'VPS Services'"));
    expect(item).not.toContain('adminOnly');
  });

  it('uses only the protected admin API for manual operator actions', () => {
    expect(page).toContain("fetch('/api/admin/webhook-delivery'");
    expect(page).toContain("credentials: 'include'");
    expect(page).toContain("method: 'POST'");
    expect(page).toContain("body: JSON.stringify({})");
    expect(page).toContain("method: 'PATCH'");
    expect(page).toContain("body: JSON.stringify({ deliveryId, action: 'retry' })");
    expect(page).not.toContain('setInterval');
  });

  it('keeps cycles and retries role-aware, explicit and independently disabled', () => {
    expect(page).toContain("data.role === 'admin'");
    expect(page).toContain('cyclePending || loading');
    expect(page).toContain("delivery.status === 'failed' && data.role === 'admin'");
    expect(page).toContain('retryingId === delivery.id');
    expect(page).toContain('Run bounded cycle');
  });

  it('shows the operational boundary, state rail and non-SLA metric meaning', () => {
    expect(page).toContain('{data.boundary}');
    expect(page).toContain('Public event');
    expect(page).toContain('Signed outbox');
    expect(page).toContain('Receiver response');
    expect(page).toContain('They are not SLA, availability or success-rate measures.');
    for (const metric of ['Total', 'Pending', 'Processing', 'Retry', 'Delivered', 'Failed']) {
      expect(page).toContain(`label: '${metric}'`);
    }
  });

  it('derives one exception-first operational focus from the returned window', () => {
    expect(page).toContain('function getOperationalFocus(data: WebhookDeliveryData)');
    expect(page).toContain('Correct the deployment configuration');
    expect(page).toContain('Inspect the receiver or configuration before retrying');
    expect(page).toContain('Run one bounded delivery cycle');
    expect(page).toContain('Wait for processing, then refresh the evidence');
    expect(page).toContain('No delivery exception in the returned ledger');
    expect(page).toContain('Recommendation based on the returned operational window. It is not an SLA or an exhaustive health determination.');
    expect(page).toContain('Evidence path for the recommended action');
  });

  it('filters the returned ledger locally by status and identifiers', () => {
    expect(page).toContain("type StatusView = 'all' | 'action' | 'scheduled' | 'delivered'");
    expect(page).toContain("statusView === 'action' && delivery.status === 'failed'");
    expect(page).toContain("['pending', 'retry', 'processing'].includes(delivery.status)");
    expect(page).toContain('[delivery.endpointId, delivery.eventId, delivery.changeId]');
    expect(page).toContain('type="search"');
    expect(page).toContain('Search identifiers');
    expect(page).toContain('aria-pressed={statusView === view.key}');
    expect(page).not.toContain('localStorage');
    expect(page).not.toContain('URLSearchParams');
  });

  it('distinguishes an empty outbox from a filtered empty state and offers reset', () => {
    expect(page).toContain('No outbox record is available');
    expect(page).toContain('No records match the current filters');
    expect(page).toContain('function resetLedgerFilters()');
    expect(page).toContain('Reset filters');
    expect(page).toContain('of {data.recentDeliveries.length} records');
  });

  it('does not expose or request destination secrets and states the exact pilot limitations', () => {
    expect(page).toContain('Paths, query strings and secrets are never returned by this API.');
    expect(page).toContain('public endpoint registration, tenant self-service, automatic key rotation, guaranteed delivery or an SLA');
    expect(page).toContain('The browser never contacts a destination.');
    expect(page).not.toMatch(/type=["']password["']/);
    expect(page).not.toMatch(/requestBody|responseBody|fullUrl/);
  });

  it('provides accessible live states and a mobile label-value ledger', () => {
    expect(page).toContain('aria-live="polite"');
    expect(page).toContain('role="region"');
    expect(page).toContain('tabIndex={0}');
    expect(page).toContain('data-label="Endpoint / event"');
    expect(styles).toMatch(/@media\s*\(max-width:\s*780px\)/);
    expect(styles).toMatch(/\.ledger td\s*\{[\s\S]*?grid-template-columns:/);
    expect(styles).toMatch(/@media\s*\(max-width:\s*360px\)/);
    expect(styles).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(styles).toMatch(/\.statusViews button[\s\S]*?min-height:\s*44px/);
    expect(styles).toMatch(/\.ledgerSearch input[\s\S]*?min-height:\s*44px/);
    expect(styles).toMatch(/\.focusAction:focus-visible/);
  });

  it('keeps visible secondary evidence at or above 12px on mobile', () => {
    const mobileStart = styles.indexOf('@media (max-width: 780px)');
    const compactStart = styles.indexOf('@media (max-width: 560px)');
    const mobileStyles = styles.slice(mobileStart, compactStart);
    for (const selector of [
      '.focusCopy > span',
      '.railLabel',
      '.metricCard dt',
      '.metricCard span',
      '.statusBadge',
      '.eventId',
      '.secondaryTimestamp',
      '.protocolPanel p',
      '.ledger td::before',
    ]) {
      expect(mobileStyles, `${selector} should receive the mobile legibility rule`).toContain(selector);
    }
    expect(mobileStyles).toContain('font-size: 0.75rem;');
    expect(mobileStyles).not.toMatch(/font-size:\s*0\.(?:[0-6]\d|7[0-4])rem/);
  });
});
