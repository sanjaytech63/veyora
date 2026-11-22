# ==============================================================================
# AWS Secrets Manager & Parameter Security
# Sensitive credentials managed centrally without committing secrets to Git
# ==============================================================================

resource "aws_secretsmanager_secret" "api_secrets" {
  name                    = "veyora/${var.environment}/api-secrets"
  description             = "Production environment credentials and secrets for Veyora API & Worker"
  recovery_window_in_days = var.environment == "production" ? 30 : 0

  tags = {
    Name = "${local.name_prefix}-api-secrets"
  }
}

# Template for Secret Schema (values populated via AWS Console / Secrets Manager CLI)
resource "aws_secretsmanager_secret_version" "api_secrets_template" {
  secret_id = aws_secretsmanager_secret.api_secrets.id

  secret_string = jsonencode({
    MONGODB_URI             = "mongodb+srv://admin:REPLACE_WITH_ACTUAL_PASSWORD@cluster.mongodb.net/veyora_production"
    REDIS_HOST              = "clustercfg.veyora-redis.cache.amazonaws.com"
    REDIS_PORT              = "6379"
    REDIS_PASSWORD          = "REPLACE_WITH_ACTUAL_REDIS_AUTH_TOKEN"
    JWT_ACCESS_SECRET       = "REPLACE_WITH_MINIMUM_32_CHAR_CRYPTO_SECURE_ACCESS_SECRET"
    JWT_REFRESH_SECRET      = "REPLACE_WITH_MINIMUM_32_CHAR_CRYPTO_SECURE_REFRESH_SECRET"
    COOKIE_SECRET           = "REPLACE_WITH_MINIMUM_32_CHAR_CRYPTO_SECURE_COOKIE_SECRET"
    RAZORPAY_KEY_ID         = "REPLACE_WITH_PRODUCTION_RAZORPAY_KEY_ID"
    RAZORPAY_KEY_SECRET     = "REPLACE_WITH_PRODUCTION_RAZORPAY_KEY_SECRET"
    RAZORPAY_WEBHOOK_SECRET = "REPLACE_WITH_PRODUCTION_RAZORPAY_WEBHOOK_SECRET"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}
