#!/bin/bash
# Database backup script for LMS Bimbel
# Usage: ./backup-db.sh
# Cron: 0 2 * * * /path/to/lms-bimbel/scripts/backup-db.sh

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_URL="${DATABASE_URL:?DATABASE_URL not set}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting database backup..."

# Parse DATABASE_URL
DB_PROTO=$(echo "$DB_URL" | sed -n 's/^\([^:]*\):\/\/.*/\1/p')
DB_USER=$(echo "$DB_URL" | sed -n 's/^[^:]*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DB_URL" | sed -n 's/^[^:]*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo "$DB_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DB_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo "$DB_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

export PGPASSWORD="$DB_PASS"

pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner --no-acl \
  | gzip > "$BACKUP_FILE"

unset PGPASSWORD

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# Cleanup old backups
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "[$(date)] Cleaned up backups older than ${RETENTION_DAYS} days"

# Verify backup (test decompress)
if gzip -t "$BACKUP_FILE" 2>/dev/null; then
  echo "[$(date)] Backup verification: OK"
else
  echo "[$(date)] ERROR: Backup verification failed!"
  exit 1
fi

echo "[$(date)] Backup complete."
