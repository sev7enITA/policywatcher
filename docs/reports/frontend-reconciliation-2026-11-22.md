# Public frontend assessment and reconciliation, 22 November 2026

## Scope and delivery boundary

This assessment starts from the stable 5.5 source revision `dc43afdfc013c517b949e20b0f2dd2865823cca1`. It covers the Site Atlas, Feature Atlas, Roadmap, the notice-verification entry point, public navigation, and the shared newsroom/release registry. It does not promote the experimental engine, change the private r3 environment, run a scan, or qualify the full pipeline. Publication and its independent hosted checks remain a separate operation.

The initial public HTTP observation at **02:46:20 UTC on 22 November** is preserved in [the HTTP receipt](frontend-reconciliation-2026-11-22/http-before.json). Eighteen requests inspected nine supported public routes in EN/IT. Two additional requests followed the public administrator route to its login page. Four probes to `/changelog` and `/dashboard` returned 404; neither is identified as a broken navigation link. The actual release archive is `/press-kit/releases`, and the interactive dashboard is part of the homepage. The complete fetched text remains in the local audit output, with hashes retained in Git. This is a bounded assessment, not a claim that every dynamic record or every site translation was exhaustively inspected.

## Findings and changes

| Priority | Observed issue | Reconciliation |
| --- | --- | --- |
| P2 | `/atlas?lang=it`, `/feature-atlas?lang=it` and `/roadmap?lang=it` returned English HTML language, headings and canonical URLs. | Query-selected metadata, canonical/hreflang, request-language routing, Italian primary navigation and headings, footer identity, and both sitemap variants now agree. |
| P2 | The Italian homepage linked to `/what-changed?lang=it`, but that page ignored the query and initialized the existing bilingual form in English. | The server selects `initialLang`, metadata and the HTML language from the query. The browser-extension handoff preserves it. No form submission logic changed. |
| P2 | Shared header/footer links lost the selected language when moving into the newly localized pages and the notice checker. | A shared public-navigation helper preserves language only on supported routes, retains the special citizen/association URLs, and leaves external and protected destinations intact. |
| P2 | The Site Atlas still summarized the 7 November r3 update, and the latest newsroom/changelog record ended at the 8–16 November roundup. | A new research record, published **22 November** and reporting **21 November observations**, retains the four extractions, 129 holds, 81 offline tests and initial cleanup failure. RSS, JSON feed, detail routes, structured data and sitemap use the same registry. The 2 November stable release and dated r3 record retain their original identities. |
| P2 | The roadmap's current release milestone could imply that no three-date observation had completed. | The historical separate frozen 12-source cohort is distinguished from current candidates and the still-unqualified 500-success full-pipeline workload. |
| P2 | Reusable present-tense press boilerplate hard-coded 16 companies while the public homepage reported 18 at the observed time. | Removed the mutable count from the reusable boilerplate. Dated historical claims retain their original numbers and dates; current coverage remains inspectable in the public catalogue. |
| P2 | The Atlas SVG used an image role despite containing keyboard-interactive graph nodes, and visually filtered nodes remained in keyboard order. | The graph exposes a named group; filtered nodes leave the accessibility tree and tab order. The headless check exercises keyboard selection and filtering. |

The three planning pages now show an EN/IT evidence panel that distinguishes:

1. **Public stable 5.5.0**, using the established scanner.
2. **Private hosted r3**, requiring administrator access and keeping publication/notifications disabled.
3. **The Git qualification candidate**, whose 133-source follow-up produced four extractions and 129 holds.

The panel explicitly states that whole-source completeness, semantic accuracy and 500 successful daily full-pipeline completions remain unqualified. It does not add four later extractions to the earlier 367-success observation as one contemporaneous 500-source result.

## Executed checks

- **56 tests in eight files passed with operating-system network access denied.** They cover language handoff, server-rendered headings, canonical URLs and social locale, shared navigation, current/stable research separation, RSS/JSON feeds, static detail routes, bilingual article structured data, sitemap entries with an isolated database mock, and the existing roadmap signals.
- **Negative control:** removing only the Italian query parameter from the shared diary link causes all three Italian planning-page regressions to fail on the missing `/engine-6-preview?lang=it#validation` link. The original source is restored. [Receipt](frontend-reconciliation-2026-11-22/italian-link-negative-control.json).
- Full source TypeScript checking, scoped ESLint and whitespace checks passed.
- **18 initial local responsive checks** covered the three planning pages in EN/IT at 320, 390 and 1366 pixels. They checked document language, canonical URL, overflow, evidence links, 44-pixel minimum link targets, visible keyboard focus and page errors. Keyboard selection/filtering of Atlas and filtering of Feature Atlas were also exercised.
- **Eight final handoff checks** covered all four changed page routes in Italian at 320 and 1366 pixels after the shared-navigation and notice-form changes. They confirmed zero horizontal document overflow, language-consistent header/footer links, and the Italian browser-extension handoff. [UI receipts](frontend-reconciliation-2026-11-22/local-handoff-ui.json).

The headless checks used a separate temporary Chromium profile against `127.0.0.1:4517`; they did not operate the user's browser or Hostinger session. Screenshots are local development evidence and include the development environment, not promotional captures of a published release.

The first expanded test run exposed a static-metadata assumption in the canonical-source test; the recognized multilingual routes were updated while actual metadata/language assertions remain. A later footer-source assertion expected a literal link; it now checks rendered English and Italian links. The first UI attempt found an untranslated accessible node label; it was corrected. These failed attempts are retained locally. A Turbopack start failed because its hermetic root rejected the existing external `node_modules` symlink; the isolated UI checks used webpack instead. No deployment configuration was changed for this local setup.

## Residual limits

- **The technical inventories are not fully translated.** The Italian primary shell, route labels and current evidence panel are localized; detailed historical technical descriptions remain English, are marked `lang="en"`, and the page states that this is not a complete translation. Italian search terms do not constitute an Italian translation of the Feature Atlas inventory.
- These are local source/UI results. Public deployment, generated production output and post-deployment EN/IT checks must be recorded separately before calling the patch published.
- No human usability study, assistive-technology session, legal equivalence assessment, general source-completeness approval or pentest is claimed.
- The Next development CLI printed a vulnerability upgrade reminder. It is a verification lead, not an instruction or confirmed vulnerability finding. The parallel backend assessment reports zero known production dependency advisories from the registry at its check time; that result does not prove absence of vulnerabilities. No dependency upgrade was made here.
- Safari/iOS remains unavailable to end users through the App Store. The separate extension workstream reports a locally compiled unsigned developer candidate; functional Safari/device checks, signing and Apple review remain outstanding.

## Suggested video sequence after hosted acceptance

1. Open the Italian homepage and show the dated public portfolio, without turning its current count into a completeness or 500-policy claim.
2. Follow **Verifica un avviso** and show the Italian form, local extraction boundary, explicit confirmation and browser-extension handoff. Use a synthetic notice; do not submit personal email content.
3. Show the Policy Briefing and original evidence links.
4. Open **Engine 6 Preview → diario** and explain the 133 fixed URLs, four extractions, retained failures and 129 unresolved outcomes.
5. In a separate authenticated view, show existing private r3 reports and saved comparisons. Describe the r3/Git candidate distinction; do not call the newest algorithm deployed there.
6. Use the Atlas panels to explain stable, private Preview and qualification states. Acknowledge the English technical inventory when using the Italian view.
7. Show the research update separately from the stable product release and the historical r3 record.
8. Present Chrome/Edge availability independently from the unsigned iOS developer candidate. Do not show an App Store download claim before signing/review and a verified listing.

## Independent consumer review and follow-up

A second code reviewer found a real consumer mismatch before integration: the Engine notebook reused the latest research paragraphs but still attached fixed headings from the older r4/passage-recovery update. The notebook now uses neutral numbered EN/IT observation headings. Two regression tests render the actual `EnginePreviewPage`, isolate its latest-research section, inspect headings and current evidence, and preserve the 21 November notebook dateline. Restoring only the previous fixed headings makes both tests fail. [Negative-control receipt](frontend-reconciliation-2026-11-22/engine-heading-negative-control.json).

The manual notice-form language control is now a language link using same-page replacement navigation. Its navigation callback updates the visible copy; the server selects matching canonical metadata and the document-language bridge follows the query. The link remains visible with a minimum 44-pixel target on mobile. Unlike a full page reload, this preserves the current form state. A local headless check switched **IT → EN → IT at both 320 and 1366 pixels**, asserting that URL, canonical URL and HTML language all match, while the synthetic notice text, company, both dates and policy URL remain intact. Browser history length stayed unchanged and no policy-inquiry submission was made. [Four-transition UI receipt](frontend-reconciliation-2026-11-22/language-switch-ui.json).

The expanded **75 tests in nine suites passed with operating-system network access denied**. The second reviewer independently reran those same suites and obtained 75/75 passes, with no new P0/P1 or blocking defect in this source patch. Full source TypeScript checking, scoped ESLint and whitespace checks passed. This is an independent source review within the agent team, not an external security assessment or hosted acceptance.

The expanded suite also exposed two older tests that assumed literal links remained in header/footer source files. They now verify the actual rendered Press Kit and Italian association links through the shared navigation helper. The intermediate failures remain in local follow-up logs. No publishing, scraping or notification behavior was exercised by this follow-up.


## Public copy follow-up: bounded 22 November audit and iOS candidate

This follow-up remains public source and local verification only. It adds a separate 22 November research record without replacing the 21 November follow-up, stable 5.5 release or historical private r3 record. The notebook dateline advances to 22 November because the contract rerun and iOS development evidence are now represented; the old 21 November ledger entry is preserved.

The declared-contract limitation is **reconfirmed**, not newly discovered: the earlier 7 November material already described the same class of blind spot. The 22 November rerun on candidate `c7deedbc1d926eb54845c2ffeca0e42efab2b6aa` exercised seven structured synthetic document objects. The complete control passed. Four of the six incomplete variants also returned `contract_satisfied`: a missing middle clause, lost repeated occurrence, missing table row, and empty required section. The missing-required-heading and missing-terminal controls were rejected. These inputs isolate contract sufficiency; they do not execute HTML acquisition, the parser, semantic AI verification or publication, and do not estimate failure rates on actual policy sources. The Engine notebook, planning panels and release/feed registry state that scope. The 215 back-office, prior 75 frontend and 83 main-adaptation checks have separate purposes and are not combined as one benchmark.

The browser-extension page now shows the developer container **0.1.0, build 1**, unchanged runtime **3.8.3.3**, unsigned simulator build and ARM64 device archive, and the containing-app initial English screen observed on iPhone Duo/iOS 27.1 simulator. Actual Safari activation/injection/submission, physical iPhone, iPad, minimum iOS 17 and accessibility are unqualified; signing, provisioning and Apple review remain open. There is no App Store or TestFlight upload or user-installable release claim. The page links the repository assessment, not an unpublished download. The Edge listing is explicitly labelled as a historical publication report with current listing/URL still requiring verification. This copy does not change the shared store-state registry or extension runtime.

Brand, back, fallback and footer links retain EN/IT. The source regression renders both actual extension routes, checks those links and candidate boundaries, and verifies the absence of Apple installation destinations. Removing only the Italian query from the real copy/paste fallback causes the Italian consumer to fail while the English control passes; the source is restored. [Negative-control receipt](frontend-reconciliation-2026-11-22/audit-copy-negative-link.json).

**80 tests across 11 suites** passed with operating-system network access denied. This is an expanded frontend suite, not 80 additional pipeline or capacity tests. Full source TypeScript, scoped ESLint and whitespace checks pass. **12 local responsive checks** covered browser extension, Engine notebook and Atlas in EN/IT at 320 and 1366 pixels, with matching canonical/document language, no page errors or horizontal document overflow, and bounded current evidence visible. The extension report link was keyboard focused and its minimum 44-pixel height checked. [UI receipt](frontend-reconciliation-2026-11-22/audit-copy-ui.json). The first browser pass failed to connect because the development CLI stopped before accepting requests; that attempt is retained locally and the same command was restarted. A later rerun was interrupted by premature cleanup of the local QA server after 11 views; that harness failure is retained, and the final isolated run completed all 12 views. Its receipt was saved and all assertions completed, but the local Node runner remained alive after the Chrome child had closed; that runner and the owned local server were terminated. This is a harness cleanup limitation, not a claim of natural process exit. No dependency or deployment configuration changed.

The notebook validation-receipt navigation now has **nine** links. Public GitHub links to the final demonstration audit and extension assessment require those reports to be integrated into `main` before a public delivery is accepted. The final demonstration report is maintained by the root audit workstream at `docs/reports/policywatcher-demo-audit-2026-11-22.md`. Hosted publication remains the root workstream's separate responsibility.

Source identity remains explicit: the contract rerun and remote133 observations belong to `c7deedb`. Later code or implementation-manifest identities do not inherit a cohort, completeness verdict or hosted qualification from those observations. Regeneration and validation of the final delivery manifest are a separate release check after source integration.


## Full-suite compatibility and affirmative headings

The root full-suite run exposed stale assertions against literal JSX after the bilingual render changes. The notice-wiring regression now renders the real EN/IT entry route and checks its privacy and methodology destinations while preserving the existing security, bounded-input, guarded-disclosure, and publication-gate assertions. The four planning-heading expectations now render both actual language variants rather than require English literals in source. Existing prohibited-claim, narrative-headline and contrastive-copy guards remain; the rendered planning headings are also checked against the claim guards.

The Safari section heading is now the functional label “Safari iOS: developer candidate” / “Safari iOS: candidato per sviluppatori”. The research headline uses “candidato iOS per sviluppatori”. Unsigned-build status and every unqualified Apple/Safari gate remain explicit in the body; they were not removed to satisfy the heading check.

The expanded frontend run passed **256 tests in 13 suites with operating-system network access denied**. It includes the previous 80-test suite and the claim/wiring suites; these are not additive results. Restoring the unlocalized Italian diary link causes all three Italian planning-page tests to fail, and restoring the English contrastive Safari heading causes the unchanged headline guard to fail. Sources were restored after both negative controls. [Negative-control receipt](frontend-reconciliation-2026-11-22/full-suite-compatibility-negative-controls.json). TypeScript, scoped ESLint and whitespace checks pass. The separate root IPC-only test failure was outside this frontend scope; no sandbox permissions were relaxed here.

The existing methodology route initializes its own local language control and does not consume a language query; its current canonical destination remains `/methodology/confidence` in public navigation. This narrow follow-up does not claim to complete that route's language reconciliation. No new browser session, build or deployment was started.


## Centralized per-store distribution reconciliation

The final inventory pass found the page-level historical Edge wording was insufficient: the shared store state and release summary still represented Chrome and Edge as currently published. The central Edge state is now **unverified**, with its previous publication report retained explicitly. No verified current Edge listing URL is available; this does not establish withdrawal, rejection or that the historical publication was false. Chrome retains its verified public listing URL and published state. Safari remains store-unavailable; its current copy distinguishes the unsigned developer candidate from any App Store or TestFlight release.

The centralized release summary propagates those separate states to the homepage dashboard strip, privacy page, Press Kit, current-cycle copy and machine-readable Press Kit data. The browser-extension page consumes the shared labels and uses the shared states to withhold installation actions. Even a syntactically valid Edge or Apple URL supplied to the component does not create an install action while those states are unverified/unavailable. No current Edge URL was invented or inferred from store-search results.

The legacy `POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATE = 'chrome-edge-store-published'` is retained solely as a historical compatibility identifier, with an explanatory source comment. It is not the current store verdict and is not used as a rendering/install gate. Product version 5.5.0 and extension version/runtime are unchanged. Because `release.ts` is in the engine implementation closure, the final release workstream must regenerate and verify the manifest on the exact integrated source; this copy change creates a distinct implementation identity and inherits no qualification cohort.

The expanded frontend run passed **267 tests in 15 suites with OS network denied**, including the earlier suites rather than adding their totals. Actual EN/IT Press Kit and homepage-body consumers display the bounded centralized summary; the homepage test uses a documented consent-granted wrapper fixture because the initial TermsGate intentionally omits dashboard children from SSR. It neither simulates consent persistence nor makes a network/data request. The actual English privacy-policy consumer is also checked. Restoring only the stale English Chrome/Edge-published summary makes three tests fail across the consumers and release metadata. [Negative-control receipt](frontend-reconciliation-2026-11-22/store-status-negative-control.json). Full source TypeScript, scoped ESLint and whitespace checks passed. The initial homepage assertion correctly found the extension strip absent before the consent-granted fixture; that local attempt is retained. No browser, runtime extension, store submission, build or deployment was changed here.
