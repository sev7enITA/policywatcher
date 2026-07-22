# PolicyWatcher Browser Evidence Companion

Manifest V3 browser extension for PolicyWatcher 3.8.2. Chrome and Microsoft Edge use this source directly. Safari uses the same web-extension source through Apple’s Safari Web Extension packager.

## Development

From the repository root:

```bash
npm ci
npm run extension:validate
```

Load `browser-extension/` as an unpacked extension in `chrome://extensions` or `edge://extensions` after enabling Developer mode.

The extension intentionally requests only:

- `activeTab`: temporary access after the person invokes the extension;
- `scripting`: executes the packaged scanner in that active tab;
- `https://www.policywatcher.online/*`: sends the confirmed structured inquiry to PolicyWatcher.

It has no persistent content script, remote code, telemetry, advertising, analytics, inbox API, clipboard permission or raw-message storage.

## Release packages

```bash
npm run extension:package
```

Packaging requires committed tracked source and creates Chrome, Edge and Safari-source ZIP archives plus SHA-256 checksums in `artifacts/extensions/`.

See [STORE_LISTING.md](docs/STORE_LISTING.md), [PRIVACY.md](docs/PRIVACY.md), [SAFARI.md](docs/SAFARI.md), and [RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md).
