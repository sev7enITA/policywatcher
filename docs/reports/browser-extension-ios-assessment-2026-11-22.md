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

## Remaining gates and recording guidance

**Before describing iOS as available:** exercise real Safari enablement, host permissions, page/selection injection, manual fallback, reviewed submission and safe errors on iPhone/iPad; check VoiceOver, language and popup geometry; validate the publisher team and App Store Connect bundle ownership; sign/provision both targets; complete reviewed App Privacy and store metadata; upload and obtain the relevant TestFlight/App Store approval. Local development identities were present, but no publisher team was selected, distribution provisioning validated or account entry inspected in this task. This does not establish absence of a developer account.

The container itself labels this as a preview and states the remaining testing/signing/review gates. It presents the stable public product and private experimental engine separately. For this morning's video, safe wording is: **“An iOS Safari developer candidate now compiles locally; Safari/device qualification, signing and Apple review are next.”** Do not show an App Store install button or imply the source ZIP is an installable iPhone app.

This work does not change public or Preview deployments, production data, scan configuration, source approval, publication or notification flags. No model verdict is attributed to this agent; app-based cross-review is coordinated separately by the primary task.

Official references: [Apple packaging](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari), [Apple creation and testing limits](https://developer.apple.com/documentation/safariservices/creating-a-safari-web-extension), [official Chrome listing](https://chromewebstore.google.com/detail/policywatcher-what-change/hchhgobigadmmanhflndlkkoooicbdih).
