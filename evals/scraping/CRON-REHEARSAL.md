# Verifica offline del cron con shadow

La suite seleziona esplicitamente `cron.rehearsal.ts` e usa il codice reale di cron, scraper, shadow e persistenza Prisma. Crea uno schema e un database SQLite temporanei, senza utilizzare il `DATABASE_URL` del chiamante o leggere `.env`. I trasporti ricevono fixture sintetiche; fetch, analisi generativa, pubblicazione canonica, selezione destinatari e mail sono sentinelle vietate. Database e ricevute temporanee vengono rimossi al termine.

Scenari coperti:

1. Due record condividono un URL: una acquisizione, una ricevuta, due check log collegati; baseline conservata anche quando la candidata differisce.
2. Testo troncato oltre il limite corrente, redirect regionale e prima rilevazione di modifica: nessuna nuova snapshot o pubblicazione; baseline e log distinti.
3. Shadow disabilitato: scansione baseline completata.
4. Configurazione non disponibile: scansione baseline completata e modalità `configuration_error` registrata.
5. Budget esaurito: acquisizioni e check log continuano senza ulteriori osservazioni.
6. Errore fatale: osservazioni già concluse conservate, lease rilasciata ed eccezione originale preservata.

La modalità notifiche è `silent`, secondo il contratto della baseline corrente. Le fixture parziali usano la troncatura effettiva del validatore, non la semplice presenza di un link PDF. Un test aggiuntivo in `pdfPolicy.test.ts` verifica il parser PDF reale insieme a shadow e alla conservazione della lineage di estrazione.

## Esecuzione

Usare una copia locale senza `.env`, credenziali o database operativi. Installare le versioni del lockfile con script disabilitati e generare il client Prisma dallo schema SQLite. La generazione non esegue migrazioni. I comandi seguenti sono test locali:

```sh
node node_modules/vitest/vitest.mjs run --config evals/scraping/cron.vitest.config.ts
node node_modules/typescript/bin/tsc -p evals/scraping/cron.tsconfig.json --noEmit
```

Il 26 ottobre 2026 tutti i sei scenari sono passati sull'integrazione della release 5.2.0. Questa evidenza non attesta la produzione autenticata, acquisizioni reali, qualità delle fonti, efficacia delle ricette o pubblicazione di modifiche confermate.
