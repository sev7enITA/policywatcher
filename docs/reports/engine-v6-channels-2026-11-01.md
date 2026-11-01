# Canali di scansione e confronto locale, 1 novembre 2026

Il pannello amministrativo offre Stable come scelta predefinita e Engine 6 Preview come scelta esplicita nel solo ambiente locale isolato. Il confronto facoltativo applica i due estrattori alla stessa cattura decodificata, conservando il rapporto come artefatto. Non esegue due scanner end-to-end e non confronta i modelli AI.

## Verifiche eseguite

| Prova | Esito | Perimetro |
| --- | --- | --- |
| Suite completa | 1.469 superati, 14 esclusi; 194 file superati, 3 esclusi | Regressioni automatiche locali |
| Nuovi test canali | 14 superati | Auth, isolamento, idempotenza, scope, conflitti, metadati, lettura e invarianti |
| Avvii simultanei | 12 iterazioni, mai entrambi i canali attivi | Transazioni Prisma sul database SQLite di prova; non PostgreSQL o capacità VPS |
| TypeScript applicazione e test critici | Superati | Include i nuovi test nel controllo dei tipi |
| Lint dei file modificati | Nessun errore o warning | Nessuna nuova attestazione sul lint globale |
| Build produzione | Superata | Compilazione locale; il motore sperimentale non viene distribuito |
| Browser Vivaldi | Selettore, confronto, rapporto, dettaglio ed export JSON verificati | Due policy sintetiche nel database dedicato |
| Worker da directory errata | Uscita 1 con diagnosi prima di reclamare task | Configurazione locale esplicita |

Nel run browser `12c148d6-8e6c-48a4-8f06-b3b5e4ee90ce`, una riga ha un confronto disponibile e differente (1.853 caratteri Stable, 1.903 Preview), una rimane indisponibile per `source_contract_missing`. Il passaggio sintetico sulle cartelle mediche è presente solo nell'estrazione Preview. Non è una misura della completezza di fonti reali.

Tutti i campi delle due righe Policy rimangono identici prima e dopo il run; zero PolicyChange, PolicyCheckLog e EngineOutbox. Il file esportato dal browser è stato realmente salvato e riletto: SHA-256 `4841f3f4af3a600e2e41093212cf7ccc2d38ca40d1faf2b18b02c3f80270e6de`.

La prima invocazione del worker sintetico aveva un errore nel driver della fixture per la seconda fonte (`unexpected_fixture_source`); il driver è stato corretto e il retry persistito ha completato il run con il motivo previsto. Questa prova non viene presentata come esecuzione ininterrotta o acquisizione Internet. I test automatici usano anche il percorso reale di rifiuto del contratto mancante.

## Correzione emersa dai test

Il blocco transazionale di contesto effettuava un aggiornamento senza cambiare il testo ma Prisma avanzava automaticamente `Policy.updatedAt`. Ora il CAS include e preserva esplicitamente la data sia per Policy sia per EngineSourceContract. Il test confronta l'intera riga, non soltanto testo e hash.

Le richieste manuali sono idempotenti; una chiave già usata con un altro canale, limite o azienda viene rifiutata. La preview non ripiega implicitamente su Stable. L'identità del codice caricata dal processo viene confrontata con i file correnti e i modelli richiesti restano vincolati al run. Le ricevute di inferenza riportano separatamente le identità effettivamente risolte.

## Revisioni esterne e decisioni

- **Gemini 4 Argon Alta**, tramite la tab web predisposta dall'utente: revisione della semantica dell'interfaccia, senza accesso al codice o esecuzione di test. Applicate la distinzione tra confronto di estrazione e motori completi, l'evidenza della completezza non qualificata, gli stati mancanti distinti e la descrizione degli effetti di Stable e Preview. Non adottate le ipotesi inesatte di dati effimeri o conflitti accodati: le osservazioni sono persistenti e i conflitti vengono rifiutati.
- **GLM-5.3 Max**, in ZCode Plan: prima revisione progettuale, poi candidato congelato e chiusura delle correzioni. Un'interruzione `write EPIPE` è stata superata con una nuova richiesta. La chiusura, osservata alle 18:57 Europe/Rome, conferma i confini e non rileva regressioni nel candidato 2. Non ha eseguito test né certificato la produzione.
- Rapporto illeggibile a flag spenti: corretto. Lettura amministrativa e lista dipendono dall'ambiente locale isolato, non dai flag che consentono nuove esecuzioni o dall'hash del codice corrente.
- Worker con directory errata: ora termina prima di reclamare task, con un errore di configurazione esplicito. Il controllo ripetuto dei file rimane intenzionale nel limite locale di 50 policy.
- Lease Stable scaduta: blocco mantenuto e reso esplicito con `stable_scan_recovery_required`. Una scadenza non dimostra che il processo sia fermo. Dopo aver verificato l'arresto del vecchio processo, una nuova scansione Stable esegue il recupero delle lease obsolete già previsto dallo scanner. Non è stato introdotto uno sblocco automatico dalla preview.
- Possibile sovrapposizione simultanea: non riprodotta nelle 12 prove. GLM ha ritirato il rilievo dopo aver considerato il controllo e la creazione nella stessa transazione su ciascun percorso. La spiegazione è coerente con la [semantica ufficiale di isolamento SQLite](https://www.sqlite.org/isolation.html). Dodici prove non costituiscono una dimostrazione universale; PostgreSQL è escluso dal guard e resta da qualificare per questi canali.
- Eccezioni future dell'estrattore legacy: annotazione difensiva, non difetto riprodotto. Il confronto attuale non aggiunge un recupero silenzioso da errori di codice.

Le trascrizioni e i candidati sono preservati sotto `output/engine-channels/`; il manifesto delle prove registra i loro hash. Nel precedente rapporto JSON di campagna i trattini lunghi delle citazioni sono stati rappresentati con escape Unicode: il contenuto JSON decodificato è identico, per rispettare il controllo tipografico del repository senza modificare l'evidenza originale.

## Ripresa locale

Eseguire dalla radice della checkout. Il database deve esistere sotto `output/engine-channels/` ed essere una copia di qualificazione, mai il database operativo. Richiesti `POLICYWATCHER_ENGINE_CHANNELS=1`, `POLICYWATCHER_ENGINE_V6=1`, `POLICYWATCHER_ENGINE_PUBLICATION=0`, `POLICYWATCHER_ENGINE_NOTIFICATIONS=0`, `NODE_ENV=development`, DATABASE_URL assoluto e autenticazione amministrativa configurata privatamente.

`npm run dev -- --hostname 127.0.0.1 --port 3013` avvia l'app locale; `npm run engine:worker` esegue il worker con la stessa configurazione. Il driver sintetico usato nel browser è separato dal worker reale e non deve essere scambiato per un recupero di fonti online. Modificare il codice durante un run richiede riavvio e nuova esecuzione: il run conserva la sua identità originale.

Stable manuale può aggiornare baseline e storico attraverso i controlli esistenti, ma invia zero notifiche. Preview e compare scrivono solo le proprie osservazioni e prove private. L'accettazione della richiesta non è completamento; il completamento non certifica completezza della fonte.

## Limiti ancora aperti

Completezza fonte per fonte, osservazioni su date realmente successive, carico Internet su 500 fonti e capacità dell'infrastruttura destinata al servizio restano da qualificare. Il confronto acquisizione/analisi end-to-end è futuro. La pubblicazione del quaderno sul sito riguarda soltanto il resoconto: runtime, schema e scanner pubblici restano 5.2.0.
