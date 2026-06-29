/**
 * Public Change Permalink — /change/[id]
 *
 * The citable, SEO-friendly permalink for a single PolicyChange.
 * This is the "moat" asset: every policy change gets a stable URL that can
 * be cited in articles, judgments, academic papers.
 *
 * Design (mirrors /share/[id] conventions):
 *   - Server component (no client JS for core content) → fast + SEO.
 *   - `generateMetadata` returns OG/Twitter tags for social cards.
 *   - `lang` is a query-string param (?lang=en|it), default 'en'.
 *   - `id` validated as UUID before the DB query (rejects junk fast).
 *   - ISR via `revalidate = 60` (M2c) protects against cache-busting.
 *
 * SECURITY: every piece of change content (diff, summaries, region impacts)
 * is rendered via React text interpolation {value} — NEVER via
 * dangerouslySetInnerHTML. The diff text originates from scraped upstream
 * policy pages and is treated as untrusted.
 */
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import {
  ShieldAlert,
  TrendingUp,
  Globe,
  FileDown,
  ExternalLink,
  AlertTriangle,
  ArrowLeft,
  Clock,
} from 'lucide-react';
import DiffViewer from '@/components/DiffViewer';
import AISummary from '@/components/ai/AISummary';
import RiskReasons from '@/components/ai/RiskReasons';
import EmbedModal from '@/components/EmbedModal';
import styles from './change.module.css';
import type { Metadata } from 'next';

const UUID_RE = /^[a-f0-9-]{36}$/i;

function toSafeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

interface ChangePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}

/* ------------------------------------------------------------------ */
/* Metadata (SEO + social cards)                                       */
/* ------------------------------------------------------------------ */

export async function generateMetadata({
  params,
}: ChangePageProps): Promise<Metadata> {
  const { id } = await params;

  // UUID guard: don't even hit the DB on junk
  if (!UUID_RE.test(id)) return { title: 'PolicyWatcher — Not found' };

  const change = await db.policyChange.findUnique({
    where: { id },
    select: {
      overallRisk: true,
      overallScore: true,
      tldrEn: true,
      tldrIt: true,
      aiSummaryEn: true,
      createdAt: true,
      policy: { select: { name: true, company: { select: { name: true } } } },
    },
  });

  if (!change) return { title: 'PolicyWatcher — Not found' };

  const title = `${change.policy.company.name} — Policy Change`;
  const description =
    change.tldrEn ||
    change.aiSummaryEn?.split('.')[0] + '.' ||
    `Policy risk assessment for ${change.policy.company.name} ${change.policy.name}`;
  // Canonical + alternates (EN default, IT alternate). hreflang signals to
  // search engines that this is a bilingual permalink (avoids duplicate-
  // content penalty). Next maps alternates.languages → <link hreflang>.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://www.policywatcher.online';

  return {
    title: `${title} | PolicyWatcher`,
    description: description.substring(0, 160),
    alternates: {
      canonical: `${baseUrl}/change/${id}?lang=en`,
      languages: {
        en: `${baseUrl}/change/${id}?lang=en`,
        it: `${baseUrl}/change/${id}?lang=it`,
        'x-default': `${baseUrl}/change/${id}?lang=en`,
      },
    },
    openGraph: {
      title,
      description: description.substring(0, 160),
      type: 'article',
      publishedTime: change.createdAt.toISOString(),
      // OG image wired in M2d (dynamic via /api/og/change/[id])
      images: [
        {
          url: `${baseUrl}/api/og/change/${id}`,
          width: 1200,
          height: 630,
          alt: `${change.policy.company.name} — Risk ${change.overallScore}/10`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description.substring(0, 160),
      images: [`${baseUrl}/api/og/change/${id}`],
    },
    other: {
      'article:published_time': change.createdAt.toISOString(),
      'article:section': 'Policy Analysis',
      'article:tag': change.overallRisk,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default async function ChangePage({
  params,
  searchParams,
}: ChangePageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const lang = sp.lang === 'it' ? 'it' : 'en';
  const isIt = lang === 'it';

  // UUID guard — fast 404 on junk (no DB hit, no log noise)
  if (!UUID_RE.test(id)) {
    notFound();
  }

  const change = await db.policyChange.findUnique({
    where: { id },
    include: {
      policy: {
        select: {
          id: true,
          name: true,
          type: true,
          url: true,
          jurisdiction: true,
          company: {
            select: {
              id: true,
              name: true,
              industry: true,
              logo: true,
              slug: true,
              website: true,
            },
          },
        },
      },
      regionImpacts: true,
      oldSnapshot: { select: { version: true, createdAt: true } },
      newSnapshot: { select: { version: true, createdAt: true } },
    },
  });

  if (!change) {
    notFound();
  }

  const score = change.overallScore;
  const risk = change.overallRisk;
  const screeningDate = change.createdAt.toISOString().split('T')[0];
  const scoreColor =
    score >= 7 ? 'var(--risk-high)' : score >= 4 ? 'var(--risk-medium)' : 'var(--risk-low)';

  const t = {
    backHome: isIt ? '← Tutti i cambiamenti' : '← All changes',
    badge: isIt ? 'CAMBIAMENTO REGISTRATO' : 'RECORDED CHANGE',
    screening: isIt ? 'Data screening' : 'Screening date',
    riskLevel: isIt ? 'Livello rischio' : 'Risk level',
    policy: isIt ? 'Policy' : 'Policy',
    jurisdiction: isIt ? 'Giurisdizione' : 'Jurisdiction',
    version: isIt ? 'Versione' : 'Version',
    aiSummaryTitle: isIt ? 'Analisi AI' : 'AI Analysis',
    diffTitle: isIt ? 'Cosa è cambiato' : 'What changed',
    regionsTitle: isIt ? 'Impatto regionale' : 'Regional impact',
    download: isIt ? 'Scarica PDF' : 'Download PDF',
    official: isIt ? 'Sito ufficiale' : 'Official site',
    embed: isIt ? 'Embed' : 'Embed',
    dashboard: isIt ? 'Apri in dashboard' : 'Open in dashboard',
    disclaimerTitle: isIt ? 'Disclaimer' : 'Disclaimer',
    disclaimer:
      'ALPHA RELEASE — Automated AI assessment of publicly available policy texts. Not legal advice. Not a compliance certification. Always consult official sources and qualified legal counsel.',
    high: isIt ? 'Alto' : 'High',
    medium: isIt ? 'Medio' : 'Medium',
    low: isIt ? 'Basso' : 'Low',
    langToggle: isIt ? 'English' : 'Italiano',
  };

  const riskLabel = risk === 'High' ? t.high : risk === 'Medium' ? t.medium : t.low;
  const tldr = isIt ? change.tldrIt || change.aiSummaryIt : change.tldrEn || change.aiSummaryEn;

  // Regional impacts (Individual perspective, like the share page)
  const regions = (['EU', 'US', 'Global'] as const).map((region) => ({
    region,
    impact: change.regionImpacts.find((i) => i.region === region && i.perspective === 'Individual'),
  }));

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://www.policywatcher.online';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${change.policy.company.name} — ${change.policy.name} Policy Change`,
    datePublished: change.createdAt.toISOString(),
    author: { '@type': 'Organization', name: 'PolicyWatcher', url: baseUrl },
    publisher: { '@type': 'Organization', name: 'PolicyWatcher', url: baseUrl },
    description: tldr || '',
    url: `${baseUrl}/change/${id}`,
    image: `${baseUrl}/api/og/change/${id}`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: score,
      bestRating: 10,
      worstRating: 1,
      ratingCount: 1,
      reviewCount: 1,
    },
    about: {
      '@type': 'Thing',
      name: `${change.policy.company.name} ${change.policy.name}`,
    },
  };

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toSafeJsonLd(jsonLd) }}
      />
      <div className={styles.container}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <Link href="/timeline" className={styles.backLink}>
            <ArrowLeft size={14} />
            {t.backHome}
          </Link>
          <div className={styles.langLinks}>
            <a
              href={`/change/${id}?lang=en`}
              className={lang === 'en' ? styles.langActive : styles.lang}
            >
              EN
            </a>
            <span className={styles.langSep}>·</span>
            <a
              href={`/change/${id}?lang=it`}
              className={lang === 'it' ? styles.langActive : styles.lang}
            >
              IT
            </a>
          </div>
        </div>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>{t.badge}</span>
            <span className={styles.dateChip}>
              <Clock size={11} />
              {screeningDate}
            </span>
          </div>
          <h1 className={styles.companyName}>{change.policy.company.name}</h1>
          <p className={styles.policyName}>
            {change.policy.name}
            <span className={styles.policyType}>{change.policy.type}</span>
          </p>
        </header>

        {/* Score + meta row */}
        <div className={styles.scoreCard}>
          <div className={styles.scoreNumber} style={{ color: scoreColor }}>
            {score}
            <span className={styles.scoreSlash}>/10</span>
          </div>
          <div className={styles.scoreInfo}>
            <div className={styles.scoreLabel} style={{ color: scoreColor }}>
              {t.riskLevel}: {riskLabel}
            </div>
            <div className={styles.scoreBar}>
              <div
                className={styles.scoreBarFill}
                style={{ width: `${(score / 10) * 100}%`, background: scoreColor }}
              />
            </div>
          </div>
        </div>

        {/* TL;DR */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <TrendingUp size={14} /> {isIt ? 'Sintesi' : 'Summary'}
          </h2>
          <p className={styles.tldr}>{tldr}</p>
        </section>

        {/* AI Analysis (structured TL;DR + key points + risk reasons) */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <ShieldAlert size={14} /> {t.aiSummaryTitle}
          </h2>
          <AISummary
            tldrEn={change.tldrEn}
            tldrIt={change.tldrIt}
            keyPointsJson={change.keyPointsJson}
            legacySummaryEn={change.aiSummaryEn}
            legacySummaryIt={change.aiSummaryIt}
            lang={lang}
          />
          <div style={{ marginTop: '14px' }}>
            <RiskReasons riskReasonsJson={change.riskReasonsJson} lang={lang} />
          </div>
        </section>

        {/* What changed (diff) */}
        <section className={styles.section}>
          <DiffViewer diff={change.diff} lang={lang} title={t.diffTitle} maxHeight="500px" />
        </section>

        {/* Regional impact */}
        {regions.some((r) => r.impact) && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Globe size={14} /> {t.regionsTitle}
            </h2>
            <div className={styles.regionGrid}>
              {regions.map(
                (r, i) =>
                  r.impact && (
                    <div key={i} className={styles.regionCard}>
                      <div className={styles.regionHead}>
                        <strong>{r.region}</strong>
                        <span
                          className={styles.regionBadge}
                          data-level={r.impact.riskLevel}
                        >
                          {r.impact.riskLevel}
                        </span>
                      </div>
                      <p className={styles.regionText}>
                        {(isIt ? r.impact.impactAnalysisIt : r.impact.impactAnalysisEn).substring(
                          0,
                          220
                        )}
                      </p>
                    </div>
                  )
              )}
            </div>
          </section>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <a
            href={`/api/report/${change.policy.id}?lang=${lang}`}
            target="_blank"
            rel="noreferrer"
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            <FileDown size={15} />
            {t.download}
          </a>
          <EmbedModal changeId={id} companyName={change.policy.company.name} />
          {change.policy.url && (
            <a
              href={change.policy.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.btn} ${styles.btnGhost}`}
            >
              <ExternalLink size={15} />
              {t.official}
            </a>
          )}
        </div>

        {/* Disclaimer */}
        <footer className={styles.footer}>
          <div className={styles.disclaimerTitle}>
            <AlertTriangle size={12} />
            {t.disclaimerTitle}
          </div>
          <p>{t.disclaimer}</p>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} PolicyWatcher —{' '}
            {isIt ? 'Civic Tech per la trasparenza' : 'Civic Tech for transparency'}
          </p>
        </footer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ISR — protect against cache-busting with random valid UUIDs (M2c)   */
/* The route is statically rendered at build for known ids and revalid-*/
/* at most every 60s. Unknown ids hit notFound() in O(1).              */
/* ------------------------------------------------------------------ */
export const revalidate = 60;
