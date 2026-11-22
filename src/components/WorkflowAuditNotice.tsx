import Link from 'next/link';
import styles from './WorkflowAuditNotice.module.css';

export default function WorkflowAuditNotice({ lang }: { lang: 'en' | 'it' }) {
  const it = lang === 'it';
  const base = '/research/engine-workflow-20261122';
  return <section id="workflow-audit" className={styles.notice} aria-label={it ? 'Audit del workflow: 22 novembre 2026' : 'Workflow audit: 22 November 2026'}>
    <p className={styles.eyebrow}>{it ? 'Ricerca aperta · 22 novembre 2026' : 'Open research · 22 November 2026'}</p>
    <h2>{it ? 'Dal documento alla decisione: ispeziona il workflow.' : 'From document to decision: inspect the workflow.'}</h2>
    <p>{it ? 'Tre agenti separati hanno riesaminato il candidato. Corretti un problema P1 e quattro P2: destinazione dei link, prove degli errori, budget degli allegati, gate della nuova baseline ed evidenze mostrate nell’admin.' : 'Three separate agents reviewed the candidate. One P1 and four P2 issues were corrected: link destinations, failure evidence, attachment budgets, rebaseline gates and evidence shown in the admin interface.'}</p>
    <p><strong>{it ? '1.865 test offline superati · 14 saltati · 6 controlli GitHub passati.' : '1,865 offline tests passed · 14 skipped · 6 GitHub checks passed.'}</strong> {it ? 'Sette diagrammi, una panoramica, 109 riferimenti al codice e 28 gate. Sono verifiche del candidato locale: completezza delle fonti e 500 elaborazioni giornaliere restano da qualificare.' : 'Seven diagrams, an overview, 109 code references and 28 gates. These verify the local candidate: source completeness and 500 daily full-pipeline completions remain unqualified.'}</p>
    <nav aria-label={it ? 'Atlante e prove dell’audit' : 'Workflow atlas and audit evidence'}>
      <a href={`${base}/${it ? 'index-it.html' : 'index.html'}`}>{it ? 'Apri l’atlante e tutti gli schemi' : 'Open the atlas and all diagrams'}</a>
      <a href={`${base}/workflow-audit-evidence.zip`} download>{it ? 'Scarica diagrammi e ricevute' : 'Download diagrams and receipts'}</a>
      <Link href={`/engine-6-preview${it ? '?lang=it' : ''}#validation`}>{it ? 'Diario e limiti' : 'Diary and limits'}</Link>
    </nav>
    <small>{it ? 'Documentazione pubblica del codice 3eabf9d; non è il motore distribuito. Modelli esterni gratuiti e Qwen locale hanno fornito pareri revisionati, non certificazioni. Nessun nuovo risultato Gemini o GLM 5.3 MAX è attribuito a questo audit.' : 'Public documentation of code 3eabf9d; this is not the deployed engine. Free external models and local Qwen supplied reviewed opinions, not certification. No new Gemini or GLM 5.3 MAX result is attributed to this audit.'}</small>
  </section>;
}
