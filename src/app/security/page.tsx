import type { Metadata } from 'next';
import { ArrowLeft, FileSearch, Lock, Send, Server, ShieldAlert, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import { POLICYWATCHER_BUILD_LABEL } from '@/lib/release';
import styles from './security.module.css';

export const metadata: Metadata = {
  title: 'Vulnerability Disclosure Policy | PolicyWatcher',
  description: 'Security reporting channel, response boundaries and current PolicyWatcher operational controls.',
  alternates: { canonical: '/security' },
};

export default function SecurityPage() {
  return (
    <>
      <PublicHeader current="security" />
      <main className={styles.page}>
        <article className={styles.card}>
          <header className={styles.hero}>
            <div className={styles.eyebrow}>
              <ShieldAlert size={18} aria-hidden="true" />
              <span>PolicyWatcher Security</span>
            </div>
            <h1>Vulnerability Disclosure Policy</h1>
            <p>
              This page describes the channel and information requested for reporting a potential security vulnerability.
            </p>
          </header>

          <div className={styles.content}>
            <section className={styles.section}>
              <span className={styles.sectionLabel}>Current operating boundary</span>
              <h2>Security controls for {POLICYWATCHER_BUILD_LABEL}</h2>
              <p>
                PolicyWatcher documents security and confidence work as operational evidence within a defined certification boundary. The current release includes:
              </p>
              <div className={styles.controlGrid}>
                <div className={styles.controlCard}>
                  <Lock size={18} aria-hidden="true" />
                  <strong>Session and API Boundaries</strong>
                  <span>HMAC-signed admin sessions, rate-limited login, bearer-protected internal routes and production seed endpoint lockout.</span>
                </div>
                <div className={styles.controlCard}>
                  <Server size={18} aria-hidden="true" />
                  <strong>Renderer Isolation</strong>
                  <span>Optional VPS renderer for script-rendered pages, protected by shared secret and SSRF validation for URLs, redirects and subresources.</span>
                </div>
                <div className={styles.controlCard}>
                  <FileSearch size={18} aria-hidden="true" />
                  <strong>Dataset QA Evidence</strong>
                  <span>Source-fit checks, SHA-256 consistency, check logs, ingestion-method visibility and append-only QA review decisions.</span>
                </div>
                <div className={styles.controlCard}>
                  <ShieldCheck size={18} aria-hidden="true" />
                  <strong>Public Validation Signals</strong>
                  <span>Links to GitHub Quality Gate, CodeQL, OpenSSF Scorecard, the OpenSSF Best Practices project and a public header scan.</span>
                </div>
                <div className={styles.controlCard}>
                  <Lock size={18} aria-hidden="true" />
                  <strong>Enterprise Integration Boundary</strong>
                  <span>Agent routes accept bounded public-evidence filters only. The Word task pane keeps selected clause text local and uses an Office-specific framing policy without weakening clickjacking protection elsewhere.</span>
                </div>
              </div>
              <p>
                See <Link href="/trust">Trust &amp; Quality Evidence</Link> and <Link href="/methodology/confidence">Confidence Methodology</Link> for the public boundary of these checks.
              </p>
            </section>

            <section className={styles.section}>
              <span className={styles.sectionLabel}>Reporting channel</span>
              <h2>How to Report</h2>
              <p>
                Please send vulnerability reports via email to <a href="mailto:security@policywatcher.online">security@policywatcher.online</a>. To help us triage your report quickly, please include:
              </p>
              <ul>
                <li>A description of the vulnerability and its potential impact.</li>
                <li>Detailed, step-by-step instructions or a proof-of-concept (PoC) to reproduce it.</li>
                <li>Any suggested remediation steps.</li>
              </ul>
            </section>

            <section className={styles.section}>
              <span className={styles.sectionLabel}>Safe research</span>
              <h2>Responsible Disclosure Guidelines</h2>
              <p>We request that you follow these guidelines to protect our users and system:</p>
              <ul>
                <li>Give us reasonable time to investigate and mitigate the issue before making it public.</li>
                <li>Do not access, modify, or delete user data that does not belong to you.</li>
                <li>Do not perform destructive actions, distributed denial of service (DDoS), or social engineering attacks.</li>
              </ul>
            </section>

            <section className={styles.section}>
              <span className={styles.sectionLabel}>Response boundary</span>
              <h2>Our Commitment</h2>
              <p>If you follow the guidelines above, we commit to:</p>
              <ul>
                <li>Acknowledge receipt of your report in a timely manner.</li>
                <li>Work quickly to resolve the vulnerability.</li>
                <li>Not pursue legal action against you.</li>
              </ul>
            </section>
          </div>

          <footer className={styles.actions}>
            <a href="mailto:security@policywatcher.online?subject=Vulnerability%20Report" className={styles.primaryAction}>
              <Send size={16} aria-hidden="true" /> Report a Vulnerability
            </a>
            <Link href="/" className={styles.backLink}>
              <ArrowLeft size={16} aria-hidden="true" /> Return to Homepage
            </Link>
          </footer>
        </article>
      </main>
      <Footer lang="en" />
    </>
  );
}
