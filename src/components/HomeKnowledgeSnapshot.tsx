import CaptureFreshness from '@/components/CaptureFreshness';
import Link from 'next/link';
import { ArrowRight, BookOpenCheck, ChevronDown, FileSearch } from 'lucide-react';
import type { PublicKnowledgeHub } from '@/lib/publicKnowledge';
import styles from './HomeKnowledgeSnapshot.module.css';

interface HomeKnowledgeSnapshotProps {
  data: PublicKnowledgeHub | null;
  lang?: 'en' | 'it';
}

function formatDate(value: string | null, lang: 'en' | 'it'): string {
  if (!value) return lang === 'it' ? 'Non disponibile' : 'Not available';
  return new Intl.DateTimeFormat(lang === 'it' ? 'it-IT' : 'en-GB', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value));
}

export default function HomeKnowledgeSnapshot({ data, lang = 'en' }: HomeKnowledgeSnapshotProps) {
  return (
    <section className={styles.section} aria-label={lang === 'it' ? "Documenti pubblici delle policy" : "Public policy records"}>
      <details className={styles.disclosure} open>
        <summary>
          <span>
            <span className={styles.kicker}><BookOpenCheck size={14} aria-hidden="true" /> {lang === 'it' ? 'Documenti pubblici delle policy' : 'Public policy records'}</span>
            <strong>{lang === 'it' ? "Record verificati e collegamenti alle fonti" : "Verified records and source links"}</strong>
          </span>
          <span className={styles.disclosureAction}>{lang === 'it' ? "Esplora l’indice " : "Inspect index "}<ChevronDown size={16} aria-hidden="true" /></span>
        </summary>

        <div className={styles.body}>
          <div className={styles.header}>
            <div>
              <h2>{lang === 'it' ? "Esplora le policy aziendali e gli aggiornamenti registrati." : "Explore company policies and recorded updates."}</h2>
              <p>{lang === 'it' ? "Esplora aziende, fonti delle policy e versioni registrate. Ogni aggiornamento rimanda alle evidenze, per verificare la fonte e i limiti del confronto." : "Browse company records, policy sources and recorded versions. Each update links to its evidence so you can check the source and the limits of the comparison."}</p>
            </div>
            <Link href="/knowledge" className={styles.primaryLink}>{lang === 'it' ? "Apri l’archivio pubblico " : "Open knowledge base "}<ArrowRight size={15} aria-hidden="true" /></Link>
          </div>

          {!data ? (
            <div className={styles.notice} role="status"><FileSearch size={19} aria-hidden="true" /><p><strong>{lang === 'it' ? "Riepilogo delle evidenze pubbliche temporaneamente non disponibile." : "Public knowledge snapshot temporarily unavailable."}</strong>{lang === 'it' ? " La dashboard interattiva resta disponibile; i dettagli interni del database non sono esposti." : " The interactive dashboard remains available; internal database details are not exposed."}</p></div>
          ) : data.availability === 'empty' ? (
            <div className={styles.notice} role="status"><FileSearch size={19} aria-hidden="true" /><p><strong>{lang === 'it' ? "Al momento nessun record soddisfa i criteri di pubblicazione." : "No records currently pass the publication gate."}</strong>{lang === 'it' ? " L’assenza di evidenze pubblicabili non indica una valutazione positiva della qualità dei dati." : " This is an empty evidence state, not a positive data-quality status."}</p></div>
          ) : (
            <>
              <dl className={styles.counts} aria-label={lang === 'it' ? "Conteggi delle evidenze pubbliche" : "Public knowledge counts"}>
                <div><dt>{lang === 'it' ? "Aziende" : "Companies"}</dt><dd>{data.counts.companies}</dd></div>
                <div><dt>{lang === 'it' ? "Policy" : "Policies"}</dt><dd>{data.counts.policies}</dd></div>
                <div><dt>{lang === 'it' ? "Versioni di riferimento" : "Baselines"}</dt><dd>{data.counts.baselines}</dd></div>
                <div><dt>{lang === 'it' ? "Modifiche" : "Changes"}</dt><dd>{data.counts.changes}</dd></div>
              </dl>
              <div className={styles.indexes}>
                <div><strong>{lang === 'it' ? "Indice delle aziende" : "Company index"}</strong><nav aria-label={lang === 'it' ? "Esempi di record aziendali" : "Sample company knowledge records"}>{data.companies.slice(0, 5).map((company) => <Link key={company.id} href={`/knowledge/companies/${company.slug}`}>{company.name}</Link>)}</nav></div>
                <div><strong>{lang === 'it' ? "Documenti delle policy" : "Policy records"}</strong><nav aria-label={lang === 'it' ? "Esempi di documenti pubblici delle policy" : "Sample public policy records"}>{data.policies.slice(0, 5).map((policy) => <Link key={policy.id} href={`/knowledge/companies/${policy.company.slug}/policies/${policy.id}`}>{policy.company.name} / {policy.name} ({policy.jurisdiction})</Link>)}</nav></div>
              </div>
              <CaptureFreshness lastRetrievedAt={data.lastObservedAt} lang={lang} />
              <p className={styles.timestamp}>{lang === 'it' ? 'Ultima acquisizione riuscita: ' : 'Last successful retrieval: '}{formatDate(data.lastObservedAt, lang)}. {lang === 'it' ? 'I conteggi escludono i record soltanto configurati, iniziali, trattenuti o non verificati.' : 'Counts exclude configured, seeded, withheld and unverified records.'}</p>
            </>
          )}
        </div>
      </details>
    </section>
  );
}
