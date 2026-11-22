# Screenshot and export instructions / Screenshot ed esportazione

The audit captured the **containing app** running in a dedicated iPhone Duo simulator on the installed iOS 27.1 runtime. The primary-display screenshot is diagnostic: it shows the developer-preview label and onboarding, not the Safari popup. The second Duo display was black. These files are not proof of Safari enablement or injection, and their dimensions have not been accepted by App Store Connect.

For store submission, use only current accepted device classes/resolutions shown in [Apple's screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/). Do not resize a diagnostic capture to imply device coverage. The installed runtime supports only iPhone Duo; an iPad runtime/device was not available for this audit.

Required captures, after real functional QA:

1. Native onboarding with the actual preview/release identity.
2. Safari extension disclosure using a synthetic public notice, EN and IT.
3. Review form showing only synthetic organization/domain/date fields.
4. A real, clearly labelled verified-comparison or no-published-comparison result from the approved review/test destination.
5. Explicit offline/rate-limit handling if useful; never imply a queued request is a verified policy change.

Do not photograph personal messages, email accounts, user browsing, private administrator pages, access tokens or unreviewed claims of Engine 6 availability. No composite/fabricated App Store availability badge.

For a dedicated simulator that the owner has enabled and tested, record screenshots through the supported CLI, explicitly naming the display when a device has multiple screens:

```sh
xcrun simctl io "$POLICYWATCHER_SIMULATOR_ID" screenshot --display=1 '/new/path/screenshot-en.png'
```

Keep the exact screenshot, runtime/device identity, app version/build and SHA-256 in the submission receipt. Save language captures after selecting/scrolling to that actual UI language; do not replace text in an image. Actual English and Italian descriptions are in the adjacent metadata JSON files.

## Italiano

Gli screenshot attuali documentano l'avvio del solo contenitore in simulatore. Non dimostrano il funzionamento dell'estensione in Safari e non sono dichiarati accettati da App Store Connect. Servono nuove catture EN/IT del flusso Safari reale e di un dispositivo/iPad supportato, con dati sintetici e versioni verificabili. Conservare originali, ambiente e checksum; nessuna ricostruzione grafica di risultati non osservati.
