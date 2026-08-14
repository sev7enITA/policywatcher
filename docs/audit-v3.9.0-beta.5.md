# PolicyWatcher 3.9.0 Beta 5 release audit

- Release: `3.9.0-beta.5`
- Audit date: 27 July 2026
- Scope: Press Kit navigation discovery
- Browser extension track: unchanged at `3.8.3-beta.3`

## Implemented access points

- Dashboard `More / Workspace Controls`: `Press Kit` in the `Observe` group after `Showcase`.
- Shared public header: `Press Kit` on desktop and in the mobile menu.
- Command Palette: searchable `Open Press Kit` / `Apri Press Kit` action.
- Existing footer link retained.
- Direct route retained at `/press-kit`.

## Release boundary

The link becomes visible on `policywatcher.online` after deployment of the Beta 5 Hostinger package. The current production deployment can still reach the page through the direct `/press-kit` URL if the Beta 3 or Beta 4 application files are already installed.

## Verification

- Vitest: 347 tests passed across 58 files.
- TypeScript validation: passed.
- Next.js production build: passed.
