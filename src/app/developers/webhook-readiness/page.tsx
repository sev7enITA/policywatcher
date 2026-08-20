import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Braces,
  CheckCircle2,
  Clock3,
  Code2,
  FileJson2,
  KeyRound,
  RadioTower,
  RotateCcw,
  ShieldCheck,
  Workflow,
  XCircle,
} from 'lucide-react';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import {
  WEBHOOK_NODE_EXAMPLE,
  WEBHOOK_PRODUCTION_CHECKLIST,
  WEBHOOK_PYTHON_EXAMPLE,
  WEBHOOK_SIGNATURE_VERSION,
  WEBHOOK_TEST_VECTOR,
  WEBHOOK_TOLERANCE_SECONDS,
  WEBHOOK_VERIFICATION_BOUNDARY,
  getWebhookConformanceSuite,
} from '@/lib/webhookVerification';
import WebhookReadinessClient from './WebhookReadinessClient';
import styles from './webhook-readiness.module.css';

export const metadata: Metadata = {
  title: 'Webhook verification | PolicyWatcher',
  description:
    'Inspect and verify the deterministic PolicyWatcher HMAC-SHA256 webhook test vector locally before outbound delivery is available.',
  alternates: { canonical: '/developers/webhook-readiness' },
};

const verificationSteps = [
  {
    icon: FileJson2,
    label: '01 · Read',
    title: 'Preserve the raw body',
    detail: 'Read the exact request bytes before any JSON parsing or reformatting.',
  },
  {
    icon: Braces,
    label: '02 · Construct',
    title: 'Build the signed message',
    detail: 'Join the Unix timestamp, a period and the unchanged raw body.',
  },
  {
    icon: KeyRound,
    label: '03 · Compute',
    title: 'Calculate HMAC-SHA256',
    detail: 'Use the endpoint secret and encode the digest as lowercase hexadecimal.',
  },
  {
    icon: ShieldCheck,
    label: '04 · Compare',
    title: 'Use constant-time comparison',
    detail: 'Compare the receiver digest with the value after the v1 prefix.',
  },
  {
    icon: RotateCcw,
    label: '05 · Constrain',
    title: 'Check freshness and replay',
    detail: 'Apply the timestamp window and reject event IDs already processed.',
  },
];

const unavailableCapabilities = [
  'Webhook subscriptions or endpoint registration',
  'Outbound push delivery, retries or delivery receipts',
  'Hosted replay storage or event redelivery',
  'Production secret provisioning or key rotation',
  'Delivery monitoring, alerting or service-level commitments',
];

export default function WebhookReadinessPage() {
  const conformanceSuite = getWebhookConformanceSuite();

  return (
    <>
      <PublicHeader current="developers" />
      <main className={styles.page}>
        <section className={styles.hero}>
          <nav className={styles.topbar} aria-label="Webhook readiness navigation">
            <Link href="/developers" className={styles.backLink}>
              <ArrowLeft size={16} aria-hidden="true" />
              Developers
            </Link>
            <div className={styles.topbarLinks}>
              <a href="/api/v1/change-events?limit=25&amp;lang=en">Change Event Feed</a>
              <Link href="/integrations">Integration Hub</Link>
              <a href="/api/v1/manifest">API manifest</a>
              <Link href="/security">Security</Link>
            </div>
          </nav>

          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>
                <Workflow size={16} aria-hidden="true" />
                Webhook readiness · local verification
              </span>
              <h1>Webhook verification</h1>
              <p>
                Inspect the exact signed input and verify a deterministic public test vector in this browser. This readiness kit defines receiver interoperability; it does not provide webhook subscriptions or outbound delivery.
              </p>
            </div>

            <aside className={styles.contractSummary} aria-label="Signature contract summary">
              <div className={styles.summaryHeading}>
                <span>Receiver contract</span>
                <strong>HMAC-SHA256</strong>
              </div>
              <dl>
                <div><dt>Header</dt><dd>{WEBHOOK_SIGNATURE_VERSION}=hex</dd></div>
                <div><dt>Tolerance</dt><dd>{WEBHOOK_TOLERANCE_SECONDS} seconds</dd></div>
                <div><dt>Input</dt><dd>timestamp.raw-body</dd></div>
                <div><dt>Encoding</dt><dd>UTF-8 · hex</dd></div>
              </dl>
              <p>{WEBHOOK_VERIFICATION_BOUNDARY}</p>
            </aside>
          </div>
        </section>

        <section className={styles.boundaries} aria-label="Readiness boundaries">
          <article>
            <Code2 size={21} aria-hidden="true" />
            <div>
              <strong>Local computation</strong>
              <p>Verification runs with browser Web Crypto. Field values are not submitted or persisted.</p>
            </div>
          </article>
          <article>
            <KeyRound size={21} aria-hidden="true" />
            <div>
              <strong>Historical compatibility vector</strong>
              <p>The public vector checks signature compatibility. Its timestamp is evaluated at the recorded vector time, never by disabling production freshness.</p>
            </div>
          </article>
          <article>
            <RadioTower size={21} aria-hidden="true" />
            <div>
              <strong>Push delivery not enabled</strong>
              <p>No endpoint registration, outbound send, retry or delivery receipt is available here.</p>
            </div>
          </article>
        </section>

        <section className={styles.workbenchSection} aria-labelledby="workbench-heading">
          <header className={styles.sectionHeader}>
            <span>Protocol workbench</span>
            <h2 id="workbench-heading">Signature test</h2>
            <p>Change any field to test failure behavior, then restore the canonical vector. All computation remains on this device.</p>
          </header>
          <WebhookReadinessClient
            canonicalVector={WEBHOOK_TEST_VECTOR}
            conformanceSuite={conformanceSuite}
            signatureVersion={WEBHOOK_SIGNATURE_VERSION}
          />
        </section>

        <section className={styles.section} aria-labelledby="sequence-heading">
          <header className={styles.sectionHeader}>
            <span>Receiver sequence</span>
            <h2 id="sequence-heading">Verification stages</h2>
            <p>The browser workbench covers construction, calculation and comparison. Production receivers must also enforce freshness and replay controls.</p>
          </header>
          <ol className={styles.sequence}>
            {verificationSteps.map(({ icon: Icon, label, title, detail }) => (
              <li key={label}>
                <div className={styles.sequenceLabel}>
                  <Icon size={18} aria-hidden="true" />
                  <span>{label}</span>
                </div>
                <strong>{title}</strong>
                <p>{detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.section} aria-labelledby="examples-heading">
          <header className={styles.sectionHeader}>
            <span>Receiver examples</span>
            <h2 id="examples-heading">Runtime examples</h2>
            <p>These examples verify the signature shape and digest. Add the production controls listed below before accepting a delivered event.</p>
          </header>
          <div className={styles.codeGrid}>
            <article className={styles.codePanel}>
              <header><span>Node.js</span><code>node:crypto</code></header>
              <pre tabIndex={0} aria-label="Node.js webhook verification example"><code>{WEBHOOK_NODE_EXAMPLE}</code></pre>
            </article>
            <article className={styles.codePanel}>
              <header><span>Python</span><code>hmac · hashlib</code></header>
              <pre tabIndex={0} aria-label="Python webhook verification example"><code>{WEBHOOK_PYTHON_EXAMPLE}</code></pre>
            </article>
          </div>
        </section>

        <section className={styles.productionSection} aria-labelledby="production-heading">
          <div className={styles.productionColumn}>
            <header className={styles.sectionHeader}>
              <span>Production receiver</span>
              <h2 id="production-heading">Integrator controls</h2>
            </header>
            <ul className={styles.checklist}>
              {WEBHOOK_PRODUCTION_CHECKLIST.map((item) => (
                <li key={item}><CheckCircle2 size={17} aria-hidden="true" /><span>{item}</span></li>
              ))}
            </ul>
          </div>
          <aside className={styles.unavailable} aria-labelledby="unavailable-heading">
            <div className={styles.unavailableHeading}>
              <XCircle size={19} aria-hidden="true" />
              <div><span>Current boundary</span><h3 id="unavailable-heading">Not available in this release</h3></div>
            </div>
            <ul>
              {unavailableCapabilities.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </aside>
        </section>

        <section className={styles.nextBand} aria-label="Related developer resources">
          <Clock3 size={23} aria-hidden="true" />
          <div>
            <span>Available now</span>
            <h2>Published change-event feed</h2>
            <p>The public feed exposes already-published events with an opaque cursor. It does not imply delivery or receipt.</p>
          </div>
          <div className={styles.nextLinks}>
            <a href="/api/v1/change-events?limit=25&amp;lang=en">Open event feed <ArrowRight size={15} aria-hidden="true" /></a>
            <Link href="/developers">Developers</Link>
            <Link href="/integrations">Integration Hub</Link>
          </div>
        </section>
      </main>
      <Footer lang="en" variant="compact" />
    </>
  );
}
