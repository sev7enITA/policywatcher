# Search reach implementation - 23 September 2026

This follow-up implements the opportunities identified in the authenticated Search Console audit. The baseline remains in the original search-positioning report; traffic and ranking effects cannot be measured on deployment day.

## Changes

- Three bilingual, source-linked case studies: Meta automated collection wording, the identity of the AWS DPA source, and Anthropic Usage Policy/AUP history. Meta V3/V4/V5 dates and hashes were checked against public-evidence snapshots. AWS and Anthropic each had one public baseline at review time. The articles retain these evidence limits and disclose AI assistance.
- Contextual links from policy and change records to matching guides; dated Article metadata and source citations; discovery through the existing guide index and sitemap.
- One-hop permanent normalization of `www` and redundant `lang=en` on supported public reading routes. APIs, Italian selectors, duplicate selectors and POST requests retain their previous language behavior. Staging stays on its own host.
- Bing ownership metadata, plus a public IndexNow proof file and an explicit URL submission command (`npm run seo:indexnow -- /changed-path`). It checks canonical, indexable, successful pages before submitting. A receipt does not prove indexing.
- Change-page main landmark, correct classification heading hierarchy, higher-contrast colors and a two-row desktop header that avoids overlapping navigation.
- Markdown links in `llms.txt` for document consumers. This is not a claimed Google ranking factor.

## Source refresh

A consistent SQLite backup was made before the production scan. SMTP and webhook delivery were unconfigured; the existing mailer returns without transmitting when SMTP is absent. No subscriber digest was triggered.

Scan `1d5b11cf-fb17-44b9-807b-d65a6364e0e4` completed on 23 September: 50 policy records, 46 unique sources, 42 retrieved sources (40 direct, two archival), four unavailable sources. Record outcomes: 40 Available, six Needs Review pending text confirmation, four Unavailable. Eight snapshots and eight change records were added through the existing scanner and publication gates (104 to 112 snapshots; 53 to 61 changes). A provider HTTP timeout ended the waiting request, but the persisted scan subsequently completed with no failure reason. The scan was not duplicated.

Unavailable records: Revolut privacy and terms (blocked access), Amazon Privacy Notice (blocked access), TikTok Community Guidelines (transport timeout). An archive rescue is not proof of a current live provider document. Existing source and classification gates remain intact.

## External services and release status

Google accepted sitemap submission, but initially reported that it could not read it. Independent HTTP retrieval returned 200 and valid XML with 318 URLs before the refresh. This is not an indexing success claim. Bing was added to the existing account and awaits the deployed ownership token. Final release and submission results will be recorded separately after staging and production verification.

## Validation

Before packaging: TypeScript, critical-test TypeScript, web/mobile lint and 1,120 tests in 169 files passed. A local production build and sitemap smoke passed. The local database is a synthetic fixture; source-bound links are verified on production where those records exist. The Hostinger artifact must pass staging verification before the identical ZIP is promoted.

## References

- [AWS source](https://docs.aws.amazon.com/whitepapers/latest/navigating-gdpr-compliance/aws-data-processing-addendum-dpa.html)
- [Anthropic source](https://www.anthropic.com/legal/aup)
- [IndexNow setup and limitations](https://www.bing.com/indexnow/getstarted)
