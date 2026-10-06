# PolicyWatcher 5.0.0: Your Services, Your Choices

**Published:** 6 October 2026. Staging and production deployment completed; see the [verification record](../reports/policywatcher-5-2026-10-06/README.md).

The new **For you / Per te** journey connects public policy-change evidence to a citizen's own services and choices. It is available in Italian and English at `/per-te`, with a responsive layout and no account requirement.

- Follow selected services locally and read concise automatic summaries alongside dated source evidence and bounded before/after passages.
- Consult six curated official guide families, with review dates and an explicit review-due state.
- Record a reviewed, action or remind choice on the device. A later published update can reopen attention for that service.
- Match a pasted notice against the available public metadata locally and preview or download a support-request draft. Pasted text is not sent to the server or retained in the preference store.
- Start or stop reading aloud explicitly; use keyboard navigation and enlarged text; recover or reset corrupt local preferences.
- Access the additive, read-only `/api/v1/citizen-feed` with stable pagination and the existing public-evidence gates. Freshness, unavailable evidence and unknown values remain explicit.

The European Commission's terms-and-conditions archive provides valuable source infrastructure. PolicyWatcher positions its citizen journey around understanding and practical access to evidence; it does not claim to be the first archive of digital-service terms, an EU service, or a compliance certification.

The Android companion shares the citizen model, official guides, local choices and notice-support flow. A development APK and production JavaScript bundle were built locally. Physical-device acceptance, push notifications and app-store distribution are separate work; this web release does not claim they are available.

## Compatibility and validation

This is a product major release. Existing public v1 API contracts remain in place; the citizen endpoint is additive. There is no new schema migration relative to the beta.5 source baseline. Browser-extension and Android package versions remain independent of the website version.

The implementation validation is recorded in `docs/citizen-experience-validation.md`. Hostinger publication must use one committed source ZIP, pass the staging checks and promote the exact verified checksum. The deployment receipt records the actual publication outcome separately from these release notes.
