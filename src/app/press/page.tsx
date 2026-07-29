import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Download,
  FileJson2,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import {
  buildPressCoverageCitation,
  formatPressCoverageDate,
  getPressCoverageSummary,
  pressCoverageKindLabels,
  pressCoverageRecords,
  PRESS_COVERAGE_AS_OF,
  PRESS_COVERAGE_BOUNDARY,
} from '@/lib/pressCoverage';
import PressCoverageRegistry, { type CoverageRecordView } from './PressCoverageRegistry';
import styles from './press.module.css';

export const metadata: Metadata = {
  title: 'Coverage Registry | PolicyWatcher',
  description: 'A source-linked registry of public references to PolicyWatcher.',
};

const submitReferenceHref = 'mailto:info@policywatcher.online?subject=PolicyWatcher%20public%20reference';

export default function PressPage() {
  const summary = getPressCoverageSummary(pressCoverageRecords);
  const types = Object.entries(pressCoverageKindLabels).map(([kind, label]) => ({
    label,
    count: pressCoverageRecords.filter((record) => record.kind === kind).length,
  })).filter((type) => type.count > 0);
  const languages = [
    { label: 'English', value: 'en', count: summary.byLanguage.en },
    { label: 'Italian', value: 'it', count: summary.byLanguage.it },
  ].filter((language) => language.count > 0);
  const records: CoverageRecordView[] = pressCoverageRecords.map((record) => ({
    id: record.id,
    source: record.sourceName,
    platform: record.platform,
    kind: pressCoverageKindLabels[record.kind],
    dateLabel: formatPressCoverageDate(record),
    language: record.language === 'it' ? 'Italian' : 'English',
    title: record.title,
    titleStatus: record.titleStatus === 'publisher-supplied'
      ? 'Publisher-supplied title'
      : 'Registry description',
    reviewedAt: record.reviewedAt,
    summary: record.summary,
    verificationLabel: record.recordStatus === 'source-linked' ? 'Source-linked' : record.recordStatus,
    citation: buildPressCoverageCitation(record),
    href: record.sourceUrl,
    image: record.localPreview.src,
    imageAlt: record.localPreview.alt,
    boundary: `${record.relationship}. ${PRESS_COVERAGE_BOUNDARY}`,
  }));
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'PolicyWatcher Coverage Registry',
    description: PRESS_COVERAGE_BOUNDARY,
    url: 'https://policywatcher.online/press',
    dateModified: PRESS_COVERAGE_AS_OF,
    distribution: [
      { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: 'https://policywatcher.online/api/press/coverage' },
      { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: 'https://policywatcher.online/api/press/coverage?format=csv' },
    ],
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: summary.total,
      itemListElement: pressCoverageRecords.map((record, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'CreativeWork',
          identifier: record.id,
          name: record.title,
          url: record.sourceUrl,
          datePublished: record.publishedDate,
          inLanguage: record.language,
        },
      })),
    },
  };

  return (
    <>
      <PublicHeader current="press" />
      <main className={styles.page}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
        <div className={styles.shell}>
          <header className={styles.hero}>
            <div className={styles.eyebrowRow}>
              <span className={styles.kicker}>PolicyWatcher public record</span>
              <span className={styles.asOf}>As of {PRESS_COVERAGE_AS_OF}</span>
            </div>
            <div className={styles.heroGrid}>
              <div>
                <h1>Coverage Registry</h1>
                <p className={styles.lead}>
                  A source-linked registry of public articles, posts and newsletters that refer to PolicyWatcher.
                </p>
              </div>
              <p className={styles.boundaryNote}>
                {PRESS_COVERAGE_BOUNDARY}
              </p>
            </div>
          </header>

          <section className={styles.statusStrip} aria-label="Registry status">
            <div>
              <span>Records</span>
              <strong>{summary.total}</strong>
              <small>Current registry entries</small>
            </div>
            <div>
              <span>Source-linked</span>
              <strong>{summary.sourceLinked}</strong>
              <small>Records with an original URL</small>
            </div>
            <div>
              <span>Editorial references</span>
              <strong>{summary.editorial}</strong>
              <small>Articles and newsletters</small>
            </div>
            <div>
              <span>Professional posts</span>
              <strong>{summary.professionalPosts}</strong>
              <small>Public professional references</small>
            </div>
          </section>

          <section className={styles.qualify} aria-labelledby="qualify-title">
            <div>
              <p className={styles.kicker}>Reading the ledger</p>
              <h2 id="qualify-title">How records qualify</h2>
            </div>
            <dl>
              <div>
                <dt>01 · Public source URL</dt>
                <dd>A record stores the original public source URL available when the entry was recorded.</dd>
              </div>
              <div>
                <dt>02 · Recorded metadata</dt>
                <dd>Source, type, publication month, language and a factual description are retained together.</dd>
              </div>
              <div>
                <dt>03 · Relationship boundary</dt>
                <dd>Listing a reference does not establish support, product quality, legal compliance or independent review.</dd>
              </div>
            </dl>
          </section>

          <PressCoverageRegistry records={records} types={types} languages={languages} />

          <section className={styles.distribution} aria-labelledby="distribution-title">
            <div>
              <p className={styles.kicker}>Distribution</p>
              <h2 id="distribution-title">Use or extend the registry</h2>
              <p>Download the current record set, consult the Press Kit, or send a public reference for consideration.</p>
            </div>
            <nav aria-label="Registry distribution actions">
              <a href="/api/press/coverage" download>
                <FileJson2 size={18} /> JSON registry <ArrowRight size={16} />
              </a>
              <a href="/api/press/coverage?format=csv" download>
                <Download size={18} /> CSV registry <ArrowRight size={16} />
              </a>
              <Link href="/press-kit">
                <ShieldCheck size={18} /> Press Kit <ArrowRight size={16} />
              </Link>
              <a href={submitReferenceHref}>
                <Mail size={18} /> Submit a reference <ArrowRight size={16} />
              </a>
            </nav>
          </section>

          <section className={styles.method} aria-labelledby="method-title">
            <div>
              <p className={styles.kicker}>Method and boundary</p>
              <h2 id="method-title">What this registry does and does not show</h2>
            </div>
            <div>
              <p>
                The registry preserves a small, reviewable set of public references with their original links and recorded metadata. It is not an exhaustive account of public discussion and does not rate, validate or endorse third-party content.
              </p>
              <Link href="/press-kit/reference">Read the Press Kit reference material <ArrowRight size={15} /></Link>
            </div>
          </section>
        </div>
      </main>
      <Footer lang="en" />
    </>
  );
}
