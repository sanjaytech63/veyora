# ==============================================================================
# Amazon Elastic Container Registry (ECR) Repositories
# Scanned on push, encrypted with KMS, automated lifecycle cleanup
# ==============================================================================

locals {
  services = ["api", "worker", "web", "admin"]
}

resource "aws_ecr_repository" "services" {
  for_each             = toset(locals.services)
  name                 = "veyora-${each.key}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name    = "veyora-${each.key}"
    Service = each.key
  }
}

# Automated lifecycle rule: Keep latest 30 tagged images and delete untagged after 14 days
resource "aws_ecr_lifecycle_policy" "services" {
  for_each   = aws_ecr_repository.services
  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire untagged images older than 14 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 14
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Retain max 30 production tagged images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["sha-", "v", "prod"]
          countType     = "imageCountMoreThan"
          countNumber   = 30
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
