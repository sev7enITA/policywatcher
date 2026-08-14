#!/usr/bin/env bash
# Build and verify a clean, traceable VPS Operations Agent bootstrap artifact.

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_INPUT="${1:-${APP_DIR}/artifacts/renderer}"
if [[ "${OUTPUT_INPUT}" = /* ]]; then
  OUTPUT_DIR="${OUTPUT_INPUT}"
else
  OUTPUT_DIR="${APP_DIR}/${OUTPUT_INPUT}"
fi

VERSION="$(node -p "require('${APP_DIR}/vps-agent/package.json').version")"
LOCK_VERSION="$(node -p "require('${APP_DIR}/vps-agent/package-lock.json').version")"
SOURCE_REVISION="$(git -C "${APP_DIR}" rev-parse HEAD)"
DATE_STAMP="$(date +%Y-%m-%d)"
ARTIFACT_LABEL="${POLICYWATCHER_ARTIFACT_LABEL:-}"
if [[ -n "${ARTIFACT_LABEL}" ]] && [[ ! "${ARTIFACT_LABEL}" =~ ^[a-z0-9][a-z0-9.-]*$ ]]; then
  echo "POLICYWATCHER_ARTIFACT_LABEL must contain lowercase letters, numbers, dots or hyphens." >&2
  exit 1
fi
ARTIFACT_SUFFIX="${ARTIFACT_LABEL:+-${ARTIFACT_LABEL}}"
ARCHIVE_NAME="PolicyWatcher-vps-agent-${VERSION}-bootstrap-${DATE_STAMP}${ARTIFACT_SUFFIX}.zip"
ARCHIVE="${OUTPUT_DIR}/${ARCHIVE_NAME}"
CHECKSUM="${ARCHIVE}.sha256"
STAGING_DIR="$(mktemp -d /tmp/policywatcher-vps-agent-package.XXXXXX)"
EXTRACT_DIR="$(mktemp -d /tmp/policywatcher-vps-agent-verify.XXXXXX)"

cleanup() {
  find "${STAGING_DIR}" "${EXTRACT_DIR}" -depth -delete 2>/dev/null || true
}
trap cleanup EXIT

if ! git -C "${APP_DIR}" diff --quiet || ! git -C "${APP_DIR}" diff --cached --quiet; then
  echo "Tracked source changes are not committed; refusing to create an untraceable Agent artifact." >&2
  exit 1
fi
if [[ "${VERSION}" != "${LOCK_VERSION}" ]]; then
  echo "Agent version mismatch: package=${VERSION}, lock=${LOCK_VERSION}." >&2
  exit 1
fi
if [[ -e "${ARCHIVE}" || -e "${CHECKSUM}" ]]; then
  echo "Agent output already exists: ${ARCHIVE}" >&2
  exit 1
fi

mkdir -p "${OUTPUT_DIR}" "${STAGING_DIR}/vps-agent"
for source in package.json package-lock.json agent.mjs README.md; do
  cp "${APP_DIR}/vps-agent/${source}" "${STAGING_DIR}/vps-agent/${source}"
done

node -e '
  const fs = require("fs");
  const [target, version, revision] = process.argv.slice(1);
  fs.writeFileSync(target, JSON.stringify({
    product: "PolicyWatcher VPS Operations Agent",
    version,
    sourceRevision: revision,
    builtAt: new Date().toISOString(),
    target: "VPS Node.js control-plane service",
    installCommand: "npm ci --omit=dev",
    startupCommand: "npm start",
    managedRendererUpload: true,
    selfUpdateIncluded: false
  }, null, 2) + "\n");
' "${STAGING_DIR}/vps-agent/release-manifest.json" "${VERSION}" "${SOURCE_REVISION}"

(cd "${STAGING_DIR}" && zip -q -r "${ARCHIVE}" vps-agent)
archive_entries="$(zipinfo -1 "${ARCHIVE}")"
if printf '%s\n' "${archive_entries}" | grep -E '(^/|(^|/)\.\.(/|$))' >/dev/null; then
  echo "Agent archive contains an absolute or traversal path." >&2
  exit 1
fi
if printf '%s\n' "${archive_entries}" | grep -E '(^|/)(node_modules|\.git|artifacts)(/|$)|(^|/)agent\.test\.mjs$|(^|/)\.env($|\.)|\.(pem|p12|pfx|key)$' >/dev/null; then
  echo "Agent archive contains a forbidden runtime, test or secret path." >&2
  exit 1
fi
for entry in vps-agent/package.json vps-agent/package-lock.json vps-agent/agent.mjs vps-agent/README.md vps-agent/release-manifest.json; do
  if ! printf '%s\n' "${archive_entries}" | grep -Fx "${entry}" >/dev/null; then
    echo "Agent archive is missing required entry: ${entry}" >&2
    exit 1
  fi
done

unzip -q "${ARCHIVE}" -d "${EXTRACT_DIR}"
if find "${EXTRACT_DIR}" -type l -print -quit | grep -q .; then
  echo "Agent archive contains a symbolic link." >&2
  exit 1
fi
node --check "${EXTRACT_DIR}/vps-agent/agent.mjs"
node -e '
  const path = process.argv[1];
  const pkg = require(path + "/package.json");
  const lock = require(path + "/package-lock.json");
  const manifest = require(path + "/release-manifest.json");
  if (pkg.version !== lock.version || pkg.version !== manifest.version || manifest.managedRendererUpload !== true) {
    throw new Error("Extracted Agent metadata is inconsistent");
  }
' "${EXTRACT_DIR}/vps-agent"

(cd "${OUTPUT_DIR}" && shasum -a 256 "${ARCHIVE_NAME}" > "${ARCHIVE_NAME}.sha256")
echo "VPS Agent artifact: ${ARCHIVE}"
echo "Checksum: ${CHECKSUM}"
echo "Source revision: ${SOURCE_REVISION}"
echo "Entries: $(printf '%s\n' "${archive_entries}" | wc -l | tr -d ' ')"
