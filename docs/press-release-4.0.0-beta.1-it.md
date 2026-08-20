# PolicyWatcher pubblica la Foundation Beta della versione 4 con un modello canonico per le evidenze sui cambiamenti delle policy

Milano, 20 agosto 2026 - PolicyWatcher ha pubblicato `4.0.0-beta.1`, denominata Canonical Evidence Foundation, come prerelease GitHub. Il record della release e datato 19 agosto 2026. La versione introduce un modello durevole per collegare entita monitorate, documenti fonte, versioni dei documenti, cambiamenti osservati e clausole, mantenendo invariato il percorso di lettura attualmente usato in produzione.

## Una catena strutturata per le evidenze policy

Il nuovo modello additivo segue cinque livelli collegati:

`Entity -> Document -> Version -> Change -> Provision`

Ogni livello esposto pubblicamente riceve un identificatore stabile e deterministico, indipendente dagli UUID interni del database. I riferimenti esterni possono quindi restare stabili quando cambiano nomi, URL o scelte di storage interne.

La prima tassonomia delle clausole copre sei aree ricorrenti nell analisi delle policy digitali:

- training AI;
- condivisione dei dati;
- conservazione;
- arbitrato;
- licenze sui contenuti;
- responsabilita.

La tassonomia classifica il linguaggio osservato. Non determina validita legale, applicabilita o conformita.

## Un unico contratto di publication readiness

La versione 4 sostituisce riepiloghi concorrenti della readiness con un unico contratto derivato dal database, condiviso dall area Admin protetta, dal confronto competitivo interno e dall API pubblica.

Il contratto riporta record configurati, recuperati, con baseline verificata, pubblici e analizzati, insieme all ultima cattura riuscita. Le misure mancanti restano non disponibili e non vengono convertite in zero. Il payload pubblico e solo aggregato ed esclude testo delle policy, note di revisione private e diagnostica di recupero.

Contratto pubblico: `https://policywatcher.online/api/v1/publication-readiness`

## Controlli di migrazione inclusi nella beta

La release include strumenti controllati per backfill storico, riconciliazione deterministica e dual-write transazionale opt-in. Un errore nella scrittura canonica annulla la mutazione legacy associata, evitando divergenze silenziose fra i due modelli.

La migrazione resta controllata:

- il backfill non viene eseguito durante installazione o build;
- il dual-write e disabilitato per impostazione predefinita;
- SQLite resta il database di produzione corrente;
- la portabilita PostgreSQL e verificata in CI e mediante un flusso di rehearsal isolato;
- object storage e passaggio alle letture canoniche non sono attivi.

## Evidenze di verifica

Il commit sorgente promosso ha superato quality gate del repository, portabilita PostgreSQL e rehearsal del dual-write, 153 file di test con 999 test, TypeScript, ESLint, build di produzione Next.js, Sonar, CodeQL e OpenSSF Scorecard. Quattro finding time-of-check/time-of-use nei writer dei report, rilevati durante la promozione, sono stati rimossi usando creazione atomica esclusiva dei file.

La prerelease GitHub include un artifact sorgente Hostinger con checksum verificato. L artifact richiede ancora deployment in staging, rehearsal su un database rappresentativo e verifica post-deploy prima della promozione in produzione.

## Disponibilita

- Prerelease GitHub: `https://github.com/sev7enITA/policywatcher/releases/tag/v4.0.0-beta.1`
- Report funzionale e confronto 3.x: `https://github.com/sev7enITA/policywatcher/blob/main/docs/reports/policywatcher-v4-vs-v3-2026-08-20.html`
- Architettura: `https://github.com/sev7enITA/policywatcher/blob/main/docs/document-evidence-model.md`
- Runbook di migrazione: `https://github.com/sev7enITA/policywatcher/blob/main/docs/document-evidence-backfill-runbook.md`

Il sito pubblico puo continuare a mostrare `3.9.0-beta.42` finche l artifact v4 esatto non completa i gate separati di staging e produzione Hostinger.

## Limiti dichiarati

PolicyWatcher 4 Foundation Beta documenta controlli software implementati. Non stabilisce monitoraggio esaustivo, revisione legale, correttezza analitica, disponibilita del servizio, adozione di mercato o superiorita competitiva. Il grafo canonico non diventa fonte autorevole di produzione finche backfill, riconciliazione, dual-write e read switch non sono completati esplicitamente.

## Informazioni su PolicyWatcher

PolicyWatcher e un progetto civic-tech indipendente che rende ispezionabili fonti policy pubbliche, cambiamenti osservati, stato delle evidenze e limiti analitici. Non e consulenza legale o certificazione di conformita.

Contatti stampa e fact-checking: `info@policywatcher.online`
