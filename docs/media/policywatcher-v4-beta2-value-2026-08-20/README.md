# PolicyWatcher 4 Beta 2 operating-model infographic

Sober English guide explaining who PolicyWatcher 4 affects, how its operating
model differs from 3.x and what that difference means in practice. Architecture,
Git and release state, integrations and workflow synergies are intentionally
kept in a secondary technical mirror. Revised on 20 August 2026 for the deployed
`4.0.0-beta.2` release checkpoint.

## Files

- `policywatcher-v4-beta2-value-infographic-en-2026-08-20.svg`: deterministic
  text, figures and layout source.
- `policywatcher-v4-beta2-value-background-ai-v2-2026-08-20.png`: revised
  AI-generated illustration layer without text or logos.
- `policywatcher-wordmark-dark-source.png`: local rendering source copied from
  the owned Press Kit wordmark; informative layout remains deterministic.
- `/public/press-kit/policywatcher-v4-beta2-value-infographic-en-2026-08-20.png`:
  full-resolution press asset.
- `/public/press-kit/policywatcher-v4-beta2-value-infographic-en-2026-08-20.webp`:
  web preview.

## Information architecture

1. intended audiences and purpose;
2. the 3.x to 4 operating-model change in one sentence;
3. the practical meaning: continuity, reviewability, shared operational state
   and controlled evolution;
4. a connected monitor-to-integrate workflow;
5. a deliberately secondary technical mirror covering architecture, Git and
   release state, integrations and shared workflow synergies;
6. a dated verification checkpoint with live readiness kept outside the static asset.

## Sources

- `src/lib/release.ts`
- `src/lib/releaseImpact.ts`
- `docs/audit-v4.0.0-beta.2-assessment-remediation.md`
- `docs/document-evidence-model.md`
- `docs/document-evidence-backfill-runbook.md`
- `docs/reports/policywatcher-v4-vs-v3-2026-08-20.artifact.json`
- `docs/client-compatibility-matrix-v4.md`

## Image-generation disclosure

The illustration layer was generated with the built-in ImageGen tool. It
contains no product claims, labels, numbers or logos. All informative content
is rendered deterministically by the SVG source.

Final ImageGen prompt:

```text
Use case: infographic-diagram
Asset type: background illustration layer for a sober vertical PolicyWatcher 4 explanatory infographic
Primary request: create a calm, highly refined editorial information-design background that supports a clear explanation of the transition from PolicyWatcher 3.x monitoring records to PolicyWatcher 4 durable evidence infrastructure
Scene/backdrop: warm off-white architectural paper with a disciplined modular grid; one restrained deep-navy vertical spine near the right edge; subtle five-node lineage motif moving from a simple record into layered document/version/change/provision forms
Style/medium: premium Swiss editorial design, precise vector-like geometry, institutional annual-report quality, generous negative space, understated and timeless
Composition/framing: portrait 2:3; keep the top 75% mostly quiet and light for deterministic text overlays; concentrate the visual lineage spine on the far right and a small transformation motif near the middle; keep the bottom technical-reference area slightly denser but still legible
Lighting/mood: calm, analytical, credible, non-promotional
Color palette: warm ivory #F5F2EA, paper white #FCFBF7, ink navy #10263D, dark teal #196A67, muted aqua #9BC9C4, restrained ochre #C58A35, graphite #34444B
Materials/textures: nearly flat color, very light paper grain, hairline rules, subtle translucent layers
Constraints: background only; no words, letters, numbers, logos, icons, people, devices, screenshots, badges, shields, certification marks, glowing circuits or 3D render; no sensational visual effects; preserve large high-contrast quiet areas; crisp, sophisticated, print-ready; no watermark
Avoid: marketing poster energy, cyberpunk, neon, dark full-page background, dense circuits, dashboards, stock technology imagery, dramatic gradients, large abstract objects, clutter, illegible micro-detail
```

## Boundary

The infographic communicates the implemented operating model and a dated
release checkpoint. It does not establish legal validity, corpus completeness,
adoption, continuous availability, compliance or competitive superiority. Live
readiness is deliberately read from `/api/v1/publication-readiness`, not frozen
into the static asset.
