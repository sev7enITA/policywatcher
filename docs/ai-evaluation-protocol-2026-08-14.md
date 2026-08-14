# PolicyWatcher AI evaluation protocol

Frozen on 14 August 2026. This protocol evaluates challengers without changing
the evidence-first production pipeline or adopting a RAG framework wholesale.

## Decision boundary

- Production remains deterministic at acquisition, hashing, double-change
  confirmation, exact evidence anchoring and publication review.
- No model or retriever is promoted from a single aggregate score.
- A challenger must pass every frozen metric gate, every adversarial case and a
  human review of evidence anchors. Cost and p95 latency must not regress beyond
  the accepted operating budget.
- RAGFlow, LightRAG, Kimi K3 and GraphRAG remain research comparators. They are
  not runtime dependencies until a bounded use case beats the baseline.

## Golden set v1

`evals/policy-analysis/golden-set.v1.json` is a human-authored synthetic
calibration set. It contains EN/IT material clauses, equivalent passages,
unanswerable questions, boilerplate, moved clauses, partial pages, ambiguous
cross-border language and prompt injection. Synthetic text prevents production
or copyrighted policy content from leaking into the repository.

The set is versioned and frozen before challenger runs. Additions require a new
version; existing labels and gates must not be edited after results are known.

## Bake-off matrix

| Track | Baseline | Challenger | Role |
| --- | --- | --- | --- |
| Retrieval | BM25 word-level v1 | Qwen3 Embedding + Reranker | multilingual clause retrieval |
| Retrieval | BM25 word-level v1 | BGE-M3 | dense/multifunction retrieval |
| Extraction | Gemini 2.5 production lineage | Gemini 3.5 Flash-Lite | structured low-cost extraction |
| Escalation | no automatic escalation | Gemini 3.7 Flash | ambiguous/adversarial cases only |

## Local adapter contract

Qwen3 and BGE remain outside the Node.js runtime. The harness calls explicitly
configured loopback HTTP adapters only. A model hosted on a separate VPS must
be exposed to the harness through an authenticated SSH tunnel bound to
`127.0.0.1`; raw golden-set text is never sent to an arbitrary remote URL.

Embedding request:

```json
{"model":"BAAI/bge-m3","task":"retrieval","texts":["query","document"]}
```

Accepted response:

```json
{"embeddings":[[0.1,0.2],[0.2,0.3]]}
```

OpenAI-style `data[].embedding` is also accepted.

Reranker request:

```json
{"model":"Qwen3-Reranker-0.6B","query":"query","documents":["a","b"],"topK":2}
```

Accepted response:

```json
{"results":[{"index":1,"score":0.91},{"index":0,"score":0.42}]}
```

## Commands

Validate and run the deterministic baseline:

```bash
npm run ai:golden:validate
npm run ai:bakeoff -- --providers=baseline
```

Run local retrieval challengers after their adapters are available:

```bash
QWEN3_EMBEDDING_URL=http://127.0.0.1:8101/embed \
QWEN3_RERANKER_URL=http://127.0.0.1:8102/rerank \
BGE_M3_EMBEDDING_URL=http://127.0.0.1:8103/embed \
npm run ai:bakeoff -- --providers=baseline,qwen3,bge-m3
```

Run paid Gemini tracks only with an explicit evaluation key and budget:

```bash
GEMINI_API_KEY=... npm run ai:bakeoff -- --providers=gemini-3.5,gemini-3.7
```

The JSON result excludes raw prompt, response and policy content. Golden-set
calls are separately labelled in privacy-minimized AI telemetry.
