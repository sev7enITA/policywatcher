# Dashboard workflow e PolicyWatcher Civico globale

Data di verifica iniziale: 6 agosto 2026. Estensione directory globale: 7 agosto 2026.

## Dashboard

La home operativa introduce tre corsie stabili:

1. **Oggi**: massimo tre elementi ordinati deterministicamente. Le sospensioni di fonte confluiscono in un solo indicatore Source QA; seguono i cambiamenti con rischio, punteggio e data più rilevanti e il percorso Civico.
2. **Continua**: riprende workspace, filtri, Raccolte di evidenze e Timeline.
3. **Esplora**: porta ad Atlante, Civico e Observatory. Il catalogo esteso resta disponibile tramite Atlante e disclosure.

L'indice di conoscenza pubblico resta renderizzato dal server, ma viene presentato come disclosure compatta. Questo conserva la superficie testuale indicizzabile senza usare l'intero primo viewport, soprattutto su mobile.

## Civico globale

Il contesto usa valori chiusi e versionabili:

- paese o area: Globale, Italia, Unione europea, Stati Uniti, Regno Unito, Canada, Australia;
- area normativa: contratti digitali, privacy e dati, AI e piattaforme, pagamenti e mercati digitali, minori online;
- tipo di associazione: generalista, diritti digitali, privacy, minori e famiglie, servizi finanziari;
- tema e segnale di attenzione restano filtri distinti.

Il matcher non crea record territoriali. Italia e UE possono usare record UE o Global; gli Stati Uniti record US o Global; Regno Unito, Canada e Australia ricevono soltanto record esplicitamente Global finché non esiste un set nazionale dedicato.

### Directory e contesto di piattaforma

L'estensione del 7 agosto aggiunge un directory source-backed di 79 organizzazioni in 24 paesi e otto tipologie di tutela. Italia, Francia e Spagna partono dai rispettivi elenchi governativi; il livello europeo usa BEUC ed EDRi; il livello internazionale usa Consumers International e profili ufficiali selezionati.

Il controllo globale condiviso salva area, paese e lingua `auto|en|it` in `policywatcher:global-context:v1`. Non usa geolocalizzazione IP. Influenza public header/footer, lingua e regione iniziale della dashboard, filtro iniziale del directory e contesto del radar. Il fallback per paesi senza locale completo è English e viene dichiarato nell'interfaccia.

La form “Segnala un'altra associazione” valida URL HTTPS, limita e normalizza i campi, poi apre una bozza email. Non effettua una submission silenziosa e una segnalazione non determina l'inclusione.

## Risorse sincronizzate

- changelog generale e changelog in prodotto;
- How To bilingue;
- README;
- Site Atlas e release-impact map;
- `llms.txt` e sitemap canonica `/associazioni`;
- documentazione del verticale e Design QA;
- ricerca datata `docs/global-consumer-association-research-2026-08-07.md`;
- pagina Browser Extension con stato Microsoft Edge Add-ons pubblicato e azione diretta fail-closed finché manca l'URL ufficiale configurato.

## Verifica

- 701 test superati su 131 file;
- TypeScript senza errori;
- lint mirato senza errori;
- build Next.js di produzione completata;
- confronto visivo desktop 1280 × 720 e mobile 390 × 844 completato;
- selettori di contesto verificati nel browser con aggiornamento del riepilogo attivo.

## Pacchetto Hostinger

- archivio: `artifacts/hostinger/PolicyWatcher-3.9.0-beta.40-hostinger-2026-08-06-dashboard-civic-global.zip`;
- dimensione: 43.681.375 byte;
- SHA-256: `5e431352a96e07487e3dadcbd3b4245d30954eebacbe42dc080ca8c0a5d6f179`;
- voci archivio: 947;
- database incluso: no;
- comando di avvio: `npm start`;
- snapshot di packaging: `6809a1131973305fe8eb7ee5002d035f7207fa47`.

L'archivio è stato costruito tramite il gate di packaging Hostinger da uno snapshot Git isolato dell'albero di lavoro corrente. In questo modo il pacchetto include le risorse richieste senza creare commit o modificare il branch dell'utente. Il checksum e il test integrale dei dati compressi risultano validi.
