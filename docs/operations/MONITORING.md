# Production Monitoring & Observability Guide

## 1. Observability Architecture

Veyora’s observability stack operates across three telemetry pillars:

1. **Metrics**: Real-time numerical timeseries data via Prometheus exposition format (`/metrics`) and AWS CloudWatch Container Insights.
2. **Logs**: Centralized, structured JSON logs emitted via Pino with automatic sensitive data redaction.
3. **Health Probes**: Liveness (`/health/live`) and readiness (`/health/ready`) probes polled by the Application Load Balancer and orchestrators.

---

## 2. Key Telemetry Endpoints

| Endpoint                  | Protocol | Purpose                                              | Output Format                                            |
| ------------------------- | -------- | ---------------------------------------------------- | -------------------------------------------------------- |
| `GET /health`             | HTTP     | Container liveness & basic memory telemetry          | JSON (`{ status: "ok", memory, uptime }`)                |
| `GET /health/ready`       | HTTP     | Deep readiness: MongoDB & Redis ping latency         | JSON (`{ status: "ready", checks: { mongodb, redis } }`) |
| `GET /metrics`            | HTTP     | Prometheus scrapers, Datadog agent, CloudWatch agent | Text (`text/plain; version=0.0.4`)                       |
| `GET /api/v1/system/info` | HTTP     | Build metadata, version, runtime platform            | JSON (`{ service, version, nodeVersion }`)               |

---

## 3. Prometheus Metrics Catalog

The API exposes standard Prometheus metrics at `GET /metrics`:

```text
# HELP process_uptime_seconds The uptime of the Node.js process in seconds.
# TYPE process_uptime_seconds gauge
process_uptime_seconds 482.10

# HELP process_heap_bytes Process heap memory usage in bytes.
# TYPE process_heap_bytes gauge
process_heap_bytes{type="used"} 45218816
process_heap_bytes{type="total"} 67108864
process_heap_bytes{type="rss"} 94371840

# HELP process_cpu_seconds_total Total user and system CPU time spent in seconds.
# TYPE process_cpu_seconds_total counter
process_cpu_seconds_total{type="user"} 1.4820
process_cpu_seconds_total{type="system"} 0.3120

# HELP veyora_database_connected Database connection status (1 for connected, 0 for disconnected).
# TYPE veyora_database_connected gauge
veyora_database_connected{database="mongodb"} 1
veyora_database_connected{database="redis"} 1

# HELP veyora_build_info Information about the Veyora build and runtime environment.
# TYPE veyora_build_info gauge
veyora_build_info{version="0.1.0",node_version="v24.13.0",environment="production"} 1
```

---

## 4. CloudWatch Metric Alarms & Thresholds

| Alarm Name               | Metric                                         | Threshold      | Evaluation Window  | Action                              |
| ------------------------ | ---------------------------------------------- | -------------- | ------------------ | ----------------------------------- |
| `veyora-api-high-cpu`    | `AWS/ECS CPUUtilization`                       | **> 80%**      | 2 consecutive mins | Scale task count; notify on-call    |
| `veyora-api-high-memory` | `AWS/ECS MemoryUtilization`                    | **> 85%**      | 2 consecutive mins | Auto-scale; trigger memory alert    |
| `veyora-alb-high-5xx`    | `AWS/ApplicationELB HTTPCode_Target_5XX_Count` | **> 10 / min** | 1 min              | Page Incident Commander (SEV-1/2)   |
| `veyora-db-disconnected` | `veyora_database_connected`                    | **== 0**       | 1 evaluation       | Critical page: Database unreachable |

---

## 5. Structured Logging & Sensitive Data Redaction

All backend components write structured JSON lines using Pino via `@veyora/utils`.

### Log Redaction Standards:

The logger automatically replaces sensitive customer and payment fields with `[REDACTED]`:

- `password`, `passwordHash`, `confirmPassword`
- `token`, `accessToken`, `refreshToken`, `authorization`
- `cardNumber`, `cvv`, `cvc`, `expiry`
- `secret`, `webhookSecret`, `cookieSecret`

### Sample Production Log Output:

```json
{
  "level": "info",
  "time": "2026-11-22T14:10:22.184Z",
  "service": "@veyora/api",
  "env": "production",
  "requestId": "6b02f5c0-12ab-4292-b44c-a717586f3975",
  "userId": "usr_68dfa12b98",
  "method": "POST",
  "path": "/api/v1/checkout/orders",
  "statusCode": 201,
  "durationMs": 42,
  "msg": "Order placed successfully"
}
```
