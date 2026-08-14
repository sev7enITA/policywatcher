import Link from 'next/link';
import { ArrowRight, BookOpenCheck, ChevronDown, FileSearch } from 'lucide-react';
import type { PublicKnowledgeHub } from '@/lib/publicKnowledge';
import styles from './HomeKnowledgeSnapshot.module.css';

interface HomeKnowledgeSnapshotProps {
  data: PublicKnowledgeHub | null;
}

function formatDate(value: string | null): string {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value));
}

export default function HomeKnowledgeSnapshot({ data }: HomeKnowledgeSnapshotProps) {
  return (
    <section className={styles.section} aria-label="Crawlable public knowledge">
      <details className={styles.disclosure}>
        <summary>
          <span>
            <span className={styles.kicker}><BookOpenCheck size={14} aria-hidden="true" /> Crawlable public knowledge</span>
            <strong>Verified records and source links</strong>
          </span>
          <span className={styles.disclosureAction}>Inspect index <ChevronDown size={16} aria-hidden="true" /></span>
        </summary>

        <div className={styles.body}>
          <div className={styles.header}>
            <div>
              <h2>Verified records, available as linked text.</h2>
              <p>Direct server-rendered access to companies, policy sources, baseline metadata and published changes that pass the public-evidence gate.</p>
            </div>
            <Link href="/knowledge" className={styles.primaryLink}>Open knowledge base <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>

          {!data ? (
            <div className={styles.notice} role="status"><FileSearch size={19} aria-hidden="true" /><p><strong>Public knowledge snapshot temporarily unavailable.</strong> The interactive dashboard remains available; internal database details are not exposed.</p></div>
          ) : data.availability === 'empty' ? (
            <div className={styles.notice} role="status"><FileSearch size={19} aria-hidden="true" /><p><strong>No records currently pass the publication gate.</strong> This is an empty evidence state, not a positive data-quality status.</p></div>
          ) : (
            <>
              <dl className={styles.counts} aria-label="Public knowledge counts">
                <div><dt>Companies</dt><dd>{data.counts.companies}</dd></div>
                <div><dt>Policies</dt><dd>{data.counts.policies}</dd></div>
                <div><dt>Baselines</dt><dd>{data.counts.baselines}</dd></div>
                <div><dt>Changes</dt><dd>{data.counts.changes}</dd></div>
              </dl>
              <div className={styles.indexes}>
                <div><strong>Company index</strong><nav aria-label="Sample company knowledge records">{data.companies.slice(0, 5).map((company) => <Link key={company.id} href={`/knowledge/companies/${company.slug}`}>{company.name}</Link>)}</nav></div>
                <div><strong>Recent public records</strong><nav aria-label="Recent public policy records">{data.policies.slice(0, 5).map((policy) => <Link key={policy.id} href={`/knowledge/companies/${policy.company.slug}/policies/${policy.id}`}>{policy.company.name} / {policy.name}</Link>)}</nav></div>
              </div>
              <p className={styles.timestamp}>Last successful retrieval: {formatDate(data.lastObservedAt)}. Counts exclude configured, seeded, withheld and unverified records.</p>
            </>
          )}
        </div>
      </details>
    </section>
  );
}
