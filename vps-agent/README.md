# PolicyWatcher VPS Operations Agent

Small operations companion for the renderer VPS. It is separate from the
Playwright renderer and exposes only fixed, audited operations:

- `GET /healthz` - unauthenticated liveness with coarse state.
- `GET /version` - authenticated agent version.
- `GET /status` - authenticated renderer health and operational state.
- `GET /logs` - authenticated capped operation ledger, max 200 lines / 64 KB.
- `POST /smoke-test` - authenticated fixed smoke URL, no URL input.
- `POST /backup` - authenticated renderer backup, excludes `.env*` and `node_modules`.
- `POST /update` - authenticated verified local package update.
- `POST /rollback` - authenticated rollback to the previous recorded version.

No endpoint accepts shell commands, arbitrary file paths, arbitrary URLs, or
package download URLs.

## Directory Layout

Recommended VPS layout:

```text
/opt/policywatcher-vps-agent/
  agent.mjs
  package.json
  .env

/opt/policywatcher-renderer/
  current -> versions/3.5.1/
  versions/
  packages/
  backups/
  agent-state/
  agent-logs/
```

The renderer systemd service should point at:

```text
/opt/policywatcher-renderer/current/server.mjs
```

## Environment

```bash
PORT=8791
VPS_AGENT_SECRET=<high-entropy-secret>

RENDERER_ROOT=/opt/policywatcher-renderer
RENDERER_SERVICE=policywatcher-renderer.service
RENDERER_HEALTH_URL=http://127.0.0.1:8787/healthz
RENDERER_RENDER_URL=http://127.0.0.1:8787/render
RENDERER_SECRET=<same-secret-used-by-renderer>
AGENT_SMOKE_URL=https://example.com

SYSTEMCTL_BIN=/usr/bin/systemctl
NPM_BIN=/usr/bin/npm
TAR_BIN=/usr/bin/tar
UNZIP_BIN=/usr/bin/unzip
BACKUP_RETENTION=10
```

The `.env` file is never included in backups.

## Auth

All endpoints except `/healthz` require:

```text
x-policywatcher-timestamp: ISO timestamp
x-policywatcher-nonce: random nonce
x-policywatcher-signature: hex HMAC-SHA256
```

Canonical string:

```text
METHOD
PATH
TIMESTAMP
NONCE
SHA256(raw request body)
```

The agent rejects stale timestamps and replayed nonces.

## Update Flow

1. Copy a renderer package to `/opt/policywatcher-renderer/packages/`.
2. Compute its SHA256.
3. From PolicyWatcher Admin, call update with only:

```json
{
  "version": "3.5.2",
  "sha256": "..."
}
```

The agent scans only the fixed package directory, finds the matching checksum,
rejects archives with unsafe entries or `.env` files, extracts to a staging
directory, installs dependencies, switches `current`, restarts systemd, and
runs the fixed smoke test.

If the update smoke test fails, the agent tries one rollback. If rollback also
fails, it sets state to `manual_intervention_required` and `/healthz` returns
`ok: false`.

## systemd Example

```ini
[Unit]
Description=PolicyWatcher VPS Operations Agent
After=network.target

[Service]
Type=simple
User=policywatcher
WorkingDirectory=/opt/policywatcher-vps-agent
EnvironmentFile=/opt/policywatcher-vps-agent/.env
ExecStart=/usr/bin/node agent.mjs
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Give the `policywatcher` user narrow sudo permission for the renderer service
restart if needed, or run the agent under a service account that can restart
only `policywatcher-renderer.service`.
