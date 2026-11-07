# Engine 6 Preview r3: public discovery and communication update

## Scope and observed problem

The public product remains **5.5.0**, released on 2 November. Private Preview r3 was deployed on 7 November. The public changelog displayed only stable and historical release records, leaving the new Preview work invisible in that view.

Direct HTTP inspection on 7 November returned 200 for the homepage, both notebook languages, the 5.5 release, robots, sitemap and llms.txt. The notebook visibly said 6 November but its `time` attribute said 1 November. Its sitemap date remained 2 November. The optional AI-reader guide still described multi-day qualification as pending without identifying the separately completed frozen cohort. Public robots allowed crawling; no crawler-policy change was necessary.

## Implemented public changes

- A separate `research` newsroom record announces r3 without changing stable 5.5.0 or its publication date. The changelog shows this research update before the stable release; homepage, roadmap, site atlas, feature atlas and press room expose the same distinction.
- EN/IT notebook content records the deployed ledger schema, the bounded run, preserved data and explicit residual limits, with a pinned receipt. An additional entity diagram separates database foreign keys from application references.
- Visible answers explain public availability, private administrator access and why the local 500-endpoint trial is not full 500-policy/day qualification.
- Notebook dates, descriptive article titles, localized newsroom sitemap entries, RSS modification freshness and llms.txt references are aligned. TechArticle JSON-LD describes the visible notebook, named author and evidence references. Existing NewsArticle metadata follows the new research record.
- Promotion drafts are provided separately for review. No paid advertising or social submission is part of this implementation.

## Independent model review

GLM-5.3 Max reviewed the stable baseline and read-only public pages in ZCode. It identified stale notebook dates, RSS channel freshness, missing notebook links in llms.txt and the need for a separate research record. These findings were independently verified and addressed. Its advice to retain the outdated multi-day qualification sentence verbatim was not adopted: the wording now identifies the completed frozen candidate separately from r3. Its proposed headline called r3 a restoration; this update instead says deployed, matching the recorded migration and rollout. Review is advisory, not an executed qualification or measured search outcome.

Gemini 4 Argon High returned a second, explicitly advisory review of the supplied facts. It recommended separating stable and experimental entities, release and modification dates, public documentation and authenticated staging, and EN/IT wording. These boundaries are represented in the candidate. Its suggestion to date the new research article as 2 November was not adopted: that would misdate a new 7 November record; the original stable release retains 2 November. Additional SoftwareApplication entities were not necessary to express the visible notebook accurately. Its unsupported absolute statement about Google ignoring llms.txt was not adopted; official Google guidance supports only the narrower claim that no special AI file is required. The first browser attempt yielded no retained final answer; both attempts are distinguished from executed checks. The completed review is retained as gemini-review.txt in the evidence folder.

## Evidence boundaries

The r3 run did not reach AI analysis or verifier execution, and both ledger tables remained empty. The three-date observation belongs to frozen candidate `050af19`, not r3. Search eligibility, indexing, ranking, referral traffic and AI citations are different outcomes; no improvement in those outcomes is yet measured.

Google states that normal SEO fundamentals apply to AI features and that no special AI file or schema is required: [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features). The llms.txt update is an optional source guide, not an asserted ranking factor. No FAQ rich-result promise or invented review rating is added.

## Verification and delivery

Local checks: 25 existing release, press-kit and canonical tests passed; scoped ESLint passed. The isolated production build passed. The local sitemap crawl passed 168 URLs with zero failed checks or duplicate titles (empty isolated database, so this is not the live catalogue denominator). The final local content check passed 43 assertions across EN/IT pages, RSS, AI-reader guide, sitemap and diagrams. Production delivery is pending. Failed attempts are retained under `output/seo-preview-r3-20261107`.

The content candidate must pass staging before production. Temporary staging maintenance must restore the exact private r3 archive (`e82ff8ff3fe33275e62475054889cdaf97f1a12d7442bb0ca6d42ec30cf99341`) and preserve its dedicated database and all three saved reports. No new scans are required.


### Staging delivery checkpoint, 7 November

The immutable stable content archive `e3ee594d19ac57310b633a5b7213b3aa83b61779110b6cc01f54c3a28841f962`, source `9b18f5569205da7e682d0681c47cc9535e75e6d8`, was submitted to staging as deployment `01a1b6be-30f4-7190-882d-b441f6f2b05a`. Eleven operational checks, 43 EN/IT content assertions and 37 deployed source-file hashes passed. The first operational check received HTTP 503 for the homepage; the other ten checks passed, a separate later request returned 200, and the subsequent complete eleven-check run passed. The first content run timed out; the subsequent complete 43-check run passed. These failures are retained and their cause is not established.

The Mac locked during this operation. The final hPanel Completed/Current display has not been verified. **Staging currently serves the stable content candidate; restoration of the exact private r3 archive and its original environment is still required. Production has not changed.** The dedicated Preview database is separate from the stable staging fixture. Before maintenance, a fresh database snapshot and 14 authenticated read-only checks verified all three saved reports. Restoration must be followed by fresh database hash comparison and the same authenticated checks. No scan was requested.

[PR #54](https://github.com/sev7enITA/policywatcher/pull/54) is open. All six GitHub checks passed on its content head `f063a1b34af70d6cf61183fa46cab702eb971ea2`. This is not a merge or production-delivery receipt. The local handoff includes the original private environment file and exact r3 restore path; private configuration is not committed. Promotional drafts remain unpublished.
