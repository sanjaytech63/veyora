# ==============================================================================
# Veyora Production Cloud Architecture - Outputs
# ==============================================================================

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "ecs_cluster_name" {
  description = "ECS Production Cluster Name"
  value       = aws_ecs_cluster.main.name
}

output "ecr_repository_urls" {
  description = "Map of ECR repository URLs for each microservice"
  value = {
    for k, v in aws_ecr_repository.services : k => v.repository_url
  }
}

output "cloudfront_distribution_domain" {
  description = "CloudFront Media CDN distribution domain name"
  value       = aws_cloudfront_distribution.media.domain_name
}

output "s3_media_bucket_name" {
  description = "S3 Media & Product Assets bucket name"
  value       = aws_s3_bucket.media.id
}

output "secrets_manager_arn" {
  description = "AWS Secrets Manager Secret ARN for API Credentials"
  value       = aws_secretsmanager_secret.api_secrets.arn
}

output "github_oidc_role_arn" {
  description = "IAM Role ARN to configure in GitHub Actions Secrets (AWS_DEPLOYMENT_ROLE_ARN)"
  value       = aws_iam_role.github_deployer.arn
}
