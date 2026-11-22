# Audit di coerenza del workflow: 22 novembre 2026

Il riesame del candidato `946fc9d` ha individuato cinque discrepanze. Sono corrette nel codice `0b0c515` e `3eabf9d`, senza operazioni su hosting o dati reali. Due agenti hanno riesaminato separatamente le correzioni e non hanno dimostrato ulteriori P0/P1/P2 nel fix set. Questo giudizio riguarda i percorsi esaminati, non l’assenza universale di difetti.

L’[atlante interattivo](../../architecture/engine-workflow-atlas/index.html) contiene una panoramica e sette schemi tracciati: flusso completo, stati del lavoro, revisioni, outbox, sequenza/transazione, FK dichiarate e riferimenti applicativi. La [specifica Markdown/Mermaid](../../architecture/engine-workflow-atlas/workflow.md) conserva 109 riferimenti agli archi e una matrice di 28 gate. Sono diagrammi del codice del candidato, non fotografie della produzione.

## Riscontri e correzioni

| Priorità | Discrepanza osservata | Correzione e controprova |
|---|---|---|
| P1 | Cambiando soltanto `base href`, il testo poteva restare uguale e i link risultare ancora corrispondenti, pur puntando altrove. | Risoluzione dal documento attivo e dal final URL; template inerti esclusi. Base ambigui, non validi o con credenziali sospendono senza fetch. Il controllo valido passa e la variante alterata viene sospesa. |
| P2 | Gli errori HTTP/1 lanciati potevano perdere HTTP e prova di integrità, diventando errori generici. | Codici limitati e copia dei soli fatti ammessi; dati extra e messaggi privati non vengono persistiti. |
| P2 | Il limite di 2 MB riguardava i byte conservati, mentre il ciclo poteva avviare altre richieste. | Riserva decodificata condivisa prima del fetch, limite residuo al decoder e stop all’esaurimento. I successi piccoli rimborsano la quota inutilizzata; gli errori conservano la riserva perché il consumo è incerto. Non è un limite dei byte di rete. |
| P2 | Una richiesta di rebaseline poteva superare un controllo più debole di quello del worker successivo. | UI e server richiedono lo stesso gate pubblicabile. La richiesta non adotta una baseline e richiede ancora due nuove catture. |
| P2 | L’artefatto di un errore terminale poteva essere conservato nel checkpoint ma non mostrato con data, fonte e HTTP coerenti. | API e UI condividono l’osservazione effettiva; il payload storico resta immutato. L’HTML grezzo resta nello store privato. |

Le ultime due discrepanze sono distinte dalle condizioni di ammissibilità del contenuto. Una copertura corrispondente non autorizza da sola la pubblicazione. Tutte le policy con allegati restano osservabili privatamente: le modifiche e i claim dei soli allegati non sono qualificati.

## Prove eseguite

- Suite completa con TCP/IP negato dal sistema operativo: **1.865 test superati, 14 saltati**, 221 file passati e tre saltati. Il profilo consente soltanto il necessario IPC locale degli strumenti di test.
- Cinque mutazioni hanno disattivato temporaneamente i controlli di base URI, diagnostica, budget, rebaseline e visibilità terminale. In ogni caso il relativo test è fallito. I file originali sono stati ripristinati e le impronte ricontrollate.
- Riesecuzione indipendente del primo agente: 274 test in otto file, offline. Il secondo ha eseguito 47 controlli, incluse tre sonde aggiuntive su rimborso delle riserve, errori e final URL, poi sette test API sul DTO finale. Questi conteggi si sovrappongono alla suite e non si sommano come copertura delle fonti.
- Build npm completa in una copia pulita, TypeScript, lint e impronte generate del parser/motore passati. Database SQLite isolato, pubblicazione e notifiche disabilitate.
- Atlante provato nel browser locale: dieci pannelli, otto viste SVG, 28 righe di controllo, cinque riscontri, nodi con mouse/tastiera, scenari illustrativi e zoom. A 390 px la pagina non presenta overflow orizzontale; gli schemi ampi scorrono nel proprio contenitore. Nessuna risorsa esterna caricata dalla pagina.
- Sedici archi FK disegnati corrispondono a relazioni dichiarate in Prisma. L’ER è selettivo e non costituisce una verifica dello schema effettivo del database online. I collegamenti scalari e JSON sono disegnati separatamente.

Il numero 1.865 è un conteggio di test, non di policy acquisite. Nessuna cattura live o giornata di qualificazione è stata aggiunta. Le immagini sono esportazioni di schemi del codice, non grafici di prestazioni misurate.

## Revisori e modelli

Tre agenti separati hanno esaminato controllo del lavoro, evidenze/interfaccia e schemi. Due modelli cloud sono stati consultati tramite endpoint gratuiti: Nemotron 3 Ultra e Particle-1. Il costo delle quattro generazioni è verificato pari a **0 USD** dalle ricevute del servizio. Le prime risposte erano parziali al limite di output; i riesami focalizzati sono completi. Qwen locale ha fornito un ulteriore parere parziale. Nessun modello ha eseguito i test e non viene dichiarato un contributo Gemini o GLM 5.3 MAX in questo audit.

I pareri dei modelli sono stati confrontati con il codice, anche quando erano espressi con sicurezza. Non è stata adottata una modifica per il solo voto di un modello. Il [registro di adjudicazione](model-adjudication.md) distingue riscontri riprodotti, accuse non supportate e limiti di progetto. Non si tratta di una certificazione esterna né di un pentest.

## Invarianti da leggere nei diagrammi

1. Autorizzazione, chiavi idempotenti, task dipendenti, lease di origine e fencing proteggono l’avvio e i commit. La cancellazione persistente invalida il lavoro in corso. I flag di processo non sono un nuovo interruttore globale immediato; hosted Preview aggiunge contesto/leader verificati nella transazione.
2. Un artefatto privato può esistere prima del commit del task. La sua conservazione non lo rende una versione pubblica. Il suo hash JSON è distinto dall’hash del testo del documento.
3. Un 304 può riconvalidare una rappresentazione immutata e compatibile con il contesto, ma non conferma un documento cambiato. Cache, parser, contratto e baseline hanno identità separate.
4. La conferma del candidato usa run diversi, stesso contenuto/contesto e intervallo da un’ora a sette giorni. Non è la campagna di qualifica multigiorno. `nextDueAt` non avvia autonomamente un futuro run.
5. In modalità observe non vengono creati nuovi cambiamenti pubblici o eventi di notifica. Inventario V1 non pubblica; V2 deve corrispondere e non avere allegati per accedere alla pubblicazione del documento principale.
6. Rete e modelli stanno fuori dalla transazione di pubblicazione. Snapshot, baseline, cambiamento e claim vengono salvati nello stesso contesto protetto. Proiezione canonica e outbox sono opzionali secondo i rispettivi flag/modalità, dentro la stessa transazione quando abilitati.
7. Baseline iniziale, replay e rebaseline non emettono automaticamente una notifica di cambiamento. Il replay con il parser attuale è una proposta da revisionare; la copia originale rimane distinta.
8. L’outbox separa fanout e destinatari. Il consenso viene ricontrollato; SMTP resta almeno una volta. Lo stato `delivered` del lavoro può indicare fanout registrato o un destinatario ormai escluso: non certifica la ricezione dell’email.
9. `completed` significa lavorazione conclusa e può includere sospensioni o attese. Configurazione di un contratto, copertura dichiarata e qualifica reale sono denominatori diversi.

## Limiti e consegna

Origine e indipendenza del riferimento restano dichiarazioni revisionate, non autenticazione crittografica dell’editore. Unità di clausola e tabella seguono confini strutturali dichiarati. Contenuti non caricati, elementi non testuali, errori del riferimento e accuratezza semantica generale restano da qualificare. Diagnostica/backoff dei child HTTP 429/503 e relativo Retry-After non sono qualificati. Il budget decodificato non misura rete o memoria totale. L’affidabilità di orologi, servizi e recapito reali richiede prove operative separate.

Non è stato attivato Engine 6 in produzione. Non sono stati modificati servizi, acquistate risorse o cambiati corpus/manifest della campagna congelata. Il codice corretto ha una nuova impronta e non eredita le osservazioni di `050af19` o della Preview ospitata. La capacità di **500 completamenti giornalieri dell’intera pipeline rimane non qualificata**.

Il pacchetto pubblico 5.6 già preparato rimane immutato e distinto dal nuovo codice privato. L’atlante e il presente rapporto sono consegnati separatamente per revisione; la loro esistenza su disco o Git non equivale a pubblicazione sul sito.
