#!/usr/bin/env bash
# ==============================================================================
# Automated MongoDB Backup Script for Compute Engine (Local Dump + GCS Sync)
# ==============================================================================
set -euo pipefail

BACKUP_DIR="/mnt/disks/mongodb-data/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TARGET_DIR="${BACKUP_DIR}/dump_${TIMESTAMP}"
GCS_BUCKET="${GCS_BACKUP_BUCKET:-gs://veyora-production-backups/mongodb}"

source /opt/veyora-mongodb/.env

echo "=== [$(date)] Starting MongoDB compressed mongodump ==="
docker exec veyora-mongodb-prod mongodump \
  --username "${MONGO_ROOT_USER}" \
  --password "${MONGO_ROOT_PASSWORD}" \
  --authenticationDatabase admin \
  --db "${MONGO_DATABASE:-veyora_prod}" \
  --gzip \
  --out "/data/db/backups/dump_${TIMESTAMP}"

# Move to dedicated backup disk storage
mv "/mnt/disks/mongodb-data/data/db/backups/dump_${TIMESTAMP}" "${TARGET_DIR}"

echo "=== Archive created at ${TARGET_DIR}. Syncing to Google Cloud Storage ==="
if command -v gsutil &> /dev/null; then
  gsutil -m rsync -r "${TARGET_DIR}" "${GCS_BUCKET}/dump_${TIMESTAMP}"
  echo "Uploaded backup to ${GCS_BUCKET}/dump_${TIMESTAMP}"
fi

# Retention policy: Delete local dumps older than 7 days
find "${BACKUP_DIR}" -maxdepth 1 -type d -name "dump_*" -mtime +7 -exec rm -rf {} +
echo "=== Backup completed and retention pruned successfully ==="
