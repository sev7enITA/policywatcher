# PolicyWatcher 3.9.0 Beta 42 - Evidence Release Control Plane - August 2026

Release record date: 15 August 2026

Two technical waves and one UI/UX wave make model decisions and release impact versioned, validated and publicly inspectable.

## Highlights

- Adds a human-approved AI model registry and JSON Schema promotion contract.
- Adds privacy-safe GenAI telemetry projection without prompts, responses or source content.
- Publishes a validated fourteen-day release evidence ledger with SHA-256, ETag and public JSON.
- Ships an accessible Evidence Pulse on the homepage and as a full editorial story.
- Adds bilingual PNG and WebP press infographics with checksums, metadata and explicit claim boundaries.

## Validation

Run:

```bash
npm run ai:registry:validate
npm run release:evidence:validate
npm test
npm run lint
npm run build
```

## Boundaries

Model qualification is dataset-scoped and human-approved. Release records describe implementation, not adoption, compliance or independent validation. Content Credentials are not attached to the press assets.

Full audit: `docs/audit-v3.9.0-beta.42.md`

Press brief: `docs/press-brief-3.9.0-beta.42.md`
