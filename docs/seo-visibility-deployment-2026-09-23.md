# Pubblicazione SEO PolicyWatcher - 23 settembre 2026

La versione SEO è pubblicata e verificata su **https://policywatcher.online**. Verifica conclusa il 23 settembre 2026 alle **06:26 CEST**. La richiesta esplicita di pubblicazione in questo task ha autorizzato la promozione, eseguita dopo il superamento dello staging.

## Identità del rilascio

| Voce | Valore |
|---|---|
| Versione applicativa | `4.0.0-beta.3` |
| Codice pubblicato | `cb799bcf7cbe65d554dae1bc09decc6a95931c92` |
| Archivio | `PolicyWatcher-4.0.0-beta.3-hostinger-2026-09-23-seo-visibility-r1.zip` |
| SHA-256 | `06258245369f14d56cc7d708889c8ee9554521d408460c5711e45bfc725c7f19` |
| Build staging | `01a0cc78-4dbb-72b5-bd6b-5dab5f8674dc` |
| Build produzione | `01a0cc7e-5cde-73be-af6a-7acdbe135c0f` |
| Verifica staging | `2026-09-23T04:16:38.786Z` |
| Integrità sorgenti distribuiti | 917/917 file identici all'archivio, in entrambi gli ambienti |

Hostinger ha costruito l'archivio originale con Next.js, Node.js 22, `npm run build` e output `.next`. Nessun nuovo archivio è stato creato tra staging e produzione. Questa documentazione è un aggiornamento successivo al rilascio; non modifica il codice dell'archivio pubblicato.

## Controlli superati

- Staging: tutti gli **11 controlli** del gate di rilascio, inclusi autenticazione, database, contratto pubblico e esclusione dai motori. **97/97 URL** della sitemap superano lo smoke SEO con `noindex` atteso.
- Produzione: **318/318 URL** della sitemap restituiscono HTTP 200, titolo e descrizione, canonical nel primo `head`, dati strutturati parsabili e metadati social. Nessun `noindex` improprio, titolo duplicato tra record distinti o alternativa linguistica incoerente nel controllo.
- Controllo aggiuntivo dell'HTML iniziale su **109 pagine**; **54 immagini social** raggiungibili come immagini; **7 URL inesistenti** con HTTP 404 e `noindex`, compreso un ID policy inesistente all'interno di un'azienda valida.
- Browser: homepage, record policy, cambiamento, pacchetto evidenze e guida italiana verificati sui dati reali. Nessun errore o warning di console osservato. Campione mobile a 390 px senza overflow orizzontale; cambio lingua della guida tramite navigazione client verificato. Le pagine evidenza restano in inglese; le alternative italiane vengono dichiarate solo per i percorsi che le supportano.
- Staging: homepage, Roadmap, Observatory, Knowledge, accesso Admin e guida italiana controllati su desktop e mobile. Il dataset sanificato non contiene record pubblicabili: l'interfaccia comunica correttamente lo stato vuoto.
- Produzione: health autenticata operativa, richieste anonime protette con 401, sessione amministrativa valida, SQLite pronto con **31/31 tabelle**, **16/16 migrazioni**, integrità `ok` e modalità WAL.

Le verifiche locali antecedenti al rilascio restano documentate nel [rapporto di implementazione](seo-visibility-implementation-2026-09-23.md): 1.119 test e 55 controlli browser, anche senza JavaScript.

## Conservazione dei dati e ripristino

Prima del rilascio sono stati salvati database mediante SQLite backup API, configurazione e runtime precedente in un'area privata del server. Il backup incorpora lo stato WAL e ha superato `integrity_check`. Non è stato copiato il database di produzione nello staging né incluso nell'archivio applicativo.

| Record nel database di produzione | Prima | Dopo |
|---|---:|---:|
| Aziende | 18 | 18 |
| Policy | 50 | 50 |
| Cambiamenti | 53 | 53 |
| Snapshot | 104 | 104 |

Anche il digest dell'intero contenuto dei 53 record `PolicyChange`, ordinati per ID, è identico prima e dopo. I contatori pubblici sono più bassi perché applicano il gate di pubblicazione: 16 aziende, 46 policy, 99 baseline e 53 cambiamenti.

In produzione sono cambiate soltanto `POLICYWATCHER_RELEASE_SHA256`, `POLICYWATCHER_STAGING_VERIFIED_SHA256` e `POLICYWATCHER_STAGING_VERIFIED_AT`. Nello staging è cambiato soltanto il checksum del rilascio. Segreti e altre impostazioni sono stati confrontati senza divulgarne i valori.

Il runtime precedente, il database coerente e la configurazione sono conservati nell'area privata `private-release-backups/seo-visibility-20260923` del server, per consentire un ripristino controllato. Nessun ripristino è stato necessario.

## Osservazioni e attività separate

- Il motore Prisma ha incontrato un lock SQLite durante i build. Il meccanismo di fallback già presente nel progetto ha completato l'inizializzazione. Readiness e integrità sono state poi verificate sui database effettivamente in uso.
- Il pannello generale di verifica produzione mantiene la stessa segnalazione già presente prima del rilascio sul controllo degli header HTTP di sicurezza: 8 controlli superati, 1 da approfondire, 1 verifica indipendente esterna. Il deploy SEO non risolve questa segnalazione e il rapporto non attesta il superamento di un audit di sicurezza completo.
- L'ultima acquisizione pubblica resta del 12 settembre 2026. L'avviso di freschezza è visibile; non sono stati eseguiti nuovi scan, cron, email o webhook né alterate date per far apparire recenti le fonti.
- La pubblicazione e l'idoneità tecnica delle URL non equivalgono all'indicizzazione o a un aumento di ranking. Verifica delle proprietà, invio/ispezione sitemap e misurazione dei risultati in Google Search Console/Bing restano attività da completare con i relativi accessi.

I rapporti JSON di staging, produzione, integrità e promozione sono conservati insieme al rapporto locale di pubblicazione. [Pull request dell'intervento](https://github.com/sev7enITA/policywatcher/pull/17).
