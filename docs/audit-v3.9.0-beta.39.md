# PolicyWatcher 3.9.0 Beta 39 audit

Date: 2 August 2026

## Delivered end-to-end Renderer release management

- Replaced manually staged Renderer updates with one protected Admin workflow for package selection, local SHA-256 calculation, upload, deployment acceptance and live status polling.
- Keeps `VPS_AGENT_SECRET` server-side: the browser uploads only to the same-origin Hostinger Admin API, which independently validates the bytes and signs the Agent request with timestamp, nonce and HMAC-SHA256.
- Gives `/api/admin/vps-services` a dedicated 7 MiB JSON envelope while capping decoded Renderer packages at 5 MiB in both Hostinger and Operations Agent 0.2.
- Starts the Renderer update asynchronously and follows its operation identifier for up to eight minutes instead of treating a long `npm ci`, restart or smoke test as an HTTP timeout.

## Delivered package and recovery hardening

- Operations Agent 0.2 atomically stages checksum-matched ZIP packages in its fixed package directory and rejects archives above the 64 MiB declared uncompressed cap before extraction.
- Binds the Agent to loopback by default so the signed API is exposed only through the VPS HTTPS reverse proxy.
- Refuses to start unless `VPS_AGENT_SECRET` contains at least 32 characters.
- Rejects unsafe filenames, traversal, embedded environment files, excessive archive entries, symlinks, special files and non-canonical Base64.
- Requires exact version parity across the Admin request, Renderer `package.json`, lockfile and packaged release manifest before installation.
- Uses `npm ci --omit=dev`, an atomic `current` symlink switch, fixed systemd restart, fixed smoke URL and automatic rollback to the previous recorded release.
- Supports first-release activation from Admin when no `current` symlink exists yet; the Agent records the unavailable initial backup and treats any failed first install as requiring manual intervention.
- Keeps backup, rollback and capped operation-ledger actions restricted to the Admin role; Auditor remains read-only.

## Verification

- The complete application suite passes: 123 files and 664 tests, including package-contract, upload, checksum and administrative mutation-envelope coverage.
- Operations Agent 0.2 passes 3 focused metadata, decoding and unsafe-path tests; Renderer 1.2 passes all 6 service tests.
- ESLint and the optimized Next.js production build pass, including TypeScript and generation of all 157 static pages.
- Independent UI evaluation passed at 1440, 768 and 390 px with no horizontal overflow and no blocking accessibility or workflow finding.

## Residual boundary

Agent 0.2 requires one initial VPS bootstrap and narrowly scoped permission to restart only the Renderer service. The managed workflow does not accept arbitrary URLs, paths or shell commands and does not self-update the Operations Agent. SHA-256 and package metadata establish consistency with the selected artifact; they do not independently attest publisher identity or source-code safety.
