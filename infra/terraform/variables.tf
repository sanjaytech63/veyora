# ==============================================================================
# Veyora Production Cloud Architecture - Variables
# ==============================================================================

variable "aws_region" {
  type        = string
  description = "Primary AWS region for deployment"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Target deployment environment (e.g. production, staging)"
  default     = "production"
}

variable "domain_name" {
  type        = string
  description = "Apex root domain name (e.g. veyora.com)"
  default     = "veyora.com"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the dedicated VPC"
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  type        = list(string)
  description = "Availability zones for multi-AZ resiliency"
  default     = ["us-east-1a", "us-east-1b"]
}

variable "api_cpu" {
  type        = number
  description = "CPU units for API container (512 = 0.5 vCPU)"
  default     = 512
}

variable "api_memory" {
  type        = number
  description = "Memory for API container in MiB (1024 = 1 GB)"
  default     = 1024
}

variable "worker_cpu" {
  type        = number
  description = "CPU units for Worker container"
  default     = 512
}

variable "worker_memory" {
  type        = number
  description = "Memory for Worker container in MiB"
  default     = 1024
}

variable "web_cpu" {
  type        = number
  description = "CPU units for Web Storefront container"
  default     = 512
}

variable "web_memory" {
  type        = number
  description = "Memory for Web Storefront container in MiB"
  default     = 1024
}

variable "admin_cpu" {
  type        = number
  description = "CPU units for Admin Console container"
  default     = 512
}

variable "admin_memory" {
  type        = number
  description = "Memory for Admin Console container in MiB"
  default     = 1024
}

variable "github_repo" {
  type        = string
  description = "GitHub repository for OIDC trust (owner/repo)"
  default     = "sanjaytech63/veyora"
}
