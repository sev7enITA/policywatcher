import { ArrowDown, ArrowRight, Check, CircleHelp, FileCheck, Fingerprint, Layers, LockKeyhole, Split } from 'lucide-react';
import styles from './confidence.module.css';

type Language = 'en' | 'it';

const copy = {
  en: {
    nav: 'Jump to a diagram',
    details: 'Read the detailed controls',
    labels: ['Risk scale', 'Evidence checks', 'Completeness', 'Retrieval', 'Version trail'],
    scale: 'Declared risk score bands',
    bands: ['Low', 'Medium', 'High'],
    scaleNote: 'This 1–10 scale labels the assessed risk. Coverage and evidence quality are recorded separately.',
    lenses: [
      ['Download integrity', 'Which response was kept?', 'Source, time and SHA-256'],
      ['Extraction coverage', 'Which parts of the document survived?', 'Sections, clauses, rows and occurrences'],
      ['Transaction atomicity', 'Which local records committed together?', 'Baseline, change and queued event'],
      ['Interpretation', 'Do the passages support the conclusion?', 'Exact quotations and semantic review'],
    ],
    inventory: ['Independently reviewed reference', 'Candidate extraction'],
    inventoryKeys: 'Compare section paths, clauses, table rows, links and expected attachments',
    inventoryStates: [
      ['Match', 'Coverage of the reviewed reference'],
      ['Missing or different', 'Hold for review'],
    ],
    inventoryNote: 'Engine 6 candidate under local verification. A match has the scope of the reviewed reference.',
    probe: 'Earlier contract admitted 4 of 6 intentionally incomplete documents',
    probeNote: 'Synthetic counterexamples from the 22 November audit.',
    live: [
      ['Direct HTTP', 'Configured retrieval URL'],
      ['HTTP/2 fallback', 'If direct retrieval yields no usable text'],
      ['Browser renderer', 'For script-rendered pages, when configured'],
    ],
    outcomes: [
      ['Usable live text', 'Check identity and coverage before creating a baseline or comparing versions.'],
      ['Live source unresolved', 'Try a dated archive where available. Record inaccessible or incomplete sources for review.'],
    ],
    versions: [['Earlier version', 'Source, timestamp and hash'], ['Later version', 'Source, timestamp and hash']],
    comparison: 'Versioned comparison',
    trail: 'Exact before-and-after passages, assessment and review decision',
    trailNote: 'The first successful capture establishes a baseline. A change requires a comparison.',
  },
  it: {
    nav: 'Vai a un diagramma',
    details: 'Leggi il dettaglio dei controlli',
    labels: ['Scala di rischio', 'Verifiche delle evidenze', 'Completezza', 'Recupero', 'Storico delle versioni'],
    scale: 'Fasce della scala di rischio',
    bands: ['Basso', 'Medio', 'Alto'],
    scaleNote: 'La scala da 1 a 10 indica il rischio valutato. Copertura e qualità delle evidenze sono registrate separatamente.',
    lenses: [
      ['Integrità del download', 'Quale risposta è stata conservata?', 'Fonte, data e SHA-256'],
      ['Copertura dell’estrazione', 'Quali parti del documento sono state estratte?', 'Sezioni, clausole, righe e occorrenze'],
      ['Atomicità della transazione', 'Quali record sono stati salvati insieme?', 'Baseline, modifica ed evento in coda'],
      ['Interpretazione', 'I passaggi sostengono la conclusione?', 'Citazioni esatte e revisione semantica'],
    ],
    inventory: ['Riferimento con revisione indipendente', 'Estrazione candidata'],
    inventoryKeys: 'Confronto di percorsi, clausole, righe delle tabelle, link e allegati attesi',
    inventoryStates: [
      ['Corrispondenza', 'Copertura del riferimento revisionato'],
      ['Elementi mancanti o diversi', 'Sospensione e revisione'],
    ],
    inventoryNote: 'Candidato Engine 6 in verifica locale. Una corrispondenza vale per il riferimento revisionato.',
    probe: 'Il controllo precedente accettava 4 documenti incompleti su 6',
    probeNote: 'Controesempi sintetici preparati per l’audit del 22 novembre.',
    live: [
      ['HTTP diretto', 'URL configurato per il recupero'],
      ['Fallback HTTP/2', 'Se il recupero diretto non restituisce testo utilizzabile'],
      ['Rendering nel browser', 'Per pagine con script, se configurato'],
    ],
    outcomes: [
      ['Testo live utilizzabile', 'Verifica identità e copertura prima di stabilire una baseline o confrontare le versioni.'],
      ['Fonte live irrisolta', 'Prova un archivio datato, se disponibile. Registra le fonti inaccessibili o incomplete per la revisione.'],
    ],
    versions: [['Versione precedente', 'Fonte, data e hash'], ['Versione successiva', 'Fonte, data e hash']],
    comparison: 'Confronto tra versioni',
    trail: 'Passaggi esatti prima e dopo, valutazione e decisione di revisione',
    trailNote: 'La prima cattura riuscita stabilisce una baseline. Per rilevare una modifica serve un confronto.',
  },
} satisfies Record<Language, unknown>;

const visualSections = ['scope', 'evidence-controls', 'completeness', 'ingestion', 'traceability'];
const scoreGroups = [[1, 2, 3], [4, 5, 6], [7, 8, 9, 10]];
const lensIcons = [Fingerprint, Layers, LockKeyhole, FileCheck];

export function EvidenceDiagramLinks({ lang }: { lang: Language }) {
  const t = copy[lang];
  return (
    <nav className={styles.diagramLinks} aria-label={t.nav}>
      {visualSections.map((section, index) => <a key={section} href={`#${section}`}>{t.labels[index]}</a>)}
    </nav>
  );
}

export function MethodologyDetails({ lang, bullets, collapsible }: { lang: Language; bullets: readonly string[]; collapsible: boolean }) {
  const list = <ul className={styles.bulletList}>{bullets.map((bullet, index) => <li key={index}>{bullet}</li>)}</ul>;
  return collapsible ? <details className={styles.details}><summary>{copy[lang].details}</summary>{list}</details> : list;
}

export const hasEvidenceDiagram = (section: string) => visualSections.includes(section);

function Branches({ entries }: { entries: string[][] }) {
  return <ul className={styles.branches}>{entries.map(([title, detail], index) => (
    <li key={title} data-review={index === 1}>
      {index === 0 ? <Check size={18} aria-hidden="true" /> : <CircleHelp size={18} aria-hidden="true" />}
      <div><strong>{title}</strong><p>{detail}</p></div>
    </li>
  ))}</ul>;
}

export function EvidenceVisual({ lang, section }: { lang: Language; section: string }) {
  const t = copy[lang];

  switch (section) {
    case 'scope':
      return <figure className={styles.visual} aria-labelledby="score-band-caption">
        <figcaption id="score-band-caption">{t.scale}</figcaption>
        <ul className={styles.scoreBands}>
          {scoreGroups.map((scores, index) => <li className={styles.scoreBand} key={scores[0]} data-band={index}>
            <strong>{t.bands[index]}</strong>
            <ol aria-label={`${scores[0]}–${scores.at(-1)}`}>
              {scores.map(score => <li key={score}>{score}</li>)}
            </ol>
          </li>)}
        </ul>
        <p className={styles.visualNote}>{t.scaleNote}</p>
      </figure>;
    case 'evidence-controls':
      return <ul className={styles.lenses}>
        {t.lenses.map(([title, question, evidence], index) => {
          const Icon = lensIcons[index];
          return <li key={title}>
            <Icon size={20} aria-hidden="true" /><div><strong>{title}</strong><p>{question}</p><span>{evidence}</span></div>
          </li>;
        })}
      </ul>;
    case 'completeness':
      return <figure className={styles.visual}>
        <ul className={styles.inputs}>{t.inventory.map(label => <li key={label}>{label}</li>)}</ul>
        <div className={styles.connector}><Split size={18} aria-hidden="true" /></div>
        <div className={styles.operation}>{t.inventoryKeys}</div>
        <div className={styles.connector}><ArrowDown size={18} aria-hidden="true" /></div>
        <Branches entries={t.inventoryStates} />
        <div className={styles.sample}>
          <div className={styles.sampleCells} aria-hidden="true">{[0, 1, 2, 3, 4, 5].map(cell => <span key={cell} data-admitted={cell < 4} />)}</div>
          <div><strong>{t.probe}</strong><p>{t.probeNote}</p></div>
        </div>
        <figcaption className={styles.visualNote}>{t.inventoryNote}</figcaption>
      </figure>;
    case 'ingestion':
      return <figure className={styles.visual}>
        <ol className={styles.retrievalSteps}>
          {t.live.map(([title, detail], index) => <li key={title}>
            {index > 0 && <ArrowRight className={styles.stepArrow} size={20} aria-hidden="true" />}
            <strong>{title}</strong><p>{detail}</p>
          </li>)}
        </ol>
        <div className={styles.connector}><ArrowDown size={18} aria-hidden="true" /></div>
        <Branches entries={t.outcomes} />
      </figure>;
    case 'traceability':
      return <figure className={styles.visual}>
        <ul className={styles.inputs}>{t.versions.map(([title, detail]) => <li key={title}><strong>{title}</strong><p>{detail}</p></li>)}</ul>
        <div className={styles.connector}><ArrowDown size={18} aria-hidden="true" /></div>
        <div className={styles.operation}><strong>{t.comparison}</strong><p>{t.trail}</p></div>
        <figcaption className={styles.visualNote}>{t.trailNote}</figcaption>
      </figure>;
    default:
      return null;
  }
}
