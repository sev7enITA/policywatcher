# PolicyWatcher 3.9.0 Beta 2 technical and feature audit

- Release: `3.9.0-beta.2`
- Name: Native Dashboard Intelligence
- Date: 2026-07-26
- Deployment target: Hostinger Next.js source application
- Database migration: none

## Verdict

**APPROVE** for controlled production deployment after the release package
integrity checks pass. No open P0 or P1 finding was identified in the release
delta. The application remains a screening and evidence-navigation tool, not a
legal conclusion or compliance certification.

## Audited scope

The audit covers the native dashboard contracts, public data-source registry,
policy detail, regional matrix, risk profile, current risk score, company and
industry comparison, canonical KPI aggregation, accessible chart frame,
bilingual product copy, regression coverage, release metadata and Hostinger
packaging pipeline.

## Findings resolved before release

| Priority | Finding | Resolution |
| --- | --- | --- |
| P1 | Unassessed KPI or company evidence could be rendered as score `0` / low risk in comparisons. | Unassessed KPI values are now null and excluded from radar geometry and winner counts; profiles without public changes return `Not assessed`. |
| P2 | Radar dimensions were paired by array index. | Profiles are joined by stable KPI key and missing counterparts fail closed. |
| P2 | `/api/compare` duplicated generic KPI labels and weights. | Comparison aggregation now uses the canonical, field-specific `metricsCatalog.ts`. |
| P2 | Compare UI bypassed the evidence-first loader. | `/api/compare` is registered as `companyComparison` with allowlisted query parameters and `public-change` gate metadata. |
| P2 | Regional matrix lacked shared provenance, limitations and a complete non-color representation. | `RegionHeatMap` now uses the governed spec/frame, bilingual summary, exact table, visible risk labels and explicit missing cells. |
| P2 | Compare loading and network failures were not represented consistently. | Loading takes precedence over stale content and a localized unavailable state is shown on failure. |

## Functional maturity

Five built-in visualizations now share one non-executable governance model:

1. chronological public risk trend;
2. current policy risk profile;
3. current public risk score gauge;
4. regional risk matrix;
5. company or industry KPI benchmark radar.

Every visualization declares a compiled renderer, source ID, evidence gate,
bilingual copy, deterministic scale, summary strategy, exact-value table,
non-color encodings, reduced-motion behavior and explicit limitations. The
renderer registry contains metadata only and cannot resolve arbitrary modules,
callbacks or serialized code.

## Evidence and data-integrity boundary

- Policy details and comparisons remain limited to evidence-gated public API
  records.
- Missing region/perspective cells are `Not assessed`, never low risk.
- `Not assessed` KPI values do not create a false safer result.
- Industry averages describe the currently available cohort and retain that
  limitation in the UI.
- The same canonical KPI concern ordering is used by normalization, audit,
  matrix and comparison paths.
- No schema change, destructive data operation or new runtime dependency is
  included.

## Security and dependency review

The deployable dependency audit (`npm audit --omit=dev --audit-level=high`)
reports no vulnerability finding in the production tree at audit time. The full development
toolchain audit continues to report the upstream high-severity
`brace-expansion` advisory through ESLint plugins. The proposed automatic fix
requires a breaking ESLint 10 transition; the affected packages are not shipped
in the Hostinger runtime archive and process repository-owned lint patterns,
not public application input. This remains a documented development-only
exception rather than a forced incompatible override.

## Verification gate

The release is accepted only after all of the following complete successfully:

1. 302 Vitest tests across 53 files;
2. TypeScript validation without emit;
3. ESLint with zero application errors;
4. Next.js production build;
5. `git diff --check`;
6. production dependency audit;
7. clean tracked Git state after commit;
8. Hostinger traversal, secret, runtime, database, test and symlink exclusions;
9. extracted package metadata parity;
10. SHA-256 checksum generation.

## Deployment checks

After upload, preserve the production environment and SQLite database, install
locked dependencies, build, and start through `npm start` / `server.js`. Smoke
test the homepage, one policy detail with regional impacts, company A/B compare,
industry benchmark, trend and matrix APIs, CSV export, methodology pages and
protected admin login.
