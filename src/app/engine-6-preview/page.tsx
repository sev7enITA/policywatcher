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
    status: 'Experimental programme', date: '2 November 2026', kicker: 'Engineering notebook / 05',
    title: 'A clearer path from source to evidence.',
    intro: 'Engine 6 Preview is being developed and tested to make policy retrieval, comparison and validation more traceable. This page opens the design for inspection.',
    boundary: 'Private preview access / staging environment',
    boundaryText: 'PolicyWatcher 5.5.0 includes access to the experimental Engine 6.0 Preview. Engine 6 trials use a separate staging environment with administrator authentication and private observations. Qualification remains open.',
    hostingStatus: 'The private 6.0 Preview is online. 47 checks passed on the actual hosting, including a live Apple capture and unchanged official records. Access requires administrator authentication.',
    access: 'Open private 6.0 Preview', resources: 'Preview access, code and evidence',
    development: 'Engine 6 source on main', wiki: 'GitHub wiki', reports: 'Verification reports',
    isolation: 'The preview uses a dedicated database within the same hosting account. This is logical separation, not independent infrastructure isolation.',
    nav: ['Architecture', 'Decision flow', 'Entity relationships', 'Validation'],
    promiseTitle: 'Three questions guide the experiment.',
    goals: [
      ['01', 'Is this the complete policy?', 'Check the document identity, required sections, language and final passage against a reviewed source contract.'],
      ['02', 'What supports this conclusion?', 'Keep frozen captures, exact quotations and a separate verification step connected to each proposed change.'],
      ['03', 'Can the work recover safely?', 'Save tasks, attempts and checkpoints so interruption does not erase progress or publish a change twice.'],
    ],
    architectureTitle: 'Evidence moves through explicit boundaries.',
    architectureIntro: 'Official sources enter a private working area. This diagram documents the full engine architecture, including its publication boundary. The private preview records observations with publication and delivery disabled. Retrieval, AI analysis and delivery have separate responsibilities.',
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
    modeTitle: 'Stable on the main service. Private preview in staging.',
    modeText: 'Authenticated administrators can select Preview or Compare for isolated trials, with at most 50 policies per batch. Both modes use observe and silent: publication and notifications are disabled, and official baselines and history are preserved. Stable scanning remains on the main service and is unavailable in the preview. Compare applies both extractors to one decoded capture; it does not compare acquisition performance or AI models.',
    erTitle: 'The relationships behind a recorded change.',
    erIntro: 'This is a conceptual map of the implemented preview schema. A solid line is an explicit database foreign key; dashed lines are application-managed references, including identifiers in checkpoints and evidence payloads.',
    erAlt: 'Entity map showing EngineRun and EngineTask connected by an explicit one-to-many foreign key. Dashed logical references connect tasks, attempts, artifacts, source contracts, per-mode policy state, reviews, cache, origin scheduling, public changes and outbox events.',
    entity: 'Entity', responsibility: 'What it records', relationship: 'Relationship / identity',
    entities: [
      ['EngineRun → EngineTask', 'A requested run, immutable channel/configuration metadata and its resumable work.', 'Explicit runId foreign key; one run has many tasks.'],
      ['EngineAttempt', 'Each claimed task stage and its outcome.', 'Logical taskId; attempt history is separate from the current task.'],
      ['EngineArtifact', 'Frozen captured or derived evidence with integrity checks.', 'Content-addressed ID; logical references from checkpoints and evidence payloads.'],
      ['EngineSourceContract', 'Reviewed expectations for one source document.', 'policyId identity; logical relationship to Policy.'],
      ['EnginePolicyState', 'Due time, last verified state and candidate confirmation.', 'Composite identity (policyId, mode); observe and publish are separate.'],
      ['EngineOrigin · EngineHttpCache', 'Per-origin pacing and eligible conditional representations.', 'Origin / cache-key identities; cache logically references an artifact.'],
      ['EngineReview', 'Frozen evidence, reason, decision and review history.', 'Unique taskId/evidenceKey; logical policy, artifact and change references.'],
      ['Policy · PolicyChange · EngineOutbox', 'Public baseline, committed change and deferred delivery.', 'PolicyChange → Policy is an existing FK; outbox changeId is an application reference.'],
    ],
    ledgerTitle: 'What the evidence currently establishes.',
    ledgerIntro: 'Recorded verification, updated 2 November 2026 at 21:03 Europe/Rome. Historical regression and campaign results are retained. Local production-mode and generated standalone-server checks are reported separately from hosted verification and production accuracy.',
    check: 'Check', result: 'Recorded result', limit: 'What remains unproven',
    checks: [
      ['Table-encoding follow-up candidate', '1,569 local tests passed · 14 skipped, including four new table regressions', 'An initial CI failure caught a stale whole-engine manifest; it was regenerated without weakening the guard. The encoding correction is separate from the hosted artifact and requires a new live cohort. No injection exploit was established.'],
      ['Actual private hosted Preview', '47 checks passed; Apple HTTP 200 and a completed private comparison', 'One source contract was eligible; three other policies remained held. Public records and notifications were unchanged. An earlier read timeout is retained; sustained hosting availability and full coverage remain unqualified.'],
      ['Hosted-build candidate regression', '1,565 passed · 14 skipped; 22 generated standalone-server checks passed locally', 'Standalone startup, HTTP/worker identity and missing-flag privacy verified. The first hosted build failure and the corrected local harness failure remain recorded. This row does not establish online availability.'],
      ['Private preview HTTP and worker checks', '44 checks passed in an actual local production-mode Next runtime', 'Authentication boundaries, shared HTTP/worker identity and observe/silent restrictions were checked. Initial HTTP shells do not demonstrate hydrated browser controls; these local checks do not verify hosted deployment.'],
      ['Live Apple privacy capture', 'HTTP 200 · eligible against the reviewed contract · 28,124 preview characters versus 2,089 stable characters', 'Both extractors used the same response. Outcome: confirmation_pending. No AI calls; official policy, baseline, public history and outbox records were unchanged. More characters do not prove completeness or correctness.'],
      ['Recovery after an actual SIGKILL', 'New worker ownership after 91.7 seconds; queued work completed and the earlier report survived', 'The process was killed after the live run had completed. This checks persisted queued work and leadership expiry, not interruption during a network fetch. Official records and notification events remained unchanged.'],
      ['Automated regression suite', '1,469 passed · 14 skipped', 'Synthetic fixtures do not measure retrieval quality on the live catalogue.'],
      ['Engine-specific tests', '120 engine regressions + 16 daily-campaign checks', 'A 500-record scheduling test is not 500 successful Internet retrievals.'],
      ['Build and static checks', 'Production build and TypeScript passed; lint had no errors', '15 pre-existing web lint warnings remain; no independent dynamic security audit is claimed.'],
      ['Administrative workflow', 'Approval and cancellation verified against an isolated database', 'One clearly labelled synthetic policy; no subscriber notifications.'],
      ['Manual scan channels', '14 boundary tests passed; selector, private report and JSON export verified in the browser', 'Two synthetic local policies: one extraction difference and one unavailable comparison. All policy fields preserved; zero official changes, check logs or notification events. Matching text would still leave completeness unqualified.'],
      ['Real catalogue acquisition', '113 configured policies · 104 HTTP endpoints · 107 attempts in 91 seconds', '101 endpoints retrieved; 105 of 109 document scopes extracted. Four scopes failed retrieval/extraction; 79 extracted scopes still have unresolved structural checks. No source completeness is approved. Local Mac, no models or production writes.'],
      ['Current parser daily campaign', 'Day 1 of 3 · 12/12 HTTP 200 · 35.3 seconds · 2 November', 'First completed live window of the frozen table-escaping candidate, separate from main and the hosted Preview. No retries or 304 responses. The 48-hour span is not yet met; PDF language and source completeness remain unqualified. HTTP success does not establish origin freshness.'],
      ['Previous parser daily observations', '2 counted windows · 12 sources · 31 October and 1 November, preserved', 'This earlier cohort remains incomplete and belongs to the previous parser. Its minimum observed span is 20.77 hours. At least 3 distinct dates, 20 hours between windows and 48 hours overall are required. PDF language remains unverified.'],
      ['Mass recovery simulation', '500 expired leases · 4 processes · 0.83 seconds', 'Expiry was injected in an isolated local database. A crash could leave a completed run marked as active; two reproduced regressions now pass after the recovery fix. VPS and 500-source live capacity remain unqualified.'],
      ['Model-assisted code review', 'Gemini 4 High and GLM-5.3 Max reviewed frozen candidates', 'Review is not execution or certification. Subsequent fixes were tested locally.'],
    ],
    nextTitle: 'Three qualification tracks are now active.',
    nextText: 'The actual catalogue has been probed. Independent completeness annotation, daily observations and realistic capacity remain separate work in progress. Daily follow-ups run from 21:00 Europe/Rome while the local environment is available. The third window must start after 21:03:43 on 4 November to satisfy the actual 48-hour span. The target is up to 500 policies per day; this scale is not yet qualified.',
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
    status: 'Programma sperimentale', date: '2 novembre 2026', kicker: 'Quaderno di progetto / 05',
    title: 'Un percorso più chiaro dalla fonte alle prove.',
    intro: 'Engine 6 Preview è in sviluppo e sperimentazione per rendere più tracciabili recupero, confronto e validazione delle policy. Questa pagina rende il progetto consultabile.',
    boundary: 'Accesso alla preview privata / ambiente staging',
    boundaryText: 'PolicyWatcher 5.5.0 include l’accesso al nuovo Engine 6.0 Preview sperimentale. Le prove Engine 6 usano un ambiente staging separato, con autenticazione amministratore e osservazioni private. La qualificazione resta aperta.',
    hostingStatus: 'La 6.0 Preview privata è online. Superati 47 controlli sul vero hosting, con cattura Apple live e record ufficiali invariati. L’accesso richiede autenticazione amministratore.',
    access: 'Apri la 6.0 Preview privata', resources: 'Accesso alla preview, codice e prove',
    development: 'Codice Engine 6 su main', wiki: 'Wiki GitHub', reports: 'Rapporti di verifica',
    isolation: 'La preview usa un database dedicato nello stesso account di hosting. La separazione è logica, non equivale a un’infrastruttura indipendente.',
    nav: ['Architettura', 'Flusso decisionale', 'Entità e relazioni', 'Validazione'],
    promiseTitle: 'Tre domande guidano la sperimentazione.',
    goals: [
      ['01', 'È la policy completa?', 'Verificare identità del documento, sezioni richieste, lingua e passaggio finale rispetto a un contratto di fonte revisionato.'],
      ['02', 'Quali prove sostengono la conclusione?', 'Collegare catture congelate, citazioni esatte e una verifica separata a ogni cambiamento proposto.'],
      ['03', 'Il lavoro può riprendere in sicurezza?', 'Salvare attività, tentativi e checkpoint affinché un’interruzione non cancelli i progressi né pubblichi due volte la stessa modifica.'],
    ],
    architectureTitle: 'Le prove attraversano confini espliciti.',
    architectureIntro: 'Le fonti ufficiali entrano in un’area di lavoro privata. Il diagramma descrive l’intera architettura del motore, incluso il confine di pubblicazione. La preview privata registra osservazioni con pubblicazione e invio disabilitati. Recupero, analisi AI e invio hanno responsabilità separate.',
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
    modeTitle: 'Stabile sul servizio principale. Preview privata in staging.',
    modeText: 'Gli amministratori autenticati possono selezionare Preview o Compare per prove isolate, con un massimo di 50 policy per scansione. Entrambe le modalità usano observe e silent: pubblicazione e notifiche sono disabilitate, baseline ufficiali e storico vengono preservati. La scansione Stabile resta sul servizio principale e non è disponibile nella preview. Compare applica i due estrattori a una sola cattura decodificata; non confronta le prestazioni di acquisizione o i modelli AI.',
    erTitle: 'Le relazioni dietro una modifica registrata.',
    erIntro: 'Mappa concettuale dello schema implementato nella preview. La linea continua indica una chiave esterna esplicita nel database; le linee tratteggiate sono riferimenti gestiti dall’applicazione, inclusi gli identificatori nei checkpoint e nelle prove.',
    erAlt: 'Mappa delle entità: EngineRun ed EngineTask sono collegati da una chiave esterna uno-a-molti. Riferimenti logici tratteggiati collegano attività, tentativi, artefatti, contratti di fonte, stato policy per modalità, revisioni, cache, pianificazione per origine, modifiche pubbliche e notifiche.',
    entity: 'Entità', responsibility: 'Che cosa registra', relationship: 'Relazione / identità',
    entities: [
      ['EngineRun → EngineTask', 'Una scansione richiesta, metadati immutabili di canale/configurazione e attività riprendibili.', 'Chiave esterna esplicita runId; un run contiene più attività.'],
      ['EngineAttempt', 'Ogni assegnazione di una fase e il suo esito.', 'taskId logico; lo storico dei tentativi è separato dall’attività corrente.'],
      ['EngineArtifact', 'Prove acquisite o derivate, congelate e controllate per integrità.', 'ID basato sul contenuto; riferimenti logici nei checkpoint e nelle prove.'],
      ['EngineSourceContract', 'Aspettative revisionate per uno specifico documento.', 'Identità policyId; relazione logica con Policy.'],
      ['EnginePolicyState', 'Scadenza, ultima verifica e conferma del candidato.', 'Identità composta (policyId, mode); observe e publish sono separati.'],
      ['EngineOrigin · EngineHttpCache', 'Attese per origine e rappresentazioni condizionali idonee.', 'Identità per origine / chiave cache; riferimento logico della cache a un artefatto.'],
      ['EngineReview', 'Prove congelate, motivo, decisione e storico delle revisioni.', 'taskId/evidenceKey univoci; riferimenti logici a policy, artefatti e modifica.'],
      ['Policy · PolicyChange · EngineOutbox', 'Baseline pubblica, modifica registrata e invio differito.', 'PolicyChange → Policy è una FK esistente; changeId dell’outbox è un riferimento applicativo.'],
    ],
    ledgerTitle: 'Che cosa dimostrano oggi le verifiche.',
    ledgerIntro: 'Verifiche aggiornate al 2 novembre 2026, ore 21:03 Europe/Rome. I risultati storici delle regressioni e della campagna sono conservati. Le verifiche locali in modalità produzione e sul server standalone generato sono distinte dalle prove di hosting e dall’accuratezza in produzione.',
    check: 'Controllo', result: 'Risultato registrato', limit: 'Che cosa resta da dimostrare',
    checks: [
      ['Candidato con correzione delle tabelle', '1.569 test locali superati · 14 esclusi, incluse quattro nuove regressioni sulle tabelle', 'La prima CI ha rilevato un manifest dell’engine non aggiornato, poi rigenerato mantenendo il controllo di integrità. La correzione è separata dal pacchetto online e richiede una nuova coorte live. Nessun exploit di injection dimostrato.'],
      ['Preview privata sul vero hosting', '47 controlli superati; Apple HTTP 200 e confronto privato completato', 'Una fonte idonea rispetto al contratto; altre tre policy sospese. Record pubblici e notifiche invariati. Conservato un precedente timeout di lettura; continuità del servizio e copertura completa restano da qualificare.'],
      ['Regressione del candidato per hosting', '1.565 superati · 14 esclusi; 22 controlli locali sul server standalone generato superati', 'Verificati avvio standalone, identità HTTP/worker e privacy senza flag di attivazione. Conservati il primo errore di build online e il controllo locale corretto. Questa riga non attesta la disponibilità online.'],
      ['Controlli HTTP e worker della preview privata', '44 controlli superati su un runtime Next reale, locale e in modalità produzione', 'Verificati autenticazione, identità condivisa tra HTTP e worker e vincoli observe/silent. Le risposte HTML iniziali non dimostrano i controlli interattivi nel browser; questi controlli locali non verificano il rilascio online.'],
      ['Cattura live della privacy Apple', 'HTTP 200 · idonea rispetto al contratto revisionato · 28.124 caratteri nella preview contro 2.089 nello stabile', 'I due estrattori hanno usato la stessa risposta. Esito: confirmation_pending. Nessuna chiamata AI; policy ufficiali, baseline, storico pubblico e outbox invariati. Un testo più lungo non dimostra completezza o correttezza.'],
      ['Ripresa dopo un SIGKILL reale', 'Nuovo worker operativo dopo 91,7 secondi; attività in coda concluse e rapporto precedente conservato', 'Il processo è stato terminato dopo la conclusione della scansione live. La prova verifica persistenza della coda e scadenza dell’assegnazione al worker, non un’interruzione durante il recupero di rete. Record ufficiali ed eventi di notifica invariati.'],
      ['Suite automatica di regressione', '1.469 superati · 14 esclusi', 'Le fixture sintetiche non misurano la qualità del recupero sul catalogo reale.'],
      ['Test specifici del motore', '120 regressioni del motore + 16 controlli della campagna giornaliera', 'Un test di pianificazione con 500 record non equivale a 500 recuperi Internet riusciti.'],
      ['Build e controlli statici', 'Build di produzione e TypeScript superati; lint senza errori', 'Restano 15 warning web preesistenti; nessun audit dinamico indipendente di sicurezza è attestato.'],
      ['Flusso amministrativo', 'Approvazione e annullamento verificati su DB isolato', 'Una policy sintetica esplicitamente indicata; nessun invio agli iscritti.'],
      ['Canali di scansione manuale', '14 test dei confini superati; selettore, rapporto privato ed esportazione JSON verificati nel browser', 'Due policy sintetiche locali: una differenza di estrazione e un confronto indisponibile. Tutti i campi delle policy preservati; zero modifiche, log di controllo ufficiali o eventi di notifica. Anche testi identici lasciano la completezza da qualificare.'],
      ['Recupero del catalogo reale', '113 policy configurate · 104 indirizzi HTTP · 107 tentativi in 91 secondi', '101 indirizzi recuperati; 105 dei 109 ambiti documentali estratti. Quattro ambiti bloccati nel recupero/estrazione; 79 estrazioni hanno controlli strutturali irrisolti. Nessuna fonte approvata per completezza. Prova sul Mac, senza modelli o scritture in produzione.'],
      ['Campagna giornaliera del parser corrente', 'Giorno 1 di 3 · 12/12 HTTP 200 · 35,3 secondi · 2 novembre', 'Prima finestra live completata del candidato congelato con correzione delle tabelle, distinto da main e dalla Preview ospitata. Nessun retry o risposta 304. Le 48 ore non sono ancora raggiunte; lingua del PDF e completezza restano da qualificare. Un HTTP riuscito non dimostra la freschezza all’origine.'],
      ['Osservazioni del parser precedente', '2 finestre conteggiate · 12 fonti · 31 ottobre e 1 novembre, conservate', 'Questa coorte precedente resta incompleta e appartiene al vecchio parser. Intervallo minimo osservato: 20,77 ore. Servono almeno 3 date distinte, 20 ore tra finestre e 48 ore complessive. La lingua del PDF resta da verificare.'],
      ['Simulazione del recupero massivo', '500 assegnazioni scadute · 4 processi · 0,83 secondi', 'Scadenza introdotta artificialmente in un database locale isolato. Un crash poteva lasciare attiva una scansione già conclusa: due regressioni riprodotte sono ora corrette. VPS e capacità su 500 fonti live restano da qualificare.'],
      ['Revisione del codice con modelli', 'Gemini 4 High e GLM-5.3 Max hanno revisionato candidati congelati', 'La revisione non è esecuzione né certificazione. Le correzioni successive sono state testate localmente.'],
    ],
    nextTitle: 'Tre percorsi di qualificazione sono attivi.',
    nextText: 'Il catalogo reale è stato sottoposto a prova. Annotazione indipendente della completezza, osservazioni giornaliere e capacità reale restano attività distinte in corso. Il seguito giornaliero parte dalle 21:00 Europe/Rome quando l’ambiente locale è disponibile. La terza finestra deve iniziare dopo le 21:03:43 del 4 novembre per rispettare le 48 ore effettive. L’obiettivo è fino a 500 policy al giorno; questa scala non è ancora qualificata.',
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
  return withSocialMetadata({ title: 'PolicyWatcher 5.5 · Engine 6 Preview', description: copy[lang].intro,
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
        <time dateTime="2026-11-01">{t.date}</time>
        <nav aria-label={lang === 'it' ? 'Lingua della pagina' : 'Page language'}><Link href="/engine-6-preview" hrefLang="en" aria-current={lang === 'en' ? 'page' : undefined}>EN</Link><Link href="/engine-6-preview?lang=it" hrefLang="it" aria-current={lang === 'it' ? 'page' : undefined}>IT</Link></nav>
      </div>
      <header className={styles.hero}>
        <div><p className={styles.eyebrow}>{t.kicker}</p><h1>Engine <span>6</span><small>Preview</small></h1></div>
        <div className={styles.heroCopy}><h2>{t.title}</h2><p>{t.intro}</p><a href="#architecture" className={styles.explore}>{t.nav[0]} <ArrowDown size={18} aria-hidden="true" /></a></div>
      </header>
      <aside className={styles.boundary}><FlaskConical size={22} aria-hidden="true" /><div><strong>{t.boundary}</strong><p>{t.boundaryText}</p><p>{t.hostingStatus}</p><a className={styles.explore} href="https://staging.policywatcher.online/admin/engine">{t.access}<ArrowUpRight size={18} aria-hidden="true" /></a><p>{t.isolation}</p></div></aside>
      <nav className={styles.sectionNav} aria-label={t.resources}><a href="https://github.com/sev7enITA/policywatcher/tree/main">{t.development}<ArrowUpRight size={16} aria-hidden="true" /></a><a href="https://github.com/sev7enITA/policywatcher/wiki">{t.wiki}<ArrowUpRight size={16} aria-hidden="true" /></a><a href="https://github.com/sev7enITA/policywatcher/tree/main/docs/reports">{t.reports}<ArrowUpRight size={16} aria-hidden="true" /></a></nav>
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
