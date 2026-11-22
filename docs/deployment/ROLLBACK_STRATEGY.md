# Production Deployment & Rollback Strategy

## 1. Zero-Downtime Deployment Architecture

Veyora uses Amazon ECS Fargate rolling updates with AWS CloudWatch deployment circuit breakers:

```text
Target State: 2 Healthy Tasks (100% capacity)

[Step 1] Current: [Task A1 (v1), Task A2 (v1)]
[Step 2] Launch:  [Task A1 (v1), Task A2 (v1), Task B1 (v2), Task B2 (v2)]  <-- Max 200%
[Step 3] Healthcheck passes on B1 & B2 via ALB /health probes
[Step 4] ALB switches traffic to B1 & B2
[Step 5] Terminate: A1 (v1) and A2 (v1)
[Step 6] Final:   [Task B1 (v2), Task B2 (v2)] (100% capacity)
```

---

## 2. Automated Circuit Breaker Rollbacks

Both the Terraform configuration and GitHub Actions CD configure:

- `deployment_minimum_healthy_percent = 100`
- `deployment_maximum_percent = 200`
- `deployment_circuit_breaker { enable = true, rollback = true }`

### How Circuit Breakers Protect Production:

If new containers fail their container healthchecks or ALB `/health` probes during deployment:

1. ECS halts traffic shifting to the new containers.
2. ECS marks the deployment as `FAILED`.
3. The circuit breaker **automatically rolls back** to the previous healthy task definition revision without human intervention.
4. Existing healthy tasks remain uninterrupted throughout the entire failure event.

---

## 3. Manual Immediate Rollback Runbook

If a software bug is detected after a successful deployment, execute an immediate rollback using the AWS CLI:

### Rollback API Service:

```bash
# 1. Inspect previous task definition revisions
aws ecs list-task-definitions --family-prefix veyora-api --sort DESC

# 2. Revert service to previous stable revision (e.g. revision 12)
aws ecs update-service \
  --cluster veyora-production-cluster \
  --service veyora-api-service \
  --task-definition veyora-api:12 \
  --force-new-deployment
```

### Rollback Web Storefront:

```bash
aws ecs update-service \
  --cluster veyora-production-cluster \
  --service veyora-web-service \
  --task-definition veyora-web:12 \
  --force-new-deployment
```

### Rollback Worker Suite:

```bash
aws ecs update-service \
  --cluster veyora-production-cluster \
  --service veyora-worker-service \
  --task-definition veyora-worker:12 \
  --force-new-deployment
```

---

## 4. Database Backward-Compatibility Guidelines

To guarantee rollback safety:

1. **Never drop columns/fields in the same release that removes application code.**
2. **Follow the Expand and Contract pattern**:
   - Phase 1 (Expand): Add new optional fields/indexes to Mongoose schemas.
   - Phase 2: Deploy code writing to new fields while reading old or new.
   - Phase 3 (Contract): After deployment is stable, drop legacy fields in a subsequent release.
3. If an emergency rollback occurs, the previous code version continues to function safely because fields are backward-compatible.
