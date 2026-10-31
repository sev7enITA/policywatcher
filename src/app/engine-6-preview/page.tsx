import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight, Download, FlaskConical, GitBranch, ShieldCheck } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import Footer from '@/components/Footer';
import { languageAlternates, publicLanguage, withSocialMetadata } from '@/lib/seo';
import styles from './preview.module.css';

type Props = { searchParams: Promise<{ lang?: string }> };
const copy = {
  en: {
    status: 'Experimental programme', date: '31 October 2026', kicker: 'Engineering notebook / 02',
    title: 'A clearer path from source to evidence.',
    intro: 'Engine 6 Preview is being developed and tested to make policy retrieval, comparison and validation more traceable. This page opens the design for inspection.',
    boundary: 'Local implementation · live qualification pending',
    boundaryText: 'The public service remains on version 5.2.0. Publishing this notebook does not activate Engine 6 or establish improved accuracy on real policies.',
    nav: ['Architecture', 'Decision flow', 'Entity relationships', 'Validation'],
    promiseTitle: 'Three questions guide the experiment.',
    goals: [
      ['01', 'Is this the complete policy?', 'Check the document identity, required sections, language and final passage against a reviewed source contract.'],
      ['02', 'What supports this conclusion?', 'Keep frozen captures, exact quotations and a separate verification step connected to each proposed change.'],
      ['03', 'Can the work recover safely?', 'Save tasks, attempts and checkpoints so interruption does not erase progress or publish a change twice.'],
    ],
    architectureTitle: 'Evidence moves through explicit boundaries.',
    architectureIntro: 'Official sources enter a private working area. A public record is created only after the required checks succeed. Retrieval, AI analysis and delivery have separate responsibilities.',
    architectureAlt: 'Architecture: official sources enter a persistent queue, retrieval and source checks. Frozen evidence feeds comparison, analysis and verification. Review holds uncertain cases. An atomic commit creates public evidence, followed by a separate notification queue.',
    architectureSteps: [
      ['Official source', 'Direct HTTP, HTTP/2 and a configured browser renderer supply bounded retrieval paths. Archive captures do not attest current live availability.'],
      ['Private work and evidence', 'Durable tasks, per-origin backoff, frozen artifacts and checkpoints preserve the retrieval and reasoning trail. Observation and publication keep separate policy state.'],
      ['Publication boundary', 'Complete, supported changes may commit automatically at lower impact. High impact requires review; missing or uncertain evidence remains held.'],
      ['Public record and delivery', 'The baseline, version, change record and queued notification event commit together. Delivery happens later and checks subscription preferences again.'],
    ],
    flowTitle: 'An HTTP success is the start of the checks.',
    flowIntro: 'The change path requires two fresh captures in distinct runs, separated by at least one hour and no more than seven days. A 304 response can revalidate a stored representation; it cannot confirm a new change.',
    flowAlt: 'Decision flow: check the source contract and captured document; reject incomplete evidence. An unchanged baseline records a verified check. A candidate change needs two independent captures, a comparable baseline, clause comparison, exact claims and verification. Uncertainty stays held; high impact needs review; supported lower impact may publish.',
    flowSteps: [
      ['Check the source', 'Missing contract, source drift, incomplete content or uncertain language → hold and record the reason.'],
      ['Compare with the baseline', 'Unchanged content → record a verified check. Missing or incompatible baseline → review before comparison.'],
      ['Confirm the candidate', 'A matching fresh capture in a different run confirms the candidate. A retry or a conditional 304 response does not count as a second capture.'],
      ['Explain every changed block', 'The analyst must cover the complete delta with exact old/new quotations. A separate verifier assesses every claim and both language versions.'],
      ['Apply the publication gate', 'Unsupported or uncertain claims → hold. Verified high impact → human review. Complete supported lower-impact changes → atomic commit when publication is enabled.'],
    ],
    reviewNote: 'Human approval does not waive missing evidence. Source or extraction-baseline repairs have their own review path. A purely presentational extraction change does not become a provider policy-change alert.',
    modeTitle: 'Observation stays private.',
    modeText: 'Observation can record findings without changing the public baseline. Publication and notification delivery are separately enabled. A saved run can be cancelled while its earlier evidence and attempts remain recorded.',
    erTitle: 'The relationships behind a recorded change.',
    erIntro: 'This is a conceptual map of the implemented preview schema. A solid line is an explicit database foreign key; dashed lines are application-managed references, including identifiers in checkpoints and evidence payloads.',
    erAlt: 'Entity map showing EngineRun and EngineTask connected by an explicit one-to-many foreign key. Dashed logical references connect tasks, attempts, artifacts, source contracts, per-mode policy state, reviews, cache, origin scheduling, public changes and outbox events.',
    entity: 'Entity', responsibility: 'What it records', relationship: 'Relationship / identity',
    entities: [
      ['EngineRun → EngineTask', 'A requested run and its resumable work.', 'Explicit runId foreign key; one run has many tasks.'],
      ['EngineAttempt', 'Each claimed task stage and its outcome.', 'Logical taskId; attempt history is separate from the current task.'],
      ['EngineArtifact', 'Frozen captured or derived evidence with integrity checks.', 'Content-addressed ID; logical references from checkpoints and evidence payloads.'],
      ['EngineSourceContract', 'Reviewed expectations for one source document.', 'policyId identity; logical relationship to Policy.'],
      ['EnginePolicyState', 'Due time, last verified state and candidate confirmation.', 'Composite identity (policyId, mode); observe and publish are separate.'],
      ['EngineOrigin · EngineHttpCache', 'Per-origin pacing and eligible conditional representations.', 'Origin / cache-key identities; cache logically references an artifact.'],
      ['EngineReview', 'Frozen evidence, reason, decision and review history.', 'Unique taskId/evidenceKey; logical policy, artifact and change references.'],
      ['Policy · PolicyChange · EngineOutbox', 'Public baseline, committed change and deferred delivery.', 'PolicyChange → Policy is an existing FK; outbox changeId is an application reference.'],
    ],
    ledgerTitle: 'What the evidence currently establishes.',
    ledgerIntro: 'Recorded local verification, 31 October 2026. These results are a starting point for qualification, not a production accuracy score.',
    check: 'Check', result: 'Recorded result', limit: 'What remains unproven',
    checks: [
      ['Automated regression suite', '1,455 passed · 14 skipped', 'Synthetic fixtures do not measure retrieval quality on the live catalogue.'],
      ['Engine-specific tests', '120 engine regressions + 16 daily-campaign checks', 'A 500-record scheduling test is not 500 successful Internet retrievals.'],
      ['Build and static checks', 'Production build and TypeScript passed; lint had no errors', '15 pre-existing web lint warnings remain; no independent dynamic security audit is claimed.'],
      ['Administrative workflow', 'Approval and cancellation verified against an isolated database', 'One clearly labelled synthetic policy; no subscriber notifications.'],
      ['Real catalogue acquisition', '113 configured policies · 104 HTTP endpoints · 107 attempts in 91 seconds', '101 endpoints retrieved; 105 of 109 document scopes extracted. Four scopes failed retrieval/extraction; 79 extracted scopes still have unresolved structural checks. No source completeness is approved. Local Mac, no models or production writes.'],
      ['Daily observations', '1 counted window · 12 sources · 31 October', 'At least 3 distinct dates, 20 hours between windows and 48 hours overall are required. The frozen campaign has only just started; PDF language remains unverified.'],
      ['Mass recovery simulation', '500 expired leases · 4 processes · 0.83 seconds', 'Expiry was injected in an isolated local database. A crash could leave a completed run marked as active; two reproduced regressions now pass after the recovery fix. VPS and 500-source live capacity remain unqualified.'],
      ['Model-assisted code review', 'Gemini 4 High and GLM-5.3 Max reviewed frozen candidates', 'Review is not execution or certification. Subsequent fixes were tested locally.'],
    ],
    nextTitle: 'Three qualification tracks are now active.',
    nextText: 'The actual catalogue has been probed. Independent completeness annotation, daily observations and realistic capacity remain separate work in progress. A daily follow-up is scheduled for 21:00 Europe/Rome while the local execution environment is available. The target is up to 500 policies per day; this scale is not yet qualified.',
    qualification: ['Source identity and completeness', 'False change alerts and unsupported claims', 'Retrieval coverage, retries and latency', 'Model tokens and cost per changed document', 'Evidence growth, backup and restore'],
    limits: 'OCR for scanned PDFs, general PDF structure recovery, automatic source-contract onboarding and automatic evidence pruning are outside this preview. Ambiguous documents remain in review.',
    downloads: 'Download diagram', textVersion: 'Read the diagram as text', fullSize: 'Open full size', newTab: 'opens in a new tab',
    tableHint: 'Scroll horizontally to read every column. Keyboard: focus the table area and use the arrow keys.',
    diagramLegends: ['Official inputs, private working evidence and the publication boundary.', 'Green: verified outcomes. Amber: waiting or review.', 'Solid: database foreign keys. Dashed: application references.'],
    related: 'Continue exploring', links: ['Method and confidence', 'Trust and quality', 'Product roadmap'],
    relatedLanguage: 'These reference pages open in English. The methodology page also offers an Italian language switch.',
    footerNote: 'A public record of an experiment. Status will change only as new verification evidence is recorded.',
  },
  it: {
    status: 'Programma sperimentale', date: '31 ottobre 2026', kicker: 'Quaderno di progetto / 02',
    title: 'Un percorso più chiaro dalla fonte alle prove.',
    intro: 'Engine 6 Preview è in sviluppo e sperimentazione per rendere più tracciabili recupero, confronto e validazione delle policy. Questa pagina rende il progetto consultabile.',
    boundary: 'Implementazione locale · qualificazione reale da completare',
    boundaryText: 'Il servizio pubblico resta alla versione 5.2.0. La pubblicazione di questo quaderno non attiva Engine 6 e non dimostra una maggiore accuratezza sulle policy reali.',
    nav: ['Architettura', 'Flusso decisionale', 'Entità e relazioni', 'Validazione'],
    promiseTitle: 'Tre domande guidano la sperimentazione.',
    goals: [
      ['01', 'È la policy completa?', 'Verificare identità del documento, sezioni richieste, lingua e passaggio finale rispetto a un contratto di fonte revisionato.'],
      ['02', 'Quali prove sostengono la conclusione?', 'Collegare catture congelate, citazioni esatte e una verifica separata a ogni cambiamento proposto.'],
      ['03', 'Il lavoro può riprendere in sicurezza?', 'Salvare attività, tentativi e checkpoint affinché un’interruzione non cancelli i progressi né pubblichi due volte la stessa modifica.'],
    ],
    architectureTitle: 'Le prove attraversano confini espliciti.',
    architectureIntro: 'Le fonti ufficiali entrano in un’area di lavoro privata. Un record pubblico nasce solo dopo il superamento dei controlli richiesti. Recupero, analisi AI e invio hanno responsabilità separate.',
    architectureAlt: 'Architettura: le fonti ufficiali entrano in una coda persistente, nel recupero e nei controlli di fonte. Le prove congelate alimentano confronto, analisi e verifica. La revisione sospende i casi incerti. Un commit atomico crea le evidenze pubbliche, seguito da una coda separata per le notifiche.',
    architectureSteps: [
      ['Fonte ufficiale', 'HTTP diretto, HTTP/2 e un renderer browser configurato offrono percorsi di recupero con limiti. Le catture d’archivio non attestano la disponibilità live attuale.'],
      ['Lavoro e prove private', 'Attività persistenti, attese per origine, artefatti congelati e checkpoint conservano il percorso di recupero e analisi. Osservazione e pubblicazione mantengono stati distinti.'],
      ['Confine di pubblicazione', 'Le modifiche complete e supportate possono essere registrate automaticamente a impatto contenuto. L’alto impatto richiede revisione; prove mancanti o incerte restano sospese.'],
      ['Record pubblico e invio', 'Baseline, versione, modifica ed evento di notifica vengono registrati insieme. L’invio avviene dopo e ricontrolla consenso e preferenze.'],
    ],
    flowTitle: 'Una risposta HTTP riuscita avvia i controlli.',
    flowIntro: 'Il percorso di modifica richiede due catture nuove in run distinti, distanti almeno un’ora e al massimo sette giorni. Una risposta 304 può riconvalidare una rappresentazione conservata; non conferma un nuovo cambiamento.',
    flowAlt: 'Flusso decisionale: verificare contratto di fonte e documento acquisito, sospendendo le prove incomplete. Una baseline invariata registra un controllo verificato. Un candidato richiede due catture indipendenti, una baseline confrontabile, confronto per clausole, citazioni esatte e verifica. L’incertezza resta sospesa; l’alto impatto richiede revisione; l’impatto contenuto supportato può essere pubblicato.',
    flowSteps: [
      ['Verificare la fonte', 'Contratto mancante, deviazione della fonte, contenuto incompleto o lingua incerta → sospendere e registrare il motivo.'],
      ['Confrontare la baseline', 'Contenuto invariato → registrare un controllo verificato. Baseline mancante o incompatibile → revisione prima del confronto.'],
      ['Confermare il candidato', 'Una nuova cattura corrispondente, in un altro run, conferma il candidato. Un retry o una risposta condizionale 304 non valgono come seconda cattura.'],
      ['Spiegare ogni blocco modificato', 'L’analista deve coprire tutti i delta con citazioni esatte prima/dopo. Un verificatore separato controlla ogni affermazione e le due versioni linguistiche.'],
      ['Applicare il controllo di pubblicazione', 'Affermazioni incerte o non supportate → sospensione. Alto impatto verificato → revisione umana. Modifiche complete, supportate e a impatto contenuto → commit atomico se la pubblicazione è abilitata.'],
    ],
    reviewNote: 'L’approvazione umana non sostituisce le prove mancanti. Le riparazioni di fonte o baseline hanno un percorso di revisione dedicato. Una differenza di sola presentazione nell’estrazione non diventa un avviso di modifica della policy del provider.',
    modeTitle: 'L’osservazione resta privata.',
    modeText: 'L’osservazione può registrare risultati senza modificare la baseline pubblica. Pubblicazione e invio delle notifiche si abilitano separatamente. Un run salvato può essere annullato conservando prove e tentativi precedenti.',
    erTitle: 'Le relazioni dietro una modifica registrata.',
    erIntro: 'Mappa concettuale dello schema implementato nella preview. La linea continua indica una chiave esterna esplicita nel database; le linee tratteggiate sono riferimenti gestiti dall’applicazione, inclusi gli identificatori nei checkpoint e nelle prove.',
    erAlt: 'Mappa delle entità: EngineRun ed EngineTask sono collegati da una chiave esterna uno-a-molti. Riferimenti logici tratteggiati collegano attività, tentativi, artefatti, contratti di fonte, stato policy per modalità, revisioni, cache, pianificazione per origine, modifiche pubbliche e notifiche.',
    entity: 'Entità', responsibility: 'Che cosa registra', relationship: 'Relazione / identità',
    entities: [
      ['EngineRun → EngineTask', 'Una scansione richiesta e le sue attività riprendibili.', 'Chiave esterna esplicita runId; un run contiene più attività.'],
      ['EngineAttempt', 'Ogni assegnazione di una fase e il suo esito.', 'taskId logico; lo storico dei tentativi è separato dall’attività corrente.'],
      ['EngineArtifact', 'Prove acquisite o derivate, congelate e controllate per integrità.', 'ID basato sul contenuto; riferimenti logici nei checkpoint e nelle prove.'],
      ['EngineSourceContract', 'Aspettative revisionate per uno specifico documento.', 'Identità policyId; relazione logica con Policy.'],
      ['EnginePolicyState', 'Scadenza, ultima verifica e conferma del candidato.', 'Identità composta (policyId, mode); observe e publish sono separati.'],
      ['EngineOrigin · EngineHttpCache', 'Attese per origine e rappresentazioni condizionali idonee.', 'Identità per origine / chiave cache; riferimento logico della cache a un artefatto.'],
      ['EngineReview', 'Prove congelate, motivo, decisione e storico delle revisioni.', 'taskId/evidenceKey univoci; riferimenti logici a policy, artefatti e modifica.'],
      ['Policy · PolicyChange · EngineOutbox', 'Baseline pubblica, modifica registrata e invio differito.', 'PolicyChange → Policy è una FK esistente; changeId dell’outbox è un riferimento applicativo.'],
    ],
    ledgerTitle: 'Che cosa dimostrano oggi le verifiche.',
    ledgerIntro: 'Verifiche locali registrate il 31 ottobre 2026. Questi risultati sono una base per la qualificazione, non un punteggio di accuratezza in produzione.',
    check: 'Controllo', result: 'Risultato registrato', limit: 'Che cosa resta da dimostrare',
    checks: [
      ['Suite automatica di regressione', '1.455 superati · 14 esclusi', 'Le fixture sintetiche non misurano la qualità del recupero sul catalogo reale.'],
      ['Test specifici del motore', '120 regressioni del motore + 16 controlli della campagna giornaliera', 'Un test di pianificazione con 500 record non equivale a 500 recuperi Internet riusciti.'],
      ['Build e controlli statici', 'Build di produzione e TypeScript superati; lint senza errori', 'Restano 15 warning web preesistenti; nessun audit dinamico indipendente di sicurezza è attestato.'],
      ['Flusso amministrativo', 'Approvazione e annullamento verificati su DB isolato', 'Una policy sintetica esplicitamente indicata; nessun invio agli iscritti.'],
      ['Recupero del catalogo reale', '113 policy configurate · 104 indirizzi HTTP · 107 tentativi in 91 secondi', '101 indirizzi recuperati; 105 dei 109 ambiti documentali estratti. Quattro ambiti bloccati nel recupero/estrazione; 79 estrazioni hanno controlli strutturali irrisolti. Nessuna fonte approvata per completezza. Prova sul Mac, senza modelli o scritture in produzione.'],
      ['Osservazioni giornaliere', '1 finestra conteggiata · 12 fonti · 31 ottobre', 'Servono almeno 3 date distinte, 20 ore tra finestre e 48 ore complessive. La campagna congelata è appena iniziata; la lingua del PDF resta da verificare.'],
      ['Simulazione del recupero massivo', '500 assegnazioni scadute · 4 processi · 0,83 secondi', 'Scadenza introdotta artificialmente in un database locale isolato. Un crash poteva lasciare attiva una scansione già conclusa: due regressioni riprodotte sono ora corrette. VPS e capacità su 500 fonti live restano da qualificare.'],
      ['Revisione del codice con modelli', 'Gemini 4 High e GLM-5.3 Max hanno revisionato candidati congelati', 'La revisione non è esecuzione né certificazione. Le correzioni successive sono state testate localmente.'],
    ],
    nextTitle: 'Tre percorsi di qualificazione sono attivi.',
    nextText: 'Il catalogo reale è stato sottoposto a prova. Annotazione indipendente della completezza, osservazioni giornaliere e capacità reale restano attività distinte in corso. Il seguito giornaliero è programmato alle 21:00 Europe/Rome quando l’ambiente locale è disponibile. L’obiettivo è fino a 500 policy al giorno; questa scala non è ancora qualificata.',
    qualification: ['Identità e completezza delle fonti', 'Falsi cambiamenti e affermazioni non supportate', 'Copertura, retry e latenza del recupero', 'Token e costo per documento modificato', 'Crescita delle prove, backup e ripristino'],
    limits: 'OCR dei PDF scansiti, ricostruzione generale della struttura PDF, configurazione automatica dei contratti di fonte e cancellazione automatica delle prove sono fuori da questa preview. I documenti ambigui restano in revisione.',
    downloads: 'Scarica il diagramma', textVersion: 'Leggi il diagramma in forma testuale', fullSize: 'Apri a piena dimensione', newTab: 'si apre in una nuova scheda',
    tableHint: 'Scorri in orizzontale per leggere tutte le colonne. Da tastiera: seleziona l’area della tabella e usa le frecce.',
    diagramLegends: ['Fonti ufficiali, prove di lavoro private e confine di pubblicazione.', 'Verde: esiti verificati. Ambra: attesa o revisione.', 'Continua: chiavi esterne nel DB. Tratteggiata: riferimenti applicativi.'],
    related: 'Continua a esplorare', links: ['Metodo e confidence', 'Qualità e fiducia', 'Roadmap del prodotto'],
    relatedLanguage: 'Questi approfondimenti si aprono in inglese. La metodologia offre anche un selettore per la lingua italiana.',
    footerNote: 'Un resoconto pubblico di una sperimentazione. Lo stato cambierà con la registrazione di nuove prove di verifica.',
  },
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lang = publicLanguage((await searchParams).lang);
  return withSocialMetadata({ title: 'Engine 6 Preview | PolicyWatcher', description: copy[lang].intro,
    alternates: languageAlternates('/engine-6-preview', lang) }, lang);
}

export default async function EnginePreviewPage({ searchParams }: Props) {
  const lang = publicLanguage((await searchParams).lang);
  const t = copy[lang];
  const sections = ['architecture', 'decision-flow', 'entities', 'validation'];
  const diagram = (name: string, alt: string, width: number, height: number) => (
    <figure className={styles.diagram}>
      <Image src={`/engine-6-preview/${name}-${lang}.svg`} alt={alt} width={width} height={height} unoptimized />
      <figcaption>
        <span>{t.diagramLegends[['architecture', 'decision-flow', 'entities'].indexOf(name)]}</span>
        <div className={styles.diagramActions}>
          <a href={`/engine-6-preview/${name}-${lang}.svg`} target="_blank" rel="noopener noreferrer" aria-label={`${t.fullSize} (${t.newTab})`}>{t.fullSize}<ArrowUpRight size={15} aria-hidden="true" /></a>
          <a href={`/engine-6-preview/${name}-${lang}.svg`} download><Download size={15} aria-hidden="true" />{t.downloads} <span className={styles.format}>SVG</span></a>
        </div>
      </figcaption>
    </figure>
  );
  return <>
    <PublicHeader current="roadmap" lang={lang} lockLang />
    <main className={styles.page} id="engine-preview-main">
      <div className={styles.masthead}>
        <span><FlaskConical size={16} aria-hidden="true" />{t.status}</span>
        <time dateTime="2026-10-31">{t.date}</time>
        <nav aria-label={lang === 'it' ? 'Lingua della pagina' : 'Page language'}><Link href="/engine-6-preview" hrefLang="en" aria-current={lang === 'en' ? 'page' : undefined}>EN</Link><Link href="/engine-6-preview?lang=it" hrefLang="it" aria-current={lang === 'it' ? 'page' : undefined}>IT</Link></nav>
      </div>
      <header className={styles.hero}>
        <div><p className={styles.eyebrow}>{t.kicker}</p><h1>Engine <span>6</span><small>Preview</small></h1></div>
        <div className={styles.heroCopy}><h2>{t.title}</h2><p>{t.intro}</p><a href="#architecture" className={styles.explore}>{t.nav[0]} <ArrowDown size={18} aria-hidden="true" /></a></div>
      </header>
      <aside className={styles.boundary}><FlaskConical size={22} aria-hidden="true" /><div><strong>{t.boundary}</strong><p>{t.boundaryText}</p></div></aside>
      <nav className={styles.sectionNav} aria-label={lang === 'it' ? 'Indice del progetto' : 'Notebook contents'}>{sections.map((id, i) => <a href={`#${id}`} key={id}><span>0{i + 1}</span>{t.nav[i]}</a>)}</nav>
      <section className={styles.goals} aria-labelledby="preview-goals"><h2 id="preview-goals">{t.promiseTitle}</h2><div>{t.goals.map(([n, title, body]) => <article key={n}><span>{n}</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>
      <section className={styles.section} id="architecture" aria-labelledby="architecture-title"><div className={styles.sectionHeading}><p className={styles.eyebrow}>01 / {t.nav[0]}</p><h2 id="architecture-title">{t.architectureTitle}</h2><p>{t.architectureIntro}</p></div>
        {diagram('architecture', t.architectureAlt, 1200, 600)}
        <details className={styles.textAlternative}><summary>{t.textVersion}</summary><ol>{t.architectureSteps.map(([title, body]) => <li key={title}><strong>{title}</strong><p>{body}</p></li>)}</ol></details>
      </section>
      <section className={styles.section} id="decision-flow" aria-labelledby="flow-title"><div className={styles.sectionHeading}><p className={styles.eyebrow}>02 / {t.nav[1]}</p><h2 id="flow-title">{t.flowTitle}</h2><p>{t.flowIntro}</p></div>
        {diagram('decision-flow', t.flowAlt, 1200, 940)}
        <ol className={styles.flowText}>{t.flowSteps.map(([title, body], i) => <li key={title}><span>{i + 1}</span><div><h3>{title}</h3><p>{body}</p></div></li>)}</ol>
        <p className={styles.reviewNote}><ShieldCheck size={21} aria-hidden="true" />{t.reviewNote}</p>
        <aside className={styles.modeNote}><GitBranch size={24} aria-hidden="true" /><div><h3>{t.modeTitle}</h3><p>{t.modeText}</p></div></aside>
      </section>
      <section className={styles.section} id="entities" aria-labelledby="entities-title"><div className={styles.sectionHeading}><p className={styles.eyebrow}>03 / {t.nav[2]}</p><h2 id="entities-title">{t.erTitle}</h2><p>{t.erIntro}</p></div>
        {diagram('entities', t.erAlt, 1200, 840)}
        <p className={styles.tableHint} id="entities-scroll-hint">{t.tableHint} <span aria-hidden="true">↔</span></p>
        <div className={styles.tableWrap} role="region" aria-labelledby="entities-title" aria-describedby="entities-scroll-hint" tabIndex={0}><table><caption>{t.erTitle}</caption><thead><tr><th scope="col">{t.entity}</th><th scope="col">{t.responsibility}</th><th scope="col">{t.relationship}</th></tr></thead><tbody>{t.entities.map(([entity, responsibility, relationship]) => <tr key={entity}><th scope="row">{entity}</th><td>{responsibility}</td><td>{relationship}</td></tr>)}</tbody></table></div>
      </section>
      <section className={styles.section} id="validation" aria-labelledby="validation-title"><div className={styles.sectionHeading}><p className={styles.eyebrow}>04 / {t.nav[3]}</p><h2 id="validation-title">{t.ledgerTitle}</h2><p>{t.ledgerIntro}</p></div>
        <div className={styles.ledger}>{t.checks.map(([check, result, limit]) => <article key={check}><h3>{check}</h3><div><strong>{result}</strong><p>{limit}</p></div></article>)}</div>
        <div className={styles.qualification}><div><span className={styles.pendingLabel}>{lang === 'it' ? 'Da qualificare' : 'Qualification pending'}</span><h3>{t.nextTitle}</h3><p>{t.nextText}</p></div><ul>{t.qualification.map(item => <li key={item}>{item}</li>)}</ul></div><p className={styles.limits}>{t.limits}</p>
      </section>
      <footer className={styles.notebookFooter}><p>{t.footerNote}</p><div><nav aria-label={t.related}>{['/methodology/confidence', '/trust', '/roadmap'].map((href, i) => <Link key={href} href={href} hrefLang="en">{t.links[i]}<span className={styles.languageBadge}>EN</span><ArrowUpRight size={16} aria-hidden="true" /></Link>)}</nav><p className={styles.relatedLanguage}>{t.relatedLanguage}</p></div></footer>
    </main>
    <Footer lang={lang} lockLang />
  </>;
}
