# Citizen experience: implementation and boundaries

This feature is developed on top of the beta.5 document-scope branch. Source code and local validation do not imply deployment, an Android store release, push delivery or a verified effect in a user's account.

## User journey

`/per-te` is available in Italian and English (`?lang=en`). Its six stages are service selection, relevant published changes, official action guides, personal choices, local notice matching and a support draft. The existing Android companion uses the same public contract and platform-neutral logic.

- People voluntarily follow services from the public catalog. Optional country and plan describe their own context. Country does not silently exclude uncertain jurisdictions; plan-specific applicability is not present in the source dataset and remains unconfirmed.
- Changes are filtered on the device. Automatic summaries and anchored before/after passages retain their provenance and interpretation limits. Publication, detection and source acquisition are distinct dates. No changes in a loaded window is not an all-clear.
- Six initial editorial guides link to official OpenAI, Google, Apple, TikTok, Anthropic and Microsoft instructions. Every guide states scope, source review date and limitations. Reviews become due after 90 days. Reading an official guide does not establish that an account workflow was tested or that every step applies to the reader.
- A choice records what the person reports reading or doing. A later publication for the same policy reopens review, including a historical detection published later. Offline, stale, missing or withdrawn evidence yields an unknown status. A remembered choice never establishes an effect on the external service.
- Pasted notices are matched against already downloaded public service names/domains. No raw paste is submitted, logged, stored, put in a URL, added to an export or automatically opened. Matches are clues, not sender authentication or a verification of the message. Unmatched notices remain unmatched; no invented explanation or remote AI processing fills the gap.
- Support drafts can start from a public change or an existing choice. Plain-text exports include source links, dates, interpretation boundaries and an optional explicit question. They do not invent a choice. The user reviews and shares them; PolicyWatcher does not send them to associations. Directory listings do not imply partnerships.
- Speech is opt-in with a stop control. Voice availability depends on the device/browser. A bookmarked mobile web page is supported; no installable-web-app or background push capability is claimed by this change.

## Public API

`GET /api/v1/citizen-feed` accepts only an optional opaque `cursor`. It never accepts country, plan, selected services, personal choices or pasted text. `OPTIONS` describes public GET access. Responses are `no-store`; the route limits requests to 30 per minute without application-level client-IP logging.

The v1 contract in `shared/citizen.ts` contains a bounded service/policy catalog and a descending 25-record publication-history page. `history.hasMore` and `history.nextCursor` explicitly describe continuation. Equal publication times use the change ID as a stable secondary order. Catalog limits are 1000 policies and 500 services; omitted or unsafe records set `catalogTruncated` rather than implying complete coverage. The clients validate cached and network payloads before use.

Policy gating requires non-seeded available/reviewed data, at least one public snapshot and no pending source migration. A change additionally requires a public record, a publication timestamp no later than the response time, and its specific new snapshot to be public. Text comparison runs on the server; only bounded grounded excerpts leave that process. Raw snapshots, diffs, internal logs and credentials are absent from the response.

Acquisition freshness requires evidence from the latest successful check log: an accepted status, an actual source and a text hash or positive text length. Defaults in the policy table and status labels alone do not qualify. Failed/unknown/cache-only latest checks remain unavailable. Archive-backed acquisitions use the archive timestamp; absent archive dates do not become fresh merely because the archive was queried today. The recent/dated boundary is seven elapsed days and never proves current scanner health.

Refreshing replaces the loaded history and catalog. Paging preserves earlier downloaded public history while filtering out services/policies no longer present. A withdrawal of an individual historical record under a still-public policy may only be reflected on a full refresh; neither client claims continuous revocation monitoring. Public detail/evidence endpoints independently apply their current evidence gates.

## Local data

Browser citizen preferences use `policywatcher:citizen:v1`. The validated state contains country, up to 200 followed services, 200 choices and 100 saved change IDs. Unknown payload fields are discarded. Corrupted data is preserved for explicit recovery or reset instead of overwritten silently. Failed storage writes leave a session-only state with a visible warning. Web country selection deliberately integrates with the existing locally stored global context. The export includes the voluntary plan and choice metadata, with an explicit user-facing explanation.

The mobile companion retains its established local storage boundary and migrates existing watchlists/collections. There is no cross-device synchronization. Online and cached views are distinct; a network failure must not erase selections or turn cached evidence into a live assurance. Automatic demo fallback is removed from the operational experience.

## Validation and release

Core tests cover public gates, pagination boundaries, invalid input, source age, archive dates, local-state corruption, reopened choices, withdrawn evidence, deceptive notice domains, UTF-8 input limits, export boundaries and official-guide review age. Browser testing uses an isolated local fixture, never the user's existing database. The fixture marks its summaries as local test data.

The developer checkout at `/Users/fabriziodegni/Desktop/PolicyWatcher` contained prior uncommitted work. This change is isolated in a separate checkout and does not alter that work. No new database schema or automatic scanner run is required for this citizen layer.

Before a public release, apply the normal project staging/promotion process, verify source acquisition in that environment and perform device-level accessibility/audio/sharing checks. Native compilation or a web export alone does not verify an installed Android application or store distribution.
