import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  DatabaseZap,
  Eye,
  HardDrive,
  RadioTower,
  ShieldCheck,
} from 'lucide-react';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import EventContinuityClient from './EventContinuityClient';
import styles from './event-continuity.module.css';

export const metadata: Metadata = {
  title: 'Event Feed Continuity Lab | PolicyWatcher',
  description:
    'Inspect the anonymous PolicyWatcher change-event feed, save a browser-local checkpoint and review forward-polling continuity findings.',
  alternates: { canonical: '/developers/event-continuity' },
};

const protocol = [
  {
    number: '01',
    title: 'Inspect',
    detail: 'Request the current public window without a cursor. No request runs on page load.',
  },
  {
    number: '02',
    title: 'Review findings',
    detail: 'Check event identity, ordering, duplicates and initial-window truncation before moving the cursor.',
  },
  {
    number: '03',
    title: 'Checkpoint',
    detail: 'Save the returned opaque cursor in this browser or export the checkpoint JSON for your own records.',
  },
  {
    number: '04',
    title: 'Resume',
    detail: 'Explicitly poll from the saved cursor and compare the resumed window with the local checkpoint.',
  },
];

const unavailable = [
  'No endpoint registration, webhook subscription, push delivery or delivery receipt',
  'No automatic retry processing or server-side replay store',
  'No server-side checkpoint storage',
  'Endpoint identity, tenant workspace or signing-key management',
  'Monitoring coverage, network delivery or service-level commitments',
];

export default function EventContinuityPage() {
  return (
    <>
      <PublicHeader current="developers" />
      <main className={styles.page}>
        <section className={styles.hero}>
          <nav className={styles.topbar} aria-label="Event continuity navigation">
            <Link href="/developers" className={styles.backLink}>
              <ArrowLeft size={16} aria-hidden="true" />
              Developers
            </Link>
            <div className={styles.topbarLinks}>
              <a href="/api/v1/change-events?limit=25&amp;lang=en">Change Event Feed</a>
              <Link href="/developers/webhook-readiness">Webhook Readiness</Link>
              <a href="/api/v1/manifest">API manifest</a>
              <Link href="/methodology/confidence">Methodology</Link>
            </div>
          </nav>

          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>
                <DatabaseZap size={16} aria-hidden="true" />
                Event feed continuity · Beta 22
              </span>
              <h1>Inspect what a forward cursor can and cannot show.</h1>
              <p>
                Request an anonymous public event window, review continuity signals and keep an opaque checkpoint in this browser. The lab exercises polling and resume semantics; it is not an outbound webhook product.
              </p>
              <div className={styles.heroActions}>
                <a href="#continuity-lab" className={styles.primaryAction}>
                  Open the workbench
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
                <a
                  href="/api/v1/change-events?limit=25&amp;lang=en"
                  className={styles.secondaryAction}
                  target="_blank"
                  rel="noreferrer"
                >
                  Inspect raw feed
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
              </div>
            </div>

            <aside className={styles.contractSummary} aria-label="Polling contract summary">
              <div className={styles.summaryHeading}>
                <span>Polling contract</span>
                <strong>forward · read only</strong>
              </div>
              <dl>
                <div><dt>Endpoint</dt><dd>/api/v1/change-events</dd></div>
                <div><dt>Access</dt><dd>Anonymous GET</dd></div>
                <div><dt>Window</dt><dd>25 public events</dd></div>
                <div><dt>Checkpoint</dt><dd>Opaque cursor</dd></div>
              </dl>
              <p>The feed reports publication events for records that already pass the public evidence gate.</p>
            </aside>
          </div>
        </section>

        <section className={styles.boundaries} aria-label="Continuity lab boundaries">
          <article>
            <HardDrive size={21} aria-hidden="true" />
            <div>
              <strong>Browser-local checkpoint</strong>
              <p>The checkpoint is saved only in this browser until you clear or export it.</p>
            </div>
          </article>
          <article>
            <RadioTower size={21} aria-hidden="true" />
            <div>
              <strong>Polling only</strong>
              <p>Requests run only after an explicit inspect or resume action. No endpoint receives pushed events.</p>
            </div>
          </article>
          <article>
            <ShieldCheck size={21} aria-hidden="true" />
            <div>
              <strong>Evidence-gated</strong>
              <p>The feed contains already-public evidence records, not raw scans or operational source diagnostics.</p>
            </div>
          </article>
        </section>

        <section id="continuity-lab" className={styles.workbenchSection} aria-labelledby="continuity-heading">
          <header className={styles.sectionHeader}>
            <span>Continuity workbench</span>
            <h2 id="continuity-heading">Move the cursor only after reviewing the window.</h2>
            <p>Start from the current public window or resume from a checkpoint previously saved in this browser. Requests are never retried automatically.</p>
          </header>
          <EventContinuityClient />
        </section>

        <section className={styles.protocolSection} aria-labelledby="protocol-heading">
          <header className={styles.sectionHeader}>
            <span>Operational protocol</span>
            <h2 id="protocol-heading">Four explicit steps from inspection to resume.</h2>
            <p>The sequence keeps local observation, checkpoint storage and the next feed request distinguishable.</p>
          </header>
          <ol className={styles.protocol}>
            {protocol.map((step) => (
              <li key={step.number}>
                <span>{step.number}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.limitations} aria-labelledby="limitations-heading">
          <Eye size={24} aria-hidden="true" />
          <div>
            <span>Exact boundary</span>
            <h2 id="limitations-heading">A local continuity report is bounded evidence.</h2>
            <p>
              A clean local report is not proof of exhaustive monitoring, network delivery, endpoint identity or legal/compliance status. The public cursor can expose duplicates, ordering regressions and a truncated initial window; it cannot prove that every external policy update exists.
            </p>
          </div>
          <ul>
            {unavailable.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      </main>
      <Footer lang="en" variant="compact" />
    </>
  );
}
