# PolicyWatcher 3.9.0 Beta 20 release audit

Date: 2026-07-29

## Release scope

Beta 20 adds a public receiver-verification readiness surface for a candidate HMAC-SHA256 webhook contract. It does not enable endpoint registration, subscriptions or outbound delivery.

## Implemented changes

- `/developers/webhook-readiness` provides a browser-local verification workbench using Web Crypto.
- `/api/v1/webhook-verification-kit` publishes a versioned read-only contract, exact header names, signed-input format, deterministic public test vector, receiver checklist and Node/Python examples.
- Server helpers reject empty secrets, invalid timestamps, stale messages, malformed signature headers and digest mismatches.
- Server-side digest comparison uses `timingSafeEqual` after strict fixed-length hexadecimal parsing.
- The test vector identifies its historical freshness reference and is explicitly limited to signature-compatibility testing.
- The JSON Schema, public API manifest, Developers page, Integration Hub, Community Roadmap, Feature Atlas, sitemap and public documentation expose the same contract and boundaries.

## Data and security boundaries

- The browser workbench does not submit or persist entered secrets, timestamps, bodies or signatures.
- The public test secret is intentionally non-secret and must not be reused in production.
- Production receivers remain responsible for current-time freshness, replay storage, tenant-owned secret management, controlled key rotation and bounded operational logging.
- No endpoint URL, subscriber identity, recipient, credential, production secret or delivery result is accepted or stored by this release.
- The public kit uses read-only CORS, a dedicated bounded rate bucket and explicit cache controls.

## Verification

- Automated tests: 464 passed across 84 test files.
- TypeScript: passed.
- Scoped ESLint: passed.
- Next.js production build: passed.
- Responsive desktop and mobile screenshots showed no document-level horizontal overflow.
- Release packaging checks enforce committed source, version consistency, required webhook files, path safety, database exclusion, environment-secret exclusion and SHA-256 generation.

## Interpretation boundary

Passing the deterministic vector confirms compatibility with that exact fixture. It does not confirm endpoint identity, secret custody, production freshness, replay resistance, successful delivery, service availability or implementation security outside the tested path.
