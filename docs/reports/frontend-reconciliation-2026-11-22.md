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
