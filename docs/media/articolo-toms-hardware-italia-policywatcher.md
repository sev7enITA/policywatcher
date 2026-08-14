# PolicyWatcher: osservare le policy delle Big Tech come infrastruttura civica

**Bozza editoriale per Tom's Hardware Italia**
**Autore proposto:** Fabrizio Degni
**Data:** luglio 2026
**Piattaforma:** PolicyWatcher, release 3.5.1 Audit Operations / Confidence track
**Repo pubblico:** https://github.com/sev7enITA/policywatcher
**Sito:** https://policywatcher.online

## Occhiello

Ogni settimana le grandi piattaforme digitali aggiornano privacy policy, termini di servizio, condizioni per sviluppatori e regole sull'intelligenza artificiale. Il problema non è solo leggerle: è capire cosa cambia, per chi cambia, in quale mercato cambia e con quale livello di evidenza. PolicyWatcher nasce per trasformare questa massa opaca di testi legali in un sistema ispezionabile di monitoraggio, analisi e qualità del dato.

## Abstract

PolicyWatcher è una piattaforma civic-tech progettata per monitorare policy pubbliche di grandi aziende tecnologiche, fintech, social media, cloud/SaaS, e-commerce e provider AI. Non promette certificazioni legali né giudizi definitivi: costruisce invece una catena di osservazione verificabile, dal recupero delle fonti pubbliche alla rilevazione delle modifiche, fino alla lettura assistita da AI e al controllo qualità del dataset.

La piattaforma integra dashboard pubblica, timeline delle modifiche, matrice KPI, comparazione tra aziende, report PDF, assistant AI, pagine condivisibili, portale di trasparenza, metodologia pubblica, console amministrativa e workflow di Dataset QA. La release 3.5.1, denominata Audit Operations, sposta l'enfasi dalla sola feature velocity alla fiducia operativa: stato del dato, log dei controlli, decisioni QA persistenti, renderer VPS opzionale per pagine script-rendered, evidenza GitHub, badge OpenSSF, CodeQL, Quality Gate e documentazione dei limiti.

Il cuore metodologico può essere riassunto con un approccio FAST: Fonti, Analisi, Stato del dato, Trasparenza. È una formula semplice, ma utile per distinguere una dashboard dimostrativa da un sistema che vuole essere verificabile.

---

## 1. Il problema: le policy digitali sono diventate infrastruttura, ma restano difficili da osservare

Le policy delle piattaforme digitali non sono più documenti accessori. Sono parte dell'infrastruttura che regola la relazione tra persone, imprese, sviluppatori, creator, venditori, inserzionisti e servizi automatizzati. In quelle pagine si trovano le regole sulla raccolta dei dati, l'uso per addestramento AI, la condivisione con terze parti, la conservazione, le procedure di cancellazione, gli obblighi di compliance, le decisioni automatizzate, i meccanismi di consenso e le condizioni di utilizzo dei servizi.

Il punto critico è che queste policy cambiano. Cambiano perché cambiano i prodotti, cambiano le leggi, cambiano i modelli di business, cambiano gli assetti societari e cambiano le strategie sull'intelligenza artificiale. Una clausola aggiunta in una privacy policy può indicare una nuova categoria di dati raccolti. Una modifica ai termini di servizio può ridefinire la disponibilità dei contenuti caricati dagli utenti. Una pagina dedicata agli sviluppatori può introdurre restrizioni sull'uso delle API o sulle modalità di scraping. Una sezione AI può chiarire, o rendere più ambiguo, il rapporto tra input degli utenti, output generati e training dei modelli.

La difficoltà non è teorica. Per un cittadino, leggere decine di policy è quasi impossibile. Per una piccola impresa, seguire manualmente i cambiamenti di tutti i servizi usati nella supply chain digitale è costoso. Per un DPO o un consulente compliance, confrontare più provider richiede tempo, metodo e tracciabilità. Per un giornalista tecnologico, distinguere un reale cambio di sostanza da una riscrittura cosmetica può diventare un lavoro investigativo.

Il problema si complica ulteriormente perché le piattaforme spesso pubblicano versioni globali, regionali e localizzate delle stesse policy. Una policy globale in inglese può non essere sufficiente per valutare un impatto europeo. Una pagina italiana può essere una traduzione, una pagina di marketing legale o il riferimento ufficiale per un mercato specifico. Senza una gerarchia delle fonti, il rischio è analizzare il testo sbagliato e attribuirgli un impatto che non gli appartiene.

PolicyWatcher nasce da questa esigenza: non sostituire il giudizio legale o umano, ma rendere osservabile il cambiamento. La piattaforma raccoglie fonti configurate, rileva differenze, conserva versioni, produce sintesi assistite da AI e, soprattutto, espone lo stato qualitativo del dato su cui quelle sintesi si basano.

## 2. Una piattaforma civic-tech, non un oracolo

Una distinzione è importante fin dall'inizio. PolicyWatcher non è un motore di compliance automatica, non è un certificatore e non pretende di descrivere tutte le pratiche interne delle aziende. È una piattaforma di policy intelligence: mappa documenti pubblici, identifica variazioni, organizza evidenze, segnala rischi e rende il dataset ispezionabile.

Questa scelta non è prudenza linguistica. È architettura. Quando un sistema analizza policy pubbliche, deve evitare due errori opposti. Il primo è minimizzare il valore dell'automazione: se ogni analisi richiede solo lavoro manuale, il monitoraggio continuo diventa impraticabile. Il secondo è attribuire all'AI una certezza che non possiede: se un modello interpreta un testo come se fosse un verdetto, si perde la differenza tra evidenza, inferenza e decisione.

PolicyWatcher lavora in mezzo a questi due poli. Usa automazione e AI per rendere più rapida la lettura, ma registra anche lo stato della fonte, il metodo di ingestion, l'ultimo controllo, l'ultimo recupero riuscito, le anomalie, i warning e le decisioni dell'amministratore o dell'auditor. In altre parole, non si limita a dire "questa policy è rischiosa"; prova a mostrare da dove arriva il dato, quando è stato visto, con quale stato e attraverso quale percorso di qualità.

La release 3.5.1 Audit Operations rappresenta proprio questo passaggio. Le feature non sono soltanto elementi di interfaccia. Sono strumenti di governance del dato: Dataset QA, review log append-only, decisioni persistenti sulle issue, export CSV per audit, badge pubblici, workflow GitHub, pagina Trust & Quality, metodologia bilingue e changelog strutturato.

## 3. Il metodo FAST: Fonti, Analisi, Stato del dato, Trasparenza

Per presentare la piattaforma in modo sintetico, propongo un framework FAST. Non è uno slogan commerciale: è un modo operativo per leggere il ciclo di vita dell'informazione dentro PolicyWatcher.

**F - Fonti.** Ogni valutazione parte da una fonte pubblica configurata. La piattaforma privilegia le fonti globali canoniche in inglese quando si analizza il contesto global, e le fonti specifiche di mercato quando l'analisi riguarda EU, US o altre giurisdizioni. Il recupero può passare da fetch diretto, HTTP/2, renderer VPS opzionale o archivi con freshness guard. Questo punto è cruciale perché evita un errore frequente: usare una policy localizzata o regionale come se fosse valida per tutti i mercati, o viceversa.

**A - Analisi.** Una volta acquisito il testo, il sistema lo normalizza, calcola hash SHA-256, rileva modifiche e produce letture strutturate con l'assistenza di Gemini 2.5 Flash. L'analisi genera sintesi bilingui, key point, risk score, risk reasons, impatti regionali e dati KPI. L'AI non è lasciata libera di inventare: il suo output è incanalato in strutture prevedibili e viene utilizzato come supporto alla lettura.

**S - Stato del dato.** La piattaforma non tratta tutti i record come se avessero la stessa affidabilità. Ogni policy può avere uno stato come Available, Partial, Needs Review, Unavailable o Reviewed. Sono registrati ingestion method, last check date, last successful check date e check log. Questo consente di distinguere un dato disponibile da un dato che richiede revisione.

**T - Trasparenza.** Il sistema espone metodologia, limiti, changelog, roadmap, trust evidence, badge open source, GitHub Actions, CodeQL, OpenSSF Scorecard, OpenSSF Best Practices e documentazione di validazione terze parti. La console amministrativa aggiunge un ulteriore livello: le decisioni umane sulle issue QA vengono loggate in modo append-only.

FAST descrive quindi la differenza tra una dashboard estetica e un sistema ispezionabile. Una dashboard mostra risultati. Un sistema FAST mostra anche come quei risultati sono arrivati lì.

## 4. Cosa monitora oggi PolicyWatcher

La piattaforma ha un inventario configurato di 16 aziende distribuite su sei settori: Tech Giants, FinTech, AI Providers, Social Media, Cloud/SaaS ed E-Commerce. Nel perimetro operativo rientrano Google, Microsoft, Apple, Amazon, Meta, Stripe, PayPal, Revolut, Wise, Klarna, Plaid, OpenAI, Anthropic, TikTok, Salesforce e Shopify.

Per ciascuna azienda, PolicyWatcher può seguire più tipologie di documento: privacy policy, termini di servizio, policy AI, developer terms o acceptable use policy dove applicabile. Il database locale della release 3.5.1 contiene 50 policy configurate, 103 record di versione, 53 record di cambiamento, 318 impatti regionali e 50 log di controllo policy. Dopo l'hardening di confidence, questi numeri descrivono l'inventario tecnico e non vengono promossi come evidenza pubblica finché le singole policy non sono supportate da retrieval reali e verificabili.

La scelta di partire da Big Tech e FinTech è naturale. Sono i soggetti che più spesso combinano dati personali, servizi digitali, infrastruttura cloud, AI, pagamenti, identità, advertising, API e prodotti consumer. Sono anche aziende con una produzione documentale ampia, stratificata e non sempre facile da confrontare.

## 5. La dashboard pubblica: leggere il rischio senza perdere il contesto

La home dashboard è la porta d'ingresso della piattaforma. Mostra le aziende monitorate in una griglia di card, con logo, settore, stato Dataset QA, sintesi dell'ultimo cambiamento e punteggio di rischio nel contesto selezionato.

La dashboard serve a rispondere rapidamente a una domanda: "Dove sta succedendo qualcosa che merita attenzione?". Per questo include:

- conteggio delle aziende monitorate;
- numero di allerte critiche nel contesto selezionato;
- media dei risk score;
- filtro attivo per regione e prospettiva;
- ricerca testuale;
- filtro per settore;
- filtro per rischio;
- ordinamento per rischio, data o nome;
- selezione EU, US o Global;
- selezione Individual o Enterprise.

La distinzione tra regione e prospettiva è importante. Una modifica può avere significato diverso per un utente individuale europeo, per un'impresa statunitense o per un lettore interessato al quadro globale. PolicyWatcher non riduce tutto a un numero unico: consente di cambiare contesto.

La dashboard è stata aggiornata anche sul piano UX. L'utente può personalizzare densità, vista, sezioni visibili e accento visuale. Non è solo estetica: quando si analizzano molte card, la possibilità di passare da una vista compatta a una vista focus riduce rumore e fatica cognitiva.

## 6. Market Pulse e timeline: vedere il movimento nel tempo

Una delle funzioni più utili è il Market Pulse, una timeline sintetica nella home che mostra i movimenti recenti delle policy. L'idea è semplice: non guardare solo lo stato attuale, ma osservare la pulsazione del mercato.

La timeline pubblica completa consente di consultare le modifiche nel tempo, filtrandole e collegandole alle pagine di dettaglio. Ogni change può avere una pagina stabile `/change/[id]`, utile per condivisione, analisi e citazione. Questo trasforma il cambiamento da evento effimero a record consultabile.

Per giornalisti, analisti e consulenti, la timeline è spesso più interessante della dashboard statica. Una singola azienda con rischio medio può diventare rilevante se aggiorna più policy in pochi giorni. Un settore può mostrare un pattern se più attori introducono clausole simili su AI training, advertising, data sharing o automated decision-making.

## 7. Policy deep-dive: dal punteggio alla spiegazione

Cliccando su una policy si apre il dettaglio. Qui PolicyWatcher prova a evitare il limite tipico dei sistemi di scoring: il numero senza spiegazione.

Il dettaglio policy include:

- overview della policy selezionata;
- sintesi AI in inglese e italiano;
- TL;DR;
- key point;
- risk reasons;
- trend storico del rischio;
- archivio versioni;
- differenze tra versioni;
- impatti regionali;
- dati di telemetry;
- pulsante di re-scan manuale;
- link alla fonte;
- generazione report PDF.

Il componente più delicato è il diff. Non basta sapere che una policy è cambiata: serve vedere cosa è stato aggiunto, rimosso o mantenuto. Il diff rende visibile il delta, cioè l'oggetto dell'analisi.

Le risk reasons servono invece a spiegare il perché del punteggio. Ogni score dovrebbe essere accompagnato da ragioni leggibili e non solo da un'etichetta High, Medium o Low. In una piattaforma civic-tech, l'obiettivo non è convincere l'utente a fidarsi del numero, ma metterlo nelle condizioni di contestarlo, verificarlo o usarlo come punto di partenza.

## 8. Risk score e 15 KPI: una griglia comparabile

PolicyWatcher usa un risk score da 1 a 10, con tre fasce principali: Low, Medium e High. Il punteggio è pensato come indicatore analitico, non come verdetto legale.

La parte più strutturata è la matrice a 15 KPI, divisa in tre aree:

**Privacy e protezione dei dati**

1. Data Collection Scope
2. Third-Party Sharing
3. Data Retention
4. Right to Deletion
5. Cross-Border Transfer

**AI Governance**

6. AI Training Opt-Out
7. AI Output Ownership
8. Algorithmic Transparency
9. Automated Decisions
10. AI Bias and Fairness

**Etica e governance aziendale**

11. Consent Mechanism
12. Regulatory Compliance
13. Breach Notification
14. Independent Audit
15. Content Moderation

Questi KPI trasformano concetti spesso astratti in elementi comparabili. Per esempio, "trasparenza algoritmica" può essere vaga se letta come principio; diventa più utile quando viene osservata azienda per azienda, policy per policy, con stato, motivazione e data di screening.

La piattaforma può mantenere 480 note metodologiche bilingui: 16 aziende per 15 KPI per due lingue. Servono a rendere coerente la review e a non delegare l'intera lettura al modello generativo, ma nella modalità pubblica restano disattivate finché non vengono revisionate contro le fonti provider correnti.

## 9. Matrice KPI e benchmark: confrontare senza semplificare troppo

La KPI Governance Matrix permette di vedere le aziende in una tabella comparativa. Ogni cella usa badge colorati e tooltip con giustificazione e data di screening. L'utente può filtrare per settore, cercare aziende, attivare o disattivare gruppi KPI e ordinare colonne.

La matrice serve a due scopi. Il primo è operativo: trovare rapidamente aree deboli o forti. Il secondo è comparativo: vedere se un rischio è isolato o sistemico.

La funzione di benchmark tra aziende usa grafici radar/spider e confronto A/B. È utile quando si vuole paragonare due provider prima di una scelta tecnologica o di procurement. Un'impresa che deve decidere tra due servizi può guardare non solo alle feature di prodotto, ma anche alla postura dichiarata su dati, AI, retention, opt-out e audit.

La piattaforma include anche un industry benchmark, cioè un confronto tra una compagnia e la media del proprio settore. È una funzione interessante perché riduce il rischio di giudicare un'azienda fuori contesto. Un punteggio medio può essere buono in un settore ad alto rischio o mediocre in un settore più maturo.

## 10. Regional impact: EU, US, Global e prospettive diverse

Uno degli errori più comuni nell'analisi delle policy globali è trattare "la policy" come un oggetto unico. In realtà molte aziende hanno testi globali, testi regionali, addendum, sezioni locali e pagine specifiche per mercato.

PolicyWatcher distingue tre contesti principali: EU, US e Global. A questi aggiunge due prospettive: Individual ed Enterprise. La combinazione produce una lettura più fine. Una clausola può incidere in modo diverso su un consumatore europeo, su un'azienda che usa API o su un lettore globale interessato alla postura generale.

Questa impostazione diventa particolarmente utile quando si parla di AI training, trasferimenti internazionali, consenso, cancellazione, retention o uso dei dati per sicurezza/frode. Il tema non è solo "cosa dice il testo", ma "cosa significa in un contesto".

La piattaforma include anche heatmap regionali e indicatori geografici per rendere più immediata la lettura visuale. La mappa non è decorativa: serve a collegare il dato testuale a un perimetro giuridico e di mercato.

## 11. AI Live Assistant: interrogare il corpus, non sostituire la verifica

PolicyWatcher include un AI Live Assistant. L'utente può fare domande in linguaggio naturale sul corpus monitorato e ricevere risposte basate sulle informazioni disponibili nel dataset.

Questa funzione serve a velocizzare l'esplorazione. Invece di filtrare manualmente tutte le card, un utente può chiedere quali aziende mostrano segnali più critici su AI training, quali hanno policy con rischio alto in EU, o quali documenti meritano revisione.

L'assistant integra input vocale via Web Speech API e output vocale tramite Google Cloud Text-to-Speech con fallback browser. L'interfaccia include visualizzazioni dello stato, come idle, listening, processing e speaking.

Il punto metodologico è lo stesso del resto della piattaforma: l'assistant non deve essere trattato come fonte primaria. È un'interfaccia conversazionale sul dataset. La fonte resta il documento provider e il record versionato.

## 12. Report PDF, share page ed embed: portare l'evidenza fuori dalla dashboard

Una piattaforma di monitoraggio diventa più utile quando i risultati possono circolare. PolicyWatcher include export CSV, report PDF executive, pagine share e widget embed.

Il report PDF è pensato come documento A4 sintetico per board, legal, governance o audit interno. Include elementi chiave come punteggio, sintesi, rischio, raccomandazioni e contesto. Non è un parere legale, ma un formato comodo per briefing.

Le pagine `/share/[id]` e `/change/[id]` permettono di condividere un cambiamento specifico. L'Open Graph dinamico rende le anteprime più leggibili quando il link viene pubblicato su social o in chat. L'embed `/embed/change/[id]` consente di integrare una change card in pagine esterne.

Per una testata tecnologica, questa parte è particolarmente interessante: un sistema che monitora policy può diventare anche una fonte di materiale verificabile per articoli, approfondimenti e osservatori periodici.

## 13. Email alert e digest: dal monitoraggio passivo all'azione

PolicyWatcher integra notifiche email. Gli utenti possono iscriversi, scegliere preferenze e ricevere alert quando vengono rilevati cambiamenti. Sono previsti alert istantanei, digest settimanali e digest mensili.

La parte sicurezza non è secondaria: il sistema usa token di unsubscribe, preference allowlist, rate limiting e template email con escaping dei valori dinamici. Dopo gli audit precedenti, la piattaforma evita di esporre record subscriber o token in modo improprio.

Questa funzione trasforma PolicyWatcher da strumento da consultare manualmente a sistema di allerta. Per chi segue privacy, AI governance o policy di piattaforma, non dover ricordare di controllare ogni sito è un vantaggio concreto.

## 14. La console amministrativa: dove si controlla la qualità del sistema

La console admin è una delle parti più importanti della release 3.5.1. Non è solo un pannello gestionale: è il luogo in cui PolicyWatcher prova a rendere governabile il proprio dataset.

L'area amministrativa include:

- login admin e auditor;
- sessioni HTTP-only firmate HMAC;
- rate limit sul login;
- confronto credenziali constant-time;
- dashboard admin;
- metriche sistema;
- gestione aziende;
- gestione policy;
- Dataset QA;
- review log;
- KPI audit matrix;
- stato cron;
- cron control;
- database inspection;
- explainability;
- export backup cifrato;
- decrypt-preview del backup.

Il ruolo auditor è importante perché suggerisce una separazione tra chi gestisce e chi revisiona. Anche se la piattaforma è ancora un progetto in evoluzione, la direzione è chiara: non basta avere dati, bisogna poter dimostrare come vengono controllati.

La console non è proposta come CTA pubblica. Nel sito pubblico si possono mostrare le funzioni amministrative e la filosofia di controllo, ma non c'è bisogno di trasformare l'area admin in un elemento promozionale. È una sala di controllo, non una vetrina.

## 15. Dataset QA: il sigillo credibile non è un bollino, è un processo

La funzione Dataset QA è centrale. Un sistema che valuta policy deve prima valutare il proprio dataset. PolicyWatcher esegue controlli su:

- presenza inventario policy;
- valori `dataStatus` accettati;
- coerenza tra `currentText` e `currentHash`;
- allineamento tra ultima versione e stato corrente;
- hash dei record versione;
- presenza di almeno un check log per policy;
- validità dell'ultimo check log;
- allineamento tra check log e status policy;
- hash e lunghezza testo del check log;
- timestamp necessari;
- URL duplicati normalizzati;
- parseabilità di `riskReasonsJson`;
- icon key supportate;
- copertura KPI;
- copertura regional impact;
- source-fit rispetto alla giurisdizione.

La piattaforma distingue blocker e warning. Un blocker dovrebbe fermare una release pubblica. Un warning segnala ambiguità o deriva da rivedere. Dopo il passaggio di hardening della 3.5.1, i record seed o demo sono trattati come blocker di source-evidence: possono servire per sviluppo e dimostrazione controllata, ma non devono alimentare statement pubblici finché non vengono sostituiti da retrieval reali e verificabili. Resta inoltre visibile il caso Plaid, dove più record puntano allo stesso legal hub `https://plaid.com/legal`: potrebbe essere corretto, ma la piattaforma lo evidenzia perché la qualità non consiste nel nascondere l'ambiguità.

La release Audit Operations aggiunge decisioni persistenti sulle issue: open, reviewed, ignored. Se un'anomalia viene ignorata, l'amministratore deve indicare una ragione. Se viene riaperta, la decisione entra nel log. Questo evita che la qualità diventi un gesto manuale non tracciato.

## 16. Review log append-only: memoria operativa delle decisioni

Il review log è una funzione apparentemente tecnica, ma concettualmente forte. Registra gli eventi di revisione in modo append-only, cioè come sequenza di decisioni che non viene semplicemente sovrascritta.

Perché serve? Perché in un sistema di policy intelligence molte decisioni sono contestuali. Un URL duplicato può essere un errore o una scelta corretta se l'azienda usa un legal hub unico. Una fonte localizzata può essere sbagliata per un'analisi global, ma corretta per un mercato specifico. Un warning può essere accettato temporaneamente se non esiste una fonte migliore.

Il review log consente di documentare queste decisioni. Non risolve automaticamente l'ambiguità, ma impedisce che sparisca.

## 17. Scraper e ingestion: recuperare senza inventare

Il sistema di scraping segue una regola precisa: mai fabbricare dati. Se una fonte è bloccata, non raggiungibile o non valida, lo stato deve rifletterlo.

La pipeline include:

- timeout di fetch;
- retry con backoff;
- rotazione user-agent;
- gestione redirect;
- validazione final URL;
- detection di Cloudflare challenge, CAPTCHA, maintenance page, paywall e consent wall;
- soft-404 detection;
- lunghezza minima del testo;
- limite massimo di testo;
- calcolo SHA-256;
- confronto hash;
- generazione snapshot;
- creazione change record;
- eventuale analisi AI;
- scrittura dei check log.

La release 3.5 introduce un concetto di scraper cascade con fallback su archivi o fonti alternative quando disponibili. La manutenzione 3.5.1 lo rende piu rigoroso: fetch diretto, tentativo HTTP/2, renderer VPS opzionale per contenuti script-rendered, Wayback/Common Crawl solo come fallback e freshness guard per evitare che una copia d'archivio vecchia venga scambiata per una modifica nuova. La distinzione resta netta: se il dato è indisponibile, viene marcato come tale. L'applicazione non deve generare false certezze per riempire una dashboard.

Questo è un punto fondamentale per la credibilità. Molti sistemi sembrano più completi perché non mostrano i buchi. PolicyWatcher preferisce mostrarli.

## 18. Metodologia pubblica e PALO Framework

La piattaforma espone una pagina pubblica `/methodology/confidence`, bilingue, che descrive provenienza del dato, pipeline di scraper, limiti dell'AI e confini di utilizzo. È un elemento essenziale: un utente deve poter capire come funziona il sistema prima di fidarsi delle sue sintesi.

PolicyWatcher è anche allineato al PALO Framework, Principled AI Lifecycle Orchestration, sviluppato da Fabrizio Degni. PALO sintetizza riferimenti come ISO 42001, EU AI Act, OECD AI Principles e NIST AI RMF in un ciclo operativo. PolicyWatcher si colloca soprattutto nella fase di deployment and monitoring: osserva sistemi e policy già in uso, traducendo principi astratti in KPI e segnali monitorabili.

Questo collegamento è utile perché impedisce alla piattaforma di essere vista come un semplice aggregatore di policy. L'ambizione è più ampia: creare una grammatica operativa per leggere il rapporto tra piattaforme digitali, diritti degli utenti, governance AI e trasparenza.

## 19. Trust & Quality: GitHub, badge e verifiche pubbliche

Un elemento distintivo è il portale GitHub. Il repository pubblico è parte della piattaforma, non solo il luogo dove sta il codice. README, changelog, SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, workflow GitHub e documentazione di validazione terze parti servono a rendere più leggibile lo stato del progetto.

PolicyWatcher espone:

- GitHub Actions Quality Gate;
- CodeQL;
- OpenSSF Scorecard;
- OpenSSF Best Practices project 13465 in stato passing;
- Targeted Reliability Coverage workflow;
- SonarQube Cloud readiness;
- Codecov readiness;
- documentazione per MDN HTTP Observatory;
- documentazione per SecurityHeaders.com.

È importante usare le parole giuste. Questi badge non certificano la sicurezza della piattaforma. Indicano che esistono controlli pubblici, workflow eseguiti, self-attestation open-source e segnali di qualità operativa. In un ecosistema dove spesso si confonde il badge con la prova definitiva, PolicyWatcher sceglie una formulazione più rigorosa: evidenza pubblica, non certificazione.

La pagina `/trust` nel sito spiega proprio questo. Mostra i badge e chiarisce cosa significano. È un modo intelligente di usare la trasparenza: non come marketing, ma come ispezionabilità.

## 20. API e architettura tecnica

PolicyWatcher è costruita con Next.js 16.2.9, React 19, TypeScript, Prisma ORM, SQLite, CSS Modules, Framer Motion, Lucide React, Recharts, @react-pdf/renderer, Nodemailer, PapaParse, Cheerio e Google Gemini 2.5 Flash. La parte di recupero piu difficile può appoggiarsi a un renderer VPS separato basato su Playwright/Chromium, protetto da bearer secret e controlli SSRF su URL iniziali, redirect e subresource request.

Le API principali includono:

- `/api/companies` per elenco aziende, policy e ultime modifiche;
- `/api/policies/[id]` per dettaglio policy;
- `/api/changes` per timeline;
- `/api/chat` per assistant;
- `/api/scrape` per re-scan manuale protetto;
- `/api/compare` per confronto aziende;
- `/api/matrix` per matrice KPI;
- `/api/trends` per andamento storico;
- `/api/report/[policyId]` per PDF;
- `/api/subscribers` per iscrizione e disiscrizione;
- `/api/cron/check-all` per full check protetto;
- `/api/cron/weekly` e `/api/cron/monthly` per digest;
- `/api/health` protetto;
- API admin per auth, companies, policies, metrics, dataset quality, review log, kpi audit, cron status, encrypted export e decrypt preview.

Il database usa un modello coerente con il ciclo di vita del dato: Company, Policy, PolicySnapshot, PolicyChange, RegionImpact, Subscriber, PolicyCheckLog, AdminReviewLog e DatasetQaIssueReview. Questa struttura consente di separare entità, versioni, cambiamenti, impatti, controlli e decisioni umane.

SQLite è adatto alla fase attuale e rende semplice il deploy, ma il progetto è pensato per una futura migrazione verso PostgreSQL se la scala lo richiederà.

## 21. Sicurezza: cosa è stato hardenizzato

Sul piano security, la piattaforma ha introdotto diverse misure:

- disabilitazione di `X-Powered-By`;
- CSP con nonce per richiesta;
- `default-src 'none'`;
- `object-src 'none'`;
- `base-uri 'self'`;
- `form-action 'self'`;
- `frame-ancestors` differenziato;
- HSTS sulle route non embed;
- `X-Content-Type-Options: nosniff`;
- Referrer-Policy;
- Permissions-Policy;
- sessioni admin HMAC;
- `SESSION_HMAC_SECRET` dedicato;
- bearer token per API protette;
- seed endpoint disabilitato in produzione salvo flag esplicito;
- validazione egress scraper;
- renderer VPS con bearer secret e validazione SSRF su redirect e subresource;
- rate limiting;
- escaping email;
- protezione token subscriber;
- backup cifrato.

La sicurezza non è descritta come "risolta". È trattata come processo continuo, con CodeQL, quality gate, audit npm, documentazione e scansioni live da eseguire dopo il deploy. Questo è il modo corretto di parlare di sicurezza in un progetto pubblico: dichiarare controlli, margini e limiti.

## 22. Roadmap: Feature Drop e Confidence Release

Un'idea interessante emersa nella piattaforma è distinguere due tipi di rilascio.

Le release major, come 3.0, 4.0 o 5.0, possono essere viste come Feature Drop: introducono nuove capacità, nuove viste, nuovi moduli, nuova superficie funzionale.

Le release intermedie `.5`, come 3.5, diventano Confidence Release: consolidano, misurano, verificano, documentano, migliorano QA, sicurezza, affidabilità, trasparenza e fiducia. È una scelta matura perché evita la corsa infinita alle feature. In un sistema che vuole parlare di governance, credibilità e dati, la manutenzione non è secondaria: è parte del prodotto.

La roadmap pubblica distingue controlli già consegnati, workstream attivi e capacità future. Tra le direzioni naturali ci sono estensione del review log, readiness PostgreSQL, maggiore copertura test, mapping normativo più granulare, webhook firmati con replay protection e integrazione più profonda di validazioni esterne.

## 23. Perché può interessare i lettori di Tom's Hardware Italia

PolicyWatcher intercetta un tema che sta diventando centrale: il rapporto tra tecnologia, diritti digitali, AI e trasparenza contrattuale. Le piattaforme che usiamo ogni giorno non cambiano solo attraverso nuove app o nuovi modelli AI. Cambiano anche attraverso documenti legali aggiornati, clausole riscritte e perimetri di consenso ridefiniti.

Per un lettore consumer, questo significa capire meglio come i servizi trattano dati e contenuti. Per un lettore business, significa avere un primo strumento per orientarsi tra provider. Per uno sviluppatore, significa monitorare API terms e condizioni di utilizzo. Per un giornalista, significa avere una base per individuare pattern di cambiamento. Per un ricercatore, significa osservare il comportamento documentale delle piattaforme nel tempo.

Il valore non è dire "questa azienda è buona" o "questa azienda è cattiva". Il valore è rendere comparabile ciò che normalmente resta disperso.

## 24. Limiti dichiarati: una piattaforma più credibile perché non nasconde i confini

Un articolo serio deve chiarire anche i limiti. PolicyWatcher analizza testi pubblicamente disponibili e fonti configurate. Non può verificare pratiche interne non pubbliche, accordi riservati, implementazioni tecniche reali o condotte aziendali non documentate. Un provider può bloccare il recupero automatico. Una policy può essere localizzata in modo ambiguo. Una pagina può cambiare struttura. Un output AI può richiedere revisione.

Questi limiti non indeboliscono la piattaforma se vengono trattati correttamente. Al contrario, la rafforzano. Un sistema che espone data status, check log, issue QA, review decision e metodologia è più credibile di un sistema che mostra solo risultati finiti.

La scelta di rimuovere il disclaimer vistoso dalla prima schermata, mantenendo però l'accettazione dei confini d'uso in un secondo step, va letta in questa direzione. Il messaggio non deve essere "non fidatevi"; deve essere "fidatevi del metodo, e verificate le fonti quando serve".

## 25. Conclusione: dalla lettura delle policy alla qualità dell'osservazione

PolicyWatcher nasce da un'intuizione semplice: le policy delle grandi piattaforme sono diventate troppo importanti per essere lette solo quando scoppia una polemica. Servono strumenti continui, comparabili, ispezionabili.

La piattaforma non sostituisce avvocati, DPO, ricercatori o giornalisti. Offre loro un layer operativo: recupera fonti, rileva modifiche, organizza evidenze, sintetizza, confronta, visualizza e registra la qualità del dato. La parte davvero interessante non è solo l'uso dell'AI, ma il tentativo di incorniciarla dentro un sistema di controllo: Dataset QA, review log, GitHub, badge pubblici, metodologia, changelog, trust page e roadmap.

In un periodo in cui ogni prodotto promette "AI-powered" qualcosa, PolicyWatcher prova a fare una cosa più utile: mostrare cosa sa, come lo sa, da dove lo ha preso e dove serve ancora revisione umana.

Se il futuro della tecnologia sarà sempre più regolato da policy dinamiche, allora monitorare quelle policy non sarà una nicchia. Sarà una forma di alfabetizzazione digitale avanzata. PolicyWatcher è un primo tentativo concreto di costruire questa infrastruttura civica.

---

## Box tecnico: funzioni principali e scopo

| Funzione | A cosa serve |
| --- | --- |
| Dashboard pubblica | Visione d'insieme di aziende, policy, rischio, contesto e stato Dataset QA. |
| Filtri EU/US/Global | Separano l'impatto per mercato e riducono il rischio di valutazioni fuori contesto. |
| Prospettiva Individual/Enterprise | Distingue impatti consumer da impatti business. |
| Market Pulse | Mostra le modifiche recenti come segnale temporale del mercato. |
| Timeline | Permette analisi storica e navigazione cronologica dei cambiamenti. |
| Policy deep-dive | Apre dettaglio, diff, AI summary, trend, archive e telemetry. |
| Risk reasons | Spiegano perché un punteggio è alto, medio o basso. |
| 15 KPI Matrix | Confronta aziende su privacy, AI governance ed etica. |
| A/B Compare | Confronta due aziende con radar chart e differenze KPI. |
| Industry benchmark | Confronta una compagnia con la media del settore. |
| Regional heatmap | Collega impatti e rischi al contesto geografico. |
| AI Live Assistant | Interroga il corpus con domande naturali. |
| PDF executive report | Genera un documento sintetico per board, legal o audit. |
| Share page | Permette di condividere una change in modo stabile. |
| Embed widget | Integra una change card in pagine esterne. |
| Email alert | Notifica cambiamenti secondo preferenze utente. |
| Admin console | Gestisce dati, policy, cron, backup, QA e audit. |
| Dataset QA | Controlla qualità, coerenza e copertura del dataset. |
| Review log | Registra decisioni admin/auditor in modo append-only. |
| Trust page | Espone badge, controlli e limiti metodologici. |
| GitHub portal | Rende pubblici codice, workflow, changelog, security policy e validazioni. |

## Box metodologico: FAST

| Pilastro | Domanda guida | Implementazione in PolicyWatcher |
| --- | --- | --- |
| Fonti | Quale testo sto analizzando? | URL configurati, source hierarchy, ingestion method, version records, hash. |
| Analisi | Cosa è cambiato e che impatto può avere? | Diff, Gemini structured output, risk score, KPI, regional impact. |
| Stato del dato | Quanto è affidabile il record in questo momento? | `dataStatus`, ingestion method, check log, timestamps, QA issue queue. |
| Trasparenza | Chi può verificare processo e limiti? | GitHub, README, changelog, `/trust`, metodologia, OpenSSF, CodeQL, Quality Gate, renderer notes. |

## Link utili da includere nella pubblicazione

- Sito pubblico: https://policywatcher.online
- Repository GitHub: https://github.com/sev7enITA/policywatcher
- Trust & Quality: https://policywatcher.online/trust
- Methodology Confidence: https://policywatcher.online/methodology/confidence
- Roadmap: https://policywatcher.online/roadmap
- Showcase: https://policywatcher.online/showcase
- OpenSSF Best Practices: https://www.bestpractices.dev/projects/13465
