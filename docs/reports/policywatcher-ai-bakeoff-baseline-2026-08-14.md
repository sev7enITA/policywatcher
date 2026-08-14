# PolicyWatcher AI bake-off – baseline report

Date: 14 August 2026
Golden set: `policywatcher-golden.v1`
Status: baseline executed; challengers pending real endpoints/credentials

## Outcome

The deterministic `bm25-word-v1` baseline was executed on nine synthetic EN/IT
retrieval cases. It passed the frozen minimum gates, while exposing one expected
failure on a semantic paraphrase with no shared vocabulary.

| Metric | Baseline |
| --- | ---: |
| Hit@1 | 0.8571 |
| Hit@3 | 1.0000 |
| MRR | 0.9286 |
| Answerability accuracy | 0.8889 |
| Abstention precision | 0.6667 |
| Abstention recall | 1.0000 |
| Abstention F1 | 0.8000 |

The case `semantic-paraphrase-account-erasure` correctly demonstrates the
reason to test Qwen3/BGE: the query and relevant clause are semantically
equivalent but share no useful lexical token, so the baseline abstains.

## Not yet executed

- Qwen3 Embedding + Reranker: local/VPS adapter URLs are not configured.
- BGE-M3: local/VPS embedding adapter URL is not configured.
- Gemini 3.5 Flash-Lite extraction: no evaluation API key is available in the
  current shell environment.
- Gemini 3.7 Flash escalation: no evaluation API key is available in the
  current shell environment.

No challenger result has been fabricated or inferred from vendor benchmarks.
The executable adapter contract and commands are documented in
`docs/ai-evaluation-protocol-2026-08-14.md`.

## Promotion rule

Passing aggregate gates is necessary but insufficient. Promotion requires no
regression on adversarial or unanswerable cases, exact evidence precision of
1.0, human anchor review, and accepted cost and p95 latency. The production
evidence gate remains unchanged throughout the bake-off.
