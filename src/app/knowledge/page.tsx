import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, FileSearch } from 'lucide-react';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import {
  getPublicKnowledgeHub,
  POLICYWATCHER_ORIGIN,
  serializeJsonLd,
  type PublicKnowledgeHub,
} from '@/lib/publicKnowledge';
import styles from './knowledge.module.css';

export const metadata: Metadata = {
  title: 'Public policy records | PolicyWatcher',
  description: 'Evidence-gated index of public companies, policies, verified baselines and published policy changes recorded by PolicyWatcher.',
  alternates: { canonical: `${POLICYWATCHER_ORIGIN}/knowledge` },
};

export const dynamic = 'force-dynamic';

const references = [
  { href: '/evidence', title: 'Evidence packets', body: 'Change-bound public provenance and downloadable evidence files.' },
  { href: '/methodology/confidence', title: 'Methodology', body: 'Publication gates, confidence boundaries and AI-analysis limits.' },
  { href: '/trust', title: 'Trust and Dataset QA', body: 'Quality controls and operational evidence available for inspection.' },
  { href: '/developers', title: 'Developer access', body: 'Read-only public endpoints and integration boundaries.' },
  { href: '/pulse', title: 'Editorial Pulse', body: 'Verified editorial leads linked to published evidence.' },
  { href: '/observatory', title: 'Observatory', body: 'Curated authoritative sources for policy and governance research.' },
  { href: '/press-kit/data', title: 'Press Data Room', body: 'Dated editorial snapshots, formats and citation guidance.' },
  { href: '/llms.txt', title: 'Machine guidance', body: 'Concise crawler scope, citation rules and public access points.' },
] as const;

function formatDate(value: string | null): string {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value));
}

function HubContent({ data }: { data: PublicKnowledgeHub }) {
  if (data.availability === 'empty') {
    return (
      <section id="inventory" className={styles.section} aria-labelledby="inventory-title">
        <div className={styles.sectionHead}>
          <div><p className={styles.kicker}>Verified public inventory</p><h2 id="inventory-title">No records currently pass the publication gate</h2></div>
          <p>This is an empty publication state, not a healthy-data claim. Configured or withheld records are not included in these counts.</p>
        </div>
        <ul className={styles.counts} aria-label="Empty public knowledge inventory counts">
          <li><strong>0</strong><span>companies with public policies</span></li>
          <li><strong>0</strong><span>public policies</span></li>
          <li><strong>0</strong><span>published baselines</span></li>
          <li><strong>0</strong><span>published changes</span></li>
        </ul>
        <div className={styles.notice} role="status">
          <FileSearch size={22} aria-hidden="true" />
          <div><h3>Public inventory unavailable until evidence is verified</h3><p>Companies and policies appear here only after a non-seeded source retrieval and a public evidence baseline satisfy the shared publication gate.</p><Link href="/methodology/confidence">Read the publication methodology</Link></div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="inventory" className={styles.section} aria-labelledby="inventory-title">
        <div className={styles.sectionHead}>
          <div><p className={styles.kicker}>Verified public inventory</p><h2 id="inventory-title">Records currently available for public inspection</h2></div>
          <p>Counts include only records that pass the same public-evidence gates used by PolicyWatcher public data services. They are inventory measures, not coverage or compliance ratings.</p>
        </div>
        <ul className={styles.counts} aria-label="Public knowledge inventory counts">
          <li><strong>{data.counts.companies}</strong><span>companies with public policies</span></li>
          <li><strong>{data.counts.policies}</strong><span>public policies</span></li>
          <li><strong>{data.counts.baselines}</strong><span>published baselines</span></li>
          <li><strong>{data.counts.changes}</strong><span>published changes</span></li>
        </ul>
        <div className={styles.timestampRow}>
          <span><strong>Last successful retrieval:</strong> {formatDate(data.lastObservedAt)}</span>
          <span><strong>Last verified baseline:</strong> {formatDate(data.lastVerifiedAt)}</span>
          <span><strong>Knowledge index updated:</strong> {formatDate(data.dateModified)}</span>
        </div>
      </section>

      <section id="companies" className={styles.section} aria-labelledby="companies-title">
        <div className={styles.sectionHead}>
          <div><p className={styles.kicker}>Entity index</p><h2 id="companies-title">Companies with published evidence</h2></div>
          <p>Each company page links only to policy records that independently pass the publication gate.</p>
        </div>
        <ol className={styles.indexList}>
          {data.companies.map((company) => (
            <li key={company.id} className={styles.indexRow}>
              <div className={styles.indexIdentity}><h3>{company.name}</h3><p>{company.industry}</p></div>
              <div className={styles.indexMeta}><dl><div><dt>Public policies</dt><dd>{company.publicPolicyCount}</dd></div><div><dt>Last observed</dt><dd>{formatDate(company.lastObservedAt)}</dd></div><div><dt>Publication state</dt><dd>Evidence-gated public</dd></div></dl></div>
              <Link className={styles.openLink} href={`/knowledge/companies/${company.slug}`}>Open company record <ArrowRight size={14} aria-hidden="true" /></Link>
            </li>
          ))}
        </ol>
      </section>

      <section id="policies" className={styles.section} aria-labelledby="policies-title">
        <div className={styles.sectionHead}>
          <div><p className={styles.kicker}>Policy index</p><h2 id="policies-title">Published policy records</h2></div>
          <p>Policy pages expose identity, source, timestamps, ingestion method and published baseline metadata. Raw source text is not reproduced.</p>
        </div>
        <ol className={styles.indexList}>
          {data.policies.map((policy) => (
            <li key={policy.id} className={styles.indexRow}>
              <div className={styles.indexIdentity}><h3>{policy.name}</h3><p>{policy.company.name} / {policy.jurisdiction}</p></div>
              <div className={styles.indexMeta}><dl><div><dt>Type</dt><dd>{policy.type}</dd></div><div><dt>Data status</dt><dd>{policy.dataStatus}</dd></div><div><dt>Published changes</dt><dd>{policy.publishedChangeCount}</dd></div></dl></div>
              <Link className={styles.openLink} href={`/knowledge/companies/${policy.company.slug}/policies/${policy.id}`}>Open policy record <ArrowRight size={14} aria-hidden="true" /></Link>
            </li>
          ))}
        </ol>
      </section>

      <section id="recent-changes" className={styles.section} aria-labelledby="changes-title">
        <div className={styles.sectionHead}>
          <div><p className={styles.kicker}>Recent publication register</p><h2 id="changes-title">Recently published changes</h2></div>
          <p>These links lead to the public change record and its evidence packet. Dates distinguish observation from publication.</p>
        </div>
        {data.recentChanges.length === 0 ? (
          <div className={styles.notice} role="status"><FileSearch size={22} aria-hidden="true" /><div><h3>No published changes are available</h3><p>Verified baselines may exist without a later change record.</p></div></div>
        ) : (
          <ol className={styles.changeList}>
            {data.recentChanges.map((change) => (
              <li key={change.id} className={styles.changeRow}>
                <div className={styles.changeMeta}><span>Published</span><time dateTime={change.publishedAt}>{formatDate(change.publishedAt)}</time><span className={styles.riskLabel}>Screening: {change.overallRisk}</span></div>
                <div><h3><Link href={`/change/${change.id}`}>{change.policy.company.name} / {change.policy.name}</Link></h3><p>{change.summary}</p></div>
                <Link className={styles.openLink} href={`/evidence/${change.id}`}>Evidence packet <ArrowRight size={14} aria-hidden="true" /></Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}

export default async function KnowledgePage() {
  let data: PublicKnowledgeHub | null = null;
  try {
    data = await getPublicKnowledgeHub();
  } catch (error) {
    console.error('[Knowledge] Public knowledge inventory temporarily unavailable:', error);
  }

  const jsonLd = data ? {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${POLICYWATCHER_ORIGIN}/knowledge#page`,
        url: `${POLICYWATCHER_ORIGIN}/knowledge`,
        name: 'PolicyWatcher Public Policy Knowledge Base',
        description: 'Evidence-gated index of public companies, policies, verified baselines and published policy changes.',
        dateModified: data.dateModified || undefined,
        publisher: { '@type': 'Organization', name: 'PolicyWatcher', url: POLICYWATCHER_ORIGIN },
        mainEntity: { '@id': `${POLICYWATCHER_ORIGIN}/knowledge#dataset` },
      },
      {
        '@type': 'Dataset',
        '@id': `${POLICYWATCHER_ORIGIN}/knowledge#dataset`,
        name: 'PolicyWatcher public evidence inventory',
        description: 'Public inventory limited to policies and changes that pass PolicyWatcher publication gates.',
        url: `${POLICYWATCHER_ORIGIN}/knowledge`,
        dateModified: data.dateModified || undefined,
        isAccessibleForFree: true,
        measurementTechnique: 'Non-seeded retrieval and public-evidence baseline gate.',
        variableMeasured: [
          `Companies: ${data.counts.companies}`,
          `Policies: ${data.counts.policies}`,
          `Published baselines: ${data.counts.baselines}`,
          `Published changes: ${data.counts.changes}`,
        ],
        citation: [`${POLICYWATCHER_ORIGIN}/evidence`, `${POLICYWATCHER_ORIGIN}/methodology/confidence`],
        publisher: { '@type': 'Organization', name: 'PolicyWatcher', url: POLICYWATCHER_ORIGIN },
      },
      {
        '@type': 'ItemList',
        '@id': `${POLICYWATCHER_ORIGIN}/knowledge#companies`,
        name: 'Companies with published PolicyWatcher evidence',
        numberOfItems: data.companies.length,
        itemListElement: data.companies.map((company, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `${POLICYWATCHER_ORIGIN}/knowledge/companies/${company.slug}`,
          name: company.name,
        })),
      },
    ],
  } : null;

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />}
      <PublicHeader current="knowledge" />
      <main className={styles.page}>
        <div className={styles.shell}>
          <header className={styles.hero}>
            <div className={styles.metaBar}><span>Public reference layer</span><span>Evidence-gated / server-rendered</span></div>
            <div className={styles.heroGrid}>
              <div>
                <p className={styles.kicker}>PolicyWatcher knowledge base</p>
                <h1>Public policy records</h1>
                <p className={styles.lead}>PolicyWatcher records publicly available company policies, verified source baselines and published changes. This index provides direct textual access to the public records and their provenance links.</p>
                <nav className={styles.actions} aria-label="Knowledge index entry points">
                  <a href="#inventory">Inspect public inventory <ArrowRight size={15} aria-hidden="true" /></a>
                  {data?.availability === 'available' ? (
                    <><a href="#companies">Browse companies</a><a href="#policies">Browse policies</a></>
                  ) : (
                    <><Link href="/methodology/confidence">Publication methodology</Link><Link href="/evidence">Evidence register</Link></>
                  )}
                </nav>
              </div>
              <aside className={styles.boundary} aria-label="Publication boundary"><strong>Publication boundary</strong><p>Configured, seeded, withheld or unverified records are excluded. Missing data is shown as unavailable or empty and is not reported as a positive status.</p></aside>
            </div>
          </header>

          {data ? <HubContent data={data} /> : (
            <section className={styles.section} aria-labelledby="unavailable-title"><div className={styles.notice} role="status"><AlertTriangle size={22} aria-hidden="true" /><div><h2 id="unavailable-title">Public knowledge inventory temporarily unavailable</h2><p>The public database could not be read. No internal connection, storage or migration details are exposed.</p><Link href="/methodology/confidence">Read the publication methodology</Link></div></div></section>
          )}

          <section className={styles.section} aria-labelledby="references-title">
            <div className={styles.sectionHead}><div><p className={styles.kicker}>Evidence and machine access</p><h2 id="references-title">Reference surfaces</h2></div><p>Use the methodology and evidence pages before citing derived screening outputs. Public machine endpoints remain read-only and publication-aware.</p></div>
            <ul className={styles.resourceList}>{references.map((item) => <li key={item.href}><Link href={item.href}><strong>{item.title} <ArrowRight size={12} aria-hidden="true" /></strong><span>{item.body}</span></Link></li>)}</ul>
            <p className={styles.machineNote}>Citation guidance: identify PolicyWatcher as the secondary record, cite the canonical entity or change URL, and include the official provider source where available. PolicyWatcher outputs are not legal advice or compliance determinations.</p>
          </section>
        </div>
      </main>
      <Footer lang="en" variant="compact" />
    </>
  );
}
