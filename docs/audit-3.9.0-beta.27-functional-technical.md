# PolicyWatcher 3.9.0-beta.27: Functional and Technical Audit

Date: 2026-08-01. Branch: `codex/press-kit-navigation-3.9.0-beta.5`. Version: `3.9.0-beta.27`.
Method: measured quality gate (tests, tsc, lint) plus three parallel read-only
audits (scanning engine, feature surface, governance and security), cross-checked
against source. References are `file:line`.

## Overall verdict

The platform is broad and, in its security spine, genuinely strong: SSRF and DNS
pinning, a correct archive freshness guard, admin sessions with a mandatory
separate signing secret, an enterprise API gated on every query, webhook secrets
kept out of the database, double-confirmed destructive routes, and an email
intake that discards raw content. The main problems are not architectural: they
are a red CI gate, a small number of long-standing engine defects that survived
into this release, one metadata-exposure gate tension, and feature sprawl that a
beta should consider trimming. None is a content breach. Priority is to make the
release green and to close the four engine defects that undermine trust in the
numbers the scanner reports.

## Quality gate (measured on this branch)

- Tests: 606 pass, 1 fail (607 total, 111 files).
- The failure is `src/lib/__tests__/release.test.ts` "keeps literal em dash
  characters out of tracked source": two admin files use a literal em dash character as a UI
  placeholder, violating the project's own guard:
  `src/app/admin/LiveStatusCards.tsx:170` and
  `src/app/admin/PublicationReadinessFunnel.tsx:32`.
- TypeScript `tsc --noEmit`: clean.
- ESLint on `src`: clean.

Consequence: the release branch is red. This blocks a clean promotion and must be
fixed first (replace the two em dashes with a hyphen or "n/d").

## Functional audit

### Surface map
- Public pages: home dashboard, timeline, leaderboard, observatory, atlas,
  feature-atlas, showcase, infographics, trust, security, methodology/confidence,
  roadmap, press, press-kit (hub plus data, glossary, reference, corrections,
  releases, releases/[slug]), knowledge (plus companies/[slug] and policy pages),
  developers (plus event-continuity and webhook-readiness), integrations,
  evidence (plus [changeId]), collections, pulse (plus [slug]), what-changed,
  change/[id], share/[id], embed (change and pulse), browser-extension, about,
  terms, privacy, unsubscribe. Machine surfaces: robots, sitemap, llms.txt,
  schemas/[schema]/v1.
- Admin: single-operator console at `admin/page.tsx` with three in-page panels
  (operational action center, publication readiness funnel, dashboard telemetry)
  over sub-pages: companies, database, cron, dataset-quality, explainability,
  inquiries, kpi-audit, review-log, access-logs, source-onboarding,
  source-reliability, vps-services, webhook-delivery, outreach.
- APIs: public v1 (unauthenticated) and enterprise v2 (Entra JWT). Public REST
  for changes, companies, trends, matrix, compare, leaderboard, chat,
  source-continuity, source-suspensions, press, pulse, evidence-packet, reports,
  OG images, health.

### Main user journeys
Citizen/analyst (dashboard to change to evidence packet or share), compliance
(knowledge or collections to governance-mapped packet export), developer
(v1 public or v2 authenticated API, optional webhook pilot), press (pulse and
press-kit to OG cards to coverage registry), operator (action center to source
onboarding/reliability, scans, inquiry review, telemetry).

### Functional findings
- F1. Two API generations coexist with no deprecation marker on v1
  (`src/app/api/v1/manifest/route.ts` vs `api/v2/manifest`), both exposing
  manifest/observatory/changes. Ambiguous guidance for integrators.
- F2. Two overlapping "evidence bundle" concepts: packet (single change) vs
  collection (up to 12 changes), each with its own page, API and schema. Easy to
  confuse.
- F3. Marketing/meta page sprawl: atlas, feature-atlas, showcase, infographics
  plus trust/security/methodology are several self-referential "explore the
  product" surfaces with overlapping intent.
- F4. Webhook stack is large but explicitly a non-public pilot (no registration,
  no SLA), yet ships 6+ surfaces. Heavy for a beta.
- F5. Stale content: `src/lib/editorialCampaigns.ts` hardcodes `beta13-*`
  campaign ids while the app is beta.27.
- F6. SEO/consistency: `security/page.tsx` and `timeline/page.tsx` export no
  `metadata` (timeline is a client component and structurally cannot).
- F7. "not-enabled" placeholder states are first-class across telemetry and live
  status, so several operator features ship inert pending deployment config.

## Technical audit: scanning and monitoring engine

Strengths to preserve: 5-strategy cascade with SSRF/DNS pinning and per-hop
redirect re-validation (`scraper.ts:538-592`), a correct freshness guard
(`scraper.ts:373-378`), host/path-drift rejection instead of churn, retrieval
dedup with per-host pacing and full-text diff in the scan
(`check-all/route.ts:435-527,947-948`), batched per-scan admin suspension digest
(`check-all/route.ts:1127-1133`), and demo-AI fallback off by default with strict
output validation and evidence re-anchoring (`gemini.ts:195-204,379-415`).

Ranked engine findings:
- E1 (High). `changed++` double-counts on a later throw. It runs at
  `check-all/route.ts:932`, before `analyzePolicyChange` (`:937`) and the
  transaction (`:951`); the catch at `:1059` does `errors++` and never
  decrements, so `changed + errors` can exceed `checked` and the "changed"
  headline is inflated. This is the same bug seen in 3.8; still present.
- E2 (High). Changed-path errors persist only a `scan_` reference. The check log
  stores `reason: processing_error:scan_xxxx` (`check-all/route.ts:1078-1089`);
  the real message goes only to `console.error` (`:1061-1062`). Root cause is not
  queryable from the database.
- E3 (High). Weak content-authenticity gate. `isPolicyContent` needs only 3 of 20
  bare substring markers (`scraper.ts:149-155,1476-1479`); markers like `data`,
  `service`, `user`, `information` match almost any corporate page. Combined with
  a soft-404 detector that only fires under 1500 chars (`scraper.ts:1228`) and a
  path-drift check that only flags collapse to `/` (`scraper.ts:415`), a wrong
  long page after a redirect can become a monitored baseline.
- E4 (High, coverage). No automatic source escalation after K consecutive
  unavailable scans. Chronic failures only flip a remediation issue to `Open` at
  `>= 3` (`check-all/route.ts:250-289`); the dead source is re-scraped every scan
  with no cadence change, no discovery trigger, and no notification escalation.
- E5 (Medium-High). False-change churn. On borderline length the validator falls
  back to a different extractor (`visibleText`) than the normal one
  (`scraper.ts:1425-1446`), so a page near the 800-char threshold can flip
  extractors across scans and change its hash. There is no stripping of volatile
  content (last-updated dates, nonces, session ids) before hashing, so dynamic
  text triggers a false "changed" event and a Gemini spend.
- E6 (Medium). The AI sees only the first 22k characters of each side on a diff
  (`gemini.ts:222,225`) while the persisted diff is full-text. A change beyond
  ~22k chars produces a snapshot, diff and alert whose AI summary and risk can be
  based on unchanged leading text.
- E7 (Medium). Narrow HTTP/2 gating (only on 400/403/short, `scraper.ts:1754`)
  and a hard renderer dependency (`scraper.ts:1833`) push timeouts, 5xx and
  unconfigured-renderer cases straight to freshness-gated archives, increasing
  `unavailable`.
- E8 (Medium). Subscriber notifications are INSTANT-only and require region AND
  industry to match (`check-all/route.ts:1141,1154-1158`); a subscriber who set a
  region but no industry receives nothing.
- E9 (Info). The archive "stale-but-labeled as Partial" option discussed earlier
  was not adopted. All-live-fail returns plain `unavailable` with a dated but
  non-eligible `historicalSourceReference` (`scraper.ts:2044-2060`,
  `check-all/route.ts:292-324`). This is a deliberate, defensible choice; coverage
  of hard-blocked sources (Revolut, Amazon help URL) therefore stays at zero.
- Discovery engine is strong (structure-first jurisdiction/locale classification,
  hreflang before footer, archive candidates penalized and human-confirmed,
  race-safe job claiming). Minor: silent `slice` caps on links, fixed 6-market
  locale probing, and heavy per-candidate verification cost.

## Technical audit: data model, governance, security

23 models. Personal-data models: `Subscriber` (email/name), `AdminAccessLog`
(username, IP, user-agent), `PolicyInquiry` (reporter domain). No model stores
passwords, API keys or webhook secrets; those live in env only. Bearer tokens
(`runToken`, `publicToken`, `unsubscribeToken`) are plaintext but low-sensitivity.

Public data gate: in production seeded content is always excluded and public
reads require non-seeded ingestion, `dataStatus in [Available, Reviewed]` and a
`publicEvidence` snapshot. Every content surface is gated, including v1 pulse
feed, evidence packets/collections, knowledge/llms.txt, and the Entra-gated v2
API. No surface leaks seeded policy content.

Ranked security and governance findings:
- S1 (Medium). Seeded/suspended source identity is publicly enumerable.
  `suspendedPolicyWhere()` matches `ingestionMethod:'Seeded'`
  (`publicDataGate.ts:53-64`) and is used by `/api/source-continuity`,
  `/api/source-suspensions` and `/api/v2/sources/[id]/continuity`. With seeded
  demo rows in a production DB, an unauthenticated GET returns each seeded
  source's company name/slug/industry, policy name/type/jurisdiction, host, and a
  status timeline, while `publicSuspensionMessage` claims the data is not exposed.
  Metadata exposure, not content. Decide whether seeded rows belong in these
  ledgers at all, or exclude `Seeded` from these two public surfaces.
- S2 (Medium). `/api/press-metrics` POST is unauthenticated and writes a
  `pressMetricEvent` row per call (rate limit 60/min/IP, no honeypot,
  `press-metrics/route.ts:16-52`). Anyone can inflate the public "coverage"
  metrics and grow the table. Add a honeypot plus a signed or origin-checked
  ingest.
- S3 (Low). Enterprise API v2 has no per-tenant rate limiting
  (`enterpriseApi.ts:84`; v2 routes do not call `rateLimit`), unlike v1. A valid
  tenant token can drive unbounded queries.
- S4 (Low). Unsubscribe token compared with plain `!==`
  (`subscribers/route.ts:236`) rather than `timingSafeEqual`; minor timing
  side-channel; email-lookup enables existence probing.
- S5 (Low/Info). Admin session tokens are non-revocable for their 24h TTL (no
  server-side session store, `adminAuth.ts:109-143`); rotating the signing secret
  is the only mass-revocation lever.
- S6 (Info). No visible retention/TTL for operator PII (`AdminAccessLog`
  username/IP/UA) or for encrypted backups that contain full subscriber emails.
  Confirm a GDPR retention limit.

Positive governance findings to preserve: SESSION_HMAC_SECRET is mandatory and
does not fall back to API_SECRET (fail-closed); role checks correctly restrict all
mutation and delete routes to admin; enterprise JWT verification is complete
(alg/kid/tenant/iss/aud/exp/nbf/signature/scope); destructive routes require
confirmName plus confirmToken; the readiness report strips the DB URL; there is no
env-dump endpoint; compliance wording is bounded ("not legal interpretations,
conformity assessments, certifications or compliance verdicts").

## Prioritized recommendations

1. Make CI green: replace the two em dashes (`LiveStatusCards.tsx:170`,
   `PublicationReadinessFunnel.tsx:32`). Trivial, unblocks release.
2. Fix the scan metric and diagnosability defects: move `changed++` after the
   successful commit (E1), and persist the real error text (truncated, sanitized)
   into `PolicyCheckLog.reason` alongside the reference (E2).
3. Strengthen content authenticity (E3): raise the marker threshold or require a
   type-specific title plus legal-structure evidence (reuse `policyEvidenceScore`
   from discovery), and broaden path-drift and soft-404 detection.
4. Reduce false-change churn (E5): use one extractor for hashing, and strip
   volatile content (dates, nonces) before hashing; optionally add a similarity
   threshold before declaring a change and spending Gemini.
5. Add automatic source escalation (E4): after K consecutive unavailable scans,
   change cadence, trigger a re-discovery proposal, and raise one operator
   escalation, rather than re-scraping a dead source forever.
6. Close the gate tension (S1) and harden the public beacon (S2).
7. Analyze full text on diffs or chunk long documents (E6); add v2 rate limiting
   (S3); constant-time unsubscribe compare (S4); define PII retention (S6).
8. Product hygiene: mark v1 deprecated or document the split (F1), reconcile
   packet vs collection (F2), refresh stale campaign ids (F5), and decide which
   meta/marketing surfaces to keep (F3).

Nothing here is a content breach or a data-exfiltration path. The release is one
trivial fix away from green; the engine defects are small, localized, and high
value for the trustworthiness of the scanner's own reporting.
