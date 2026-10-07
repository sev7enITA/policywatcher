# Home and workspace language consistency

The public home used fixed English text while the interactive workspace independently selected Italian. Automatic language also depended on the chosen country, and the document-language synchronizer could reset the HTML language to English.

The homepage, source summary, FAQs, access flow and workspace now use the same language. Initial rendering negotiates the browser's ordered supported languages, or uses the saved explicit choice. English is the fallback when no browser preference matches Italian or English. An explicit translation URL remains a per-view override. Country and language are independent.

Onboarding includes an interface-language selector. Existing local preferences are preserved and mirrored into the essential `policywatcher-language` cookie (only en/it/auto, no identifier, maximum one year) for subsequent server rendering. The privacy page documents this change. Browser-storage failure does not disable language detection. The header and footer follow the active workspace language, and the global control navigates to the chosen version on existing bilingual public routes.

## Verification

- 1,177 web tests passed; 14 skipped under the existing configuration. Four test files rerun after the final server-rendering adjustment: 42 passed.
- Production build and its TypeScript checks passed. Lint: zero errors, 15 existing navigation warnings.
- Ten browser scenarios passed: fresh Italian mobile, fresh English, saved Italian on an English browser, saved English on an Italian browser, Italian country on an English browser, US country on an Italian browser, unsupported French fallback, blocked local storage, explicit English URL, onboarding language choice and reload.
- Four initial HTML requests passed: Italian browser, English browser, saved Italian cookie on an English browser, and explicit English URL overriding that cookie. The public text and HTML language agree before JavaScript.
- Mobile checks: 390 x 844, no horizontal overflow; screenshots attached. Browser tests use an isolated local fixture. Terms acceptance is simulated only in that local fixture, not on the user's production account.
- FAQ JSON-LD and visible FAQ use the same translated data. Source-document titles retain their original names.

## Publication boundary

Prepared from main `08fce31f7d822b516202a7a1a7a2452e35cc41b2`, preserving the evidence-assurance release. The existing application sources in the dirty Desktop checkout were not modified; copies of this report and the release ZIP were added there. No production deployment is asserted in this report. Staging and production require the normal immutable artifact workflow in `docs/hostinger-staging-promotion.md`.

This fixes the reported home/workspace language split and shared preference resolution. It is not an assertion that all historical documents and every separately authored public page have been translated.

## Verified staging candidate

Hostinger reports **Completed / Current** for `PolicyWatcher-5.0.0-hostinger-2026-10-07-language-consistency-r1.zip`. SHA-256: `cc91e1875f512222d502e9bc1b05e59e2bc278ef3d8ba8d5ca02f50e77b71743`. Source revision: `3ebdca4d690700ca10be10a8e9589e8f6f7b0b70`.

All 11 staging smoke checks passed at 2026-10-07T06:06:57.377Z. Nine browser scenarios passed against the deployed staging site; onboarding acceptance was not performed there. The attached staging screenshot shows the actual Italian homepage. Production promotion awaits the requested human approval.
