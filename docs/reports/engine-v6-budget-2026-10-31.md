# PolicyWatcher 6 - dimensionamento e budget

31 ottobre 2026. Obiettivo dell'owner: fino a 500 policy controllate ogni giorno, affidabilità e copertura prima di velocità e costo. Nessun servizio è stato acquistato. Il piano VPS e i preventivi di upgrade sono stati letti nel pannello Hostinger autenticato aperto dall'owner. Gli scenari API rimangono stime, non consumi misurati.

## Proposta economica

Riservare **120–200 euro/mese per il motore**, inclusi VPS, API e margine operativo, con un controllo della spesa dopo il primo mese. Il limite inferiore è adeguato allo scenario illustrativo con 10 documenti cambiati al giorno, analista Flash e verificatore Pro; quello superiore permette di sperimentare un verificatore più forte senza assumere che migliori automaticamente l'accuratezza. Hosting web già esistente, dominio, IVA, lavoro umano e abbonamenti personali Gemini/ZCode sono separati. Se il VPS attuale ha già capacità libera, il suo canone non va contato due volte: il costo aggiuntivo può essere principalmente quello delle API.

Questo budget **non garantisce** qualunque tasso di variazione o lunghezza documentale. Con 25 documenti cambiati ogni giorno, la sola analisi può superare il budget proposto, soprattutto usando Argon. Una grande revisione simultanea di tutte le policy richiede una riserva una tantum.

## Infrastruttura

Per la prima qualificazione propongo un worker seriale persistente, SQLite WAL, DB e processo applicativo sullo stesso host e renderer Chromium separato come oggi. Niente Redis o cluster distribuito necessari per la sola numerosità 500/giorno. Il dimensionamento resta da misurare con i documenti reali e la contemporanea attività del sito. WAL richiede processi sullo stesso host; non montare il file SQLite dal VPS attraverso un filesystem di rete. [Documentazione SQLite](https://www.sqlite.org/wal.html).

### Piano esistente e offerte dell'account, verificati nel pannello

**KVM 1 attivo: 1 vCPU, 4 GB RAM, 50 GB disco, 4 TB banda**, Ubuntu 24.04 LTS, regione Francoforte. Il pannello mostrava circa **37 GB occupati su 50 GB** (13 GB residui), CPU 40%, RAM 58% e backup settimanale. CPU/RAM sono una fotografia, non percentili di carico né prova della capacità sotto scansione. L'abbonamento rinnova per **un mese il 2 novembre 2026**, auto-rinnovo già attivo: **19,49 USD + 0,97 USD imposte = 20,46 USD**. Queste impostazioni non sono state cambiate.

| Piano | CPU / RAM / disco | Offerta con 12 mesi anticipati | Totale richiesto oggi nel pannello | Rinnovo indicato dopo il primo anno, prima delle imposte |
| --- | --- | ---: | ---: | ---: |
| KVM 2 | 2 vCPU / 8 GB / 100 GB | 13,49 USD/mese equivalente | 168,46 USD | 16,99 USD/mese equivalente |
| KVM 4 | 4 vCPU / 16 GB / 200 GB | 22,99 USD/mese equivalente | 288,16 USD | 30,99 USD/mese equivalente |

I totali del preventivo includono le imposte del 5% mostrate e il credito residuo applicato dall'account. **Sono offerte annuali, non contratti pagati mese per mese**, e possono cambiare. Nessun pulsante di pagamento o rinnovo è stato confermato. Il listino pubblico italiano consultato differiva per valuta, promozione e durata: per questo account prevalgono questi preventivi autenticati, non i prezzi pubblicitari generici.

KVM 2 è la soglia ragionevole per un pilot seriale con maggiore spazio; **propongo KVM 4** per co-localizzare applicazione, DB e worker e avere margine per renderer e prove conservate, da verificare con carico reale. Rispetto al VPS mensile attuale, il KVM 4 equivale a circa 24,01 USD/mese nel primo anno considerando il totale oggi richiesto; il rinnovo esposto equivale a circa 32,54 USD/mese con l'imposta oggi mostrata. Non è necessario duplicare il vecchio canone nel budget.

La riserva complessiva 120–200 €/mese rimane adeguata agli scenari API sotto; **al netto del solo VPS attuale**, con l'assunzione prudenziale 1 USD = 1 EUR, equivale a circa **100–180 €/mese aggiuntivi**. Non sono stati sottratti eventuali costi API già sostenuti, che non sono documentati in questa verifica. Prevedere il pagamento anticipato del piano scelto, separatamente dalla riserva mensile.

Se il piano Node.js attuale non permette un processo worker supervisionato accanto al DB, la variante concreta è co-localizzare backend Next.js, DB e worker sul VPS. Un worker remoto che scrive direttamente nel file SQLite di Hostinger non è una variante supportata. Il protocollo remoto claim/complete e PostgreSQL gestito sono evoluzioni possibili; non sono stati qualificati in produzione in questo lavoro.

## Consumo AI: ipotesi trasparenti

500 × 30 = **15.000 controlli/mese**, più riconferme e retry. Il modello non serve per ogni risposta identica: interviene sui candidati cambiati dopo due osservazioni live indipendenti. La quota di documenti cambiati non è misurata dal batch di 50 e non può essere dedotta dai 4 pending + 1 pubblicato.

Scenario illustrativo per documento analizzato: una chiamata analista con 50.000 token input e 5.000 output, più un verificatore con lo stesso consumo. I token output includono il ragionamento. La serializzazione invia una sola copia dei blocchi del documento completo, con riferimenti ai delta e controllo preventivo dei token: misurare i token effettivi, non stimarli dalla sola lunghezza del testo pulito. Applicato un margine del 30% per retry/variazione. Non sono inclusi grounding a pagamento, embedding o OCR.

Tariffe standard USD per milione di token consultate: Gemini 2.5 Flash input 0,30/output 2,50; 2.5 Pro input 1,25/output 10 fino a 200k input (oltre: 2,50/15). Argon input 2/output 10 fino al 30 novembre 2026, **4/20 dal 1 dicembre**. Gli abbonamenti alle app non sostituiscono il consumo API. [Prezzi ufficiali Gemini](https://ai.google.dev/gemini-api/docs/pricing).

| Scenario ipotetico | Cambiamenti/mese | Flash + Pro, USD/mese incl. 30% | Flash + Argon da dicembre, USD/mese incl. 30% |
| --- | ---: | ---: | ---: |
| 5 al giorno | 150 | 27,30 | 63,86 |
| 10 al giorno | 300 | 54,60 | 127,73 |
| 25 al giorno | 750 | 136,50 | 319,31 |
| 500 revisioni simultanee, una tantum | 500 | 91,00 | 212,88 |

Formula per coppia Flash+Pro: `(50k×0,30 + 5k×2,50 + 50k×1,25 + 5k×10)/1M = 0,14 USD`. Variante Flash+Argon dicembre: `0,3275 USD`. Per la riserva in euro ho usato prudenzialmente 1 USD = 1 EUR come **assunzione di budget, non tasso di cambio**; verificare conversione, imposte e valuta di fatturazione al momento dell'acquisto.

La preview mantiene modelli configurabili e non promuove un modello nuovo sulla base delle sole recensioni architetturali. Gemini 4 High e GLM 5.3 Max hanno revisionato progetto/codice; questo non costituisce un confronto sperimentale della pipeline su policy reali.

## Storage, backup e margini

Gli artefatti identici sono deduplicati per hash. Con 15.000 catture da 300 kB distinte si aggiungerebbero 4,5 GB/mese di soli corpi; con 2 MB, 30 GB. Sono ipotesi: HTML dinamico, token anti-cache, DOM renderizzato, testo strutturato e backup possono cambiare molto il totale. L'hash dell'intero corpo non elimina le sole variazioni del boilerplate. Occorre misurare crescita e dedup reali; non prometto il consumo del solo testo contrattuale.

Prevedere 5–15 €/mese di riserva per copie indipendenti/monitoraggio. R2 Standard, come riferimento opzionale, espone 0,015 USD/GB-mese, 10 GB-mese inclusi, 1M operazioni A e 10M B incluse. Un deposito medio di 100 GB costa circa 1,35 USD/mese per il solo storage oltre la franchigia, prima di operazioni, imposte e altri servizi. La preview non integra R2 e non è stato creato alcun bucket. [Listino R2](https://developers.cloudflare.com/r2/pricing/).

La retention non deve eliminare le prove di una modifica pubblicata o di una revisione aperta. La prima implementazione conserva le prove; il pruning automatico non è attivo. Prima dell'attivazione continuativa: backup consistente del DB, ripristino verificato, soglie di spazio e revisione di conservazione delle catture prive di riferimenti.

## Decisioni di qualificazione

Misurare per almeno tre finestre complete: copertura sul catalogo totale; esiti live/storici/parziali/bloccati separati; correttezza di identità/completezza su un corpus annotato; richieste e byte per fonte; p50/p95 di recupero e completamento; token e costo per documento cambiato; tasso di revisione; falsi cambiamenti e affermazioni non supportate. Il test locale con 500 policy dimostra pianificazione e dedup, **non** 500 recuperi Internet riusciti in un giorno.
