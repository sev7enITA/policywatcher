#!/usr/bin/env bash
# Build and verify a clean, traceable VPS renderer artifact for Git releases.

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_INPUT="${1:-${APP_DIR}/artifacts/renderer}"
if [[ "${OUTPUT_INPUT}" = /* ]]; then
  OUTPUT_DIR="${OUTPUT_INPUT}"
else
  OUTPUT_DIR="${APP_DIR}/${OUTPUT_INPUT}"
fi

VERSION="$(node -p "require('${APP_DIR}/renderer/package.json').version")"
LOCK_VERSION="$(node -p "require('${APP_DIR}/renderer/package-lock.json').version")"
SOURCE_REVISION="$(git -C "${APP_DIR}" rev-parse HEAD)"
DATE_STAMP="$(date +%Y-%m-%d)"
ARCHIVE_NAME="PolicyWatcher-renderer-${VERSION}-vps-${DATE_STAMP}.zip"
ARCHIVE="${OUTPUT_DIR}/${ARCHIVE_NAME}"
CHECKSUM="${ARCHIVE}.sha256"
STAGING_DIR="$(mktemp -d /tmp/policywatcher-renderer-package.XXXXXX)"
EXTRACT_DIR="$(mktemp -d /tmp/policywatcher-renderer-verify.XXXXXX)"

cleanup() {
  find "${STAGING_DIR}" "${EXTRACT_DIR}" -depth -delete 2>/dev/null || true
}
trap cleanup EXIT

if ! git -C "${APP_DIR}" diff --quiet || ! git -C "${APP_DIR}" diff --cached --quiet; then
  echo "Tracked source changes are not committed; refusing to create an untraceable renderer artifact." >&2
  exit 1
fi
if [[ "${VERSION}" != "${LOCK_VERSION}" ]]; then
  echo "Renderer version mismatch: package=${VERSION}, lock=${LOCK_VERSION}." >&2
  exit 1
fi

mkdir -p "${OUTPUT_DIR}" "${STAGING_DIR}/renderer"
if [[ -e "${ARCHIVE}" || -e "${CHECKSUM}" ]]; then
  echo "Renderer output already exists; move it aside before rebuilding: ${ARCHIVE}" >&2
  exit 1
fi

for source in package.json package-lock.json server.mjs README.md; do
  cp "${APP_DIR}/renderer/${source}" "${STAGING_DIR}/renderer/${source}"
done

node -e '
  const fs = require("fs");
  const [target, version, revision] = process.argv.slice(1);
  fs.writeFileSync(target, JSON.stringify({
    product: "PolicyWatcher Renderer",
    version,
    sourceRevision: revision,
    builtAt: new Date().toISOString(),
    target: "VPS Node.js service",
    installCommand: "npm ci",
    startupCommand: "npm start",
    stealthPluginsIncluded: false
  }, null, 2) + "\n");
' "${STAGING_DIR}/renderer/release-manifest.json" "${VERSION}" "${SOURCE_REVISION}"

(cd "${STAGING_DIR}" && zip -q -r "${ARCHIVE}" renderer)
archive_entries="$(zipinfo -1 "${ARCHIVE}")"
if printf '%s\n' "${archive_entries}" | grep -E '(^/|(^|/)\.\.(/|$))' >/dev/null; then
  echo "Renderer archive contains an absolute or traversal path." >&2
  exit 1
fi
if printf '%s\n' "${archive_entries}" | grep -E '(^|/)(node_modules|\.git|artifacts)(/|$)|(^|/)server\.test\.mjs$|\.(env|pem|p12|pfx|key)$' >/dev/null; then
  echo "Renderer archive contains a forbidden runtime, test or secret path." >&2
  exit 1
fi

for entry in renderer/package.json renderer/package-lock.json renderer/server.mjs renderer/README.md renderer/release-manifest.json; do
  if ! printf '%s\n' "${archive_entries}" | grep -Fx "${entry}" >/dev/null; then
    echo "Renderer archive is missing required entry: ${entry}" >&2
    exit 1
  fi
done

unzip -q "${ARCHIVE}" -d "${EXTRACT_DIR}"
node -e '
  const fs = require("fs");
  const path = process.argv[1];
  const pkg = require(path + "/package.json");
  const lock = require(path + "/package-lock.json");
  const manifest = require(path + "/release-manifest.json");
  if (pkg.version !== lock.version || pkg.version !== manifest.version || manifest.stealthPluginsIncluded !== false) {
    throw new Error("Extracted renderer metadata is inconsistent");
  }
' "${EXTRACT_DIR}/renderer"

(cd "${OUTPUT_DIR}" && shasum -a 256 "${ARCHIVE_NAME}" > "${ARCHIVE_NAME}.sha256")
echo "Renderer artifact: ${ARCHIVE}"
echo "Checksum: ${CHECKSUM}"
echo "Source revision: ${SOURCE_REVISION}"
echo "Entries: $(printf '%s\n' "${archive_entries}" | wc -l | tr -d ' ')"
