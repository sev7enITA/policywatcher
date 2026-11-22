This review records the ca4d2ab static checkpoint. The subsequent 31cb963 anchor fix was separately exercised in the compiled browser, including reload. Hosting delivery evidence belongs to the publication receipt.

# Independent static review: cumulative public workflow documentation

**Reviewed stable source:** `ca4d2ab43cf0aa3abf152a3e69bae31dcb90a860`.
**Verdict:** APPROVE within static-review scope. No remaining demonstrated P0/P1/P2 publication blocker in the reviewed changes. Dynamic build, HTTP/CSP propagation and browser behavior are the publishing agent's separate checks; they were not executed by this review.

## Fixed public route and security boundary

`src/app/engine-6-preview/workflow/route.ts` reads one fixed public Italian documentation artifact. No URL/query parameter selects a file. It requires the proxy's nonce, constrains its characters/length before HTML insertion, injects a self-origin base and nonces the script/style elements. The source has one exact `<head>` and two script tags (non-executable JSON data and local `atlas.js`). The existing global proxy CSP is unchanged. The route uses HTML content type, no-store and nosniff; missing/invalid nonce returns a 503 rather than falling back to an unsafe response. No private engine, database, model or publishing API is called by the route.

The static EN/IT index pages have an external same-origin stylesheet and no script/style blocks or inline event handlers. Their main interactive link uses the dedicated nonce route, explicitly labelled Italian. Original technical diagrams retain English labels and the overview/full original atlas is labelled Italian. The global CSP's strict-dynamic script rule therefore does not need to be weakened.

## Concrete issues identified and corrected during preparation

- The newsroom initially used one hardcoded English research-index URL even for Italian labels. Its evidence link now targets `/engine-6-preview#workflow-audit`; existing locale routing preserves EN/IT, and the notice selects `index.html` or `index-it.html` explicitly.
- Static indices initially offered a normal direct link to the unnonced interactive HTML. Under the unchanged CSP, that secondary path would have opened controls with their script blocked. That link was removed; README now identifies the online nonce route and the complete ZIP for offline use. No direct unnonced entrypoint remains linked by the indices at the reviewed checkpoint.

## Static evidence and consistency

- Embedded model checkpoint: `3eabf9d8b420efb13debfcd8b6e378e81a2c4c61`.
- Model counts match public copy: seven diagrams, 109 source-reference rows, 28 gates, plus the separately described overview.
- The report's verification JSON records 1,865 passed / 14 skipped, one P1 and four P2 corrections, five negative controls, and separates focused reruns from the full-suite total.
- External-model receipt JSON distinguishes capped initial answers from completed focused opinions and records zero cost. Public wording does not claim that models executed tests, Gemini/GLM 5.3 MAX answered this audit, or external certification occurred.
- Public EN/IT text distinguishes candidate code/documents from deployed private r3 and the stable scanner, explicitly keeps attachment-bearing policies observation-only and leaves independent source completeness, general semantic accuracy and 500 successful daily full-pipeline completions unqualified.
- New client-side imports use a display-only component with local CSS and Next Link; it contains no server-only imports or side effects. The same component also works in the server-rendered methodology/Preview pages.
- Relative href/src targets in the three HTML entrypoints were checked and existed. The evidence ZIP contains 51 entries, passes ZIP CRC and does not recursively contain itself. No .env/database/private-key files were found by filename scan; this is not a secret-scanning certification.

No application source, Git state, hosting, database, real-policy endpoint or browser session was modified by this reviewer. No live publication or successful deployed-runtime claim is made here.
