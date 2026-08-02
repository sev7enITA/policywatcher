# PolicyWatcher VPS Operations Agent

Small operations companion for the renderer VPS. It is separate from the
Playwright renderer and exposes only fixed, audited operations:

- `GET /healthz` - unauthenticated liveness with coarse state.
- `GET /version` - authenticated agent version.
- `GET /status` - authenticated renderer health and operational state.
- `GET /logs` - authenticated capped operation ledger, max 200 lines / 64 KB.
- `POST /smoke-test` - authenticated fixed smoke URL, no URL input.
- `POST /backup` - authenticated renderer backup, excludes `.env*` and `node_modules`.
- `POST /packages/upload` - authenticated bounded package staging with SHA-256 and archive validation.
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
HOST=127.0.0.1
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
MAX_PACKAGE_BYTES=5242880
MAX_UPLOAD_BODY_BYTES=7340032
MAX_UNCOMPRESSED_BYTES=67108864
PLAYWRIGHT_BROWSERS_PATH=/opt/policywatcher-renderer/playwright-browsers
```

The `.env` file is never included in backups. Keep
`PLAYWRIGHT_BROWSERS_PATH` identical in the Agent and Renderer services: the
Agent runs the Renderer `postinstall` lifecycle while the Renderer process uses
the same Chromium installation after the symlink switch.

Keep `HOST=127.0.0.1` and expose the Agent only through the local HTTPS reverse
proxy. Do not publish port `8791` directly on the Internet.

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

1. Select the Renderer archive from PolicyWatcher Admin.
2. The browser computes its SHA-256 locally and sends the bounded package to
   the Hostinger Admin API.
3. Hostinger signs and forwards the upload to `/packages/upload`; neither the
   Renderer secret nor the Agent secret is exposed to the browser.
4. The Agent verifies compressed and uncompressed size, filename, checksum and
   ZIP entries before an
   atomic move into its fixed packages directory.
5. Admin requests an asynchronous update with only:

```json
{
  "version": "3.5.2",
  "sha256": "..."
}
```

The Agent returns an operation identifier immediately. The Admin Console polls
authenticated status while the Agent finds the matching checksum, rejects
unsafe entries, symlinks and special files before extraction, metadata/version mismatches and
embedded environment files, extracts to a staging directory, runs `npm ci`,
switches `current`, restarts systemd, and runs the fixed smoke test.

On a fresh control plane, where `current` does not exist yet, the first package
can also be deployed from Admin: the Agent records the backup as skipped, then
installs and activates the selected release. A failed first deployment cannot
roll back and therefore enters `manual_intervention_required`.

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

The Agent invokes `/usr/bin/systemctl restart policywatcher-renderer.service`
directly. Grant the service user that single operation with a Polkit rule; do
not grant unrestricted `systemctl` or shell access:

```javascript
// /etc/polkit-1/rules.d/50-policywatcher-renderer.rules
polkit.addRule(function (action, subject) {
  if (action.id === "org.freedesktop.systemd1.manage-units"
      && action.lookup("unit") === "policywatcher-renderer.service"
      && action.lookup("verb") === "restart"
      && subject.user === "policywatcher") {
    return polkit.Result.YES;
  }
});
```

Before enabling the Agent, create `/opt/policywatcher-renderer` and its
subdirectories with owner `policywatcher:policywatcher`, install Chromium's OS
dependencies once as root (`npx playwright install-deps chromium` from an
extracted Renderer package), and verify the rule with:

```bash
sudo -u policywatcher /usr/bin/systemctl restart policywatcher-renderer.service
```
