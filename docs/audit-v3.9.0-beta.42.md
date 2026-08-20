# PolicyWatcher 3.9.0 Beta 42 release audit

Release: `3.9.0-beta.42` - Evidence Release Control Plane

Date: 15 August 2026

Scope: two technical waves, one UI/UX wave and the related public and press assets.

## Delivered controls

### Wave 1 - AI EvalOps

- A versioned registry classifies nine model or architecture candidates as qualified, blocked, pending or research-only.
- Qualification requires observed cases, passing frozen gates and human approval. Automatic promotion is disabled.
- Privacy-safe telemetry can be projected onto the OpenTelemetry GenAI semantic vocabulary without exporting content.
- Baseline BM25 and Gemini 3.5 Flash-Lite are qualified for their scoped workloads. Qwen3/BGE remain unscored. Gemini 3.7 Flash remains blocked. RAGFlow, LightRAG, Kimi K3 and GraphRAG remain research-only.

### Wave 2 - release evidence ledger

- One 14-day UTC ledger covers Beta 37 through Beta 42 and joins every release to the public release and impact registries.
- The ledger exposes a deterministic SHA-256 digest, a public JSON endpoint and ETag-based revalidation.
- CI validates dates, ordering, evidence links, model promotion invariants and the release digest.

### Wave 3 - Evidence Pulse

- The same ledger drives the homepage receipt, editorial Pulse story, infographic and newsroom material.
- Selection uses semantic controls and only applies browser View Transitions when supported and when reduced motion is not requested.
- Implementation evidence and residual limitations remain adjacent in web, API and press copy.

## State-of-the-art basis

- OpenTelemetry GenAI semantic conventions: `https://github.com/open-telemetry/semantic-conventions-genai`
- GitHub artifact attestations and SLSA provenance guidance: `https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations`
- WCAG 2.2 reduced-motion technique C39: `https://www.w3.org/WAI/WCAG22/Techniques/css/C39`
- Web View Transition API: `https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API`
- Next.js 16 App Router: `https://nextjs.org/docs/app`

The implementation deliberately does not enable the experimental Next.js ViewTransition integration. It uses the browser API as progressive enhancement and retains an immediate semantic fallback.

The dedicated OpenTelemetry GenAI repository does not yet publish a schema URL. PolicyWatcher therefore records the official conventions source and emits no invented schema URL.

## Evidence and validation

- `npm run ai:registry:validate`
- `npm run release:evidence:validate`
- focused registry, telemetry, release, Pulse and Press Kit tests
- full Vitest coverage gate
- TypeScript, ESLint and production build
- production dependency audit at high severity
- complete security diff review of 43 changed surfaces, with zero reportable findings (`docs/reports/policywatcher-security-diff-beta42-2026-08-15.md`)

## Boundaries

- Model qualification is limited to the frozen golden set and is not a universal ranking or provider SLA.
- Release inventory is not evidence of adoption, market impact, legal compliance, accessibility conformance or continuous service quality.
- SHA-256 proves byte consistency only. It is not authorship, third-party attestation or semantic validation.
- The infographic is an owned editorial rendering of the ledger. Content Credentials are not attached and this is disclosed in the Press Kit metadata.
