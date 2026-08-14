'use client';

import Link from 'next/link';
import { useMemo, useState, type CSSProperties } from 'react';
import { ArrowRight, Check, CircleDot, ExternalLink, ShieldAlert } from 'lucide-react';
import {
  RELEASE_COLUMNS,
  RELEASE_IMPACT_UPDATED_AT,
  RELEASE_IMPACT_DOMAINS,
  RELEASE_IMPACT_ITEMS,
  getReleaseColumnIndex,
  getReleaseItems,
  type ReleaseImpactItem,
  type ReleaseImpactKind,
  type ReleaseImpactStatus,
} from '@/lib/releaseImpact';
import { POLICYWATCHER_VERSION_DISPLAY } from '@/lib/release';
import styles from './ReleaseImpactMap.module.css';

type DomainFilter = 'all' | ReleaseImpactKind;
type StatusFilter = 'all' | ReleaseImpactStatus;

const statusLabels: Record<ReleaseImpactStatus, string> = {
  delivered: 'Delivered',
  current: 'Current beta',
  planned: 'Planned',
};

function StatusMark({ item }: { item: ReleaseImpactItem }) {
  if (item.externalDependency) {
    return <ExternalLink size={14} aria-hidden="true" />;
  }
  if (item.status === 'delivered') {
    return <Check size={14} aria-hidden="true" />;
  }
  if (item.status === 'current') {
    return <CircleDot size={14} aria-hidden="true" />;
  }
  return <ArrowRight size={14} aria-hidden="true" />;
}

function ImpactInspector({ item }: { item: ReleaseImpactItem }) {
  const domain = RELEASE_IMPACT_DOMAINS.find((candidate) => candidate.id === item.domainId);
  const start = RELEASE_COLUMNS.find((release) => release.id === item.startRelease)?.label;
  const end = RELEASE_COLUMNS.find((release) => release.id === item.endRelease)?.label;
  const releaseRange = start === end ? start : `${start} to ${end}`;

  return (
    <aside className={styles.inspector} aria-live="polite" aria-label="Selected release impact">
      <div className={styles.inspectorHeading}>
        <div>
          <span className={styles.inspectorKicker}>Selected impact</span>
          <h3>{item.title}</h3>
        </div>
        <span className={styles.statusLabel} data-status={item.status}>
          <StatusMark item={item} />
          {item.externalDependency ? 'External dependency' : statusLabels[item.status]}
        </span>
      </div>
      <p className={styles.inspectorSummary}>{item.summary}</p>
      <dl className={styles.inspectorGrid}>
        <div>
          <dt>Release window</dt>
          <dd>{releaseRange}</dd>
        </div>
        <div>
          <dt>Domain</dt>
          <dd>{domain?.label} · {domain?.kind}</dd>
        </div>
        <div className={styles.benefitCell}>
          <dt>Benefit unlocked</dt>
          <dd>{item.benefit}</dd>
        </div>
        <div>
          <dt>KPI outcome</dt>
          <dd>{item.kpi}</dd>
        </div>
        <div className={styles.kriCell}>
          <dt>KRI / residual risk</dt>
          <dd>{item.kri}</dd>
        </div>
        <div className={styles.evidenceCell}>
          <dt>Validation and evidence basis</dt>
          <dd>{item.evidence}</dd>
        </div>
        <div className={styles.limitationCell}>
          <dt>Residual limitation</dt>
          <dd>{item.limitation}</dd>
        </div>
      </dl>
    </aside>
  );
}

function getVisibleRouteLabel(item: ReleaseImpactItem) {
  const start = RELEASE_COLUMNS.find((release) => release.id === item.startRelease)?.shortLabel ?? item.startRelease;
  const end = RELEASE_COLUMNS.find((release) => release.id === item.endRelease)?.shortLabel ?? item.endRelease;
  const route = start === end ? start : `${start} to ${end}`;
  if (item.externalDependency) return `External · ${route}`;
  return `${statusLabels[item.status]} · ${route}`;
}

function getAccessibleRouteLabel(item: ReleaseImpactItem) {
  const start = RELEASE_COLUMNS.find((release) => release.id === item.startRelease)?.label ?? item.startRelease;
  const end = RELEASE_COLUMNS.find((release) => release.id === item.endRelease)?.label ?? item.endRelease;
  const route = start === end ? start : `${start} to ${end}`;
  const state = item.externalDependency ? 'External dependency' : statusLabels[item.status];
  return `${item.title}. ${state}. Release window ${route}. Select for impact details.`;
}

export function ReleaseImpactMap() {
  const [domainFilter, setDomainFilter] = useState<DomainFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedId, setSelectedId] = useState('governed-regional-benchmark-visualizations');

  const visibleItems = useMemo(() => RELEASE_IMPACT_ITEMS.filter((item) => {
    const domain = RELEASE_IMPACT_DOMAINS.find((candidate) => candidate.id === item.domainId);
    const domainMatches = domainFilter === 'all' || domain?.kind === domainFilter;
    const statusMatches = statusFilter === 'all' || item.status === statusFilter;
    return domainMatches && statusMatches;
  }), [domainFilter, statusFilter]);

  const groupedItems = useMemo(() => RELEASE_IMPACT_DOMAINS.map((domain) => ({
    domain,
    items: visibleItems.filter((item) => item.domainId === domain.id),
  })).filter((group) => group.items.length > 0), [visibleItems]);

  const selectedItem = visibleItems.find((item) => item.id === selectedId) ?? visibleItems[0] ?? RELEASE_IMPACT_ITEMS[0];

  return (
    <section className={styles.mapSection} aria-labelledby="impact-map-title">
      <div className={styles.mapHeader}>
        <div>
          <span className={styles.kicker}>Release route</span>
          <h2 id="impact-map-title">Impact across business and technical assurance</h2>
          <p>
            Select any route to inspect its benefit, evidence basis and named residual risk. Categorical KPI and KRI labels describe release outcomes, not measured performance.
          </p>
        </div>
        <div className={styles.legend} aria-label="Status legend">
          <small>Impact inventory updated {RELEASE_IMPACT_UPDATED_AT}</small>
          <span><i data-kind="delivered" />Delivered</span>
          <span><i data-kind="current" />Current beta</span>
          <span><i data-kind="planned" />Planned</span>
          <span><i data-kind="external" />External dependency</span>
        </div>
      </div>

      <div className={styles.filters} aria-label="Release impact filters">
        <fieldset>
          <legend>Domain</legend>
          {(['all', 'business', 'technical'] as DomainFilter[]).map((filter) => (
            <button
              key={filter}
              type="button"
              aria-pressed={domainFilter === filter}
              onClick={() => setDomainFilter(filter)}
            >
              {filter === 'all' ? 'All' : filter[0].toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </fieldset>
        <fieldset>
          <legend>Status</legend>
          {(['all', 'delivered', 'current', 'planned'] as StatusFilter[]).map((filter) => (
            <button
              key={filter}
              type="button"
              aria-pressed={statusFilter === filter}
              onClick={() => setStatusFilter(filter)}
            >
              {filter === 'all' ? 'All' : statusLabels[filter]}
            </button>
          ))}
        </fieldset>
      </div>

      <p className={styles.srSummary}>
        The matrix contains {visibleItems.length} visible work items across {groupedItems.length} domains. Releases run from 3.7.0 through the current {POLICYWATCHER_VERSION_DISPLAY} and two future horizons.
      </p>

      <p className={styles.scrollCue}>Swipe or scroll horizontally to follow the release route. Work-item labels remain fixed.</p>
      <div className={styles.matrixViewport} tabIndex={0} aria-label="Scrollable release impact matrix. Work-item labels remain fixed while releases scroll horizontally.">
        <div
          className={styles.matrix}
          style={{ '--release-count': RELEASE_COLUMNS.length } as CSSProperties}
        >
          <div className={styles.cornerLabel}>Impact domain / work item</div>
          {RELEASE_COLUMNS.map((release) => (
            <div
              key={release.id}
              className={styles.releaseHead}
              data-state={release.state}
              title={release.label}
            >
              <span>{release.shortLabel}</span>
              {release.state === 'current' && <small>Current</small>}
            </div>
          ))}

          {groupedItems.map(({ domain, items }) => (
            <div className={styles.domainGroup} key={domain.id}>
              <div className={styles.domainBand}>
                <span>{domain.label}</span>
                <small>{domain.kind}</small>
              </div>
              {items.map((item) => {
                const start = getReleaseColumnIndex(item.startRelease);
                const end = getReleaseColumnIndex(item.endRelease);
                return (
                  <div className={styles.itemRow} key={item.id}>
                    <button
                      type="button"
                      className={styles.itemLabel}
                      aria-pressed={selectedItem.id === item.id}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <span>{item.title}</span>
                      <small>{item.externalDependency ? 'External dependency' : statusLabels[item.status]} · {item.kpi.split(':')[0]}</small>
                    </button>
                    <div className={styles.rowGrid} aria-hidden="true">
                      {RELEASE_COLUMNS.map((release) => <i key={release.id} />)}
                    </div>
                    <button
                      type="button"
                      className={styles.impactBar}
                      data-status={item.status}
                      data-external={item.externalDependency ? 'true' : 'false'}
                      aria-label={getAccessibleRouteLabel(item)}
                      aria-pressed={selectedItem.id === item.id}
                      onClick={() => setSelectedId(item.id)}
                      style={{
                        '--bar-start': start + 2,
                        '--bar-span': end - start + 1,
                      } as CSSProperties}
                    >
                      <StatusMark item={item} />
                      <span>{getVisibleRouteLabel(item)}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <ImpactInspector item={selectedItem} />
    </section>
  );
}

export function ReleaseImpactRail() {
  const currentRelease = RELEASE_COLUMNS.find((release) => release.state === 'current')?.id ?? RELEASE_COLUMNS.at(-1)?.id ?? 'beta.10';
  const selectableReleases = RELEASE_COLUMNS.filter((release) => release.state !== 'planned');
  const [releaseId, setReleaseId] = useState(currentRelease);
  const releaseItems = getReleaseItems(releaseId).filter((item) => item.status !== 'planned');
  const [selectedId, setSelectedId] = useState(releaseItems[0]?.id ?? 'public-surface-consistency');
  const selected = releaseItems.find((item) => item.id === selectedId) ?? releaseItems[0] ?? RELEASE_IMPACT_ITEMS[0];
  const release = RELEASE_COLUMNS.find((candidate) => candidate.id === releaseId);

  function selectRelease(nextReleaseId: string) {
    setReleaseId(nextReleaseId);
    setSelectedId(getReleaseItems(nextReleaseId).filter((item) => item.status !== 'planned')[0]?.id ?? 'public-surface-consistency');
  }

  return (
    <section className={styles.rail} aria-labelledby="release-rail-title">
      <div className={styles.railHeading}>
        <div>
          <span className={styles.kicker}>Shared release map</span>
          <h3 id="release-rail-title">Select a release to inspect its impact</h3>
        </div>
        <Link href="/roadmap">Full roadmap <ArrowRight size={14} /></Link>
      </div>
      <div className={styles.releaseRail} aria-label="Release selection">
        {selectableReleases.map((candidate) => (
          <button
            type="button"
            key={candidate.id}
            aria-pressed={releaseId === candidate.id}
            data-state={candidate.state}
            onClick={() => selectRelease(candidate.id)}
            title={candidate.label}
          >
            <i />
            <span>{candidate.shortLabel}</span>
          </button>
        ))}
      </div>
      <div className={styles.railReleaseHeader}>
        <strong>{release?.label}</strong>
        <span>{release?.state === 'current' ? 'Current web beta' : 'Delivered web release'}</span>
      </div>
      <div className={styles.railLayout}>
        <div className={styles.railItems}>
          {releaseItems.length > 0 ? releaseItems.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={selected.id === item.id}
              onClick={() => setSelectedId(item.id)}
            >
              <span><StatusMark item={item} />{item.title}</span>
              <small>{RELEASE_IMPACT_DOMAINS.find((domain) => domain.id === item.domainId)?.label}</small>
            </button>
          )) : (
            <p className={styles.emptyRail}>Foundation release summarized in the full roadmap.</p>
          )}
        </div>
        <article className={styles.railInspector}>
          <span>{statusLabels[selected.status]}</span>
          <h4>{selected.title}</h4>
          <p>{selected.summary}</p>
          <dl>
            <div><dt>KPI</dt><dd>{selected.kpi}</dd></div>
            <div><dt>KRI</dt><dd><ShieldAlert size={13} />{selected.kri}</dd></div>
          </dl>
        </article>
      </div>
    </section>
  );
}
