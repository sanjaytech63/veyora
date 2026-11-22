# Veyora Production Deployment Guide

This guide walks through deploying Veyora from initial infrastructure setup to live production.

---

## 1. Prerequisites

Before deploying to AWS, ensure you have:

1. An AWS Account with Administrator or DevOps privileges.
2. AWS CLI v2 installed and configured (`aws configure`).
3. Terraform v1.6+ or OpenTofu installed.
4. A registered domain name in Route 53 (e.g. `veyora.com`).
5. GitHub Repository access (`sanjaytech63/veyora`).

---

## 2. Step 1: Provision Infrastructure with Terraform

```bash
cd infra/terraform

# 1. Initialize Terraform plugins and S3 backend
terraform init

# 2. Plan the deployment and verify resources to create
terraform plan -var="domain_name=veyora.com" -out=tfplan

# 3. Apply the infrastructure (ONLY with explicit user approval)
# terraform apply tfplan
```

### Generated Resources:

- Dedicated VPC, Subnets, NAT Gateways, Internet Gateway
- ECR Repositories (`veyora-api`, `veyora-worker`, `veyora-web`, `veyora-admin`)
- ECS Cluster & Fargate Services with Circuit Breakers
- Application Load Balancer with HTTP/HTTPS listeners & target groups
- Route 53 DNS records & ACM wildcard certificates
- S3 Media Bucket with CloudFront CDN & Origin Access Control
- IAM Execution and Task Roles + GitHub OIDC Provider

---

## 3. Step 2: Configure Production Secrets

Populate the created secret in AWS Secrets Manager:

```bash
aws secretsmanager put-secret-value \
  --secret-id "veyora/production/api-secrets" \
  --secret-string file://my-production-secrets.json \
  --region us-east-1
```

---

## 4. Step 3: Configure GitHub Repository for CI/CD

In your GitHub repository settings (`sanjaytech63/veyora` -> Settings -> Secrets and variables -> Actions):

1. **Repository Secret**:
   - `AWS_DEPLOYMENT_ROLE_ARN`: Set to the `github_oidc_role_arn` output from Terraform (e.g. `arn:aws:iam::123456789012:role/veyora-production-github-deployer-role`).

2. **Repository Variables**:
   - `AWS_REGION`: `us-east-1`
   - `CLOUDFRONT_DISTRIBUTION_ID`: Set to the CloudFront distribution ID from Terraform.

---

## 5. Step 4: Initial Container Build & Release

Trigger the initial deployment either via Git or GitHub Actions UI:

```bash
# Push to main branch to trigger automated CD
git checkout main
git merge develop
git push origin main
```

Or trigger manually via GitHub Actions:

- Navigate to **Actions** -> **Veyora Continuous Delivery (AWS ECS & ECR)**
- Click **Run workflow** -> Target: `production` -> Click **Run workflow**.

---

## 6. Step 5: Post-Deployment Verification Checklist

1. [ ] **ALB Healthcheck**: Verify target groups in AWS Console show 2/2 healthy tasks for API, Web, and Admin.
2. [ ] **API Health Endpoint**: Test `curl -I https://api.veyora.com/health` (returns `200 OK`).
3. [ ] **Storefront Live**: Open `https://veyora.com` in browser, verify SSL padlock and products load.
4. [ ] **Admin Console**: Open `https://admin.veyora.com`, verify admin login works.
5. [ ] **CloudWatch Logs**: Inspect `/ecs/veyora-api` log streams to confirm clean JSON structured logs without errors.
6. [ ] **Worker Suite**: Verify BullMQ workers connect to Redis and process background events cleanly.
