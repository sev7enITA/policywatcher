# PolicyWatcher 4 Beta 2 è online: un modello operativo che collega cambiamenti, versioni e clausole

## Comunicato stampa

**Milano, 20 agosto 2026** - PolicyWatcher ha completato il deployment in
produzione della versione `4.0.0-beta.2`. Il manifest pubblico restituisce ora
la nuova release e il sito continua a rendere disponibili il monitoraggio delle
policy, le fonti pubbliche e i relativi limiti di pubblicazione.

La versione 4 non cambia la finalità del progetto: osservare e rendere
ispezionabili i cambiamenti delle policy digitali. Cambia il modello con cui le
evidenze vengono identificate, collegate e riutilizzate. In 3.x il cambiamento
osservato era il principale record operativo; in 4 la catena che sostiene quel
cambiamento diventa una struttura esplicita e durevole:

`Entity → Document → Version → Change → Provision`

Questo passaggio consente di distinguere l’identità del soggetto monitorato, il
documento fonte, la versione acquisita, il delta osservato e la clausola a cui
si riferisce l’analisi. Gli identificatori pubblici stabili sono separati dagli
UUID interni e possono quindi rimanere coerenti attraverso rinominazioni,
variazioni degli URL e future modifiche dello storage.

## Cosa significa per i diversi utilizzatori

Il cambiamento di modello ha implicazioni diverse per quattro gruppi principali:

- **product owner:** riferimenti e contratti pubblici possono restare stabili
  mentre l’implementazione interna evolve;
- **team di governance e legali:** una valutazione può essere ricondotta alla
  versione del documento, al cambiamento osservato e alla provision pertinente,
  senza trasformare la classificazione in una conclusione legale;
- **team di ricerca ed editoriali:** la stessa evidenza può essere esaminata,
  citata e riutilizzata in più superfici mantenendo il proprio percorso di
  provenienza;
- **team tecnici e partner di integrazione:** API, evidence packet e flussi di
  verifica possono appoggiarsi a identificatori durevoli e a uno stato
  operativo condiviso.

La prima tassonomia delle provision copre training AI, condivisione dei dati,
conservazione, arbitrato, licenze sui contenuti e responsabilità. La tassonomia
organizza il linguaggio osservato; non determina validità, applicabilità o
conformità legale.

## Un unico stato operativo derivato dal database

La versione 4 pubblica un solo contratto autorevole di publication readiness,
derivato dal database e condiviso dall’area Admin, dall’analisi competitiva
interna e dall’API pubblica.

Lo snapshot verificato il 20 agosto 2026 riporta:

- 50 record configurati;
- 50 record recuperati;
- 50 baseline verificate;
- 44 record pubblici;
- 28 record analizzati;
- ultima cattura riuscita: 19 agosto 2026 alle 07:55:20 UTC;
- 15 aziende attualmente esposte dall’endpoint pubblico.

Questi valori descrivono lo stato operativo misurato dal database. Non indicano
copertura esaustiva, qualità legale, conformità o disponibilità futura. La
metrica resta live e non viene cristallizzata nei materiali grafici statici.

Contratto pubblico:
`https://policywatcher.online/api/v1/publication-readiness`

## Hardening e deployment verificato

Beta 2 applica le principali correzioni emerse dagli assessment indipendenti
ricevuti sul ramo v4. Tra gli interventi figurano:

- identità client attendibile con comportamento fail-closed negli ambienti
  gestiti;
- segreti distinti per API, sessioni Admin e sessioni Investor;
- revoca globale delle sessioni amministrative;
- limiti espliciti per gli input di acquisizione e AI;
- lease durevole e rinnovabile per le scansioni complete;
- double opt-in per le nuove iscrizioni e per quelle riattivate;
- export cifrato esteso alle 31 tabelle applicative;
- liveness pubblica minimale e separata dalla health operativa protetta;
- distinzione fra errore di acquisizione e assenza di evidenza pubblicabile.

L’artefatto definitivo ha superato 11 controlli di staging su 11 ed è stato
promosso in produzione mantenendo lo stesso checksum. Prima delle migrazioni è
stato creato un backup del database. Il controllo post-deploy ha rilevato 31
tabelle su 31, 16 migrazioni su 16, integrità SQLite `ok`, journal mode WAL e
busy timeout di cinque secondi. La suite sorgente comprende 1.034 test, tutti
superati insieme a TypeScript, lint e build Next.js.

Il comportamento del proxy Hostinger è stato verificato sia in staging sia in
produzione: gli header di inoltro forniti dal client non vengono accettati come
identità attendibile senza la sovrascrittura del proxy.

## Una nuova guida visiva al cambio di modello

PolicyWatcher ha inoltre preparato una nuova infografica in inglese che separa
il messaggio principale dal riferimento tecnico. La prima parte chiarisce il
passaggio dai change record alle evidenze durevoli e il significato pratico per
product owner, governance, ricerca e integrazioni. Architettura, stato Git e
release, superfici di integrazione e sinergie fra Admin, analisi competitiva e
API sono raccolti in uno specchio tecnico secondario.

Il fondale editoriale è generato con AI e dichiarato; testi, numeri, diagrammi e
gerarchia informativa sono composti deterministicamente. L’infografica non
contiene proclami di superiorità e non sostituisce la metrica live.

Asset previsto dopo la promozione del nuovo pacchetto:
`https://policywatcher.online/press-kit/policywatcher-v4-beta2-value-infographic-en-2026-08-20.png`

## Dichiarazione proposta

> “La versione 4 non cambia ciò che PolicyWatcher osserva: cambia il modo in
> cui conserva e rende riutilizzabile la prova del cambiamento. Il risultato è
> un percorso più esplicito fra fonte, versione, delta e clausola, mantenendo
> separati i dati osservati dalle valutazioni e dai limiti del sistema.”

- **Fabrizio Degni, fondatore di PolicyWatcher**
*Dichiarazione proposta, da approvare prima della distribuzione esterna.*

## Limiti e prossimi gate

SQLite resta il database di produzione corrente. PostgreSQL, object storage,
attivazione del dual-write canonico, passaggio alle letture canoniche,
workspace, account, billing e multi-tenancy restano gate distinti e non vengono
presentati come funzionalità attive.

Il controllo post-deploy mantiene inoltre una voce di attenzione sulla Content
Security Policy restituita dal livello Hostinger: HSTS, `nosniff` e
`X-Frame-Options: DENY` sono presenti, mentre la policy CSP completa generata
dall’applicazione richiede un ulteriore allineamento con il livello di hosting.
Il test dinamico indipendente resta, per definizione, un’attività esterna e non
è auto-certificato dall’applicazione.

Il deploy applicativo e la formalizzazione del repository sono mantenuti come
evidenze separate. Il sito serve `4.0.0-beta.2` e il sorgente corrispondente è
disponibile tramite il tag Git immutabile `v4.0.0-beta.2`.

## Disponibilità e riferimenti

- Sito pubblico: `https://policywatcher.online`
- Manifest della release: `https://policywatcher.online/api/v1/manifest`
- Tag sorgente: `https://github.com/sev7enITA/policywatcher/tree/v4.0.0-beta.2`
- Publication readiness: `https://policywatcher.online/api/v1/publication-readiness`
- Liveness: `https://policywatcher.online/api/live`
- Infografica: disponibile dopo il prossimo deployment dell’asset revisionato

## Informazioni su PolicyWatcher

PolicyWatcher è un progetto civic-tech indipendente che rende ispezionabili
fonti policy pubbliche, cambiamenti osservati, stato delle evidenze e limiti
analitici. Non è consulenza legale o certificazione di conformità.

Contatti stampa e fact-checking: `info@policywatcher.online`

---

### Nota interna di pubblicazione

Il testo è pronto per revisione editoriale. Prima della distribuzione:

1. approvare o rimuovere la dichiarazione attribuita;
2. promuovere online la nuova infografica e verificarne il checksum;
3. verificare il collegamento pubblico al tag sorgente;
4. ricontrollare lo snapshot live della publication readiness il giorno della
   pubblicazione;
5. rimuovere questa nota interna dalla copia destinata ai media.
