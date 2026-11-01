# Engine 6 CodeQL review, 1 November 2026

Review scope: PR #37 merge revision `4cd0084f67e2ca953bd6501007c53b50e3769a13`, CodeQL analysis `2073032609`, created at `2026-11-01T21:52:45Z`. Alert numbers refer to that analysis, before the fixes described below. Its original SARIF is retained privately at `output/hosted-preview/codeql-20261101/analysis.sarif.json`; paths and lines in this report identify the analyzed revision.

No alert was dismissed and no query suppression was added during this review. A successful local test does not establish that the subsequent GitHub code-scanning gate has passed.

## High-severity filesystem races

| Alert | Analyzed location | Correction |
| --- | --- | --- |
| 80 | `scripts/engine-extraction-replay.ts:31` | Replace pathname `stat` followed by pathname `readFile` with one no-follow, nonblocking file descriptor. Inspect and read that same descriptor, reject non-regular or multiply linked files, and enforce the byte budget while reading even if the file grows. The capture hash check remains mandatory. |
| 81 | `scripts/engine-preview-bootstrap.ts:126` | Remove the check-then-create sequence. Exclusive creation arbitrates competing initializers; an existing empty database is rejected as initialization in progress. Existing populated databases are opened without following links and permit only an unchanged-input no-op. The private parent directory must be owned by the operator and not writable by group or others. Permission changes use the held descriptor. |
| 82 | `scripts/engine-reviewed-exclusion.ts:13` | Use the same descriptor-bound, bounded read after checking the local output boundary. Replacing the pathname after it is opened cannot redirect the read to another file. The tool continues to produce a draft only and cannot approve or save a source contract. |

Six focused tests exercised pathname replacement after open, growth after metadata inspection, exact and excessive byte limits, symbolic/hard links and directory inputs, a FIFO without a writer, and concurrent-initialization protection through the actual bootstrap CLI. All six tests passed, as did ESLint and TypeScript. The fix assumes the operator controls the private workspace; it does not isolate mutually hostile processes running under the same operating-system account.

## Medium-severity data-flow alerts

The `js/http-to-file-access` alerts all originate from the renderer `fetch` at `src/lib/scraper.ts:1186` in the recorded SARIF. The first four traced renderer branches are infeasible for their callers, whose transport lists contain only `direct` and `http2`. These callers still intentionally retain HTTP evidence obtained through their actual transport paths. The renderer probe exercises the renderer path directly.

| Alert | Sink and exact data | Assessment and boundary |
| --- | --- | --- |
| 83 | `src/lib/scraper.ts:1193`, `JSON.stringify({ url })` in the renderer request | The file-derived value is `source.url`, selected from the corpus JSON read at `engine-acquisition-probe.ts:14` or `engine-renderer-probe.ts:18`. The SARIF does not trace a private configuration file, credential, entire corpus or source-document body to this sink. The acquisition probe cannot take the renderer branch; the renderer probe intentionally transmits the selected policy URL to its operator-configured renderer. This is expected request input, not evidence of arbitrary file-content exfiltration. |
| 84 | `engine-acquisition-probe.ts:34`, `result.html` to a `.body.txt` file | Intended preservation of received evidence, with a validated corpus ID, a fixed transport suffix and exclusive `wx` creation inside a newly created output directory. The traced renderer branch is unavailable to this probe. |
| 85 | `engine-acquisition-probe.ts:44`, serialized extraction to `.extraction.json` | Intended frozen extraction evidence, including the original HTML in the capture object. The filename derives from the same validated ID, not a response-supplied filename; `wx` prevents overwriting an existing artifact. The traced renderer branch is unavailable to this probe. |
| 86 | `engine-catalogue-probe.ts:47`, `result.html` to `.body.txt` | Intended received-body retention. The basename is a SHA-256-derived URL identifier plus a fixed transport name, written with `wx`. The traced renderer branch is unavailable because this probe selects only direct HTTP and HTTP/2. |
| 87 | `engine-catalogue-probe.ts:63`, serialized extraction to `.extraction.json` | Intended extraction evidence. The basename is a hash of the requested scope; the response cannot choose the output path. The artifact is exclusively created and its result remains held pending independent completeness and contract review. |
| 88 | `engine-renderer-probe.ts:38`, rendered `result.html` to `.body.txt` | A reachable, intentional renderer-to-evidence-file flow. The probe is restricted to at most four operator-selected corpus entries, validates their IDs and HTTPS URLs, and writes exclusive fixed-name text artifacts under local output. No HTML is executed or served by this write. |
| 89 | `engine-renderer-probe.ts:48`, serialized rendered extraction to `.extraction.json` | A reachable, intentional preservation flow. JSON serialization does not make the embedded HTML trusted; it remains untrusted source evidence. The file is private diagnostic output and does not become a contract, model approval or published policy baseline. |

These seven alerts warrant review as intentional, bounded diagnostic data flows, with the residual conditions below retained. This report does not mark the alerts resolved or alter repository security rules.

## Residual conditions

- Corpus files must contain approved public policy URLs. These CLI tools are not public ingestion endpoints. The renderer receives the selected URL, which can still contain a path, fragment or query string; operators must not place confidential URL tokens in a supposedly public corpus.
- Renderer configuration is operator-controlled. Its authorization credential is intentionally sent to the configured service through the separate authorization header; it is not the file-data flow identified by alert 83. Endpoint trust and configuration protection remain operational requirements.
- Direct transport uses its existing network body bounds. The bundled renderer defaults to a 5,000,000-byte HTML limit and permits a configured maximum of 10,000,000 bytes. Engine extraction rejects input over 5,000,000 bytes. However, the renderer client currently parses the response JSON without an independent byte cap, and the probe retains raw HTML before extraction. A misconfigured or compromised renderer can therefore consume additional memory or disk. Do not describe the renderer client itself as independently byte-bounded. Addressing this in the frozen acquisition implementation requires a separately recorded change and a new qualification cohort.
- Source-count limits, timeouts and per-origin pacing constrain diagnostic runs; they do not guarantee a total disk-space budget. Existing artifacts and earlier failures are retained rather than silently overwritten.
- Output filenames are constructed locally from validated IDs or hashes. The `output/` tree is ignored by Git and is not a public Next.js asset directory. Its HTML and JSON files must remain diagnostic data, not be moved into an executable or publicly served directory without a separate review.
- The local workspace boundary is not protection against a hostile process with the same account and write access to the directory hierarchy. Private directory permissions and operator control remain required.

The three acquisition probes and `src/lib/scraper.ts` were not modified in this review. The frozen daily qualification manifest and prior capture evidence were preserved.
