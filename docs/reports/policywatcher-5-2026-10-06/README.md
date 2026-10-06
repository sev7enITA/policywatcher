# PolicyWatcher 5.0.0 publication

**Deployed and verified on 6 October 2026.** Entry: https://policywatcher.online/per-te. Public release record: https://policywatcher.online/press-kit/releases/your-services-your-choices-5-0-0.

One immutable 66.90 MiB source ZIP was promoted from independent staging to production. Its SHA-256 is `79ca9a1a5b569cbbfc382bda6c8543d913e50bf76c265fcc3a43931ad7ebfce8`; source commit `05e836a8a114b60f3fdb7647ef1052065d6f6e9a` has the same tree as merged code commit `c39e1f5269c714a808b29b864970af7e7823b25a`. The later documentation commit adds receipts and news copy; it does not rebuild the verified ZIP.

## Verified

- All 11 staging release checks passed, including release identity, admin authentication, the publication gate and database readiness. The explicit user instruction to publish PolicyWatcher 5 authorized promotion.
- Hostinger reports production deployment `01a11251-4365-71cf-b778-9284511d9afa` Completed at 19:46 Europe/Rome, after 2m 17s. Ten deployed release/citizen source-file hashes match the verified ZIP.
- Public manifest reports 5.0.0; authenticated health is `ok`; admin authentication succeeds. SQLite reports 31/31 tables, 17/17 migrations, WAL and integrity `ok`.
- A private WAL-aware SQLite backup and protected environment copy were created before promotion. Complete row fingerprints match before and after for all 12 compared evidence and subscription tables. Operational access counters were intentionally excluded because verification itself changes them.
- Public coverage is unchanged: 18 companies, 113 configured policies, 109 public policies, 34 public policies with an analysis. Four excluded policies remain excluded.
- Citizen feed validates against the shared client contract, returns 18 services and 109 policies, and serves two successive pages of 25 changes without overlap. No-store, rejection of profile query parameters and GET/OPTIONS boundary pass.
- Browser checks cover IT/EN citizen entry, service selection, official-guide availability, local notice matching, support-draft controls, source record and change detail. Homepage, Roadmap, Observatory, Knowledge and admin login load in staging. Production at 375 px has no horizontal overflow. Test selections were removed afterward.
- Local checks: 1,137 website tests passed, 14 skipped; 18 companion tests passed; type checks and production build passed; lint has no errors and 15 pre-existing web warnings. Website production dependency audit has zero findings. PR and main Quality Gate, PostgreSQL portability, CodeQL, Sonar and critical-control coverage passed for the merged code.

## Boundaries retained

The protected production-verification page retains its pre-existing security-header attention: HSTS, nosniff and DENY framing are present, but the hosting CSP is `upgrade-insecure-requests`, without the `frame-ancestors 'none'` directive expected by that check. Independent dynamic security testing remains external. This is not a security certification.

OpenSSF Scorecard failed on the prior baseline and the 5.0.0 main push because `gcr.io` denies access to its upstream action image with a billing-disabled error. This is separate from the passing application release checks; no billing or permission changes were made.

New browser screenshot capture timed out in the available browser integration. DOM, interaction and viewport checks completed; no new production screenshot is claimed. Earlier local visual acceptance remains documented in `docs/citizen-experience-validation.md`.

Android development compilation is complete, but no physical-device acceptance, native store release, push service or cross-device synchronization is claimed. Existing mobile dependency findings remain a separate distribution prerequisite.

## Evidence

- `release-receipt.json`: publication, data preservation and runtime checks, with private locations omitted.
- `staging-verification.json`: the artifact-bound staging result.
- `promotion.json`: the exact-checksum promotion authorization.
- `../../communications/policywatcher-5-news-it-2026-10-06.md`: prepared Italian news copy. It has not been sent or posted to a social platform.
