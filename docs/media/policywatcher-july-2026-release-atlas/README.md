# PolicyWatcher July 2026 Release Atlas

## Purpose

This artifact supports the 1 August 2026 LinkedIn publication about PolicyWatcher work documented during July 2026. It is an editorial release atlas, not a performance dashboard or a claim of product adoption.

## Evidence contract

- Source: `CHANGELOG.md` and `src/lib/releaseImpact.ts` at repository state dated 1 August 2026.
- July build count: 44 changelog entries across 13 distinct dates.
- Delivered capability count: 49 Feature Atlas records marked delivered by 31 July.
- Beta 27 is dated 1 August and is shown only as a separate consolidation checkpoint.
- Configured scope: 16 companies, six sectors and 15 canonical KPIs. These are inventory statements, not exhaustive coverage.
- Distribution: one verified Chrome Web Store listing. Edge and Safari listings are not claimed.

## Files

- `index.html`: interactive, keyboard-accessible atlas with desktop pan/zoom and mobile chapter continuations.
- `data.js`: deterministic release, capability, scope and boundary data.
- `styles.css`: PolicyWatcher light visual system and export modes.
- `app.js`: rendering, search, pan/zoom, section jumps and bounded item inspection.
- `policywatcher-july-2026-release-atlas-6480x4320.png`: lossless master.
- `policywatcher-july-2026-release-atlas-linkedin-6480x4320.jpg`: LinkedIn-compatible landscape image, subject to the platform's 5 MB photo limit.
- `policywatcher-july-2026-release-atlas-linkedin-3240x4050.png`: 4:5 high-density portrait derivative.
- `policywatcher-july-2026-release-atlas.pdf`: one-page vector-oriented master for document upload and zoom.
- `linkedin-post-en.md`: coordinated English publication copy and first comments.

## Interaction

- Drag to pan.
- Use Ctrl/Command + wheel or the labelled controls to zoom.
- Use arrow keys to pan, `+` and `-` to zoom and `0` for the overview.
- Use section controls to move directly to the time, lifecycle, capability, build or scope axes.
- Search accepts a build version, domain or feature phrase.
- Essential evidence remains directly labelled; hover is not required.

## Regeneration

Open `index.html?export=master` at 6480 × 4320 for the master export. Open `index.html?export=linkedin` at 1080 × 1350 with device pixel ratio 3 for the 3240 × 4050 derivative. The export scripts used for QA are intentionally kept outside the repository under `/tmp`.

## Design contract

The approved concept locks the light PolicyWatcher palette, horizontal time axis, vertical evidence lifecycle, central capability system, separate build ledger, visible limitations and separate 1 August Beta 27 checkpoint. Exact typography, spacing and renderer geometry remain implementation details.
