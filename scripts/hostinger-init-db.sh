#!/usr/bin/env bash
# Initialize or upgrade the PolicyWatcher SQLite database on Hostinger.
#
# Usage:
#   export DATABASE_URL="file:/home/USER/domains/policywatcher.online/policywatcher-data/production.db"
#   bash scripts/hostinger-init-db.sh

set -euo pipefail

APP_DIR="$(pwd)"

if ! command -v python3 >/dev/null 2>&1 && command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
else
  PYTHON_BIN="python3"
fi

if ! command -v "${PYTHON_BIN}" >/dev/null 2>&1 && ! command -v node >/dev/null 2>&1; then
  NODE_BIN="$(find "${HOME}" /opt/alt -path '*/bin/node' -type f -print -quit 2>/dev/null || true)"
  if [[ -n "${NODE_BIN}" ]]; then
    export PATH="$(dirname "${NODE_BIN}"):${PATH}"
  fi
fi

if ! command -v "${PYTHON_BIN}" >/dev/null 2>&1 && ! command -v node >/dev/null 2>&1; then
  echo "Neither Python nor Node.js was found in this SSH shell PATH."
  echo "Activate the Hostinger Node.js environment first, or install/enable Python, then rerun this script."
  echo "Useful check:"
  echo "  python3 --version"
  echo "  find \\$HOME /opt/alt -path '*/bin/node' -o -path '*/bin/npm' -o -path '*/bin/npx' | head"
  exit 1
fi

run_prisma() {
  if [[ -x "${APP_DIR}/node_modules/.bin/prisma" ]]; then
    "${APP_DIR}/node_modules/.bin/prisma" "$@"
    return
  fi

  if command -v npx >/dev/null 2>&1; then
    npx prisma "$@"
    return
  fi

  if command -v npm >/dev/null 2>&1; then
    npm exec -- prisma "$@"
    return
  fi

  echo "Prisma CLI was not found. Run npm install/redeploy first, then rerun this script."
  exit 1
}

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set."
  echo "Example:"
  echo "  export DATABASE_URL=\"file:/home/USER/domains/policywatcher.online/policywatcher-data/production.db\""
  exit 1
fi

if [[ "${DATABASE_URL}" != file:* ]]; then
  echo "This helper currently supports SQLite file: DATABASE_URL values only."
  exit 1
fi

DB_PATH="${DATABASE_URL#file:}"
if [[ "${DB_PATH}" == ./* || "${DB_PATH}" == ../* ]]; then
  DB_PATH="$(cd prisma && mkdir -p "$(dirname "${DB_PATH}")" && cd "$(dirname "${DB_PATH}")" && pwd)/$(basename "${DB_PATH}")"
fi

DB_DIR="$(dirname "${DB_PATH}")"
mkdir -p "${DB_DIR}"

echo "Database file: ${DB_PATH}"
echo "Directory: ${DB_DIR}"

if [[ ! -w "${DB_DIR}" ]]; then
  echo "Database directory is not writable by the current user."
  exit 1
fi

if [[ -f "${DB_PATH}" ]]; then
  BACKUP="${DB_PATH}.backup-$(date +%Y%m%d%H%M%S)"
  cp "${DB_PATH}" "${BACKUP}"
  echo "Backup created: ${BACKUP}"
else
  # Prisma's SQLite schema engine expects the target file to exist on some
  # hosts even when the containing directory is writable.
  touch "${DB_PATH}"
  chmod 600 "${DB_PATH}"
fi

if [[ -d "${APP_DIR}/prisma/migrations" ]] && { [[ -x "${APP_DIR}/node_modules/.bin/prisma" ]] || command -v npx >/dev/null 2>&1 || command -v npm >/dev/null 2>&1; }; then
  run_prisma generate
  if [[ -s "${DB_PATH}" && -d "${APP_DIR}/prisma/migrations/20260706213500_init" ]]; then
    run_prisma migrate resolve --applied 20260706213500_init >/dev/null 2>&1 || true
  fi
  run_prisma migrate deploy
elif [[ -f "${APP_DIR}/scripts/hostinger-init-db.py" ]] && command -v "${PYTHON_BIN}" >/dev/null 2>&1; then
  "${PYTHON_BIN}" "${APP_DIR}/scripts/hostinger-init-db.py"
elif [[ -f "${APP_DIR}/scripts/hostinger-init-db.mjs" ]]; then
  node "${APP_DIR}/scripts/hostinger-init-db.mjs"
else
  run_prisma generate
  run_prisma migrate deploy
fi

echo "Database schema is ready."
echo "If this is a new database with 0 policies, run: node scripts/hostinger-seed-inventory.mjs"
echo "Do not run /api/seed in production. Use the admin Cron Manager to perform verified re-baseline scans."
