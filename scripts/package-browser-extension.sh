#!/usr/bin/env bash
# Create traceable Chrome, Edge and Safari-source browser extension packages.

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXTENSION_DIR="${APP_DIR}/browser-extension"
OUTPUT_DIR="${1:-${APP_DIR}/artifacts/extensions}"
VERSION="$(sed -n "s/.*POLICYWATCHER_BROWSER_EXTENSION_VERSION = '\([^']*\)'.*/\1/p" "${APP_DIR}/src/lib/release.ts")"
EXTENSION_VERSION="$(node -p "require('${EXTENSION_DIR}/manifest.json').version")"
EXTENSION_DISPLAY_VERSION="$(node -p "require('${EXTENSION_DIR}/manifest.json').version_name")"
EXPECTED_DISPLAY_VERSION="$(sed -n "s/.*POLICYWATCHER_BROWSER_EXTENSION_DISPLAY_VERSION = '\([^']*\)'.*/\1/p" "${APP_DIR}/src/lib/release.ts")"
SOURCE_REVISION="$(git -C "${APP_DIR}" rev-parse HEAD)"
DATE_STAMP="$(date +%Y-%m-%d)"
STAGING_DIR="$(mktemp -d /tmp/policywatcher-extension-package.XXXXXX)"

cleanup() {
  find "${STAGING_DIR}" -depth -delete 2>/dev/null || true
}
trap cleanup EXIT

if ! git -C "${APP_DIR}" diff --quiet || ! git -C "${APP_DIR}" diff --cached --quiet; then
  echo "Tracked source changes are not committed; refusing to package an untraceable extension." >&2
  exit 1
fi
if [[ -z "${VERSION}" || -z "${EXPECTED_DISPLAY_VERSION}" || "${EXPECTED_DISPLAY_VERSION}" != "${EXTENSION_DISPLAY_VERSION}" ]]; then
  echo "Extension release mismatch: release=${VERSION}, expected display=${EXPECTED_DISPLAY_VERSION}, manifest display=${EXTENSION_DISPLAY_VERSION}." >&2
  exit 1
fi

(cd "${APP_DIR}" && node scripts/validate-browser-extension.mjs)

runtime_sources=(manifest.json popup.html popup.css popup.js service-worker.js _locales icons)
for source in "${runtime_sources[@]}"; do
  cp -R "${EXTENSION_DIR}/${source}" "${STAGING_DIR}/${source}"
done

if find "${STAGING_DIR}" -type l -print -quit | grep -q .; then
  echo "Extension staging contains a symbolic link." >&2
  exit 1
fi
if rg -n "https?://" "${STAGING_DIR}" -g '*.js' | rg -v "https://www\.policywatcher\.online" >/dev/null; then
  echo "Extension JavaScript contains an unapproved remote origin." >&2
  exit 1
fi

mkdir -p "${OUTPUT_DIR}"
chrome_name="PolicyWatcher-Browser-Extension-${VERSION}-chrome-${DATE_STAMP}.zip"
edge_name="PolicyWatcher-Browser-Extension-${VERSION}-edge-${DATE_STAMP}.zip"
safari_name="PolicyWatcher-Browser-Extension-${VERSION}-safari-source-${DATE_STAMP}.zip"

for archive_name in "${chrome_name}" "${edge_name}" "${safari_name}"; do
  archive="${OUTPUT_DIR}/${archive_name}"
  if [[ -e "${archive}" || -e "${archive}.sha256" ]]; then
    echo "Extension output already exists: ${archive}" >&2
    exit 1
  fi
  (cd "${STAGING_DIR}" && zip -q -r "${archive}" .)
  entries="$(zipinfo -1 "${archive}")"
  if printf '%s\n' "${entries}" | grep -E '(^/|(^|/)\.\.(/|$)|(^|/)(node_modules|\.git|__tests__|docs)(/|$)|\.(pem|p12|pfx|key)$)' >/dev/null; then
    echo "Extension archive contains a forbidden path: ${archive_name}" >&2
    exit 1
  fi
  (cd "${OUTPUT_DIR}" && shasum -a 256 "${archive_name}" > "${archive_name}.sha256")
done

node -e '
  const fs = require("fs");
  const [target, version, extensionVersion, revision, chrome, edge, safari] = process.argv.slice(1);
  fs.writeFileSync(target, JSON.stringify({
    product: "PolicyWatcher Browser Evidence Companion",
    version,
    extensionVersion,
    channel: "beta.3",
    sourceRevision: revision,
    builtAt: new Date().toISOString(),
    packages: { chrome, edge, safariSource: safari },
    safariSigningIncluded: false,
    databaseIncluded: false
  }, null, 2) + "\n");
' "${OUTPUT_DIR}/PolicyWatcher-Browser-Extension-${VERSION}-release.json" "${VERSION}" "${EXTENSION_VERSION}" "${SOURCE_REVISION}" "${chrome_name}" "${edge_name}" "${safari_name}"

echo "Chrome: ${OUTPUT_DIR}/${chrome_name}"
echo "Edge: ${OUTPUT_DIR}/${edge_name}"
echo "Safari source: ${OUTPUT_DIR}/${safari_name}"
echo "Source revision: ${SOURCE_REVISION}"
