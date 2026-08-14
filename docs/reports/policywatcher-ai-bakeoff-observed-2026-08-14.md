# PolicyWatcher AI bake-off — observed run

Date: 14 August 2026. Golden set: `policywatcher-golden.v1`.

## Decision

Keep the evidence-first production architecture unchanged. Retain deterministic
BM25 retrieval as the accepted baseline. Keep Gemini 3.5 Flash-Lite as an
evaluated structured-output fallback/challenger, not an automatic replacement.
Do not promote Gemini 3.7 Flash while its escalation availability fails the
frozen gates. Qwen3 and BGE-M3 remain pending an authenticated local model
download and must not be scored from substitutes or simulated responses.

RAGFlow, LightRAG, Kimi K3 and GraphRAG remain research comparators only. No
runtime dependency or wholesale framework adoption was introduced.

## Frozen results

| Track | Scope | Result | Frozen-gate decision | Observed duration |
| --- | --- | --- | --- | --- |
| BM25 word v1 | 9 retrieval cases | Hit@3 1.0000; MRR 0.9286; answerability 0.8889; abstention F1 0.8000 | Pass | 8 ms |
| Gemini 3.5 Flash-Lite | 5 extraction cases | Schema 1.0000; risk accuracy 1.0000; evidence recall 1.0000; evidence precision 1.0000; forbidden claims 0 | Pass | 29.311 s total; 5.857 s mean telemetry latency |
| Gemini 3.7 Flash | 3 escalation cases | 0 completed; all three returned provider unavailable / HTTP 503 | Fail | 15.404 s total; 5.130 s mean telemetry latency |
| Qwen3 Embedding 0.6B + Reranker 0.6B | 9 retrieval cases | Not scored: official weights could not be downloaded within the anonymous Hugging Face window | Unavailable, no substitution | Unknown |
| BGE-M3 | 9 retrieval cases | Not scored: official weights could not be downloaded within the anonymous Hugging Face window | Unavailable, no substitution | Unknown |

An earlier availability probe completed one of three Gemini 3.7 escalation
cases and returned HTTP 503 for the other two. The frozen post-fix run completed
zero of three. This variance is operational evidence against promotion even
though the API accepted the model identifier.

## Architecture and safety evidence

- Provider-side JSON Schema and local semantic validation both gate Gemini
  output before normalization or persistence.
- Exact evidence quotes remain anchored to old/new source snapshots.
- Synthetic golden clauses are versioned and frozen before results are known.
- Reports persist aggregate metrics and error codes, not policy text, prompts,
  responses, identities, URLs or provider error messages.
- AI telemetry uses a 90-day retention boundary and remained fail-open while
  the local migration was absent. The two additive local migrations were then
  applied and the final run persisted five successes plus three transient
  availability failures.
- Network resets are now transient fallback events, and invocation duration
  uses a monotonic clock.
- Golden-set input is restricted to the repository evaluation directory before
  any content can reach a loopback adapter.
- The Qwen harness now performs dense retrieval before reranking the top two
  candidates; it can no longer report a reranker-only run as a two-stage run.

## Security remediation in the same verification window

The three open JavaScript polynomial-ReDoS paths were replaced with bounded
linear parsing: subscriber preference normalization, public subscriber email
validation and TTS markdown cleanup. Regression inputs include 100,000-character
delimiter and email payloads. Legitimate email, preference and spoken-text
behavior remains covered.

## Reproduction

```bash
npm run ai:golden:validate
npm run ai:bakeoff -- --providers=baseline

node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/ai-bakeoff.ts \
  --providers=gemini-3.5,gemini-3.7
```

For Qwen3/BGE-M3, start the loopback services documented in
`docs/ai-evaluation-protocol-2026-08-14.md`, set `HF_TOKEN` when necessary, and
run the frozen retrieval matrix. No result should be published until the exact
model identifiers and golden-set digest are recorded.

## Primary model references

- [Google Gemini model catalog](https://ai.google.dev/gemini-api/docs/models)
- [Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite)
- [Qwen3 Embedding 0.6B](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B)
- [Qwen3 Reranker 0.6B](https://huggingface.co/Qwen/Qwen3-Reranker-0.6B)
- [BAAI BGE-M3](https://huggingface.co/BAAI/bge-m3)
