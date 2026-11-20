'use client';

import Image from 'next/image';
import { Check, Copy, ExternalLink, Filter, Link2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import styles from './press.module.css';

export type CoverageRecordView = {
  id: string;
  source: string;
  caseSlug?: string;
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
  lang: 'it' | 'en';
  types: Array<{ label: string; count: number }>;
  languages: Array<{ label: string; count: number }>;
};

export default function PressCoverageRegistry({ records, types, languages, lang }: PressCoverageRegistryProps) {
  const it = lang === 'it';
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
          <p className={styles.kicker}>{it ? "Registro" : "Record ledger"}</p>
          <h2 id="registry-title">{it ? "Le segnalazioni" : "Coverage records"}</h2>
          <p>{it ? "Filtra per tipo di pubblicazione o lingua e consulta le fonti originali." : "Filter the current registry by publication type or record language. The external source remains the authoritative reference."}</p>
        </div>
        <p className={styles.resultCount} aria-live="polite">{visibleRecords.length} / {records.length} {it ? 'voci visualizzate' : 'records shown'}</p>
      </div>

      <div className={styles.filterBar} aria-label={it ? "Filtri della rassegna" : "Filter coverage records"}>
        <Filter size={17} aria-hidden="true" />
        <label>
          <span>{it ? "Tipo di pubblicazione" : "Record type"}</span>
          <select value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="All types">{it ? "Tutti i tipi" : "All types"}</option>
            {types.map((type) => <option key={type.label} value={type.label}>{type.label} ({type.count})</option>)}
          </select>
        </label>
        <label>
          <span>{it ? "Lingua" : "Record language"}</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="All languages">{it ? "Tutte le lingue" : "All languages"}</option>
            {languages.map((item) => <option key={item.label} value={item.label}>{item.label} ({item.count})</option>)}
          </select>
        </label>
        {(kind !== 'All types' || language !== 'All languages') && (
          <button type="button" className={styles.clearFilters} onClick={clearFilters}>
            <X size={15} /> {it ? "Rimuovi filtri" : "Clear filters"}
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
                      <figcaption>{it ? "Anteprima" : "Supporting preview"}</figcaption>
                    </figure>
                  )}
                  <div className={styles.recordContent}>
                    <dl className={styles.metadata}>
                      <div><dt>{it ? "Fonte" : "Source"}</dt><dd>{record.source} · {record.platform}</dd></div>
                      <div><dt>{it ? "Tipo" : "Kind"}</dt><dd>{record.kind}</dd></div>
                      <div><dt>{it ? "Pubblicato" : "Published"}</dt><dd>{record.dateLabel}</dd></div>
                      <div><dt>{it ? "Lingua" : "Language"}</dt><dd>{record.language}</dd></div>
                      <div><dt>{it ? "Titolo" : "Title"}</dt><dd>{record.titleStatus}</dd></div>
                      <div><dt>{it ? "Controllato" : "Reviewed"}</dt><dd>{record.reviewedAt}</dd></div>
                    </dl>
                    <h3>{record.title}</h3>
                    <p className={styles.summary}>{record.summary}</p>
                    {record.caseSlug && <p><a href={`/press/cases/${record.caseSlug}?lang=${lang}`}>
                      {record.caseSlug === 'meta-ai' ? (it ? 'Esplora il caso Meta e IA' : 'Explore the Meta AI case') : (it ? 'Esplora la clausola TikTok sugli annunci' : 'Explore the TikTok advertising clause')}</a></p>}
                    <div className={styles.citationBlock}>
                      <div>
                        <span><Link2 size={14} /> {it ? "Citazione" : "Reusable citation"}</span>
                        <p>{record.citation}</p>
                      </div>
                      <button type="button" className={styles.copyButton} onClick={() => copyCitation(record)} aria-label={`${it ? 'Copia citazione' : 'Copy citation for'} ${record.title}`}>
                        {copiedId === record.id ? <Check size={16} /> : <Copy size={16} />}
                        {copiedId === record.id ? (it ? 'Copiato' : 'Copied') : (it ? 'Copia' : 'Copy')}
                      </button>
                      {copyErrorId === record.id && (
                        <p className={styles.copyError} role="status">{it ? "Seleziona il testo della citazione per copiarlo." : "Copy unavailable. Select the citation text manually."}</p>
                      )}
                    </div>
                  </div>
                </div>
                <footer className={styles.recordFooter}>
                  <p><span>{it ? "Ambito della citazione" : "Relationship boundary"}</span>{record.boundary}</p>
                  <a href={record.href} target="_blank" rel="noopener noreferrer" aria-label={`${it ? 'Apri la fonte originale' : 'Open original source'} · ${record.title}`}>
                    {it ? "Apri la fonte originale" : "Open original source"} <ExternalLink size={16} />
                  </a>
                </footer>
              </article>
            </li>
          ))}
        </ol>
      ) : (
        <div className={styles.emptyState} role="status">
          <p>{it ? "Nessuna voce corrisponde ai filtri." : "No records match these filters."}</p>
          <button type="button" onClick={clearFilters}>{it ? "Mostra tutte le voci" : "Show all records"}</button>
        </div>
      )}
    </section>
  );
}
