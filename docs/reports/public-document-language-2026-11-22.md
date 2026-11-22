# Public document-language reconciliation - 22 November 2026

The source inventory found three routes with real Italian copy but an English root document language: `/press`, `/press/cases/[slug]`, `/briefing/comparison/[id]`. The shared helper selected English for those URLs even though their page consumers selected Italian. Proxy forwards that helper result to the root layout; persistent DocumentLanguage also uses it. This fix adds only these three route shapes to URL-selected language routing, preserving default/unsupported-language English and English-only/protected paths.

## What changes

- Press registry retains its real EN/IT page and metadata, with one shared query-language parser.
- The two source-registered press cases gain localized title, description, canonical and alternates. Unknown case slugs still return notFound. Original historical case statements remain unchanged.
- Shared comparisons retain public-record/pair validation and `robots.index=false`. Localized metadata preserves all four required query identity fields: before/after SHA256 and from/to versions. A bare ID would point at an invalid comparison. Missing/malformed/noncanonical version arguments remain unavailable; no protected/publication gate is widened.
- No scraper, extraction, validation, publication, model, VPS or frozen-candidate code changes. The engine implementation identity is nevertheless refreshed because its proxy import closure includes the SEO helper. It is a new source candidate, not equivalent to hosted Preview or the frozen qualification cohort.

## Tests and falsification

The new consumer suite renders the **actual route pages within the actual root layout**, using the real proxy's forwarded locale header. Root request/font APIs and the database are controlled test boundaries; synthetic snapshots are never sent to production. The two real registry case slugs are included. Sixteen document renders cover missing, en, it and unsupported de across the registry, both cases and a valid comparison. Assertions check root html language, actual visible copy, metadata canonical/locale, navigation and comparison identity/noindex. A separate invocation of the actual DocumentLanguage component runs its registered effect with controlled routing hooks/document state. This is an effect-unit check, not real browser hydration or React scheduling.

Replacing **only src/lib/seo.ts** with exact parent 30a5eff bytes makes five of twelve consumer tests fail (Italian document-language/navigation failures), while seven controls pass. Restoring the helper returns the suite to green. The negative log remains committed; no substring-only test is used to claim this rendering fix.

The focused five-file suite passes 55 tests. Source TypeScript, the dedicated consumer-test TypeScript config, focused ESLint and the refreshed implementation manifest are checked separately; their final receipts are retained here. No actual browser, HTTP, database mutation or deployment occurs.

## Published inventory and residual work

[Original inventory](public-document-language-2026-11-22/baseline-inventory/assessment.md) and CSVs retain the **pre-fix**30a5eff source snapshot: 80 pages, 10 layouts, 88 API handlers and 6 other machine/schema handlers. The original three language findings are historical inputs to this fix, not unresolved-current claims. [Consumer matrix](public-document-language-2026-11-22/consumer-matrix.csv) distinguishes executed controlled renders/effects from browser tests not performed.

Other shortlist items remain review leads:16-company optional static-note corpus, bounded temporal qualification wording, shared Edge status, and discovery intent for two routes. Historical 5.2 labels and release dates are preserved. An inventory is not all dynamic records, administrative CRUD paths or authorization roles tested in a browser. No broad source-completeness,500-policy/day, Safari-runtime, independent pentest or deployment qualification is asserted.

## Reproduction

```sh
npx vitest run src/lib/__tests__/publicDocumentLanguageConsumers.test.tsx
npx vitest run src/lib/__tests__/publicDocumentLanguageConsumers.test.tsx src/lib/__tests__/seoCanonical.test.ts src/lib/__tests__/planningReconciliation.test.tsx src/lib/__tests__/browserExtensionPage.test.tsx src/lib/__tests__/publicUiRegression.test.ts
node scripts/engine-implementation-manifest.mjs --check
```

An executable offline negative-control helper is included:

```sh
python3 docs/reports/public-document-language-2026-11-22/reproduce-negative.py --output /absolute/new/negative-output
npx tsc --project docs/reports/public-document-language-2026-11-22/tsconfig.consumer.json --noEmit
```

For a manual negative control, preserve the fixed helper, temporarily restore only `git show 30a5eff:src/lib/seo.ts` in an isolated checkout, run the first command and restore the fixed helper in a finally block. Never perform the mutation in a deployed or shared checkout.
