# PolicyWatcher Civico - verticale per le associazioni dei consumatori

Release di riferimento: `3.9.0-beta.40` del 6 agosto 2026.

## Obiettivo

`/associazioni` trasforma le evidenze pubbliche di PolicyWatcher in un percorso di triage e revisione per le associazioni italiane dei consumatori. Il verticale non crea un dataset parallelo: legge soltanto cambiamenti che hanno già superato i gate pubblici comuni alla piattaforma.

Il primo rilascio è deliberatamente browser-local. Non introduce account, ruoli organizzativi, note condivise, assegnazioni, gestione reclami o pubblicazione automatica.

## Flusso dei dati

1. `listPublicEvidencePacketSummaries()` recupera fino a 50 cambiamenti pubblici tramite `publicChangeWhere`.
2. La sintesi italiana usa `tldrIt` o `aiSummaryIt`, con fallback alle versioni inglesi già pubbliche.
3. `buildAssociationRadarItems()` applica una classificazione tematica deterministica e costruisce domande di revisione.
4. Il server passa al client soltanto campi pubblici e link alle pagine Evidence/Change.
5. Il client consente filtri, watchlist, stato di revisione e generazione del digest senza inviare questi dati al server.

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
npx eslint src/app/associazioni src/lib/associationVertical.ts src/lib/evidencePacketData.ts
npm run build
```

La verifica visuale deve coprire desktop, tablet tra 800 e 1100 px e mobile a 360 px, con particolare attenzione alla decima voce del menu pubblico, ai filtri, alle card del radar e agli stati vuoto/non disponibile.
