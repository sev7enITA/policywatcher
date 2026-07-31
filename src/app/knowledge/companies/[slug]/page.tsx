import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, ExternalLink, FileSearch } from 'lucide-react';
import { notFound } from 'next/navigation';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import {
  getPublicKnowledgeCompany,
  POLICYWATCHER_ORIGIN,
  serializeJsonLd,
  type PublicKnowledgeCompany,
} from '@/lib/publicKnowledge';
import styles from '../../knowledge.module.css';

interface CompanyPageProps { params: Promise<{ slug: string }> }

function formatDate(value: string | null): string {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value));
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const company = await getPublicKnowledgeCompany(slug);
    if (!company) return { title: 'Company record not found | PolicyWatcher', robots: { index: false } };
    const canonical = `${POLICYWATCHER_ORIGIN}/knowledge/companies/${company.slug}`;
    return {
      title: `${company.name} public policy record | PolicyWatcher`,
      description: `Evidence-gated index of ${company.publicPolicyCount} public ${company.name} policy records monitored by PolicyWatcher.`,
      alternates: { canonical },
      openGraph: { title: `${company.name} public policy record`, description: `Public policy sources, verification timestamps and published changes for ${company.name}.`, url: canonical, type: 'website' },
    };
  } catch {
    return { title: 'Public company record temporarily unavailable | PolicyWatcher', robots: { index: false } };
  }
}

export const dynamic = 'force-dynamic';

export default async function CompanyKnowledgePage({ params }: CompanyPageProps) {
  const { slug } = await params;
  let company: PublicKnowledgeCompany | null = null;
  let unavailable = false;
  try {
    company = await getPublicKnowledgeCompany(slug);
  } catch (error) {
    unavailable = true;
    console.error('[Knowledge company] Public company record temporarily unavailable:', error);
  }
  if (!unavailable && !company) notFound();

  const canonical = `${POLICYWATCHER_ORIGIN}/knowledge/companies/${slug}`;
  const jsonLd = company ? {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#page`,
        url: canonical,
        name: `${company.name} public policy record`,
        dateModified: company.dateModified,
        mainEntity: { '@id': `${canonical}#organization` },
        publisher: { '@type': 'Organization', name: 'PolicyWatcher', url: POLICYWATCHER_ORIGIN },
        citation: [`${POLICYWATCHER_ORIGIN}/methodology/confidence`, `${POLICYWATCHER_ORIGIN}/evidence`],
      },
      {
        '@type': 'Organization',
        '@id': `${canonical}#organization`,
        name: company.name,
        url: company.officialWebsiteUrl || undefined,
        sameAs: company.officialWebsiteUrl ? [company.officialWebsiteUrl] : undefined,
        description: `${company.name} is represented here as the monitored entity for ${company.publicPolicyCount} evidence-gated public policy records.`,
      },
    ],
  } : null;

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />}
      <PublicHeader current="knowledge" />
      <main className={styles.page}>
        <div className={styles.shell}>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><Link href="/knowledge">Knowledge</Link><span>/</span><span>{company?.name || 'Company record'}</span></nav>
          {company ? (
            <>
              <header className={styles.entityHeader}>
                <div><p className={styles.kicker}>Monitored company / public record</p><h1>{company.name}</h1><p className={styles.lead}>{company.industry}. This page lists only the company policy records that pass the PolicyWatcher public-evidence gate.</p><nav className={styles.actions} aria-label={`${company.name} record actions`}><a href="#policies">View public policies <ArrowRight size={15} aria-hidden="true" /></a>{company.officialWebsiteUrl && <a href={company.officialWebsiteUrl} target="_blank" rel="noopener noreferrer external">Official company website <ExternalLink size={14} aria-hidden="true" /></a>}</nav></div>
                <dl className={styles.ledger}><div><dt>Public policies</dt><dd>{company.publicPolicyCount}</dd></div><div><dt>Industry</dt><dd>{company.industry}</dd></div><div><dt>Last observed</dt><dd>{formatDate(company.lastObservedAt)}</dd></div><div><dt>Knowledge record updated</dt><dd>{formatDate(company.dateModified)}</dd></div><div><dt>Publication state</dt><dd><span className={styles.status}>Evidence-gated public</span></dd></div></dl>
              </header>

              <nav className={styles.entityReferences} aria-label="Evidence and methodology references">
                <strong>Evidence and methodology</strong>
                <Link href="/methodology/confidence">Publication methodology</Link>
                <Link href="/evidence">Public evidence register</Link>
              </nav>

              <section id="policies" className={styles.section} aria-labelledby="policies-title">
                <div className={styles.sectionHead}><div><p className={styles.kicker}>Policy index</p><h2 id="policies-title">Published policy records</h2></div><p>Source URLs point to the official provider location. PolicyWatcher exposes metadata and published evidence, not copied raw policy text.</p></div>
                <ol className={styles.indexList}>{company.policies.map((policy) => <li key={policy.id} className={styles.indexRow}><div className={styles.indexIdentity}><h3>{policy.name}</h3><p>{policy.type} / {policy.jurisdiction}</p></div><div className={styles.indexMeta}><dl><div><dt>Status</dt><dd>{policy.dataStatus}</dd></div><div><dt>Latest baseline</dt><dd>{formatDate(policy.latestBaselineAt)}</dd></div><div><dt>Published changes</dt><dd>{policy.publishedChangeCount}</dd></div></dl></div><Link className={styles.openLink} href={`/knowledge/companies/${company.slug}/policies/${policy.id}`}>Open policy record <ArrowRight size={14} aria-hidden="true" /></Link></li>)}</ol>
              </section>

              <section className={styles.section} aria-labelledby="changes-title">
                <div className={styles.sectionHead}><div><p className={styles.kicker}>Publication register</p><h2 id="changes-title">Recent published changes</h2></div><p>Risk labels are AI-assisted screening outputs, not legal or compliance conclusions.</p></div>
                {company.recentChanges.length === 0 ? <div className={styles.notice} role="status"><FileSearch size={22} aria-hidden="true" /><div><h3>No published changes for this company</h3><p>Public baselines can be available before a later verified change is recorded.</p></div></div> : <ol className={styles.changeList}>{company.recentChanges.map((change) => <li key={change.id} className={styles.changeRow}><div className={styles.changeMeta}><span>Published</span><time dateTime={change.publishedAt}>{formatDate(change.publishedAt)}</time><span className={styles.riskLabel}>Screening: {change.overallRisk}</span></div><div><h3><Link href={`/change/${change.id}`}>{change.policy.name}</Link></h3><p>{change.summary}</p></div><Link className={styles.openLink} href={`/evidence/${change.id}`}>Evidence packet <ArrowRight size={14} aria-hidden="true" /></Link></li>)}</ol>}
              </section>
            </>
          ) : (
            <section className={styles.section} aria-labelledby="unavailable-title"><div className={styles.notice} role="status"><AlertTriangle size={22} aria-hidden="true" /><div><h2 id="unavailable-title">Company record temporarily unavailable</h2><p>The public database could not be read. No internal connection or storage details are exposed.</p><Link href="/knowledge">Return to the knowledge index</Link></div></div></section>
          )}
        </div>
      </main>
      <Footer lang="en" variant="compact" />
    </>
  );
}
