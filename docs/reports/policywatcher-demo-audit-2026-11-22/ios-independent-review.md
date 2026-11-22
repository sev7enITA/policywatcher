# Independent review of extension/iOS candidate

**Verdict: APPROVE for source merge as a local unsigned candidate.**
**Confidence: HIGH for the reviewed static controls and repeated local tests; functional Safari behavior remains unverified.**

Reviewed range: `fc9f3b2^..5eaa08f`, current head `5eaa08f`. Read every changed implementation file and the shared worker/popup/manifest, packaging caller, store-state tests, build receipts and distribution documentation. No new P0/P1 finding was demonstrated.

## Checks executed independently

- Six origin/packaging regressions passed with operating-system network access denied.
- Thirteen existing extension/store-boundary tests passed with operating-system network access denied.
- Source validator, JavaScript syntax, Python parser and engine implementation-manifest check passed.
- Independently inspected the previously built final simulator app and device archive: app ID `online.policywatcher.safari`, extension ID `online.policywatcher.safari.Extension`, version0.1.0/build1, eleven runtime hashes match both source and receipt for each target, no embedded signing/provisioning material. Minimum app17.0 and extension15.0; combined application requires iOS17. Simulator executable contains x86_64+arm64; device contains arm64. See `bundle-recheck.json`.

## Reviewed controls

URL literal validation compares parsed exact HTTPS apex origin and rejects userinfo/lookalikes. The unchanged runtime pins the API URL, omits credentials, rejects redirects and allowlists structured fields. Safari staging and built-bundle checks bind the exact eleven reviewed runtime files; the project is generated from committed inputs and refuses an existing output directory. Native handler does not echo or log message contents. The local onboarding WKWebView uses a nonpersistent store, has no JavaScript message handler/bridge, permits file navigation and only opens explicitly activated credential-free canonical HTTPS links without an explicit port in the system browser. The HTML contains no JavaScript and its CSP excludes inline script. Native container and documents explicitly state that this is not an App Store release.

`git diff --check` reports whitespace in retained raw test logs; these are source-evidence formatting artifacts, not an implementation defect. No source was edited during this review.

## Functional and distribution gates

Eight simulator devices are installed and one is booted, but no simulator app was installed/launched or existing simulator state changed in this review. Merely launching the container does not test the extension. The generated project has no committed functional XCTest/UI-test target. A software-test harness could exercise the onboarding resource load/navigation policy in a simulator, but Safari enablement, extension permissions, active-tab injection, selected/visible-page extraction, popup geometry/VoiceOver and actual browser API/network behavior still need execution in Safari on iPhone/iPad (plus a physical-device check). Use public synthetic notices; avoid sending real notice content or creating production inquiries merely for a green test. Existing Node/VM tests and unsigned compilation do not substitute for these checks.

No signed distribution validation, App Store Connect bundle ownership/team check, provisioning, upload, TestFlight release or Apple review was performed. This review approves merging a carefully bounded developer candidate; it does not approve an installable/public iOS release.
