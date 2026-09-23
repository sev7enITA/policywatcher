# Verifica successiva e scansione pianificata

Aggiornamento del 23 settembre 2026, ore 20:24 CEST.

## Sitemap

Bing Webmaster Tools mostra **Success**, **348 URL rilevati**, zero errori e zero avvisi. Il conteggio coincide con l'XML pubblico e non costituisce una prova di indicizzazione di tutte le pagine.

Il test live di Search Console delle 20:14:53 CEST ha recuperato `https://policywatcher.online/sitemap.xml` con **esito positivo**: scansione consentita, URL disponibile per Google. La verifica è eseguita dallo strumento di ispezione Google per smartphone, non da un semplice client che ne imita lo User-Agent. Dopo il reinvio, il report Sitemap è passato a **“Riuscita”**, tipo Sitemap, ultima lettura 23 settembre 2026 e **348 pagine rilevate**. Il problema di lettura della sitemap è quindi risolto anche nel report ufficiale. Questo risultato prova il recupero e la lettura del file, non l’indicizzazione di tutti gli URL.

Ulteriori controlli indipendenti: HTTP 200 sia IPv4 sia IPv6, `application/xml`, XML valido, 348 URL univoci dello stesso dominio canonico. Non sono emerse ragioni per modificare DNS o robots.txt. La [procedura ufficiale Google](https://support.google.com/webmasters/answer/7451001?hl=en) distingue il recupero live dalla successiva lettura nel report Sitemap.

## Comando pronto sul server

Installato fuori dalla directory pubblica:

```text
/home/u847874844/policywatcher-ops/hostinger-scheduled-scan.py
```

Il comando usa soltanto la configurazione di produzione già custodita sul server. Nessuna credenziale compare nella riga di comando, nel codice del repository o nei risultati. La directory ha permessi 700, i file 600.

- Esegue il solo endpoint `POST /api/cron/check-all`, senza digest settimanale o mensile.
- Si arresta prima della richiesta se viene configurata una delle variabili SMTP: la versione attuale dell'endpoint potrebbe altrimenti inviare notifiche istantanee o amministrative. Per abilitare successivamente le email occorre introdurre e verificare una modalità esplicitamente silenziosa, oppure autorizzare le notifiche.
- Controlla ambiente e percorso del database per evitare scansioni sul target sbagliato.
- Usa un lock locale e rispetta la lease persistente per evitare sovrapposizioni.
- Salta il lavoro se è presente una scansione completa iniziata nelle ultime 20 ore. Una scansione parziale o limitata a un'azienda non soddisfa questo controllo.
- Non ripete la richiesta dopo timeout o errori del proxy: controlla la conclusione persistita in `ScanRun` per un massimo di 20 minuti.
- Rifiuta redirect dell'endpoint autenticato, per non inoltrare il token a un'altra destinazione.
- Scrive l'ultima ricevuta in `policywatcher-ops/scheduled-scan-last.json`.

Comando da configurare nel pianificatore Hostinger:

```sh
/opt/alt/python311/bin/python3 /home/u847874844/policywatcher-ops/hostinger-scheduled-scan.py
```

Orario proposto: ogni giorno alle **18:37 UTC** (20:37 in Italia durante l'ora legale, 19:37 durante l'ora solare). Espressione per un normale pannello cron: `37 18 * * *`. Questo orario non è ancora salvato in un pianificatore.

La [documentazione Hostinger](https://www.hostinger.com/support/1583465-how-to-set-up-a-cron-job-at-hostinger/) colloca Cron Jobs nel pannello del sito e specifica il fuso UTC. Nel pannello Node finora esaminato la voce non era disponibile, e `crontab`, `systemctl` e `at` sono assenti dalla shell dell'account. La verifica delle possibilità del pannello resta da completare: il Mac è bloccato e impedisce l'accesso alla sessione Hostinger nel browser nativo. Non è stato creato un processo in background non supervisionato né trasferita una credenziale a servizi esterni.

## Validazione

I dieci test del comando sono passati sia localmente sia con Python 3.11 sul server Hostinger. Coprono credenziali mancanti, target e database errati, blocco SMTP, redirect, lease concorrenti, scansioni parziali, deduplicazione temporale e completamento persistito dopo un HTTP 500.

La prova `--check` sul server ha restituito `ready` e 50 policy. L'esecuzione ordinaria ha restituito `skipped / recent_full_scan`, correttamente: la scansione completa delle 17:15 UTC era ancora recente. Non è stata avviata una nuova scansione e non è stato inviato un digest.

**Installato e verificato non significa pianificato:** il job rimane inattivo finché un pianificatore supportato non salva il comando e l'orario. Il prossimo controllo deve verificare la ricevuta del lancio pianificato e, quando dovuto, la relativa riga `ScanRun` completata.

Gli esiti strutturati sono in [follow-up.json](follow-up.json). Il sito pubblico conserva il rilascio già verificato; questo intervento aggiunge un comando operativo esterno al pacchetto dell'applicazione.
