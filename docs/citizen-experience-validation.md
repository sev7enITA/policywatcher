# Citizen experience: validation record

Date: 2026-10-06. Base: beta.5 document-scope commit `4acc8459a02eee2ac4cc033da84a51f1e2bb410f`.

## Verified locally

| Check | Result | Scope |
| --- | --- | --- |
| Website test suite | 1137 passed; 14 skipped | 174 passing test files; three existing skipped suites |
| New citizen core/API tests | 23 passed | Public gates, cursor order, source freshness, local persistence, notice privacy and support export |
| TypeScript | Passed | Website and critical-test configuration |
| Web lint | No errors | 15 existing navigation warnings outside this feature |
| Web production build | Passed | Next.js build using an isolated fixture database |
| Production dependency audit, website | Zero findings | `npm audit --omit=dev --audit-level=high` |
| Existing artifact validators | Passed | Browser extension package, AI model registry, release evidence ledger |
| Browser citizen journey | Passed | Follow, plan/context, save, record, local notice match, history, download, persistence and English page language |
| Browser failure states | Passed | Corrupt preferences retained/exported/reset; write failure stays session-only; later publication reopens choice; withdrawn catalog retains local selection with unknown status |
| Browser network boundary | Passed | Pasted marker absent from network requests, local storage and exported support draft |
| Browser pagination and timeout | Passed | Three initial cards; local reveal makes no request; historical page makes one request; a hanging feed times out after 15 seconds and exposes retry |
| Browser responsive/keyboard checks | Passed | Desktop, tablet, 375 px, 200% text, focus and anchor visibility |
| Independent interface evaluation | Passed after refinement | Website at 1440/768/375 px and 200% text; companion web preview at 375 px. Header/status overlap and excessive initial history were corrected. |
| Companion unit tests | 18 passed | Migration, storage, local privacy, bounded public requests and history merging |
| Companion lint and TypeScript | Passed | Separate Expo project |
| Companion web export and browser flows | Passed | Local mocked public endpoint, 390/375 px, IT/EN, choices, later review, offline uncertainty, draft download and storage recovery |
| Android Hermes bundle export | Passed | Production JavaScript bundle compilation |
| Android debug compilation | Passed | Gradle `:app:assembleDebug`, including native C++ and Kotlin/Java dependencies |
| Android automatic backup setting | Verified in generated manifest | `android:allowBackup="false"`; native rebuild passed |

The fixture contained three services and 29 deliberately labelled local test changes. No production scan or user database write was performed. Browser checks do not establish that an official provider's account settings were exercised.

## Remaining release boundaries

- Website and citizen feed published as 5.0.0 on 6 October 2026 after 11 staging checks and immutable ZIP promotion. Production health, database integrity, public counts, pagination and browser entry were verified; see [deployment receipt](reports/policywatcher-5-2026-10-06/README.md). The companion public backend is now available; native device acceptance remains separate.
- A development APK was generated, not installed or launched on the connected device. Native TalkBack, actual speech output, system sharing, large-text behavior and device-specific lifecycle checks remain unverified. The debug build is not a signed store release and may require the development bundler.
- No push delivery, background source monitoring, cross-device synchronization or automatic provider-account actions are implemented.
- The companion dependency audit reports findings in its Expo dependency graph, including pre-existing findings and the added sharing package's inherited build-tool exposure. No broad forced SDK upgrade was applied in this feature. Review the compatible dependency remediation separately before distributing a production mobile release.
- A website production build and a passing local suite do not establish a successful public deployment or a PostgreSQL deployment rehearsal.

See [citizen-experience.md](citizen-experience.md) for the data contract, privacy boundary and current-history refresh limits. Official action guides are editorially dated in `shared/citizenGuides.ts`; they do not verify the user's account state.
