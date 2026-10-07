# Verifica del pilota Evidence Assurance

Data: 7 ottobre 2026. Base Git: `77914ff`, ramo `codex/eu-evidence-quality`. Esito: implementazione e pilota locali verificati; nessuna attivazione o modifica al database di produzione.

## Risultati

- Suite completa `npm test`: 1.163 test superati, 14 esclusi; 176 file superati e 3 esclusi. Le esclusioni restano visibili e non sono conteggiate come successo.
- `npm run lint:web`: zero errori, 15 avvisi preesistenti sulla navigazione in CommandPalette e GlobalContextControl. Ricontrollati senza errori i file modificati dopo questo passaggio.
- `npm run typecheck` e `npm run typecheck:critical-tests`: superati.
- `npm run build` con target locale e database SQLite isolato: superato, incluso controllo del fingerprint di estrazione e generazione Prisma. Questo è un controllo della build destinata alla produzione, non un deployment.
- Browser Playwright: login effettivo, pagina admin a 1440 e 390 pixel, revisione di una citazione, persistenza della revisione, aggiornamento del denominatore, confronto transitorio e svuotamento del campo, elenco di 16 riferimenti, rifiuto motivato di un riferimento. Nessun errore JavaScript osservato e nessuna eccedenza orizzontale nei due viewport.
- Il campione browser usa dati sintetici. Il risultato 1/1 sulla citazione verifica il funzionamento del conteggio, non l'accuratezza reale di PolicyWatcher.
- Importazione reale dal repository pubblico UE: 7 documenti, 16 riferimenti, HEAD `0dbd93e5c9b3af461ae31afb9d6b73760b6270c3`. Solo metadati, con licenza e attribuzione. Nessun testo completo delle policy importato dall'archivio UE. [Ricevuta](pilot-result.json).

## Casi coperti dai nuovi test

Database SQLite reale e temporaneo, inizializzatore Hostinger eseguito due volte; upgrade del parser senza PolicyChange; modifica del provider simultanea all'upgrade; input assente, corrotto, parziale o non più estraibile; recupero soggetto a hash corrente e revisione; separazione degli archivi dalle osservazioni live; conferma consecutiva con stesso profilo; normalizzazione degli URL senza collassare lingua e frammento; percorso manuale completo con AI solo dopo conferma; pausa delle scansioni prima del retrieval; accesso admin/auditor; citazioni inventate rifiutate; recensioni ripetute senza aumento artificiale del campione; revisioni invalidate dal cambiamento delle evidenze; metriche senza denominatore restituite come non valutate; importazione idempotente, perimetro e commit fissati, arresto al cambiamento della licenza; input privato escluso dalle risposte di overview.

Sono state aggiornate e verificate le liste di tabelle per inizializzazione, readiness, backup cifrato e staging, oltre alla coerenza delle migrazioni SQLite/PostgreSQL. La migrazione PostgreSQL non è stata eseguita contro un server PostgreSQL in questa sessione: il controllo statico non sostituisce la rehearsal specifica del provider.

## Limiti di rilascio

Le cinque funzionalità sono disponibili nel pilota locale; il guard del parser è opt-in e resta disattivato per impostazione predefinita. Non è stata eseguita una scansione di produzione né misurata una riduzione reale dei falsi positivi. Prima dell'attivazione occorrono baseline readiness, staging e campioni revisionati. Le prove browser riguardano le nuove superfici admin e non costituiscono un nuovo audit di ogni pagina pubblica.

Nessun codice OTA/EUPL o filtro eseguibile AGPL è stato incorporato. Il confronto esterno richiede conferma del perimetro e della base di utilizzo; non determina automaticamente correttezza o diritti di ripubblicazione. Il vecchio checkout Desktop, con modifiche preesistenti, è stato preservato.

Procedura di rollout, criteri di arresto e recupero: [runbook](../../evidence-assurance-pilot.md).
