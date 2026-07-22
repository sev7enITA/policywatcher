# Store listing kit / Kit per gli store

## English listing

**Name:** PolicyWatcher — What Changed? BETA

**Short description:** Inspect a visible policy-update notice locally and check PolicyWatcher’s verified public evidence.

**Single purpose:** Help a person turn an opened terms/privacy update notice into confirmed non-personal clues and check PolicyWatcher’s public, human-gated policy evidence portfolio.

**Long description:**

THIS EXTENSION IS FOR BETA TESTING.

Received a message saying that terms, privacy, cookie, AI or acceptable-use rules changed? PolicyWatcher helps you understand the evidence without uploading the email.

1. Open the notice and invoke the extension.
2. Read the prominent privacy disclosure and inspect the active tab locally.
3. Review the detected organization, official domain/link, categories and dates.
4. Ask PolicyWatcher for published, source-gated comparisons across the company’s monitored policy portfolio.

If the company is not available, the extension can create a privacy-minimized reference for human source review. No scan or publication begins without administrator approval and QA. A first baseline describes the current text and cannot prove a past change.

The extension requests temporary active-tab access only after your gesture. Raw email text, addresses, subject, body, attachments and fingerprints are not transmitted or stored. No analytics, advertising, telemetry, remote code or mailbox API is included.

Beta limitations: extraction may be incomplete on protected pages, PDFs, non-standard webmail layouts or opaque tracking links. PolicyWatcher may have no historical comparison for a company or may return a first-baseline or human-review state. Results are informational, may be delayed or incomplete, and are not legal advice.

## Inserzione italiana

**Nome:** PolicyWatcher — Cosa è cambiato? BETA

**Descrizione breve:** Analizza localmente una notifica di aggiornamento e verifica le evidenze pubbliche di PolicyWatcher.

**Scopo unico:** Aiutare una persona a trasformare una notifica aperta su termini/privacy in indizi non personali confermati e verificare il portafoglio di evidenze pubbliche sottoposte a gate umano di PolicyWatcher.

**Descrizione estesa:**

QUESTA ESTENSIONE È DISTRIBUITA PER IL BETA TESTING.

Hai ricevuto un messaggio che annuncia modifiche a termini, privacy, cookie, IA o uso accettabile? PolicyWatcher ti aiuta a capire le evidenze senza caricare la mail.

1. Apri la notifica e richiama l’estensione.
2. Leggi l’informativa prominente e analizza localmente la scheda attiva.
3. Controlla organizzazione, dominio/link ufficiale, categorie e date.
4. Chiedi a PolicyWatcher i confronti pubblicati e sottoposti ai gate per l’intero portafoglio di policy monitorate dell’azienda.

Se l’azienda non è disponibile, l’estensione può creare un riferimento minimizzato per la revisione umana delle fonti. Nessuna scansione o pubblicazione parte senza approvazione amministrativa e QA. La prima baseline descrive il testo corrente e non dimostra una modifica passata.

L’accesso alla scheda è temporaneo e avviene solo dopo il tuo gesto. Testo grezzo, indirizzi, oggetto, corpo, allegati e fingerprint non vengono trasmessi o conservati. Nessun analytics, pubblicità, telemetria, codice remoto o API della casella email. Non è consulenza legale.

## Chrome Web Store privacy fields

- **Website content:** handled locally after an affirmative action to extract structured clues; raw content is discarded before it leaves the page execution context.
- **Personal communications:** may be present in the active page but are neither transmitted nor stored; only user-confirmed non-personal operational clues are sent.
- **Web browsing activity:** the extension receives the current tab URL temporarily through `activeTab`; it does not retain or transmit browsing history.
- **Authentication information, location, financial/health data:** not collected.
- **Data sale, advertising, credit/lending:** none.
- **Remote code:** no. All executable code is included in the submitted package.
- **Limited use:** access exists solely to provide the visible notice-to-evidence feature; no human reads raw page content because it never reaches PolicyWatcher.

## Permission justifications

- **activeTab:** gives temporary access to the tab only after the user invokes the extension; replaces persistent access to all sites or webmail hosts.
- **scripting:** injects the packaged, local clue scanner into the active tab after the explicit action.
- **Host `https://www.policywatcher.online/*`:** permits the service worker to POST the confirmed structured clues to the production API and no other host.

## Microsoft Edge Privacy page

- **Single purpose:** use the single-purpose text above.
- **Remote code:** select **No**.
- **Data usage:** disclose local handling of website content/personal communications and temporary current-tab URL access; explain that raw content is neither transmitted nor stored.
- **Privacy URL:** `https://www.policywatcher.online/privacy`.
- **Permission justification:** use the three justifications above.

## Required store assets

- Icon: 128 × 128 PNG from `icons/icon-128.png`.
- Reviewed UI captures are in `docs/screenshots/` at 390 × 600 and 320 × 600; use them as the source for store-safe promotional compositions.
- At least one Chrome screenshot: 1280 × 800 or 640 × 400, showing the disclosure and review states without real personal communications.
- Edge screenshots and small promotional tile according to the current Partner Center form.
- Support URL: `https://www.policywatcher.online/what-changed`.
- Privacy URL: `https://www.policywatcher.online/privacy`.
