import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, ExternalLink, FileSearch } from 'lucide-react';
import { notFound } from 'next/navigation';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import {
  getPublicKnowledgePolicy,
  isUuid,
  POLICYWATCHER_ORIGIN,
  serializeJsonLd,
  type PublicKnowledgePolicy,
} from '@/lib/publicKnowledge';
import styles from '../../../../knowledge.module.css';

interface PolicyPageProps { params: Promise<{ slug: string; id: string }> }

function formatDate(value: string | null): string {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value));
}

export async function generateMetadata({ params }: PolicyPageProps): Promise<Metadata> {
  const { slug, id } = await params;
  if (!isUuid(id)) return { title: 'Policy record not found | PolicyWatcher', robots: { index: false } };
  try {
    const policy = await getPublicKnowledgePolicy(slug, id);
    if (!policy) return { title: 'Policy record not found | PolicyWatcher', robots: { index: false } };
    const canonical = `${POLICYWATCHER_ORIGIN}/knowledge/companies/${policy.company.slug}/policies/${policy.id}`;
    return {
      title: `${policy.company.name} ${policy.name} record | PolicyWatcher`,
      description: `Public source, verification timestamps, baseline metadata and published changes for ${policy.company.name} ${policy.name}.`,
      alternates: { canonical },
      openGraph: { title: `${policy.company.name} / ${policy.name}`, description: 'Evidence-gated public policy record with source and baseline metadata.', url: canonical, type: 'article', modifiedTime: policy.dateModified },
    };
  } catch {
    return { title: 'Public policy record temporarily unavailable | PolicyWatcher', robots: { index: false } };
  }
}

export const dynamic = 'force-dynamic';

export default async function PolicyKnowledgePage({ params }: PolicyPageProps) {
  const { slug, id } = await params;
  if (!isUuid(id)) notFound();

  let policy: PublicKnowledgePolicy | null = null;
  let unavailable = false;
  try {
    policy = await getPublicKnowledgePolicy(slug, id);
  } catch (error) {
    unavailable = true;
    console.error('[Knowledge policy] Public policy record temporarily unavailable:', error);
  }
  if (!unavailable && !policy) notFound();

  const canonical = `${POLICYWATCHER_ORIGIN}/knowledge/companies/${slug}/policies/${id}`;
  const jsonLd = policy ? {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#page`,
        url: canonical,
        name: `${policy.company.name} ${policy.name} public record`,
        dateModified: policy.dateModified,
        mainEntity: { '@id': `${canonical}#document` },
        publisher: { '@type': 'Organization', name: 'PolicyWatcher', url: POLICYWATCHER_ORIGIN },
        citation: [`${POLICYWATCHER_ORIGIN}/methodology/confidence`, ...policy.changes.map((change) => `${POLICYWATCHER_ORIGIN}/evidence/${change.id}`)],
      },
      {
        '@type': 'DigitalDocument',
        '@id': `${canonical}#document`,
        name: policy.name,
        url: canonical,
        sameAs: policy.officialSourceUrl || undefined,
        dateModified: policy.dateModified,
        isPartOf: { '@type': 'CollectionPage', url: `${POLICYWATCHER_ORIGIN}/knowledge` },
        about: { '@type': 'Organization', name: policy.company.name },
        description: `Metadata record for the ${policy.name} source published by ${policy.company.name}. Raw policy text is not reproduced.`,
        publisher: { '@type': 'Organization', name: 'PolicyWatcher', url: POLICYWATCHER_ORIGIN },
      },
    ],
  } : null;

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />}
      <PublicHeader current="knowledge" />
      <main className={styles.page}>
        <div className={styles.shell}>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><Link href="/knowledge">Knowledge</Link><span>/</span><Link href={`/knowledge/companies/${slug}`}>{policy?.company.name || 'Company'}</Link><span>/</span><span>{policy?.name || 'Policy record'}</span></nav>
          {policy ? (
            <>
              <header className={styles.entityHeader}>
                <div><p className={styles.kicker}>Public policy record</p><h1>{policy.name}</h1><p className={styles.lead}>{policy.company.name} / {policy.type} / {policy.jurisdiction}. This page presents source and evidence metadata; it does not reproduce the policy text.</p><nav className={styles.actions} aria-label={`${policy.name} source actions`}>{policy.officialSourceUrl && <a href={policy.officialSourceUrl} target="_blank" rel="noopener noreferrer external">Official policy source <ExternalLink size={14} aria-hidden="true" /></a>}<Link href={`/knowledge/companies/${policy.company.slug}`}>Company record</Link></nav></div>
                <dl className={styles.ledger}><div><dt>Data status</dt><dd><span className={styles.status}>{policy.dataStatus}</span></dd></div><div><dt>Ingestion method</dt><dd>{policy.ingestionMethod}</dd></div><div><dt>Last retrieval</dt><dd>{formatDate(policy.lastRetrievedAt)}</dd></div><div><dt>Last check</dt><dd>{formatDate(policy.lastCheckedAt)}</dd></div><div><dt>Latest published baseline</dt><dd>{formatDate(policy.latestBaselineAt)}</dd></div><div><dt>Knowledge record updated</dt><dd>{formatDate(policy.dateModified)}</dd></div><div><dt>Published changes</dt><dd>{policy.publishedChangeCount}</dd></div></dl>
              </header>

              <nav className={styles.entityReferences} aria-label="Evidence and methodology references">
                <strong>Evidence and methodology</strong>
                <Link href="/methodology/confidence">Publication methodology</Link>
                <Link href="/evidence">Public evidence register</Link>
              </nav>

              <section className={styles.section} aria-labelledby="baselines-title">
                <div className={styles.sectionHead}><div><p className={styles.kicker}>Published evidence</p><h2 id="baselines-title">Baseline metadata</h2></div><p>Hashes identify published baseline records. They do not expose the underlying raw source text.</p></div>
                {policy.baselines.length === 0 ? <div className={styles.notice} role="status"><FileSearch size={22} aria-hidden="true" /><div><h3>No published baseline metadata available</h3><p>This state should not occur for a public policy record and requires review.</p></div></div> : <ol className={styles.baselineList}>{policy.baselines.map((baseline) => <li key={`${baseline.version}-${baseline.hash}`}><strong>Version {baseline.version}</strong><span>{formatDate(baseline.publishedAt)}</span><code className={styles.hash}>{baseline.hash}</code></li>)}</ol>}
              </section>

              <section className={styles.section} aria-labelledby="changes-title">
                <div className={styles.sectionHead}><div><p className={styles.kicker}>Published change register</p><h2 id="changes-title">Linked changes and evidence</h2></div><p>Each change links to its citable public record and change-bound evidence packet. Screening labels are not legal conclusions.</p></div>
                {policy.changes.length === 0 ? <div className={styles.notice} role="status"><FileSearch size={22} aria-hidden="true" /><div><h3>No published changes for this policy</h3><p>A verified source baseline is available, but no later public change record has been published.</p></div></div> : <ol className={styles.changeList}>{policy.changes.map((change) => <li key={change.id} className={styles.changeRow}><div className={styles.changeMeta}><span>Published</span><time dateTime={change.publishedAt}>{formatDate(change.publishedAt)}</time><span className={styles.riskLabel}>Screening: {change.overallRisk}</span></div><div><h3><Link href={`/change/${change.id}`}>{policy.company.name} / {policy.name}</Link></h3><p>{change.summary}</p></div><Link className={styles.openLink} href={`/evidence/${change.id}`}>Evidence packet <ArrowRight size={14} aria-hidden="true" /></Link></li>)}</ol>}
              </section>
            </>
          ) : (
            <section className={styles.section} aria-labelledby="unavailable-title"><div className={styles.notice} role="status"><AlertTriangle size={22} aria-hidden="true" /><div><h2 id="unavailable-title">Policy record temporarily unavailable</h2><p>The public database could not be read. No internal connection or storage details are exposed.</p><Link href="/knowledge">Return to the knowledge index</Link></div></div></section>
          )}
        </div>
      </main>
      <Footer lang="en" variant="compact" />
    </>
  );
}
