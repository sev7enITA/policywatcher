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

Gemini 4 High review is pending. The first browser attempt searched but yielded no retained final answer; reload returned to a new chat. A bounded retry using the supplied facts was requested without further browsing.

## Evidence boundaries

The r3 run did not reach AI analysis or verifier execution, and both ledger tables remained empty. The three-date observation belongs to frozen candidate `050af19`, not r3. Search eligibility, indexing, ranking, referral traffic and AI citations are different outcomes; no improvement in those outcomes is yet measured.

Google states that normal SEO fundamentals apply to AI features and that no special AI file or schema is required: [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features). The llms.txt update is an optional source guide, not an asserted ranking factor. No FAQ rich-result promise or invented review rating is added.

## Verification and delivery

Local checks: 25 existing release, press-kit and canonical tests passed; scoped ESLint passed. The isolated production build passed. The local sitemap crawl passed 168 URLs with zero failed checks or duplicate titles (empty isolated database, so this is not the live catalogue denominator). The final local content check passed 43 assertions across EN/IT pages, RSS, AI-reader guide, sitemap and diagrams. Delivery is pending. Failed attempts are retained under `output/seo-preview-r3-20261107`.

The content candidate must pass staging before production. Temporary staging maintenance must restore the exact private r3 archive (`e82ff8ff3fe33275e62475054889cdaf97f1a12d7442bb0ca6d42ec30cf99341`) and preserve its dedicated database and all three saved reports. No new scans are required.
