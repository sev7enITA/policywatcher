# Changelog

## Unreleased

## 3.9.0-beta.14 - 2026-07-29

### Press Outreach Desk
- Added a protected `/admin/outreach` briefing-sheet workspace for release readiness, reviewed campaign copy, allowlisted landing links, aggregate operations and bounded editorial funnel reporting.
- Added five versioned Beta 13 campaign cohorts for Italian press, international press, LinkedIn, Product Hunt and Show HN without contact lists or recipient-level fields.
- Added a browser-local, release-versioned launch checklist with direct verification links and reset control; checklist completion is not stored on the server and is not an availability certification.
- Added `?campaign=<allowlisted-id>` Pulse landing measurement while ignoring unknown or additional query parameters and retaining no raw URL, referrer or visitor identifier.
- Added a separate protected parser and endpoint for aggregate pitch, reply, interview, coverage and correction events; auditor and unauthenticated writes are rejected.
- Added qualified editorial reuse, driver, outcome and guardrail totals for all time and 30 days without percentages or pre-baseline targets.
- Updated privacy, measurement, outreach, Editorial Pulse, admin guidance, Feature Atlas and in-app release documentation for version `3.9.0-beta.14`.

### Security and privacy hardening
- Completed a diff-scoped security review across 18 changed or new source files with no reportable vulnerability introduced by the wave.
- Added adversarial endpoint tests for unsupported content types, malformed JSON, oversized payloads and unavailable event storage.
- Masked subscriber addresses in mailer and notification logs and removed raw delivery-error objects from those recipient-specific log entries.
- Clarified that public pages use no tracking or analytics cookies while protected admin and auditor login uses an essential signed HTTP-only session cookie.
- Removed the unsupported claim that application-level encryption protects the live SQLite file and made hosting-level storage and log controls explicit external verification points.

## 3.9.0-beta.13 - 2026-07-29

### Editorial Pulse and distribution assets
- Added `/pulse` as a human-approved registry of verified story leads backed by current Press Kit claims, Data Room snapshots and release records.
- Added versioned deterministic Story Pack ZIPs with stable manifests, source identifiers, facts CSV, citation and editorial pitch copy.
- Added four branded social-card formats per lead plus specific Open Graph images for Pulse, release records and the Editorial Data Room.
- Added accessible iframe-ready evidence-pipeline, configured-scope and release-timeline visuals with visible citations and interpretation boundaries.
- Added `Dataset` and `DataDownload` JSON-LD to the Data Room and `NewsArticle` metadata to Pulse stories.
- Extended privacy-minimized aggregate telemetry to story views, Story Pack and card downloads, citation and embed copies, and Product Hunt / Show HN outbound actions.
- Added versioned Product Hunt and Show HN copy and correctly sized launch assets without vote requests or unsupported claims.
- Connected Pulse to public navigation, command search, Site Atlas, sitemap and the compact service footer.
- Documented the editorial contracts, reproducibility rules and measurement boundary in `docs/editorial-pulse.md`.

### Hostinger database readiness and admin availability
- Separated signed-session verification from database metrics so an authenticated operator can reach the Admin shell while a database-dependent panel reports its own scoped failure.
- Made Policy Inquiry and Press Newsroom counts non-blocking optional metrics instead of prerequisites for the complete Admin area.
- Added an idempotent runtime guard for the privacy-minimized `PressMetricEvent` table and its indexes.
- Added a database initialization hook to managed installs when `DATABASE_URL` is available, while retaining the startup readiness gate.
- Updated the Hostinger startup bridge to locate the initializer in both a complete source deployment and the managed `nodejs` plus `.builds/last-source` layout.
- Extended diagnostics to distinguish directory writability from SQLite file readability and writability.
- Added release-package and regression checks for the managed-hosting layout and database-independent session verification.
- Added a protected, read-only Database Readiness panel covering SQLite quick-check results, expected tables, applied migrations, migration-ledger availability, file access, journal mode and bounded diagnostic codes.
- Replaced the unconditional database-connected label with measured ready, degraded or unavailable states and a manual recheck action.

### Enterprise integration surface
- Added a public `/integrations` directory that separates available, pilot-ready, planned and later commercial integration paths.
- Added a tenant-bound, read-only Enterprise API v2 with Microsoft Entra token validation, allowlisted tenant claims, delegated scope and application-role authorization, stable envelopes and problem responses.
- Added a public OpenAPI contract for API v2 plus an Azure API Management policy for gateway validation, request correlation, origin shielding and coarse quotas.
- Added a source-controlled Power Platform custom connector pilot package for Power Automate, Power Apps, Logic Apps and Copilot Studio.
- Documented why APIs and purpose-built clients are the supported machine surfaces, while normal portal HTML, Teams framing, signed webhooks, Copilot plugins, MCP and Marketplace provisioning retain explicit implementation boundaries.
- Added canonical integration documentation, portal discovery links and focused regression coverage for authentication, field minimization, connector generation and public discoverability.

## 3.9.0-beta.12 - 2026-07-28

### Local MIME Evidence Intake
- Added dependency-free local `.eml` decoding to the What Changed workflow without mailbox permissions or server-side raw-message transport.
- Added bounded MIME depth, part-count and file-size limits plus support for encoded headers, base64, quoted-printable, multipart alternatives and nested messages.
- Preferred plain-text bodies, added a sanitized HTML text fallback and retained cleaned policy links when present in message markup.
- Excluded recipient headers, file attachments, attachment-only messages and active HTML content before local clue review.
- Added a responsive file-import control, explicit attachment-exclusion receipt and localized fail-closed states for unsupported or oversized messages.
- Kept the existing structured inquiry API unchanged: only user-reviewed organization, domain, cleaned URL, categories and dates can cross the browser boundary.
- Added focused regression coverage for MIME decoding, privacy minimization, attachments, HTML fallback and parser resource limits.

## 3.9.0-beta.11 - 2026-07-28

### Evidence Delivery & Integration
- Added a read-only `/api/v1/manifest` integration directory that lists the public data sources, parameter allowlists, publication boundaries, cache policy and rate policy without exposing database access.
- Added a localized `/api/v1/observatory?lang=en|it` endpoint for the curated Observatory registry, signals and events, including its manual-review timestamp and registry boundary.
- Added CORS for the two new v1 read endpoints without credentials, shared 60 request-per-minute rate limiting, `GET`/`OPTIONS` handling and bounded shared caching.
- Added the public `/developers` directory with endpoint examples, integration boundaries and an explicit distinction between the current read-only surface and future signed outbound events.
- Connected the Builder workspace, command palette, navigation ribbon, footer, Site Atlas, sitemap, Feature Intelligence Atlas, roadmap, methodology and README to the developer directory.
- Refined display-font loading to a restrained 400/600/700 scale so dense 800/900 page requests resolve to a more readable public typographic hierarchy.
- Added focused regression coverage for the public source registration, localized Observatory payload and Builder quick access.

## 3.9.0-beta.10 - 2026-07-28

### Source Continuity Ledger
- Added a separate Source continuity view to the public Timeline so retrieval-state events are not presented as provider policy changes.
- Added a bounded and rate-limited `/api/source-continuity` endpoint derived from persisted policy check logs.
- Collapsed repeated equivalent checks into meaningful state transitions and derived a recovery label only when public snapshot evidence already exists.
- Standardized public states, causes and retrieval channels while withholding policy text, hashes, diffs, AI analysis, raw failure reasons, final URLs and administrative logs.
- Added Timeline search, state filters, current-transition markers, evidence boundaries, loading/error/empty states and explicit truncation coverage.
- Added responsive and reduced-motion behavior plus focused regression coverage for transition semantics and public data-source registration.

## 3.9.0-beta.9 - 2026-07-27

### Verified browser distribution
- Added the verified public Chrome Web Store destination to the browser-extension availability model and installation action.
- Replaced the shared store-submission message with independent Chrome, Edge and Safari states.
- Marked Chrome as published, Edge as having no verified official Add-ons listing yet and Safari as not yet available with external signing/review dependencies.
- Updated the homepage, Browser Extension, Press Kit, privacy guidance, release impact and supporting documentation without changing extension permissions or behavior.
- Kept store URLs fail-closed to HTTPS destinations on the expected official host and added regression coverage for defaults and overrides.

## 3.9.0-beta.8 - 2026-07-27

### Assistant entry-point consolidation
- Removed the legacy floating blue chat trigger from the public dashboard.
- Retained one persistent assistant action in the unified desktop and mobile navigation.
- Retained the labelled `AI Chat` action inside Workspace Controls and the assistant action in the Command Palette.
- Kept all retained entry points connected to the existing Policy Live Assistant without changing model behavior or the chat API.
- Added regression coverage for the absence of the legacy trigger and the presence of the unified assistant actions.

## 3.9.0-beta.7 - 2026-07-27

### Evidence Newsroom usability and measurement
- Added mobile Fast Facts before long newsroom content and changed the five-item mobile action desk to a keyboard-scrollable horizontal rail.
- Increased Claim Registry metadata readability while preserving statement, record status, claim type, dates, review cadence, proof, boundary and stable permalink.
- Added a compact shared Footer variant for Press Kit utility pages without changing the full footer used elsewhere.
- Added cookie-free first-party aggregate event counting for press-package download intentions, Data Room views and press-contact intentions.
- Added protected all-time and trailing-30-day aggregate newsroom counts for admin and auditor roles, including zero states and automation/intent boundaries.
- Added a strict event allowlist and persisted only event type, allowlisted target, locale and server timestamp; IP rate limiting remains transient and is omitted from persistent event logs.
- Documented that event-write failures do not block user actions, counts are not unique people or confirmed outcomes, and no target is set without baseline data.

### Release assurance
- Replaced raw upstream chat error details with a generic public message and a non-sensitive diagnostic reference while retaining server-side error detail.
- Removed physical database paths from the authenticated health response.
- Required explicit admin and auditor usernames in production while preserving development-only defaults.
- Added regression proof for Content Security Policy, per-request nonces and frame-ancestor restrictions in the Next.js proxy.
- Applied and exercised the newsroom metrics migration against an isolated SQLite database, including an accepted event and persisted allowlisted fields.

## 3.9.0-beta.6 - 2026-07-27

### Evidence Newsroom
- Added separate English and Italian press ZIP packages containing dated fact sheets, owned media, data files, rights terms, metadata and checksum manifests.
- Added stable fact and claim identifiers with permalinks, current/superseded/corrected/withdrawn state, `as of` date, verification date and review cadence.
- Clarified that the 16-company monitored inventory excludes the WAZE admin-onboarding fixture present in the database.
- Added a dated release archive, release detail pages, `NewsArticle` JSON-LD, RSS and JSON Feed distribution.
- Added an editorial data room with a configured-scope snapshot in PNG, SVG, CSV and JSON plus citation, method and reuse boundaries.
- Added press, fact-checking, interview and speaking request routes using one public contact without a response-time claim.
- Added provenance, clarification/correction and glossary registers; the registry does not claim exhaustive history before 27 July 2026.

### Editorial assets and provenance
- Added raster wordmarks for light and navy backgrounds and explicitly recorded that no native vector master is supplied.
- Embedded IPTC/XMP titles, descriptions, creators, credits, rights, usage terms, alt text and extended accessibility descriptions in supplied PNG/JPEG assets.
- Separated editorial asset terms from the repository licence and retained the explicit statement that Content Credentials are not attached.
- Added public JSON Schemas for the press kit, asset manifest, package manifest, media metadata and data snapshot contracts.
- Added a reproducible `npm run press-kit:package` generator for metadata, localized fact sheets, data formats, manifests and press packages.
- Verified byte-identical press assets across consecutive generations, 349 automated tests, TypeScript, lint with no application errors, an independent UI evaluation and the production build.

## 3.9.0-beta.5 - 2026-07-27

### Press Kit navigation
- Added a direct `/press-kit` item to the dashboard Workspace Controls menu, positioned after Showcase in the Observe group.
- Added Press Kit to the shared public header on desktop and mobile navigation.
- Added a searchable Press Kit action to the Command Palette.
- Added regression coverage confirming the dashboard menu, command search, public header and footer all expose the route.
- Kept the direct URL at `https://policywatcher.online/press-kit` and the browser extension track at 3.8.3 Beta 3.
- Passed 347 tests across 58 files, TypeScript validation and the production build.

## 3.9.0-beta.4 - 2026-07-27

### Public claim language governance
- Audited public pages, in-app explanatory copy, the press kit, the fact sheet, README and press-outreach guidance for promotional absolutes, unscoped security statements, comparisons and narrative phrasing.
- Replaced security and dependency claims with point-in-time audit descriptions and an explicit statement that audit output is not a security certification.
- Replaced generic freshness, explainability and completeness wording with descriptions of configured update intervals, displayed supporting fields, evidence gates and known limitations.
- Described the project as civic tech with a public repository under CC BY 4.0, without implying an OSI license classification.
- Added a regression test for selected prohibited claim phrases on public and distribution surfaces.
- Passed 346 tests across 58 files, TypeScript validation and the production build; lint reported no product errors and one warning in an unrelated untracked temporary file.

### Public copy alignment
- Revised Press Kit, What Changed, Browser Extension, Security, Privacy, Trust, About, Observatory, Timeline, Leaderboard, Showcase, Feature Atlas and homepage language.
- Updated the press fact sheet and outreach guide to distinguish configured inventory from coverage, source review from verification, and unavailable assessments from numerical values.
- Kept technical privacy and publication controls as scoped implementation statements rather than promotional guarantees.
- Kept the browser extension separately versioned at 3.8.3 Beta 3.

## 3.9.0-beta.3 - 2026-07-27

### Editorial briefing room
- Added a bilingual `/press-kit` page with scoped product facts, reporting topics, boilerplates, founder/contact information and a claim ledger that maps listed statements to supporting links and limitations.
- Added a stable `/press-kit/press-kit.json` endpoint, valid JSON-LD, a checksum-backed owned-asset manifest and individual downloads without claiming Content Credentials.
- Integrated the Press Kit into public navigation metadata, Footer, Site Atlas, sitemap, Press Wall, About, release impact and Feature Intelligence Atlas.
- Kept the browser extension separately versioned at 3.8.3 Beta 3 with its package-ready and store-submission-planned boundary unchanged.

### Cross-site public alignment
- Removed the nonexistent `/review-request` route from public navigation and capability metadata, routing evidence inquiries through the existing `What changed?` workflow instead.
- Centralized the bilingual public-analysis disclaimer and reused it across change, share, comparison and PDF report surfaces without a stale release label.
- Centralized the separately versioned browser-extension Beta state, aligned public availability copy and kept it distinct from the web application release.
- Applied the shared public header and footer across compatible editorial, reference and data-driven pages while preserving local navigation, legal dates, historical press dates and evidence-derived timestamps.
- Marked the 5 July platform status report as a historical snapshot, updated Security to current build metadata, exposed leaderboard snapshot generation time and centralized Observatory verification metadata.

### Public guidance and Observatory freshness
- Aligned the Roadmap, Showcase, infographics, bilingual nine-step How To tour, README and native dashboard user guide with canonical share links and coordinated regional/KPI evidence drill-down.
- Added the two delivered `3.9.0-beta.2` capabilities to the release-impact and Feature Atlas datasets with route, dependency, benefit, evidence, KPI, KRI and limitation metadata while keeping one current release marker.
- Replaced generic Observatory placeholders with source-specific European Commission, EDPB, FTC and ICO signals, direct official links and a visible `verified 27 July 2026` freshness boundary.
- Ordered upcoming Observatory review dates before overdue work while retaining `Review due` items and preserving safe ICS generation.

### Coordinated evidence drill-down
- Connected regional matrix selection to the typed dashboard action graph so region and audience context update atomically and produce one canonical browser-history entry.
- Added committed, textual regional evidence inspection with exact risk, impact analysis and available compliance note while preserving the complete accessible table.
- Added KPI-level radar inspection with original assessments, normalized values, explicit missing/tie outcomes and an unambiguous boundary that normalized ordinal values are not compliance or performance measurements.
- Kept both interactions keyboard- and screen-reader-operable, exposed a mobile single-column inspector and verified desktop/mobile behavior without horizontal page overflow.

### Shareable evidence views
- Added a versioned, typed dashboard URL codec for industry, risk, region, audience, time range, search, sort and language while preserving workspace intent/depth and unrelated route parameters.
- Added a visible `Copy view` action and Command Palette command so a configured evidence view can be shared without reconstructing filters.
- Made committed filter changes create browser-history entries, search updates replace the current entry and back/forward restore the matching controls and evidence view.
- Invalid or stale link values now fail closed to public defaults, preserve valid fields and surface a localized normalization notice.
- Added keyboard/screen-reader state to filter disclosures and selector groups, deterministic codec tests and desktop/mobile browser verification.

## 3.9.0-beta.2 - 2026-07-26

### Regional and benchmark visualization governance
- Extended the static `ChartSpec` renderer registry from trend/profile/gauge to the regional risk matrix and company/industry KPI radar without adding a dynamic module resolver or a new runtime dependency.
- Routed both visualizations through the shared accessible frame with bilingual summaries, exact-value tables, evidence source/gate metadata, explicit limitations, non-color encodings and reduced-motion behavior.
- Registered `/api/compare` as an evidence-gated public data source and removed the comparison modal's direct fetch path.

### Data semantics and reliability
- Joined benchmark dimensions by stable KPI key instead of array position and excluded `Not assessed` values from radar geometry and safer/winner counts.
- Replaced the comparison API's duplicate generic weight table with the canonical field-specific KPI catalog.
- Kept missing regional cells explicitly `Not assessed`, deduplicated region/perspective coverage and prevented absent company evidence from appearing as a zero score or low risk.
- Added a localized comparison failure state and corrected loading-state precedence in the comparison modal.

### Audit and release
- Updated the application release metadata, README, in-app changelog, Showcase, architecture report and Hostinger package inventory for `3.9.0-beta.2`.
- Passed 302 tests across 53 files, TypeScript validation, ESLint with zero application errors, production build and package-integrity checks.
- Recorded the point-in-time deployable dependency audit; the separately audited development toolchain retained the documented upstream `brace-expansion` advisory pending a compatible non-breaking ESLint update. Audit output was treated as operational evidence, not a security certification.

## 3.9.0-beta.1 - 2026-07-26

### Native dashboard intelligence
- Added a validated, immutable dashboard grammar with deterministic specification, module, action-graph and layout identities for Citizen, GRC / Legal, Research and Builder workspaces.
- Centralized workspace URL/local-storage codecs and typed filter actions so direct controls and the Command Palette share the same guarded state transitions.
- Introduced an evidence-first data-source registry and a single dashboard view model used by both rendering and export, including canonical query identity, coverage, public-evidence gate and limitation metadata.
- Made CSV export represent the exact filtered UI view and prepend a machine-readable provenance manifest, including when the result contains no policy rows.

### Metrics, trends and visualization
- Consolidated all 15 KPI fields, bilingual labels, allowed values, field-specific concern ordering and `Not assessed` handling in one canonical catalog shared by normalization, audit and matrix APIs.
- Replaced synthetic trend version numbering with the real source snapshot version while retaining a distinct chronological observation sequence.
- Added centralized chart tokens and an allowlisted `ChartSpec` contract with accessible summary, data table, provenance, limitations and reduced-motion handling for the risk trend.
- Added a deterministic multi-breakpoint layout contract with a complete, single-column mobile fallback and Source QA pinned as a required safety module.

### Architecture and verification
- Derived the implementation from a pinned study of Vizro 0.1.59 without installing, embedding or depending on Vizro, Dash, Flask, Plotly or a Python runtime.
- Added architecture decisions, a pattern knowledge base and a functional implementation report for the native dashboard engine.
- Kept the browser extension on its separately versioned 3.8.3 Beta 3 package and labeled the homepage extension strip independently from the application release.
- Updated PostCSS to 8.5.23 to close the detected production path-traversal advisory and scoped the release-blocking audit to deployable dependencies. The remaining brace-expansion advisory is confined to upstream ESLint plugins, has no production path, and remains documented pending a compatible plugin update.
- Added focused regression coverage for dashboard grammar, action graph, action dispatch, layout, workspace codec, data-source registry, view model, export manifest, KPI catalog, trend provenance and chart accessibility wiring.
- Passed 290 tests across 53 files, TypeScript validation, ESLint with zero errors, production build and release diff checks before packaging.

## 3.8.3-beta.4 - 2026-07-23

### Regional retrieval hardening
- Extracted brand sender domains from visible pasted notification text while excluding common personal-email providers and preserving From-header priority.
- Added strict European numeric and ISO effective-date parsing without normalizing impossible calendar dates.
- Classified regional policy variants from ccTLDs, URL locale segments, locale query parameters and hreflang metadata.
- Preserved explicit EU, UK and US link-label evidence without reintroducing the lowercase "contact us" false positive.
- Added bounded locale-aware policy probes and widened per-market review caps while keeping human approval mandatory.
- Updated the Hostinger bridge for the Next.js 16 options API so the application binds to the assigned `PORT` instead of an unreachable random port.
- Left the browser extension, inquiry-to-discovery automation and renderer configuration unchanged.

## 3.8.3-beta.3 - 2026-07-23

### Store typography correction
- Removed every literal em dash character from the application, extension, tests, documentation and tracked marketing copy.
- Replaced the extension title with `PolicyWatcher: What changed? BETA` and the Italian title with `PolicyWatcher: Cosa è cambiato? BETA` across the manifest locale, popup and store documentation.
- Preserved em-dash normalization for pasted notifications through the escaped `\u2014` representation, so input parsing behavior is unchanged without retaining the prohibited character in source.
- Incremented the application to `3.8.3-beta.3` and the browser package to numeric `3.8.3.3` / display `3.8.3 Beta 3`, because Chrome and Edge require a higher package version for a corrected store title.

## 3.8.3-beta.2 - 2026-07-23

### Security and reliability
- Closed the four CodeQL findings from Beta 1 by replacing incomplete sender-label sanitization, grouping the header-rejection regex explicitly and removing misleading template syntax from wiring assertions.
- Updated Next.js from 16.2.9 to 16.2.11 after new high-severity advisories were published on 23 July 2026.
- Added a real API integration test that applies the repository migrations to temporary SQLite, invokes `POST /api/policy-inquiries`, verifies minimized persistence and proves raw-content keys are rejected.
- Added a real Chromium extension smoke test that loads the unpacked Manifest V3 package, verifies its service worker and walks the bilingual disclosure/capture/review UI.

### Beta operations
- Replaced premature “store publication in progress” copy with “Beta package ready · store submission planned”.
- Added a limited-Beta evidence-cycle protocol and stable-promotion gate; automated smoke evidence is not treated as user-pilot evidence.
- Versioned the application as `3.8.3-beta.2` and the browser package as numeric `3.8.3.2` / display `3.8.3 Beta 2` without moving the published Beta 1 tag.

## 3.8.3 - 2026-07-22

### Changed
- Added a compact bilingual homepage Beta release strip with centralized release-channel metadata, Chrome/Edge/Safari pending status and direct extension/paste paths.
- Reframed `/what-changed` as a compact two-path intake: the extension is recommended on desktop, while plain-text paste is the primary mobile action.
- Explained that copied text cannot preserve hidden anchor destinations and that users do not need to reconstruct missing URLs manually.
- Removed brand-specific placeholders and kept organization inference based on general signature and context patterns.
- Added a bilingual `/browser-extension` availability page with install actions for configured HTTPS store URLs and explicit pending states otherwise.

### Privacy and reliability
- Bound extension link selection to the selected or opened notification context when available, avoiding unrelated webmail navigation and footer links.
- Continued to send only one cleaned starting URL and structured clues; opaque redirectors and tokenized destinations now fail closed.
- Preserved temporary `activeTab` access, the service-worker payload allowlist and the prohibition on mailbox APIs, persistent content scripts, telemetry and raw-message transmission.

### Verification
- Added arbitrary-brand, hidden-link, contextual-anchor, redirect-rejection and store-configuration regressions.
- Passed independent desktop/mobile design evaluation after focus, touch-target and mobile hierarchy corrections.
- Completed full tests, extension validation, lint, TypeScript, dependency audit and production build before packaging.

## 3.8.2 - 2026-07-22

- Fixed real-world MioDottore plain-text parsing so `Il Team MioDottore` wins over generic greetings such as `Gentile utente`.
- Added contextual Italian `IA` recognition for AI-supported functionality notices while preserving the preposition false-positive guard.
- Routed `npm start` through the Hostinger `server.js` bridge so the database readiness initializer cannot be skipped by the standard production command.
- Added bounded retry for transient SQLite write contention before an inquiry is reported as unavailable.
- Added regression coverage for generic greetings, no-link signatures, policy-category extraction and Hostinger startup invariants.

## 3.8.1 - 2026-07-22

### Fixed
- Reduced the public notification workflow to paste, local summary and one verification action; company correction appears only when local extraction cannot identify it.
- Corrected realistic BlaBlaCar plain-text parsing so headings such as “Cosa cambia per te” are never mistaken for the organization.
- Removed the contradictory accepted-request label from storage failures. A failed write now says that no request was registered and offers a retry.

### Operations
- Added a visible open-inquiry counter to the administrator navigation and kept `/admin/inquiries` as the canonical queue.
- Added a best-effort administrator email after a new minimized inquiry is successfully persisted. It uses `ADMIN_ALERT_EMAIL` (falling back to `ADMIN_EMAIL` or `SMTP_USER`) and never contains raw notification content or personal email fields.
- Kept dates, policy categories and the optional source URL behind a collapsed correction panel; privacy and explainability remain available in a separate collapsed disclosure.

### Deployment and verification
- Hostinger startup continues to apply the idempotent `PolicyInquiry` migration before the application serves traffic; the release package contains no database or environment secrets.
- Added regression coverage for realistic link-free notices, false company headings, admin notification wiring, queue visibility and mutually exclusive success/failure receipts.
- Completed focused security tests, external mobile UI evaluation, full tests, lint, TypeScript, dependency audit and production build.

## 3.8.0 - 2026-07-22

### Added
- Added the production PolicyWatcher Browser Evidence Companion for Chrome, Edge and Safari Web Extensions with a bilingual compact evidence workflow.
- Added explicit local-inspection consent, structured clue confirmation, portfolio-scope explainability and complete rendering for matched, monitored, queued, ambiguous, conflict, rate-limit, storage and offline outcomes.
- Added store-ready bilingual privacy, listing, permission-justification, Safari packaging, QA and release documentation.

### Privacy and security
- Limited page access to temporary `activeTab` permission after a user gesture; no persistent Gmail, Outlook, inbox, clipboard, cookie or all-sites permission is requested.
- Kept raw notification text inside the injected page scanner and out of extension messages, storage, logs and network payloads.
- Routed the allowlisted structured POST through the Manifest V3 service worker over HTTPS; no remote code, telemetry, advertising, analytics, `eval` or HTML injection is used.

### Verification
- Added automated manifest, payload allowlist, page-scanner, permission-minimization and package-content checks alongside browser fixtures for common email-notice structures.
- Completed external UI evaluation, red-team review, full application tests, lint, TypeScript, dependency audit, production build and clean package extraction checks.

## 3.7.2 - 2026-07-22

### Added
- Added a three-step first-use workspace onboarding flow for objective, evidence depth and a final evidence-module preview with Source QA kept visible.
- Added an explicit browser-local completion marker and a persistent workspace control so users can reopen and revise their configuration at any time.

### Changed
- Simplified the desktop toolbar to a maximum of three intent-aware quick actions while keeping the complete command set available from More.
- Replaced the What Changed text button with an announcement icon immediately before Search, and made the PolicyWatcher version identity open the release changelog.
- Reduced mobile navigation to five focused actions: What Changed, Workspace, AI Chat, Search and More.

### Accessibility and privacy
- Added keyboard and focus behavior for the interactive release identity, reduced-motion handling, responsive labels and mobile safe-area spacing.
- Workspace choices and onboarding completion remain local to the browser; the onboarding does not collect an email address or other user identity.

### Verification
- Added regressions for workspace-action mapping, first-use completion, URL preset behavior and navigation wiring.
- Completed full tests, lint, TypeScript, production build, dependency audit, UI/UX evaluation and extracted Hostinger-package smoke verification.

## 3.7.1 - 2026-07-22

### Fixed
- Replaced link-dependent notification intake with a plain-text-first workflow: copied email text remains useful even when hidden `href` targets are lost.
- Added browser-local confirmation of the organization, sender domain, policy categories and notice/effective dates, with the starting-policy URL shown as a separate optional clue.
- Stopped organization/domain conflicts from silently resolving to the URL owner; users now receive an explicit correction state.
- Replaced the generic failure shown for missing or unavailable inquiry storage with a controlled `503` response and an administrator action.

### Changed
- Treat notification categories as a ranking signal while keeping every public monitored policy for the matched company in the verification scope.
- Split verified evidence into starting-policy and other-policy groups, with monitored-source and policy-type coverage shown in the response.
- Added a guided bilingual workflow explaining the browser privacy boundary, the initial signal, the portfolio-wide search and the human-reviewed queue for unknown companies.

### Safety
- The raw email, message subject, sender/recipient address and copied body never cross the browser boundary; the API rejects unknown/raw-content fields.
- Submitted URLs remain unfetched clues until an administrator approves a source, and immediate answers still require public-evidence-gated records.
- A first baseline remains explicitly distinct from proof of a historical change.

### Verification
- Added regressions for link-free plain text, manual policy-category confirmation, company/URL conflicts, portfolio evidence ordering and storage-unavailable classification.
- Completed external UI/UX evaluation, mobile/accessibility refinements, full tests, lint, TypeScript, production build, dependency audit and extracted Hostinger-artifact smoke verification.

## 3.7.0 - 2026-07-21

### Added
- Added the bilingual public `/what-changed` evidence desk for people arriving from a terms/privacy notification, with verified-change, monitored-without-evidence, queued-review, and ambiguous-company states.
- Added persistent `PolicyInquiry` records and `/admin/inquiries` for human linking, approval, rejection, duplicate handling, public-change resolution, discovery handoff, and append-only review logs.
- Added deterministic browser-local notification parsing, query-free URL minimization, conservative company matching, and dedicated low-volume rate limiting; email addresses, subjects, message bodies, redacted excerpts and raw-content fingerprints never reach persistent storage.

### Safety
- Notification emails remain untrusted clues: only public-evidence-gated policies and changes can produce a verified answer.
- Raw pasted text is discarded, recipient addresses are never inferred as contacts, submitted URLs are not fetched before admin approval, and pasted notification content is never sent to Gemini.
- A first baseline is explicitly described as a starting point, not proof of a historical change.

### Changed
- Connected company creation and persistent policy discovery in one server-side workflow so a browser/network interruption cannot leave a newly created company without an onboarding job.
- Added the targeted first-baseline action directly to Company Manager and keep onboarding active until every approved policy has a verified snapshot, hash, successful check, and publishable status.
- Reworked KPI QA to aggregate source-backed values from each policy's latest public assessment, expose per-cell evidence provenance and coverage, and show unassessed companies as `Pending` instead of a misleading zero score.
- Made scan completion logs use an attention outcome whenever policy errors, partial captures, unavailable sources, or invalid sources occurred.

### Deployment
- Run the idempotent Hostinger schema initializer before both `npm start` and direct `server.js` startup.
- Restored schema parity in the Node and Python CLI-free initializers for policy-discovery jobs and source-onboarding batches/items.
- Added the `PolicyInquiry` migration and matching Node/Python fallback schema plus materialized-migration detection.

### Verification
- Added regression coverage for baseline-completion invariants, cross-policy KPI aggregation, field-specific concern levels, scan completion outcomes, and Hostinger fallback schema parity.
- Closed concurrent public-inquiry duplication with a database-enforced active dedupe key while preserving new inquiries after terminal resolution.
- Production startup now uses only the lockfile-installed Prisma CLI; no mutable registry CLI can be downloaded or executed during startup.
- Materialized-migration reconciliation validates columns, defaults, foreign keys and indexes before marking a fallback-created migration as applied.
- Pinned transitive image processing to `sharp` 0.35.3 / libvips 8.18.3, closing GHSA-f88m-g3jw-g9cj and its inherited libvips vulnerabilities.

## 3.6.5 - 2026-07-21

### Fixed
- Centralized source-onboarding batch summaries so empty, partial, completed, and all-failed batches use one tested status invariant across import and workflow refresh paths.
- Included `Held` in the shared active-workflow stages as defense in depth, while retaining the existing approved-candidate and configured-policy duplicate guards.
- Deferred orientation viewport evaluation until mobile browsers publish their new dimensions, coalesced repeated events, and cancelled pending work during component cleanup.
- Contained animated ticker tracks and horizontal scrollers at their component boundaries so the dashboard no longer creates document-level horizontal scrolling on narrow mobile screens.

### Changed
- Centralized current release metadata for the dashboard, footer, Trust Center, admin surfaces, methodology disclaimer, and encrypted export payload.
- Added a current 3.6.5 stability lane to the public roadmap and retained 3.6.3/3.6.4 as delivered release history.

### Verification
- Added regression coverage for held-stage queries, empty and mixed batch summaries, deferred viewport evaluation, cleanup cancellation, and package-to-UI version consistency.
- No database migration is required; release 3.6.5 changes application logic, presentation containment, and tests only.

## 3.6.4 - 2026-07-21

### Fixed
- Persisted policy-discovery job state in SQLite with atomic run claims, stale-job recovery, and run-token guarded completion so polling remains correct across process restarts and future multi-instance deployments.
- Returned controlled `400` responses for malformed or non-object discovery mutation bodies instead of leaking parser failures as `500` errors.
- Reconciled source-onboarding batch status and `completedAt` inside the QA revalidation failure transaction when evidence returns from `Ready` or `Held` to `QaReview`.
- Reused existing proposed discovery candidates during bulk onboarding and reopened rejected candidates only with an explicit append-only review-log event; approved or already-active candidates remain protected from duplication.
- Removed the continuous landing-page device-motion listener and retained responsive on-the-go suggestions through viewport, pointer, and orientation context.
- Calculated Observatory countdowns from UTC calendar dates so same-day, tomorrow, and multi-day labels do not drift with time-of-day.

### Verification
- Added regression coverage for job persistence and concurrency, request parsing, batch reopening, candidate reconciliation, mobile sensor removal, and UTC countdown boundaries.
- Prisma migration `20260721120000_policy_discovery_job` adds durable discovery job storage without modifying policy evidence or public visibility.
- Dependency audit remains clean at `npm audit --audit-level=high`.

## 3.6.3 - 2026-07-10

### Added
- Objective-based Dashboard Composer as the first-use dashboard entry: it asks for intent and evidence depth, previews a typed stack of registered evidence modules, and persists or deep-links the selected workspace.
- Durable Bulk Source Onboarding at `/admin/source-onboarding`, with controlled CSV/TSV intake and persisted stages for proposed source, official-source review, first baseline, QA gate, and publication decision.
- Revolut source remediation rules for EU/EEA and UK records, splitting the previous duplicated generic URLs into market-specific official sources.
- Public suspension explainability: suspended sources now show a readable reason when automated retrieval is blocked by provider protection, returns insufficient policy text, relies on stale archive evidence, or lacks a verified baseline.
- Press Wall visual previews for tracked public references, including the Giovanna Panucci / Gladiatori Digitali article.
- Public methodology guidance for official-but-blocked sources: VPS rendering improves coverage but does not turn provider anti-bot challenge pages into evidence.
- User guide and methodology alignment for Adaptive Workspace, public exploration surfaces, admin assurance tools, and source-evidence publication behavior.
- Observatory deadline-style watch board for policy/privacy review windows, source signals, standards references, public events, category/region lenses, and downloadable calendar reminders.

### Changed
- The Adaptive Workspace now composes actual dashboard modules instead of describing static profile logic; Source QA stays pinned in every generated stack.
- Approved bulk candidates create controlled inventory and establish a private first baseline before QA, with explicit publish, hold, and reject outcomes recorded separately.
- Visible build strings, package metadata, footer, roadmap, and showcase copy updated to `3.6.3`.
- Source QA wording now points remediation toward market-specific official URLs, official PDF/CDN evidence where available, or traced admin review instead of forced bypass attempts.
- Hostinger-safe source remediation and inventory bootstrap scripts now carry the corrected Revolut source mappings.
- README feature guide now reflects the 6-slide onboarding flow, Site Atlas, Policy Signals Board, Press Wall, Roadmap, Trust/Infographics pages, and the admin assurance console.
- Observatory redesigned from a source registry page into an operational review queue inspired by deadline-board interaction patterns: nearest review first, then source context, jurisdiction, cadence, and next action.

### Safety
- Bulk imports, official-source approval, and first-baseline capture never make evidence public. QA must pass and an administrator must explicitly publish before the public-evidence gate opens.
- Intake rejects malformed/private-host URLs and duplicate policy candidates, while baseline and publication transitions remain auditable and stage constrained.
- Challenge pages, placeholders, too-short bodies, stale archives, and unresolved provider blocks remain suspended from public analysis, KPI values, timeline events, reports, and AI interpretations.
- Dependency lockfile refreshed to patched `brace-expansion`, `js-yaml`, and `protobufjs` releases; the point-in-time `npm audit --audit-level=high` output was recorded for the release candidate without presenting it as a vulnerability-free claim.

## 3.6.1 - 2026-07-08

### Added
- Adaptive Workspace Foundation on the live dashboard: users can select a session intent (`Citizen`, `GRC / Legal`, `Research`, `Builder`) and evidence depth (`Snapshot`, `Operational`, `Forensic`) instead of starting from a fixed dashboard layout.
- Query-parameter presets for the public dashboard (`/?intent=citizen&depth=forensic`) with sanitized enum parsing and localStorage persistence under `pw_workspace_profile`.
- Workspace profile evaluator that changes dashboard density, view mode, accent, module priority, and public module prominence while preserving source-quality safeguards.
- Roadmap preset links that open the dashboard directly with the selected workspace profile.

### Changed
- Package version and visible build strings updated to `3.6.1`.
- Public roadmap copy now describes the Adaptive Workspace as an implemented 3.6.1 track rather than a future UX direction.
- Dashboard setup panel replaced by the goal-oriented Workspace Composer.
- Workspace Composer now follows a compact mobile-first disclosure pattern: the active profile remains visible as a small summary card, the full configurator opens only on demand, and profile changes are applied explicitly before the panel closes.
- Roadmap control typography cleaned up so buttons and control labels use sober UI typography instead of display headline styling.

### Safety
- Source suspension notices, QA/source-quality states, and data limitation signals remain outside the adaptive hiding logic.
- Invalid `intent` or `depth` query parameters are ignored safely and fall back to the public default workspace.

## 3.6.0 - 2026-07-08

### Added
- Public Community Roadmap (`/roadmap`) redesigned as an interactive signal board for product evolution, with objective-based workspace modes, evidence-depth selection, candidate feature radar, release lanes, and GitHub issue links for structured community feedback.
- Public Press Wall (`/press`) collecting external articles, LinkedIn discussions, and community references about PolicyWatcher, with explicit wording that mentions are public references rather than certifications, endorsements, or legal validation.
- Dedicated logo-mark asset (`/logo-mark.png`) for compact public/admin headers, avoiding the previous duplicated wordmark-inside-wordmark presentation.
- Press Wall entry in sitemap, footer resources, showcase footer, roadmap footer, and command palette.
- Community roadmap entry in command palette and footer using current wording instead of the previous `3.5 Roadmap` label.

### Changed
- Package version and visible build strings updated to `3.6.0`.
- Showcase repositioned from a 3.5.1-only Audit Operations overview to a 3.6 public platform showcase covering community roadmap, press wall, trust evidence, Dataset QA, admin tools, retrieval telemetry, and non-certification boundaries.
- Public roadmap release lanes now mark 3.5.1 as delivered Audit Operations work and 3.6.0 as the active Adaptive Community Surface release.
- Header/logo usage refreshed across dashboard, admin, login, showcase, and public pages to use the compact PolicyWatcher mark beside explicit text.
- Public resource navigation expanded through footer/command palette instead of adding more items to the already dense dashboard toolbar.

### Notes
- This release does not introduce a database migration, renderer VPS update, or VPS Operations Agent update.
- Hostinger deployment can use the source package directly; keep production `DATABASE_URL`, `SESSION_HMAC_SECRET`, `API_SECRET`, `RENDERER_URL`, `RENDERER_SECRET`, `VPS_AGENT_URL`, and `VPS_AGENT_SECRET` unchanged unless rotating secrets intentionally.

## 3.5.1 - 2026-07-05

### Added
- Audit Operations layer for the Confidence track.
- `AdminReviewLog` append-only model for human review actions.
- `DatasetQaIssueReview` model for persistent Dataset QA issue decisions.
- Hostinger-safe inventory initializer (`scripts/hostinger-seed-inventory.mjs`) that creates only monitored company/policy source rows as `Configured` + `Seeded`, without demo snapshots, fake changes, AI output, or public evidence.
- Ordered scraper fallback diagnostics on scrape results so failed scans can explain whether direct, HTTP/2, VPS renderer, Wayback, and Common Crawl were attempted, skipped, rejected, or successful.
- Dataset QA issue actions: mark reviewed, ignore with reason, and reopen.
- Review Log admin page with searchable append-only events and CSV export.
- Dataset QA filtered CSV export for auditor handoff.
- Admin VPS Services dashboard for renderer health checks, configuration gates, and admin-only render smoke tests.
- Fragment-scoped legal-hub extraction for official URLs with anchors, allowing broad provider legal pages to be monitored at the intended policy section instead of as oversized mixed documents.
- Hostinger-safe source remediation script (`scripts/hostinger-remediate-sources.mjs`) that updates corrected source URLs with Node/SQLite only, without requiring Prisma, tsx, npm, or npx in SSH.
- Browser-local dashboard personalization controls for density, view mode, visible sections, and visual accent.
- Re-baseline protection for the first verified fetch after `Seeded` ingestion evidence, preventing placeholder-to-real-text transitions from becoming false PolicyChange events or subscriber notifications.
- Persistent `publicEvidence` gates for policy snapshots and changes, preventing seeded or private historical records from becoming public when a parent policy status changes.
- Archive snapshot timestamp persistence on `PolicyCheckLog` for Wayback and Common Crawl retrieval evidence.
- Public Policy Signals Board (`/leaderboard`) plus `/api/leaderboard`, ranking source coverage, retrieval traceability, public baselines, suspension pressure, and publicEvidence-gated movement without certifying companies or compliance.
- Initial Prisma migration (`20260706213500_init`) so new deployments can use `prisma migrate deploy` instead of schema push.
- Admin access log IP minimization and 90-day retention cleanup wired into digest cron routes.
- Source-backed KPI extraction in Gemini analysis output, with closed allowed values for the 15 governance KPI fields used by public and admin matrices.

### Changed
- Public data endpoints now exclude `Seeded` demo records by default. Set `ALLOW_SEEDED_PUBLIC_DATA=true` only for controlled demo/staging views.
- `ALLOW_SEEDED_PUBLIC_DATA=true` is ignored in production; seeded/demo visibility can no longer be opened by production env drift.
- Dataset QA now treats seeded/demo records as release blockers until they are replaced by direct, HTTP/2, VPS-rendered, Wayback, or Common Crawl retrieval evidence.
- Dataset QA and CLI assurance now flag archive evidence without timestamps, `Available` records truncated at the extraction cap, and history retained only for admin inspection.
- Over-cap retrievals now become `Partial` source suspensions instead of complete baselines, snapshots, changes, AI scores, or subscriber notifications.
- Manual and scheduled scans now classify `Seeded` records as `rebaselined` when the first verified fetch succeeds; the seeded history for that policy is replaced by one verified baseline snapshot without AI scoring. `Configured` status alone is not sufficient to trigger destructive re-baseline.
- Re-baseline now aborts if real source evidence, public evidence snapshots, or admin-reviewed change history already exists for the policy.
- Scan execution now supports `limit` and `companySlug` batch controls from both admin cron and bearer cron endpoints to reduce shared-hosting timeout risk during initial dataset regeneration.
- Limited scan batches now select the least-recently checked policies first, so repeated `limit=5` runs advance through the inventory instead of restarting from the same first records.
- Cron Manager now explains targeted scans and exposes quick company slug controls for current remediation work (`zoom`, `microsoft`, `plaid`, `amazon`, `klarna`).
- Live host-drift detection marks redirected cross-host policy fetches as `Needs Review` instead of accepting them as baseline evidence.
- Live path-drift detection rejects same-host policy URLs that redirect back to the homepage.
- The policy extractor now avoids generic `.container`/`div` overlap that could duplicate text before hashing.
- Weekly/monthly digests, sitemap, share pages, policy details, matrix, compare, trends, reports, and company APIs now require public-evidence gates before exposing change-derived data.
- Monthly digest delivery is limited to explicit digest subscribers instead of all active subscribers.
- Admin company and policy deletes now require server-side destructive confirmation payloads in addition to UI confirmation.
- Admin session signing now requires `SESSION_HMAC_SECRET`; it no longer falls back to `API_SECRET`.
- Hostinger packaging now copies only `prisma/schema.prisma` and excludes SQLite/DB files from release archives.
- Prisma runtime and CLI now share `DATABASE_URL`; production SQLite can live outside the extracted app root, and admin/health diagnostics report missing or unwritable DB paths instead of failing as an opaque login issue.
- Added `scripts/hostinger-init-db.sh` and included operational scripts in the Hostinger package so schema initialization, repair, backfill, and Dataset QA can run after deploy.
- Empty production databases now have a documented two-step bootstrap: initialize schema, then initialize source inventory; the first real Cron Manager scan establishes verified baselines in batches rather than publishing seeded/demo records.
- Initial `Seeded` re-baseline scans no longer use the inventory bootstrap timestamp as the archive freshness floor; this prevents valid Wayback/Common Crawl baseline evidence from being rejected simply because the database was initialized after the archive snapshot.
- Company cards with a verified baseline but no source-verified policy change now display baseline/source-verification status instead of the misleading default `Low (1/10)` risk score or "No policy registered yet" copy.
- Cron Manager now exposes per-policy strategy evidence in the live log and last-scan table, including each retrieval strategy outcome, HTTP status where available, rejection/failure reason, and the next fallback selected.
- Cron Manager now renders the full company baseline as selectable scan targets, with state diamonds for selected, verified, review-needed, pending, and no-policy companies instead of a hardcoded remediation shortcut list.
- Cron Manager now links operational targeting to Company Registry for adding new companies and policy sources; new entries remain non-public until a verified scan establishes evidence.
- Added a separate VPS Operations Agent package for renderer health, fixed smoke checks, backups, checksum-verified local package updates, rollback, lock-state handling, and capped operation logs.
- Admin VPS Services now monitors both the renderer and the optional operations agent, with admin-only controls for agent smoke, backup, verified update, rollback and capped logs.
- Admin-created policy records now start as `Configured` + `Seeded` and write a `PolicyCheckLog` entry, preventing newly added sources from being treated as public evidence before first successful retrieval.
- Re-baseline eligibility now checks existing source-evidence logs and public baselines before running, preventing already-verified sources from being misclassified as seeded re-baseline errors during later remediation scans.
- Scraper diagnostics now distinguish `partial` captures from accepted evidence, so over-cap sources such as broad legal hubs are shown as incomplete and suspended rather than as successful trusted baselines.
- Scraper validation now requires more substantive policy text before accepting a page, preventing short placeholder legal pages from becoming public evidence.
- The extraction cap was raised for legitimate long official policies, allowing the current Microsoft Privacy Statement to be stored as complete evidence while still suspending oversized mixed legal hubs.
- Source remediation updated official URLs for Zoom, Microsoft, Plaid, AWS DPA, and Klarna. Plaid now uses anchor-scoped sections, AWS DPA uses focused AWS documentation instead of broad service terms, and Klarna EU Terms remains intentionally suspended when the official page body is too short for evidence-grade publication.
- Source URL remediation now returns changed records to `Configured` or `Needs Review` and writes a `source_url_remediation` check-log entry, so previous evidence is not treated as current evidence for the new URL until a fresh scan succeeds.
- Archive freshness guards now require an existing public baseline before using `lastSuccessfulCheckDate` as the floor, preventing technical bootstrap check dates from blocking first-baseline archive evidence.
- Added admin authentication access logging (`AdminAccessLog`) with event, username, role, IP, user-agent, path, method, and detail fields for operational auditing and login debugging.
- Added `/admin/access-logs` and `/api/admin/access-logs` for administrator-only inspection/export of access events.
- Admin login now returns an explicit configuration error when `SESSION_HMAC_SECRET` is missing instead of creating an invalid session cookie and silently returning to the login page.
- Admin layout now redirects to login only on 401; database/configuration failures are displayed as operational errors rather than masked as password issues.
- Wayback links in admin/database and policy details now open raw Wayback availability searches instead of encoded or future timestamp URLs.
- Roadmap now distinguishes delivered controls, active 3.5.1 work, and later planned capabilities.
- Admin visible version strings updated to `3.5.1`.
- Dataset QA page now defaults to open issues and shows open/reviewed/ignored counts.
- Terms access now opens with an operational context step, then requires explicit acceptance of use boundaries in a second step.
- The prominent dashboard-top Confidence disclaimer banner has been removed from the default working view.
- Scraper URL migration now scopes updates by company and policy name, updates all matching jurisdiction rows, and supports `--dry-run` before touching production data.
- VPS renderer hardening now validates browser-triggered redirects and subresource requests, not just the initial render URL.
- Public documentation and site assets refreshed for the 3.5 Confidence maintenance release: `/trust`, `/security`, `/showcase`, `/roadmap`, How To, About, methodology, README, and third-party validation notes now describe retrieval evidence, renderer boundaries, source-fit QA, and non-certification limits.
- Showcase quality section now lists the current QA control groups without static score-like percentages: source fit, retrieval cascade, public evidence gate, re-baseline guard, drift control, evidence logs and review trail.
- Methodology page and in-app modal now document strategy diagnostics, source suspension, seed-only re-baseline eligibility, public evidence gates, Dataset QA control groups, and renderer limits using evidence-first wording.
- Showcase, Trust, Footer, Command Palette, sitemap, methodology, and README now expose the Policy Signals Board as an evidence-only transparency view.
- Leaderboard dates now render in UTC to avoid server/client timezone drift.
- Renderer bearer-token verification now uses timing-safe comparison.
- VPS Operations Agent requests use HMAC-SHA256 signatures with timestamp and nonce replay protection; mutating operations are serialized with a global lock and never accept arbitrary URLs, shell commands or package download URLs.
- Manual and scheduled scrape error handling now returns/stores correlation references instead of exposing raw exception messages to clients, persistent check logs, progress output, or admin suspension emails.
- New policy changes no longer inherit stale KPI fields from older public changes. Until KPI extraction is explicitly regenerated from current source evidence, the 15 KPI fields are set to `Not assessed`.
- Runtime Prisma configuration now imports only database URL resolution; filesystem diagnostics are isolated in async health/admin diagnostics.
- `/api/seed` no longer runs `prisma db push --accept-data-loss`; the Hostinger initializer now prefers Prisma migrations and baselines the initial migration for existing SQLite databases when needed.
- New source-verified policy changes now persist normalized KPI fields from Gemini instead of forcing all 15 KPI values to `Not assessed`.
- Public KPI matrix now withholds companies that have source-verified baselines but no source-backed KPI assessment yet, avoiding public tables filled with unassessed placeholder values.
- Admin KPI Audit now treats `Not assessed` as a neutral pending state, not as a high-risk or non-compliant value.
- Admin VPS Services now validates `RENDERER_URL` and `VPS_AGENT_URL` as absolute HTTP(S) service URLs and reports invalid configured values clearly.
- Renderer and VPS Operations Agent entrypoint detection now resolves real paths, so versioned `current` symlinks do not prevent services from starting their HTTP listeners.

### Notes
- Current local seed-only databases intentionally fail Dataset QA source-evidence checks until a fresh scan produces non-seeded retrieval logs.
- Codecov external upload still requires repository secret `CODECOV_TOKEN`; the GitHub coverage workflow remains green and produces the coverage artifact without that secret.
- The unauthenticated debug environment endpoint from commit `ec2f699` has been removed from `main` by commit `f453b4a` and is excluded from deployment packages. If commit `ec2f699` was deployed, rotate `ADMIN_PASSWORD`, `SESSION_HMAC_SECRET`, and `API_SECRET`.

## 3.5.0 - 2026-07-02

### Added
- Evidence & Confidence Layer for policy data status, ingestion metadata, last-check timestamps, and check-log evidence.
- `PolicyCheckLog` model and backfill/repair scripts for existing datasets.
- Dataset assurance command (`npm run qa:dataset`) covering hashes, version records, check logs, data statuses, timestamps, URL duplicates, and AI JSON icon hygiene.
- Trust & Quality public page (`/trust`) with GitHub Quality Gate, CodeQL, OpenSSF Scorecard, OpenSSF Best Practices passing badge, targeted reliability coverage workflow status, Sonar/Codecov readiness, live-header report links, and explicit non-certification boundary.
- GitHub Actions workflows for quality gate, CodeQL, OpenSSF Scorecard, targeted Vitest reliability coverage, and SonarQube Cloud readiness.
- Vitest targeted reliability tests and coverage for auth/session, rate limiting, confidence metadata, diff parsing, subscriber preferences, and export/report utilities.
- Open-source governance files: `SECURITY.md`, `CODE_OF_CONDUCT.md`, and third-party validation setup guide.
- OpenSSF Best Practices project `13465` badge integration for README and `/trust`.
- Highlighted badge section on `/trust` and README to make obtained/public quality evidence easier to inspect.
- Public platform status reports in `docs/platform-state-of-art-2026-07-02.md` and `docs/platform-state-of-art-2026-07-02.it.md`.

### Changed
- Package and visible build strings updated to `3.5.0` / `3.5.0 Confidence`.
- How To, About/Overview, Methodology, Showcase, Trust, Terms Gate, share/change pages, PDF disclaimer, footer, SEO metadata, and admin copy updated to use evidence-first, non-certification wording.
- Showcase page repositioned from a 3.0 feature map to a 3.5 Confidence overview.
- Security headers refined, including nonce-based CSP, `default-src 'none'`, strict `object-src`/`base-uri`/`form-action`/`frame-ancestors`, `strict-origin-when-cross-origin`, and removal of obsolete `X-Frame-Options: ALLOWALL` from embed responses.
- Added an npm override forcing `postcss@8.5.16` so the transitive Next.js PostCSS copy is no longer vulnerable to CVE-2026-41305 / GHSA-qx2v-qp2m-jg93.
- Encrypted backup payload version updated to `3.5.0`.

### Known QA Notes
- Dataset QA currently reports one non-blocking warning: Plaid maps several US/EU policy records to the same normalized legal hub URL (`https://plaid.com/legal`). Confirm whether this is intentional or refine source URLs if Plaid exposes more specific anchors/pages.

## 3.0.1 - 2026-07-02

### Added
- Bilingual 3.5 Roadmap page (`/roadmap`) outlining the Intel-inspired development cadence (Feature Drop vs. Confidence Release) and milestones P0-P7.
- Interchangeable Navigation Framework supporting three user-controlled layouts: Bottom HUD Dock, Spotlight Command Bar, and Forensic Left Sidebar.
- Dynamic Layout Selector widget on the bottom-right of the dashboard (persisting user preferences to `localStorage`).
- Custom CSS-only localized hover tooltips on all header actions.
- Responsive mobile bottom tabs for Bottom HUD layout, and left drawer slide-out for Left Sidebar layout.

### Changed
- Refactored `src/app/page.tsx` to conditionally render logo headers and integrate the new `Navigation` component.
- Updated Global Footer build string to `v3.0.1`.
- Package version updated to `3.0.1`.

## 3.0.0 - 2026-06-26

### Added
- Public policy-change timeline.
- Stable public change permalinks at `/change/[id]`.
- Embeddable change widgets at `/embed/change/[id]`.
- Dynamic Open Graph image route for social previews.
- Dynamic sitemap route.
- DiffViewer components for richer policy-change inspection.
- Admin encrypted backup export and verification tools.
- Admin decrypt-backup and export-encrypted API routes.
- Admin Dataset QA dashboard and API for source-fit, dataset integrity, freshness, KPI coverage, regional-impact coverage, and subscriber hygiene checks.
- Admin Dataset QA Status panels in the admin dashboard and Dataset QA page.

### Security
- Removed the default API secret fallback from the cron trigger script.
- Added timing-safe bearer token comparison.
- Hardened policy retrieval against DNS rebinding and malicious redirect drift with socket-pinned HTTP/1.1/HTTP/2 fetches, Public Suffix List based host-coherence checks, conservative IPv6 special-range blocking, and sanitized renderer errors.
- Tightened HTTP/2 fallback cleanup so timeout/error paths close and destroy the H2 session, and replaced raw H2 exception diagnostics with fixed error tokens.
- Added optional `SESSION_HMAC_SECRET` separation for admin session cookies.
- Made proxy-header trust explicit for rate limiting.
- Rendered Live Assistant AI responses through safe markdown rendering instead of raw HTML injection.
- Stopped returning subscriber records and unsubscribe tokens from the public subscription API.
- Added subscription preference allowlists and unsubscribe rate limiting.
- Escaped dynamic email-template values and restored weekly digest unsubscribe tokens.
- Added SSRF-oriented outbound URL validation for scraper fetches and redirects.
- Replaced query-string authentication on health/seed diagnostics with bearer auth.
- Kept the database seed endpoint disabled in production and behind an explicit development flag.
- Raised encrypted-backup password minimum length to 12 characters.
- Changed backup verification to return only backup metadata and summary counts.
- Escaped JSON-LD script data on public change pages.
- Disabled the Next.js `X-Powered-By` response header.

### Changed
- Package version updated to `3.0.0`.
- Backup payload version updated to `3.0.0`.
- Set an explicit Turbopack project root to avoid workspace-root ambiguity on hosts with multiple lockfiles.
- Replaced the admin jurisdiction map dependency on `react-simple-maps` with direct `d3-geo`/TopoJSON rendering to support clean React 19 installs on Hostinger.
- Moved map TypeScript declarations required by `next build` into production dependencies for hosts that build with dev dependencies omitted.
- Added a public header entrypoint for `/timeline` and a home-page Market Pulse timeline fed by real `/api/changes` data.
- Aligned the How To onboarding modal with the public light theme.
- Activated the regional heatmap in policy details using real regional-impact rows.
- Added an industry-average benchmark option to the Compare radar chart.
- Added Dataset QA source-fit checks for jurisdiction/localization mismatches in monitored policy URLs.
- Documented the source-selection hierarchy in Methodology and README: canonical Global English sources first, market-specific sources for EU/US analysis, localized pages flagged unless explicitly justified.
- Updated PayPal EU/US privacy and user-agreement sources to canonical English LegalHub URLs in the bundled dataset.
- Cleaned project-wide ESLint errors and warnings ahead of the 3.0 commit.
- README updated with release 3.0 highlights.
- In-app changelog updated to list release 3.0 as the current release.

### Deployment Notes
- Rotate production `API_SECRET` before deploying this release.
- Set `NODE_ENV=production`.
- Keep `/api/seed` disabled in production. Use `ALLOW_DATABASE_SEED_ENDPOINT=true` only for controlled local or staging setup.
- If Hostinger overwrites forwarding headers, set `TRUST_PROXY_HEADERS=true`; otherwise leave it unset and prefer a provider-controlled client-IP header via `TRUSTED_CLIENT_IP_HEADER`.
- Verify security headers and CSP after deployment because the hosting proxy may override application headers.
