# PolicyWatcher Source Integrity Remediation - 17 August 2026

## Outcome

The initial scan report showed no retrieval-wide system failure. Production verification subsequently found two bounded engine defects: mixed SQLite `DATETIME` storage prevented valid PayPal candidates from seeing the immediately preceding scan, and the source-migration path allowed an archive without a freshness floor. The Wise US candidate originated from a catalog index page, TikTok used a retired route, and Klarna’s public overview pages were unsuitable as acquisition documents.

## Catalog decisions

| Provider | Record | Public citation | Acquisition endpoint | Decision |
| --- | --- | --- | --- | --- |
| Wise | Privacy Policy · US | `https://wise.com/us/legal/privacy-notice` | public citation | Replace the index page with the actual US notice. |
| Wise | Privacy Policy · EU/Global | `https://wise.com/gb/legal/privacy-notice-personal-en` | public citation | Replace legacy index or retired EU routes with the current personal notice. |
| TikTok | Community Guidelines · Global | `https://www.tiktok.com/community-guidelines` | public citation via renderer when needed | Replace the retired `/legal/page/global/` route. |
| Klarna | Privacy · EU | `https://www.klarna.com/ie/privacy/` | `https://cdn.klarna.com/1.0/shared/content/legal/terms/en-ie/privacy` | Keep the public overview as citation and retrieve the linked legal notice. |
| Klarna | Privacy · US | `https://www.klarna.com/us/privacy/` | `https://cdn.klarna.com/1.0/shared/content/legal/terms/en-us/privacy` | Keep the public overview as citation and retrieve the linked legal notice. |
| Klarna | Terms · EU | `https://www.klarna.com/ie/terms-and-conditions/` | `https://cdn.klarna.com/1.0/shared/content/legal/terms/en-ie/user` | Keep the public overview as citation and retrieve the linked legal terms. |
| Klarna | Terms · US | `https://www.klarna.com/us/terms-of-use/` | `https://cdn.klarna.com/1.0/shared/content/legal/terms/en-us/user` | Keep the public overview as citation and retrieve the linked legal terms. |

Amazon EU remains an operational source review because the fetcher is blocked; no unverified date or substitute URL is promoted. Revolut remains subject to provider access controls; PolicyWatcher does not bypass challenges.

## Engine changes

- HTTP 202 responses are retried and classified as pending/challenge responses, never evidence.
- Long soft-404 templates and same-host redirects to error routes are rejected.
- Common Crawl exact-match 404/no-result responses are `not_in_archive`, not `unknown` or a missing live policy.
- Renderer dependency degradation is reported only for renderer-service failures, not an unusable response returned by the target page.
- A failure after an issue was resolved reopens it for investigation.
- Every archive fallback now receives a freshness floor. A pending source migration uses its request timestamp, so an older archive can be retained only as historical evidence and cannot become the replacement baseline.
- Hostinger raw-SQL utilities now write Prisma-compatible epoch-millisecond dates. A bounded normalizer repairs legacy text dates so consecutive change confirmation remains chronological.
- The materialized-migration detector accepts the legacy conservative `Configured` default and can resolve the initial Prisma ledger entry without recreating tables.
- The Gemini provider schema now enforces structural JSON only; the existing local validator still enforces every enum, array count, score bound and region/perspective combination. This removes the provider's combinatorial `too many states` rejection without weakening the persistence gate.

The post-fix verification scan also exposed an older local Wise EU route (`/eu/legal/privacy-policy`) returning 404. The migration batch now repairs that legacy route and the previous GB index route before establishing a verified personal-notice baseline.

## Evidence boundary

Changing an acquisition key sets `sourceMigrationPending`. The first verified capture at the new endpoint becomes the comparison baseline and clears the flag. It cannot create a `PolicyChange`, AI analysis, alert or subscriber notification. Ordinary monitoring resumes from that baseline.

## Deployment verification

1. Back up the production SQLite database.
2. Apply migration `20260817090000_source_integrity_control`.
3. Run the Hostinger remediation script in dry-run mode, review the target rows, then apply it.
4. Run a verification scan from Cron Manager.
5. Confirm that Wise US and TikTok are no longer tied to the retired/index routes, Klarna uses the official legal endpoints, PayPal completes normal two-scan confirmation, and the pending migration queue clears only after verified captures.

Production follow-up on 18 August quarantined the TikTok replacement snapshot that had been sourced from a 2023 Wayback capture, restored the preceding public baseline, and returned the canonical source to `sourceMigrationPending`. No provider change event or subscriber notification was created by that rollback.

## Local verification run

The corrected local inventory was scanned on 17 August 2026:

- Klarna: 4/4 records acquired directly, 4 verified seeded baselines established, 0 unavailable and 0 errors.
- Wise: after also repairing the legacy EU and GB-index routes, 4/4 records were available through 3 network acquisitions; the shared EU/Global personal notice was deduplicated once, 2 replacement/seeded baselines were established, and there were 0 unavailable, invalid or error outcomes.
- PayPal: 4/4 records acquired directly and established local verified baselines with 0 unavailable and 0 errors. Because this database contained seeded rather than production candidate state, this run does not claim that the production two-scan PayPal confirmation has completed.
- TikTok: the Privacy Policy passed directly. Community Guidelines remained unavailable in this local environment because the canonical page requires JavaScript rendering and `RENDERER_URL` is not configured; the direct response was too short, HTTP/2 returned 302, Wayback failed, and Common Crawl reported `not_in_archive`. Production verification still requires the configured VPS renderer.

The first local pass emitted the configured QA suspension notifications for the retired Wise EU route and for TikTok’s missing local renderer. The Wise condition was then corrected and the second targeted scan completed without unavailable or invalid outcomes.
