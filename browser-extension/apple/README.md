# Safari iOS candidate

This folder supplies the native container and local EN/IT onboarding for the shared browser extension. The iOS wrapper is **0.1.0 (1)**; the unchanged shared extension remains **3.8.3.3 / 3.8.3 Beta 3**. Product 5.5.0 and experimental Engine 6 have independent identities. No store publication follows from creating or building this project.

## Generate and build locally

Use the repository root on a Mac with Xcode 27.2 and the iOS simulator SDK installed. Commit the source before packaging; choose a new output directory so earlier evidence remains preserved.

```sh
npm run extension:validate
node --test scripts/test-browser-extension-origins.mjs
python3 scripts/package-safari-ios.py --output /absolute/new/output/path --build all
```

The command uses Apple's installed `safari-web-extension-packager` with `--ios-only --copy-resources --no-open --no-prompt`. It copies eleven allowlisted runtime files, applies the reviewed container and official existing logo, verifies the generated runtime hashes, and builds without signing or contacting App Store Connect. A local Xcode 27 project format is required; an unexpected format fails rather than silently patching another layout.

Outputs include a source-project ZIP, simulator `.app`, unsigned device `.xcarchive`, build logs and `receipt.json` containing the source revision, exact input hashes and distribution limits. The minimum container OS is iOS 17.0; the generated project supports iPhone and iPad. The unsigned device archive cannot be installed by ordinary users or uploaded as a signed release. Simulator compilation does not establish functional Safari compatibility.

## Bounded functional checks and submission kit

The containing app was installed/launched in a dedicated iPhone Duo simulator (iOS27.1). A screenshot verifies initial English onboarding rendering, not Safari extension behavior. The installed runtime supports no iPad device type. The four native-handler XCTest cases run on macOS and check that JSON dictionaries/strings/arrays are not read or echoed. Six worker tests run actual packaged JavaScript against stub browser/fetch APIs. These are deliberately separate from real Safari enablement, injection or live query evidence.

```sh
swift test --package-path browser-extension/apple --scratch-path /absolute/new/swift-build
node scripts/test-safari-runtime-contract.mjs --runtime-dir '/path/to/PolicyWatcher Extension.appex'
python3 scripts/validate-safari-submission-kit.py
python3 scripts/smoke-safari-ios-simulator.py --app '/path/to/PolicyWatcher.app' --output /absolute/new/evidence
```

The [submission preparation kit](submission/README.md) contains EN/IT draft metadata, review notes, TestFlight copy, privacy proposals, signing/export guidance, screenshot requirements, API review and a QA matrix. It has not been submitted to Apple. Publisher privacy, signing and real-browser/device gates remain open.

The source project has two explicit bundle identifiers:

- Host app: `online.policywatcher.safari`
- Extension: `online.policywatcher.safari.Extension`

The generated host has no JavaScript bridge, uses a non-persistent WKWebView and opens only explicit user-clicked HTTPS links to the canonical PolicyWatcher host in the system browser. Native messaging is not requested; the native handler does not echo or log messages. Neither the container nor the extension enables Engine 6, source approval, automated publication or notifications.

## Required before external availability

1. Test the actual Safari extension in iPhone and iPad Safari: enablement, permission denial, selected-text and visible-page inspection, manual entry, language switching, keyboard/VoiceOver and popup geometry.
2. Use synthetic public notices to test reviewed submission and safe error states (offline, 429, 409, 503, malformed responses), with an explicitly approved test destination. Do not send personal messages or real email content.
3. Confirm App Store Connect ownership of the bundle IDs, select the publisher's Apple Developer team for **both** targets, and create a signed archive with the appropriate provisioning. The generator deliberately selects no team and passes `CODE_SIGNING_ALLOWED=NO`.
4. Review the existing extension privacy notice and the actual server retention/security logging when completing App Privacy. Raw page content stays local; confirmed structured clues go to the public API. Do not use an unreviewed “no data collected” assertion.
5. Complete the store listing, screenshots, age/content declarations, privacy/support URLs and export compliance. Upload/validate the signed archive; TestFlight and App Store review are separate steps.
6. Add a public installation link only after the exact Apple listing is visible and verified. Until then, the public Safari state remains **unavailable**.

There is no paid-service setup, account creation, permission change, signing-key generation or Apple upload in this build procedure.

## Official references

- [Apple packaging guide](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari)
- [Create a Safari web extension](https://developer.apple.com/documentation/safariservices/creating-a-safari-web-extension)
- [Run a Safari web extension](https://developer.apple.com/documentation/safariservices/running-your-safari-web-extension)

## Italiano

Il progetto locale iOS permette di preparare e compilare l'estensione Safari per iPhone e iPad. Il contenitore è **0.1.0 (1)** e usa senza modifiche il runtime **3.8.3.3**. Progetto sorgente, build per simulatore e archivio device **senza firma** non equivalgono a disponibilità su App Store. Restano necessari collaudo funzionale Safari e su dispositivo, scelta del team del publisher, provisioning/firma, App Privacy e revisione Apple. Il comando non carica né pubblica nulla e non cambia il motore online.
