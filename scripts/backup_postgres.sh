#!/usr/bin/env bash
# ==============================================================================
# CCS CONNECT ERP — SAFE POSTGRESQL BACKUP SCRIPT (Linux Production)
# ==============================================================================
set -euo pipefail

PG_HOST="${PGHOST:-127.0.0.1}"
PG_PORT="${PGPORT:-5432}"
PG_DB="${PGDATABASE:-ccs}"
PG_USER="${PGUSER:-ccs_user}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

mkdir -p "${BACKUP_DIR}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/ccs_backup_${TIMESTAMP}.dump"
BACKUP_SQL="${BACKUP_DIR}/ccs_backup_${TIMESTAMP}.sql.gz"

echo "=============================================================================="
echo "[BACKUP START] Backing up database '${PG_DB}' on ${PG_HOST}:${PG_PORT}..."
echo "=============================================================================="

# 1. Custom format (ideal for pg_restore with parallelism and selective restore)
pg_dump -h "${PG_HOST}" -p "${PG_PORT}" -U "${PG_USER}" -d "${PG_DB}" -F c -b -v -f "${BACKUP_FILE}"

# 2. Compressed plain SQL dump (human-readable disaster recovery)
pg_dump -h "${PG_HOST}" -p "${PG_PORT}" -U "${PG_USER}" -d "${PG_DB}" | gzip > "${BACKUP_SQL}"

# 3. Retention policy: Prune backups older than 30 days
find "${BACKUP_DIR}" -type f -name "ccs_backup_*" -mtime +30 -delete

echo "=============================================================================="
echo "[BACKUP SUCCESS] Backup completed successfully:"
echo "1. ${BACKUP_FILE}"
echo "2. ${BACKUP_SQL}"
echo "=============================================================================="
