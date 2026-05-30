#!/usr/bin/env bash
# scripts/backup-db.sh
# Usage: ./scripts/backup-db.sh
# Reads DB credentials from environment variables (or .env file).
# Optionally uploads to S3 if AWS_S3_BACKUP_BUCKET is set.
set -euo pipefail

# Load .env if present and not already set
if [ -f "$(dirname "$0")/../.env" ]; then
  # shellcheck disable=SC1091
  set -a; source "$(dirname "$0")/../.env"; set +a
fi

: "${DATABASE_URL:?DATABASE_URL is required}"

TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
BACKUP_DIR="${BACKUP_DIR:-/tmp/db-backups}"
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[backup] Starting pg_dump at ${TIMESTAMP}"

# Parse DATABASE_URL: postgres://user:pass@host:port/dbname
if [[ "$DATABASE_URL" =~ ^postgres(ql)?://([^:]+):([^@]+)@([^:/]+):?([0-9]*)/(.+)$ ]]; then
  DB_USER="${BASH_REMATCH[2]}"
  DB_PASS="${BASH_REMATCH[3]}"
  DB_HOST="${BASH_REMATCH[4]}"
  DB_PORT="${BASH_REMATCH[5]:-5432}"
  DB_NAME="${BASH_REMATCH[6]}"
else
  echo "[backup] ERROR: Could not parse DATABASE_URL" >&2
  exit 1
fi

export PGPASSWORD="$DB_PASS"

if ! pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"; then
  echo "[backup] ERROR: pg_dump failed" >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "[backup] Backup saved: ${BACKUP_FILE} (${SIZE})"

# Optional S3 upload
if [ -n "${AWS_S3_BACKUP_BUCKET:-}" ]; then
  S3_KEY="${AWS_S3_BACKUP_PREFIX:-backups}/$(basename "$BACKUP_FILE")"
  echo "[backup] Uploading to s3://${AWS_S3_BACKUP_BUCKET}/${S3_KEY}"
  aws s3 cp "$BACKUP_FILE" "s3://${AWS_S3_BACKUP_BUCKET}/${S3_KEY}"
  echo "[backup] Upload complete"
fi

echo "[backup] Done"
