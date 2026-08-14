# Security Warning Assessments

This page is the repository record for dependency warnings assessed on 2026-08-06.
It preserves scanner input rows, including duplicates, and records reachability,
remediation, and verification evidence.

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
