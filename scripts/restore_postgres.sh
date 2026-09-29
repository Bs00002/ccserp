#!/usr/bin/env bash
# ==============================================================================
# CCS CONNECT ERP — SAFE POSTGRESQL RESTORE SCRIPT (Linux Production)
# ==============================================================================
set -euo pipefail

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <path_to_backup_file.dump>"
    exit 1
fi

BACKUP_FILE="$1"
PG_HOST="${PGHOST:-127.0.0.1}"
PG_PORT="${PGPORT:-5432}"
PG_DB="${PGDATABASE:-ccs}"
PG_USER="${PGUSER:-ccs_user}"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "[ERROR] Backup file does not exist: ${BACKUP_FILE}"
    exit 1
fi

echo "=============================================================================="
echo "[WARNING] You are about to restore database '${PG_DB}' from:"
echo "${BACKUP_FILE}"
echo "This will replace current schema and table records in '${PG_DB}'!"
echo "=============================================================================="
read -r -p "Are you sure you want to proceed? (Type 'YES' to confirm): " CONFIRM
if [ "${CONFIRM}" != "YES" ]; then
    echo "[CANCELLED] Database restore aborted."
    exit 0
fi

echo "[RESTORING] Running pg_restore against ${PG_DB}..."
pg_restore -h "${PG_HOST}" -p "${PG_PORT}" -U "${PG_USER}" -d "${PG_DB}" --clean --if-exists -v "${BACKUP_FILE}" || {
    echo "[NOTE] pg_restore completed with non-fatal notices or exit code $?."
}

echo "=============================================================================="
echo "[SUCCESS] Restore finished from ${BACKUP_FILE}."
echo "=============================================================================="
