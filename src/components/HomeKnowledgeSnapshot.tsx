import CaptureFreshness from '@/components/CaptureFreshness';
import Link from 'next/link';
import { ArrowRight, BookOpenCheck, ChevronDown, FileSearch } from 'lucide-react';
import type { PublicKnowledgeHub } from '@/lib/publicKnowledge';
import styles from './HomeKnowledgeSnapshot.module.css';

export interface HomeKnowledgeData extends Pick<PublicKnowledgeHub, 'availability' | 'counts' | 'lastObservedAt'> {
  companies: Pick<PublicKnowledgeHub['companies'][number], 'id' | 'name' | 'slug'>[];
  policies: Pick<PublicKnowledgeHub['policies'][number], 'id' | 'name' | 'company' | 'jurisdiction'>[];
}

interface HomeKnowledgeSnapshotProps {
  data: HomeKnowledgeData | null;
  lang?: 'en' | 'it';
}

function formatDate(value: string | null, lang: 'it' | 'en'): string {
  if (!value) return lang === 'it' ? 'Data non disponibile' : 'Not available';
  return new Intl.DateTimeFormat(lang === 'it' ? 'it-IT' : 'en-GB', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value));
}

export default function HomeKnowledgeSnapshot({ data, lang = 'en' }: HomeKnowledgeSnapshotProps) {
  return (
    <section className={styles.section} aria-label={lang === 'it' ? "Catalogo pubblico delle policy" : "Public policy records"}>
      <details className={styles.disclosure}>
        <summary>
          <span>
            <span className={styles.kicker}><BookOpenCheck size={14} aria-hidden="true" /> {lang === 'it' ? 'Catalogo pubblico delle policy' : 'Public policy records'}</span>
            <strong>{data?.availability === 'available' ? (lang === 'it' ? `${data.counts.companies} aziende · ${data.counts.policies} documenti` : `${data.counts.companies} companies · ${data.counts.policies} policies`) : (lang === 'it' ? 'Record verificati e fonti' : 'Verified records and source links')}</strong>
          </span>
          <span className={styles.disclosureAction}>{lang === 'it' ? "Consulta l’indice" : "Inspect index"} <ChevronDown size={16} aria-hidden="true" /></span>
        </summary>

        <div className={styles.body}>
          <div className={styles.header}>
            <div>
              <h2>{lang === 'it' ? "Esplora le policy delle aziende e le modifiche registrate." : "Explore company policies and recorded updates."}</h2>
              <p>{lang === 'it' ? "Consulta le aziende, le fonti e le versioni registrate. Ogni modifica rimanda ai documenti usati per il confronto." : "Browse company records, policy sources and recorded versions. Each update links to its evidence so you can check the source and the limits of the comparison."}</p>
            </div>
            <Link href="/knowledge" className={styles.primaryLink}>{lang === 'it' ? "Apri il catalogo" : "Open knowledge base"} <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>

          {!data ? (
            <div className={styles.notice} role="status"><FileSearch size={19} aria-hidden="true" /><p><strong>{lang === 'it' ? "Il riepilogo del catalogo è temporaneamente indisponibile." : "Public knowledge snapshot temporarily unavailable."}</strong> {lang === 'it' ? "Puoi continuare a usare l’area di lavoro interattiva." : "The interactive dashboard remains available; internal database details are not exposed."}</p></div>
          ) : data.availability === 'empty' ? (
            <div className={styles.notice} role="status"><FileSearch size={19} aria-hidden="true" /><p><strong>{lang === 'it' ? "Al momento nessun record soddisfa i criteri di pubblicazione." : "No records currently pass the publication gate."}</strong> {lang === 'it' ? "L’assenza di record pubblicati non consente di valutare la qualità dei dati." : "This is an empty evidence state, not a positive data-quality status."}</p></div>
          ) : (
            <>
              <dl className={styles.counts} aria-label={lang === 'it' ? "Conteggi del catalogo pubblico" : "Public knowledge counts"}>
                <div><dt>{lang === 'it' ? "Aziende" : "Companies"}</dt><dd>{data.counts.companies}</dd></div>
                <div><dt>{lang === 'it' ? "Documenti" : "Policies"}</dt><dd>{data.counts.policies}</dd></div>
                <div><dt>{lang === 'it' ? "Versioni di riferimento" : "Reference versions"}</dt><dd>{data.counts.baselines}</dd></div>
                <div><dt>{lang === 'it' ? "Modifiche" : "Changes"}</dt><dd>{data.counts.changes}</dd></div>
              </dl>
              <div className={styles.indexes}>
                <div><strong>{lang === 'it' ? "Indice delle aziende" : "Company index"}</strong><nav aria-label={lang === 'it' ? "Esempi di aziende in catalogo" : "Sample company knowledge records"}>{data.companies.slice(0, 5).map((company) => <Link key={company.id} href={`/knowledge/companies/${company.slug}`}>{company.name}</Link>)}</nav></div>
                <div><strong>{lang === 'it' ? "Documenti" : "Policy records"}</strong><nav aria-label={lang === 'it' ? "Esempi di documenti pubblicati" : "Sample public policy records"}>{data.policies.slice(0, 5).map((policy) => <Link key={policy.id} href={`/knowledge/companies/${policy.company.slug}/policies/${policy.id}`}>{policy.company.name} / {policy.name} ({policy.jurisdiction})</Link>)}</nav></div>
              </div>
              <CaptureFreshness lang={lang} lastRetrievedAt={data.lastObservedAt} />
              <p className={styles.timestamp}>{lang === 'it' ? 'Ultimo recupero riuscito' : 'Last successful retrieval'}: {formatDate(data.lastObservedAt, lang)}. {lang === 'it' ? 'I conteggi escludono i record solo configurati, dimostrativi, trattenuti o non verificati.' : 'Counts exclude configured, seeded, withheld and unverified records.'}</p>
            </>
          )}
        </div>
      </details>
    </section>
  );
}
