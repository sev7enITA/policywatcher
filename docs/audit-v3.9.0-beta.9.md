# PolicyWatcher 3.9.0 Beta 9 release audit

- Release: `3.9.0-beta.9`
- Date: 27 July 2026
- Scope: verified browser-store distribution
- Browser extension: unchanged at `3.8.3-beta.3`

## Delivered behavior

- The public Browser Extension page links directly to the verified Chrome Web Store listing.
- Chrome, Edge and Safari expose independent availability states instead of a shared submission-planned message.
- Chrome is identified as published. Edge is described as having no verified official Add-ons listing yet. Safari remains unavailable with signing and review stated as external prerequisites.
- Public summaries on the homepage, Press Kit, privacy guidance, changelog, release impact and supporting documentation use the same scoped distribution state.
- Store actions accept only HTTPS links on the expected official store host; unverified destinations remain non-interactive.

## External verification boundary

The Chrome statement is supported by a public listing resolving on `chromewebstore.google.com` on 27 July 2026. Searches of Microsoft Edge Add-ons did not identify a verifiable official PolicyWatcher listing. This is reported as an unverified listing state rather than an absolute claim that no submission exists. Store publication does not establish adoption, endorsement, stable-release readiness or behavior beyond the listed extension package.

## Verification gates

- Automated suite: 362 tests passed across 61 files.
- TypeScript validation: passed.
- ESLint validation: no application errors; one warning remains in an unrelated untracked temporary deck script.
- Production Next.js 16.2.11 build: passed across 86 generated routes.
- Press package regeneration: 18 assets and two localized packages generated for Beta 9.
- Deployable dependency audit: no advisory reported by `npm audit --omit=dev` at the time of execution. This is a point-in-time tool result, not a security certification.
- Independent desktop and mobile UI evaluation: passed at 1440 px, 768 px and 375 px after correcting the Edge compatibility wording; no horizontal overflow or console errors were reported.
- Hostinger archive integrity and checksum validation: performed after the release commit.
