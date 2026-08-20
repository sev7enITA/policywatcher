#!/usr/bin/env bash
# Provider-aware production database preparation.
# SQLite remains the default Hostinger path. PostgreSQL is fail-closed until
# an explicit cutover approval is present in the deployment environment.

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATABASE_URL_NORMALIZED="${DATABASE_URL:-}"

if [[ -z "${DATABASE_URL_NORMALIZED}" ]]; then
  echo "DATABASE_URL is not set."
  exit 1
fi

case "${DATABASE_URL_NORMALIZED}" in
  file:*)
    exec bash "${APP_DIR}/scripts/hostinger-init-db.sh"
    ;;
  postgresql://*|postgres://*)
    if [[ "${POLICYWATCHER_POSTGRESQL_CUTOVER_APPROVED:-0}" != "1" ]]; then
      echo "PostgreSQL cutover is disabled. Set POLICYWATCHER_POSTGRESQL_CUTOVER_APPROVED=1 only after an approved rehearsal."
      exit 1
    fi
    exec node "${APP_DIR}/scripts/prisma-active-schema.mjs" migrate-deploy
    ;;
  *)
    echo "Unsupported DATABASE_URL protocol."
    exit 1
    ;;
esac
