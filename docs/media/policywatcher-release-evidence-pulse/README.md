# PolicyWatcher Release Evidence Pulse

This folder contains deterministic HTML render sources for the bilingual 2-15 August 2026 release infographic.

Generate the assets with:

```bash
npm run release:evidence:assets
```

The generator reads `data/releases/release-evidence-ledger.v1.json`, overlays exact release data on the disclosed AI-generated editorial background and writes PNG/WebP assets to `public/press-kit`.

The background contains no generated text, numbers or claims. Content Credentials are not attached. The Press Kit metadata records ownership, accessibility text, the generation boundary and SHA-256 checksums.

The two dated `policywatcher-evidence-pulse-ui-*` PNG files are final browser-QA captures of the full Pulse at 1440 x 1000 and 390 x 844. They are product screenshots, not source data or measured outcome evidence.
