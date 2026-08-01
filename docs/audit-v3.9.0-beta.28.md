# PolicyWatcher 3.9.0 Beta 28 audit

Date: 1 August 2026

## Delivered contract

- Three public `GET` operations: capabilities, change brief and Observatory brief.
- OpenAPI 3.0.0 description with flattened JSON responses and no response array types or schema composition.
- Strict query allowlist, maximum five records, read-only CORS, short cache and 30-request-per-minute privacy-bounded rate bucket.
- Public-evidence gate for change records and explicit curated-registry classification for Observatory signals.

## Verification

- TypeScript and ESLint checks cover new routes and libraries.
- Focused tests cover bounded parameters, flattened response fields and cross-platform schema constraints.
- No mutation endpoint, prompt transcript, contract body, credential or private tenant record is accepted.

## Residual boundary

The gateway can return incomplete or empty results because source evidence is unavailable, withheld or unmatched. Empty does not mean absent. Output is research evidence, not legal advice, compliance certification or exhaustive monitoring.
