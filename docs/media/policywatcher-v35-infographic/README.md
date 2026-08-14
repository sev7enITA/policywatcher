# PolicyWatcher 3.5 Confidence Infographic Deck

Presentation-ready visual deck for PolicyWatcher release 3.5 / 3.5.1.

## Files

- `index.html` - interactive 16:9 HTML deck with keyboard navigation.
- `slide-01-architecture.svg` - confidence architecture overview.
- `slide-02-operational-flow.svg` - detailed ingestion and assurance flow.
- `slide-03-entity-relationship.svg` - Prisma entity relationship schema.
- `slide-04-qa-engine.svg` - dedicated Dataset QA Engine slide.
- `slide-05-ingestion-pipeline.svg` - dedicated data ingestion sources, runtime paths and implemented checks slide.
- `png/` - browser-rendered 1920x1080 PNG exports for each slide.

## How to Use

Open `index.html` in a browser for presentation mode.

Keyboard controls:

- Right arrow / Page Down: next slide
- Left arrow / Page Up: previous slide
- Home: first slide
- End: last slide

Browser print can export the deck as a landscape PDF.

## Content Boundaries

The deck uses evidence-first wording:

- monitors configured public policy sources;
- records retrieval evidence;
- detects text changes through hashes and snapshots when source retrieval succeeds;
- exposes Dataset QA status and human review decisions;
- describes AI-assisted analysis as bounded interpretation.
- treats the current seed-only local database as gated until source-verified
  retrieval logs are available.

It intentionally uses legal, security and compliance boundaries.
