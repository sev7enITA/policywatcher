/* eslint-disable @next/next/no-img-element -- External workflow badges are provider-hosted SVG evidence links. */
import type { Metadata } from 'next';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Database,
  ExternalLink,
  FileSearch,
  GitBranch,
  Lock,
  Server,
  ShieldCheck,
} from 'lucide-react';
import Footer from '@/components/Footer';
import { POLICYWATCHER_BUILD_LABEL } from '@/lib/release';
import styles from './trust.module.css';

export const metadata: Metadata = {
  title: 'Trust & Quality Evidence | PolicyWatcher',
  description:
    'Automated quality, security, and dataset assurance evidence for PolicyWatcher.',
};

type Tone = 'green' | 'blue' | 'amber' | 'violet' | 'slate';

type EvidenceCard = {
  title: string;
  status: string;
  tone: Tone;
  icon: LucideIcon;
  body: string;
  href?: string;
  linkLabel?: string;
};

const repoBase = 'https://github.com/sev7enITA/policywatcher';
const scorecardUrl = 'https://scorecard.dev/viewer/?uri=github.com/sev7enITA/policywatcher';
const bestPracticesProjectUrl = 'https://www.bestpractices.dev/projects/13465';
const mdnObservatoryUrl = 'https://developer.mozilla.org/en-US/observatory/analyze?host=www.policywatcher.online';
const securityHeadersUrl = 'https://securityheaders.com/?q=www.policywatcher.online&followRedirects=on&hide=on';

const evidenceCards: EvidenceCard[] = [
  {
    title: 'Dataset QA Gate',
    status: 'Local + CI',
    tone: 'green',
    icon: Database,
    body:
      'Checks record count, accepted status values, version-record coverage, SHA-256 consistency, check-log presence, latest status alignment, and scan timestamps.',
    href: '/methodology/confidence',
    linkLabel: 'Methodology boundary',
  },
  {
    title: 'Policy Signals Board',
    status: 'Evidence-only ranking',
    tone: 'blue',
    icon: BarChart3,
    body:
      'Ranks source coverage, retrieval traceability, public baselines, and publicEvidence-gated movement. It does not rank legal compliance or provider trustworthiness.',
    href: '/leaderboard',
    linkLabel: 'Open signals board',
  },
  {
    title: 'Renderer-Backed Retrieval',
    status: 'Confidence hardening',
    tone: 'blue',
    icon: Server,
    body:
      'The scraper can call a separate bearer-protected VPS renderer for script-rendered pages. Initial URLs, browser redirects, and subresource requests are validated against SSRF rules.',
    href: `${repoBase}/tree/main/renderer`,
    linkLabel: 'Open renderer source',
  },
  {
    title: 'State of the Art Report',
    status: 'Repository report',
    tone: 'slate',
    icon: FileSearch,
    body:
      'The repository contains a current platform report covering configured inventory, assurance controls, public assets, deployment notes, known warnings, and next priorities.',
    href: `${repoBase}/blob/main/docs/platform-state-of-art-2026-07-05.md`,
    linkLabel: 'Open report',
  },
  {
    title: 'GitHub Quality Gate',
    status: 'Workflow',
    tone: 'blue',
    icon: GitBranch,
    body:
      'Runs Prisma validation, source-evidence dataset assurance, lint, production build, and high-severity dependency audit before public release changes are merged.',
    href: `${repoBase}/actions/workflows/quality.yml`,
    linkLabel: 'Open workflow',
  },
  {
    title: 'CodeQL Analysis',
    status: 'Static scan',
    tone: 'violet',
    icon: FileSearch,
    body:
      'Scans JavaScript and TypeScript code paths with GitHub security-and-quality queries. Findings remain external to product statements until reviewed.',
    href: `${repoBase}/actions/workflows/codeql.yml`,
    linkLabel: 'Open scan',
  },
  {
    title: 'OpenSSF Scorecard',
    status: 'Supply chain',
    tone: 'amber',
    icon: ShieldCheck,
    body:
      'Reviews repository security posture such as branch protection, dependency update practices, token permissions, pinned actions, and vulnerability reporting.',
    href: scorecardUrl,
    linkLabel: 'Open scorecard',
  },
  {
    title: 'OpenSSF Best Practices',
    status: 'Passing self-attestation',
    tone: 'green',
    icon: CheckCircle2,
    body:
      'OpenSSF Best Practices project 13465 is passing. This is public self-attestation evidence for open-source process hygiene, not a legal or security certification.',
    href: bestPracticesProjectUrl,
    linkLabel: 'Open badge record',
  },
  {
    title: 'SonarQube Cloud',
    status: 'Ready to connect',
    tone: 'blue',
    icon: FileSearch,
    body:
      'A SonarQube Cloud workflow and project configuration are present. The scan activates when the repository has a Sonar project and SONAR_TOKEN secret.',
    href: `${repoBase}/actions/workflows/sonar.yml`,
    linkLabel: 'Open workflow',
  },
  {
    title: 'Codecov Targeted Reliability Coverage',
    status: 'Targeted tests enabled',
    tone: 'violet',
    icon: Activity,
    body:
      'Vitest tracks auth/session handling, rate limiting, confidence metadata, diff parsing, subscriber preferences, and export/report utilities. This is targeted operational coverage, not full UI coverage.',
    href: `${repoBase}/actions/workflows/coverage.yml`,
    linkLabel: 'Open workflow',
  },
  {
    title: 'Admin Review Console',
    status: 'Internal control',
    tone: 'slate',
    icon: Server,
    body:
      'Supports controlled review of companies, monitored source URLs, policy records, cron runs, QA findings, database state, KPI matrix coverage, and evidence telemetry.',
  },
  {
    title: 'MDN HTTP Observatory',
    status: 'Live scan',
    tone: 'amber',
    icon: Lock,
    body:
      'Checks production HTTP security headers and configuration on the deployed domain. The score depends on Hostinger and live response headers.',
    href: mdnObservatoryUrl,
    linkLabel: 'Open scan',
  },
  {
    title: 'SecurityHeaders.com',
    status: 'Live scan',
    tone: 'amber',
    icon: Lock,
    body:
      'Provides a public report for the deployed domain response headers. Use it as live operational evidence, not as a security certification.',
    href: securityHeadersUrl,
    linkLabel: 'Open report',
  },
];

const workflowSteps = [
  {
    title: 'Source configuration',
    detail: 'Provider URL, jurisdiction, policy type, ingestion method, and status are visible as reviewable record fields.',
  },
  {
    title: 'Retrieval and failure logging',
    detail: 'Direct fetch, HTTP/2, optional VPS rendering, and freshness-guarded archives update evidence metadata. Blocked or unavailable pages are recorded without inventing replacement content.',
  },
  {
    title: 'Integrity checks',
    detail: 'The QA script compares hashes, version records, check logs, timestamps, and accepted status values at the policy-record grain.',
  },
  {
    title: 'Release gate',
    detail: 'A release can be promoted only after source-evidence dataset assurance, lint, build, and security scan workflow have passed.',
  },
];

const badges = [
  {
    label: 'Quality Gate',
    href: `${repoBase}/actions/workflows/quality.yml`,
    badge: `${repoBase}/actions/workflows/quality.yml/badge.svg`,
    alt: 'GitHub Actions quality gate status badge',
  },
  {
    label: 'CodeQL',
    href: `${repoBase}/actions/workflows/codeql.yml`,
    badge: `${repoBase}/actions/workflows/codeql.yml/badge.svg`,
    alt: 'CodeQL workflow status badge',
  },
  {
    label: 'Targeted Coverage',
    href: `${repoBase}/actions/workflows/coverage.yml`,
    badge: `${repoBase}/actions/workflows/coverage.yml/badge.svg`,
    alt: 'Targeted reliability coverage workflow status badge',
  },
  {
    label: 'OpenSSF Scorecard',
    href: scorecardUrl,
    badge: 'https://api.scorecard.dev/projects/github.com/sev7enITA/policywatcher/badge',
    alt: 'OpenSSF Scorecard badge',
  },
  {
    label: 'OpenSSF Best Practices',
    href: bestPracticesProjectUrl,
    badge: 'https://www.bestpractices.dev/projects/13465/badge',
    alt: 'OpenSSF Best Practices badge',
  },
];

const badgeHighlights = [
  {
    label: 'OpenSSF Best Practices',
    state: 'Obtained: passing',
    href: bestPracticesProjectUrl,
    badge: 'https://www.bestpractices.dev/projects/13465/badge',
    note: 'External OpenSSF Best Practices self-attestation for project 13465.',
  },
  {
    label: 'OpenSSF Scorecard',
    state: 'Public scorecard',
    href: scorecardUrl,
    badge: 'https://api.scorecard.dev/projects/github.com/sev7enITA/policywatcher/badge',
    note: 'Repository supply-chain posture report generated by OpenSSF Scorecard.',
  },
  {
    label: 'GitHub Quality Gate',
    state: 'CI workflow badge',
    href: `${repoBase}/actions/workflows/quality.yml`,
    badge: `${repoBase}/actions/workflows/quality.yml/badge.svg`,
    note: 'Shows the latest Prisma, dataset QA, lint, build, and audit gate run.',
  },
] as const;

export default function TrustPage() {
  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
          <div className={styles.releaseMark}>{POLICYWATCHER_BUILD_LABEL}</div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>
              <ShieldCheck size={16} />
              Trust & Quality Evidence
            </span>
            <h1>Inspectable controls for dataset confidence.</h1>
            <p>
              This page collects the checks used to assess whether the monitored
              records are consistent enough for public analysis. The badges below
              indicate automated checks or review channels. They are not legal,
              regulatory, or compliance certifications.
            </p>
            <div className={styles.heroActions}>
              <Link href="/methodology/confidence" className={styles.primaryAction}>
                Read methodology
              </Link>
              <Link href="/leaderboard" className={styles.secondaryAction}>
                Open signals board
              </Link>
              <a href={repoBase} className={styles.secondaryAction} target="_blank" rel="noreferrer">
                Open repository
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          <div className={styles.assurancePanel} aria-label="Assurance workflow summary">
            <div className={styles.panelHeader}>
              <Activity size={18} />
              <span>Release gate</span>
            </div>
            <div className={styles.signalStack}>
              {['Prisma schema', 'Source-evidence gate', 'Dataset QA', 'Scraper tests', 'Renderer checks', 'Lint', 'Build', 'High-severity audit'].map((item) => (
                <div key={item} className={styles.signalRow}>
                  <CheckCircle2 size={15} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className={styles.hashPanel}>
              <span>Policy record grain</span>
              <strong>policyId + versionRecord + checkLog</strong>
            </div>
          </div>
        </section>

        <section className={styles.obtainedPanel} aria-labelledby="obtained-badges">
          <div className={styles.obtainedIntro}>
            <span className={styles.sectionEyebrow}>
              <CheckCircle2 size={14} />
              Obtained and visible badges
            </span>
            <h2 id="obtained-badges">Public quality signals that can be inspected.</h2>
            <p>
              The OpenSSF Best Practices badge is already passing. The other
              badges expose public workflow or repository-review evidence and
              should be read as operational signals, not as legal, regulatory,
              or security certifications.
            </p>
          </div>
          <div className={styles.obtainedGrid}>
            {badgeHighlights.map((item) => (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className={styles.obtainedCard}>
                <span className={styles.obtainedState}>{item.state}</span>
                <img src={item.badge} alt={`${item.label} badge`} />
                <strong>{item.label}</strong>
                <p>{item.note}</p>
                <span className={styles.obtainedLink}>
                  Inspect evidence
                  <ExternalLink size={13} />
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className={styles.badgeBand} aria-labelledby="public-badges">
          <div>
            <span className={styles.sectionEyebrow}>Public evidence</span>
            <h2 id="public-badges">Badges and external review points</h2>
          </div>
          <div className={styles.badgeStrip}>
            {badges.map((badge) => (
              <a key={badge.label} href={badge.href} target="_blank" rel="noreferrer" className={styles.badgeLink}>
                <span>{badge.label}</span>
                <img src={badge.badge} alt={badge.alt} />
              </a>
            ))}
          </div>
        </section>

        <section className={styles.evidenceGrid} aria-label="Quality evidence controls">
          {evidenceCards.map(({ title, status, tone, icon: Icon, body, href, linkLabel }) => (
            <article key={title} className={`${styles.evidenceCard} ${styles[tone]}`}>
              <div className={styles.cardTopline}>
                <div className={styles.iconShell}>
                  <Icon size={20} />
                </div>
                <span>{status}</span>
              </div>
              <h2>{title}</h2>
              <p>{body}</p>
              {href && linkLabel ? (
                href.startsWith('http') ? (
                  <a href={href} className={styles.cardLink} target="_blank" rel="noreferrer">
                    {linkLabel}
                    <ExternalLink size={13} />
                  </a>
                ) : (
                  <Link href={href} className={styles.cardLink}>
                    {linkLabel}
                  </Link>
                )
              ) : null}
            </article>
          ))}
        </section>

        <section className={styles.workflowSection} aria-labelledby="qa-workflow">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>
              <GitBranch size={14} />
              Assurance workflow
            </span>
            <h2 id="qa-workflow">From configured source to release decision</h2>
            <p>
              PolicyWatcher treats confidence as an operational state. A record
              may be available, partial, unavailable, or in need of review; the
              UI and the admin tools should expose that state rather than hide it.
            </p>
          </div>

          <div className={styles.workflowRail}>
            {workflowSteps.map((step, index) => (
              <article key={step.title} className={styles.workflowStep}>
                <div className={styles.stepIndex}>{String(index + 1).padStart(2, '0')}</div>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.boundaryPanel}>
          <div>
            <span className={styles.sectionEyebrow}>Evidence scope</span>
            <h2>Operational evidence with clear scope.</h2>
          </div>
          <p>
            PolicyWatcher monitors configured public source URLs, records check
            outcomes, maps policy changes, and produces analytical indicators.
            The platform focuses on observable public texts and QA state. Each
            visible signal is designed to be traceable back to provider sources,
            repository history, or the documented methodology.
          </p>
        </section>
      </main>

      <Footer lang="en" />
    </div>
  );
}
