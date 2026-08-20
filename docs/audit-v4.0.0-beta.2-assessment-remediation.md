# PolicyWatcher 4.0.0 Beta 2 assessment remediation audit

Release: `4.0.0-beta.2` - Production Readiness Hardening

Audit date: 20 August 2026

Status: source remediation, staging and production promotion verified.

## Decision

Beta 2 is the remediation wave following three third-party reviews of the
Foundation Beta. It preserves the Beta 1 canonical evidence model and closes
the findings that were reproducible, material and appropriate for the current
single-instance deployment.

The exact artefact passed staging and was promoted to Hostinger production with
the same checksum. This audit records source, staging and deployment evidence
separately; it does not turn those checks into a penetration test, legal
opinion, availability guarantee or infrastructure-cutover approval.

## Remediation matrix

| Finding | Outcome | Implemented control | Remaining boundary |
| --- | --- | --- | --- |
| H1 shared unknown rate-limit bucket | Fixed | Managed deployments reject each unattributed request with `503`, require exactly one trusted identity source and use route-specific public buckets. | The real Hostinger header must be observed and proven overwritten in staging. |
| H2 full evidence graph loaded at startup | Fixed | Startup uses aggregate count/bridge checks; full graph reconciliation remains an explicit rehearsal/backfill command. | Aggregate activation verification does not replace periodic full reconciliation. |
| H3 unbounded scraper bodies and sync decompression | Fixed | Direct HTTP, HTTP/2, Wayback and Common Crawl enforce streamed compressed/decompressed limits and async bounded zlib operations. | Five MiB is an operational cap, not proof that every provider page is retrievable. |
| M1 non-revocable shared sessions | Fixed for current model | Admin and investor secrets are distinct; `ADMIN_SESSION_VERSION` revokes all admin/auditor cookies without rotating investor grants. Investor grants continue to be checked against live revocation state. | Per-user sessions and MFA belong to the future account/workspace model. |
| M2 overlapping full scans | Fixed | A unique durable `policy-scan` lease rejects overlap and renews through execution. | Multi-instance deployment still requires PostgreSQL or a distributed coordinator. |
| M3 ghost running scans | Fixed | Errors close runs as failed; expired and legacy stale runs are recovered before acquisition. | Process death is visible after lease expiry, not instantaneously. |
| M4 partial ambiguous encrypted backup | Fixed | Format v2 covers all 31 application tables, records bounded scrypt parameters, uses async derivation/Base64 and verifies legacy v1 files as partial. | Verification is not an automated restore or an RTO/RPO result. |
| M5 SQLite DELETE journal/no timeout | Fixed in candidate | Initialization requires WAL, application startup configures a five-second busy timeout, readiness asserts both and backup uses the SQLite backup API. | Host filesystem support and live contention require staging/load evidence. |
| M6 unbounded public AI input | Fixed | Streaming JSON caps, question/ID/context limits, a 20-policy implicit top bound, explicit model output cap and dedicated TTS key. | Rate limiting is single-instance and model cost still requires observation. |
| M7 subscription without consent evidence | Fixed for new/reactivated records | Pending state, rotated 48-hour confirmation token, explicit POST confirmation and requested/confirmed timestamps. | Legacy active rows remain active with unknown historical confirmation; no consent is fabricated. |
| M8 document language drift | Fixed | Dashboard language changes synchronize `document.documentElement.lang`; localized route behavior remains unchanged. | The canonical root still uses client-selected language rather than locale URLs. |

## Additional accepted improvements

- All protected Admin HTML shells are rejected at the proxy boundary before
  their client bundle is served; `/admin/login` remains public.
- Auditor writes to dashboard telemetry are rejected, restoring the documented
  read-only role contract.
- `/api/live` exposes only `{ "status": "ok" }` with no credentials, counts,
  paths or database details.
- Heavy dashboard modal surfaces use dynamic imports and closed compare/command
  modules are no longer mounted; the server-rendered home has an `h1`.
- Dashboard acquisition failures have a dedicated alert and retry path instead
  of being rendered as an empty evidence state; root loading and error
  boundaries provide an explicit fallback for uncaught route failures.
- Public API error copy touched by the assessment is consistently English and
  Italian dictionary accents are corrected.
- `GOOGLE_TTS_API_KEY`, the investor provenance switch, the dataset-fixture
  switch and the deprecated Qwen retrieval alias are documented.
- Critical security/reliability test sources have a dedicated TypeScript gate;
  Vitest now also discovers `.test.tsx` under `src/lib`.

## Findings not translated directly into changes

- The public data-source registry intentionally distinguishes request-fresh
  endpoints (`maxAgeSeconds=0`) from short-TTL endpoints. Beta 2 does not add a
  blanket cache that could make readiness or policy detail stale.
- Evidence and audit-table retention is not deleted under an inferred schedule.
  Retention values, legal basis and recovery requirements need an approved data
  lifecycle policy before destructive cleanup is automated.
- Large-file/domain decomposition is a maintainability program, not a safe
  point remediation for this candidate.
- Full bilingual localization of English-first editorial sections, focus-trap
  standardization and broad browser E2E coverage remain dedicated product and
  accessibility workstreams; Beta 2 does not claim their completion.
- Per-username login lockout was not added because it can create a targeted
  administrator denial of service. Trusted client identity and per-client
  limiting are enforced; account-aware adaptive authentication remains a
  future account-model control.

## Functional acceptance

The following legitimate behavior must remain true:

1. ordinary bounded source pages still decode and enter the existing evidence
   validation pipeline;
2. a scan with no selected policies acquires and releases its lease cleanly;
3. existing active subscribers continue receiving their configured alerts;
4. a new subscriber receives no alert before explicit confirmation;
5. current v2 encrypted exports round-trip and legacy v1 exports remain
   verifiable without being relabelled complete;
6. Beta 1 public IDs, taxonomy and publication-readiness contract remain
   unchanged.

## Verification evidence

Source evidence collected on 20 August 2026:

| Gate | Result |
| --- | --- |
| Full Vitest suite | `159` files and `1,034/1,034` tests passed. |
| Focused remediation suite | `75/75` tests passed across rate limiting, scraper limits, evidence activation, encrypted export, scan lifecycle, subscription consent and public surfaces. |
| Coverage | `52.67%` statements, `52.32%` branches, `66.51%` functions and `53.58%` lines over the declared targeted perimeter; scraper line coverage is `39.44%`. |
| Static gates | Application ESLint, application TypeScript, critical-test TypeScript, shell syntax, Python compile and Node syntax checks passed. Local assessment worktrees and generated output are explicitly outside the application lint perimeter. |
| Schemas and registries | SQLite and materialized PostgreSQL Prisma schemas validate; release-evidence and AI-model registries validate; production dependency audit reports zero known vulnerabilities. |
| Production build | Next.js `16.2.11` compiled, type-checked and generated `173/173` pages. |
| Local runtime smoke | `/api/live` returned `200` with exactly `{ "status": "ok" }` and `no-store`; `/confirm-subscription` returned `200`; `/admin/database` redirected to `/admin/login`; `/` returned `200` with server-rendered and loading headings. |
| SQLite initializer | A fresh fallback database reported `31` application tables, `16` applied migrations, WAL, `busy_timeout=5000` and successful integrity check. |
| WAL-consistent backup | With a committed row still present in the live WAL, the initializer backup passed integrity checks and contained the marker row, proving that the backup path did not copy only the main database file. |
| Candidate package rehearsal | A workspace-snapshot Hostinger ZIP passed allowlist, path, secret, symlink, extracted-metadata and non-empty source-state-digest verification with `1,193` entries. This is validation evidence, not the final immutable artifact or checksum. |

The original failure modes no longer reproduce in the focused tests: a managed
request without trusted identity receives its own `503`; a decompression bomb
is rejected while an ordinary bounded gzip response decodes; two full scans
cannot acquire the same lease; a failed or stale scan is closed or recovered;
an expired confirmation token does not activate a subscriber; and a v2 export
missing any authoritative table is rejected even when its encryption is valid.

## Deployment observation

The final Hostinger artefact (`r2`) has SHA-256
`4891d9f4db3e2651ca21804fb7ff28deb03d23ae789e773d252d53435561bb44`.
It passed `11/11` staging controls and was promoted without changing the
checksum. A database backup was created before migration.

The production manifest reports `4.0.0-beta.2`; `/api/live` returns the minimal
credential-free response; and the protected database check reports `31/31`
tables, `16/16` migrations, integrity `ok`, WAL and `busy_timeout=5000`.
Hostinger proxy overwrite behaviour was verified in both staging and
production. The post-deployment self-audit recorded eight passed controls, one
hosting-layer CSP attention item and one external independent-test item.

## Remaining production evidence and gates

- SMTP delivery receipts and live confirmation-mail observability remain
  operational evidence outside the source test.
- The application CSP still requires complete alignment with the Hostinger
  response layer; HSTS, `nosniff` and `X-Frame-Options: DENY` are active.
- Independent dynamic testing remains external and is not self-certified.
- PostgreSQL cutover, object storage, canonical reads, workspaces, accounts,
  billing and multi-tenancy remain separate production gates.

## Explicit non-claims

This audit combines separately identified source, staging and production
observations. It is not a penetration test, legal opinion, accessibility
certification, availability guarantee, SMTP delivery receipt, PostgreSQL
cutover approval, object-storage activation or canonical-read authorization.
