# Release 3.8.0 — Browser Evidence Companion Review

Date: 2026-07-22
Scope: Chrome, Microsoft Edge and Safari Web Extension source; active-page inspection; local clue extraction; structured PolicyWatcher API requests; store disclosure; package reproducibility.

## Security and privacy invariants

1. Page access is temporary and begins only after an explicit user gesture through `activeTab` and `scripting`.
2. The extension requests no persistent webmail, all-sites, clipboard, cookie, browsing-history, identity or inbox permission.
3. Raw visible notice text is processed and discarded within the injected page scanner. It is never returned to the popup, service worker, extension storage, logs or network layer.
4. The service worker accepts and transmits only `companyName`, `senderDomain`, `sourceUrl`, `noticeDate`, `effectiveDate`, `policyTypes`, `lang` and the empty honeypot field.
5. Network communication is restricted to `https://www.policywatcher.online/*`; the extension includes no remotely hosted executable code, telemetry, advertising or analytics.
6. Untrusted page and API values are rendered with DOM text operations, not HTML injection.
7. A notice is a starting clue, not evidence. Immediate answers still require PolicyWatcher public-evidence gates, and unknown companies remain behind human source approval, baseline and QA.

## Cross-browser boundary

- Chrome and Edge use the same Manifest V3 store archive and minimum permissions. Microsoft documents Chrome extension APIs and manifest keys as substantially code-compatible with Edge.
- Safari uses the shared web-extension source and Apple’s `safari-web-extension-packager`; final App Store signing, entitlements and notarization require the publisher’s Apple Developer account.
- No claim of Safari Store publication is made until the generated Xcode project is signed and validated on the target macOS/iOS versions.

## Required verification

- Manifest and package allowlist validation.
- Local parser fixtures covering selected text, Gmail-style and Outlook-style visible messages, link-free notices, URL query removal, category/date extraction and unsupported pages.
- Service-worker regressions rejecting raw/unknown keys, non-HTTPS destinations and malformed response states.
- Keyboard, focus, reduced-motion, narrow-popup and bilingual UI evaluation.
- Full application tests, lint, TypeScript, dependency audit and production build.
