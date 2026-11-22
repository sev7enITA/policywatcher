# PolicyWatcher Safari iOS 0.1.0 (1)  -  unsigned developer preview

**Developer artifacts only. Not available on the App Store or TestFlight. The unsigned device archive cannot be installed on an iPhone/iPad without appropriate signing and provisioning.**

This candidate packages the shared browser extension 3.8.3.3 with a local EN/IT iOS onboarding container. It preserves the product distinction: stable PolicyWatcher 5.5.0 is public; Engine 6 Preview remains a separate authenticated experiment with private results. The extension does not select or activate Engine 6.

## Included assets

- `PolicyWatcher-Safari-iOS-0.1.0-build1-source.zip`: generated Xcode project and reviewed source, built from commit `2e744255c5e2e8a82ba05ec81230ca1d5838c860`.
- `PolicyWatcher-Safari-iOS-0.1.0-build1-simulator.zip`: unsigned simulator app, arm64/x86_64, developer testing only.
- `PolicyWatcher-Safari-iOS-0.1.0-build1-device-unsigned.zip`: unsigned arm64 device archive, not an IPA or signed Apple upload.
- `PolicyWatcher-Safari-iOS-0.1.0-build1-review-kit.zip`: EN/IT publisher-review metadata, TestFlight notes, privacy proposals, signing/screenshot instructions, QA matrix and dated evidence.
- `SHA256SUMS.txt` and `release-metadata.json`: exact asset identities and qualification limits.

## Executed checks

Unsigned simulator build and device archive succeed; all eleven packaged runtime files match their reviewed source. A dedicated iPhone Duo simulator on iOS27.1 installed and launched the containing app and rendered its initial English onboarding. Four macOS XCTest cases cover the actual no-read/no-echo native handler, including a parsed JSON dictionary. Six offline Node VM tests exercise the actual packaged worker with stubbed browser/network APIs. Six packaging/origin regression tests and thirteen existing extension/store tests pass. These checks do not establish a working Safari extension or full pipeline qualification.

## Remaining gates

Real Safari enablement, permission granting, page/selection injection and reviewed network submission; iPad, physical-device, minimum-iOS17 and accessibility testing; publisher identity/team and bundle ownership; distribution signing; confirmed server/log/provider retention and final App Privacy; accepted screenshots; TestFlight/Apple review. No Apple account, team, signing, upload or store-availability action was performed. Edge availability still needs an exact verified listing URL; the current Chrome public listing was retrieved successfully.

## Italiano

**Anteprima per sviluppatori non firmata. Non disponibile su App Store o TestFlight.** Il pacchetto dispositivo richiede firma e provisioning prima dell’installazione. Sono disponibili sorgenti, build simulatore, archivio dispositivo non firmato e kit EN/IT per la revisione del publisher. Il solo avvio dell’app contenitore e i test offline non qualificano il funzionamento dell’estensione in Safari. Restano da verificare Safari/dispositivi, accessibilità, titolarità, firma, privacy e revisione Apple.

[Product](https://policywatcher.online/) · [Browser extension](https://policywatcher.online/browser-extension) · [Engine 6 research](https://policywatcher.online/engine-6-preview)
