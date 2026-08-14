# PolicyWatcher - Stato dell'Arte

Data: 2026-07-05
Traccia: 3.5.1 Confidence Maintenance / Audit Operations
Scope: sorgente locale, documentazione pubblica, package Hostinger e renderer VPS separato

## Sintesi

PolicyWatcher oggi va presentata come piattaforma civic-tech ispezionabile per
monitorare fonti policy pubbliche configurate. Non certifica la conformita
legale e non valida il comportamento interno delle aziende. Il posizionamento
corretto e piu stretto, ma molto piu difendibile:

> PolicyWatcher mappa testi policy pubblici da fonti configurate, registra
> evidenza di recupero, rileva modifiche testuali, espone lo stato Dataset QA e
> dichiara i limiti dell'analisi assistita da AI.

La traccia 3.5 Confidence e la manutenzione 3.5.1 hanno lavorato su
affidabilita, tracciabilita e fiducia verificabile: stato del dato visibile,
metodo di ingestione, check log, decisioni QA append-only, pagine pubbliche di
trust, evidenza OpenSSF, hardening security headers, migrazione source-fit degli
URL e renderer separato per pagine policy renderizzate via script.

## Cosa cambia nella 3.5.1

### Recupero fonti e scraper confidence

- Il fetch HTTP/1.1 diretto resta il percorso primario.
- HTTP/2 esplicito viene tentato quando un provider rifiuta HTTP/1.1 o
  restituisce una shell inutilizzabile.
- Un renderer VPS opzionale puo eseguire fetch con browser headless per pagine
  script-rendered.
- Il renderer non gira su Hostinger: e un servizio VPS separato perche Chromium
  non e adatto a shared hosting.
- Le chiamate renderer sono protette da `RENDERER_SECRET`.
- URL iniziali, redirect del browser e subresource requests sono validati
  contro regole SSRF.
- Wayback Machine e Common Crawl sono fallback solo quando il recupero live
  fallisce.
- Gli snapshot archivio piu vecchi dell'ultimo controllo riuscito vengono
  rifiutati, per evitare che una cache vecchia sembri una modifica nuova.
- I corpi WARC di Common Crawl vengono decompressi prima dell'estrazione testo.

### Source-fit e Dataset QA

- La migrazione URL puo girare in `--dry-run` prima di toccare produzione.
- Le migrazioni possono essere limitate per azienda, nome policy e
  giurisdizione.
- Le fonti Meta e Wise sono state corrette evitando URL localizzati o non
  adeguati quando esiste una fonte canonica o specifica di mercato migliore.
- Dataset QA controlla igiene URL, coerenza hash, allineamento ultima versione,
  presenza check log, stato ultimo check, timestamp, duplicati normalizzati,
  parseabilita JSON delle risk reasons, KPI coverage e region-impact coverage.
- Le issue Dataset QA possono essere segnate come reviewed, ignored con
  motivazione o reopened.
- Ogni decisione QA scrive un evento append-only nel review log admin.

## Superficie pubblica aggiornata

Sono stati allineati:

- `/trust`, con badge e spiegazione del loro significato.
- `/methodology/confidence`, con provenienza dati, cascata di recupero, limiti
  AI e confine non-certification.
- `/roadmap`, con distinzione tra consegnato, pianificato e rimandato.
- `/showcase`, con panoramica delle funzioni senza link pubblico alla login
  admin.
- `/security`, con disclosure policy e controlli della 3.5 Confidence.
- `README.md`, `CHANGELOG.md` e questo report.
- `docs/third-party-validation.md`, con setup per GitHub, CodeQL, OpenSSF,
  Sonar, Codecov, MDN Observatory, SecurityHeaders.com e renderer.

## Funzioni attuali

### Interfaccia pubblica

- Card azienda e policy.
- Filtri EU, US e Global.
- Filtri prospettiva individual e enterprise.
- Ricerca e filtro settore.
- Timeline dei record di modifica.
- Dettaglio policy con overview, diff, archive, AI governance, risk trend,
  remediation, fonti e telemetry.
- Region heatmap e mappa giurisdizioni.
- Risk trend chart.
- Radar benchmark di settore.
- Matrice KPI governance.
- Report PDF executive.
- Pagine change pubbliche, share view, embed widget e OG image.
- Pagine trust, methodology, roadmap, security e showcase.

### Console amministrativa

- Ruoli admin e auditor.
- Sessioni HTTP-only firmate HMAC.
- Rate limit login e confronto credenziali constant-time.
- Metriche sistema.
- Gestione aziende e policy.
- Dataset QA status, issue queue, decisioni e export CSV.
- Review Log append-only con pagina e API.
- KPI audit matrix.
- Explainability.
- Cron status e controlli scan.
- Ispezione database.
- Backup cifrato e decrypt-preview.
- Telemetry evidenza nel dettaglio policy.

La console admin puo essere descritta pubblicamente, ma il percorso login non
deve diventare una CTA promozionale.

## Snapshot Dataset e QA

Profilo locale di riferimento:

Inventario locale configurato, non evidenza pubblica di confidence finche non
sono disponibili log di retrieval non-seeded:

| Area | Conteggio |
| --- | ---: |
| Aziende | 16 |
| Policy | 50 |
| Record versione policy | 103 |
| Record cambiamento | 53 |
| Impatti regionali | 318 |
| Check log policy | 50 |
| Subscriber | 1 |

Stato Dataset QA di riferimento:

- Blocker source-evidence: presenti finche i record restano seed/demo.
- Dati pubblici confidence: filtrati finche una scansione reale non produce evidenza non-seeded.
- Sospensione pubblica sorgenti: sorgenti anomale, seed-only, parziali,
  `Needs Review` o `Unavailable` espongono solo un avviso e metadati minimi.
  Testo policy, score, timeline, KPI e sintesi IA restano nascosti.
- Gate publicEvidence: snapshot e change devono avere `publicEvidence=true`
  prima di alimentare API pubbliche, sitemap, digest, share page, report,
  timeline o benchmark.
- Evidenza archivio: i recuperi Wayback/Common Crawl persistono il timestamp
  dello snapshot archivio; Dataset QA segnala righe archivio `Available` senza
  quel dato.
- Completeness guard: recuperi troncati o incompleti diventano sospensioni
  `Partial`, non baseline complete o change con score AI.
- Protezione re-baseline: il primo fetch riuscito dopo evidenza di ingestion
  `Seeded` sostituisce la history seedata per quella policy e crea una sola
  snapshot baseline verificata, senza PolicyChange, score AI o email subscriber.
  Il solo stato `Configured` non attiva re-baseline distruttiva e l'operazione
  si ferma se esistono gia evidenza sorgente reale, snapshot pubbliche o history
  revisionata.
- Alert amministrativo operativo: le sospensioni manuali o schedulate possono
  inviare una mail all'amministratore configurato con metadati, motivo del
  failure, sorgente di trasporto, timestamp e link alla console Dataset QA.
- Follow-up source remediation: l'ambiguita Plaid legal-hub e stata risolta con
  estrazione anchor-scoped; Klarna EU Terms resta intenzionalmente sospesa quando
  la pagina ufficiale inglese EU/Ireland restituisce solo un corpo placeholder
  troppo breve.

Note QA:

- I record seed non sono evidenza pubblica di confidenza. Devono essere sostituiti
  da log di retrieval direct, HTTP/2, VPS-rendered, Wayback o Common Crawl prima
  di promuovere statement pubblici su timeline e dashboard.
- I legal hub ampi devono usare anchor di sezione quando il provider li espone.
  Plaid ora mappa privacy/EUSA su sezioni specifiche. Se una fonte ufficiale
  restituisce solo un placeholder breve, come osservato per Klarna EU Terms, il
  record deve restare sospeso finche non viene trovata una fonte piu robusta.

## Sicurezza ed evidenza esterna

Controlli implementati:

- CSP con nonce tramite Next Proxy;
- `default-src 'none'`, `object-src 'none'`, `base-uri 'self'`,
  `form-action 'self'` e `frame-ancestors` per route;
- HSTS, `nosniff`, Permissions Policy e Referrer Policy stretta;
- sessioni admin HMAC;
- `SESSION_HMAC_SECRET` dedicato obbligatorio;
- check bearer per API;
- protezione token subscriber;
- escaping valori dinamici email;
- backup cifrato;
- seed endpoint disabilitato in produzione salvo flag esplicito non-prod;
- validazione egress scraper;
- validazione SSRF renderer.

Segnali pubblici:

- GitHub Quality Gate.
- CodeQL.
- OpenSSF Scorecard.
- OpenSSF Best Practices project `13465` in stato passing.
- Targeted reliability coverage workflow.
- SonarQube Cloud pronto per `SONAR_TOKEN`.
- Codecov pronto per `CODECOV_TOKEN`.
- Link live a MDN HTTP Observatory e SecurityHeaders.com.

Sono evidenze operative, non certificazioni legali, regolatorie o di sicurezza.

## Note Deploy

Variabili Hostinger:

- `NODE_ENV=production`
- `APP_URL=https://policywatcher.online`
- `API_SECRET`
- `SESSION_HMAC_SECRET`
- `ADMIN_USER`
- `ADMIN_PASSWORD`
- `AUDITOR_USER`
- `AUDITOR_PASSWORD`
- `GEMINI_API_KEY`
- `DATABASE_URL`
- `RENDERER_URL=https://render.policywatcher.online` quando il renderer e attivo
- `RENDERER_SECRET` con lo stesso valore configurato nel servizio VPS

Impostazioni produzione:

- Lasciare `ALLOW_DATABASE_SEED_ENDPOINT` non impostato o `false`.
- Ruotare segreti apparsi in screenshot o log.
- Eseguire `npx prisma db push` dopo modifiche schema.
- Lanciare migrazioni URL prima con `--dry-run`.
- Eseguire `npm run qa:dataset` dopo repair o migrazioni database.
- Verificare `/trust`, badge live, MDN Observatory e SecurityHeaders.com dopo
  il deploy, perche i proxy hosting possono modificare gli header.

## Rischi e prossime priorita

- Confermare o rifinire il mapping Plaid legal hub.
- Tenere allineati e ruotati i segreti Hostinger e renderer VPS.
- Configurare branch protection GitHub con Quality Gate obbligatorio.
- Completare setup Codecov e SonarQube Cloud se i badge verranno promossi.
- Aggiungere test mirati su route API oltre alla coverage utility corrente.
- Pianificare readiness PostgreSQL per dataset piu grandi.

## Conclusione

La linea 3.5 va raccontata come Confidence Release: meno slogan, piu evidenza.
PolicyWatcher e piu forte quando mostra cosa ha controllato, da quale fonte
arriva il testo, cosa ha inferito il modello, cosa resta incerto e quali azioni
di revisione umana sono state registrate.
