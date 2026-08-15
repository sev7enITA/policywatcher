# PolicyWatcher Beta 42 media brief

Release: `3.9.0-beta.42`

Date: 15 August 2026

Name: Evidence Release Control Plane

Canonical Press Kit: `https://policywatcher.online/press-kit`

## One-sentence briefing

PolicyWatcher now uses one validated fourteen-day ledger to power its release API, homepage receipt, interactive evidence story and bilingual press infographic, while a separate human-approved registry controls which AI candidates may enter a bake-off or production path.

## Safe facts to quote

- The release evidence window is inclusive from 2 through 15 August 2026 in UTC.
- It includes six documented release clusters, Beta 37 through Beta 42.
- The AI registry contains nine candidates: two qualified, two pending, one blocked and four research-only.
- Automatic model promotion is disabled.
- The public release evidence endpoint provides JSON, ETag revalidation and a deterministic SHA-256 ledger digest.
- Four final infographic files are supplied: English and Italian in PNG and WebP.
- The two PNG files include IPTC/XMP accessibility and usage metadata.
- Content Credentials are not attached.

## Claims that must not be inferred

- Qualified does not mean universally best, provider-certified or covered by an SLA.
- A release count does not establish adoption, business impact, reliability or compliance.
- The organization directory is configured and non-exhaustive; inclusion is not endorsement.
- WCAG-aware implementation choices do not constitute formal accessibility conformance.
- A checksum proves downloaded-file integrity only.
- AI-generated decoration is not evidence and must not be interpreted as a chart.

## Asset register

| Asset | Format | Intended use |
| --- | --- | --- |
| `policywatcher-release-evidence-pulse-en-2026-08-15.png` | PNG, 2400 x 3168 | English print and high-resolution editorial placement |
| `policywatcher-release-evidence-pulse-en-2026-08-15.webp` | WebP, 2400 x 3168 | English web placement |
| `policywatcher-release-evidence-pulse-it-2026-08-15.png` | PNG, 2400 x 3350 | Italian print and high-resolution editorial placement |
| `policywatcher-release-evidence-pulse-it-2026-08-15.webp` | WebP, 2400 x 3350 | Italian web placement |

Exact byte sizes and SHA-256 values are authoritative in `public/press-kit/asset-manifest.json` after generation.

## Editorial disclosure

The abstract, text-free background was generated with OpenAI image generation from PolicyWatcher art direction. It was then used as a low-opacity decorative layer. All release titles, dates, impact statements, metrics, boundaries, typography and layout are generated deterministically from `data/releases/release-evidence-ledger.v1.json`. The background is not a data visualization. The source prompt and production note are documented in `docs/media/policywatcher-release-evidence-pulse/README.md`.

## Fact-checking route

Send the quoted statement, source URL and intended publication date to `info@policywatcher.online` with subject `PolicyWatcher fact-checking`.
