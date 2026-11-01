# PolicyWatcher navigation research and implementation decisions

Date: 30 October 2026 (Europe/Rome). Scope: navigation and public header. This is a product implementation supported by desk research and model critique, not a measured user study.

## Current source and audit boundary
The chat opened in the historical Desktop/iCloud checkout. It contains dataless files and an older header. The current working checkout is `/Users/fabriziodegni/Projects/PolicyWatcher-public-update-20261026`, starting from commit `6780e99`, branch `codex/navigation-compass-20261030`. Its tracked files were clean before work. No changes to the older source are used in the implementation.

Current production captures:
1. `01-before-desktop.png`: full-width bottom ribbon with many equal-weight controls and two icon-only actions. The unchanged public evidence introduction remains above the workspace.
2. `02-before-menu.png`: More opens a narrow right-hand directory, whose catalog links are indirect through Atlas. The dialog leaves its trigger focused in the observed state; code confirms no native modality or focus containment in this navigation component.
3. `03-before-public.png`: public header already exposes four clear primary links and a More tools disclosure. Preserve these recent improvements. The initial old-source assumption of ten flat links does not apply to current production.

## Primary market sources checked
- Visualping, Navigating Alerts: https://help.visualping.io/en/articles/10154433 . Alert opens a difference view with summary, changes, comments and before/after inspection. Useful pattern: a visible next action from notification to evidence.
- Distill, Using Web App: https://distill.io/docs/web-monitor/using-web-app-to-track-webpage-changes/ . Watchlist previews open change history. Useful pattern: clear source-centered orientation and direct history access.
- PageCrawl product page: https://pagecrawl.io/ . Describes plain-language change summaries and reports organized by tag, folder or domain. Useful pattern: progressive organization rather than an undifferentiated tool list.

These are vendor descriptions, not hands-on audits or evidence of comparative usability, adoption, market share, or customer satisfaction. No market-size claims are made.

## Required model consultations
- GLM-5.3, High, through the authenticated ZCode app. Completed response captured in `glm-research-observed.txt`. GLM used public web fetches for the three vendor homepages; its response reports that source review. No private project data or credentials were sent.
- Gemini 4 Argon (`gemini-4-argon`), `thinkingLevel: HIGH`, API. Successful response `finishReason: STOP`, response modelVersion recorded in `gemini-research.json`; prose in `gemini-research.md`. Gemini explicitly states it did not browse and analyzes the source summaries supplied by this agent. Official model/capability reference: https://ai.google.dev/gemini-api/docs/models/gemini-4-argon . This is the specific Gemini 4 High requested, not a substituted earlier model.

## Adjudication
Accepted: task-oriented grouping; complete direct access; descriptions under labels; stable role shortcuts; explicit keyboard and mobile behavior; preserve global command search; slate/indigo/teal editorial treatment.
Corrected: the old-source counts (21 commands, ten flat public links) were preliminary. Current navigation has 22 catalog/group commands plus four primary actions. Counts must come from rendered data. Current public header already has progressive disclosure.
Rejected: GLM claim that all competitors have 3–5 sections is unsupported by the inspected public evidence. Rejected invented operational functions from model proposals (scheduler, new dossiers, new automatic classifications). Navigation uses only existing routes/callbacks. No compliance certification language.
Tradeoff: retain the parent HUD layout/padding contract and simplify its bottom navigation rather than rewrite the dashboard solely to move navigation. Public header retains its four direct links; a richer grouped directory provides common vocabulary across both surfaces.

## Design decision
An evidence compass with three independent task lanes: Osserva / Confronta / Approfondisci (Monitor / Compare / Understand). Explicit subtitles describe what each contains. A complete filterable directory provides access to every existing choice. Lane numbers are visual organization, not a mandatory wizard. Primary search still opens the existing global search; directory filtering is separately labeled.

## Validation plan
Run focused TypeScript/lint/tests, then render real components on a local Next preview with an empty disposable SQLite database. Check full directory reachability, IT/EN search, no-results state, callbacks, Escape/focus restore/Tab containment, public-route active states, and widths 1440/1024/768/390/320. Capture desktop/mobile and request an external model visual review. Empty preview data does not establish production or data correctness. Human usability and screen-reader testing remain separate.

## Implemented and observed
1. Dashboard navigation: three stable task entrances, direct notice action, visible global search, and All tools. Native complete directory contains 26 actual actions and destinations, includes role shortcuts, and supports bilingual term matching across all lanes.
2. Directory interaction: source-scope query on Timeline preserved; Italian `esporta` finds Export from the English Monitor lane; no-results reset works. Local callback harness confirms directory-to-action-modal handoff and focus restoration. Shift+Tab/Tab wrap within the directory and Escape restores the trigger.
3. Public navigation: four direct links preserved; a grouped directory now uses the same three task labels, exposes existing specialist destinations and highlights the current route. Real local `/knowledge` and `/guides?lang=it` pages rendered and navigated.
4. Responsive and nested dialogs: no horizontal overflow observed at 1440, 1024, 768, 390 or 320 px. At 320×568 optional role shortcuts follow the main tools, with the first tool visible initially. Opening country/language settings and pressing Escape closes only that dialog, keeps the directory open and restores its trigger.

Corrections during QA: light context-button contrast; bubbling Escape in nested native dialogs; excessive initial chrome at 320×568; clearer Italian descriptions and public Information group label.

Automated evidence: complete TypeScript check passed, scoped ESLint passed, 9 focused suites / 81 tests passed, and `git diff --check` passed. Exact commands and logs are in `implementation-validation.md`, `implementation-tests.log`, and `implementation-typecheck.log`.

External design evaluation: Gemini 4 Argon HIGH returned PASS with no blocking defect in `eval_main_1.md`; final copy recheck also returned PASS with `finishReason: STOP` in `eval_main_2.md`. This evaluation examined current source and screenshots. It did not independently execute browser interaction tests.

Limits: local preview uses an empty disposable SQLite database. Dashboard controls were mounted in a temporary development-only fixture with harmless callbacks; actual exports, alerts, assistant calls and the full TermsGate-protected dashboard session were not executed. Public pages were checked in the real local app. No human usability study, comprehensive screen-reader audit, production build or deployment was performed. The complete command set is reachable; the compact persistent bar intentionally puts Workspace and AI Chat in All tools, and specialist rows use short labels. These are documented discoverability tradeoffs, not inaccessible actions.

The temporary fixture was removed from application routes and retained only as `output/ui-ux-2026-10-30/test-fixture/`. At the end of the 30 October implementation, no production data, permissions, release version, commit, push or publication had changed. Preview remains at http://127.0.0.1:3107/guides?lang=it while the local server is running.

## Reference alignment and commit preparation - 31 October 2026

At the owner's request, the source update is documented under the existing 5.2.0 release without inventing a new production deployment. Updated references: CHANGELOG, README, bilingual in-app How To, bilingual newsroom release register, Site Atlas recommendations and dashboard node, Feature Atlas (via Release Impact plus its explicit route), roadmap, llms.txt and maintained GitHub release-copy source. Historical delivery notes remain dated history.

Follow-up validation: TypeScript passed; scoped ESLint passed for TypeScript/TSX sources (CSS is outside that lint configuration); nine relevant suites passed with 78 tests, including release-register/Atlas consistency and bilingual rendered changelog checks. The earlier 81-test navigation pass covers a different suite selection. Neither count is a production efficacy or usability result.

The walkthrough storyboard and platform copy are documented in [`../media/ui-ux-walkthrough-2026-10-31/README.md`](../media/ui-ux-walkthrough-2026-10-31/README.md); local exports and evidence are in `output/walkthrough-2026-10-31/`. Native availability is verified independently from the web source update; store review or a working Android build does not establish iOS distribution.
