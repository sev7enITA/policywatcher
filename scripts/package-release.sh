#!/bin/bash
# ============================================================================
# POLICY WATCHER - HOSTINGER SOURCE PACKAGE
# Creates a clean source ZIP for Hostinger's Next.js build pipeline.
# ============================================================================

set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

VERSION="$(node -p "require('./package.json').version")"
DATE_STAMP="$(date +%Y-%m-%d)"
ARCHIVE="PolicyWatcher-${VERSION}-hostinger-${DATE_STAMP}.zip"

echo -e "${BLUE}[1/4] Preparing Hostinger source package ${ARCHIVE}...${NC}"
rm -f "${ARCHIVE}"

echo -e "${BLUE}[2/4] Zipping application source with deployment-safe exclusions...${NC}"
zip -q -r "${ARCHIVE}" \
  package.json \
  package-lock.json \
  next.config.ts \
  tsconfig.json \
  next-env.d.ts \
  server.js \
  README.md \
  CHANGELOG.md \
  SECURITY.md \
  LICENSE \
  .env.example \
  public \
  src \
  prisma \
  scripts \
  docs/dataset-confidence-audit-2026-07-05.md \
  docs/platform-state-of-art-2026-07-05.md \
  docs/platform-state-of-art-2026-07-05.it.md \
  docs/third-party-validation.md \
  -x 'src/**/__tests__/' \
  -x 'src/**/__tests__/**' \
  -x 'prisma/dev.db' \
  -x 'prisma/dev.db-journal' \
  -x '*.db' \
  -x '*.sqlite' \
  -x '*.sqlite3' \
  -x '*.DS_Store'

echo -e "${BLUE}[3/4] Verifying package does not contain database files...${NC}"
if zipinfo -1 "${ARCHIVE}" | grep -E '(^|/)(dev\.db|.*\.(db|sqlite|sqlite3))$' >/dev/null; then
  echo -e "${RED}Package contains a database file. Aborting.${NC}"
  rm -f "${ARCHIVE}"
  exit 1
fi

echo -e "${GREEN}[4/4] Success! Hostinger package created:${NC}"
ls -lh "${ARCHIVE}"
