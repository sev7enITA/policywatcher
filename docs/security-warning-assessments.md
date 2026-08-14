# Security Warning Assessments

This page is the repository record for dependency and code-scanning warnings
assessed on 2026-08-06 and 2026-08-14. It preserves scanner input rows, including
duplicates, and records reachability, remediation, and verification evidence.

> Status: resolved in the repository. The dependency update still needs to be
> included in the next production deployment.

## Executive summary

| Item | Before remediation | After remediation |
| --- | --- | --- |
| Vulnerable packages reported by `npm audit` | 2 | 0 |
| Supplied scanner warning rows | 5 | 0 open |
| Additional Undici advisories found during baseline audit | 4 | 0 open |
| Full `npm audit` result | 2 high package findings | 0 vulnerabilities |
| Production-only `npm audit --omit=dev` result | 1 high package finding | 0 vulnerabilities |

The application did not expose the vulnerable APIs on a supported untrusted-input
path before remediation. The packages were nevertheless upgraded to remove the
affected implementations from the dependency graph and close the supply-chain
warnings completely.

## Remediation

| Package line | Previous version | Resolved version | Dependency path |
| --- | --- | --- | --- |
| `undici` 7.x | 7.28.0 | 7.29.0 | `policywatcher -> cheerio -> undici` |
| `brace-expansion` 5.x | 5.0.8 | 5.0.9 | `eslint-config-next -> typescript-eslint -> minimatch -> brace-expansion` |
| `brace-expansion` 1.x | 1.1.16 | 1.1.18 | Four ESLint/minimatch development-only paths |

Only `package-lock.json` required a dependency remediation. Existing compatible
semver ranges already admitted every patched version.

## Warning register

The five supplied scanner rows are retained individually. `SWA-004` is an input
duplicate and remains visible for auditability.

| ID | Advisory | Severity | Affected instance | Pre-fix reachability assessment | Resolution | State |
| --- | --- | --- | --- | --- | --- | --- |
| SWA-001 | [CVE-2026-13697 / GHSA-4cwx-7wf7-3272](https://github.com/nodejs/undici/security/advisories/GHSA-4cwx-7wf7-3272) | High | `undici@7.28.0` | Not actionable on the current path: no shared `interceptors.cache()` usage | Upgraded to 7.29.0 | Resolved |
| SWA-002 | [CVE-2026-69152 / GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895) | High | `brace-expansion@5.0.8` | Not actionable in the application runtime: development-only ESLint path with no untrusted glob input | Upgraded to 5.0.9 | Resolved |
| SWA-003 | [CVE-2026-69152 / GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895) | High | `brace-expansion@1.1.16` | Not actionable in the application runtime: development-only ESLint path with no untrusted glob input | Upgraded all 1.x copies to 1.1.18 | Resolved |
| SWA-004 | [CVE-2026-69152 / GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895) | High | Duplicate report for `brace-expansion@5.0.8` | Same assessment as SWA-002 | Upgraded to 5.0.9 | Resolved |
| SWA-005 | [CVE-2026-14257 / GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) | High | `brace-expansion@1.1.16` | Not actionable in the application runtime: development-only ESLint path with no untrusted glob input | Upgraded all 1.x copies to 1.1.18 | Resolved |

## Additional baseline-audit warnings

The initial full audit found four additional advisories affecting the same Undici
version. They were not present in the supplied list, but are recorded here because
the same 7.29.0 upgrade resolves them.

| ID | Advisory | Severity | Pre-fix reachability assessment | State |
| --- | --- | --- | --- | --- |
| SWA-006 | [CVE-2026-16728 / GHSA-8xcm-r25x-g524](https://github.com/advisories/GHSA-8xcm-r25x-g524) | Moderate | No `interceptors.retry()` use and no Undici-based downstream proxy forwarding | Resolved |
| SWA-007 | [CVE-2026-15157 / GHSA-m8rv-5g2x-5cg5](https://github.com/advisories/GHSA-m8rv-5g2x-5cg5) | Moderate | No direct Undici request API receiving attacker-controlled blob-like bodies | Resolved |
| SWA-008 | [CVE-2026-14643 / GHSA-jr45-8vmc-qm54](https://github.com/advisories/GHSA-jr45-8vmc-qm54) | Moderate | No Undici cache interceptor usage | Resolved |
| SWA-009 | [CVE-2026-16729 / GHSA-v3r7-h72x-cjcm](https://github.com/advisories/GHSA-v3r7-h72x-cjcm) | Moderate | No direct Undici cookie API receiving attacker-controlled cookie attributes | Resolved |

## Reachability evidence

### Undici

- `cheerio` is a production dependency and brought in `undici@7.28.0` transitively.
- PolicyWatcher imports Cheerio in `src/lib/scraper.ts` and
  `src/lib/policyDiscovery.ts`, but calls `cheerio.load()` only.
- No application source calls `cheerio.fromURL()`, `interceptors.cache()`,
  `interceptors.retry()`, or Undici cookie/body request APIs.
- Cheerio's unused `fromURL()` implementation composes the redirect interceptor,
  not the affected cache or retry interceptors.

### brace-expansion

- Every installed copy was marked `dev: true` in `package-lock.json`.
- The copies were reachable only through ESLint/minimatch tooling.
- CI invokes the fixed `npm run lint` script without externally supplied glob
  arguments; the repository ESLint patterns are static configuration.
- Production dependency auditing uses `npm audit --omit=dev`.

## Security invariant

The active dependency graph must not contain a version covered by any warning in
this register. Production source handling must not silently introduce cache,
retry, cookie, blob-body, or glob-expansion paths that accept untrusted input
without a new security assessment.

## Verification record

| Check | Result |
| --- | --- |
| Lockfile contains `undici@7.29.0` | Pass |
| Lockfile contains `brace-expansion@5.0.9` | Pass |
| All 1.x copies are `brace-expansion@1.1.18` | Pass |
| Versions 7.28.0, 5.0.8, and 1.1.16 absent from `package-lock.json` | Pass |
| `npm ls undici brace-expansion --all` | Pass; dependency graph matches the resolved versions |
| Benign `cheerio.load()` compatibility control | Pass |
| `npm audit --audit-level=high` | Pass; 0 vulnerabilities |
| `npm audit --omit=dev --audit-level=high` | Pass; 0 vulnerabilities |
| `npm test -- --run` | Pass; 126 test files and 677 tests |
| `npm run lint` | Pass |
| `npm run build` | Pass; production build and 157 generated routes/pages |

All repository verification gates passed. The dependency remediation is
release-ready.

## Remaining risk

- The assessment is specific to the dependency graph and call paths reviewed on
  2026-08-06.
- A future use of the currently unused Undici interceptors or attacker-controlled
  glob expressions requires a fresh reachability review.
- Repository remediation does not update an already deployed artifact; production
  remains pending until the next release package is deployed.

## CodeQL PR #7 assessment - 2026-08-14

GitHub Advanced Security reported 13 alerts on pull request #7 after the Beta 41
branch was compared with the older `main` snapshot. Each input row is preserved
below. The assessment used the repository `SECURITY.md`: admin authentication,
scraper source handling, evidence telemetry and public workflow configuration are
supported security boundaries; tests and standalone media previews are not
treated as proof of an application exploit.

| Input | CodeQL rule and location | Static pre-fix verdict | Resolution | State |
| --- | --- | --- | --- | --- |
| PR7-001 / alert 58 | `js/user-controlled-bypass`, `renderer/server.mjs` | Not actionable, high confidence: `/healthz` returned bounded process metadata and both sensitive routes authenticated; no supported boundary bypass was established | Authentication now occurs once before every non-health route is selected | Resolved |
| PR7-002 / alert 54 | `js/incomplete-sanitization`, `src/lib/evidenceCollection.ts` | Not actionable, high confidence: the cited helper formatted a constant review checklist and the preceding helper already escaped backslashes | Link-label metacharacters are escaped in one pass and regression-tested | Resolved |
| PR7-003 / alert 4 | `js/incomplete-multi-character-sanitization`, `src/lib/scraper.ts` | Not actionable, high confidence: archive HTML is parsed into plain evidence text and scripts are removed again before extraction | All archive script nodes are removed through Cheerio rather than repeated regex replacement | Resolved |
| PR7-004 / alert 5 | `js/incomplete-multi-character-sanitization`, `src/lib/scraper.ts` | Not actionable, high confidence: same source, sink and boundary assessment as PR7-003 | Same parser-based remediation as PR7-003 | Resolved |
| PR7-005 / alert 59 | `js/missing-origin-check`, standalone social-short preview | Not actionable, high confidence: messages only pause or restart a static animation and change no protected state | Receiver now verifies parent window and same origin; sender uses an explicit origin outside `file:` previews | Resolved |
| PR7-006 / alert 60 | `js/file-access-to-http`, `scripts/ai-bakeoff.ts` | Not actionable, medium confidence: local developer evaluation CLI with trusted adapter configuration, not a hosted request surface | Adapter URLs are now restricted to loopback without credentials; remote VPS use requires an SSH tunnel | Resolved |
| PR7-007 / alert 44 | `js/log-injection`, failed admin login | Confirmed, high confidence, confirmed queue rank 1: an unauthenticated username reached a console template and could alter log-line structure | Console message is constant; the bounded durable access record retains the operational event | Fixed |
| PR7-008 / alert 45 | `js/log-injection`, successful admin login | Not actionable, high confidence: success required the request username to equal trusted operator configuration | Dynamic username was nevertheless removed from the console sink | Resolved |
| PR7-009 / alert 47 | `js/log-injection`, scraper transport error | Needs review, medium confidence, needs-review queue rank 2: runtime error provenance was bounded but not completely established statically | External diagnostics pass through a one-line, length-bounded log sanitizer | Fixed defensively |
| PR7-010 / alert 56 | `js/log-injection`, exhausted scraper cascade | Needs review, medium confidence, needs-review queue rank 1: the aggregate could include transport diagnostics and configured URLs | Target and aggregate reason are one-line sanitized and length bounded before logging | Fixed defensively |
| PR7-011 / alert 57 | `js/useless-assignment-to-local`, webhook readiness client | Not actionable: non-security maintainability warning | Removed the overwritten initializer while preserving the error fallback | Resolved |
| PR7-012 / alert 55 | `js/template-syntax-in-string-literal`, public UI regression test | Not actionable: test fixture only | Literal source assertion now uses a regular expression | Resolved |
| PR7-013 / alert 61 | `js/template-syntax-in-string-literal`, SEO canonical test | Not actionable: test fixture only | Literal source assertions now use regular expressions | Resolved |

### PR #7 verification record

| Check | Result |
| --- | --- |
| Focused application security regressions | Pass; 6 files and 85 tests |
| Renderer security tests | Pass; 7 tests |
| Full Vitest coverage run | Pass; 136 files and 728 tests |
| ESLint and TypeScript | Pass |
| Production build | Pass; 159 generated routes/pages |
| `npm audit --omit=dev --audit-level=high` | Pass; 0 vulnerabilities |
| Golden-set validation and deterministic baseline | Pass |

The only intended unauthenticated renderer surface remains `GET /healthz` with
bounded process metadata. Golden-set challenger adapters remain local-only, and
no CodeQL alert was dismissed as an accepted production vulnerability.
