/**
 * Embed Widget — /embed/change/[id]
 *
 * A compact, dark-themed card that journalists and bloggers can embed
 * via an iframe in their articles. Shows company name, risk score,
 * TL;DR, and a "View full analysis" link that breaks out of the iframe.
 *
 * Server component — no client JS for core content (fast, lightweight).
 *
 * Security:
 *  - All text rendered via React interpolation {value}, never dangerouslySetInnerHTML.
 *  - UUID validated before DB query.
 *  - robots: noindex (set in layout.tsx — canonical is /change/[id]).
 *  - The "View full analysis" link uses target="_top" to navigate the parent frame.
 *
 * The CSP headers in next.config.ts already allow /embed/* to be framed
 * (X-Frame-Options: ALLOWALL, frame-ancestors *).
 */
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { ArrowUpRight } from 'lucide-react';
import styles from './embed.module.css';
import type { Metadata } from 'next';

const UUID_RE = /^[a-f0-9-]{36}$/i;

interface EmbedPageProps {
  params: Promise<{ id: string }>;
}

/* Metadata — noindex (canonical is /change/[id]) */
export async function generateMetadata({ params }: EmbedPageProps): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: 'PolicyWatcher Embed' };

  const change = await db.policyChange.findUnique({
    where: { id },
    select: {
      policy: { select: { name: true, company: { select: { name: true } } } },
    },
  });

  if (!change) return { title: 'PolicyWatcher Embed' };

  return {
    title: `${change.policy.company.name} — ${change.policy.name} | PolicyWatcher`,
    robots: { index: false, follow: false },
  };
}

/* Page */
export default async function EmbedPage({ params }: EmbedPageProps) {
  const { id } = await params;

  // UUID guard
  if (!UUID_RE.test(id)) {
    notFound();
  }

  const change = await db.policyChange.findUnique({
    where: { id },
    select: {
      overallRisk: true,
      overallScore: true,
      tldrEn: true,
      aiSummaryEn: true,
      createdAt: true,
      policy: {
        select: {
          name: true,
          type: true,
          company: {
            select: {
              name: true,
              industry: true,
              logo: true,
            },
          },
        },
      },
    },
  });

  if (!change) {
    notFound();
  }

  const score = change.overallScore;
  const risk = change.overallRisk;
  const company = change.policy.company;
  const logoColor = company.logo || '#6366f1';
  const initials = company.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const tldr =
    change.tldrEn ||
    change.aiSummaryEn?.substring(0, 200) ||
    'Policy change detected.';
  const date = change.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const scoreColor =
    score >= 7 ? '#ef4444' : score >= 4 ? '#f59e0b' : '#10b981';

  return (
    <div className={styles.widget}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandDot} />
          PolicyWatcher
        </div>
        <span className={styles.date}>{date}</span>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <div className={styles.companyRow}>
          <div className={styles.companyInfo}>
            <div className={styles.logo} style={{ background: logoColor }}>
              {initials}
            </div>
            <div>
              <div className={styles.companyName}>{company.name}</div>
              <div className={styles.policyName}>
                {change.policy.name} · {change.policy.type}
              </div>
            </div>
          </div>
          <div className={styles.scoreBlock}>
            <span className={styles.scoreNum} style={{ color: scoreColor }}>
              {score}/10
            </span>
            <span className={styles.scoreLabel} data-risk={risk}>
              {risk}
            </span>
          </div>
        </div>

        <p className={styles.tldr}>{tldr}</p>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <a
          href={`/change/${id}`}
          target="_top"
          rel="noopener"
          className={styles.cta}
        >
          View full analysis
          <ArrowUpRight size={13} />
        </a>
        <span className={styles.powered}>policywatcher.online</span>
      </div>
    </div>
  );
}

export const revalidate = 120;
