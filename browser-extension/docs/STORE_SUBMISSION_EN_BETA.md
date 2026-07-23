# PolicyWatcher Browser Extension - English Beta Store Submission Pack

Version: 3.8.3 Beta 3
Prepared: 23 July 2026
Product: PolicyWatcher Browser Evidence Companion

This document contains the English text and declarations needed to submit the
current beta to Chrome Web Store, Microsoft Edge Add-ons and Apple TestFlight.
Every answer must continue to match the submitted binary and the live privacy
policy. Beta status does not relax privacy, permission or store-policy duties.

## 1. Recommended beta distribution

- Chrome: start with **Private** trusted testers or **Unlisted** distribution.
  Chrome applies the same review requirements to Private, Unlisted and Public
  items. The beta name must end in `BETA`, and the long description must state
  `THIS EXTENSION IS FOR BETA TESTING`.
- Edge: submit the Edge ZIP through Partner Center and use the narrowest beta or
  hidden audience option offered to the account. Keep the same beta naming and
  privacy declarations used for Chrome.
- Safari: use **TestFlight** for the beta after converting the web extension,
  assigning the Apple Developer Team, signing the containing app and uploading
  it through App Store Connect. Do not describe the source ZIP as installable.

Do not publish the three store URLs on `policywatcher.online/browser-extension`
until each URL resolves to the reviewed official store item.

## 2. Store identity and classification

**Product name**
`PolicyWatcher: What Changed? BETA`

**Version name**
`3.8.3 Beta 3`

**Primary language**
English

**Suggested category**
Productivity. If a store offers a more precise Privacy & Security or Developer
Tools category, use it only if the listing remains discoverable to ordinary end
users; do not classify it as a security certification product.

**Mature content**
No.

**Pricing**
Free beta. No purchases, subscriptions, advertising or affiliate links in the
extension.

**Single purpose**
Help a person turn an opened terms, privacy, cookie, AI or acceptable-use update
notice into user-confirmed, non-personal structured clues and check those clues
against PolicyWatcher’s public, human-gated policy evidence.

## 3. Chrome and Edge listing copy

### Short description

`Inspect a visible policy-update notice locally and check verified PolicyWatcher evidence.`

### Detailed description

```text
THIS EXTENSION IS FOR BETA TESTING.

Received a message saying that terms, privacy, cookie, AI or acceptable-use rules changed? PolicyWatcher helps you check the available evidence without uploading the email.

HOW IT WORKS
1. Open the notice and invoke the extension.
2. Read the privacy disclosure and allow temporary access to the active tab.
3. PolicyWatcher reads the selected or visible notice locally and looks for a policy link in the same notification context.
4. Review the detected organization, sender domain, one cleaned starting link, policy categories and dates.
5. Submit only the confirmed structured clues to check PolicyWatcher’s published, source-gated evidence across the company’s monitored policy portfolio.

PRIVACY BY DESIGN
- Raw email text, subject, addresses, body, attachments, screenshots and content fingerprints are not transmitted or stored.
- No Gmail, Outlook or mailbox API is used.
- No browsing history, cookies, clipboard, identity, geolocation or all-sites permission is requested.
- No analytics, telemetry, advertising, tracking, data sale or remotely hosted executable code is included.
- Temporary active-tab access starts only after your explicit action.

If a company is not available, PolicyWatcher may create a privacy-minimized operational reference for human source review. No new company, source, scan or publication is approved automatically. A first baseline describes the current public text and does not prove a historical change.

BETA LIMITATIONS
This beta may not extract complete clues from protected pages, PDFs, non-standard webmail layouts, dynamically rendered messages or opaque tracking links. A missing link is not reconstructed or guessed. PolicyWatcher may have no published historical comparison for a company, and results may be delayed, incomplete or temporarily unavailable.

PolicyWatcher provides informational evidence, not legal advice, compliance certification or a substitute for reading the official policy. No result guarantees that every change has been detected, that a notice is authentic, or that an organization’s terms are lawful or suitable for a particular user.
```

### Suggested release notes

```text
Initial public beta. Adds user-initiated local inspection of visible policy-update notices, contextual policy-link detection, structured clue review and PolicyWatcher evidence lookup. The beta uses temporary active-tab access and does not transmit or store raw message content.
```

## 4. URLs and contacts

**Homepage**
`https://www.policywatcher.online/browser-extension`

**Support URL**
`https://www.policywatcher.online/browser-extension`

**Privacy policy URL**
`https://www.policywatcher.online/privacy`

**Methodology and limitations**
`https://www.policywatcher.online/methodology/confidence`

**Privacy/GDPR contact**
`privacy@policywatcher.online`

**Beta feedback email - mandatory operator action**
Create and test a dedicated mailbox before submission, recommended:
`beta@policywatcher.online`. Do not enter this address in a store until incoming
mail and replies have been verified.

## 5. Permission justifications

### `activeTab`

```text
PolicyWatcher requires temporary access to the current tab only after the user invokes the extension and confirms local inspection. This access is used to read the selected or visible policy-update notice and its nearby links. It replaces persistent access to webmail services or all websites and ends when the tab is closed or navigated.
```

### `scripting`

```text
The scripting permission runs the scanner packaged inside the extension in the user-activated tab. The scanner extracts minimal structured clues locally and discards raw page text before returning. There is no persistent content script, dynamic code download, eval, remote executable code or background page scraping.
```

### Host permission `https://www.policywatcher.online/*`

```text
This host permission allows the Manifest V3 service worker to send only the user-confirmed, allowlisted structured inquiry to the PolicyWatcher production API over HTTPS and to link to PolicyWatcher result pages. No other network host is permitted by the extension manifest.
```

## 6. Chrome Web Store privacy answers

Use the following answers, adapting field labels if the dashboard wording
changes. Local processing must still be disclosed.

**Single purpose**
Use the single-purpose statement in section 2.

**Website content**
Handled: **Yes**. Selected or visible page content and links are processed
locally after an affirmative action. Raw content is discarded before it leaves
the injected page execution context.

**Personal communications**
Handled: **Yes, locally and ephemerally**. A notice may be a personal
communication. Its raw text, subject, sender/recipient addresses, attachments
and fingerprint are neither transmitted nor stored.

**Web browsing activity / current page URL**
Handled temporarily: **Yes**, only for the current user-activated tab. The
extension does not collect browsing history, build a browsing profile or retain
the current tab URL. If a safe starting policy URL is found and the user
confirms it, only the cleaned URL without query, fragment or credentials may be
submitted.

**Personally identifiable information**
Not collected by the extension. An organization name is treated as an
operational clue, not the identity of the user. The server may process an IP
address transiently for security logging and rate limiting as disclosed in the
privacy policy.

**Health, financial, authentication, precise location and payment data**
Not collected. The scanner may encounter sensitive words in a page, but raw
page content never leaves the local execution context.

**Data sale, advertising, profiling, credit or lending use**
No.

**Human access to raw user data**
No. Raw page content never reaches PolicyWatcher personnel or servers.

**Remote code**
No. All executable JavaScript and CSS are included in the submitted package.

**Limited Use declaration**
```text
PolicyWatcher’s use of information accessed through the browser is limited to providing the user-facing notice-to-evidence feature described in the listing and interface. Data is not used for advertising, profiling, credit decisions, resale or unrelated purposes. Raw page content remains local and is discarded before any network request.
```

Do not claim that the extension handles “no user data”: Chrome’s guidance
requires disclosure even when website content or communications are processed
only on the device.

## 7. Microsoft Edge Partner Center Privacy page

Use the same single purpose, data categories and permission justifications as
Chrome. Recommended answers:

- **Single Purpose:** section 2 statement.
- **Remote Code:** No.
- **Website content:** processed locally and ephemerally after a user gesture.
- **Personal communications:** may be visible to the local scanner; not
  transmitted or retained.
- **Browsing activity/current tab:** temporary active-tab access only; no
  history or profile.
- **Data transfer:** only confirmed structured clues to
  `https://www.policywatcher.online/api/policy-inquiries`.
- **Sale/advertising/profiling:** No.
- **Privacy URL:** `https://www.policywatcher.online/privacy`.
- **Permissions:** paste the three explanations from section 5.

Microsoft requires disclosures to remain complete and consistent with the
submitted code and privacy policy. Recheck the Partner Center Privacy page at
every update.

## 8. Safari and TestFlight metadata

Safari distribution requires a containing macOS/iOS app generated with Apple’s
Safari Web Extension tooling, an Apple Developer Team, final bundle identifiers,
signing and an uploaded Xcode archive.

**Suggested app name**
`PolicyWatcher Beta`

**Suggested subtitle**
`Policy update evidence`

**Beta App Description**

```text
PolicyWatcher Beta lets a tester inspect an opened terms or privacy update notice locally, review minimal structured clues and check PolicyWatcher’s public evidence. Raw message content is not uploaded. This beta may be incomplete on protected or non-standard pages and does not provide legal advice.
```

**What to Test**

```text
1. Open a synthetic or non-sensitive terms/privacy update notice in Safari.
2. Invoke PolicyWatcher and confirm the disclosure appears before inspection.
3. Test selected-text and visible-page inspection.
4. Verify organization, policy categories, dates and one starting link when safely available.
5. Confirm that query parameters, fragments and credentials are removed from links.
6. Verify manual fallback, offline state and unavailable-service messaging.
7. Report any wrong company/link, clipped popup content, inaccessible control or unexpected network request.

Do not test with confidential, medical, financial or employment communications. Do not include personal message content in feedback screenshots or reports.
```

**Feedback email**
Use the verified beta mailbox described in section 4.

**App Privacy**
Answer based on the complete containing app, not merely the web-extension
source. If the containing app adds no SDK, analytics, account or storage, the
extension itself does not collect raw notice content. However, review Apple’s
definition of collection and disclose the production server’s transient IP
processing and any TestFlight/Apple diagnostics separately as required.

**Privacy Policy URL**
`https://www.policywatcher.online/privacy`

**Export compliance**
Complete Apple’s encryption questionnaire for the actual Xcode build. HTTPS/TLS
use still requires an export-compliance determination; do not guess the answer
or claim an exemption without checking the generated app and Apple’s questions.

## 9. Beta disclaimer for the website, listing or tester invitation

```text
BETA NOTICE

PolicyWatcher Browser Evidence Companion is pre-release software provided for evaluation and testing. Features, availability, extraction accuracy and evidence coverage may change without notice. The extension may fail to identify an organization, policy category, date or link, particularly on protected, dynamically rendered or non-standard pages. It deliberately refuses to reconstruct or follow opaque links when doing so could expose tokens or select the wrong source.

PolicyWatcher does not verify the authenticity of an email and does not treat a notification as proof that a policy changed. Results are based on available public sources and human-gated PolicyWatcher records; they may be incomplete, delayed or unavailable. A first baseline describes current text and cannot prove a historical change.

The service is provided for informational purposes only. It is not legal advice, compliance certification, security assurance or a substitute for reviewing the official policy and obtaining qualified professional advice. No warranty is made that every policy, version or change will be detected or that any result is accurate, complete, current or suitable for a particular purpose.

Third-party company, browser and service names are trademarks of their respective owners. PolicyWatcher is independent and is not affiliated with, endorsed by or sponsored by Google, Microsoft, Apple, Gmail, Outlook or the organizations whose public policies may be referenced.

Do not use the beta with confidential communications or submit personal, health, financial, authentication or employment information as manual clues or feedback. Report defects using the designated beta feedback channel without attaching private message content.
```

This disclaimer supplements, and does not replace, the public privacy policy or
any legally required terms. Obtain legal review before relying on warranty or
liability language in a commercial public launch.

## 10. Required visual assets

### Chrome

- 128 × 128 PNG icon: `browser-extension/icons/icon-128.png`.
- At least one 1280 × 800 screenshot; up to five.
- 440 × 280 small promotional tile.
- Optional 1400 × 560 marquee tile.

### Edge

- Extension logo and small promotional tile required by the current Partner
  Center form.
- Screenshots and optional media should use the same synthetic scenarios and
  beta wording as Chrome.

### Screenshot rules

- Use only synthetic notices and fictitious organizations.
- Show the first-run disclosure, local inspection, clue review and one explained
  outcome.
- Do not show a real inbox, person, address, account avatar, message identifier,
  token or production admin screen.
- Include a visible `BETA` label in at least the first screenshot.
- Do not imply endorsement by Chrome, Edge, Safari or monitored companies.

## 11. Reviewer notes

Paste this into an available reviewer-notes field:

```text
PolicyWatcher is a user-initiated, single-purpose beta extension. To review it, open a synthetic webpage containing a terms/privacy update notice, invoke the extension, accept the disclosure, and inspect the active tab. The extension uses activeTab and scripting only after this gesture. Raw page text is processed in the injected function and discarded before the structured result returns to the popup. The service worker accepts only allowlisted structured fields and can contact only https://www.policywatcher.online/*. There is no login, payment, analytics, advertising, remote code, mailbox API, persistent content script or background browsing collection. If the production API is unavailable, the popup reports the failure without claiming that a request was recorded.
```

## 12. Final operator checklist

- [ ] Create developer accounts and enable required account security, including
      Chrome 2-Step Verification.
- [ ] Verify ownership of `policywatcher.online` where the store supports
      publisher/site verification.
- [ ] Create and test the beta feedback mailbox.
- [ ] Confirm privacy and methodology URLs are publicly reachable.
- [ ] Upload the correct 3.8.3 Beta 3 ZIP and verify its SHA-256 checksum.
- [ ] Confirm the installed extension name ends in `BETA` and `version_name` says
      `3.8.3 Beta 3`.
- [ ] Paste the English detailed description without removing the first beta
      sentence.
- [ ] Complete local-processing disclosures; do not answer “no data” merely
      because raw content remains on-device.
- [ ] Paste each permission justification and declare no remote code.
- [ ] Upload synthetic, privacy-safe assets at the required dimensions.
- [ ] Choose a restricted beta audience first.
- [ ] Submit Chrome and Edge independently and record their item IDs/URLs.
- [ ] For Safari, generate the Xcode project, set Team/bundle IDs, complete App
      Privacy and export compliance, sign and distribute via TestFlight.
- [ ] After approval, configure only the official store URLs in the matching
      `NEXT_PUBLIC_*_EXTENSION_URL` variables and deploy the website.
- [ ] Run the post-publication install and end-to-end verification from a clean
      browser profile before inviting testers.

## 13. Official submission references

Requirements checked on 22 July 2026:

- Chrome listing fields and assets:
  `https://developer.chrome.com/docs/webstore/cws-dashboard-listing/`
- Chrome distribution and beta naming:
  `https://developer.chrome.com/docs/webstore/cws-dashboard-distribution`
- Chrome user-data disclosures:
  `https://developer.chrome.com/docs/webstore/program-policies/user-data-faq`
- Chrome Limited Use requirements:
  `https://developer.chrome.com/docs/webstore/program-policies/limited-use`
- Microsoft Edge submission and Privacy page:
  `https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension`
- Microsoft Edge Add-ons developer policies:
  `https://learn.microsoft.com/en-us/legal/microsoft-edge/extensions/developer-policies`
- Safari Web Extension distribution:
  `https://developer.apple.com/documentation/safariservices/distributing-your-safari-web-extension`
- Apple TestFlight overview and external beta:
  `https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/`
- Apple App Privacy:
  `https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/`
- Apple export compliance:
  `https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance`
