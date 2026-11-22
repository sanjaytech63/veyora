# Veyora Production Cloud Architecture

## 1. High-Level Architectural Overview

Veyora is architected as a high-availability, multi-tier, multi-AZ cloud platform hosted on Amazon Web Services (AWS). It separates public client traffic from internal asynchronous processing and protected data stores.

```mermaid
flowchart TD
    Users([Internet Users & Mobile Browsers]) --> Route53[Amazon Route 53 DNS]
    Route53 -->|veyora.com / admin.veyora.com / api.veyora.com| ALB[Application Load Balancer (ALB) - Multi-AZ]
    Route53 -->|media.veyora.com| CloudFront[Amazon CloudFront CDN]

    subgraph AWS_Cloud ["AWS Cloud (us-east-1)"]
        subgraph VPC ["Dedicated VPC (10.0.0.0/16)"]
            subgraph Public_Subnets ["Public Subnets (Multi-AZ: us-east-1a, us-east-1b)"]
                ALB
                NAT_A[NAT Gateway A]
                NAT_B[NAT Gateway B]
            end

            subgraph Private_Subnets ["Private Subnets (Multi-AZ)"]
                subgraph ECS_Cluster ["Amazon ECS Cluster (AWS Fargate)"]
                    API_Task1[veyora-api:4000]
                    API_Task2[veyora-api:4000]
                    Worker_Task1[veyora-worker]
                    Worker_Task2[veyora-worker]
                    Web_Task1[veyora-web:3000]
                    Web_Task2[veyora-web:3000]
                    Admin_Task1[veyora-admin:3001]
                    Admin_Task2[veyora-admin:3001]
                end
            end
        end

        subgraph Managed_Services ["AWS Managed Services"]
            ECR[(Amazon ECR Repositories)]
            SecretsManager[(AWS Secrets Manager)]
            CloudWatch[(Amazon CloudWatch Logs & Alarms)]
            S3_Media[(Amazon S3 Media Bucket - Encrypted)]
        end
    end

    %% Ingress Traffic
    ALB -->|api.veyora.com| API_Task1 & API_Task2
    ALB -->|veyora.com| Web_Task1 & Web_Task2
    ALB -->|admin.veyora.com| Admin_Task1 & Admin_Task2

    %% Egress & Storage Connections
    CloudFront -->|Origin Access Control (OAC)| S3_Media
    API_Task1 & API_Task2 -->|Image Uploads (IAM Role)| S3_Media
    API_Task1 & API_Task2 -->|Read Secrets (Least Privilege)| SecretsManager
    Worker_Task1 & Worker_Task2 -->|Read Secrets| SecretsManager
    API_Task1 & Worker_Task1 -->|Structured Pino Logs| CloudWatch
    ECS_Cluster -.->|Pull Images| ECR
```

---

## 2. Component Specifications

### 2.1 Amazon Route 53 & ACM (DNS & HTTPS)

- **Hosted Zone**: `veyora.com`
- **DNS Records**:
  - `veyora.com` (A Alias -> ALB target)
  - `api.veyora.com` (A Alias -> ALB target)
  - `admin.veyora.com` (A Alias -> ALB target)
- **AWS Certificate Manager (ACM)**:
  - Wildcard certificate `*.veyora.com` + apex `veyora.com`.
  - DNS validated automatically via Route 53 records.
  - TLS 1.3 enforced via ALB SSL policy `ELBSecurityPolicy-TLS13-1-2-2021-06`.

### 2.2 Application Load Balancer (ALB)

- **Deployment**: Internet-facing, deployed across 2 public subnets (`us-east-1a`, `us-east-1b`).
- **Listeners**:
  - Port 80 (HTTP): Permanently redirects all requests to port 443 (HTTPS 301).
  - Port 443 (HTTPS): Terminates TLS with ACM wildcard certificate.
- **Routing Rules**:
  - `Host: api.veyora.com` -> Targets `veyora-api-tg` (Port 4000, Healthcheck: `GET /health` every 30s).
  - `Host: admin.veyora.com` -> Targets `veyora-admin-tg` (Port 3001, Healthcheck: `GET /` every 30s).
  - Default Action -> Targets `veyora-web-tg` (Port 3000, Healthcheck: `GET /` every 30s).

### 2.3 Amazon ECS on AWS Fargate

- **Cluster**: `veyora-production-cluster` with Container Insights enabled.
- **Launch Type**: AWS Fargate (serverless container compute, zero EC2 instance management).
- **Services**:
  1. `veyora-api-service` (2 tasks, 512 CPU, 1024 MiB RAM)
  2. `veyora-worker-service` (2 tasks, 512 CPU, 1024 MiB RAM, background BullMQ processing)
  3. `veyora-web-service` (2 tasks, 512 CPU, 1024 MiB RAM, Next.js Storefront)
  4. `veyora-admin-service` (2 tasks, 512 CPU, 1024 MiB RAM, Next.js Admin Console)
- **Deployment Strategy**:
  - Rolling updates: `minimumHealthyPercent = 100`, `maximumPercent = 200`.
  - Circuit Breakers: Enabled with automated rollback on healthcheck failure.

### 2.4 Amazon ECR (Container Registries)

- 4 dedicated repositories: `veyora-api`, `veyora-worker`, `veyora-web`, `veyora-admin`.
- Vulnerability scanning on image push enabled (`scan_on_push = true`).
- Server-side encryption with KMS (`AES256`).
- Automated lifecycle policies: expire untagged images > 14 days; retain last 30 tagged production images.

### 2.5 Amazon S3 & CloudFront CDN

- **S3 Bucket**: `veyora-production-media-assets` with versioning, SSE-AES256 encryption, and 100% public access block.
- **CloudFront CDN**: Distribution with Origin Access Control (OAC). Users access images only via CloudFront edge caches (`media.veyora.com`). S3 bucket rejects direct public internet traffic.

### 2.6 AWS Secrets Manager

- Centralized secret store: `veyora/production/api-secrets`.
- Injected directly into ECS container environments at task launch through IAM execution role (`valueFrom: arn:aws:secretsmanager:...`).
- Zero secrets committed to Git repositories.

### 2.7 Amazon CloudWatch

- Dedicated log groups for all services: `/ecs/veyora-api`, `/ecs/veyora-worker`, `/ecs/veyora-web`, `/ecs/veyora-admin`.
- 30-day log retention.
- Automated alarms for CPU utilization (> 80%), memory utilization (> 85%), and ALB 5xx error spikes (> 10/min).
