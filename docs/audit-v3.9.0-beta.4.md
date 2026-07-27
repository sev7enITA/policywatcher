# PolicyWatcher 3.9.0 Beta 4 release audit

- Release: `3.9.0-beta.4`
- Audit date: 27 July 2026
- Scope: public pages, public explanatory components, press kit, press fact sheet, outreach guide, README, changelog and release metadata
- Browser extension track: unchanged at `3.8.3-beta.3`

## Editorial objective

Public copy describes implemented behavior, configured scope, recorded dates, evidence boundaries and known limitations. It does not use security audit counts as vulnerability guarantees, does not present AI output as factual determination and does not imply exhaustive coverage, continuous updates, certification or independent validation.

## Changes reviewed

- Removed promotional superlatives, narrative comparisons and labels such as `truthful`, `world-class`, `publication-ready` and `Evidence, not hype` from selected public and distribution surfaces.
- Replaced vulnerability-count language with a point-in-time dependency-audit description and an explicit non-certification boundary.
- Replaced `real-time` wording with source-specific retrieval and review intervals.
- Replaced generic verification claims with the relevant recorded state: configured, published, evidence-gated, manually reviewed or unavailable.
- Replaced generic `open source` wording with `public repository under CC BY 4.0` where the repository and license are the supporting facts.
- Rephrased privacy boundaries as payload exclusions and API behavior where those controls are implemented.

## Regression control

`src/lib/__tests__/publicClaimLanguage.test.ts` checks selected public surfaces for a maintained list of prohibited promotional and absolute phrases. This is a wording control. It does not validate source data, the deployed environment, third-party status or the correctness of analytical output.

## Release boundary

The review is limited to tracked release surfaces. Historical research documents, source quotations, internal code comments, type names and operational invariants are not automatically rewritten because their terms may describe historical wording or enforce application behavior. The production build and Hostinger artifact must still pass the repository test, lint, build and package-integrity checks before deployment.

## Verification result

- Vitest: 346 tests passed across 58 files.
- TypeScript: `tsc --noEmit` passed.
- ESLint: no product errors; one warning was reported in an unrelated untracked file under `tmp/`, which is excluded from the release.
- Next.js production build: passed, including 66 generated application routes.
