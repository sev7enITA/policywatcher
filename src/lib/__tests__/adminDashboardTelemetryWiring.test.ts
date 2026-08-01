import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardMeasurement } from '@/app/admin/DashboardMeasurement';
import {
  ADMIN_DASHBOARD_PENDING_ROUTE_TTL_MS,
  pendingRouteDisposition,
  postDashboardTelemetry,
  processPendingRoute,
  type PendingRoute,
} from '@/app/admin/AdminDashboardTelemetryClient';

const pending: PendingRoute = {
  visitId: 'e0d8d3af-37f2-4f3f-8d65-635e505bc047',
  priorityId: 'scan-stale',
  destination: '/admin/cron',
  viewportClass: 'mobile',
  createdAt: 1_000,
  expiresAt: 1_000 + ADMIN_DASHBOARD_PENDING_ROUTE_TTL_MS,
};

describe('admin dashboard measurement wiring', () => {
  it('keeps client event writes non-blocking when fetch rejects', () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('offline'));
    expect(() => postDashboardTelemetry({ eventType: 'invalid-for-test' })).not.toThrow();
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/dashboard-telemetry', expect.objectContaining({ keepalive: true }));
    fetchMock.mockRestore();
  });

  it('wires protected route confirmation, action tags and per-visit storage without identity fields', () => {
    const client = readFileSync('src/app/admin/AdminDashboardTelemetryClient.tsx', 'utf8');
    const actionCenter = readFileSync('src/app/admin/OperationalActionCenter.tsx', 'utf8');
    const layout = readFileSync('src/app/admin/layout.tsx', 'utf8');
    expect(layout).toContain('<AdminDashboardTelemetryClient />');
    expect(actionCenter).toContain('data-canonical-destination={item.action.href}');
    expect(client).toContain("sessionStorage.setItem");
    expect(client).toContain("eventType: 'canonical-route-arrival'");
    expect(client).toContain("eventType: 'mobile-priority-distance'");
    expect(client).toContain('expiresAt: Date.now() + ADMIN_DASHBOARD_PENDING_ROUTE_TTL_MS');
    expect(client).not.toMatch(/userAgent|referrer|email|username|queryString/);
  });

  it('expires or clears mismatched pending routes and removes a matching route only after confirmed arrival', async () => {
    expect(pendingRouteDisposition(pending, '/admin/cron', 2_000)).toBe('eligible');
    expect(pendingRouteDisposition(pending, '/admin/database', 2_000)).toBe('mismatch');
    expect(pendingRouteDisposition(pending, '/admin/cron', pending.expiresAt + 1)).toBe('expired');

    const remove = vi.fn();
    const request = vi.fn()
      .mockRejectedValueOnce(new Error('navigation race'))
      .mockResolvedValueOnce(new Response('{}', { status: 409 }))
      .mockResolvedValueOnce(new Response('{}', { status: 202 }));
    await expect(processPendingRoute(pending, '/admin/cron', remove, request, () => 2_000, async () => undefined)).resolves.toBe('confirmed');
    expect(request).toHaveBeenCalledTimes(3);
    expect(remove).toHaveBeenCalledTimes(1);

    remove.mockClear();
    const failedRequest = vi.fn().mockResolvedValue(new Response('{}', { status: 409 }));
    await expect(processPendingRoute(pending, '/admin/cron', remove, failedRequest, () => 2_000, async () => undefined)).resolves.toBe('failed');
    expect(remove).not.toHaveBeenCalled();
    await expect(processPendingRoute(pending, '/admin/cron', remove, failedRequest, () => pending.expiresAt + 1, async () => undefined)).resolves.toBe('expired');
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('renders unavailable sample/window wording instead of a measured zero', () => {
    const html = renderToStaticMarkup(createElement(DashboardMeasurement, { actionCenter: {
      checkedAt: '2026-08-01T12:00:00.000Z', checkedWindow: 'bounded', priorities: [],
    } }));
    expect(html).toContain('Sample unavailable · window unavailable');
    expect(html).not.toContain('Sample 0 · trailing 30 days');
    expect(html).toContain('Retention is 90 days');
  });

  it('provides synchronized risk text, live refresh, focus handoff, reduced motion and 320px containment', () => {
    const page = readFileSync('src/app/admin/page.tsx', 'utf8');
    const component = readFileSync('src/app/admin/DashboardMeasurement.tsx', 'utf8');
    const css = readFileSync('src/app/admin/admin.module.css', 'utf8');
    expect(page).toContain('<DashboardMeasurement actionCenter={metrics.actionCenter} />');
    expect(page).toContain('Policy changes grouped by current overall risk profile');
    expect(page).toContain('riskProfileData.map');
    expect(component).toContain('aria-live="polite"');
    expect(component).toContain('sectionRef.current?.focus()');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('.measurementSpin');
    expect(css).toContain('min-width: 0');
    expect(css).toContain('max-width: 100vw');
  });
});
