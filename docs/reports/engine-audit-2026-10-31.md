# PolicyWatcher: diagnosi del motore e base della prossima major

Data: 31 ottobre 2026, Europe/Rome. Stato: analisi e riproduzioni locali; nessuna modifica al motore distribuito.

## Conclusione

Il batch osservato non dimostra che il recupero fallisca in generale. Dimostra che il sistema confonde alcune misure di acquisizione con la possibilità di confrontare una policy, nasconde blocchi nel riepilogo e può riprocessare continuamente documenti sospesi. La validazione del contenuto e dell'analisi richiede inoltre criteri più forti delle sole euristiche e della conformità JSON. Una major sostanziale deve rendere persistente e verificabile l'intera catena, dalla pianificazione alla pubblicazione.

La direzione proposta è un motore per fonte/documento, con coda durevole, acquisizione selettiva, artefatti immutabili, estrazione strutturata versionata, confronto per clausola, analisi con citazioni verificabili e pubblicazione separata. Il progetto operativo è in [engine-major-design-2026-10-31.md](../architecture/engine-major-design-2026-10-31.md).

## Evidenze e perimetro

- Log fornito dall'owner, pannelli autenticati Cron Manager e Source Reliability e API pubblica del cambiamento AWS del batch, letti senza avviare nuove scansioni o modificare dati.
- Inventario visibile: **113 policy, 18 aziende**. Il batch comprende 50 record, circa il 44% dell'inventario; non è una misura della copertura delle fonti ufficiali esistenti.
- Codice esaminato: `/Users/fabriziodegni/Projects/PolicyWatcher-public-update-20261026`, commit `680c0e549c369f8cc8db7ea8aaeca3b3ac56903e`, versione dichiarata 5.2.0. La cartella Desktop contiene una versione precedente. I sintomi osservati nella UI hanno percorsi corrispondenti nel codice locale; **non è verificato l'hash esatto del codice attualmente distribuito**.
- Evidenze locali: `output/engine-audit-2026-10-31/`. Comprendono copia del log, tabella UI, osservazioni strutturate, impronte dei file, dossier dei revisori e risultati dei test. Questi file sono esclusi da Git; includono informazioni operative e restano locali.
- Nessuna misura nuova di accuratezza semantica, tempi completi di produzione, costo per documento o efficacia complessiva. Nessun reset delle baseline, modifica al database live, invio di notifiche, build o deploy.

### Riconciliazione della scansione

| Esito nella tabella | Record | Significato verificabile |
| --- | ---: | --- |
| UNCHANGED | 42 | L'hash estratto è uguale alla baseline secondo il percorso corrente |
| CONFIRMATION_PENDING | 4 | Hash candidato in attesa della successiva osservazione valida |
| CHANGED | 1 | Il motore ha confermato e analizzato un cambiamento; verifica circoscritta delle versioni e dell'output AWS riportata sotto |
| NEEDS_REVIEW | 3 | Due baseline di estrazione mancanti, un riferimento solo storico |
| Totale | 50 | La tabella torna; il log testuale ha solo 49 righe di policy |

OpenAI Service Terms e Stripe Prohibited and Restricted Businesses ricevono contenuto via direct/HTTP 200, ma il confronto è sospeso con `extraction_baseline_missing`. Il blocco è prudente: manca il materiale necessario a distinguere con sicurezza un cambiamento del sito da un cambiamento dell'estrattore. Disabilitarlo o sostituire automaticamente la baseline potrebbe perdere un cambiamento reale.

La cinquantesima policy è **X / The X Rules**: direct e renderer ricevono 403/CAPTCHA; HTTP/2 è saltato; Wayback restituisce una cattura storica. La tabella mostra NEEDS_REVIEW, ma quel ramo non emette `policy_done`, spiegando l'assenza nel log allegato.

Le **48 “network retrievals” sono acquisizioni uniche**, non tutte le richieste HTTP: esistono già metriche per i passaggi di strategia, mentre retry interni e redirect non sono una metrica completa per singola richiesta. Dal log non si può ricavare il tempo totale della scansione sommando i millisecondi esposti: mancano pacing, parte dei passaggi, database e AI, e alcune righe sono deduplicate.

La parte diagnostica del log copre 45 acquisizioni uniche. Rimuovendo le righe ripetute delle due deduplicazioni, mostra:

| Strategia | Passaggi visibili | Accettati dal gate corrente | Somma dei tempi esposti |
| --- | ---: | ---: | ---: |
| Direct | 45 | 41 | 18.644 ms |
| HTTP/2 | 4 | 0 | 1.349 ms |
| Renderer | 4 | 4 | 11.565 ms |

Sulle quattro fonti finite al renderer, i passaggi precedenti totalizzano 3.486 ms esposti. È una possibilità concreta di ottimizzazione del routing, ma non spiega da sola la durata totale del batch e non giustifica rimuovere HTTP/2 per ogni fonte. “Accettato” qui descrive il validatore corrente, non una verifica indipendente di identità e completezza. Il calcolo è conservato in `log-diagnostic-breakdown.json`.

La lettura dell'[inventario pubblico](https://policywatcher.online/api/companies) alle 04:31 UTC espone **110 policy di 18 aziende**, rispetto alle 113 del pannello amministrativo: le popolazioni non vanno confuse. Tutte le 110 hanno `dataStatus=Available`, ma quattro hanno `lastSuccessfulCheckDate` oltre 24 ore (tre oltre sette giorni). OpenAI Service Terms e Stripe Prohibited and Restricted Businesses conservano sia `lastCheckDate` sia `lastSuccessfulCheckDate` del **2 ottobre**, pur essendo state tentate nel batch del 31 ottobre. È un riscontro live coerente con D2: il tentativo sospeso non aggiorna il timestamp usato dal pianificatore. Le altre 108 policy pubbliche hanno una data di tentativo nelle ultime 24 ore, quindi questo campione non supporta l'ipotesi che l'intero inventario sia fermo. I timestamp sono dati applicativi, non una verifica indipendente della qualità dei documenti. Copia dei soli metadati in `public-inventory-metadata.json`.

## Risultati prioritari

| ID | Priorità | Risultato | Evidenza |
| --- | --- | --- | --- |
| D1 | P1 | Un run contenente soltanto policy sospese può essere etichettato `[OK]` | Riproduzione locale; `adminScanSummary.ts:22` non considera `extractionHeld` |
| D2 | P1 | I blocchi dell'estrazione non aggiornano la data di tentativo e non collegano il check al run/retrieval | Riproduzione SQLite; `extractionGuard.ts:16`; ordinamento `check-all/route.ts:506` |
| D3 | P1 | Una cattura d'archivio può segnare “Recovered” una fonte live ancora non verificata | Riproduzione del vero orchestratore; `check-all/route.ts:381`, poi guard a `:852` |
| D4 | P1 | Un batch limitato può ripetere la stessa policy sospesa e non avanzare | Due run reali dell'orchestratore con limite 1 e SQLite isolato |
| D5 | P1 | Lunghezza e keyword non stabiliscono l'identità e completezza del documento | Pagina sintetica di marketing accettata da `validateContent`; nessun tasso sul campo deducibile |
| D6 | P2 | Il benchmark retrieval può sovrastimare Hit@K/MRR se mancano risultati | Riproduzione di `aiEvaluation.ts:165`: una risposta su due dà Hit@1=1, mentre answerability=0.5 |
| D7 | P1 | Le tabelle possono perdere negazioni brevi e valori ripetuti necessari a ogni riga | Riproduzione aggiunta dopo il rilievo Gemini; `scraper.ts:1594` elimina “No” e `:1596` deduplica globalmente “30 days” |
| D8 | P2 | Un fallimento di persistenza dopo l'esito unchanged produce due eventi terminali e due righe per una sola policy | Rilievo GLM riprodotto con errore transazionale iniettato; `check-all/route.ts:1071,1087,1476` |
| O1 | P1 | La sintesi AWS pubblicata presenta la data di aggiornamento come data di efficacia | Osservazione dell'output pubblico e delle due versioni archiviate; distinzione esplicita nel documento |
| A1 | P1 | La scansione admin è avviata in background nel processo web; il progresso resta in memoria | `api/admin/cron-status/route.ts:14,156`; rischio di perdita al riavvio, non incidente osservato |
| A2 | P1 | Recupero, analisi AI e persistenza sono seriali nello stesso ciclo | `check-all/route.ts:591,1253`; head-of-line blocking strutturale, latenza live non quantificata |
| A3 | P1 | Una citazione respinta non blocca necessariamente la pubblicazione del relativo giudizio | `gemini.ts:455`, `riskReasonEvidence.ts:50`, pubblicazione `check-all/route.ts:1303`; rischio dimostrabile nel flusso, falsità di uno specifico giudizio non stabilita |
| A4 | P2 | L'identità di acquisizione normalizza host/path senza un registro di equivalenze e ignora il profilo di rappresentazione | `sourceReliability.ts:80`; rischio di conflazione, non errore live provato |
| A5 | P2 | Instradamento e attese sono poco adattivi; manca una cache HTTP condizionale nel percorso esaminato | `scraper.ts:2020`, `renderer/server.mjs:347`; opportunità misurabile con benchmark |

### D1–D4: reporting, avanzamento e recupero

`extractionHeld` è calcolato e salvato in `metricsJson`, ma non compare nel riepilogo. I rami sospesi assegnano lo stato senza valorizzare `source`, `runtime` e `transportLabel`, producendo “NO VALID SOURCE / Not recorded” anche quando la diagnostica prova un recupero direct riuscito. Il ramo storico non emette nemmeno l'evento di completamento.

`guardExtraction` scrive un check Needs Review, ma non `lastCheckDate`. L'ordinamento dei batch usa proprio questa data. La riproduzione con due policy e `limit=1` seleziona due volte la prima policy sospesa. Non prova che tutte le 113 policy siano già affamate: prova il meccanismo che può impedirne l'avanzamento. Una scansione completa non subisce la stessa selezione limitata, ma continua a ripetere lavoro senza risolvere la revisione.

La persistenza del recupero aggiorna la remediation prima della guardia di estrazione. Un risultato storico con `status=ok` può quindi azzerare i fallimenti consecutivi e segnare Recovered. Occorre distinguere **recupero della fonte live**, **disponibilità di una copia storica** e **comparabilità della policy**. L'archivio resta utile per analisi storica e ricostruzione; non conferma lo stato live.

Questa distinzione esiste già in `adaptiveAcquisition/outcome.ts`: `currency` separa live e historical, e `eligibleForComparison` esclude gli archivi. Il difetto D3 è anche un problema di integrazione: il percorso che aggiorna la remediation continua a derivare il recupero dal vecchio `status`. La major deve propagare e applicare questi esiti in tutti i consumatori, senza introdurre un secondo modello concorrente con significati diversi.

Correzione richiesta: esito terminale unico per record, linkage completo, `lastAttemptAt` separato da `lastVerifiedAt`, conteggi riconciliati, percorso esplicito per risolvere la baseline mancante. Il sistema dispone già di `baseline_review` con hash atteso e nota in Evidence Reviews: va reso raggiungibile dal problema, con confronto delle evidenze, senza approvazione automatica.

D8 rafforza il requisito dell'esito terminale unico: il ramo unchanged emette il successo e inserisce `detail` prima della transazione. Se questa fallisce, il catch muta lo stesso oggetto e lo reinserisce. La riproduzione restituisce `checked=1`, `errors=1`, due righe entrambe error e due eventi nell'ordine unchanged/error. Il contatore scalare degli errori resta uno; non si sostiene che tutti i contatori raddoppino. La transazione deve concludersi prima di annunciare successo e l'inserimento del risultato deve avvenire una sola volta. Il guasto database è simulato, non osservato nel batch live.

### D5: validazione del contenuto

L'estrattore sceglie il contenitore più lungo fra selettori generici, rimuove intere categorie DOM, raccoglie blocchi e deduplica testo globalmente. Se il testo strutturato è corto può usare testo visibile dell'intera pagina. Il gate principale richiede una soglia di lunghezza e tre marker inglesi generici.

Una pagina sintetica che vende un corso e menziona privacy, dati e consenso supera il gate. È un controesempio preciso, non una stima dei falsi positivi reali. Restano da valutare: documenti multilingue, intestazioni importanti, tabelle, sezioni brevi, documenti collegati o incorporati, varianti geografiche e clausole duplicate legittimamente in sezioni diverse.

La riproduzione D7 usa una policy con tabella contenente due righe, ciascuna con “No” e “30 days”: l'estrattore elimina entrambe le celle “No” perché inferiori a tre caratteri e conserva soltanto un “30 days”. Questo è un difetto di fedeltà del testo riprodotto, potenzialmente rilevante per l'interpretazione delle clausole. Non prova che una specifica analisi pubblicata sia già stata alterata da questo difetto. Anche una deduplica testuale tra sole celle adiacenti può eliminare ripetizioni legittime: la correzione deve preservare la struttura delle righe.

Il PDF è già supportato con `unpdf`, controllo firma, dimensione e numero pagine. Non va descritto come assente. Tuttavia la conversione corrente fonde il testo e non offre una struttura documentale con ancoraggio pagina/clausola né un percorso OCR per PDF solo immagine.

### A1–A2: durevolezza e prestazioni

Esiste una lease persistente globale e ci sono controlli di recupero dei run scaduti. Questo è utile, ma non costituisce una coda con checkpoint per documento: una lease impedisce sovrapposizioni ordinarie, non riprende autonomamente ogni unità dopo un crash. I rinnovi avvengono tra policy, mentre l'analisi AI può trattenere il ciclo; serve una scadenza effettiva per stadio e un controllo dell'ownership prima di ogni commit.

La serializzazione di acquisizioni su host diversi e delle analisi AI rallenta i batch. La futura concorrenza deve essere limitata per origine e per renderer, con backpressure e scritture protette. Un `Promise.all` indiscriminato non risolve la durevolezza e può peggiorare contese e rate limiting.

### A3: analisi, evidenze e pubblicazione

Il codice corrente invia entrambe le versioni complete fino alla soglia applicativa e conserva un manifesto ricostruibile della richiesta, risposta, modello e copertura. Non è corretto attribuire al motore corrente un taglio generalizzato a 10.000 caratteri dell'analisi dei cambiamenti: quella soglia compare nel percorso Q&A distinto.

Rimangono limiti: tre ragioni di rischio obbligatorie, sei impatti regionali obbligatori, citazioni opzionali; una citazione non corrispondente viene eliminata ma il relativo testo e punteggio restano. La presenza letterale della citazione non prova che supporti l'affermazione. Sono necessari esiti `supported`, `unsupported`, `uncertain`, `not_applicable` e un gate per ogni affermazione materiale, inclusi numeri, eccezioni, negazioni e giurisdizione.

La doppia osservazione dello stesso hash controlla la stabilità della cattura. Non misura la sostanzialità del cambiamento né la correttezza del giudizio del modello. La concordanza di due modelli non sostituisce evidenza e revisione.

### O1: verifica circoscritta del cambiamento AWS pubblicato

È stato letto il cambiamento pubblico `5a7ffcf2-bee3-4d3c-9e4f-6162558fe211`, creato alle 03:56:56 UTC del 31 ottobre. Le versioni archiviate 1 e 2 hanno rispettivamente 61.410 e 61.576 caratteri, con hash del testo verificati. La fonte di questa verifica è l'[API pubblica della policy](https://policywatcher.online/api/policies/cc0c6f48-46d4-444e-912b-5ae25e9c83ca), non una nuova acquisizione indipendente dal provider.

La modifica alla clausola 3.1 sui pagamenti è effettivamente presente fra gli snapshot. Le prime due ragioni di rischio hanno citazioni presenti nella nuova versione e assenti nella vecchia; la terza ragione non ha una citazione registrata. Questo supporta la presenza della modifica testuale, senza qualificare automaticamente punteggio, conseguenze o completezza dell'analisi.

La sintesi inglese e italiana presenta il 29 ottobre come decorrenza dell'accordo. Nel testo archiviato quella è la data **Last Updated**; il paragrafo introduttivo definisce invece **Effective Date** tramite accettazione o primo utilizzo. L'equivalenza fra queste due date non è supportata dal materiale archiviato. È un difetto osservato di attribuzione della sintesi, non una determinazione dell'effetto legale per uno specifico cliente. Le affermazioni generali sulle conseguenze normative regionali richiedono inoltre prove diverse dalla sola clausola sui pagamenti.

Il classificatore espone 65 hunk. Rimuovendo **solo** i prefissi Markdown dei titoli, il confronto per righe si riduce a due sostituzioni: la data e il paragrafo 3.1, che comprende anche uno spostamento di frase. Questo motiva un diff strutturato che separi gerarchia dei titoli, spostamenti e clausole; non prova quale parte del cambiamento dei titoli dipenda dal provider o dal parser, perché qui non è stato riesaminato l'input HTML originario. Evidenze locali: `aws-observed-change.json`, `aws-observed-change-review.json` e `aws-heading-normalized.diff`. Nessun contenuto pubblico è stato modificato.

### A4–A5: identità, routing e costi

Separare identità del fetch e identità del documento: stesso corpo può servire più frammenti, ma frammenti, lingua e ambito non devono sparire dal confronto. Equivalenze tra `www` e host nudo o tra path con slash finale richiedono prova per fonte. Il profilo di rappresentazione deve comprendere lingua, regione di acquisizione e configurazione renderer; la giurisdizione legale resta un dato distinto.

Quattro fonti del batch passano da direct incompleto a HTTP/2 incompleto prima del renderer. Un profilo di fonte verificato può evitare passaggi ripetutamente inutili, mantenendo tentativi periodici di rivalutazione. Il costo risparmiato va misurato. Il renderer usa `networkidle` più un secondo fisso: un contratto di readiness del documento, con deadline, è più pertinente del solo silenzio di rete.

### Componenti già presenti da evolvere

Il repository contiene già catture immutabili con hash, un replay di ricette CSS circoscritte, separazione train/holdout e un observer shadow opzionale. `optionalShadowRuntime` conserva il risultato del motore corrente e rimane disabilitato senza configurazione esplicita. Questa verifica del codice non dimostra quale configurazione sia oggi presente sul server. Il workflow documentato non promuove automaticamente ricette e non offre già una coda durevole di acquisizione né una misura di accuratezza sul campo.

Le catture attuali contengono HTML decodificato o DOM renderizzato; per i PDF possono contenere HTML derivato, non i byte PDF originali. La nuova gestione degli artefatti deve estendere questi contratti e lo storage esistente, preservando le ricevute, invece di ripartire da zero. Le prove storiche della 5.2.0 restano datate: non sono state rieseguite tutte in questa diagnosi. Riferimenti: `src/lib/adaptiveAcquisition/{outcome,evidence,shadowRuntime}.ts` e `evals/scraping/README.md`.

## Verifiche effettuate

**40 test esistenti passati**, in cinque file: summary, lifecycle, evidence assurance, confirmation e source reliability. Alcuni usano SQLite temporaneo; altri mock. Sono verifiche funzionali mirate, non prova della qualità delle policy recuperate in produzione.

**Otto riproduzioni aggiuntive passate** in `output/engine-audit-2026-10-31/reproduction.test.ts`. In questo file PASS significa **difetto riprodotto**, non corretto. Database usa un percorso temporaneo esplicito; trasporti sintetici; AI, mail e pubblicazione canonica sono sentinelle vietate. Le riproduzioni non modificano il database applicativo. D8 aggiunge un guasto transazionale controllato dopo il rilievo GLM.

Comando di riproduzione, dalla copia aggiornata:

```sh
node node_modules/vitest/vitest.mjs run --config output/engine-audit-2026-10-31/reproduction.config.ts --reporter=verbose
```

## Tecnologie verificate e decisioni proposte

- **HTTP condizionale**: ETag/If-None-Match, Last-Modified/If-Modified-Since e Retry-After sono basi standard per ridurre payload e tentativi inutili. Un 304 è utilizzabile solo con artefatto precedente integro, rappresentazione coerente e profilo di estrazione compatibile; non è una seconda cattura indipendente. [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html).
- **Crawlee**: il crawler adattivo HTTP/browser esiste, ma la documentazione lo marca sperimentale. Valutare un adapter contro il percorso corrente; non affidargli automaticamente identità, pubblicazione o guardie di rete. [AdaptivePlaywrightCrawler](https://crawlee.dev/js/api/playwright-crawler/class/AdaptivePlaywrightCrawler).
- **Playwright**: usare readiness verificabile del contenuto e timeout; la documentazione scoraggia `networkidle` come misura universale di readiness. [Page API](https://playwright.dev/docs/api/class-page#page-wait-for-load-state).
- **Documenti**: mantenere `unpdf` per PDF semplici; confrontare Docling in un worker isolato per layout, pagine e OCR. Non sostituire il parser senza corpus e misure. [Formati Docling](https://docling-project.github.io/docling/usage/supported_formats/).
- **Coda**: cominciare dal database e dalla topologia reali. PostgreSQL offre locking con `SKIP LOCKED` per consumer concorrenti; BullMQ è un'alternativa se Redis è già giustificato. In entrambi i casi gli effetti devono essere idempotenti. [PostgreSQL SELECT](https://www.postgresql.org/docs/current/sql-select.html), [BullMQ idempotent jobs](https://docs.bullmq.io/patterns/idempotent-jobs).
- **Modelli**: output strutturato è necessario ma non sostituisce verifica delle affermazioni. Il modello va scelto per task con una valutazione congelata, misurando anche astensione, costi e disponibilità. [Gemini structured outputs](https://ai.google.dev/gemini-api/docs/structured-output).

## Confronto con i revisori

**Gemini 4 Argon, High: risposta effettivamente ricevuta via API**, con `modelVersion=gemini-4-argon` e `finishReason=STOP`. La prima richiesta al dossier completo ha esaurito il limite di output senza produrre una risposta finale: è registrata come `no_text`, non come review. La seconda richiesta, su estratti mirati del medesimo codice e risultati delle riproduzioni, ha prodotto la revisione salvata in `gemini-4-high-review.md`; ricevuta con impostazioni, hash e uso token in `gemini-4-high-receipt.json`.

Adjudication Gemini:

- Confermati sul codice e nelle riproduzioni i difetti di summary, avanzamento, linkage, archivio/live, validatore e denominatore del benchmark.
- Rilievo aggiuntivo sulle celle corte e deduplica globale: confermato con D7, ora incluso fra i problemi P1.
- Il problema di coda è condizionale: i record sospesi occupano ripetutamente posti nel batch; la totale esclusione degli altri richiede che saturino il limite o condizioni equivalenti. Non accolta la generalizzazione a qualsiasi batch inferiore a 113.
- Recovered non significa Resolved: non accolta la frase “self-close tickets”. La transizione errata è alla fase di recupero, non alla chiusura automatica.
- Esiste già `baseline_review`, non incluso nel dossier iniziale: non accolta l'ipotesi di assenza del percorso di revisione. Nessuna rebaseline automatica di tutte le 113 policy.
- Non accolta come soluzione generale la deduplica testuale fra blocchi adiacenti: una tabella può richiedere valori identici in celle adiacenti.
- Le citazioni possono supportare contesto invariato: si distinguono prova del cambiamento e prova contestuale, senza imporre che ogni citazione cada obbligatoriamente in un hunk modificato.
- Le soglie numeriche proposte dal revisore sono ipotesi di protocollo, non risultati misurati né garanzie di efficacia.

**GLM-5.3, Effort Max: risposta effettivamente ricevuta tramite Z.ai.** Modello selezionato e slider Max verificati nella UI prima dell'invio e dopo la risposta. Il primo turno aveva avviato la preparazione non richiesta di un PDF; è stato interrotto e seguito da una richiesta di valutazione testuale sul dossier già letto. La risposta finale è salvata in `glm-5.3-max-review.md`, con ricevuta, verifica testuale della UI e screenshot dell'invio. La cattura screenshot finale ha avuto timeout; il completamento è verificato dal testo integrale e dai controlli tornati disponibili. L'identità qui è quella esposta dalla UI, non un `modelVersion` restituito da API.

Adjudication GLM:

- Confermati D1, D2 e l'omissione dell'evento del ramo storico; il nuovo rilievo sul doppio inserimento diventa D8 dopo riproduzione con SQLite isolato.
- L'assenza del percorso di risoluzione della baseline dipende dal dossier parziale: `baseline_review` esiste. Non accolta la priorità P0 motivata da uno stallo senza alcuna uscita. Il blocco prudente resta; vanno corretti scheduling, spiegazione e accesso alla revisione.
- Non accolta la formula “almeno sei run/sei giorni” per la riconferma. L'attesa dipende dalla posizione nella rotazione, dall'istante del cambiamento, dai filtri e dalla cadenza; le due osservazioni non impongono ciascuna un giro completo dopo il candidato. Inoltre il cap di 50 si applica quando viene fornito un limite positivo: non dimostra che ogni cron usi 50.
- Non accolta l'equivalenza fra fire-and-forget e durevolezza. La rotazione non è un checkpoint degli stadi e non garantisce outbox, ownership al commit o recupero dell'analisi. Una coda nel database esistente evita una dipendenza da Redis, ma conserva task e tentativi persistenti.
- `notificationMode:'silent'` sopprime notifiche; non seleziona i candidati e non impedisce la pubblicazione. Una riconferma prioritaria richiede un vero criterio di selezione e un budget che non sottragga tutta la capacità alle altre fonti.
- Il codice completo del renderer contiene autenticazione Bearer e confronto costante (`renderer/server.mjs:41,113,419`). L'assenza nell'estratto non è assenza dell'implementazione; configurazione effettiva del VPS e isolamento restano da qualificare. Un timeout gateway, da solo, non dimostra la terminazione del processo Node.
- Non accolta la rimozione dell'extraction guard come rollback ordinario: potrebbe reinterpretare modifiche del parser come modifiche del provider. Il rollback conserva la guardia e usa pausa/worker compatibile. Conservare nuove catture non ricostruisce retroattivamente input storici mancanti.
- Una citazione valida per l'intera analisi, una lunghezza vicina al riferimento e una perdita di sezioni sotto il 30% non bastano a dimostrare supporto e completezza. Le soglie proposte restano ipotesi; il gate richiede prove per affermazione e per sezione. Il caso osservato AWS O1 illustra il limite delle sole citazioni corrette.
- Conservati i suggerimenti di outbox, metriche di hash instabile e riuso del replay; archivi trattati fuori dal percorso di conferma live, senza eliminarne il valore storico. Nessuna normalizzazione globale di URL viene assunta equivalente senza prova per fonte.

I dossier differiscono nel secondo giro Gemini: non si dichiara un esperimento cieco con input perfettamente identici. La verifica pubblica AWS O1 e il censimento dei metadati sono stati svolti separatamente durante l'attesa e non sono attribuiti ai revisori. I loro testi sono input da valutare, non certificazioni del prodotto.

## Decisioni richieste all'owner

1. Priorità tra affidabilità/copertura, frequenza e costo; proposta: affidabilità prima.
2. Scala attesa a 6–12 mesi e freschezza desiderata: inventario attuale, centinaia o migliaia di documenti; giornaliera, oraria o altre finestre.
3. Budget operativo mensile e disponibilità a spostare il worker sul VPS con eventuale PostgreSQL/storage dedicato. Nessun nuovo servizio a pagamento è stato attivato.
4. Politica di pubblicazione: automatica per cambiamenti con prove complete, oppure revisione obbligatoria per specifiche classi di impatto e ambiti incerti. Chi revisiona le eccezioni e con quale tempo disponibile.
5. Perimetro iniziale: HTML/PDF e lingue attuali, oppure OCR, documenti incorporati e altre lingue; fonti bloccate possono rimanere esplicitamente non verificate finché manca un accesso autorizzato.
6. Passaggio successivo: implementazione locale per incrementi o discussione preventiva dell'architettura. Il primo incremento proposto corregge rendicontazione, avanzamento dei batch e stato storico/live; non richiede sostituire il modello AI.
