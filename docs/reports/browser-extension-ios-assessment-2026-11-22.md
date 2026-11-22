# Browser extension and Safari iOS assessment, 22 November 2026

A concrete **Safari iOS developer candidate 0.1.0 (1)** now builds for the simulator and as an unsigned device archive. Its eleven shared runtime files match browser extension **3.8.3.3 / 3.8.3 Beta 3** byte for byte. **It is not available on the App Store and the unsigned device archive is not installable by ordinary users.** Actual Safari and physical-device behavior remain untested. [Build receipt](browser-extension-ios-assessment-2026-11-22/ios-build-receipt.json) and [assessment summary](browser-extension-ios-assessment-2026-11-22/summary.json).

## Existing extension and online product

The extension is a structured notice-inquiry client. It inspects a selected/visible notice locally after an explicit action, shows editable clues and sends only confirmed allowlisted fields to `/api/policy-inquiries`. It neither chooses nor activates Engine 6, and a notice is not source-policy evidence. Its public-API result states match the current repository contract on source review; no production inquiry was submitted for this assessment.

The live public Chrome Web Store response was retrieved on 22 November with HTTP 200 and contained the expected name, displayed version and numeric version. The [HTTP receipt](browser-extension-ios-assessment-2026-11-22/chrome-listing-http.json) records the response hash and retrieval time. No browser installation or authenticated store account was reviewed. The repository's historical Edge-published state has no exact listing URL in the reviewed sources; the UI correctly withholds an unconfigured direct-install link. Current Edge availability still needs direct verification.

No shared runtime change or forced Chromium version bump is justified solely by the website's 5.5 release or Engine 6 Preview. The new native iOS wrapper has its own version/build. No Chrome/Edge package or Apple submission was uploaded.

## Findings fixed in source

- **P2, packaging:** the ZIP script allowed only `www.policywatcher.online`, while its own reviewed JavaScript uses the apex host. It therefore rejected the canonical input after the dirty-source guard. The redundant www-only grep is removed; the shared validator remains mandatory. Relative output directories are normalized before creating ZIPs.
- **P2, build validation:** the former prefix regex accepted lookalike/userinfo destinations such as `https://policywatcher.online.evil.example` and `https://policywatcher.online@evil.example`. URL-literal checks now compare the exact parsed origin and reject user credentials. This is a build-validation defect, not evidence of a runtime exploitation or data leak.
- **P2, Safari packaging:** passing the whole source folder to Apple's packager copied documentation and screenshots into the generated extension. The new generator stages only eleven reviewed runtime files and checks them again inside each built `.appex`.
- **P2, native boilerplate:** Apple's generated native handler logged and echoed messages; the reviewed replacement does neither. No native-messaging permission is requested. The local host screen has no JavaScript message bridge, uses a non-persistent WKWebView, keeps navigation local and opens only explicitly clicked canonical HTTPS links in the system browser.

The six new offline packaging/origin checks pass. Replacing the two changed scripts with the parent versions makes the same suite fail four tests; restoring the fix returns all six to green. Thirteen existing extension and store-boundary tests pass. The source validator, syntax checks, focused ESLint and engine implementation-manifest check pass. The source-only engine identity is unchanged. [Parent regression](browser-extension-ios-assessment-2026-11-22/regression-parent.log), [fixed regression](browser-extension-ios-assessment-2026-11-22/regression-final.log), [existing tests](browser-extension-ios-assessment-2026-11-22/unit-tests.log).

## iOS build evidence

Using the installed Xcode 27.2 packager and SDKs, the generator produced an iOS-only project without opening Xcode. It built an unsigned universal simulator app (`x86_64`, `arm64`) and archived an unsigned ARM64 device app. Both app and extension report version 0.1.0, build 1, with explicit identifiers `online.policywatcher.safari` and `online.policywatcher.safari.Extension`. The container minimum is iOS 17.0; the generated extension target minimum is 15.0, so the combined application requires iOS 17.0 or later.

Each built extension contains the same eleven reviewed runtime files, only `activeTab` and `scripting`, and only the canonical PolicyWatcher host permission. Documentation, signatures and embedded provisioning profiles are absent. The two build logs contain the standard AppIntents-metadata-skipped warning because the app has no AppIntents dependency; both builds succeed. Earlier generated projects and candidate builds are retained separately.

The project ZIP is a traceable build output, not a claim of byte-identical regeneration across Xcode invocations. The source revision, runtime hashes, executable hashes and project-ZIP checksum are retained in the receipt. The generator fails on unfamiliar project formats rather than guessing a transformation.

Reproduce from committed source:

```sh
node scripts/validate-browser-extension.mjs
node --test scripts/test-browser-extension-origins.mjs
npx vitest run src/lib/__tests__/browserExtension.test.ts src/lib/__tests__/browserExtensionStores.test.ts
python3 scripts/package-safari-ios.py --output /absolute/new/output/path --build all
```

## Bounded functional checks and submission preparation

The unchanged 0.1.0 (1) simulator app was installed and launched in a **new dedicated iPhone Duo simulator, iOS 27.1**, using the supported `simctl` commands without opening or controlling the Mac Simulator UI. The observed primary display rendered the official logo, preview/version labels and initial English onboarding. It is a containing-app startup observation, not an extension-in-Safari test. The secondary integrated display was black. The initial screenshot command required an explicit display; its failure was retained. The dedicated simulator was shut down after capture, leaving unrelated simulators untouched.

Four XCTest cases execute the actual native handler on **macOS**, passing empty, parsed JSON-dictionary, string and array contexts. The handler completes exactly once with no returned items and never reads the supplied input. This verifies no native echo/serialization path; it does not demonstrate iOS Safari dispatch. Six further tests execute the **actual packaged worker** in a Node VM: sender/type rejection, fixed-endpoint JSON dictionary, credential/redirect boundary, raw-field rejection, 429/503 and offline results. Browser and network APIs are stubbed, and no production inquiry is sent.

The installed iOS 27.1 runtime supports only iPhone Duo. Creating an iPhone17Pro failed with CoreSimulator403; no compatible iPad runtime was available. The failed attempt remains recorded. iPad and physical/minimum-version execution remain open. Source API review found no unsupported options in the used Safari call shapes, but actual Safari enablement, injection and network behavior were not observed. [Functional evidence](browser-extension-ios-assessment-2026-11-22/functional-summary.json), [native XCTest](browser-extension-ios-assessment-2026-11-22/native-handler-tests.log), [worker contract](browser-extension-ios-assessment-2026-11-22/runtime-contract-packaged.log).

A publisher-review [submission kit](../../browser-extension/apple/submission/README.md) now provides EN/IT metadata/descriptions, TestFlight text, review notes, privacy-answer proposals, signing/export and screenshot instructions, API review, synthetic notice and QA matrix. Names/subtitles, promotional text, keyword UTF-8 bytes and descriptions pass an offline length/identity check. Support URLs point to the live About page containing contact information; the extension landing page did not expose that contact in its retrieved HTML. Privacy answers remain conditional on actual server/log/provider retention; no unsupported “Data Not Collected” assertion is filed. No signing, team selection, membership change, App ID registration, TestFlight upload or Apple review occurred.

Reproduce the bounded checks without controlling Mac GUI:

```sh
swift test --package-path browser-extension/apple --scratch-path /absolute/new/swift-build
node scripts/test-safari-runtime-contract.mjs --runtime-dir '/path/to/PolicyWatcher Extension.appex'
python3 scripts/validate-safari-submission-kit.py
python3 scripts/smoke-safari-ios-simulator.py --app '/path/to/PolicyWatcher.app' --output /absolute/new/smoke-evidence
```

The simulator smoke script creates and shuts down only its own device. An earlier three-second capture was white despite a live app process; that receipt is retained as launch evidence and does not count as rendered onboarding. The first semantic-render attempt then produced a rendered image but its default Vision OCR timed out after 30 seconds, so the automated run remained failed. The corrected local fast, CPU-only OCR helper avoids that dependency. A fresh dedicated simulator run passed the explicit PolicyWatcher + Enable-the-extension heading gate and independent visual review; its final screenshot hash is `deab636617741d29f6f0b2c1cce997b5c82b971ccf14d2fd2691c0170f12f2e5`. Its 7.09-second sample interval is measured **after OCR-helper compilation**, not a cold-start performance benchmark. The helper's CPU-only compatibility property emits a deprecation warning on the installed macOS SDK; it compiles and runs successfully. Every failure and intermediate capture remains preserved. [Render receipt](browser-extension-ios-assessment-2026-11-22/container-render-verified.json) and [retained OCR timeout](browser-extension-ios-assessment-2026-11-22/container-ocr-timeout.json).

This bounded smoke never enables Safari or submits a request. Initial EN rendering, real Safari operation, physical-device testing and final privacy/signing decisions remain separate.

## Remaining gates and recording guidance

**Before describing iOS as available:** exercise real Safari enablement, host permissions, page/selection injection, manual fallback, reviewed submission and safe errors on iPhone/iPad; check VoiceOver, language and popup geometry; validate the publisher team and App Store Connect bundle ownership; sign/provision both targets; complete reviewed App Privacy and store metadata; upload and obtain the relevant TestFlight/App Store approval. Local development identities were present, but no publisher team was selected, distribution provisioning validated or account entry inspected in this task. This does not establish absence of a developer account.

The container itself labels this as a preview and states the remaining testing/signing/review gates. It presents the stable public product and private experimental engine separately. For this morning's video, safe wording is: **“An iOS Safari developer candidate now compiles locally; Safari/device qualification, signing and Apple review are next.”** Do not show an App Store install button or imply the source ZIP is an installable iPhone app.

This work does not change public or Preview deployments, production data, scan configuration, source approval, publication or notification flags. No model verdict is attributed to this agent; app-based cross-review is coordinated separately by the primary task.

Official references: [Apple packaging](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari), [Apple creation and testing limits](https://developer.apple.com/documentation/safariservices/creating-a-safari-web-extension), [official Chrome listing](https://chromewebstore.google.com/detail/policywatcher-what-change/hchhgobigadmmanhflndlkkoooicbdih).
