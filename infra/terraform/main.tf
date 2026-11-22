# ==============================================================================
# Veyora Production Cloud Architecture - Terraform Provider & Core Config
# AWS ECS, ECR, ALB, CloudWatch, S3, CloudFront, Secrets Manager, Route 53
# ==============================================================================

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  backend "s3" {
    # Override via -backend-config or CI/CD environment
    bucket         = "veyora-terraform-state-prod"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "veyora-terraform-lock"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Veyora"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Repository  = "https://github.com/sanjaytech63/veyora"
    }
  }
}

locals {
  name_prefix = "veyora-${var.environment}"
}
