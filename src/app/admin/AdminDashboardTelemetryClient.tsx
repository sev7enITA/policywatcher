'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import type { AdminDashboardViewportClass } from '@/lib/adminDashboardTelemetry';

const VISIT_KEY = 'pw.adminDashboard.visit';
const PENDING_ROUTE_KEY = 'pw.adminDashboard.pendingRoute';
export const ADMIN_DASHBOARD_PENDING_ROUTE_TTL_MS = 60_000;
export const ADMIN_DASHBOARD_ARRIVAL_RETRY_DELAYS_MS = [0, 250, 750] as const;

interface VisitState {
  id: string;
  startedAt: number;
  firstActionRecorded: boolean;
}

export interface PendingRoute {
  visitId: string;
  priorityId: string;
  destination: string;
  viewportClass: AdminDashboardViewportClass;
  createdAt: number;
  expiresAt: number;
}

function viewportClass(): AdminDashboardViewportClass {
  if (window.innerWidth < 768) return 'mobile';
  if (window.innerWidth < 1024) return 'tablet';
  return 'desktop';
}

function createVisit(): VisitState {
  return { id: crypto.randomUUID(), startedAt: Date.now(), firstActionRecorded: false };
}

function readJson<T>(key: string): T | null {
  try {
    const value = sessionStorage.getItem(key);
    return value ? JSON.parse(value) as T : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* measurement must remain non-blocking */ }
}

export function postDashboardTelemetry(input: Record<string, unknown>): void {
  void fetch('/api/admin/dashboard-telemetry', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    keepalive: true,
  }).catch(() => undefined);
}

function arrivalPayload(pending: PendingRoute): Record<string, unknown> {
  return {
    eventType: 'canonical-route-arrival',
    visitId: pending.visitId,
    priorityId: pending.priorityId,
    destination: pending.destination,
    viewportClass: pending.viewportClass,
  };
}

export function pendingRouteDisposition(
  pending: PendingRoute,
  pathname: string,
  now = Date.now(),
): 'eligible' | 'expired' | 'mismatch' {
  if (!Number.isFinite(pending.createdAt) || !Number.isFinite(pending.expiresAt)
    || pending.expiresAt <= pending.createdAt || now > pending.expiresAt) return 'expired';
  return pending.destination === pathname ? 'eligible' : 'mismatch';
}

export async function confirmPendingRouteArrival(
  pending: PendingRoute,
  request: typeof fetch = fetch,
  now: () => number = () => Date.now(),
  wait: (milliseconds: number) => Promise<void> = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds)),
): Promise<boolean> {
  for (const delay of ADMIN_DASHBOARD_ARRIVAL_RETRY_DELAYS_MS) {
    if (now() > pending.expiresAt) return false;
    if (delay > 0) await wait(delay);
    if (now() > pending.expiresAt) return false;
    try {
      const response = await request('/api/admin/dashboard-telemetry', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arrivalPayload(pending)),
        keepalive: true,
      });
      if (response.ok) return true;
      if (response.status !== 409) return false;
    } catch {
      // A navigation can complete before its keepalive attempt write. Retry only
      // inside this small fixed schedule and never beyond the transition TTL.
    }
  }
  return false;
}

export async function processPendingRoute(
  pending: PendingRoute,
  pathname: string,
  remove: () => void,
  request: typeof fetch = fetch,
  now: () => number = () => Date.now(),
  wait?: (milliseconds: number) => Promise<void>,
): Promise<'confirmed' | 'expired' | 'mismatch' | 'failed'> {
  const disposition = pendingRouteDisposition(pending, pathname, now());
  if (disposition !== 'eligible') {
    remove();
    return disposition;
  }
  const confirmed = await confirmPendingRouteArrival(pending, request, now, wait);
  if (!confirmed) return 'failed';
  remove();
  return 'confirmed';
}

export function AdminDashboardTelemetryClient() {
  const pathname = usePathname();
  const visitRef = useRef<VisitState | null>(null);

  useEffect(() => {
    const pending = readJson<PendingRoute>(PENDING_ROUTE_KEY);
    if (!pending) return;
    const removePending = () => {
      try { sessionStorage.removeItem(PENDING_ROUTE_KEY); } catch { /* non-blocking */ }
    };
    let cancelled = false;
    const expiryDelay = Math.max(0, pending.expiresAt - Date.now());
    const expiryTimer = window.setTimeout(removePending, Math.min(expiryDelay, ADMIN_DASHBOARD_PENDING_ROUTE_TTL_MS));
    void processPendingRoute(pending, pathname, () => { if (!cancelled) removePending(); });
    return () => {
      cancelled = true;
      window.clearTimeout(expiryTimer);
    };
  }, [pathname]);

  useEffect(() => {
    if (pathname !== '/admin') return;
    const visit = createVisit();
    visitRef.current = visit;
    writeJson(VISIT_KEY, visit);

    const distanceTimer = window.setTimeout(() => {
      if (viewportClass() !== 'mobile') return;
      const firstPriority = document.querySelector<HTMLElement>('[data-operational-priority="true"]');
      if (!firstPriority) return;
      postDashboardTelemetry({
        eventType: 'mobile-priority-distance',
        visitId: visit.id,
        numericValue: Math.max(0, Math.min(10_000, Math.round(firstPriority.getBoundingClientRect().top))),
        viewportClass: 'mobile',
      });
    }, 0);

    function handleTaggedAction(event: MouseEvent) {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>('[data-dashboard-action="true"]')
        : null;
      if (!target || !visitRef.current) return;
      const currentVisit = visitRef.current;
      const currentViewport = viewportClass();

      if (!currentVisit.firstActionRecorded) {
        currentVisit.firstActionRecorded = true;
        writeJson(VISIT_KEY, currentVisit);
        postDashboardTelemetry({
          eventType: 'first-action-elapsed',
          visitId: currentVisit.id,
          numericValue: Math.max(0, Math.min(3_600_000, Math.round(Date.now() - currentVisit.startedAt))),
          viewportClass: currentViewport,
        });
      }

      const priorityId = target.dataset.priorityId;
      const destination = target.dataset.canonicalDestination;
      if (!priorityId || !destination) return;
      const pending: PendingRoute = {
        visitId: currentVisit.id,
        priorityId,
        destination,
        viewportClass: currentViewport,
        createdAt: Date.now(),
        expiresAt: Date.now() + ADMIN_DASHBOARD_PENDING_ROUTE_TTL_MS,
      };
      writeJson(PENDING_ROUTE_KEY, pending);
      postDashboardTelemetry({
        eventType: 'action-center-cta-attempt',
        visitId: currentVisit.id,
        priorityId,
        destination,
        viewportClass: currentViewport,
      });
    }

    document.addEventListener('click', handleTaggedAction, true);
    return () => {
      window.clearTimeout(distanceTimer);
      document.removeEventListener('click', handleTaggedAction, true);
    };
  }, [pathname]);

  return null;
}
