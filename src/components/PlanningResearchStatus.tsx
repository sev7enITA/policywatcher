import Link from 'next/link';
import { POLICYWATCHER_VERSION } from '@/lib/release';
import { planningHref, type PlanningLanguage } from '@/lib/planningLocale';
import styles from './PlanningResearchStatus.module.css';

export default function PlanningResearchStatus({ lang, path }: { lang: PlanningLanguage; path: string }) {
  const it = lang === 'it';
  return <aside className={styles.panel} aria-labelledby="planning-research-title" lang={lang}>
    <div className={styles.heading}>
      <p>{it ? 'Stato delle evidenze · 22 novembre 2026' : 'Evidence status · 22 November 2026'}</p>
      <h2 id="planning-research-title">{it ? 'Tre livelli da distinguere' : 'Three distinct delivery states'}</h2>
    </div>
    <dl className={styles.states}>
      <div><dt>{it ? `Servizio pubblico · ${POLICYWATCHER_VERSION} stabile` : `Public service · stable ${POLICYWATCHER_VERSION}`}</dt><dd>{it ? 'Il dominio ufficiale usa lo scanner consolidato. La versione del prodotto non è la versione del motore sperimentale.' : 'The official website uses the established scanner. The product version and experimental engine version are separate.'}</dd></div>
      <div><dt>{it ? 'Preview r3 · privata' : 'Preview r3 · private'}</dt><dd>{it ? 'Richiede accesso amministratore, conserva rapporti e confronti. Pubblicazione automatica e notifiche restano disabilitate.' : 'Administrator access is required. Reports and comparisons are retained. Automatic publication and notifications remain disabled.'}</dd></div>
      <div><dt>{it ? 'Candidato su Git · in qualificazione' : 'Git candidate · under qualification'}</dt><dd>{it ? 'La verifica successiva sui 133 URL sospesi ha completato quattro estrazioni; 129 casi restano sospesi. Non è una nuova prova di 500 completamenti riusciti.' : 'The follow-up on the same 133 held URLs completed four extractions; 129 cases remain held. This is not a new trial of 500 successful completions.'}</dd></div>
    </dl>
    <p className={styles.boundary}>{it ? 'Restano da qualificare completezza delle fonti, accuratezza semantica e 500 completamenti giornalieri dell’intera pipeline. Le tre date valide del vecchio campione di 12 fonti riguardano un candidato congelato separato.' : 'Source completeness, semantic accuracy and 500 successful daily full-pipeline completions remain unqualified. The three valid dates in the earlier 12-source sample belong to a separate frozen candidate.'}</p>
    <p className={styles.boundary} data-contract-audit>
      <strong>{it ? 'Audit del contratto: ' : 'Contract audit: '}</strong>
      {it ? 'la riesecuzione sul sorgente c7deedb riconferma che quattro testi sintetici incompleti su sei soddisfano ancora il contratto dichiarato. Il controllo completo è passato e due altre mutazioni sono state respinte. È una verifica dell’osservabilità del contratto, non del parser o della completezza delle policy reali.' : 'the rerun on source c7deedb reconfirms that four of six incomplete synthetic texts still satisfy the declared contract. The complete control passed and two other mutations were rejected. This checks contract observability, not parser accuracy or completeness of real policies.'}
      {' '}<a className={styles.auditLink} href="https://github.com/sev7enITA/policywatcher/blob/main/docs/reports/policywatcher-demo-audit-2026-11-22.md">{it ? 'Leggi l’audit del 22 novembre' : 'Read the 22 November audit'}</a>
    </p>
    <nav aria-label={it ? 'Evidenze e lingua dell’atlante' : 'Planning evidence and language'}>
      <Link href={planningHref('/engine-6-preview#validation', lang)}>{it ? 'Consulta diario e ricevute' : 'Read diary and receipts'}</Link>
      <Link href={planningHref('/press-kit/releases', lang)}>{it ? 'Cronologia delle release' : 'Release history'}</Link>
      <Link href={planningHref(path, it ? 'en' : 'it')} hrefLang={it ? 'en' : 'it'}>{it ? 'English' : 'Italiano'}</Link>
    </nav>
    {it && <p className={styles.languageNote}>Navigazione e riepilogo sono in italiano. Le descrizioni dell’inventario tecnico e i riferimenti storici conservati sotto sono in inglese e sono indicati come tali; non costituiscono una traduzione completa.</p>}
  </aside>;
}
