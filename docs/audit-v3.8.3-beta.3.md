# PolicyWatcher 3.8.3 Beta 3: Store Typography Correction

Date: 2026-07-23

## Scope

Beta 3 replaces the already uploaded Beta 2 browser package because the extension title is sourced from the localized manifest and cannot be corrected only in the store dashboard.

## Corrections

- Every literal em dash character was removed from tracked application, extension, test, documentation and marketing text.
- Store and popup titles now use a colon: `PolicyWatcher: What changed? BETA` and `PolicyWatcher: Cosa è cambiato? BETA`.
- User-facing sentences were rewritten with commas, colons or full stops where a plain hyphen would reduce readability.
- Notification parsing still normalizes em-dash separators through the escaped Unicode representation `\u2014`; input behavior is preserved without keeping the character in source.
- The app version is `3.8.3-beta.3`; the store-compatible extension version is `3.8.3.3`, displayed as `3.8.3 Beta 3`.

## Release invariant

Beta 3 must pass the same API integration, real Chromium extension smoke, test, lint, TypeScript, dependency audit and production build gates as Beta 2. The limited-Beta evidence cycle remains open and stable promotion remains blocked.
