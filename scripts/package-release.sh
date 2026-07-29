#!/usr/bin/env bash
# Build and verify a clean, traceable Hostinger source artifact.

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="${1:-${APP_DIR}/artifacts/hostinger}"
VERSION="$(node -p "require('${APP_DIR}/package.json').version")"
LOCK_VERSION="$(node -p "require('${APP_DIR}/package-lock.json').version")"
RELEASE_NAME="$(sed -n "s/.*POLICYWATCHER_RELEASE_NAME = '\([^']*\)'.*/\1/p" "${APP_DIR}/src/lib/release.ts")"
RELEASE_VERSION="$(sed -n "s/.*POLICYWATCHER_VERSION = '\([^']*\)'.*/\1/p" "${APP_DIR}/src/lib/release.ts")"
SOURCE_REVISION="$(git -C "${APP_DIR}" rev-parse HEAD)"
DATE_STAMP="$(date +%Y-%m-%d)"
ARTIFACT_LABEL="${POLICYWATCHER_ARTIFACT_LABEL:-}"
if [[ -n "${ARTIFACT_LABEL}" ]] && [[ ! "${ARTIFACT_LABEL}" =~ ^[a-z0-9][a-z0-9.-]*$ ]]; then
  echo "POLICYWATCHER_ARTIFACT_LABEL must contain lowercase letters, numbers, dots or hyphens." >&2
  exit 1
fi
ARTIFACT_SUFFIX="${ARTIFACT_LABEL:+-${ARTIFACT_LABEL}}"
ARCHIVE_NAME="PolicyWatcher-${VERSION}-hostinger-${DATE_STAMP}${ARTIFACT_SUFFIX}.zip"
ARCHIVE="${OUTPUT_DIR}/${ARCHIVE_NAME}"
CHECKSUM="${ARCHIVE}.sha256"
STAGING_DIR="$(mktemp -d /tmp/policywatcher-package.XXXXXX)"
EXTRACT_DIR="$(mktemp -d /tmp/policywatcher-verify.XXXXXX)"

cleanup() {
  find "${STAGING_DIR}" "${EXTRACT_DIR}" -depth -delete 2>/dev/null || true
}
trap cleanup EXIT

if ! git -C "${APP_DIR}" diff --quiet || ! git -C "${APP_DIR}" diff --cached --quiet; then
  echo "Tracked source changes are not committed; refusing to create an untraceable release artifact." >&2
  exit 1
fi
if [[ "${VERSION}" != "${LOCK_VERSION}" || "${VERSION}" != "${RELEASE_VERSION}" ]]; then
  echo "Release version mismatch: package=${VERSION}, lock=${LOCK_VERSION}, UI=${RELEASE_VERSION}." >&2
  exit 1
fi
if [[ -z "${RELEASE_NAME}" ]]; then
  echo "Release name is missing from src/lib/release.ts." >&2
  exit 1
fi

mkdir -p "${OUTPUT_DIR}"
if [[ -e "${ARCHIVE}" || -e "${CHECKSUM}" ]]; then
  echo "Release output already exists; move it aside before rebuilding: ${ARCHIVE}" >&2
  exit 1
fi

required_sources=(
  package.json package-lock.json next.config.ts tsconfig.json next-env.d.ts server.js
  README.md HOSTINGER-DEPLOY.md CHANGELOG.md SECURITY.md LICENSE .env.example public src prisma scripts integrations
  docs/dataset-confidence-audit-2026-07-05.md docs/audit-v3.6.5.md
  docs/audit-v3.7.0.md docs/audit-v3.7.1.md docs/audit-v3.7.2.md docs/audit-v3.8.0.md docs/audit-v3.8.1.md docs/audit-v3.8.2.md docs/audit-v3.8.3.md docs/audit-v3.8.3-beta.2.md docs/audit-v3.8.3-beta.3.md docs/audit-v3.8.3-beta.4.md docs/beta-evidence-cycle-v3.8.3.md docs/platform-state-of-art-2026-07-05.md
  docs/audit-v3.9.0-beta.1.md docs/audit-v3.9.0-beta.2.md docs/audit-v3.9.0-beta.3.md docs/audit-v3.9.0-beta.4.md docs/audit-v3.9.0-beta.5.md docs/audit-v3.9.0-beta.6.md docs/audit-v3.9.0-beta.7.md docs/audit-v3.9.0-beta.8.md docs/audit-v3.9.0-beta.9.md docs/audit-v3.9.0-beta.10.md docs/audit-v3.9.0-beta.11.md docs/audit-v3.9.0-beta.12.md docs/audit-v3.9.0-beta.13.md docs/audit-v3.9.0-beta.14.md docs/audit-v3.9.0-beta.15.md docs/audit-v3.9.0-beta.16.md docs/audit-v3.9.0-beta.17.md docs/audit-v3.9.0-beta.18.md docs/audit-v3.9.0-beta.19.md docs/platform-state-of-art-2026-07-05.it.md docs/third-party-validation.md docs/public-api-v1.md docs/integrations.md docs/azure/enterprise-api-v2.md docs/azure/apim-policy.xml
  docs/architecture/native-dashboard-engine.md docs/architecture/native-dashboard-functional-implementation-report.md docs/architecture/vizro-patterns-knowledge-base.md
  docs/native-dashboard-user-guide.md
  docs/press-outreach-2026-07-27.md
  docs/press-newsroom-measurement.md
  docs/editorial-pulse.md
  docs/press-release-3.9.0-beta.13-it.md
  docs/press-release-3.9.0-beta.13-en.md
)
for source in "${required_sources[@]}"; do
  if [[ ! -e "${APP_DIR}/${source}" ]]; then
    echo "Required release source is missing: ${source}" >&2
    exit 1
  fi
  mkdir -p "${STAGING_DIR}/$(dirname "${source}")"
  cp -R "${APP_DIR}/${source}" "${STAGING_DIR}/${source}"
done

# Directory sources are copied recursively for a self-contained deployment, but
# unrelated untracked files in those directories must never enter a release.
# New release assets are therefore packaged only after they have been committed.
while IFS= read -r untracked; do
  [[ -z "${untracked}" ]] && continue
  if [[ -e "${STAGING_DIR}/${untracked}" ]]; then
    find "${STAGING_DIR}/${untracked}" -depth -delete
  fi
done < <(git -C "${APP_DIR}" ls-files --others --exclude-standard -- public src prisma scripts integrations)

find "${STAGING_DIR}" -type f \( -path '*/__tests__/*' -o -path '*/__pycache__/*' \) -delete
find "${STAGING_DIR}" -depth -type d \( -name __tests__ -o -name __pycache__ \) -delete
find "${STAGING_DIR}" -type f \( -name '*.db' -o -name '*.sqlite' -o -name '*.sqlite3' -o -name '*.pyc' -o -name '.DS_Store' \) -delete

node -e '
  const fs = require("fs");
  const [target, version, releaseName, revision, artifactLabel] = process.argv.slice(1);
  fs.writeFileSync(target, JSON.stringify({
    product: "PolicyWatcher",
    version,
    releaseName,
    sourceRevision: revision,
    builtAt: new Date().toISOString(),
    target: "Hostinger Next.js source deployment",
    startupCommand: "npm start",
    startupFile: "server.js",
    databaseIncluded: false,
    artifactLabel: artifactLabel || null
  }, null, 2) + "\n");
' "${STAGING_DIR}/release-manifest.json" "${VERSION}" "${RELEASE_NAME}" "${SOURCE_REVISION}" "${ARTIFACT_LABEL}"

(cd "${STAGING_DIR}" && zip -q -r "${ARCHIVE}" .)

archive_entries="$(zipinfo -1 "${ARCHIVE}")"
if printf '%s\n' "${archive_entries}" | grep -E '(^/|(^|/)\.\.(/|$))' >/dev/null; then
  echo "Archive contains an absolute or traversal path." >&2
  exit 1
fi
if printf '%s\n' "${archive_entries}" | grep -E '(^|/)(node_modules|\.next|\.git|artifacts|__tests__|__pycache__)(/|$)|\.(db|sqlite|sqlite3|pyc|pem|p12|pfx|key)$|-(wal|shm|journal)$' >/dev/null; then
  echo "Archive contains a forbidden runtime, database, test, cache, or secret-key path." >&2
  exit 1
fi
while IFS= read -r entry; do
  case "${entry}" in
    .env.example) ;;
    .env|.env.*|*/.env|*/.env.*)
      echo "Archive contains an environment secret file: ${entry}" >&2
      exit 1
      ;;
  esac
done <<< "${archive_entries}"

required_entries=(
  package.json package-lock.json release-manifest.json HOSTINGER-DEPLOY.md server.js src/lib/release.ts
  src/app/api/admin/database-readiness/route.ts src/lib/databaseReadiness.ts
  src/app/integrations/page.tsx src/app/api/v2/openapi.json/route.ts
  src/app/collections/page.tsx src/app/api/v1/evidence-collections/route.ts src/lib/evidenceCollection.ts
  src/app/api/v1/change-events/route.ts src/lib/publicChangeEvents.ts src/lib/publicChangeEventData.ts
  src/app/pulse/page.tsx src/app/pulse/[slug]/page.tsx
  src/app/api/pulse/story-pack/[slug]/route.ts src/app/embed/pulse/[slug]/page.tsx
  docs/integrations.md docs/azure/enterprise-api-v2.md docs/azure/apim-policy.xml
  integrations/power-platform/policywatcher-v2/apiDefinition.swagger.template.json
  prisma/schema.prisma prisma/migrations/20260721150000_policy_inquiry/migration.sql
  prisma/migrations/20260729153000_public_change_publication_time/migration.sql
  scripts/hostinger-init-db.sh scripts/hostinger-init-db.mjs
  scripts/hostinger-init-db.py scripts/hostinger-detect-materialized-migrations.mjs
  scripts/hostinger-postinstall-db.mjs
)
for entry in "${required_entries[@]}"; do
  if ! printf '%s\n' "${archive_entries}" | grep -Fx "${entry}" >/dev/null; then
    echo "Archive is missing required entry: ${entry}" >&2
    exit 1
  fi
done

unzip -q "${ARCHIVE}" -d "${EXTRACT_DIR}"
if find "${EXTRACT_DIR}" -type l -print -quit | grep -q .; then
  echo "Archive contains a symbolic link." >&2
  exit 1
fi
node -e '
  const fs = require("fs");
  const path = process.argv[1];
  const pkg = require(path + "/package.json");
  const lock = require(path + "/package-lock.json");
  const manifest = require(path + "/release-manifest.json");
  const release = fs.readFileSync(path + "/src/lib/release.ts", "utf8");
  const versionPattern = new RegExp(`POLICYWATCHER_VERSION\\s*=\\s*["\x27]${pkg.version.replaceAll(".", "\\.")}["\x27]`);
  if (pkg.version !== lock.version || pkg.version !== manifest.version || !versionPattern.test(release)) {
    throw new Error("Extracted release metadata is inconsistent");
  }
' "${EXTRACT_DIR}"

(cd "${OUTPUT_DIR}" && shasum -a 256 "${ARCHIVE_NAME}" > "${ARCHIVE_NAME}.sha256")
echo "Hostinger artifact: ${ARCHIVE}"
echo "Checksum: ${CHECKSUM}"
echo "Source revision: ${SOURCE_REVISION}"
echo "Entries: $(printf '%s\n' "${archive_entries}" | wc -l | tr -d ' ')"
