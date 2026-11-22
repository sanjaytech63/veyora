# Production Backup & Recovery Guide

## 1. Disaster Recovery Objectives

| Metric                             | Target           | Description                                                    |
| ---------------------------------- | ---------------- | -------------------------------------------------------------- |
| **Recovery Point Objective (RPO)** | **< 15 minutes** | Maximum allowable data loss in catastrophic disaster.          |
| **Recovery Time Objective (RTO)**  | **< 30 minutes** | Maximum allowable downtime before services are fully restored. |

---

## 2. Backup Strategy by Data Store

### 2.1 MongoDB (Primary Database)

- **Continuous Backups**: Managed via MongoDB Atlas Continuous Cloud Backups or AWS DocumentDB automated daily snapshots.
- **Point-in-Time Recovery (PITR)**: Retention window of **35 days** with second-by-second oplog capture.
- **Automated Daily Snapshots**: Taken at 02:00 UTC daily, retained for 30 days.
- **Monthly Snapshots**: Retained for 12 months for compliance and auditing.

#### Manual On-Demand Backup via `mongodump`:

```bash
# Secure compressed database archive
mongodump \
  --uri="mongodb+srv://admin:$MONGODB_PASSWORD@cluster.mongodb.net/veyora_production" \
  --archive="veyora_backup_$(date +%Y%m%d_%H%M%S).gz" \
  --gzip

# Upload encrypted backup archive to private S3 disaster recovery bucket
aws s3 cp "veyora_backup_$(date +%Y%m%d_%H%M%S).gz" s3://veyora-production-dr-backups/mongodb/ --sse AES256
```

### 2.2 Redis (Cache & BullMQ State)

- **Persistence Configuration**:
  - RDB (Redis Database Snapshots): Snapshot saved every 15 minutes if at least 1 key changed.
  - AOF (Append Only File): `appendonly yes` with `appendfsync everysec` for 1-second write durability.
- **Multi-AZ Replication**: AWS ElastiCache for Redis configured with Multi-AZ automated failover and read replicas.

### 2.3 S3 Media Assets (Product Images & Documents)

- **Bucket Versioning**: Enabled (`aws_s3_bucket_versioning.media`). Prevents accidental overwrites or deletions.
- **Cross-Region Replication (CRR)**: Replicated to secondary AWS region (`us-west-2`) for geographic disaster protection.
- **Lifecycle Policies**: Transition non-current object versions to S3 Glacier Flexible Retrieval after 90 days.

---

## 3. Restoration Runbooks

### 3.1 MongoDB Database Restoration

```bash
# 1. Download target archive from disaster recovery S3 bucket
aws s3 cp s3://veyora-production-dr-backups/mongodb/veyora_backup_TARGET.gz ./

# 2. Restore to isolated staging cluster first to verify integrity
mongorestore \
  --uri="mongodb+srv://admin:$RESTORE_DB_PASSWORD@staging-cluster.mongodb.net" \
  --archive="veyora_backup_TARGET.gz" \
  --gzip \
  --nsInclude="veyora_production.*"

# 3. Verify record counts (Orders, Users, Products, Payments)
mongosh "mongodb+srv://admin:$RESTORE_DB_PASSWORD@staging-cluster.mongodb.net/veyora_production" \
  --eval "db.orders.countDocuments(); db.users.countDocuments(); db.products.countDocuments()"

# 4. Once verified, promote or restore into production cluster
```

### 3.2 Redis Cache & Queue Recovery

If Redis cache is lost or corrupted:

1. Since Veyora treats Redis as an ephemeral cache and BullMQ job buffer, the primary source of truth is MongoDB.
2. Order and payment states in MongoDB remain intact.
3. To recover worker queues:
   ```bash
   # Flush corrupted cache if needed
   redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD FLUSHDB
   # Restart API and Worker services to re-initialize queue definitions
   aws ecs update-service --cluster veyora-production-cluster --service veyora-worker-service --force-new-deployment
   ```

---

## 4. Disaster Recovery Drill Schedule

To guarantee preparedness:

- **Bi-annual Recovery Drill**: Restore production snapshot to an isolated sandbox environment twice a year.
- **Validation Checklist**:
  1. Confirm data integrity on all collections.
  2. Confirm indexing matches production.
  3. Validate API login and checkout execution against restored database.
