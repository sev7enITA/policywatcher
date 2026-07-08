# PolicyWatcher - Stato dell'Arte

Data: 2026-07-02  
Traccia: 3.5.1 Audit Operations
Scope: sorgente locale e dataset SQLite locale prima del commit/deploy pubblico

## Sintesi

PolicyWatcher e oggi una piattaforma civic-tech per monitorare fonti policy
configurate, rilevare modifiche, produrre letture assistite da AI e mostrare
in modo ispezionabile lo stato qualitativo del dataset usato.

La release 3.5.1 Audit Operations estende la baseline 3.5 Confidence e sposta
il baricentro dalla sola crescita funzionale alla fiducia verificabile: stato
del dato, log dei controlli, decisioni QA persistenti, limiti metodologici,
controlli CI, scansioni di sicurezza e documentazione pubblica dei confini.

La formulazione pubblica piu solida e:

> PolicyWatcher mappa testi policy pubblicamente accessibili da fonti
> configurate ed espone analisi, evidenza di cambiamento, stato QA del dataset
> e limiti metodologici.

Sono da evitare claim come certificazione, conformita assicurata, copertura
esaustiva, valutazione legale definitiva o monitoraggio real-time.

## Profilo Dataset

Conteggi locali al momento del report:

| Area | Conteggio |
| --- | ---: |
| Aziende | 16 |
| Policy | 50 |
| Record di versione policy | 103 |
| Record di cambiamento | 53 |
| Impatti regionali | 318 |
| Log controllo policy | 50 |
| Subscriber | 1 |

Stato dati corrente:

| Stato dato | Conteggio |
| --- | ---: |
| Available | 50 |

Nota: `Available` significa che il record locale ha evidenze interne coerenti.
Non significa che la fonte provider sia raggiungibile in questo istante, che la
policy sia legalmente completa o che il contenuto sia verificato da terzi.

## Funzioni Pubbliche

La piattaforma include:

- dashboard aziende e policy;
- risk score, risk label, sintesi, key point e risk reasons;
- badge Dataset QA per policy e stato aggregato sulla company card;
- filtri per EU, US, Global, privato e azienda;
- comparazione tra aziende e radar benchmark;
- matrice KPI;
- dettaglio policy con overview, diff, archive, AI governance, trend, fonti ed
  evidenza telemetry;
- timeline pubblica delle modifiche;
- pagine pubbliche `/change/[id]`;
- pagine share e widget embed;
- report PDF executive;
- pagine `/methodology/confidence`, `/roadmap`, `/showcase` e `/trust`.

## Console Amministrativa

L'area admin oggi espone:

- ruoli admin e auditor;
- sessioni HTTP-only firmate HMAC;
- rate limit login e confronto credenziali constant-time;
- metriche sistema;
- gestione aziende e policy;
- pagina Dataset QA, issue queue, decisioni persistenti e API;
- pagina e API Review Log append-only;
- KPI audit matrix;
- documentazione explainability;
- stato cron e controlli scan;
- ispezione database;
- export backup cifrato e decrypt-preview;
- telemetry di evidenza nel dettaglio policy.

La console admin non viene linkata come CTA pubblica. La showcase descrive le
capacita di controllo senza esporre il percorso di login come elemento
promozionale.

## Data Quality e Assurance

Il comando di riferimento e:

```bash
npm run qa:dataset
```

Controlli implementati:

- presenza inventario policy;
- valori `dataStatus` accettati;
- coerenza SHA-256 tra `currentText` e `currentHash`;
- allineamento tra ultima versione e stato corrente policy;
- hash di ogni record versione rispetto al testo;
- almeno un check-log per policy;
- validita ultimo check-log;
- allineamento tra ultimo check-log e status policy;
- hash e lunghezza testo ultimo check-log;
- presenza timestamp necessari;
- duplicati URL normalizzati;
- parseabilita `riskReasonsJson` e icon key supportate.

Risultato corrente:

- Stato: `warn`
- Blocker: `0`
- Warning: `1`

Warning residuo:

- Plaid usa `https://plaid.com/legal` per piu record US/EU e piu tipologie di
  policy. Potrebbe essere un legal hub corretto, ma va confermato o raffinato
  con URL/anchor piu specifici se disponibili.

Flusso di riparazione:

```bash
npm run db:repair
npm run db:backfill-check-logs
npm run qa:dataset
```

## Metodologia AI

La metodologia pubblica chiarisce che:

- gli output derivano da record di testo recuperati/versionati;
- i campi non supportati non devono essere inventati;
- l'AI non fornisce consulenza legale;
- gli score sono indicatori analitici;
- le pratiche interne delle aziende non sono validate;
- la conformita legale non e certificata.

Lessico consigliato:

- evidenza disponibile;
- richiede revisione umana;
- fonte configurata;
- record di versione;
- Dataset QA status;
- controlli automatizzati;
- evidenza operativa.

## Sicurezza e Trust

Controlli implementati:

- `X-Powered-By` disabilitato;
- HSTS sulle route non embed;
- `X-Content-Type-Options: nosniff`;
- Referrer-Policy;
- Permissions-Policy;
- CSP con nonce generato per richiesta tramite Next Proxy;
- `default-src 'none'`, `object-src 'none'`, `base-uri 'self'`,
  `form-action 'self'` e `frame-ancestors` differenziato per route;
- confini espliciti per immagini, connessioni e frame;
- `frame-ancestors 'none'` su app principale/admin;
- route embed governata da CSP `frame-ancestors`;
- sessioni admin HMAC;
- `SESSION_HMAC_SECRET` dedicato opzionale;
- check bearer secret per API protette;
- protezione token subscriber;
- escaping dei valori dinamici nelle email;
- backup cifrato;
- seed endpoint disabilitato in produzione salvo flag esplicito non-prod;
- validazione egress scraper.

Asset di validazione repo:

- GitHub Quality Gate;
- CodeQL;
- OpenSSF Scorecard;
- badge OpenSSF Best Practices project `13465` in stato passing;
- targeted reliability coverage workflow;
- SonarQube Cloud workflow pronto per `SONAR_TOKEN`;
- Codecov upload pronto per `CODECOV_TOKEN`;
- `SECURITY.md`;
- `CONTRIBUTING.md`;
- `CODE_OF_CONDUCT.md`;
- guida validazione terze parti.

## Stato Test e Build

Validazioni locali eseguite:

```bash
npm run lint
npm run test
npm run test:coverage
npm run qa:dataset
npm run build
npm audit
npm audit --omit=dev
git diff --check
```

Risultati:

- ESLint: clean.
- Unit test: 7 file, 28 test passati.
- Targeted reliability coverage: copertura alta su linee/statement del layer utility revisionato, con copertura funzioni indicata come completa in quella specifica esecuzione.
- Dataset QA: questa fotografia precedente e superata dal gate source-evidence
  del 2026-07-05, che tratta i record seed/demo come blocker finche non
  esistono log di retrieval reali.
- Build Next production: riuscita.
- `git diff --check`: clean.
- `npm audit`: 2 vulnerabilita moderate PostCSS tramite Next.js; nessun
  high/critical rilevato. Non applicare `npm audit fix --force`, perche propone
  un cambio distruttivo/incompatibile della versione Next.

## Asset Pubblici Aggiornati

Sono stati allineati alla 3.5.1 Audit Operations:

- README;
- CHANGELOG;
- changelog modale in-app;
- How To;
- About/Overview;
- Methodology;
- `/methodology/confidence`;
- `/showcase`;
- `/trust`;
- Terms Gate;
- disclaimer banner;
- share/change pages;
- disclaimer PDF executive;
- metadata SEO;
- footer/build string;
- label versione admin;
- wording Dataset QA admin;
- documentazione validazione terze parti.

## Note Deploy Hostinger

Variabili produzione richieste:

- `NODE_ENV=production`
- `APP_URL=https://www.policywatcher.online`
- `API_SECRET`
- `SESSION_HMAC_SECRET`
- `ADMIN_USER`
- `ADMIN_PASSWORD`
- `AUDITOR_USER`
- `AUDITOR_PASSWORD`
- `GEMINI_API_KEY`
- `DATABASE_URL=file:./prisma/dev.db` o path reale Hostinger

Raccomandazioni:

- lasciare `ALLOW_DATABASE_SEED_ENDPOINT` non impostato o `false`;
- ruotare segreti apparsi in screenshot/log;
- eseguire `npx prisma db push` dopo modifiche schema;
- provare `db:repair` e `db:backfill-check-logs` su copia backup prima della
  produzione;
- verificare header sicurezza sul dominio live, perche il proxy hosting puo
  modificarli.

## Validazione Esterna

Pronto:

- GitHub Actions Quality Gate;
- CodeQL;
- OpenSSF Scorecard;
- OpenSSF Best Practices project `13465` in stato passing;
- Targeted reliability coverage workflow.

Richiede setup esterno:

- progetto SonarQube Cloud e secret `SONAR_TOKEN`;
- progetto Codecov e secret `CODECOV_TOKEN`;
- scansione MDN HTTP Observatory;
- scansione SecurityHeaders.com.

## Rischi e Priorita

P0/P1:

- confermare o raffinare mapping URL Plaid;
- ruotare segreti produzione prima del deploy;
- verificare badge e report live su `/trust` dopo deploy;
- attivare branch protection con Quality Gate obbligatorio.

P2:

- estendere il review log dalle decisioni Dataset QA ai futuri flussi di override/riesame delle policy;
- aggiungere link diretti dalle issue Dataset QA ai record admin coinvolti quando apribili in sicurezza;
- espandere i test oltre le utility reliability verso regole Dataset QA, validazione URL scraper e route API;
- mostrare nota pubblica quando Sonar/Codecov sono effettivamente configurati.

P3:

- preparare readiness PostgreSQL;
- aggiungere webhook firmati solo dopo object-level authorization e replay
  protection;
- aggiungere mapping normativi come evidenza/review need, non come verdict di
  conformita.

## Conclusione

PolicyWatcher non e piu solo una dashboard pubblica sulle policy. Con la 3.5
Confidence diventa una piattaforma di evidenze ispezionabili: mostra cosa ha
recuperato, cosa ha analizzato, quali controlli ha passato, quali limiti
dichiara e dove serve revisione umana. Questa e la base corretta per costruire
credibilita, non attraverso claim piu forti, ma attraverso controlli visibili e
verificabili.
