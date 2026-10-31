# Engine 6 preview: continued adversarial tests, 31 October 2026

This extends the checkpoint at `077b1d0`; the corrected implementation is saved at `3a47d38`. Engine 6 remains a local experimental candidate, disabled in production. The public website announcement was not redeployed during this work. Observed failures are retained alongside successful retries. The companion evidence JSON and manifest preserve sanitized results and hashes; original policy bodies and credentials are not committed.

## Reproduced defects and corrections

The first adversarial extension reproduced eight failures against the saved candidate: three short hidden-clause cases, one short document-dialog case, three sensitive Italian obligations assigned a low score, and one publication with the same resolved analyst/verifier model. The latter produced a synthetic PolicyChange when it should have held. All were corrected and covered by regressions. Missing model identity and equivalent provider prefixes are also checked; ordinary human approval cannot waive the model-separation gate.

A deeper source audit found a separate extraction defect: the paragraph/list-only strategy omitted real text directly inside div/span/pre elements. A semantic-paragraph-only audit had reported no missing nodes, demonstrating why that restricted metric was insufficient. New tests reproduce missing interleaved clauses, inline qualifiers, table captions and native disclosure summaries. The correction wraps complete inline runs in DOM order, preserves original source bytes in the capture, and avoids duplicating semantic paragraphs/rows. Missing or multiple disconnected document roots now hold instead of silently selecting a partial scope.

The extraction-profile hash changes, so existing baseline-review and replay rules remain mandatory. Parser recovery is not a provider policy update. Generic UI identification remains incomplete: newly retained language/interface fragments require review and exact exclusions or provider adapters where appropriate.

## Frozen real-payload replay

The same first-window payloads were replayed offline under the final extractor. These are not new observations. Compared with the immediately preceding extractor:

| Source | Before | After | Result |
| --- | ---: | ---: | --- |
| AWS Service Terms | 292,225 | 301,235 | Previously absent unstructured clauses retained; 31 missing normalized text-node values become 0 in the bounded audit |
| Google Privacy EN | 90,335 | 91,188 | Effective-date and explanatory text retained; extraction issues still hold |
| Google Privacy IT | 105,928 | 106,965 | Corresponding Italian date and explanatory text retained; extraction issues still hold |
| Microsoft Services | 121,025 | 121,815 | Previously unstructured runs retained |
| Meta Privacy | 54,855 | 54,855 | No explicit root; held, 286 candidate missing text-node values in the body audit |

OpenAI, Apple and Anthropic also gain small amounts of text, including possible interface content; increased length is not itself a quality score. Apple retains its twelve controlled disclosure panels. The PDF representation still lacks verified language/structure, and its stored payload is decoder HTML rather than original PDF bytes. TikTok also lacks an explicit root and remains held pending an adapter.

The committed replay script checks stored payload SHA-256 and reports inclusion of deduplicated normalized text nodes of at least twelve characters. It ignores occurrence counts, some UI scopes, and text absent from the received DOM. Zero misses cannot establish a complete policy. No independently annotated provider corpus or production contract approval is claimed.

## New source window and failure recovery

The new twelve-source probe initially retrieved and extracted **8/12**. AWS DPA and Google EN/IT timed out; Anthropic had a connection reset followed by an HTTP/2 307 response. A separate bounded retry of those four sources with Node automatic address-family selection disabled recovered **4/4**. AWS PDF still required the HTTP/2 fallback after another direct timeout. Both failed and successful attempts are preserved.

Comparing the final twelve successful new responses with the first payloads replayed under the same current extractor gives **12/12 identical text hashes and block arrays**. This demonstrates stability in the bounded sample, not complete policies. These are multiple windows on one date, not three daily windows. No source was promoted because of a retry, no old body was counted as a fresh response, and no public baseline or notification changed.

## Real model execution

The first SDK call failed with a local network timeout. Disabling automatic address-family selection allowed a real analyst response; the former `gemini-2.5-pro` verifier then returned **HTTP 404** despite appearing in the model list. This is evidence of runtime failure for the tested project/method, not a claim of universal model retirement. Google documents access restrictions for legacy 2.5 models; current availability must be tested, not inferred from the catalog. [Google model lifecycle](https://ai.google.dev/gemini-api/docs/deprecations).

The engine no longer silently selects legacy defaults. Both model identifiers must be explicitly configured and distinct. Response receipts retain the requested identifier separately and require a present, different provider-resolved identifier; missing metadata cannot masquerade as an independent verifier. SDK-boundary mocks test absent metadata, two aliases resolving to one model, and rejection before inference when configuration is missing. These are synthetic boundary tests, separate from the following actual calls.

An explicitly selected **Gemini 3.8 Flash analyst / Gemini 4 Argon verifier** pair completed **six authored synthetic cases**: retention, negation/consent exception, date roles, table context, Italian governing law, and an unchanged prompt-injection quotation. All six satisfied structural/span checks and received supported verdicts. The agent also read the bilingual outputs against the fixture expectations. Three remain high-impact cases requiring review; this was not a publication run.

Three deliberately false interpretations with valid exact quotations passed structural checks and were rejected by the real verifier. An additional genuine verifier call also rejected a correct English description paired with a deliberately false Italian translation. All four negative controls pass structural quote checks; this demonstrates why quote matching alone is insufficient. Final validators also replayed the original recorded outputs offline successfully. The corpus and expectations were authored in this task, so this small result is not independent ground truth or a production accuracy estimate. No model pair was promoted automatically.

The initial successful fixture probe used 6 analyst calls (4,464 input / 7,088 output tokens) and 9 verifier calls (9,855 input / 631 output tokens), counting reported thinking tokens in output. The bilingual-only negative adds one verifier call (1,188 input / 73 output tokens). The combined standard-rate estimate is **USD 0.059054**, not an invoice; it excludes previous failed/default-model attempts and separate code-review attempts. Current promotional prices were checked on 31 October; tiny synthetic examples do not support a monthly full-policy cost extrapolation. [Google API pricing](https://ai.google.dev/gemini-api/docs/pricing).

## Measured artifact size and storage scenarios

Serialized capture artifacts in this twelve-source sample average **823,305 bytes**, with a maximum of **2,534,770 bytes**. Ten of twelve artifact hashes differ between the first and latest captures even though all extracted texts match. Hash deduplication therefore does not remove most new raw-HTML evidence in this sample.

Under an explicit scenario of one saved response per source per day, 500 sources and 30 days, the observed mean gives **11.50 GiB/month** if every artifact is new, or **9.58 GiB/month** using the observed new-artifact fraction. These are scenarios from a convenience sample, not production forecasts or upper bounds: they exclude database/WAL/index/backup overhead, baseline stock, extra transports and confirmations; conditional hits and retention can reduce growth. The earlier VPS observation had roughly 13 GB free, so retention, off-host evidence storage and restore sizing remain activation work. No evidence was deleted or storage service purchased.

## Verification and review status

- Full regression suite: **1,401 passed, 14 skipped**, 192 test files passed and 3 skipped.
- Focused Engine/audit suite: **82 passed** (75 engine/model-boundary tests and 7 audit tests).
- Web and critical-test TypeScript passed. Lint has no errors and the same 15 pre-existing warnings.
- Production compilation passed with an isolated local database (`build-release.log`); no remote build or deployment was run.
- The attempted new GLM review did not start: ZCode reported `project_token_request_failed`. A later computer-use attempt found the Mac locked. The user was asked to restore access while terminal tests continued. This candidate must not be labelled GLM-reviewed on the strength of previous-candidate reviews.
- Gemini web attachment/input attempts did not yield a submitted new review. Separate API reviews of the frozen candidate using Argon with HIGH thinking also yielded **no verdict**: an initial failed request, an explicit 120-second abort, a streaming response ending `MAX_TOKENS` at the 12,000-token output budget with no usable answer, and a final 32,768-token-budget stream ending with `UND_ERR_HEADERS_TIMEOUT` after about 304 seconds before any visible output. These are failed/incomplete reviews, not a pass or a finding-free result. The candidate-3 source hashes still match the committed implementation. Its scope was acquisition/claims code, model-boundary tests and pipeline/test diffs.

The completed-but-truncated review receipt reports 12,985 input tokens and 12,000 output/thinking tokens, corresponding to a separate standard-rate estimate of USD 0.14597. Usage for aborted requests was not returned and is unknown here. Neither this cost nor any of the code-review failures is included in the successful fixture-probe cost above. The latest candidate remains pending a completed external code review.

## Remaining qualification

Provider scope adapters (including Meta/TikTok), exact UI/noise review, PDF language/structure/original-byte preservation, independently annotated completeness and change corpus, three actual daily windows, full-document model costs/latency and live false-change measurements remain open. PostgreSQL and production-scale internet throughput remain unqualified. Distinct model IDs do not prove statistical independence. Local successes and external reviews cannot substitute for these activation gates.
