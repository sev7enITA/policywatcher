import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  Clock,
  ExternalLink,
  FileDown,
  Filter,
  Globe2,
  ListChecks,
  Radio,
  ShieldCheck,
} from 'lucide-react';
import {
  buildObservatoryIcs,
  compareObservatoryDeadlines,
  getObservatoryCountdown,
  getObservatorySource,
  OBSERVATORY_VERIFIED_AT,
  type ObservatoryContentType,
  type ObservatoryEvent,
  observatoryEvents,
  observatorySignals,
  observatorySources,
  type Locale,
} from '@/lib/observatory';
import styles from './observatory.module.css';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';

export const metadata: Metadata = {
  title: 'Observatory | PolicyWatcher',
  description:
    'Operational watch board for AI governance, privacy enforcement, standards, events and regulatory updates used by PolicyWatcher.',
};

export const dynamic = 'force-dynamic';

const locale: Locale = 'en';

type WatchUrgency = 'high' | 'medium' | 'watch' | 'scheduled';

type WatchItem = {
  id: string;
  title: string;
  summary: string;
  sourceName: string;
  sourceHref: string;
  category: ObservatoryContentType;
  region: string;
  cadence: string;
  dateLabel: string;
  timeLabel: string;
  countdown: string;
  urgency: WatchUrgency;
  deadlineAt: number;
  event?: ObservatoryEvent;
};

const categoryFilters: Array<{ id: string; label: string; category?: ObservatoryContentType }> = [
  { id: 'all', label: 'All' },
  { id: 'ai', label: 'AI governance', category: 'AI governance' },
  { id: 'privacy', label: 'Privacy enforcement', category: 'privacy enforcement' },
  { id: 'standards', label: 'Standards', category: 'standards' },
  { id: 'events', label: 'Events', category: 'events' },
  { id: 'regulatory', label: 'Regulatory updates', category: 'regulatory updates' },
];

const regionFilters = [
  { id: 'global', label: 'Global' },
  { id: 'eu', label: 'EU' },
  { id: 'us', label: 'US' },
  { id: 'uk', label: 'UK' },
] as const;

const eventSourceIds: Record<string, string> = {
  'ieee-isope-2026-programme-review': 'ieee-isope',
  'eu-ai-office-monthly-review': 'eu-ai-office',
};

const urgencyCopy: Record<WatchUrgency, string> = {
  high: 'High priority',
  medium: 'Active watch',
  watch: 'Standards watch',
  scheduled: 'Scheduled',
};

function sourceTone(index: number) {
  return ['teal', 'indigo', 'amber'][index % 3];
}

function getFilterClass(category: ObservatoryContentType) {
  const categoryClasses: Record<ObservatoryContentType, string> = {
    'AI governance': styles.categoryAi,
    'privacy enforcement': styles.categoryPrivacy,
    standards: styles.categoryStandards,
    events: styles.categoryEvents,
    'regulatory updates': styles.categoryRegulatory,
  };

  return categoryClasses[category];
}

function getRegionClasses(region: string) {
  const normalized = region.toLowerCase();
  const classes: string[] = [];

  if (normalized.includes('global')) classes.push(styles.regionGlobal);
  if (normalized.includes('european union') || normalized.includes('eu')) classes.push(styles.regionEu);
  if (normalized.includes('united states') || normalized.includes('us')) classes.push(styles.regionUs);
  if (normalized.includes('united kingdom') || normalized.includes('uk')) classes.push(styles.regionUk);

  return classes;
}

function formatCalendarHref(event: ObservatoryEvent) {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(buildObservatoryIcs(event))}`;
}

function parseIcsDate(value: string) {
  const year = value.slice(0, 4);
  const month = value.slice(4, 6);
  const day = value.slice(6, 8);
  const hour = value.slice(9, 11);
  const minute = value.slice(11, 13);
  const second = value.slice(13, 15);

  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
}

function formatBoardDate(date: Date) {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function buildWatchItems(now: Date): WatchItem[] {
  const signalItems = observatorySignals.map((signal): WatchItem => {
    const source = getObservatorySource(signal.sourceId);
    const reviewDate = parseIcsDate(signal.reviewUtc);

    return {
      id: signal.id,
      title: signal.title[locale],
      summary: signal.summary[locale],
      sourceName: source?.shortName ?? 'Observatory',
      sourceHref: signal.sourceUrl,
      category: signal.contentType,
      region: signal.region,
      cadence: source?.reviewCadence[locale] ?? 'Manual review',
      dateLabel: formatBoardDate(reviewDate),
      timeLabel: signal.reviewTimeLabel[locale],
      countdown: getObservatoryCountdown(reviewDate, now),
      urgency: signal.priority,
      deadlineAt: reviewDate.getTime(),
    };
  });

  const eventItems = observatoryEvents.map((event): WatchItem => {
    const source = getObservatorySource(eventSourceIds[event.id]);
    const eventDate = parseIcsDate(event.calendar.startUtc);

    return {
      id: event.id,
      title: event.title[locale],
      summary: event.summary[locale],
      sourceName: source?.shortName ?? event.organizer,
      sourceHref: event.href,
      category: 'events',
      region: source?.region ?? event.location[locale],
      cadence: source?.reviewCadence[locale] ?? 'Calendar review',
      dateLabel: event.dateLabel[locale],
      timeLabel: event.timeLabel[locale],
      countdown: getObservatoryCountdown(eventDate, now),
      urgency: 'scheduled',
      deadlineAt: eventDate.getTime(),
      event,
    };
  });

  return [...signalItems, ...eventItems].sort((a, b) => compareObservatoryDeadlines(a, b, now));
}

export default function ObservatoryPage() {
  const now = new Date();
  const watchItems = buildWatchItems(now);
  const nextItem = watchItems[0];
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const upcomingCount = watchItems.filter((item) => item.deadlineAt >= todayUtc).length;
  const highPriorityCount = watchItems.filter((item) => item.urgency === 'high').length;
  const activeCategories = new Set(watchItems.map((item) => item.category)).size;

  return (
    <>
      <PublicHeader current="observatory" />
      <main className={styles.page}>
      <section className={styles.hero}>
        <nav className={styles.topbar} aria-label="Observatory navigation">
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            Evidence Console
          </Link>
          <div className={styles.topbarLinks}>
            <Link href="/atlas">Atlas</Link>
            <Link href="/trust">Trust</Link>
            <Link href="/roadmap">Roadmap</Link>
          </div>
        </nav>

        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>
              <Radio size={15} />
              Watch board
            </span>
          <h1>Policy & Privacy Observatory</h1>
            <p>
              A deadline-style board for upcoming review windows, public-source
              signals, standards updates and policy events that deserve a human
              look before they influence PolicyWatcher analysis.
            </p>
            <p className={styles.freshnessNote}>Source list manually reviewed {OBSERVATORY_VERIFIED_AT} · not automatically ingested news.</p>
            <div className={styles.heroActions}>
              <Link href="#watch-board" className={styles.primaryAction}>
                Open board
                <ArrowRight size={15} />
              </Link>
              <Link href="#sources" className={styles.secondaryAction}>
                Source registry
                <ArrowRight size={15} />
              </Link>
            </div>

            {nextItem && (
              <article className={styles.nextUpCard}>
                <span>Next up</span>
                <strong>{nextItem.title}</strong>
                <p>
                  {nextItem.countdown} · {nextItem.dateLabel} · {nextItem.sourceName}
                </p>
              </article>
            )}
          </div>

          <div className={styles.summaryGrid} aria-label="Observatory summary">
            <article>
              <span>Upcoming items</span>
              <strong>{upcomingCount}</strong>
              <small>Overdue reviews remain visible below</small>
            </article>
            <article>
              <span>Review windows</span>
              <strong>{observatoryEvents.length}</strong>
              <small>Calendar-ready entries</small>
            </article>
            <article>
              <span>Official sources</span>
              <strong>{observatorySources.length}</strong>
              <small>Public registry links</small>
            </article>
            <article>
              <span>High priority</span>
              <strong>{highPriorityCount}</strong>
              <small>Needs first review</small>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.opsStrip} aria-label="Observatory operating model">
        <article>
          <ShieldCheck size={18} />
          <div>
            <span>Source gate</span>
            <strong>Official and standards-oriented links</strong>
          </div>
        </article>
        <article>
          <Clock size={18} />
          <div>
            <span>Update model</span>
            <strong>Manual review sweeps before interpretation</strong>
          </div>
        </article>
        <article>
          <CalendarCheck size={18} />
          <div>
            <span>Calendar</span>
            <strong>Exportable review reminders</strong>
          </div>
        </article>
      </section>

      <section id="watch-board" className={styles.boardSection}>
        <div>
          <span className={styles.eyebrow}>
            <Filter size={15} />
            Active watch
          </span>
          <h2>Upcoming review dates first, with overdue items retained.</h2>
          <p>
            Read it from top to bottom: upcoming reviews lead in deterministic date order;
            overdue work remains marked Review due, followed by source context and action.
          </p>
        </div>

        <div className={styles.filterShell}>
          <input id="filter-all" className={styles.filterInput} type="radio" name="watch-filter" defaultChecked />
          <input id="filter-ai" className={styles.filterInput} type="radio" name="watch-filter" />
          <input id="filter-privacy" className={styles.filterInput} type="radio" name="watch-filter" />
          <input id="filter-standards" className={styles.filterInput} type="radio" name="watch-filter" />
          <input id="filter-events" className={styles.filterInput} type="radio" name="watch-filter" />
          <input id="filter-regulatory" className={styles.filterInput} type="radio" name="watch-filter" />
          <input id="filter-global" className={styles.filterInput} type="radio" name="watch-filter" />
          <input id="filter-eu" className={styles.filterInput} type="radio" name="watch-filter" />
          <input id="filter-us" className={styles.filterInput} type="radio" name="watch-filter" />
          <input id="filter-uk" className={styles.filterInput} type="radio" name="watch-filter" />

          <div className={styles.filterToolbar} aria-label="Observatory filters">
            <div>
              <span>Category</span>
              <div className={styles.filterGroup}>
                {categoryFilters.map((filter) => (
                  <label key={filter.id} htmlFor={`filter-${filter.id}`}>
                    {filter.label}
                    <small>
                      {filter.category
                        ? watchItems.filter((item) => item.category === filter.category).length
                        : watchItems.length}
                    </small>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <span>Region</span>
              <div className={`${styles.filterGroup} ${styles.regionFilters}`}>
                {regionFilters.map((filter) => (
                  <label key={filter.id} htmlFor={`filter-${filter.id}`}>
                    {filter.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.boardList}>
            {watchItems.map((item, index) => {
              const itemClasses = [
                styles.watchCard,
                getFilterClass(item.category),
                ...getRegionClasses(item.region),
              ].join(' ');

              return (
                <article key={item.id} className={itemClasses} data-urgency={item.urgency}>
                  <div className={styles.watchIndex}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{item.countdown}</strong>
                  </div>

                  <div className={styles.watchMain}>
                    <div className={styles.watchTitleRow}>
                      <div>
                        <span className={styles.statusPill}>{urgencyCopy[item.urgency]}</span>
                        <h3>{item.title}</h3>
                      </div>
                      <a href={item.sourceHref} target="_blank" rel="noopener noreferrer" aria-label={`Open ${item.sourceName}`}>
                        <ExternalLink size={16} />
                      </a>
                    </div>
                    <p>{item.summary}</p>

                    <dl className={styles.watchMeta}>
                      <div>
                        <dt>Source</dt>
                        <dd>{item.sourceName}</dd>
                      </div>
                      <div>
                        <dt>Category</dt>
                        <dd>{item.category}</dd>
                      </div>
                      <div>
                        <dt>Region</dt>
                        <dd>{item.region}</dd>
                      </div>
                      <div>
                        <dt>Review</dt>
                        <dd>{item.cadence}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className={styles.watchDue}>
                    <span>{item.dateLabel}</span>
                    <strong>{item.timeLabel}</strong>
                    <div className={styles.watchActions}>
                      <a href={item.sourceHref} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={14} />
                        Source
                      </a>
                      {item.event && (
                        <a href={formatCalendarHref(item.event)} download={item.event.calendar.filename}>
                          <FileDown size={14} />
                          Add calendar
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.methodNote} aria-label="Observatory methodology">
        <div className={styles.noteIcon}>
          <ListChecks size={20} />
        </div>
        <div>
          <span>Contribution and update model</span>
          <h2>Registry first, operational watch second.</h2>
          <p>
            The Observatory starts from a curated public registry. New sources
            belong in the registry only after scope, authority, cadence and
            evidence value are clear; watch items then reference those sources
            for review planning.
          </p>
        </div>
        <Link href="/roadmap" className={styles.secondaryAction}>
          Roadmap queue
          <ArrowRight size={15} />
        </Link>
      </section>

      <section id="sources" className={styles.section}>
        <div className={styles.sectionHeader}>
          <span>
            <BookOpen size={15} />
            Source registry
          </span>
          <h2>Official and standards-oriented sources grouped for review.</h2>
          <p>
            Watch items reference these public sources and their recorded
            review cadence.
          </p>
        </div>

        <div className={styles.sourceGrid}>
          {observatorySources.map((source, index) => (
            <article key={source.id} className={styles.sourceCard} data-tone={sourceTone(index)}>
              <div className={styles.sourceHeader}>
                <div>
                  <span>{source.region}</span>
                  <h3>{source.name}</h3>
                </div>
                <a href={source.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${source.name}`}>
                  <ExternalLink size={16} />
                </a>
              </div>
              <p>{source.note[locale]}</p>
              <div className={styles.sourceMeta}>
                <span>{source.authority}</span>
                <span>{source.reviewCadence[locale]}</span>
              </div>
              <div className={styles.typeList}>
                {source.contentTypes.map((type) => (
                  <span key={type}>{type}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.discoveryBand}>
        <div>
          <span>
            <Globe2 size={15} />
            Discovery
          </span>
          <h2>{activeCategories} active watch categories connect to the public map.</h2>
          <p>
            Atlas places Observatory beside the evidence console, Trust & Quality,
            methodology and roadmap surfaces.
          </p>
        </div>
        <Link href="/atlas" className={styles.primaryAction}>
          Open Site Atlas
          <ArrowRight size={15} />
        </Link>
      </section>
      </main>
      <Footer lang="en" />
    </>
  );
}
