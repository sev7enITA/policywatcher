#!/usr/bin/env bash
# Initialize or upgrade the PolicyWatcher SQLite database on Hostinger.
#
# Usage:
#   export DATABASE_URL="file:/home/USER/domains/policywatcher.online/policywatcher-data/production.db"
#   bash scripts/hostinger-init-db.sh

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCAL_PRISMA="${APP_DIR}/node_modules/.bin/prisma"

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
  if [[ ! -x "${LOCAL_PRISMA}" ]]; then
    echo "The lockfile-installed Prisma CLI was not found. Run npm ci/redeploy first."
    echo "Refusing to download or execute an unpinned CLI during production startup."
    exit 1
  fi
  "${LOCAL_PRISMA}" "$@"
}

run_local_sqlite_initializer() {
  if command -v node >/dev/null 2>&1 && [[ -f "${APP_DIR}/scripts/hostinger-init-db.mjs" ]]; then
    node "${APP_DIR}/scripts/hostinger-init-db.mjs"
  elif command -v "${PYTHON_BIN}" >/dev/null 2>&1 && [[ -f "${APP_DIR}/scripts/hostinger-init-db.py" ]]; then
    "${PYTHON_BIN}" "${APP_DIR}/scripts/hostinger-init-db.py"
  else
    echo "No supported local SQLite initializer is available."
    return 1
  fi
}

repair_prisma_schema_engine_mode() {
  local engine
  for engine in "${APP_DIR}"/node_modules/@prisma/engines/schema-engine-*; do
    [[ -f "${engine}" ]] || continue
    if [[ ! -x "${engine}" ]]; then
      chmod u+x -- "${engine}" 2>/dev/null || true
    fi
  done
}

resolve_materialized_migrations() {
  if [[ ! -s "${DB_PATH}" || ! -f "${APP_DIR}/scripts/hostinger-detect-materialized-migrations.mjs" ]]; then
    return
  fi
  # Hostinger's managed build shell does not expose /dev/fd, so capture the
  # bounded migration-name list and consume it through a here-string.
  local materialized_migrations
  materialized_migrations="$(node "${APP_DIR}/scripts/hostinger-detect-materialized-migrations.mjs")"
  while IFS= read -r materialized_migration; do
    [[ -n "${materialized_migration}" ]] || continue
    if ! run_prisma migrate resolve --applied "${materialized_migration}" >/dev/null; then
      echo "Unable to register materialized migration: ${materialized_migration}"
      return 1
    fi
  done <<< "${materialized_migrations}"
}

normalize_sqlite_datetimes() {
  local normalizer="${APP_DIR}/scripts/hostinger-normalize-sqlite-datetimes.mjs"
  if command -v node >/dev/null 2>&1 && [[ -f "${normalizer}" ]]; then
    node "${normalizer}" --apply
  fi
}

create_consistent_sqlite_backup() {
  local source_path="$1"
  local backup_path="$2"
  if command -v "${PYTHON_BIN}" >/dev/null 2>&1; then
    "${PYTHON_BIN}" - "${source_path}" "${backup_path}" <<'PY'
import sqlite3
import sys

source_path, backup_path = sys.argv[1:3]
source = sqlite3.connect(f"file:{source_path}?mode=ro", uri=True, timeout=30)
target = sqlite3.connect(backup_path, timeout=30)
try:
    source.backup(target)
finally:
    target.close()
    source.close()
PY
  elif command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "${source_path}" ".backup '${backup_path}'"
  elif [[ -e "${source_path}-wal" || -e "${source_path}-shm" ]]; then
    echo "Cannot create a consistent WAL-aware backup without Python or sqlite3."
    return 1
  else
    cp "${source_path}" "${backup_path}"
  fi
}

configure_sqlite_runtime() {
  if command -v "${PYTHON_BIN}" >/dev/null 2>&1; then
    "${PYTHON_BIN}" - "${DB_PATH}" <<'PY'
import sqlite3
import sys

connection = sqlite3.connect(sys.argv[1], timeout=5)
try:
    connection.execute("PRAGMA busy_timeout = 5000")
    journal_mode = connection.execute("PRAGMA journal_mode = WAL").fetchone()[0]
    connection.execute("PRAGMA synchronous = NORMAL")
    connection.execute("PRAGMA wal_autocheckpoint = 1000")
    if str(journal_mode).lower() != "wal":
        raise RuntimeError(f"SQLite refused WAL mode: {journal_mode}")
finally:
    connection.close()
PY
  elif command -v sqlite3 >/dev/null 2>&1; then
    local journal_mode
    journal_mode="$(sqlite3 "${DB_PATH}" 'PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA wal_autocheckpoint=1000;' | tail -n 2 | head -n 1)"
    if [[ "${journal_mode,,}" != "wal" ]]; then
      echo "SQLite refused WAL mode: ${journal_mode}"
      return 1
    fi
  else
    echo "Python or sqlite3 is required to configure the SQLite runtime."
    return 1
  fi
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
  if [[ "${POLICYWATCHER_SKIP_DB_BACKUP:-0}" != "1" ]]; then
    BACKUP="${DB_PATH}.backup-$(date +%Y%m%d%H%M%S)"
    create_consistent_sqlite_backup "${DB_PATH}" "${BACKUP}"
    echo "Backup created: ${BACKUP}"
  fi
else
  # Prisma's SQLite schema engine expects the target file to exist on some
  # hosts even when the containing directory is writable.
  touch "${DB_PATH}"
  chmod 600 "${DB_PATH}"
fi

if [[ "${POLICYWATCHER_FORCE_SQLITE_FALLBACK:-0}" != "1" ]] && [[ -d "${APP_DIR}/prisma/migrations" ]] && [[ -x "${LOCAL_PRISMA}" ]]; then
  repair_prisma_schema_engine_mode
  if run_prisma generate; then
    resolve_materialized_migrations
    if ! run_prisma migrate deploy; then
      echo "Prisma migration engine unavailable; using the bundled Node or Python SQLite initializer."
      run_local_sqlite_initializer
      # The fallback creates the same additive tables and indexes. Register all
      # now-materialized migrations immediately so readiness is not degraded
      # until the next deployment.
      resolve_materialized_migrations
    fi
  else
    echo "Prisma generate unavailable during initialization; using the bundled Node or Python SQLite initializer."
    run_local_sqlite_initializer
  fi
else
  run_local_sqlite_initializer
  if command -v node >/dev/null 2>&1 && [[ -x "${LOCAL_PRISMA}" ]]; then
    resolve_materialized_migrations
  fi
fi

normalize_sqlite_datetimes
configure_sqlite_runtime

echo "Database schema is ready."
echo "If this is a new database with 0 policies, run: node scripts/hostinger-seed-inventory.mjs"
echo "Do not run /api/seed in production. Use the admin Cron Manager to perform verified re-baseline scans."
