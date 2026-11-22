# Production Secrets & Environment Configuration

## 1. Secrets Management Philosophy

- **Zero Secrets in Version Control**: No passwords, tokens, API keys, or private certificates are ever committed to Git.
- **Centralized Parameter Store**: In production, secrets are stored in **AWS Secrets Manager** under `veyora/production/api-secrets`.
- **Runtime Injection**: Amazon ECS pulls secrets from Secrets Manager directly at container initialization via IAM execution role permissions and injects them as environment variables into the process.
- **Fail-Fast Validation**: Application bootstrap validates environment variables against strict Zod schemas (`@veyora/validators`). In `production` mode, the API halts immediately if weak default secrets or wildcard CORS origins are supplied.

---

## 2. Production Secret Schema (`veyora/production/api-secrets`)

Configure the following JSON keys in AWS Secrets Manager:

```json
{
  "MONGODB_URI": "mongodb+srv://<username>:<password>@<cluster>.mongodb.net/veyora_production?retryWrites=true&w=majority",
  "REDIS_HOST": "<primary-endpoint>.veyora-redis.cache.amazonaws.com",
  "REDIS_PORT": "6379",
  "REDIS_PASSWORD": "<strong-random-auth-token>",
  "JWT_ACCESS_SECRET": "<minimum-32-char-random-cryptographic-secret>",
  "JWT_REFRESH_SECRET": "<minimum-32-char-random-cryptographic-secret>",
  "COOKIE_SECRET": "<minimum-32-char-random-cryptographic-secret>",
  "RAZORPAY_KEY_ID": "rzp_live_<key_id>",
  "RAZORPAY_KEY_SECRET": "<razorpay_live_secret>",
  "RAZORPAY_WEBHOOK_SECRET": "<razorpay_live_webhook_secret>"
}
```

---

## 3. Secret Creation via AWS CLI

To initialize or update the production secrets securely:

```bash
# Create secret in AWS Secrets Manager
aws secretsmanager create-secret \
  --name "veyora/production/api-secrets" \
  --description "Production credentials for Veyora API & Worker" \
  --secret-string file://secrets.json \
  --region us-east-1

# Securely wipe temporary local file
rm -f secrets.json
```

---

## 4. Secret Rotation Protocol

1. **JWT Secrets**:
   - Generate new random 64-character hex strings: `openssl rand -hex 32`
   - Update `JWT_REFRESH_SECRET` and `JWT_ACCESS_SECRET` in AWS Secrets Manager.
   - Force new ECS service deployment (`aws ecs update-service --cluster veyora-production-cluster --service veyora-api-service --force-new-deployment`).
   - Active user refresh tokens will expire gracefully, prompting re-authentication.

2. **Database Credentials**:
   - Create new database user in MongoDB Atlas / DocumentDB.
   - Update `MONGODB_URI` in Secrets Manager.
   - Trigger rolling deployment of API and Worker services.
   - Once all old tasks terminate, drop the old database user.
