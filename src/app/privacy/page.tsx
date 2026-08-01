import styles from './privacy.module.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { POLICYWATCHER_BROWSER_EXTENSION_DISPLAY_VERSION, POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS } from '@/lib/release';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';

export const metadata: Metadata = {
  title: 'Privacy Policy | PolicyWatcher',
  description: 'How PolicyWatcher handles your data, in full transparency.',
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <PublicHeader current="privacy" />
      <main className={styles.container}>
      <article className={styles.content}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.subtitle}>Last updated: August 1, 2026</p>

        <section className={styles.section}>
          <h2>Who we are</h2>
          <p>
            PolicyWatcher is an independent civic-tech platform created by Fabrizio Degni,
            based in the European Union. This platform monitors and analyzes publicly available
            privacy policies and terms of service of major technology and fintech companies.
          </p>
          <p>
            For any privacy-related questions, you can contact us at:{' '}
            <a href="mailto:privacy@policywatcher.online">privacy@policywatcher.online</a>
          </p>
        </section>

        <section className={styles.section}>
          <h2>Protected dashboard measurement</h2>
          <p>
            The authenticated administrative dashboard can record four allowlisted operational events:
            time to the first tagged action, an Action Center destination attempt, confirmed arrival at
            its canonical protected route, and mobile distance to the first priority. The authenticated
            role is derived by the server and arbitrary destinations or metadata are rejected.
          </p>
          <p>
            Each event retains a random per-visit identifier, event type and key, Admin or Auditor role,
            an allowlisted priority and destination when applicable, a bounded numeric value, viewport
            class and server timestamp. Records are retained for at most 90 days and per-visit event keys
            are deduplicated.
          </p>
          <p>
            Dashboard measurement does not store an IP address, user agent, referrer, email, username,
            account identifier, query string, free text or arbitrary metadata. Event-derived values remain
            hidden until their stated minimum sample is available. Missing or unavailable measurements are
            not converted to zero and do not establish task completion, usability improvement, accessibility
            conformance, service levels or operational health.
          </p>
        </section>

        <section className={styles.section}>
          <h2>What data we collect</h2>
          <p>PolicyWatcher is designed to collect as little personal data as possible.</p>

          <h3>Data you provide voluntarily</h3>
          <p>
            If you subscribe to email alerts, we collect:
          </p>
          <ul>
            <li><strong>Email address</strong> (required): to send you policy change notifications.</li>
            <li><strong>Name</strong> (optional): for personalization of communications.</li>
            <li><strong>Region and industry preferences</strong>: to filter alerts relevant to you (e.g. &quot;EU&quot;, &quot;FinTech&quot;).</li>
          </ul>
          <p>
            This data is stored in our database and used exclusively for sending the alerts you requested.
            We do not share, sell, or transfer your email address to any third party, for any reason.
          </p>

          <h3>Data we do not collect</h3>
          <ul>
            <li>Public pages use no tracking or analytics cookies. A protected administrator or auditor login uses one essential HTTP-only signed session cookie with a 24-hour maximum age.</li>
            <li>We do not use Google Analytics, Meta Pixel, or any third-party tracking service.</li>
            <li>We do not collect IP addresses for profiling purposes.</li>
            <li>We do not fingerprint your browser or device.</li>
            <li>We do not serve advertising of any kind.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Cookie-free newsroom event counting</h2>
          <p>
            The Press Kit and Editorial Pulse use a first-party endpoint to count allowlisted aggregate newsroom events:
            press-package and Story Pack actions, Data Room and Pulse story views, social-card actions,
            citation and embed copies, press-contact intentions and launch-destination actions.
            A valid Pulse campaign link can also record its fixed, allowlisted campaign cohort.
            This counting uses no analytics cookie and no third-party analytics service.
          </p>
          <p>Each accepted event record retains exactly:</p>
          <ul>
            <li><strong>Event type:</strong> one of the documented newsroom or editorial-funnel actions.</li>
            <li><strong>Allowlisted target:</strong> a published locale, story slug, card format, copy category, contact route or launch destination.</li>
            <li><strong>Locale:</strong> English or Italian.</li>
            <li><strong>Server timestamp:</strong> when the event request was accepted.</li>
          </ul>
          <p>
            The event record does not retain an IP address, user agent, referrer, URL query,
            cookie or session identifier, fingerprint, email address, outlet name, free text or
            message recipient. An IP address can be used transiently in server memory for rate
            limiting, but is not written to the newsroom event record or its rate-limit log.
          </p>
          <p>
            Download, copy, contact and launch events measure actions or click intentions only. They do not
            confirm a completed transfer, publication, delivered message, conversion or unique person.
            Data Room and Pulse story events are requested once per page-component load. Automated traffic can affect all counts.
            A failed event write does not prevent the requested public action.
          </p>
          <p>
            Campaign URLs may contain one public parameter, <code>campaign</code>, whose value must match
            one of the five published Beta 13 cohort identifiers. Unknown, duplicate or additional values
            are ignored for campaign measurement. PolicyWatcher does not retain the raw query string.
          </p>
          <p>
            Authenticated administrators may record aggregate outreach operations for an allowlisted cohort:
            pitch sent, reply received, interview requested, coverage confirmed or correction requested.
            These records use the same event type, allowlisted target, locale and server timestamp fields.
            The administrative endpoint rejects recipient, journalist, outlet, email, subject override,
            message body, notes and arbitrary target values. Auditors can inspect aggregate totals but cannot create them.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Local storage</h2>
          <p>
            We use your browser&apos;s <code>localStorage</code> to remember the Terms of Use disclaimer,
            language and display preferences, the administrator&apos;s release-versioned outreach-readiness checklist, and your optional Adaptive Workspace configuration and
            onboarding completion. These settings contain no email address or account identifier, do
            not leave your browser, and can be cleared at any time through your browser settings.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Policy-update inquiries</h2>
          <p>
            When you use the “What changed?” workflow, the notification you paste is treated as an
            unverified clue and is parsed locally in your browser. The original text, sender and
            recipient addresses, subject, message body and any content fingerprint are not included
            in the API request and are not stored by PolicyWatcher.
          </p>
          <p>
            If you select a saved <code>.eml</code> file, the bounded MIME parser also runs locally
            in browser memory. PolicyWatcher does not connect to your mailbox or upload the file.
            Recipient headers and attachments are excluded before clue review; attachments are not
            opened. Unsupported, attachment-only and oversized messages are rejected locally.
          </p>
          <p>
            Only operational, non-personal clues needed for human review are sent: an organization or
            registrable domain, a query-free official URL when supplied, policy categories and dates.
            These clues are not sent to Gemini, and submitted links are not fetched before an
            administrator approves the source. The random public inquiry reference contains no user
            identifier.
          </p>
          <p>
            A reference is shown only after the inquiry has been saved in the protected administrator
            queue. When operational SMTP is configured, PolicyWatcher may notify the administrator
            using the same minimized clues and reference; the pasted notification, email addresses,
            subject and fingerprint are never included. If storage is unavailable, no queue item or
            administrator email is created and the interface says that the request was not registered.
          </p>
        </section>

        <section className={styles.section}>
          <h2>PolicyWatcher browser extension</h2>
          <p>
            Browser extension {POLICYWATCHER_BROWSER_EXTENSION_DISPLAY_VERSION}: {POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS.en}. Beta status does not
            reduce the privacy, permission-minimization or data-handling controls described here.
          </p>
          <p>
            The browser extension receives temporary access to the active tab only after you press
            its inspection button. It does not request persistent access to Gmail, Outlook, your
            mailbox, browsing history, cookies or the clipboard. The visible notice is processed
            inside that tab to identify minimal operational clues and is immediately discarded.
          </p>
          <p>
            Before any request is sent, you can review and correct the organization, sender domain,
            query-free official URL, policy categories and relevant dates. Only those confirmed fields
            can be transmitted over HTTPS to PolicyWatcher. The extension does not transmit or store
            the email address, recipient, subject, message body, attachments or a content fingerprint,
            and it contains no analytics, advertising, telemetry or remotely hosted executable code.
          </p>
          <p>
            The deployment infrastructure may process an IP address transiently for security logs and
            rate limiting. It is not used for profiling, advertising or extension analytics. The
            extension does not retain inquiry history, language or disclosure state after its popup
            closes.
          </p>
          <p>
            PolicyWatcher&apos;s use of information accessed through the browser extension complies
            with the Chrome Web Store User Data Policy, including its Limited Use requirements. The
            information is used only to provide the user-facing notice-to-evidence feature and is not
            used for advertising, profiling, credit decisions, resale or unrelated purposes.
          </p>
        </section>

        <section className={styles.section}>
          <h2>AI assistant conversations</h2>
          <p>
            When you use the Policy Live Assistant (chat feature), your questions are sent to
            our server and processed using the Google Gemini API. We do not store your conversation
            history. Each session is ephemeral: when you close the assistant, the conversation
            is gone. Google&apos;s data handling for the Gemini API is subject to{' '}
            <a href="https://ai.google.dev/terms" target="_blank" rel="noopener noreferrer">
              Google&apos;s API Terms of Service
            </a>.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Legal basis for processing (GDPR Art. 6)</h2>
          <ul>
            <li>
              <strong>Consent (Art. 6(1)(a)):</strong> When you subscribe to email alerts,
              you explicitly consent to the processing of your email address for that specific purpose.
            </li>
            <li>
              <strong>Legitimate interest (Art. 6(1)(f)):</strong> We process minimal technical
              data (server logs) for security and platform stability purposes.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Your rights under GDPR</h2>
          <p>As a user located in the European Economic Area, you have the right to:</p>
          <ul>
            <li><strong>Access</strong> your personal data and request a copy.</li>
            <li><strong>Rectify</strong> inaccurate or incomplete data.</li>
            <li><strong>Erase</strong> your data (&quot;right to be forgotten&quot;). We will delete your email and all associated data upon request.</li>
            <li><strong>Withdraw consent</strong> at any time by unsubscribing from alerts or contacting us.</li>
            <li><strong>Port</strong> your data in a structured, machine-readable format.</li>
            <li><strong>Object</strong> to processing based on legitimate interest.</li>
            <li><strong>Lodge a complaint</strong> with your national Data Protection Authority.</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:privacy@policywatcher.online">privacy@policywatcher.online</a>.
            We will respond within 30 days.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Data storage and security</h2>
          <ul>
            <li>Subscriber data is stored in the production SQLite database. PolicyWatcher does not claim application-level encryption of the live database file; filesystem, volume and backup protection depend on verified hosting controls.</li>
            <li>Production traffic is configured to use HTTPS/TLS; transport security depends on the active hosting and proxy configuration.</li>
            <li>Access to the database is restricted and protected by API authentication.</li>
            <li>Application logs use masked recipient references for email operations. Hosting-level request logs and their retention remain subject to the active provider configuration.</li>
            <li>The protected Admin dashboard can store allowlisted aggregate-use events with a random per-visit identifier, server-derived role, viewport class and bounded numeric values. It does not store an IP address, user agent, referrer, email, username, account identifier, query string, free text or arbitrary metadata in this telemetry table. Retention is 90 days.</li>
            <li>We do not store data longer than necessary. If you unsubscribe, your data is marked as inactive and can be permanently deleted upon request.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Data transfers</h2>
          <p>
            When you use the AI assistant, your query text is sent to Google Gemini API servers.
            Google may process this data in the United States or other countries. This transfer
            is covered by Google&apos;s Standard Contractual Clauses and Data Processing Addendum.
            No other personal data is transferred outside the EEA.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Children</h2>
          <p>
            PolicyWatcher is not directed at individuals under the age of 16.
            We do not knowingly collect personal data from children.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Changes to this policy</h2>
          <p>
            We may update this privacy policy from time to time. Changes will be posted on this
            page with an updated revision date. We will not reduce your rights under this policy
            without your explicit consent.
          </p>
        </section>

        <div className={styles.footer}>
          <p>
            Copyright {new Date().getFullYear()} PolicyWatcher by Fabrizio Degni. All rights reserved.
          </p>
          <Link href="/" className={styles.backLink}>Back to Dashboard</Link>
        </div>
      </article>
      </main>
      <Footer lang="en" />
    </>
  );
}
