# Handoff: fix estrazione web + discovery regionale (3.8.3 Beta 4)

Branch: `codex/release-3.8.3-extension-first`
Stato: candidato revisionato e validato, in attesa del commit di release.
Versione applicazione: `3.8.3-beta.4`. Estensione: `3.8.3 Beta 3`, invariata.
Validazione: suite 245/245 in 40 file, `tsc --noEmit` pulito, ESLint pulito,
audit ad alta severita senza vulnerabilita, validatore estensione pulito e build
Next.js di produzione completata. Il bridge Hostinger e stato inoltre avviato
con un database SQLite temporaneo e ha servito la homepage con HTTP 200 sulla
porta assegnata.
Ambito: solo percorso di retrieval lato web. Nessun cambio al modello privacy, all'estensione, o all'automazione inquiry.

## 1. Estrazione web da testo incollato: `src/lib/policyInquiryClient.ts`

Problema: `parsePolicyInquiryLocally` leggeva mittente e date solo dalle intestazioni `From:` / `Date:`, assenti quando l'utente incolla il testo visibile della mail. Risultato: campi vuoti e inserimento tutto manuale.

Modifiche:
- Nuova `senderDomainFromText()`: ricava il dominio da qualsiasi email del brand nel testo visibile, escludendo i provider personali (`FREEMAIL_DOMAINS`) per non catturare mai l'indirizzo del lettore, con ranking che premia local-part di notifica (`NOTIFY_LOCALPART`, es. `privacy@`, `no-reply@`). L'header `From:` resta preferito quando presente.
- `companyHint`: ora inferito dal corpo/firma sempre (prima veniva soppresso se era presente un dominio). Restano i guard fail-closed su saluti e parole generiche.
- `parseDateHint()`: aggiunto supporto date numeriche europee (`22/07/2026`, `22-07-2026`) e ISO.

Test:
- Aggiornato il caso MioDottore: `senderDomain` ora atteso `miodottore.it` (prima `null`).
- Aggiunti 2 test: dominio brand nel corpo con freemail ignorato; data numerica europea.

Nota: il payload web inviato al server include gia `senderDomain` (WhatChangedClient), quindi il miglioramento arriva al matching senza altre modifiche.

## 2. Discovery regionale: `src/lib/policyDiscovery.ts`

Problema: le pagine regionali esistono ma non venivano rilevate. `/de/`, `/fr/`, `/it-it/`, `?hl=de` finivano tutte classificate `Global` e poi scartate dal cap per tipo/giurisdizione.

Modifiche:
- Rimossa `classifyJurisdiction`, sostituita da `resolveJurisdiction(url, label, localeHint?)` (ESPORTATA). Deduce la giurisdizione dalla struttura dell'URL (ccTLD, segmento locale `/xx/` e `/xx-yy/`, query `hl`/`locale`/`country`/…) e solo in ultima istanza da parole esplicite del label. Elimina falsi positivi come "contact us" -> US. Mappe: `EU_REGIONS`, `EU_LANGUAGES`, `UK_REGIONS`, `US_REGIONS`, `WORLDWIDE_TOKENS`.
- `classifyPolicyCandidate(url, label, localeHint?)`: nuova firma, terzo parametro opzionale.
- `extractDiscoveryLinks`: ora legge anche gli `hreflang` (`<link rel="alternate">` e `<a hreflang>`), standard per le varianti localizzate. Ritorna il tipo esportato `DiscoveryLink` (con `localeHint?`).
- Probe path locale-aware: `LOCALE_PROBE_PREFIXES` (`us, uk, de, fr, it, es`) x `LOCALE_PROBE_PATHS`, aggiunti nel loop dei probe comuni.
- Cap allargati: pre-verifica per `tipo|giurisdizione` 3 -> 5 e slice 30 -> 40; cap finale 2 -> 4, cosi le varianti regionali reali sopravvivono alla revisione umana.

Test: aggiunti 3 casi (classificazione regionale su URL reali, nessun falso positivo da label, hreflang).

## Correzioni emerse dalla review indipendente

- Le regioni BCP-47 ora sono autoritative: `fr-CA`, `es-MX` e `pt-BR` non
  ricadono piu nel bucket EU solo per la lingua; `fr-FR` resta EU e `en-US`
  resta US.
- `x-default` viene trattato esplicitamente come Global.
- I label maiuscoli EU, UK e US restano riconosciuti, mentre la frase minuscola
  `contact us` non genera il falso positivo US.
- Le date ISO nel testo visibile vengono effettivamente catturate.
- Le date impossibili come `31/02/2026` e `2026-02-31` falliscono chiuse invece
  di essere normalizzate automaticamente a marzo.
- Il validatore consente all'app Beta 4 di usare l'estensione Beta 3 invariata,
  verificando che base version e versione numerica dell'estensione restino
  coerenti e che l'estensione non sia piu nuova dell'app.

## Impatto sul merge (API pubbliche cambiate)

- `classifyJurisdiction` NON esiste piu. Chi la importa deve passare a `resolveJurisdiction`.
- `classifyPolicyCandidate` ha un terzo parametro opzionale `localeHint` (retro-compatibile).
- `extractDiscoveryLinks` ritorna `DiscoveryLink[]` invece di `Array<{url,label,discoverySource}>` (retro-compatibile a livello di campi; aggiunge `localeHint?`).

## Cosa NON e stato toccato

- Estensione `browser-extension/`: invariata.
- Nessuna automazione inquiry -> discovery: resta con approvazione umana (deciso per il rischio di richieste-esca).
- VPS/renderer: non usato nei test (mancava il secret). La resa su siti SPA resta un limite noto separato: per validarla, configurare `RENDERER_URL` e `RENDERER_SECRET` e rilanciare la discovery.

## Blocco di packaging corretto durante la verifica

La prova di avvio dello ZIP estratto ha rilevato che il bridge Hostinger usava
la vecchia firma argv di `nextStart`. Con Next.js 16.2.11 la porta assegnata
veniva ignorata e il server si apriva su una porta casuale. `server.js` ora
valida `PORT` e invoca `await cli.nextStart({ port })`. Questa correzione non
modifica retrieval, privacy, estensione o database, ma e necessaria per rendere
raggiungibile la build dal proxy Hostinger.

## Follow-up suggeriti (non fatti)

- Ponte inquiry `queued` -> crea azienda dal dominio registrabile + avvia discovery, in un clic lato admin (mantenendo l'approvazione umana).
- Tag di regione a livello di paese (DE vs FR) se serve granularita oltre i bucket EU/US/UK/Global: richiede modifica al modello dati.
- Estensione DOM-aware (mittente reale da Gmail/Outlook, risoluzione dei link di redirect).
