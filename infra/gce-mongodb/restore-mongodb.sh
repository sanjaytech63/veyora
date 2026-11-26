#!/usr/bin/env bash
# ==============================================================================
# MongoDB Restore & Verification Procedure
# ==============================================================================
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 /path/to/dump_YYYYMMDD_HHMMSS"
  exit 1
fi

DUMP_PATH="$1"
source /opt/veyora-mongodb/.env

if [ ! -d "${DUMP_PATH}" ]; then
  echo "Error: Directory ${DUMP_PATH} does not exist."
  exit 1
fi

echo "=== Restoring database '${MONGO_DATABASE:-veyora_prod}' from ${DUMP_PATH} ==="
# Copy dump inside container temporary mount
docker cp "${DUMP_PATH}/${MONGO_DATABASE:-veyora_prod}" veyora-mongodb-prod:/tmp/restore_db

# Perform mongorestore with --drop to recreate collections cleanly
docker exec veyora-mongodb-prod mongorestore \
  --username "${MONGO_ROOT_USER}" \
  --password "${MONGO_ROOT_PASSWORD}" \
  --authenticationDatabase admin \
  --db "${MONGO_DATABASE:-veyora_prod}" \
  --drop \
  --gzip \
  /tmp/restore_db

# Clean up
docker exec veyora-mongodb-prod rm -rf /tmp/restore_db

echo "=== Restore completed successfully. Testing ping ==="
docker exec veyora-mongodb-prod mongosh \
  --username "${MONGO_APP_USER:-veyora_app_user}" \
  --password "${MONGO_APP_PASSWORD}" \
  --authenticationDatabase "${MONGO_DATABASE:-veyora_prod}" \
  "${MONGO_DATABASE:-veyora_prod}" \
  --eval "db.runCommand({ ping: 1 })"
