/**
 * Public share page: a frozen, read-only snapshot of a policy analysis.
 *
 * URL: /share/[policyId]?lang=en|it
 *
 * Renders the LATEST STORED analysis (no live re-scrape, no fabrication).
 * Designed for sharing on social / LinkedIn / email: it shows the score,
 * TL;DR, key points, reasons, and regional impact, plus a "Download PDF"
 * link and the legal disclaimer.
 *
 * Server component: fetches data at request time, no client JS needed
 * for the core content (good for SEO + link previews).
 */
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { ShieldAlert, TrendingUp, Globe, FileDown, ExternalLink, AlertTriangle } from 'lucide-react';
import styles from './share.module.css';
import type { Metadata } from 'next';

interface SharePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}

interface KeyPoint {
  textEn: string;
  textIt: string;
  sentiment: string;
}

interface RiskReason {
  textEn: string;
  textIt: string;
  icon: string;
  deltaScore: number;
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { id } = await params;
  const policy = await db.policy.findUnique({
    where: { id },
    include: { company: true, changes: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });

  if (!policy) return { title: 'PolicyWatcher: Not found' };

  const change = policy.changes[0];
  const title = `${policy.company.name}: Risk ${change ? `${change.overallScore}/10` : 'N/A'}`;
  const description =
    change?.tldrEn ||
    `Policy risk assessment for ${policy.company.name} ${policy.name}`;

  return {
    title: `${title} | PolicyWatcher`,
    description: description.substring(0, 160),
    openGraph: {
      title,
      description: description.substring(0, 160),
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title,
      description: description.substring(0, 160),
    },
  };
}

export default async function SharePage({ params, searchParams }: SharePageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const lang = sp.lang === 'it' ? 'it' : 'en';
  const isIt = lang === 'it';

  const policy = await db.policy.findUnique({
    where: { id },
    include: {
      company: true,
      changes: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { regionImpacts: true },
      },
    },
  });

  if (!policy || !policy.changes[0]) {
    notFound();
  }

  const change = policy.changes[0];
  const score = change.overallScore;
  const risk = change.overallRisk;
  const screeningDate = change.createdAt.toISOString().split('T')[0];

  const tldr = isIt ? change.tldrIt || change.aiSummaryIt : change.tldrEn || change.aiSummaryEn;

  let keyPoints: KeyPoint[] = [];
  let reasons: RiskReason[] = [];
  try {
    keyPoints = change.keyPointsJson ? JSON.parse(change.keyPointsJson) as KeyPoint[] : [];
  } catch {}
  try {
    reasons = change.riskReasonsJson ? JSON.parse(change.riskReasonsJson) as RiskReason[] : [];
  } catch {}

  type RegionImpact = (typeof change.regionImpacts)[number];
  const regions = ['EU', 'US', 'Global'].map((r: string) => ({
    region: r,
    impact: change.regionImpacts.find((i) => i.region === r && i.perspective === 'Individual'),
  })) satisfies Array<{ region: string; impact: RegionImpact | undefined }>;

  const scoreColor =
    score >= 7 ? 'var(--risk-high)' : score >= 4 ? 'var(--risk-medium)' : 'var(--risk-low)';

  const L = {
    brand: 'PolicyWatcher',
    tag: isIt ? 'INTELLIGENCE NORMATIVA' : 'REGULATORY INTELLIGENCE',
    badge: isIt ? 'ANALISI PUBBLICA' : 'PUBLIC ANALYSIS',
    execReport: isIt ? 'REPORT ESECUTIVO' : 'EXECUTIVE REPORT',
    riskLevel: isIt ? 'Livello Rischio' : 'Risk Level',
    tldrTitle: isIt ? 'Sintesi' : 'Summary',
    keyPointsTitle: isIt ? 'Punti Chiave' : 'Key Points',
    reasonsTitle: isIt ? 'Perché Questo Punteggio' : 'Why This Score',
    regionsTitle: isIt ? 'Impatto Regionale' : 'Regional Impact',
    download: isIt ? 'Scarica PDF' : 'Download PDF',
    official: isIt ? 'Visita il sito ufficiale' : 'Visit official site',
    screening: isIt ? 'Screening' : 'Screening',
    disclaimerTitle: isIt ? 'Disclaimer' : 'Disclaimer',
    disclaimer:
      'BETA RELEASE: Automated AI assessment of publicly available policy texts. Not legal advice. Not a compliance certification. Always consult official sources and qualified legal counsel.',
    backHome: isIt ? 'Esplora altre aziende →' : 'Explore more companies →',
    high: isIt ? 'Alto' : 'High',
    medium: isIt ? 'Medio' : 'Medium',
    low: isIt ? 'Basso' : 'Low',
  };

  const riskLabel = risk === 'High' ? L.high : risk === 'Medium' ? L.medium : L.low;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <div className={styles.brandBlock}>
            <span className={styles.brandText}>PolicyWatcher</span>
            <span className={styles.brandTag}>{L.tag}</span>
          </div>
          <div className={styles.langLinks}>
            <Link
              href={`/share/${id}?lang=en`}
              className={lang === 'en' ? styles.langActive : styles.lang}
            >
              EN
            </Link>
            <span className={styles.langSep}>·</span>
            <Link
              href={`/share/${id}?lang=it`}
              className={lang === 'it' ? styles.langActive : styles.lang}
            >
              IT
            </Link>
          </div>
        </div>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.badge}>{L.badge}</div>
          <h1 className={styles.companyName}>{policy.company.name}</h1>
          <p className={styles.policyName}>{policy.name}</p>
          <div className={styles.meta}>
            <span>
              {L.screening}: <strong>{screeningDate}</strong>
            </span>
            <span>
              {L.riskLevel}: <strong style={{ color: scoreColor }}>{riskLabel}</strong>
            </span>
          </div>
        </header>

        {/* Score */}
        <div className={styles.scoreCard}>
          <div className={styles.scoreNumber} style={{ color: scoreColor }}>
            {score}
            <span className={styles.scoreSlash}>/10</span>
          </div>
          <div className={styles.scoreInfo}>
            <div className={styles.scoreLabel} style={{ color: scoreColor }}>
              {riskLabel}
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
            <TrendingUp size={14} /> {L.tldrTitle}
          </h2>
          <p className={styles.tldr}>{tldr}</p>
        </section>

        {/* Key points */}
        {keyPoints.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{L.keyPointsTitle}</h2>
            <ul className={styles.points}>
              {keyPoints.slice(0, 5).map((p, i) => (
                <li
                  key={i}
                  className={`${styles.point} ${styles[`s_${p.sentiment}`]}`}
                >
                  <span className={styles.pointDot} data-sentiment={p.sentiment} />
                  <span>{isIt ? p.textIt : p.textEn}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Reasons */}
        {reasons.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <ShieldAlert size={14} /> {L.reasonsTitle}
            </h2>
            <div className={styles.reasons}>
              {reasons.slice(0, 3).map((r, i) => (
                <div key={i} className={`${styles.reason} ${styles[`i_${r.icon}`]}`}>
                  <span className={styles.reasonDelta}>
                    {r.deltaScore > 0 ? `+${r.deltaScore}` : r.deltaScore}
                  </span>
                  <span>{isIt ? r.textIt : r.textEn}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Regions */}
        {regions.some((r) => r.impact) && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Globe size={14} /> {L.regionsTitle}
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
                          200
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
            href={`/api/report/${id}?lang=${lang}`}
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            <FileDown size={15} />
            {L.download}
          </a>
          {policy.url && (
            <a
              href={policy.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.btn} ${styles.btnGhost}`}
            >
              <ExternalLink size={15} />
              {L.official}
            </a>
          )}
          <Link href="/" className={`${styles.btn} ${styles.btnGhost}`}>
            {L.backHome}
          </Link>
        </div>

        {/* Disclaimer */}
        <footer className={styles.footer}>
          <div className={styles.disclaimerTitle}>
            <AlertTriangle size={12} />
            {L.disclaimerTitle}
          </div>
          <p>{L.disclaimer}</p>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} PolicyWatcher | {L.brand}
          </p>
        </footer>
      </div>
    </div>
  );
}
