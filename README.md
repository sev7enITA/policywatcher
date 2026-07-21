<p align="center">
  <img src="public/logo.png" alt="PolicyWatcher Logo" width="80" />
</p>

<h1 align="center">PolicyWatcher</h1>

<p align="center">
  <strong>AI-powered policy change intelligence platform for Big Tech and FinTech corporate policies.</strong>
</p>

<p align="center">
  <a href="https://creativecommons.org/licenses/by/4.0/"><img src="https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg" alt="License: CC BY 4.0" /></a>
  <a href="https://www.policywatcher.online"><img src="https://img.shields.io/badge/Live%20Demo-policywatcher.online-6366f1" alt="Live Demo" /></a>
  <a href="https://github.com/sev7enITA/policywatcher/actions/workflows/quality.yml"><img src="https://github.com/sev7enITA/policywatcher/actions/workflows/quality.yml/badge.svg?branch=main" alt="Quality Gate" /></a>
  <a href="https://github.com/sev7enITA/policywatcher/actions/workflows/codeql.yml"><img src="https://github.com/sev7enITA/policywatcher/actions/workflows/codeql.yml/badge.svg?branch=main" alt="CodeQL" /></a>
  <a href="https://github.com/sev7enITA/policywatcher/actions/workflows/coverage.yml"><img src="https://github.com/sev7enITA/policywatcher/actions/workflows/coverage.yml/badge.svg?branch=main" alt="Targeted Reliability Coverage" /></a>
  <a href="https://scorecard.dev/viewer/?uri=github.com/sev7enITA/policywatcher"><img src="https://api.scorecard.dev/projects/github.com/sev7enITA/policywatcher/badge" alt="OpenSSF Scorecard" /></a>
  <a href="https://www.bestpractices.dev/projects/13465"><img src="https://www.bestpractices.dev/projects/13465/badge" alt="OpenSSF Best Practices" /></a>
  <img src="https://img.shields.io/badge/Next.js-16.2.9-black" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61dafb" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Gemini-2.5%20Flash-4285f4" alt="Gemini 2.5 Flash" />
  <img src="https://img.shields.io/badge/Release-3.6.5%20Stability-146c6a" alt="3.6.5 Stability Release" />
</p>

<p align="center">
  <strong>Highlighted public evidence:</strong>
  OpenSSF Best Practices project <a href="https://www.bestpractices.dev/projects/13465">13465</a> is passing.
  GitHub Quality Gate, CodeQL, OpenSSF Scorecard, and Targeted Reliability Coverage badges expose public workflow/repository evidence.
  These are operational quality signals, not legal, regulatory, or security certifications.
</p>

---

## What Is PolicyWatcher?

PolicyWatcher monitors the privacy policies, terms of service, and AI governance practices of 16 major technology and financial companies. It tracks configured public policy sources, records retrieval evidence, detects text changes via SHA-256 hashing, and runs each detected change through Google Gemini for structured bilingual (EN/IT) risk analysis.

The platform is designed as a **civic tech tool** that translates dense legal documents into actionable intelligence for citizens, SMEs, DPOs, and compliance professionals.

### Release 3.6.5 Stability Highlights

- **One onboarding invariant** now calculates empty, partial, completed, and failed batch states across import and workflow refresh paths.
- **Defense-in-depth duplicate protection** includes held workflows while preserving approved-candidate and configured-policy guards.
- **Mobile lifecycle stability** defers orientation reads, coalesces repeated events, cancels pending callbacks, and contains animated tracks inside the root viewport.
- **Single-source release metadata** keeps package, footer, Trust Center, admin, methodology, and encrypted exports aligned.
- **Regression coverage** protects lifecycle cleanup, edge-case batch state, held-stage queries, and version consistency.

### Operational continuity work in progress

- **One-request company onboarding** creates the company and claims its persistent discovery job server-side; the browser no longer has to coordinate two dependent writes.
- **Baseline in context** lets an administrator approve discovered sources and run the targeted first baseline without leaving Company Manager. The handoff to normal monitoring occurs only after every approved policy has verified evidence.
- **Evidence-aware KPI QA** combines assessed values from the latest public change of each company policy, shows the originating policy/date, reports coverage, and distinguishes `Pending` from a numerical risk score.
- **Self-checking Hostinger startup** applies the idempotent runtime schema initializer for both npm and direct bridge startup, with Node/Python fallback parity protected by tests.
- **Notification-to-evidence inquiry** at `/what-changed` accepts a company, official URL, or pasted update notification and returns only source-gated verified comparisons. The pasted text is interpreted only in the browser; missing evidence creates a reusable, zero-content admin inquiry instead of an invented answer.
- **Human inquiry gate** at `/admin/inquiries` lets administrators link a known company, approve a new canonical company into persistent discovery, reject/mark duplicates, or resolve the request to an existing public change. Every transition is written to the review log.

#### Policy inquiry privacy and evidence contract

- Maximum local input is 20 KB. Notification parsing happens in the browser; the raw text is never included in the API request.
- The server receives only an organization/domain clue, a query-free official URL when present, policy categories and notification/effective dates. It stores no email address, subject, message body, redacted excerpt or content fingerprint.
- User-submitted URLs are clues only and are not fetched until an administrator approves onboarding.
- Pasted notifications are never sent to Gemini. Verified answers come only from `publicPolicyWhere` / `publicChangeWhere` records.
- A first scan establishes a baseline and cannot, by itself, prove what changed before monitoring began.
- Production must set `TRUSTED_CLIENT_IP_HEADER` to a provider-controlled client-IP header, or enable `TRUST_PROXY_HEADERS=true` only after confirming that the Hostinger proxy overwrites forwarded headers. Otherwise the low-volume inquiry limiter falls back to one shared `unknown` bucket.

### Release 3.6.4 Audit Fixes Highlights

- **Durable discovery jobs** persist run state in SQLite and use atomic claims so polling survives process boundaries and prevents overlapping work.
- **Onboarding reconciliation** keeps batch status synchronized when publication QA fails and safely reuses or audit-reopens existing discovery candidates.
- **Input and UI correctness** returns controlled errors for malformed discovery requests, removes continuous device-motion work, and uses UTC calendar days for Observatory countdowns.
- **Regression coverage** protects all six GitHub audit findings before the Hostinger production rollout.

### Release 3.6.3 Guided Evidence Workflows Highlights

- **Objective-based dashboard composer** now becomes the first-use start screen: it asks for the user objective and evidence depth, then previews and applies a stack assembled from registered, real dashboard evidence modules.
- **Bulk source onboarding** at `/admin/source-onboarding` adds a durable five-stage intake: proposed source, official-source review, first private baseline, QA gate, and explicit publish/hold/reject decision.
- **Publication safety** keeps imported candidates and their first baselines private. Passing QA is necessary but not sufficient: only an explicit admin publication decision can cross the public-evidence boundary.
- **Source remediation hardening** for official-but-blocked providers: market-specific Revolut EU/UK source mappings, explicit provider-challenge suspension wording, and documented PDF/manual-review fallback paths.
- **Public suspension explainability** now distinguishes anti-bot/provider challenge, insufficient policy text, stale archive evidence, missing source baseline, and partial retrieval.
- **Press Wall expansion** with local visual previews for tracked public references, including Giovanna Panucci / Gladiatori Digitali.

### Release 3.6.1 Adaptive Workspace Foundation Highlights

- **Adaptive Workspace foundation** introduced the intent/depth profile, persistence, and deep-link model that the 3.6.3 first-use composer now uses to assemble real evidence modules.
- **Intent profiles** for Citizen, GRC / Legal, Research, and Builder sessions adjust density, module priority, visual accent, and operational context.
- **Evidence-depth profiles** for Snapshot, Operational, and Forensic views determine how much retrieval, QA, review, and methodology context is surfaced.
- **Deep-link presets** such as `/?intent=citizen&depth=forensic` allow public pages and roadmap proposals to open the dashboard in a preconfigured workspace.
- **Safety invariant**: source suspensions, source-quality states, and data limitation notices remain visible across profiles.

### Release 3.6.0 Community Surface Highlights

- **Community Roadmap** (`/roadmap`) redesigned as an interactive signal board where users can choose their objective, preferred evidence depth, and roadmap priorities.
- **Press Wall** (`/press`) collecting articles, LinkedIn discussions, and public references about PolicyWatcher while keeping a clear non-certification boundary.
- **Compact brand mark** adopted across public/admin headers to avoid duplicated wordmarks and improve visual balance.
- **Public resource navigation** expanded through footer and command palette instead of adding more toolbar complexity.
- **Showcase refresh** aligned with the current platform surface: public views, Dataset QA, Trust evidence, admin controls, community roadmap, and press coverage.

### Release 3.5.1 Audit Operations Highlights

- **Append-only review log** for human admin/auditor decisions in the Dataset QA workflow.
- **Persistent Dataset QA issue decisions** with `open`, `reviewed`, and `ignored` states.
- **Ignore-with-reason workflow** so ambiguity is documented instead of silently hidden.
- **CSV exports** for Dataset QA issue handoff and review-log evidence.
- **Roadmap status labels** separating implemented controls, active 3.5.1 work, and planned future capabilities.
- **Admin VPS Services monitor** for renderer reachability, configuration gates, public health telemetry, and controlled render smoke tests.
- **VPS Operations Agent** for optional admin-controlled renderer health, fixed smoke checks, backups, checksum-verified local package updates, rollback and capped operation logs.
- **Renderer-backed scraper hardening** via an optional VPS Playwright service for script-rendered policy pages, protected by bearer auth and SSRF validation.
- **Archive freshness guard** so Wayback/Common Crawl snapshots older than the last successful check cannot be mistaken for a current policy change.
- **Source-fit URL migration** with `--dry-run`, company/policy/jurisdiction scoping, and corrected Wise/Meta source handling.
- **Dashboard confidence UX calibration** with the use-boundary acknowledgement moved out of the first impression and local dashboard density/view/accent controls.

### Release 3.5 Confidence Track Highlights

- **Adaptive Fallback Scraper Cascade (5 levels)**: attempts direct HTTP/1.1, explicit HTTP/2, optional rendered fetch through the hardened VPS renderer, then freshness-guarded Wayback Machine and Common Crawl recovery.
- **Polite Crawling & Delays**: Random 1-3s delays between policy fetches to avoid rate limit bans.
- **KPI Preservation**: Automatic inheritance of the 15-KPI governance metrics on new scans, preventing database records from resetting to "Not assessed".
- **Data Integrity Repair Script**: `/scripts/repair-data.ts` to recompute SHA-256 hashes, backfill missing AI summaries (TL;DR, keyPointsJson), and restore broken KPI cells in the database.
- Public policy-change timeline with stable `/change/[id]` permalinks.
- Home-page Market Pulse timeline showing recent policy movements by sector.
- Public Policy Signals Board (`/leaderboard`) ranking evidence availability, retrieval traceability, source coverage, and publicEvidence-gated movement without certifying companies or compliance.
- Embeddable `/embed/change/[id]` widgets for third-party pages.
- Dynamic Open Graph image generation and sitemap support for better sharing and indexing.
- Rich diff rendering for policy additions, removals, and unchanged context.
- Industry benchmark option in the A/B radar comparison.
- Admin encrypted backup export and verification workflow.
- Admin Dataset QA dashboard and issue queue for source-fit, integrity, freshness, KPI coverage, regional-impact coverage, subscriber hygiene checks, reviewed decisions, ignored reasons, and reopen actions.
- Public Trust & Quality Evidence page (`/trust`) with CI, CodeQL, OpenSSF Scorecard, targeted reliability coverage, live-header report links, and dataset assurance boundaries.
- Pre-release security hardening for secrets, rate limits, AI output rendering, email templates, subscriber tokens, scraper egress, deployment diagnostics, and backup passphrases.
- Dedicated deployment guidance for the Hostinger app package and the separate VPS renderer service.

### Key Value Propositions

- **Automated monitoring workflow** for a configured inventory of 16 companies across 6 industry sectors, with public records gated until source evidence is available.
- **Transparent AI scoring** where generated risk scores are retained only when backed by retrieved policy text and structured model output.
- **15-KPI governance matrix** covering Privacy, AI Governance, and Ethics. Static bilingual KPI notes are disabled in public mode unless explicitly enabled after editorial review.
- **Regional impact analysis** across EU, US, and Global jurisdictions from both Individual and Enterprise perspectives.
- **Bilingual by design** with full native EN/IT support throughout the platform, including all AI outputs.

---

## Monitored Companies

| Sector | Companies |
|--------|-----------|
| **Tech Giants** | Google, Microsoft, Apple, Amazon, Meta |
| **FinTech** | Stripe, PayPal, Revolut, Wise, Klarna, Plaid |
| **AI Providers** | OpenAI, Anthropic |
| **Social Media** | TikTok |
| **Cloud/SaaS** | Salesforce |
| **E-Commerce** | Shopify |

Each company is tracked across multiple policy types: Privacy Policy, Terms of Service, AI Terms, and Acceptable Use Policy where applicable.

---

## Architecture

### System Overview

```mermaid
flowchart TB
    subgraph Scheduling["Cron Scheduler"]
        CRON["External Cron Job<br/>(every 6-12h)"]
    end

    subgraph Ingestion["Data Ingestion Pipeline"]
        SCRAPER["Hardened Scraper<br/>Double-Check System"]
        RENDERER["Optional VPS Renderer<br/>Playwright / Chromium"]
        HASH["SHA-256<br/>Change Detection"]
        DIFF["Text Diff Engine"]
    end

    subgraph AI["AI Analysis Layer"]
        GEMINI["Google Gemini 2.5 Flash<br/>temperature 0.1"]
        STRUCT["Structured JSON Output<br/>TL;DR + Key Points + Risk Reasons"]
        KPI["15 KPI Assessment"]
        REGION["Regional Impact Analysis<br/>EU / US / Global"]
    end

    subgraph Storage["Data Layer"]
        PRISMA["Prisma ORM"]
        SQLITE["SQLite Database"]
    end

    subgraph Delivery["User-Facing Layer"]
        DASH["Next.js Dashboard<br/>React 19 + Framer Motion"]
        MATRIX["KPI Governance Matrix"]
        COMPARE["A/B Company Compare"]
        PDF["Executive PDF Report"]
        SHARE["Public Share Pages"]
        CHAT["AI Live Assistant"]
    end

    CRON --> SCRAPER
    SCRAPER -.-> RENDERER
    RENDERER -.-> SCRAPER
    SCRAPER --> HASH
    HASH -->|detected change| DIFF
    DIFF --> GEMINI
    GEMINI --> STRUCT & KPI & REGION
    STRUCT & KPI & REGION --> PRISMA
    PRISMA --> SQLITE
    SQLITE --> DASH & MATRIX & COMPARE & PDF & SHARE & CHAT
```

### Ingestion Pipeline Sequence

```mermaid
sequenceDiagram
    autonumber
    participant Cron as Cron Job / Web Hook
    participant API as API Route (cron/check-all)
    participant Scraper as Scraper v3
    participant Renderer as VPS Renderer
    participant Policy as Remote Policy Server
    participant Archive as Web Archives (Wayback / Common Crawl)
    participant DB as SQLite Database
    participant Gemini as Gemini API
    participant Mailer as Mailer

    Cron->>API: trigger full check
    loop for each policy
        API->>Scraper: scrapePolicyText(url)
        Scraper->>Policy: GET (Direct HTTP/1.1 / H2)
        alt successful fetch (200 OK / 403 with body)
            Policy-->>Scraper: HTML response
        else script-rendered or blocked but renderer configured
            Scraper->>Renderer: POST /render with bearer secret
            Renderer->>Policy: Browser render with SSRF checks
            Policy-->>Renderer: DOM content
            Renderer-->>Scraper: HTML + final URL + status
        else blocked and live retrieval unavailable
            Scraper->>Archive: Fetch freshness-guarded snapshot
            Archive-->>Scraper: HTML response
        end
        Scraper->>Scraper: Content validation (Layer 2)
        alt usable policy text
            Scraper-->>API: normalized text + fetch metadata
            API->>DB: Record CheckLog and update Policy check timestamps
            alt hash changed
                API->>DB: Create PolicySnapshot and update currentHash
                API->>Gemini: Analyze diff, KPI values, and regional impact
                Gemini-->>API: Structured JSON assessment
                API->>DB: Create PolicyChange and RegionImpact rows
            else hash unchanged
                API->>DB: Keep current hash and record successful check
            end
        else Content blocked / unavailable
            Scraper-->>API: { unavailable: true }
            API->>DB: Record CheckLog with Needs Review / Unavailable status
            Note over API: Logged honestly, no fake data created
        end
    end
    API->>DB: Fetch active INSTANT subscribers
    API->>Mailer: Send filtered alerts per subscriber
    API-->>Cron: Summary JSON (checked, changed, errors)
```

---

## Methodology

### Risk Score (1-10)

Each monitored policy receives a composite risk score from 1 (very safe) to 10 (critical concerns). The score is generated by Gemini 2.5 Flash with temperature 0.1 for deterministic, factual output.

| Range | Label | Criteria |
|-------|-------|----------|
| 1-3 | Low | Strong user protections, transparent AI practices, explicit consent, quick breach notification, published audit results |
| 4-6 | Medium | Partial protections, some opaque AI practices, opt-out consent flows, moderate data retention |
| 7-10 | High | Extensive data collection, opaque AI training, indefinite retention, broad third-party sharing, no independent audits |

Every score comes with exactly 3 **Risk Reasons** that explain *why* the score is what it is, each with a delta contribution (e.g. `+2`, `-1`).

### The 15 KPIs

Companies are evaluated across 15 Key Performance Indicators organized in three groups:

#### Privacy and Data Protection

| KPI | Green | Yellow | Red |
|-----|-------|--------|-----|
| Data Collection Scope | Minimal | Moderate | Extensive |
| Third-Party Sharing | None / Restricted | Limited / Controlled | Broad / Undisclosed |
| Data Retention | Limited (defined) | Extended | Indefinite |
| Right to Deletion | Full / Available | Partial | Not available |
| Cross-Border Transfer | Restricted | Controlled | Unrestricted |

#### AI Governance

| KPI | Green | Yellow | Red |
|-----|-------|--------|-----|
| AI Training Opt-Out | Available / Not used | Opt-out available | Not available |
| AI Output Ownership | User retained | Shared | Company retained |
| Algorithmic Transparency | Published / Disclosed | Mentioned / Partial | Opaque / Undisclosed |
| Automated Decisions | Transparent / Human-in-loop | Partial disclosure | Opaque / No review |
| AI Bias and Fairness | Committed / Certified | Mentioned | Absent |

#### Ethics and Corporate Governance

| KPI | Green | Yellow | Red |
|-----|-------|--------|-----|
| Consent Mechanism | Explicit opt-in | Opt-out | Implicit / Bundled |
| Regulatory Compliance | Comprehensive | Partial | Minimal |
| Breach Notification | Within 24h | Within 72h | Unspecified |
| Independent Audit | Certified / Published | Mentioned | Absent / Undisclosed |
| Content Moderation | Transparent | Partial | Opaque |

The KPI matrix includes **480 bilingual methodology notes** (16 companies x 15 KPIs x 2 languages). They support review consistency, do not replace current provider-source evidence, and remain disabled in public UI unless `NEXT_PUBLIC_ALLOW_STATIC_KPI_JUSTIFICATIONS=true` is set explicitly.

### Source Selection and Dataset QA

Dataset quality is treated as a release-control discipline. PolicyWatcher follows this source hierarchy:

- **Global first:** Global analysis should use the canonical English/global source when the company publishes one.
- **Market-specific when available:** EU, US, UK, or other regional analysis should point to the provider source for that market.
- **Localized pages are not primary evidence by default:** translated URLs such as `/it/` are flagged unless they are the only official market source and the jurisdiction label makes that clear.
- **Traceability over convenience:** every monitored policy keeps its configured source URL, hash, check history, version metadata, and detected changes.
- **Public evidence gate:** snapshots and changes must be marked `publicEvidence` before they can feed public APIs, sitemap, digests, share pages, reports, timelines, the Policy Signals Board, or benchmarks.
- **Completeness over false availability:** incomplete, truncated, or anomalous retrievals are marked `Partial` and suspended from public evidence instead of becoming complete baselines.
- **Segmented legal hubs:** when a provider publishes several policies in one official legal hub, PolicyWatcher can monitor an anchor-scoped section such as `#end-user-privacy-policy` instead of accepting the whole hub as one mixed evidence body.
- **Provider-challenge remediation:** if an official source is protected by anti-bot or WAF controls, the VPS renderer is attempted but is not treated as a guarantee. Challenge pages, placeholders, stale archives, and too-short bodies stay suspended. Remediation must use a market-specific official URL, official PDF/CDN evidence where available, or a traced admin review before public exposure.

The admin **Dataset QA** gate checks URL hygiene, source-fit, hash integrity, freshness, structured AI JSON, KPI coverage, regional-impact coverage, archive timestamp evidence, public-evidence state, and subscriber hygiene. Critical findings are release blockers; warnings mark ambiguity or drift that should be resolved before public promotion. In 3.5.1, issue decisions can be marked reviewed, ignored with reason, or reopened; every decision writes an append-only admin review-log event.

Public QA rule: when the latest fetching/update cycle produces anomalies, seed-only evidence, partial retrieval, or a `Needs Review` / `Unavailable` status, PolicyWatcher suspends the source from public data views. The public UI may show a suspension notice and minimal metadata, but it does not expose the policy text, risk score, timeline event, KPI value, or AI interpretation until the source is verified again.

Policy Signals Board rule: `/leaderboard` is an evidence-only ranking surface. It orders companies by source coverage, retrieval traceability, public baselines, recency, suspension pressure, and publicEvidence-gated movement. It does not rank legal compliance, internal conduct, safety, or provider trustworthiness. Suspended sources reduce the operational evidence index and are listed in a source-attention queue instead of feeding public analysis.

Re-baseline rule: the first successful fetch after a record backed by `Seeded` ingestion evidence is treated as baseline establishment, not as a policy change. The system replaces the seeded history for that policy, stores one verified public-evidence baseline snapshot, updates hash/status/check-log evidence, and does not create a `PolicyChange`, run AI scoring, or notify subscribers. A `Configured` status alone is not enough to trigger destructive re-baseline; the operation also aborts if real source evidence, public snapshots, or reviewed history already exist.

Bulk-onboarding private-baseline rule: approving an official source creates controlled company/policy inventory and enables a targeted first-baseline scan, but neither import nor baseline capture publishes it. The item advances through persisted QA evidence and must reach `Ready`; an administrator must then explicitly choose publish, hold, or reject. Only publish promotes the baseline across the public-evidence gate.

Initial archive baseline rule: during the first `Seeded` re-baseline, the database bootstrap timestamp is not treated as a real successful source check. This means Wayback/Common Crawl evidence can be used when live direct/HTTP2/renderer retrieval is blocked, while the accepted record still carries `source=wayback` or `source=commoncrawl` plus `archiveTimestamp` for Dataset QA review.

Partial capture rule: if a strategy retrieves policy-like text but the extractor reaches the storage cap or otherwise marks the result incomplete, PolicyWatcher records the strategy as `partial` and suspends the source pending review. It is not counted as an accepted trusted baseline. Short placeholder legal pages are also rejected as insufficient evidence, even when they return HTTP 200.

Operational alert rule: every source suspension created by a manual scrape or by the scheduled check-all pipeline can trigger an internal administrator email. The email contains only source metadata, status, reason, transport source, HTTP status, timestamp, and the Dataset QA console link; it does not include policy text, scores, diffs, KPIs, or AI interpretation.

Initial regeneration rule: on shared hosting, run the first real-source scan in batches. The admin Cron Manager and `/api/cron/check-all` accept `limit` and `companySlug` controls so long renderer/archive cycles can be resumed safely without one oversized HTTP request. Limited batches are ordered by oldest `lastCheckDate`, so repeated `limit=5` runs process the next least-recently checked records instead of restarting from the same first five.

Targeted update rule: to remediate a specific company, set `companySlug` in Cron Manager or call the cron endpoint with `companySlug=zoom`, `microsoft`, `plaid`, `amazon`, `klarna`, or any other company slug. This limits the scan to that company's configured policies while keeping the same source-evidence gates.

Host/path-drift rule: live retrieval paths (`direct`, `http2`, `rendered`) reject cross-host redirects and same-host policy URLs that land on a homepage before baseline or change creation. A configured URL that drifts away from the policy document is marked for review instead of being accepted as public evidence. Archive paths are identified separately and are not treated as live host continuity.

Extractor stability rule: the policy text normalizer avoids generic container wrappers and overlapping `div`/`span` extraction so the stored hash is based on stable policy text rather than duplicated layout text.

KPI freshness rule: newly detected policy changes do not inherit the 15 KPI fields from older changes. Until the KPI extraction schema is explicitly regenerated from the current source evidence, new change records store those KPI fields as `Not assessed`. This prevents stale KPI values from being presented as current evidence.

Admin KPI QA aggregation rule: the audit matrix does not treat one policy document as the complete company assessment. Each KPI cell uses a supported value from the latest public change of each monitored policy and retains the contributing policy and assessment date as provenance. It never reaches back to an older change when the latest assessment is pending. The displayed risk score remains the latest analyzed change score; companies without an analyzed public change are shown as `Pending`, never `0`.

Source remediation status: release 3.5.1 updated current official source mappings for Zoom Trust Center, Microsoft Privacy Statement final URLs, Plaid anchor-scoped legal sections, AWS DPA focused documentation, and Klarna US/EU sources. Release 3.6.3 adds market-specific Revolut EU/UK mappings and keeps Revolut sources suspended when provider anti-bot protection prevents evidence-grade retrieval. Klarna EU Terms remains a deliberate suspension candidate when the official English EU/Ireland terms page returns only a short placeholder body.

### Trust and Quality Evidence

PolicyWatcher exposes quality evidence in the application and in the public repository. These checks are operational controls, not legal, regulatory, or compliance certifications.

- `npm run qa:dataset` validates the local dataset at policy-record grain: accepted status values, SHA-256 consistency, version-record coverage, check-log presence, latest status alignment, and scan timestamps.
- `.github/workflows/quality.yml` runs Prisma validation, CI database seeding, dataset assurance, lint, production build, and high-severity dependency audit.
- `.github/workflows/codeql.yml` runs GitHub CodeQL security-and-quality analysis for JavaScript and TypeScript.
- `.github/workflows/scorecard.yml` runs OpenSSF Scorecard and publishes public supply-chain posture results.
- OpenSSF Best Practices project `13465` is passing and exposed as public open-source process evidence.
- `.github/workflows/coverage.yml` runs targeted Vitest reliability coverage for auth/session, rate limiting, confidence metadata, diff parsing, subscriber preferences, and export/report utilities, then uploads to Codecov when `CODECOV_TOKEN` is configured.
- `.github/workflows/sonar.yml` is ready for SonarQube Cloud and activates when `SONAR_TOKEN` is configured.
- `SECURITY.md`, `CONTRIBUTING.md`, and `CODE_OF_CONDUCT.md` support the OpenSSF Best Practices self-attestation.
- `docs/platform-state-of-art-2026-07-05.md` and `docs/platform-state-of-art-2026-07-05.it.md` record the current platform state, renderer hardening, dataset profile, assurance controls, known warnings, deployment notes, and priorities.
- `docs/third-party-validation.md` records the exact setup steps and public report URLs for GitHub, OpenSSF, Sonar, Codecov, MDN Observatory, and SecurityHeaders.com.
- `/trust` explains what each badge/report means and states the non-certification boundary.
- Admin access logs minimize IP addresses before persistence and are cleaned up after 90 days by digest cron routes.

### Scraper Integrity (Double-Check System)

The scraper follows a strict "never fabricate" design:

**Layer 1 (Transport):**
- 20-second fetch timeout with 3 retry attempts and exponential backoff.
- User-Agent rotation across 3 browser profiles.
- DNS resolution before outbound fetches, private/internal IP rejection, and socket-pinned HTTP/1.1/HTTP/2 requests to reduce DNS rebinding risk.
- Redirect following with Public Suffix List based host-coherence checks and final-URL validation.
- Direct HTTP/1.1 first, explicit HTTP/2 fallback for providers that reject HTTP/1.1.
- HTTP/2 timeout and error paths close the underlying session and return fixed diagnostic tokens instead of raw network exception messages.

**Layer 2 (Content Validation):**
- Detects Cloudflare challenges, CAPTCHAs, maintenance pages, paywalls, and consent walls.
- Soft-404 detection for pages that return 200 but contain error content.
- Minimum text length enforcement (800 characters).
- Maximum text cap (500K characters).

**Live and archive fallback:**
- Optional VPS renderer (`renderer/`) runs Playwright/Chromium outside Hostinger for script-rendered policy pages.
- Renderer requires `RENDERER_SECRET`, validates initial URLs, final browser redirects, and subresource requests against SSRF rules, and refuses to start without a secret.
- Renderer validation is a browser request-boundary control; app-side HTTP/1.1 and HTTP/2 retrievals use stronger socket pinning because Node controls those sockets directly.
- Archive recovery uses Wayback Machine and Common Crawl only when snapshots are fresh enough relative to the policy's last successful check.
- Common Crawl WARC records are decompressed before HTML extraction, avoiding binary/gzip artifacts in text comparisons.
- Admin Cron Manager records the ordered retrieval strategy chain for each policy: direct, HTTP/2, renderer, Wayback, and Common Crawl each report accepted, rejected, failed, or skipped status plus the reason for escalating to the next fallback.

**Result types:**
- `ok` - valid policy text, stored with SHA-256 hash.
- `unavailable` - temporary issue, flagged honestly with a "visit the official site" message.
- `invalid` - permanently dead link (404/410).

### PALO Framework Integration

PolicyWatcher's methodology is aligned with the **PALO Framework** (Principled AI Lifecycle Orchestration), developed by Fabrizio Degni. PALO synthesizes ISO 42001, the EU AI Act, OECD AI Principles, and NIST AI RMF into a unified operational lifecycle.

PolicyWatcher operates as a continuous **Deployment and Monitoring** tool (Phase 4) while its KPI framework draws from the Ethical KPIs paradigm that PALO advocates: converting abstract ethical principles into measurable, comparable metrics.

```mermaid
flowchart LR
    P1["Phase 1<br/>Ideation and<br/>Screening"]
    P2["Phase 2<br/>Assessment and<br/>Planning"]
    P3["Phase 3<br/>Development and<br/>Validation"]
    P4["Phase 4<br/>Deployment and<br/>Monitoring"]
    P5["Phase 5<br/>Decommissioning"]

    P1 --> P2 --> P3 --> P4 --> P5

    PW["PolicyWatcher<br/>Continuous Monitoring"]

    P4 -.->|"operates here"| PW

    style P4 fill:#6366f1,stroke:#4f46e5,color:#fff
    style PW fill:#1e1b4b,stroke:#6366f1,color:#c7d2fe
```

---

## Features

### Dashboard
- First-use Objective-based Dashboard Composer with goal profiles for Citizen, GRC / Legal, Research, and Builder sessions.
- Evidence-depth selector for Snapshot, Operational, and Forensic views.
- Generated previews contain only registered dashboard evidence modules; Source QA is pinned in every composition.
- Workspace profiles persist in the browser and can be deep-linked through `?intent=...&depth=...`.
- Interactive company card grid with filtering by industry, risk level, date range, and text search.
- Region/perspective context toggle (EU/US/Global x Individual/Enterprise).
- Real-time stats panel with monitored companies count, critical alerts, and average risk score.
- Temporarily suspended sources stay visible across profiles with a readable reason and last-check metadata.
- Skeleton loaders for perceived instant loading.

### Public Exploration Surfaces
- Timeline and Market Pulse expose only source-verified, publishable policy movements.
- Policy Signals Board ranks evidence availability, retrieval traceability, public baselines, and publicEvidence-gated movement without certifying companies or compliance.
- Site Atlas maps public pages, trust surfaces, methodology pages, community pages, and protected admin boundaries as an entity relationship graph.
- Community Roadmap lets users inspect active tracks, proposed evolutions, and deep-link workspace presets.
- Press Wall tracks public references and article previews as community signals, not endorsement or certification.
- Showcase, Infographics, Trust, Security, and Methodology pages explain platform behavior, assurance boundaries, and quality signals.

### Policy Deep-Dive
- 5-tab interface: Changes, AI Governance, Trends, Remediations, Archive.
- AI Summary with TL;DR, sentiment-tagged key points, and risk reason chips.
- Risk Trend Chart with historical data and summary statistics.
- Manual re-scan trigger for on-demand policy analysis.
- Share via Web Share API and downloadable executive PDF report.

### KPI Governance Matrix
- 15 KPIs x 16 companies cross-reference table with color-coded badges.
- Industry filter tabs, search, and toggleable KPI groups.
- Convergence row showing cross-company alignment per KPI.
- Click-to-sort on any KPI column.
- Tooltip justifications with screening date for every cell.

### Company A/B Compare
- Side-by-side comparison with radar/spider chart (Recharts).
- Per-KPI diff table with winner highlight.

### AI Live Assistant
- Conversational Q&A powered by Gemini 2.5 Flash with full policy corpus context.
- Voice input via Web Speech API and voice output via Google Cloud TTS with browser fallback.
- Animated waveform visualizer showing assistant state (idle/listening/processing/speaking).

### Email Notifications
- Real-time alerts on policy changes filtered by subscriber preferences.
- Weekly and monthly digest emails.
- Self-service subscribe/unsubscribe with token-based security.
- Branded HTML email templates.

### Export and Share
- CSV export with flattened company/policy/KPI data.
- Executive PDF report (A4, branded, generated server-side with @react-pdf/renderer).
- Public share pages with Open Graph and Twitter Card metadata.

### Command Palette
- Global overlay search (Cmd+K / Ctrl+K) with fuzzy matching.
- 3 command groups: Actions, Filters, Navigation.
- Full keyboard navigation.

### Admin Assurance Console
- Bulk Source Onboarding at `/admin/source-onboarding` accepts controlled CSV/TSV batches and persists each item through proposed source, official-source review, first private baseline, QA gate, and publication decision.
- The import contract requires these exact headers: `companyName`, `companySlug`, `industry`, `website`, `policyName`, `policyType`, `policyUrl`, `jurisdiction`. A batch is limited to 100 rows; a blank `companySlug` is derived from `companyName`.
- Intake validates HTTP(S) URLs, rejects local/private hosts and in-batch duplicates, and restricts industry/jurisdiction values to the admin registry vocabulary.
- Cron Manager supports batch limits and targeted company slug scans, with per-strategy diagnostics for direct, HTTP/2, VPS-rendered, Wayback, and Common Crawl attempts.
- Company Registry supports adding companies and policy sources; new records start as configured inventory and remain non-public until verified by a scan.
- Dataset QA tracks source fit, retrieval evidence, public-evidence state, seeded boundaries, hash consistency, archive timestamps, KPI coverage, regional impact, access logs, and subscriber hygiene.
- Review Log records append-only Dataset QA and remediation decisions.
- Access Log records admin authentication and operational events for debugging and auditing, with IP minimization and retention cleanup.
- VPS Services monitors renderer health, smoke tests, and the optional VPS Operations Agent for backup, verified update, rollback, and capped logs.

### Onboarding
- The first-use dashboard composer is the default guided entry when no valid workspace profile or deep-link preset exists.
- The 6-slide How To guide remains available as an explicit reference for feature surfaces, Dataset QA, limitations, and the AI assistant.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.9 (App Router, Turbopack) |
| UI | React 19, Framer Motion, Lucide React, CSS Modules |
| AI Engine | Google Gemini 2.5 Flash (`@google/genai`) |
| Database | Prisma ORM + SQLite (migration-ready for PostgreSQL) |
| Scraping | Cheerio extraction, socket-pinned HTTP/1.1/HTTP/2, optional VPS renderer, Wayback/Common Crawl fallback |
| Charts | Recharts 3.8 |
| PDF | @react-pdf/renderer 4.5 |
| Email | Nodemailer 9 |
| Export | PapaParse 5.5 |
| TTS | Google Cloud Text-to-Speech API |

---

## Database Schema

```mermaid
erDiagram
    Company ||--o{ Policy : has
    Policy ||--o{ PolicySnapshot : versions
    Policy ||--o{ PolicyChange : changes
    PolicyChange ||--o{ RegionImpact : impacts
    PolicySnapshot ||--o{ PolicyChange : "old snapshot"
    PolicySnapshot ||--o{ PolicyChange : "new snapshot"

    Company {
        string id PK
        string name UK
        string slug UK
        string logo "hex color"
        string industry
        string website
    }

    Policy {
        string id PK
        string companyId FK
        string name
        string type "privacy, terms, ai"
        string url
        string jurisdiction
        string currentText
        string currentHash "SHA-256"
    }

    PolicySnapshot {
        string id PK
        string policyId FK
        int version
        string text
        string hash
        datetime createdAt
    }

    PolicyChange {
        string id PK
        string policyId FK
        string oldSnapshotId FK
        string newSnapshotId FK
        string diff "JSON diff chunks"
        string aiSummaryEn
        string aiSummaryIt
        string tldrEn
        string tldrIt
        string keyPointsJson
        string riskReasonsJson
        string overallRisk "Low, Medium, High"
        int overallScore "1-10"
        string remediationsJson
        string kpiDataCollection "15 KPI fields"
    }

    RegionImpact {
        string id PK
        string policyChangeId FK
        string region "EU, US, Global"
        string perspective "Individual, Enterprise"
        string impactAnalysisEn
        string impactAnalysisIt
        string riskLevel
        string complianceNoteEn
    }

    Subscriber {
        string id PK
        string email UK
        string name
        string regions "comma-separated"
        string industries "comma-separated"
        string frequency "INSTANT, WEEKLY"
        string unsubscribeToken UK
        boolean isActive
    }
```

---

## API Reference

| Route | Method | Auth | Rate Limit | Purpose |
|-------|--------|------|------------|---------|
| `/api/companies` | GET | No | 60/min | List all companies with policies and latest changes |
| `/api/policies/[id]` | GET | No | 60/min | Full policy detail with version records and change history |
| `/api/chat` | POST | No | 10/min | AI Q&A with policy corpus context |
| `/api/scrape` | POST | Bearer | 3/10min | Manual re-scrape and re-analysis of a policy |
| `/api/compare` | GET | No | 60/min | A/B company KPI comparison with radar data |
| `/api/matrix` | GET | No | 60/min | Cross-company KPI matrix data |
| `/api/trends` | GET | No | 60/min | Historical risk score trend data |
| `/api/report/[policyId]` | GET | No | 60/min | Server-side PDF report generation |
| `/api/tts` | POST | No | 10/hr | Google Cloud Text-to-Speech |
| `/api/subscribers` | POST | No | 3/hr | Subscribe to email alerts |
| `/api/subscribers` | DELETE | No | 10/hr | Unsubscribe from email alerts |
| `/api/cron/check-all` | POST | Bearer | None | Full policy check and notification pipeline |
| `/api/cron/weekly` | GET | Bearer | None | Weekly digest email dispatch |
| `/api/cron/monthly` | GET | Bearer | None | Monthly digest email dispatch |
| `/api/health` | GET | Bearer | None | System health check |
| `/api/seed` | POST | Bearer + env flag | None | Database seeding (development only) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- A Google AI API key ([get one here](https://aistudio.google.com/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/sev7enITA/policywatcher.git
cd policywatcher

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys (see .env.example for guidance)

# Generate Prisma client and push the database schema
npx prisma generate
npx prisma db push

# Start the development server
npm run dev
```

The application will be available at `http://localhost:3000`.

### Seeding the Database

To populate a local development database with the configured company inventory and fixture records:

```bash
# With the dev server running and ALLOW_DATABASE_SEED_ENDPOINT=true:
curl -X POST -H "Authorization: Bearer YOUR_API_SECRET" http://localhost:3000/api/seed
```

Seeded records are treated as configured/unverified. They are hidden from public confidence views; `ALLOW_SEEDED_PUBLIC_DATA=true` is honored only outside production for controlled development demos.

### Production Build

```bash
npm run build    # Runs: prisma generate && next build
npm start        # Starts the production server
```

### Hostinger SQLite Setup

Production packages intentionally do not include `prisma/dev.db`. The database
must be created or upgraded on the server after the files are extracted. Use an
absolute SQLite path outside the extracted app source directory so future ZIP
deploys cannot overwrite evidence.

Example Hostinger value:

```env
DATABASE_URL=file:/home/u847874844/domains/policywatcher.online/policywatcher-data/production.db
```

After setting the same `DATABASE_URL` in Hostinger environment variables, run
from the deployed app directory:

```bash
export PATH="/opt/alt/alt-nodejs22/root/usr/bin:$PATH"
export DATABASE_URL="file:/home/u847874844/domains/policywatcher.online/policywatcher-data/production.db"
bash scripts/hostinger-init-db.sh
```

If the database is new or has `0` companies / `0` policies, initialize only the
monitored source inventory:

```bash
node scripts/hostinger-seed-inventory.mjs
```

This inventory initializer is production-safe: it creates companies and policy
source URLs as `Configured` + `Seeded` records, but it does not create snapshots,
policy changes, AI summaries, timeline events, or public evidence. The first
successful Cron Manager scan establishes a verified baseline in small batches
without publishing placeholder data or notifying subscribers.

For an existing production database, run URL remediation before targeted scans:

```bash
export PATH="/opt/alt/alt-nodejs22/root/usr/bin:$PATH"
export DATABASE_URL="file:/home/u847874844/domains/policywatcher.online/policywatcher-data/production.db"
node scripts/hostinger-remediate-sources.mjs --dry-run
node scripts/hostinger-remediate-sources.mjs
```

Then use Cron Manager with a company slug for focused verification, for example
`zoom`, `microsoft`, `plaid`, `amazon`, or `klarna`.

If the admin login succeeds but the dashboard does not load, check Hostinger
runtime logs for `Error code 14: Unable to open the database file`. That means
the configured SQLite directory is missing, not writable, or the schema has not
been pushed yet.

Admin authentication events are recorded in `AdminAccessLog` and exposed to
administrator users at `/admin/access-logs`. The log records successful logins,
failed attempts, logout requests, and configuration errors with timestamp,
username, role, request path, method, user-agent, and the IP resolved by the
configured proxy-trust policy.

### Schema Upgrade Notes

Release 3.5 introduces the Truth & Confidence Layer fields and the
`PolicyCheckLog` table. On an existing deployment, update the SQLite schema and
backfill the initial check-log rows before relying on Dataset QA Status views:

```bash
# 1. Back up the existing production database first.
cp /path/to/production.db "/path/to/production.db.backup-$(date +%Y%m%d%H%M%S)"

# 2. Apply Prisma migrations.
npx prisma migrate deploy

# 3. Reconcile current policy records, version-record hashes, and latest check-log evidence.
npm run db:repair

# 4. Create one initial check-log row for existing policies that do not have one.
npm run db:backfill-check-logs

# 5. Build and start as usual.
npm run build
npm start
```

Do not run `/api/seed` in production. It is development-only and blocked unless
`ALLOW_DATABASE_SEED_ENDPOINT=true` and `NODE_ENV` is not `production`.
For existing SQLite databases originally created with `prisma db push`, mark the initial migration as applied once before switching to migration deploy:
`npx prisma migrate resolve --applied 20260706213500_init`.
The Hostinger init helper performs this baseline step automatically when it detects a non-empty SQLite file.

Release 3.6.3 also requires migration `20260721090000_source_onboarding`, which creates the durable onboarding batch/item tables and their staged review metadata. Apply it with the same `npx prisma migrate deploy` step before using `/admin/source-onboarding`.

Release 3.6.4 additionally requires migration `20260721120000_policy_discovery_job`, which persists discovery run state and atomic run tokens. The same `npx prisma migrate deploy` or `bash scripts/hostinger-init-db.sh` step applies it without changing policy evidence.

Security incident note: an unauthenticated debug environment endpoint existed in commit `ec2f699` and was removed from `main` by commit `f453b4a`. If commit `ec2f699` was deployed, rotate `ADMIN_PASSWORD`, `SESSION_HMAC_SECRET`, and `API_SECRET`. The endpoint did not intentionally expose secret values, but public deployment of diagnostic environment routes is not acceptable for production operations.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google AI API key for Gemini 2.5 Flash |
| `API_SECRET` | Yes | High-entropy bearer token for cron and protected operational endpoints |
| `SESSION_HMAC_SECRET` | Yes | Separate high-entropy key for admin session cookies; never reuse `API_SECRET` |
| `DATABASE_URL` | Yes | SQLite connection string. Use an absolute production path outside the extracted app source, e.g. `file:/home/USER/domains/policywatcher.online/policywatcher-data/production.db` |
| `SMTP_HOST` | No | SMTP server hostname |
| `SMTP_PORT` | No | SMTP server port |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `SMTP_FROM` | No | Sender address for outgoing emails |
| `ADMIN_ALERT_EMAIL` | Recommended | Operational recipient for source suspension and Dataset QA anomaly alerts |
| `ADMIN_EMAIL` | No | Fallback operational recipient when `ADMIN_ALERT_EMAIL` is unset |
| `APP_URL` | No | Public URL used in email links (defaults to `http://localhost:3000`) |
| `RENDERER_URL` | Optional | Public HTTPS URL of the VPS renderer service, for example `https://render.policywatcher.online` |
| `RENDERER_SECRET` | Optional | Shared high-entropy bearer secret used by the Hostinger app to call the renderer |
| `VPS_AGENT_URL` | Optional | Public HTTPS URL of the separate VPS Operations Agent, for example `https://ops.policywatcher.online` |
| `VPS_AGENT_SECRET` | Optional | Dedicated high-entropy HMAC secret used by the Hostinger app to call the operations agent |
| `ALLOW_DATABASE_SEED_ENDPOINT` | No | Development-only flag for `/api/seed`; never enable in production |
| `TRUST_PROXY_HEADERS` | No | Set to `true` only after the reverse proxy is verified to overwrite forwarding headers |
| `TRUSTED_CLIENT_IP_HEADER` | No | Provider-controlled client IP header to use for rate limiting |

### Optional VPS Renderer Deployment

Hostinger runs the Next.js application. The browser renderer is intentionally separate and should run on a VPS because Chromium is not suitable for shared hosting.

```bash
# On the VPS
cd /opt/policywatcher-renderer
npm ci
npx playwright install-deps chromium
sudo systemctl enable --now policywatcher-renderer
curl http://127.0.0.1:8787/healthz
```

Expose it through HTTPS, for example `https://render.policywatcher.online`, and then set the same secret in Hostinger:

```env
RENDERER_URL=https://render.policywatcher.online
RENDERER_SECRET=<same value configured in the VPS systemd service>
```

The application works without these variables, but script-rendered providers have lower retrieval coverage and will rely on direct fetches and archives.

### Optional VPS Operations Agent

The renderer and the operations agent are intentionally separate processes.
The renderer executes Chromium. The operations agent performs only fixed,
allowlisted operations: status, version, fixed smoke test, backup, checksum
verified update, rollback and capped logs.

Recommended layout:

```text
/opt/policywatcher-vps-agent/
/opt/policywatcher-renderer/current -> versions/3.5.1/
/opt/policywatcher-renderer/versions/
/opt/policywatcher-renderer/packages/
/opt/policywatcher-renderer/backups/
```

The admin panel never sends a shell command, arbitrary package URL or arbitrary
smoke URL. For updates it sends only:

```json
{
  "version": "3.5.2",
  "sha256": "..."
}
```

The agent searches its fixed local package directory, verifies the checksum,
rejects archives containing `.env` entries or unsafe paths, creates a backup,
switches the `current` symlink, restarts the renderer service and runs the
fixed smoke test. Mutating operations are locked; concurrent attempts return
`423 Locked`. If rollback fails, the agent moves to
`manual_intervention_required` and `/healthz` reports `ok: false`.

Configure Hostinger only after the agent is exposed through HTTPS:

```env
VPS_AGENT_URL=https://ops.policywatcher.online
VPS_AGENT_SECRET=<same value configured in the agent systemd environment>
```

---

## Regulatory References

PolicyWatcher's analysis references the following regulatory frameworks:

| Framework | Version | Effective Date |
|-----------|---------|---------------|
| **GDPR** | Regulation (EU) 2016/679 | 2018-05-25 |
| **CCPA / CPRA** | Cal. Civ. Code 1798.100-199.100 | 2023-01-01 |
| **EU AI Act** | Regulation (EU) 2024/1689 | 2024-08-01 |
| **DORA** | Regulation (EU) 2022/2554 | 2025-01-17 |
| **NIST AI RMF** | NIST AI 100-1 (v1.0) | 2023-01-26 |
| **ISO/IEC 42001** | ISO/IEC 42001:2023 | 2023-12-18 |
| **OECD AI Principles** | OECD/LEGAL/0449 (revised 2024) | 2024-05-03 |
| **PALO Framework** | v2.0 (incl. PALO-AM Agentic Module) | 2026-06-01 |

---

## Limitations and Disclaimer

**CONFIDENCE RELEASE v3.5**: PolicyWatcher is in active development and presents evidence mapping, not legal or regulatory certification. The assessments are generated by AI models (Google Gemini) through automated text analysis. While we strive for accuracy, these evaluations:

- May contain inaccuracies, interpretive errors, or omissions of legal language.
- Reflect a point-in-time analysis and may become outdated after the screening date.
- Do not constitute legal advice, compliance certification, or definitive assessment of corporate conduct.
- Are based solely on publicly available policy text and may not capture internal practices or confidential agreements.
- Should not be the basis for any legal, commercial, or compliance decision without independent verification.

The author and the platform disclaim all liability for any decisions, actions, or omissions based on this information. Always verify with the original company documents and consult qualified legal professionals for compliance decisions.

---

## Project Structure

```
policywatcher/
├── prisma/
│   ├── schema.prisma          # Database schema, including onboarding batches/items
│   ├── migrations/20260721090000_source_onboarding/
│   └── seed.ts                # Seed data for 16 companies
├── public/                    # Static assets (logo, icons)
├── src/
│   ├── app/
│   │   ├── admin/source-onboarding/ # Protected five-stage source intake
│   │   ├── api/admin/source-onboarding/ # Batch and item transition APIs
│   │   ├── api/               # Public and protected API routes
│   │   ├── page.tsx           # Main dashboard (~1000 lines)
│   │   ├── layout.tsx         # Root layout with fonts and metadata
│   │   ├── share/[id]/        # Public share pages
│   │   ├── privacy/           # Privacy policy page
│   │   ├── security/          # Security information page
│   │   └── unsubscribe/       # Self-service unsubscribe
│   ├── components/
│   │   ├── ai/                # AI output renderers (Summary, RiskReasons, etc.)
│   │   ├── charts/            # Recharts visualizations
│   │   ├── icons/             # Custom SVG icon components
│   │   ├── PolicyDetails.tsx  # 5-tab policy deep-dive slide-over
│   │   ├── CrossCompanyMatrix.tsx  # 15-KPI x 16-company matrix
│   │   ├── CompareModal.tsx   # A/B company comparison
│   │   ├── LiveAssistant.tsx  # AI chat with voice I/O
│   │   ├── CommandPalette.tsx # Cmd+K command palette
│   │   ├── HowToModal.tsx     # Onboarding wizard
│   │   └── ...                # 10+ more components
│   ├── lib/
│   │   ├── dashboardComposer.ts # Typed evidence-module composition
│   │   ├── sourceOnboarding.ts # CSV/TSV validation and stage model
│   │   ├── gemini.ts          # Gemini AI integration (analysis + Q&A)
│   │   ├── scraper.ts         # Hardened web scraper
│   │   ├── mailer.ts          # Email templates and dispatch
│   │   ├── kpi-justifications.ts  # Optional static bilingual KPI notes
│   │   ├── exporters.ts       # CSV and PDF export utilities
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── auth.ts            # Bearer token authentication
│   │   └── rateLimit.ts       # In-memory token bucket rate limiter
│   ├── pdf/
│   │   └── ExecutiveReport.tsx # A4 branded PDF template
│   └── types/
│       └── index.ts           # Shared TypeScript interfaces
├── .env.example               # Environment variable template
├── CONTRIBUTING.md            # Contribution guidelines
├── DEV_LOG.md                 # Development history and decisions
├── IMPACT_AND_SWOT.md         # Impact assessment and SWOT analysis
├── SECURITY_REPORT.md         # Security audit report
├── LICENSE                    # CC BY 4.0
└── package.json
```

---

## Author

**Fabrizio Degni**

- Website: [policywatcher.online](https://www.policywatcher.online)
- PALO Framework: [paloframework.org](https://www.paloframework.org)
- GitHub: [@sev7enITA](https://github.com/sev7enITA)

---

## License

This project is licensed under the [Creative Commons Attribution 4.0 International License](LICENSE).

You are free to share and adapt this work for any purpose, including commercial use, as long as you give appropriate credit.
