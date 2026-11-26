#!/usr/bin/env bash
# ==============================================================================
# Google Compute Engine Instance Startup Script for MongoDB on Persistent Disk
# ==============================================================================
set -euo pipefail

DISK_DEVICE="/dev/disk/by-id/google-mongodb-data"
MOUNT_POINT="/mnt/disks/mongodb-data"

echo "=== [1/5] Formatting and mounting persistent disk ==="
if ! blkid "${DISK_DEVICE}"; then
  echo "Formatting persistent disk ${DISK_DEVICE} with ext4..."
  mkfs.ext4 -m 0 -E lazy_itable_init=0,lazy_journal_init=0,discard "${DISK_DEVICE}"
fi

mkdir -p "${MOUNT_POINT}"
if ! grep -qs "${MOUNT_POINT}" /proc/mounts; then
  mount -o discard,defaults "${DISK_DEVICE}" "${MOUNT_POINT}"
  echo "${DISK_DEVICE} ${MOUNT_POINT} ext4 discard,defaults,nofail 0 2" >> /etc/fstab
fi

mkdir -p "${MOUNT_POINT}/data/db" "${MOUNT_POINT}/data/configdb" "${MOUNT_POINT}/backups"
chmod -R 777 "${MOUNT_POINT}/data"

echo "=== [2/5] Installing Docker Engine ==="
apt-get update -y
apt-get install -y ca-certificates curl gnupg lsb-release

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

echo "=== [3/5] Starting MongoDB Docker Compose Service ==="
cd /opt/veyora-mongodb
docker compose up -d

echo "=== [4/5] Setting up automated backup cron ==="
cp /opt/veyora-mongodb/backup-mongodb.sh /usr/local/bin/backup-mongodb
chmod +x /usr/local/bin/backup-mongodb
echo "0 2 * * * root /usr/local/bin/backup-mongodb >> /var/log/mongodb-backup.log 2>&1" > /etc/cron.d/mongodb-backup

echo "=== [5/5] GCE MongoDB Startup Completed Successfully ==="
