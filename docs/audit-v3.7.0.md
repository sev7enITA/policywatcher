# Release 3.7.0 — Focused Lateral Red-Team Review

Date: 2026-07-21
Scope: changes from `origin/main` through the 3.7.0 release candidate, with emphasis on the public policy-inquiry boundary and Hostinger database startup.

## Security invariants

- Raw notification content, email addresses, subjects and content-derived fingerprints do not cross the browser boundary or enter SQLite.
- Public answers use only evidence admitted by the public policy/change gates.
- Unknown sources are not fetched until an administrator approves onboarding.
- At most one active inquiry exists for a deduplication key, including under concurrent requests.
- Production startup executes only the Prisma CLI installed from the reviewed lockfile.
- A fallback-created migration is marked applied only after its complete table, column, default, foreign-key and index shape is verified.

## Findings closed

1. **Concurrent inquiry duplication (low).** Replaced the read-then-create race with a nullable, unique `activeDedupeKey`. A unique-conflict path returns the already-active inquiry; terminal transitions clear the key so a legitimate later request can be created.
2. **Mutable Prisma CLI execution (high).** Removed `npx prisma` and `npm exec -- prisma` from production startup. The bridge uses the local lockfile-installed binary or an in-repository Node/Python fallback and otherwise fails closed.
3. **Partial migration false-positive (medium).** Replaced table-name-only detection with DDL-aware validation of columns, types, required/default/primary-key properties, foreign keys, index uniqueness and index columns.

## Validation boundary

The review combined a repository threat model with two focused independent reviews of the highest-risk changed surfaces. The canonical exhaustive multi-worker discovery workflow did not complete its artifact receipts within the available run, so this document does not claim an exhaustive security certification. Full release gates and extracted-artifact smoke results are recorded in the generated release manifest/checksum handoff.
