# PolicyWatcher releases Beta 42: a verifiable control plane for AI models and release impact

Milan, 15 August 2026 - PolicyWatcher has released `3.9.0-beta.42`, named Evidence Release Control Plane. The update delivers two technical waves and one UI/UX wave that connect model decisions, telemetry, release history and press materials to versioned, verifiable evidence contracts.

## What changed

The first wave introduces a JSON Schema registry for nine model and architecture candidates. Baseline BM25 and Gemini 3.5 Flash-Lite are qualified only for their scoped workloads and frozen datasets. Qwen3 and BGE remain pending the bake-off. Gemini 3.7 Flash remains blocked until it is available and evaluable in the defined scope. RAGFlow, LightRAG, Kimi K3 and GraphRAG remain research-only. Automatic promotion is disabled and every transition requires human approval.

The same wave adds a telemetry projection aligned with the OpenTelemetry GenAI vocabulary. The public-safe profile excludes prompts, responses and source content while retaining operational and model attributes useful for diagnosis.

The second wave consolidates six release clusters from 2 through 15 August 2026 into a UTC ledger with a deterministic SHA-256 digest, CI validation, a public JSON endpoint and ETag revalidation. Every record keeps implementation impact, an observable metric and its residual boundary together.

The UI/UX wave turns that ledger into an accessible Evidence Pulse: a compact homepage view, an interactive story and a bilingual press infographic. Selection uses semantic controls, respects `prefers-reduced-motion` and applies the browser View Transition API only as progressive enhancement.

## Releases in the fourteen-day window

- Beta 37: resource navigation and retrieval diagnostics.
- Beta 38: Git-hosted press distribution with commit-pinned packages and checksums.
- Beta 39: bounded, signed and observable VPS renderer releases with smoke verification and rollback state.
- Beta 40: global civic evidence workspace with a directory of 79 organizations across 24 countries.
- Beta 41: adaptive presentation and motion controls without changing evidence or publication gates.
- Beta 42: EvalOps registry, AI telemetry, release ledger and Evidence Pulse.

## Available material

- Interactive story: `https://policywatcher.online/pulse/two-week-release-impact`
- JSON ledger: `https://policywatcher.online/api/v1/release-evidence`
- English print infographic: `https://policywatcher.online/press-kit/policywatcher-release-evidence-pulse-en-2026-08-15.png`
- Italian print infographic: `https://policywatcher.online/press-kit/policywatcher-release-evidence-pulse-it-2026-08-15.png`
- Asset manifest with dimensions and SHA-256: `https://policywatcher.online/press-kit/asset-manifest.json`
- Press Kit: `https://policywatcher.online/press-kit`

## Stated boundaries

The ledger documents implementation, not adoption, market impact, legal compliance or certified accessibility. Model qualification applies only to the named golden set and gates. SHA-256 establishes byte consistency, not authorship or semantic truth. The infographic's decorative background was generated with AI under PolicyWatcher art direction; its text, figures and final composition are rendered deterministically from the ledger. Content Credentials are not attached and this condition is recorded in the metadata.

## About PolicyWatcher

PolicyWatcher is an independent civic-tech project that makes public sources, observed changes, evidence state and analytical limitations inspectable. It is not legal advice, compliance certification or exhaustive market coverage.

Press and fact-checking contact: `info@policywatcher.online`
