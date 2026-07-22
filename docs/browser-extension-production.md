# PolicyWatcher Browser Evidence Companion 3.8.1

Production, privacy and store guide — Guida produzione, privacy e store

## English

### Single purpose

PolicyWatcher Browser Evidence Companion helps a person who has opened a notice about changed terms, privacy, cookies, AI or acceptable-use rules turn that notice into a structured starting signal and check PolicyWatcher’s public, reviewed evidence portfolio.

The extension does not prove that the notice is accurate and does not treat the notice as policy evidence. It only connects user-confirmed clues to PolicyWatcher evidence that has already passed the public publication gate, or creates a privacy-minimized human-review request.

### Runtime workflow

1. The person opens the extension and reads the prominent disclosure.
2. Pressing the inspection button grants temporary access to the active tab through `activeTab`.
3. The injected scanner reads the selected or currently visible notice inside the page, extracts minimal clues and discards the raw text before returning.
4. The popup lets the person review organization, domain, cleaned official URL, categories and dates.
5. The Manifest V3 service worker allowlists the structured payload and posts it over HTTPS to `https://www.policywatcher.online/api/policy-inquiries`.
6. The popup explains whether verified evidence exists, the company is monitored without a published comparison, the request entered human review, or the clues require correction.

### Permissions

| Permission | Reason | Boundary |
| --- | --- | --- |
| `activeTab` | Temporary access after the extension action is invoked | Revoked when the person leaves or closes the tab |
| `scripting` | Runs the packaged local scanner in the active tab | No persistent content script and no remote code |
| `https://www.policywatcher.online/*` | Sends the confirmed structured request to the PolicyWatcher API | No other network host is permitted |

The extension does not request `<all_urls>`, Gmail or Outlook APIs, inbox access, `clipboardRead`, cookies, browsing history, identity, geolocation, webRequest, downloads or notifications.

### Data handling

- Processed locally and discarded: selected/visible notification text and page links.
- May be sent after review: organization, sender registrable domain, official URL without query/hash/user credentials, selected policy categories, notice date, effective date, language and an empty anti-bot honeypot.
- Never sent or stored by the extension: email address, recipient, subject, message body, attachments, screenshots, authentication data or content fingerprint.
- Extension storage: none. Interface language and disclosure state reset when the popup closes.
- Infrastructure note: the server may process an IP address transiently for security logging and rate limiting; it is not used for profiling or extension analytics.

### Build and validation

```bash
npm ci
npm run extension:validate
npm run extension:package
```

The package command creates reproducible Chrome/Edge and Safari-source ZIP archives with SHA-256 checksums. It refuses dirty tracked source so every artifact maps to one Git revision.

For unpacked Chromium testing, open `chrome://extensions` or `edge://extensions`, enable Developer mode, choose **Load unpacked**, and select `browser-extension/`.

For Safari, use Apple’s current packager:

```bash
xcrun safari-web-extension-packager browser-extension \
  --project-location build/safari \
  --app-name "PolicyWatcher" \
  --bundle-identifier online.policywatcher.browser-extension \
  --swift
```

Select the publisher’s Apple Developer Team in Xcode, validate macOS/iOS targets, archive, and submit through App Store Connect. Signing, notarization and App Store publication cannot be completed without the publisher account.

### Store submission

- Chrome Web Store: upload the Chrome/Edge ZIP, complete the privacy disclosure and permission justifications, provide the public privacy URL, screenshots and listing text from `browser-extension/docs/STORE_LISTING.md`.
- Microsoft Edge Add-ons: the same Chromium archive is supported; complete the dedicated Privacy page, declare no remote code, and use the same single-purpose/permission wording.
- Apple App Store: package the Safari source with Xcode, assign the correct Team/bundle identifiers, complete App Privacy, validate and upload the signed archive.

### Official platform references

- [Chrome `activeTab`](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab)
- [Chrome `scripting`](https://developer.chrome.com/docs/extensions/reference/api/scripting)
- [Chrome Web Store user-data requirements](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
- [Port a Chrome extension to Microsoft Edge](https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/developer-guide/port-chrome-extension)
- [Publish a Microsoft Edge extension](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension)
- [Apple Safari Web Extensions](https://developer.apple.com/documentation/safariservices/safari-web-extensions)
- [Apple Safari Web Extension packager](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari)

## Italiano

### Scopo unico

PolicyWatcher Browser Evidence Companion aiuta chi ha aperto una notifica su nuovi termini, privacy, cookie, IA o uso accettabile a trasformarla in un segnale iniziale strutturato e a verificare il portafoglio di evidenze pubbliche e revisionate di PolicyWatcher.

L’estensione non dimostra che la notifica sia corretta e non la considera un’evidenza di policy. Collega soltanto gli indizi confermati dall’utente alle evidenze PolicyWatcher che hanno già superato il gate di pubblicazione, oppure crea una richiesta minimizzata per revisione umana.

### Flusso operativo

1. L’utente apre l’estensione e legge l’informativa prominente.
2. Premendo il pulsante di analisi concede accesso temporaneo alla sola scheda attiva tramite `activeTab`.
3. Lo scanner incluso legge nella pagina il testo selezionato o la notifica visibile, estrae gli indizi minimi e scarta il testo grezzo prima di restituire il risultato.
4. Il popup consente di verificare organizzazione, dominio, URL ufficiale ripulito, categorie e date.
5. Il service worker Manifest V3 applica una allowlist al payload e lo invia via HTTPS a `https://www.policywatcher.online/api/policy-inquiries`.
6. Il popup spiega se esistono evidenze verificate, se l’azienda è monitorata senza confronto pubblicato, se la richiesta passa alla revisione umana o se gli indizi devono essere corretti.

### Permessi e confini

`activeTab` vale solo dopo il gesto esplicito ed è revocato cambiando o chiudendo la scheda. `scripting` esegue esclusivamente lo scanner incluso nel pacchetto. Il solo host di rete autorizzato è `https://www.policywatcher.online/*`.

Non vengono richiesti accesso globale ai siti, API Gmail/Outlook, accesso alla casella, clipboard, cookie, cronologia, identità, geolocalizzazione, webRequest, download o notifiche.

### Trattamento dei dati

- Elaborati localmente e scartati: testo visibile/selezionato e link presenti nella notifica.
- Inviabili dopo conferma: organizzazione, dominio registrabile del mittente, URL ufficiale senza query/hash/credenziali, categorie, date, lingua e honeypot vuoto.
- Mai inviati o conservati dall’estensione: indirizzo email, destinatario, oggetto, corpo, allegati, screenshot, dati di autenticazione o fingerprint del contenuto.
- Storage dell’estensione: nessuno. Lingua e stato dell’informativa si azzerano alla chiusura del popup.
- Nota infrastrutturale: il server può trattare temporaneamente l’indirizzo IP per log di sicurezza e rate limiting; non viene usato per profilazione o analytics dell’estensione.

### Pubblicazione

Usare i comandi di build sopra per produrre gli ZIP e i checksum. Chrome ed Edge condividono l’archivio Chromium. Safari richiede il progetto generato dal packager Apple, il Team dello sviluppatore, firma, validazione e invio tramite App Store Connect. Il testo store, le dichiarazioni privacy e le giustificazioni dei permessi sono mantenuti in `browser-extension/docs/STORE_LISTING.md`.
