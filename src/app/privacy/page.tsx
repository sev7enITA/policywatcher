import styles from './privacy.module.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | PolicyWatcher',
  description: 'How PolicyWatcher handles your data, in full transparency.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className={styles.container}>
      <article className={styles.content}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.subtitle}>Last updated: June 23, 2026</p>

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
          <h2>What data we collect</h2>
          <p>PolicyWatcher is designed to collect as little personal data as possible.</p>

          <h3>Data you provide voluntarily</h3>
          <p>
            If you subscribe to email alerts, we collect:
          </p>
          <ul>
            <li><strong>Email address</strong> (required): to send you policy change notifications.</li>
            <li><strong>Name</strong> (optional): for personalization of communications.</li>
            <li><strong>Region and industry preferences</strong>: to filter alerts relevant to you (e.g. "EU", "FinTech").</li>
          </ul>
          <p>
            This data is stored in our database and used exclusively for sending the alerts you requested.
            We do not share, sell, or transfer your email address to any third party, for any reason.
          </p>

          <h3>Data we do not collect</h3>
          <ul>
            <li>We do not use cookies (no tracking cookies, no analytics cookies, no session cookies).</li>
            <li>We do not use Google Analytics, Meta Pixel, or any third-party tracking service.</li>
            <li>We do not collect IP addresses for profiling purposes.</li>
            <li>We do not fingerprint your browser or device.</li>
            <li>We do not serve advertising of any kind.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Local storage</h2>
          <p>
            We use your browser&apos;s <code>localStorage</code> for a single purpose: remembering
            whether you have accepted the Terms of Use disclaimer. This data never leaves your
            browser and is not transmitted to our servers. You can clear it at any time through
            your browser settings.
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
            <li><strong>Erase</strong> your data ("right to be forgotten"). We will delete your email and all associated data upon request.</li>
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
            <li>Subscriber data is stored in an encrypted SQLite database hosted on our server infrastructure.</li>
            <li>All communications with the platform are encrypted via HTTPS/TLS.</li>
            <li>Access to the database is restricted and protected by API authentication.</li>
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

        <footer className={styles.footer}>
          <p>
            &copy; {new Date().getFullYear()} PolicyWatcher by Fabrizio Degni. All rights reserved.
          </p>
          <a href="/" className={styles.backLink}>Back to Dashboard</a>
        </footer>
      </article>
    </main>
  );
}
