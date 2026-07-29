'use client';

import Image from 'next/image';
import { Check, Copy, ExternalLink, Filter, Link2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import styles from './press.module.css';

export type CoverageRecordView = {
  id: string;
  source: string;
  platform: string;
  kind: string;
  dateLabel: string;
  language: string;
  title: string;
  titleStatus: string;
  reviewedAt: string;
  summary: string;
  verificationLabel: string;
  citation: string;
  href: string;
  image?: string | null;
  imageAlt?: string | null;
  boundary: string;
};

type PressCoverageRegistryProps = {
  records: CoverageRecordView[];
  types: Array<{ label: string; count: number }>;
  languages: Array<{ label: string; count: number }>;
};

export default function PressCoverageRegistry({ records, types, languages }: PressCoverageRegistryProps) {
  const [kind, setKind] = useState('All types');
  const [language, setLanguage] = useState('All languages');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyErrorId, setCopyErrorId] = useState<string | null>(null);

  const visibleRecords = useMemo(
    () => records.filter((record) =>
      (kind === 'All types' || record.kind === kind)
      && (language === 'All languages' || record.language === language),
    ),
    [kind, language, records],
  );

  const clearFilters = () => {
    setKind('All types');
    setLanguage('All languages');
  };

  const copyCitation = async (record: CoverageRecordView) => {
    try {
      await navigator.clipboard.writeText(record.citation);
      setCopiedId(record.id);
      setCopyErrorId(null);
      window.setTimeout(() => setCopiedId((current) => current === record.id ? null : current), 1800);
    } catch {
      setCopiedId(null);
      setCopyErrorId(record.id);
    }
  };

  return (
    <section className={styles.registry} id="registry" aria-labelledby="registry-title">
      <div className={styles.registryHead}>
        <div>
          <p className={styles.kicker}>Record ledger</p>
          <h2 id="registry-title">Coverage records</h2>
          <p>Filter the current registry by publication type or record language. The external source remains the authoritative reference.</p>
        </div>
        <p className={styles.resultCount} aria-live="polite">{visibleRecords.length} of {records.length} records shown</p>
      </div>

      <div className={styles.filterBar} aria-label="Filter coverage records">
        <Filter size={17} aria-hidden="true" />
        <label>
          <span>Record type</span>
          <select value={kind} onChange={(event) => setKind(event.target.value)}>
            <option>All types</option>
            {types.map((type) => <option key={type.label} value={type.label}>{type.label} ({type.count})</option>)}
          </select>
        </label>
        <label>
          <span>Record language</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option>All languages</option>
            {languages.map((item) => <option key={item.label} value={item.label}>{item.label} ({item.count})</option>)}
          </select>
        </label>
        {(kind !== 'All types' || language !== 'All languages') && (
          <button type="button" className={styles.clearFilters} onClick={clearFilters}>
            <X size={15} /> Clear filters
          </button>
        )}
      </div>

      {visibleRecords.length ? (
        <ol className={styles.recordList}>
          {visibleRecords.map((record) => (
            <li key={record.id}>
              <article className={styles.record}>
                <header className={styles.recordTopline}>
                  <code>{record.id}</code>
                  <span className={styles.verified}><Check size={14} /> {record.verificationLabel}</span>
                </header>
                <div className={styles.recordBody}>
                  {record.image && (
                    <figure className={styles.evidencePreview}>
                      <Image src={record.image} alt={record.imageAlt || `${record.source} source preview`} width={280} height={158} />
                      <figcaption>Supporting preview</figcaption>
                    </figure>
                  )}
                  <div className={styles.recordContent}>
                    <dl className={styles.metadata}>
                      <div><dt>Source</dt><dd>{record.source} · {record.platform}</dd></div>
                      <div><dt>Kind</dt><dd>{record.kind}</dd></div>
                      <div><dt>Published</dt><dd>{record.dateLabel}</dd></div>
                      <div><dt>Language</dt><dd>{record.language}</dd></div>
                      <div><dt>Title</dt><dd>{record.titleStatus}</dd></div>
                      <div><dt>Reviewed</dt><dd>{record.reviewedAt}</dd></div>
                    </dl>
                    <h3>{record.title}</h3>
                    <p className={styles.summary}>{record.summary}</p>
                    <div className={styles.citationBlock}>
                      <div>
                        <span><Link2 size={14} /> Reusable citation</span>
                        <p>{record.citation}</p>
                      </div>
                      <button type="button" className={styles.copyButton} onClick={() => copyCitation(record)} aria-label={`Copy citation for ${record.title}`}>
                        {copiedId === record.id ? <Check size={16} /> : <Copy size={16} />}
                        {copiedId === record.id ? 'Copied' : 'Copy'}
                      </button>
                      {copyErrorId === record.id && (
                        <p className={styles.copyError} role="status">Copy unavailable. Select the citation text manually.</p>
                      )}
                    </div>
                  </div>
                </div>
                <footer className={styles.recordFooter}>
                  <p><span>Relationship boundary</span>{record.boundary}</p>
                  <a href={record.href} target="_blank" rel="noopener noreferrer" aria-label={`Open original source: ${record.title}`}>
                    Open original source <ExternalLink size={16} />
                  </a>
                </footer>
              </article>
            </li>
          ))}
        </ol>
      ) : (
        <div className={styles.emptyState} role="status">
          <p>No records match these filters.</p>
          <button type="button" onClick={clearFilters}>Show all records</button>
        </div>
      )}
    </section>
  );
}
