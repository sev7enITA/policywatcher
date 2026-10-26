# PolicyWatcher 5.2.0 validation

26 October 2026. Integrated onto the 5.1.0 production source baseline (9fd5e57), retaining PDF parsing, strict URL fragments, extraction lineage, silent scan mode, leases and publication gates.

## Local verification

- Full test suite: 1,308 passed under Node 22.23.4 with V8 coverage, 14 skipped across 190 files (187 passed, 3 skipped).
- Focused acquisition/shadow/current-baseline suite: 198 passed across 12 files. Includes real PDF conversion and baseline preservation.
- Actual cron and Prisma rehearsal: 6 passed on disposable SQLite. External transport, model, publication and mail sentinels were not called.
- Canonical Next.js 16.4.3 production build: passed. Web lint: zero errors, 15 existing navigation warnings.
- Production dependency audit after maintenance: zero known vulnerabilities returned by npm audit --omit=dev. This is a dated dependency result, not proof that the application is vulnerability-free.
- Generated extraction profile check, AI model registry and immutable historical release-ledger validation: passed.
- Nine-case synthetic replay: completed; independent live validation remains required before operational eligibility.
- All 69 current press-manifest asset hashes match local bytes. EN/IT fact sheets were rendered and visually inspected. Historical media and editorial packages retain their original files and dates.

## Commands

```sh
npm test
node node_modules/vitest/vitest.mjs run --config evals/scraping/shadow.vitest.config.ts --silent
node node_modules/vitest/vitest.mjs run --config evals/scraping/cron.vitest.config.ts --silent
node node_modules/next/dist/bin/next build
npm run lint:web
npm audit --omit=dev --audit-level=high
node scripts/extraction-profile.mjs --check
npm run release:evidence:validate
npm run ai:registry:validate
node --import tsx scripts/scraping-replay.ts --out <private-temporary-output>
```

The local build used a disposable SQLite path and no production credentials. The cron rehearsal creates and removes its own database. Private captures and credentials are excluded from Git and release artifacts.

## CI correction

The first CI pass identified pathname stat/read races and coverage timeouts in large truncation fixtures. Configuration and storage checks now inspect and read the same opened file. Configuration reads remain bounded if a file grows after inspection. Regression cases cover path replacement, file growth, directories and the 65,536-byte boundary. Truncation fixtures still cross the real 500,000-character guard, with explicit 15-second bounds for instrumented parsing. No check was suppressed and no coverage threshold was lowered.

The public release UI passed review at 1440, 768 and 375 pixels, with no horizontal overflow or JavaScript errors in the reviewed routes. The admin panel matched its previously evaluated component.

## Boundaries

Shadow is disabled by default. There is no automatic promotion, model training, independent calibration or production-pilot activation. Synthetic replay and a prior small functional pilot do not establish accuracy or a production improvement. UI recipe-comparison counts are not unique sources. Missing historical metrics remain missing.

Staging and production publication require their own exact-artifact receipts; local checks alone do not establish deployment.
