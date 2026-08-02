# PolicyWatcher 3.9.0 Beta 38 audit

Date: 2 August 2026

## Delivered Git-hosted Press Kit distribution

- Kept the complete English and Italian Press Kit ZIPs committed in the public repository with byte size and SHA-256 metadata.
- Replaced application-local package links with explicit GitHub repository download URLs pinned to the commit containing the packages.
- Added provider, repository, revision and distribution-boundary fields to the public package manifest.
- Updated the package-manifest schema and Press Kit interface for a visible, safe external GitHub handoff.
- Removed the cross-origin `download` attribute, which browsers do not reliably honor for external origins.

## Delivered Hostinger package reduction

- Excludes every `policywatcher-press-package-*.zip` from the Hostinger staging directory.
- Rejects a generated Hostinger artifact if a nested full Press Kit package is detected.
- Keeps package manifests, fact sheets, previews and individual web assets in the application artifact.
- Retains the complete editorial packages in Git so they can be downloaded independently of an application deployment.

## Administrative login reverse-proxy compatibility

- Fixed the Beta 36 mutation boundary regression that could reject valid login requests when Hostinger rewrote the host or protocol before Next.js evaluated the request.
- Uses the browser-generated exact `same-origin` Fetch Metadata assertion for this proxy case instead of trusting forwarding headers or weakening the production fail-closed path.
- Continues to reject explicit cross-site requests, same-site Origin mismatches, absent production provenance and malformed mutation bodies.

## Verification

- Package-manifest tests validate the GitHub provider, repository URL, revision, external package URLs, committed ZIP bytes and SHA-256 values.
- UI regression checks verify the explicit GitHub download wording and absence of a cross-origin `download` attribute.
- The Hostinger builder verifies version parity, required runtime entries, forbidden paths and absence of nested Press Kit packages.
- TypeScript, lint, 121 application test files with 658 tests and the production build with 156 generated routes passed.

## Residual boundary

Full Press Kit downloads depend on GitHub availability and publication of the pinned commit. SHA-256 values verify downloaded bytes only; they do not establish semantic truth, authorship provenance or endorsement. Individual web assets remain in Hostinger because the Press Kit pages render and expose them directly.
