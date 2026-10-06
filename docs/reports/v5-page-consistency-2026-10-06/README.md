# PolicyWatcher 5.0.0: audit di coerenza delle pagine

Data: 6 ottobre 2026, Europe/Rome. Origine verificata: https://policywatcher.online.

## Esito e causa

La produzione risponde già con **5.0.0** nel manifest pubblico. L'errore segnalato è reale: il changelog della dashboard mantiene un elenco scritto a mano, indipendente dal registro delle release del Press Kit. Il titolo corrente deriva dal metadato 5.0.0, mentre testo, badge e ordine delle funzionalità sono rimasti alla Beta 5. La stessa finestra ripete Beta 4 e Beta 5 fra gli sviluppi futuri. La roadmap contiene inoltre una scheda “Current · 4.0.0-beta.5”, il badge “Current beta” e traguardi futuri numerati 4.0 e 4.5.

Non è sufficiente cambiare il numero nel footer o svuotare la cache: occorre correggere i cataloghi e i componenti che descrivono il prodotto.

**Stato di questa revisione:** sorgenti corretti e verificati localmente; pubblicazione della revisione da registrare dopo la verifica staging e produzione. La 5.0.0 originale era già online prima di questo audit. Il file `publication.json`, quando presente, documenta lo stato terminale della revisione.

## Perimetro e metodo

- **473 URL controllate direttamente via HTTP**, di cui 465 nella sitemap iniziale e otto percorsi concreti ricavati dai sorgenti: 473 risposte HTTP 200, nessuna pagina di errore applicativo rilevata.
- Il controllo riguarda identità della release, riferimenti alle versioni, contenuti correnti/storici/futuri, registri e navigazione. Non costituisce un nuovo collaudo di tutte le funzioni o una verifica delle interpretazioni AI.
- **74 template di pagina** censiti nei sorgenti, compresi **19 template amministrativi**. Le pagine protette sono esaminate nel codice per i riferimenti di release; non è attestato un walkthrough autenticato di ciascuna funzione amministrativa.
- **603 riferimenti di release in 45 file applicativi** raccolti nell'inventario allegato; esclusi i test. Le occorrenze sono classificate per funzione, non sostituite indiscriminatamente.
- Nei 310 documenti HTML che espongono un footer di release riconoscibile, il footer iniziale indica 5.0.0. Le altre risposte comprendono interfacce idratate dal client e pagine di singoli record: l'assenza di quel marcatore non dimostra una versione diversa.
- Verifica browser del componente changelog in italiano e inglese, della modalità del dialogo, di Escape e del ripristino del focus, oltre alla geometria mobile a 390 × 844 px. La prova locale usa un harness temporaneo rimosso prima del pacchetto; il TermsGate originale è conservato.
- Isolamento del lavoro dalla copia Desktop, che contiene modifiche preesistenti e una vecchia base Beta 2. La base corretta è `085d7fc`, successiva alla pubblicazione 5.0.0. Nessuna sovrascrittura del workspace Desktop.

## Correzioni

| Area | Incongruenza | Risultato |
|---|---|---|
| Changelog della dashboard | Prima voce Beta 5; titolo 5.0 con testo precedente; “Current Beta”; funzionalità duplicate nella roadmap | Registro condiviso con il Press Kit; 5.0.0 stabile in apertura, contenuti effettivi di “Per te”, storico separato e collegamento alla roadmap |
| Lingua e accessibilità del changelog | Finestra inglese indipendente dalla lingua della dashboard | Italiano/inglese collegati alla selezione; dialogo nativo, Escape, focus ripristinato, testo e badge separati anche su mobile |
| Roadmap | Beta 5 ancora corrente; riepilogo di una vecchia release sotto il titolo 5.0; candidati 4.0/4.5 | Scheda corrente 5.0; Beta 5 consegnata; descrizione del percorso cittadino; orizzonti Next/Later senza versioni inventate |
| Release Impact | Release stabile chiamata “Current beta” | “Current release”; futuro indicato come “Next release horizon” |
| Feature Atlas | Quattro identità duplicate e tre vecchie schede marcate correnti | Identità univoche, dipendenze valide, stati correnti riferiti alla 5.0; le versioni di prima introduzione restano corrette |
| Feature Atlas 5.0 | Percorso cittadino rappresentato da una sola scheda generale | Sei schede dettagliate: servizi seguiti, feed e aggiornamenti, guide ufficiali, scelte locali, confronto locale delle comunicazioni, bozza di supporto; fonti, limiti e collegamenti espliciti |
| Site Atlas | “Per te” presente come nodo ma assente dai percorsi raccomandati; archivio release non mappato | Percorso cittadino prioritario, nodo e relazioni del registro release, contatore famiglie derivato dal catalogo |
| Archivio release | Tappa Beta 4 non presente; Beta 5 priva del seguito sulla copertura documentale | Record storico Beta 4 con limite esplicito sulla pubblicazione; Beta 5 include PDF e confronti ufficiali d'archivio |
| Press Kit | Pacchetti vecchi accanto alla release corrente potevano sembrare aggiornati | Pacchetti indicati esplicitamente come storici; conservati versioni, date, file e checksum originali |
| Developer / Residency | Badge “Beta 17/22/31” senza versione del prodotto né spiegazione | “Introduced in 3.9.0 Beta …”, distinguendo l'introduzione della funzione dalla versione web corrente |
| Documentazione | Nessun verbale di riconciliazione | README, CHANGELOG e questo rapporto aggiornati; inventari e script ripetibile allegati |

L'Atlas passa da **141 righe con 137 identità univoche** a **143 funzionalità univoche**: vengono eliminate quattro duplicazioni e aggiunti sei dettagli del percorso cittadino. Le sette schede della 5.0 comprendono la scheda generale e i sei passaggi. La classificazione finale è 133 consegnate, sette correnti e tre pianificate; indica inventario applicativo, non adozione o certificazione.

## Riferimenti precedenti conservati correttamente

- Le funzionalità introdotte nella Beta 4 e nella Beta 5 mantengono quelle versioni nello storico. Non sono presentate come novità introdotte nella 5.0.
- La Beta 4 è una tappa preparata il 1 ottobre e inclusa nella pubblicazione Beta 5; il nuovo record non attesta un deployment autonomo.
- La versione dell'estensione browser resta 3.8.3 Beta 3: non coincide con quella del sito. Android conserva i propri limiti di distribuzione; non sono dichiarati store, push o sincronizzazione fra dispositivi.
- CC BY 4.0 è la versione della licenza. API v1/v2 e schemi versionati sono contratti indipendenti dalla release web 5.0.
- Articoli, infografiche, screenshot, pacchetti stampa e registri datati conservano il loro contenuto storico. Cambiarne il numero senza rigenerare e verificare i contenuti falsificherebbe la provenienza.

## Verifiche tecniche

- Suite web: **1.142 test superati, 14 esclusi** secondo la configurazione esistente. I cinque nuovi test verificano registri, package/lock/changelog, unicità e dipendenze Atlas, ancore dei sei passaggi e rendering italiano/inglese del changelog.
- TypeScript e build di produzione completati. L'harness locale non è incluso nella build finale.
- Lint web: **zero errori, 15 avvisi preesistenti**, principalmente immagini e navigazione. Nessun nuovo avviso nei file corretti.
- Browser locale: 5.0.0/STABLE come prima release; titoli e limiti corretti in entrambe le lingue; storico Beta 5/Beta 4 disponibile; Escape e ritorno al controllo di apertura verificati. A 390 px il dialogo è largo 366 px, interamente nel viewport, senza overflow orizzontale.
- Feature Atlas renderizzato: 143 schede, sette correnti, scheda iniziale “Your services, your choices” e sei collegamenti al percorso cittadino.
- Nessuna modifica a schema, punteggi, fonti, conferme, gate di pubblicazione, credenziali, configurazione email o dati degli utenti.

## Evidenze e ripetibilità

- `production-before-summary.json`: riepilogo della produzione prima delle correzioni.
- `production-before-routes.csv`: tutte le URL, stato HTTP, titolo e riferimenti di versione.
- `source-release-references.json`: inventario dei riferimenti nei sorgenti.
- `changelog-desktop-it.png`: verifica visiva del componente aggiornato.
- `changelog-mobile-it.png`: cattura del browser con viewport mobile; la verifica numerica della geometria è riportata sopra.
- `publication.json`: esito effettivo di pubblicazione, da aggiungere soltanto dopo la verifica.

Per ripetere il controllo HTTP dalla root dei sorgenti:

```bash
python3 scripts/audit-release-pages.py https://policywatcher.online /tmp/policywatcher-release-audit
npm test
npm run typecheck
npm run lint:web
npm run build
```

La scansione HTTP è in sola lettura, con due richieste concorrenti, timeout e gestione dei 429. Non invia messaggi e non avvia scansioni delle policy.
