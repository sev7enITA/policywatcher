# Audit funzionale e tecnico — Canonical Evidence Wave 1B

Release line: `4.0.0-beta.1`

Data audit: 19 agosto 2026

Ambito: backfill, riconciliazione e dual-write `Entity → Document → Version → Change → Provision`

## Verdetto

**GO per il codice e per il rehearsal; attivazione produzione ancora PENDING.**

La Wave 1B è implementata, compila, supera la suite applicativa e ha completato un rehearsal su una copia SQLite sanitizzata. Non sono stati modificati dati di produzione. L'attivazione live richiede ancora backup ripristinabile, finestra di manutenzione, dry-run/apply sulla copia reale, riconciliazione a zero anomalie e attivazione esplicita del flag.

Il read path pubblico e amministrativo resta legacy. Questa wave riduce il rischio della migrazione dati, ma non autorizza ancora il passaggio delle letture canoniche, PostgreSQL in produzione o object storage.

## Audit funzionale

| Capacità | Esito | Evidenza |
| --- | --- | --- |
| Dry-run storico senza scritture | PASS | 17 Company, 50 Policy, 91 Snapshot e 40 PolicyChange; `status=ready`, nessuna source issue |
| Backfill completo | PASS | 17 Entity, 50 Document, 91 Version, 91 Change e 240 Provision |
| Riconciliazione | PASS | conteggi attesi/reali identici, 0 errori, 0 warning |
| Idempotenza | PASS | secondo apply: conteggi invariati prima/dopo e nuova riconciliazione pulita |
| Dual-write di nuova configurazione | PASS | smoke con Entity e Document bridged |
| Baseline verificata | PASS | prima Version e Change `baseline` create nella stessa transazione legacy |
| Cambio rilevato | PASS | seconda Version, Change `detected` e 6 Provision create nello smoke |
| Gate pubblicazione | PASS | `publicEvidence`, `publishedAt` e `reviewStatus` confrontati con i record legacy |
| Cancellazione | PASS | fixture rimossa da entrambi i grafi; riconciliazione finale pulita |
| Seed di sviluppo | PASS | rebuild completo con 103 Version, 103 Change e 318 Provision riconciliate |
| Gate attivazione | PASS | database riconciliato accettato; fixture legacy non backfillata respinta con exit code 2 e soli codici bounded |
| Letture e metriche attuali | INVARIATE | nessun read switch; publication readiness continua a usare il database operativo legacy |
| Produzione | NON ESEGUITA | nessun dato live letto, copiato, trasformato o cancellato |

### Impatto funzionale

- Gli utenti non vedono cambiamenti di contenuto o URL: il grafo canonico non alimenta ancora le pagine.
- Con il flag disabilitato, il comportamento operativo resta quello precedente.
- Con il flag abilitato dopo il backfill, creazione azienda/policy, baseline, cambi rilevati, decisioni di pubblicazione e cancellazioni amministrative aggiornano entrambi i grafi.
- Un errore canonico annulla anche la mutazione legacy; la parità viene preferita alla disponibilità della singola scrittura.
- Arbitration e liability restano `not_assessed` quando il legacy non contiene un campo strutturato compatibile. Non viene inventata evidenza legale.

## Audit tecnico

### Integrità e identità

- ID pubblici deterministici e versionati: prefissi `ent_`, `doc_`, `ver_`, `chg_`, `prv_` con digest SHA-256 troncato a 128 bit.
- Le chiavi canoniche usano UUID legacy immutabili come input interno; nomi, slug, tipo, giurisdizione e URL non cambiano l'identità pubblica.
- Ogni testo Snapshot viene ricontrollato contro SHA-256 prima della proiezione.
- Hash duplicati nello stesso documento, relazioni cross-policy e conflitti di stable ID bloccano il run.
- La riconciliazione verifica conteggi, bridge, contenuti, URL, timestamp, gate pubblici, baseline/transizioni, tassonomia e orphan.

### Transazioni e ripetibilità

- I percorsi applicativi chiamano lo stesso proiettore usato dal backfill.
- Il dual-write gira dentro la transazione Prisma della mutazione legacy; non esiste una coda asincrona che possa perdere il secondo lato.
- Il backfill è idempotente, aggiorna per bridge/stable ID e non sovrascrive un'identità in conflitto.
- L'apply storico usa transazioni per Company/Policy: un errore non corrompe il grafo corrente e il run è ripetibile, ma non è una singola transazione globale.
- Un evento `AdminReviewLog` viene scritto solo dopo un apply interamente riconciliato.

### Sicurezza operativa

- Il comando predefinito è dry-run.
- Apply richiede un acknowledgement esatto e non memorizzato nell'`.env.example`.
- Dual-write richiede `POLICYWATCHER_DOCUMENT_EVIDENCE_DUAL_WRITE=1`; valori come `true` non lo attivano.
- Lo smoke mutativo rifiuta `NODE_ENV=production` e target privi di un marker non-prod.
- Managed build e runtime rifiutano il flag dual-write quando la riconciliazione contiene errori o warning; i log espongono solo conteggi aggregati e codici bounded.
- I report sono creati con permessi `0600` e non vengono sovrascritti.

## Rehearsal eseguito

Sorgente: copia consistente e sanitizzata di `prisma/dev.db`; SHA-256 della copia sanitizzata `db66a0aa8266645499fd91f2afc5bec8306289dba18b779689416308d72a489f`.

Sequenza completata:

1. migrazioni SQLite: `14/14`, incluse investor access e canonical evidence;
2. dry-run: `ready`, zero source issues;
3. apply: `applied`, riconciliazione `reconciled`;
4. secondo apply: conteggi invariati;
5. dual-write smoke: tutte le sei assertion vere;
6. cleanup fixture: riconciliazione `reconciled`;
7. seed completo: grafo ricostruito e riconciliato.

Report locali riservati:

- `artifacts/document-evidence/rehearsal-dry-run-2026-08-19.json`
- `artifacts/document-evidence/rehearsal-apply-2026-08-19.json`
- `artifacts/document-evidence/rehearsal-idempotency-2026-08-19.json`
- `artifacts/document-evidence/rehearsal-dual-write-smoke-2026-08-19.json`
- `artifacts/document-evidence/rehearsal-dual-write-smoke-v2-2026-08-19.json`
- `artifacts/document-evidence/rehearsal-final-reconciliation-v2-2026-08-19.json`
- `artifacts/document-evidence/rehearsal-seed-reconciliation-2026-08-19.json`

## Verifiche codice

- Vitest completo: **153 file / 999 test PASS**.
- Test focalizzati evidence/baseline: **3 file / 15 test PASS**.
- Contratti focalizzati activation/Hostinger/PostgreSQL/rehearsal: **4 file / 29 test PASS**; il workflow ora backfilla la fixture SQLite, verifica l'import e lancia il dual-write smoke sul PostgreSQL CI usa-e-getta.
- TypeScript: **PASS**.
- ESLint web + companion Expo tramite il gate root `npm run lint`: **PASS**.
- Supply chain pre-promozione del 20 agosto 2026: override `deepmerge-ts` **8.0.1**, Prisma generate/validate **PASS** e `npm audit --omit=dev` **0 vulnerabilità note**.
- Build Next.js 16.2.11: **PASS**, 169 pagine statiche generate.
- Packaging Hostinger workspace-snapshot: **PASS**, 1.143 entry con verifica contenuti/checksum; è evidenza locale non promuovibile finché il worktree non è reviewato e committato.

## Rischi residui e gate mancanti

1. **Produzione non riconciliata:** i conteggi del rehearsal non sostituiscono quelli live.
2. **Dual-write non attivo:** è intenzionalmente off finché il backfill produzione non passa.
3. **Read switch non eseguito:** le letture canoniche richiedono un successivo periodo di shadow-read/parity.
4. **Payload inline:** `Version.contentText` resta il contenitore transitorio; object storage non è attivo.
5. **Mapping tassonomico iniziale:** i campi legacy vengono proiettati in modo conservativo e richiedono revisione umana prima di nuove affermazioni pubbliche.
6. **Costo per history:** il proiettore rilegge il grafo completo della singola policy; è corretto per la scala attuale, ma latenza e lock vanno monitorati con storici lunghi.
7. **Concorrenza PostgreSQL:** una collisione di sequence/unique constraint fallisce chiusa e annulla la scrittura; retry e metriche operative vanno provati prima del cutover.
   Il nuovo smoke PostgreSQL è configurato in CI ma non è stato eseguito localmente in questo audit perché non era disponibile un target PostgreSQL isolato.
8. **Script maintenance legacy:** i vecchi repair/remediation script non sono tutti dual-write transazionali. Durante l'attivazione devono restare sospesi oppure essere seguiti da backfill e riconciliazione.

## Decisione consigliata

Promuovere questa implementazione in staging con dual-write disabilitato, eseguire il runbook sulla copia rappresentativa e poi su produzione durante manutenzione. Attivare il flag solo con report `applied` + `reconciled`, zero errori/warning e backup verificato. La successiva wave dovrebbe introdurre shadow reads canoniche e telemetria di parity prima di qualsiasi read switch.

Runbook: `docs/document-evidence-backfill-runbook.md`

Modello: `docs/document-evidence-model.md`
