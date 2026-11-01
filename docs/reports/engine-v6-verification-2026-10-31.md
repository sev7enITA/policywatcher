# PolicyWatcher Engine 6 - registro della verifica locale

31 ottobre 2026. Preview `pw-engine-6.0.0-alpha.1`, branch `codex/engine-v6-local`, base `680c0e549c369f8cc8db7ea8aaeca3b3ac56903e`. Questo registro descrive prove locali, non un rilascio né una misura dell'efficacia sul catalogo reale.

## Esiti finali

| Controllo | Esito e ambito | Evidenza locale |
| --- | --- | --- |
| Suite completa Vitest | 191 file superati, 3 esclusi; **1.369 test superati, 14 esclusi** | `full-tests-final.log` |
| Regressioni del nuovo motore | **43/43**; incluse anche nella suite completa | `engine-final-regressions.log` |
| Regressioni dell'audit iniziale | 7/7; incluse nella suite completa | `src/lib/__tests__/engineAuditRegression.test.ts` |
| TypeScript applicazione | Superato | `typecheck-final.log` |
| TypeScript test critici | Superato | `typecheck-tests-final.log` |
| Lint web e companion Android | Zero errori; 15 warning web preesistenti in componenti non modificati, zero warning mobile | `lint-final.log` |
| Build Next.js di produzione | Compilazione, controllo TypeScript e generazione di 187 pagine completati con ambiente locale isolato | `build-final.log` |
| Profilo di estrazione | `node scripts/extraction-profile.mjs --check` superato | Profilo generato incluso nel manifest |
| Integrità patch | `git diff --check` superato | Patch locale |
| Migrazioni e backup | Test di parità SQLite/inizializzatori Node e Python, schema PostgreSQL e inventario backup superati nella suite | Suite completa; non è una rehearsal PostgreSQL live |

I test di rete e AI del nuovo motore impiegano trasporti e provider sintetici; i modelli effettivi hanno revisionato il codice, non eseguito questi test. Il test da 500 record prova pianificazione e deduplicazione, non 500 acquisizioni Internet riuscite. Due client SQLite non equivalgono a un test di carico con più processi.

## Percorso amministrativo provato nel browser

Server vincolato a `127.0.0.1:3018`, database dedicato `engine-preview-v2.db`, una policy chiaramente denominata “Local Demo · synthetic evidence”. Nessuna chiave API AI e nessun server SMTP configurati. Il gate di autenticazione è attivo; l'adattatore locale fornisce l'identità del client dal socket.

1. Apertura della revisione congelata: conservazione dei dati da 30 a 60 giorni, impatto 8/10, citazioni prima/dopo e verdetto sintetico esplicito.
2. Inserimento della motivazione e approvazione: UI “Saved”, revisioni pendenti da 1 a 0, baseline verificate da 0 a 1.
3. Accodamento observe dopo il commit publish: una policy selezionata, a conferma della pianificazione separata.
4. Annullamento del run accodato: run e task diventati `cancelled`, senza avviare il worker o richieste esterne.
5. Lettura indipendente del DB: **1 cambiamento, 1 review approvata, 0 review pendenti, 0 eventi outbox, 0 prenotazioni attive**, baseline a 60 giorni e log amministrativo per entrambe le azioni.

Prove: `ui-final-evidence.png`, `ui-final-completed.png`, `ui-final-state.txt` e `ui-final-database-readback.json`. La console conserva messaggi “Could not establish connection. Receiving end does not exist.” provenienti dal contesto browser; non ne è stata stabilita l'origine. Non hanno impedito il percorso sopra, verificato anche nel DB. Non si dichiara una console priva di errori.

## Impronte e ambito delle revisioni

Il [manifest finale dei file di implementazione](engine-v6-source-manifest-2026-10-31.json) elenca SHA256, base Git e confronto con il candidato 2. Le modifiche successive al candidato sono distinte dai file identici: non si estende implicitamente la revisione Gemini/GLM a codice che i revisori non hanno visto. Il manifest non include sé stesso, documenti o output temporanei.

Il manifest delle prove, il diff successivo al candidato 2 e le trascrizioni originali sono conservati in `output/engine-implementation-2026-10-31/`, ignorata da Git. Non includono un dump del DB di produzione. I dati di account Hostinger sono ridotti alle informazioni di capacità e prezzo necessarie al budget; nessuna credenziale è stata aggiunta al repository.

## Qualificazione ancora necessaria

Tre finestre giornaliere complete su catalogo reale e corpus annotato; precisione di identità/completezza, copertura dei delta e falsi allarmi; qualità delle chiamate AI reali, costo/token e latenza; crescita dello storage e ripristino; carico del worker e convivenza con gli altri servizi. Nessun deploy, push, acquisto, invio agli iscritti o attivazione in produzione è stato eseguito.

Vedere [implementazione e decisioni sui rilievi](engine-v6-implementation-2026-10-31.md), [audit iniziale](engine-audit-2026-10-31.md) e [budget verificato](engine-v6-budget-2026-10-31.md).
