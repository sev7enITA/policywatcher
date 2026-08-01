'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CircleHelp,
  CircleMinus,
  Clock3,
  Database,
  OctagonAlert,
  RefreshCw,
} from 'lucide-react';
import {
  ADMIN_LIVE_STATUS_ENDPOINTS,
  buildUnavailableLiveStatusCards,
  type AdminLiveStatusCard,
  type AdminLiveStatusState,
} from '@/lib/adminLiveStatus';
import {
  presentLiveStatusCardsForRole,
  type AdminConsoleRole,
} from '@/lib/adminRolePresentation';
import styles from './admin.module.css';

function formatCheckedAt(value: string | null): string {
  if (!value) return 'Unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unavailable';
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(date);
}

function stateIcon(state: AdminLiveStatusState) {
  if (state === 'measured') return <CheckCircle2 size={15} aria-hidden="true" />;
  if (state === 'critical') return <OctagonAlert size={15} aria-hidden="true" />;
  if (state === 'attention') return <AlertTriangle size={15} aria-hidden="true" />;
  if (state === 'not-enabled') return <CircleMinus size={15} aria-hidden="true" />;
  return <CircleHelp size={15} aria-hidden="true" />;
}

function metricAvailabilityLabel(card: AdminLiveStatusCard): string {
  if (card.metricAvailability === 'available') return 'Available';
  if (card.metricAvailability === 'not-enabled') return 'Optional service not enabled';
  return 'Unavailable';
}

async function fetchStatusCard(
  definition: (typeof ADMIN_LIVE_STATUS_ENDPOINTS)[number],
): Promise<AdminLiveStatusCard> {
  try {
    const response = await fetch(definition.endpoint, {
      credentials: 'include',
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => null) as unknown;
    if (!response.ok && definition.id !== 'database') return definition.normalize(null);
    return definition.normalize(payload);
  } catch {
    return definition.normalize(null);
  }
}

export function LiveStatusCards({ role }: { role: AdminConsoleRole }) {
  const [cards, setCards] = useState<AdminLiveStatusCard[]>(buildUnavailableLiveStatusCards);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcement, setAnnouncement] = useState('Loading live module status.');
  const sectionRef = useRef<HTMLElement>(null);
  const requestInFlight = useRef(false);

  const load = useCallback(async (focusAfter = false) => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    if (focusAfter) setRefreshing(true);
    setAnnouncement(focusAfter ? 'Refreshing live module status.' : 'Loading live module status.');

    const results = await Promise.allSettled(
      ADMIN_LIVE_STATUS_ENDPOINTS.map((definition) => fetchStatusCard(definition)),
    );
    const nextCards = results.map((result, index) => (
      result.status === 'fulfilled'
        ? result.value
        : ADMIN_LIVE_STATUS_ENDPOINTS[index].normalize(null)
    ));
    setCards(nextCards);
    setInitialLoading(false);
    setRefreshing(false);
    requestInFlight.current = false;
    const unavailableCount = nextCards.filter((card) => card.state === 'unavailable').length;
    setAnnouncement(`Live module status updated. ${unavailableCount} metric${unavailableCount === 1 ? '' : 's'} unavailable.`);
    if (focusAfter) {
      window.requestAnimationFrame(() => sectionRef.current?.focus());
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(false); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const presentedCards = presentLiveStatusCardsForRole(cards, role);

  return (
    <section
      ref={sectionRef}
      className={styles.liveStatusSection}
      aria-labelledby="live-module-status-title"
      aria-busy={initialLoading || refreshing}
      tabIndex={-1}
    >
      <header className={styles.liveStatusHeader}>
        <div>
          <span className={styles.liveStatusEyebrow}>Live operational checks</span>
          <h2 id="live-module-status-title">Module status</h2>
          <p>Each card reports one bounded protected endpoint. Missing metrics and optional services remain explicit.</p>
        </div>
        <button
          type="button"
          className={styles.liveStatusRefresh}
          onClick={() => void load(true)}
          disabled={initialLoading || refreshing}
        >
          <RefreshCw size={16} className={refreshing ? styles.liveStatusSpin : undefined} aria-hidden="true" />
          {refreshing ? 'Refreshing…' : 'Refresh status'}
        </button>
      </header>

      <p className={styles.srOnly} aria-live="polite" aria-atomic="true">{announcement}</p>

      <div className={styles.liveStatusGrid} role="list" aria-label="Live module checks">
        {presentedCards.map((card) => (
          <article
            className={styles.liveStatusCard}
            data-state={initialLoading ? 'loading' : card.state}
            key={card.id}
            role="listitem"
          >
            <div className={styles.liveStatusCardTop}>
              <div>
                <span className={styles.liveStatusScope}>{card.scope}</span>
                <h3>{card.label}</h3>
              </div>
              <span className={styles.liveStatusState}>
                {initialLoading ? <Clock3 size={15} aria-hidden="true" /> : stateIcon(card.state)}
                {initialLoading ? 'Loading' : card.stateLabel}
              </span>
            </div>

            <dl className={styles.liveStatusRail}>
              <div>
                <dt>Last checked</dt>
                <dd>
                  {initialLoading ? 'Loading…' : card.checkedAt ? (
                    <time dateTime={card.checkedAt}>{formatCheckedAt(card.checkedAt)} UTC</time>
                  ) : 'Unavailable'}
                </dd>
              </div>
              <div>
                <dt>Metric</dt>
                <dd>{initialLoading ? 'Loading…' : metricAvailabilityLabel(card)}</dd>
              </div>
              <div>
                <dt>{card.countLabel}</dt>
                <dd className={styles.liveStatusCount}>{initialLoading ? '—' : card.count ?? '—'}</dd>
              </div>
            </dl>

            <p className={styles.liveStatusDetail}>
              {initialLoading ? 'Waiting for this independent protected endpoint.' : card.detail}
            </p>

            <Link href={card.action.href} className={styles.liveStatusAction}>
              {card.action.label}
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>

      <p className={styles.liveStatusBoundary}>
        <Database size={14} aria-hidden="true" />
        Status reflects the latest returned check only; it is not a service-level, security or compliance certification.
      </p>
    </section>
  );
}
