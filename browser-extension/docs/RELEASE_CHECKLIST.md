# Production release checklist / Checklist di produzione

## Automated / Automatici

- [ ] `npm ci`
- [ ] `npm run extension:validate`
- [ ] `npm test`
- [ ] `npm run lint`
- [ ] `npx tsc --noEmit`
- [ ] `npm audit --audit-level=high`
- [ ] `npm run build`
- [ ] Commit tracked source before packaging
- [ ] `npm run extension:package`
- [ ] Verify every SHA-256 checksum

## Manual browser QA / QA manuale browser

- [ ] Chrome stable: unpacked install, disclosure, selected-text scan, full visible-page scan, manual fallback and API response.
- [ ] Edge stable: repeat Chromium flow with the Edge package.
- [ ] 390 px and 320 px popup: no horizontal overflow, clipped buttons or unreachable footer.
- [ ] Keyboard-only operation and visible focus.
- [ ] IT/EN switch updates all visible strings and accessible names.
- [ ] Reduced-motion mode removes non-essential animation.
- [ ] Page source contains hostile HTML/labels: result renders as text only.
- [ ] Raw-content/unknown-field request is rejected before fetch.
- [ ] Offline, 429, 409, 503 and malformed-response states are explained without exposing page data.

## Store / Store

- [ ] Listing, privacy fields and permission justifications match actual code.
- [ ] Privacy URL is publicly reachable and contains the extension section.
- [ ] Screenshots use synthetic notices without names, addresses or inbox data.
- [ ] Declare local handling of website content/personal communications even though raw content is not transmitted.
- [ ] Declare no remote code, analytics, ads, telemetry or data sale.
- [ ] Chrome developer account has 2-Step Verification.
- [ ] Edge Partner Center Privacy page is complete.
- [ ] Safari Xcode project has publisher Team, final bundle identifiers and App Privacy.
- [ ] Tag and checksum map to the exact reviewed source revision.
