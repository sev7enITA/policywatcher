# PolicyWatcher Civico - verticale globale per le associazioni dei consumatori

Release di riferimento: `3.9.0-beta.40`, estensione globale del 7 agosto 2026.

## Obiettivo

`/it/associazioni` e `/en/associations` trasformano le evidenze pubbliche di PolicyWatcher in un percorso globale di triage e revisione per le associazioni dei consumatori. `/associazioni` è un redirect permanente compatibile verso la variante italiana. Il verticale non crea un dataset parallelo: legge soltanto cambiamenti che hanno già superato i gate pubblici comuni alla piattaforma.

Il contesto si declina su quattro assi: paese o area, area normativa, tema e tipo di associazione. La scelta non altera i record e non genera una copertura nazionale inesistente. Italia e Unione europea possono leggere evidenze marcate UE o Global; gli Stati Uniti evidenze US o Global; i paesi per cui non è ancora presente un set dedicato ricevono esclusivamente record marcati Global.

Il primo rilascio è deliberatamente browser-local. Non introduce account, ruoli organizzativi, note condivise, assegnazioni, gestione reclami o pubblicazione automatica.

## Directory globale delle organizzazioni

Il blocco `#organizzazioni` aggiunge un registro iniziale di 79 realtà in 24 paesi. Non è una graduatoria e non è esaustivo. Tiene insieme tre livelli:

- organizzazioni nazionali presenti in registri governativi o directory istituzionali;
- reti regionali europee, in particolare BEUC ed EDRi;
- reti globali e membri selezionati di Consumers International, oltre a profili ufficiali di specialisti digital-rights.

Ogni record dichiara paese, macro-area, livello territoriale, tipologie di tutela, sito ufficiale, fonte di verifica, natura della verifica e data di revisione. Le otto tipologie sono: tutela generalista, diritti digitali, privacy e dati, servizi finanziari, comunicazioni e media, minori e famiglie, trasporti e abitare, cibo e sostenibilità.

Quando viene scelto un paese, il risultato ordina prima le realtà nazionali, poi le reti regionali pertinenti e infine quelle globali. Questo rende visibile la relazione tra presidio locale e reti sovranazionali senza attribuire competenze o status non dichiarati dalla fonte.

La presenza nel directory non implica partnership, endorsement, riconoscimento della qualità del servizio, abilitazione legale o attualità permanente dello status. La data di revisione è uno snapshot; prima di riusi sensibili occorre aprire la fonte collegata.

## Contesto globale di piattaforma

Il controllo comune nel public header e nella dashboard salva un oggetto `policywatcher:global-context:v1` con:

- macro-area geografica;
- paese o stato selezionato;
- preferenza lingua `auto`, `en` o `it`.

Non viene usata geolocalizzazione IP. In modalità automatica l’Italia usa l’interfaccia italiana; gli altri paesi usano English, mentre il contesto globale può seguire la lingua del browser se supportata. La piattaforma dichiara il fallback: oggi le interfacce complete sono EN e IT; la scelta di Francia o Spagna non viene presentata come traduzione francese o spagnola.

Il contesto influenza il public header/footer, la lingua e la regione iniziale della dashboard, il territorio iniziale del directory e la corrispondenza territoriale del radar. Non prova residenza, cittadinanza, foro competente o applicabilità giuridica.

## Segnalazioni e correzioni

La form accetta sia proposte inviate da un rappresentante dell'organizzazione sia segnalazioni della comunità. Richiede nome, paese/area, sito ufficiale HTTPS e una fonte HTTPS indipendente (registro pubblico o rete verificabile). Il focus digitale è facoltativo. La normalizzazione elimina caratteri di controllo, limita le lunghezze, rifiuta URL non HTTPS e genera una `mailto:` revisionabile.

Ogni scheda esistente espone inoltre “Segnala correzione” / “Report a correction”. L'azione prepara una bozza separata con ID della scheda, sito ufficiale corrente e fonte di verifica corrente, più campi testuali da completare per correzione richiesta, fonte pubblica di supporto e relazione facoltativa con l'organizzazione.

Nessun dato viene trasmesso automaticamente. Inclusioni e correzioni avvengono solo dopo revisione editoriale delle fonti e non creano una relazione con l'organizzazione segnalata.

## Flusso dei dati

1. `listPublicEvidencePacketSummaries()` recupera fino a 50 cambiamenti pubblici tramite `publicChangeWhere`.
2. La route italiana usa `tldrIt` o `aiSummaryIt`, con fallback inglese; la route inglese usa `tldrEn` o `aiSummaryEn`.
3. `buildAssociationRadarItems()` riceve la lingua della route, applica una classificazione tematica deterministica e costruisce domande di revisione localizzate.
4. Il server passa al client soltanto campi pubblici e link alle pagine Evidence/Change.
5. Il client applica il contesto territoriale e associativo, quindi consente filtri, watchlist, stato di revisione e generazione del digest senza inviare questi dati al server.

La sitemap espone due URL canonici, `/en/associations` e `/it/associazioni`, collegati da `hreflang` reciproci e da `x-default` inglese. I filtri di contesto restano stato di lavoro e query condivisibili, senza produrre pagine nazionali indicizzabili prive di un catalogo dedicato.

La lingua dell'URL è la fonte di verità per contenuto, metadati, dati strutturati, date, radar e digest. Il controllo globale conserva la preferenza nel browser e, quando viene applicata una lingua diversa sul verticale, naviga alla route corrispondente mantenendo query e hash.

Un errore di accesso al catalogo produce lo stato “temporaneamente non disponibile”. Un catalogo accessibile senza record pubblicabili produce uno stato vuoto separato. Dati seed, record trattenuti e snapshot non pubblici non diventano materiale dimostrativo.

## Triage civico

Il verticale ricava temi come privacy e dati, condizioni contrattuali, intelligenza artificiale, pagamenti, account, contenuti e minori dal nome della policy e dalla sintesi pubblica.

Il segnale di attenzione è subordinato allo stato della fonte:

- una fonte non verificata non può essere promossa a “prioritaria”;
- “prioritaria” indica soltanto una precedenza di revisione;
- il punteggio di screening non viene presentato come valutazione di conformità;
- “pronto per pubblicazione” è uno stato locale scelto dal revisore e non pubblica nulla.

## Stato locale

Il browser può conservare due oggetti JSON versionati e limitati:

- `policywatcher:association-review:v1`: ID pubblici e stato di revisione ammesso;
- `policywatcher:association-watchlist:v1`: slug pubblici delle aziende incluse nel pilot.
- `policywatcher:global-context:v1`: area, paese e lingua supportata, senza dati di geolocalizzazione.

I parser accettano soltanto valori presenti nel catalogo ricevuto. Non vengono memorizzati nome dell’associazione, nominativi, contatti, note libere, reclami o documenti.

Le Evidence Collections continuano a usare il contratto locale esistente e il limite di 12 cambiamenti. I relativi export JSON, Markdown, CSV e handoff rimangono separati dal digest civico.

## Pilot di 60 giorni

Il flusso operativo previsto è:

1. scelta con il partner di un tema e 10–20 servizi;
2. verifica di fonti e baseline;
3. triage settimanale dei cambiamenti pubblicati;
4. costruzione di dossier locali e digest Markdown;
5. revisione intermedia dopo 30 giorni;
6. report finale su evidenze utili, fonti non monitorabili e riusi effettivi.

Metriche consigliate:

- evidenze ritenute utili dal partner;
- tempo medio di revisione;
- dossier o schede effettivamente riutilizzati;
- fonti non monitorabili o da correggere;
- decisione del partner sulla prosecuzione.

Aperture email, visualizzazioni della pagina e numero grezzo di segnalazioni non dimostrano da soli l’utilità del pilot.

## Sviluppi successivi subordinati alla validazione

Soltanto dopo almeno un pilot completato si possono valutare:

- autenticazione e organizzazioni;
- ruoli reviewer/editor;
- note e approvazioni condivise;
- digest email per watchlist specifica;
- raccolta moderata di segnalazioni dagli sportelli;
- registro delle risposte delle aziende;
- branding delle schede approvate dall’associazione.

Questi sviluppi richiedono un nuovo modello di autorizzazione, regole di retention, gestione dei dati personali e responsabilità editoriali esplicite; non sono impliciti nel verticale iniziale.

## Verifica

Prima del rilascio:

```bash
npx vitest run src/lib/__tests__/associationVertical.test.ts src/lib/__tests__/associationVerticalUi.test.ts
npx vitest run src/lib/__tests__/globalContext.test.ts src/lib/__tests__/civicOrganizations.test.ts
npx eslint src/app/associazioni src/app/en/associations src/app/it/associazioni src/components/GlobalContextControl.tsx src/lib/associationVertical.ts src/lib/civicOrganizations.ts src/lib/globalContext.ts
npm run build
```

La verifica visuale deve coprire desktop, tablet tra 800 e 1100 px e mobile a 360 px, con particolare attenzione al dialog del contesto globale, ai filtri e alle card del directory, alla form di segnalazione, ai filtri del radar e agli stati vuoto/non disponibile.
