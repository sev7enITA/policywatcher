# PolicyWatcher Civico - UI/UX and functional audit

Date: 18 August 2026  
Scope: `/associazioni`, global civic directory, evidence radar, suggestion path and communication readiness.

## Outcome

The highest-impact pre-launch friction has been addressed in code:

1. **Directory views were not portable.** Country, protection-type and search filters now produce a canonical query string and the result bar includes **Copy view**. A recipient can reopen the same civic slice.
2. **Search vocabulary was implementation-led.** Queries now match Italian and English protection labels, source names and localized country names in addition to organization names and internal type codes.
3. **Launch statistics could drift.** Organization, country, digital-specialist and unique-source counts are now derived from the catalog and reused by the hero and directory.
4. **Contribution was easy to miss.** A visible jump link now leads directly to the bounded suggestion form, which still requires an official HTTPS website and an independent HTTPS source.
5. **Metric wording was ambiguous.** “Fonti di verifica” is now “fonti uniche”, distinguishing unique URLs from the number of source-backed organization records.

## Journey reviewed

`Global context → country/area directory → organization/source inspection → evidence radar → local review state → Markdown digest`

The flow maintains the existing design system and safety boundary. Inclusion does not imply partnership or endorsement; review state remains browser-local; digest creation does not publish anything.

## Verification evidence

- Source and interaction contract review of `AssociationsClient`, `CivicDirectory`, civic catalog helpers and responsive CSS.
- Focused tests: 16/16 passing across Civic directory, UI wiring and evidence-radar behavior.
- Focused ESLint: passing.
- Local HTTP route check: `/associazioni` returned `200` and rendered the new suggestion CTA.

## Visual-audit boundary

The in-app browser was not connected during this run, so no new desktop/mobile screenshots were available for a defensible visual comparison. The audit therefore does **not** claim screenshot-verified spacing, contrast, sticky-navigation or mobile behavior. Those checks remain pending rather than being inferred from source code.

## Next improvements, prioritized

### P1 - moderated contribution queue

Replace the mail-client dependency with an accessible first-party submission endpoint, spam protection, consent text, review status and an auditable moderation queue. Keep email as a fallback.

### P1 - directory detail and change history

Add an organization detail route with source history, last review, scope, protection taxonomy and a correction link. This would let search results stay concise while making verification more inspectable.

### P2 - visual state and orientation

After screenshot QA, add an active state to the sticky section navigation and confirm that stacked filters, result actions and card footers retain adequate touch targets at 390 px.

### P2 - editorial handoff presets

Offer named, shareable presets such as “Italy · digital rights” or “France · financial services”, without inferring legal coverage or ranking organizations.

### P3 - contribution telemetry

Measure only privacy-minimized events: directory slice opened, source link opened, view copied, suggestion started/completed and digest exported. Do not collect complaint content or association-member identities.
