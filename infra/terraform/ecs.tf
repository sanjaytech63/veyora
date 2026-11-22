# ==============================================================================
# Amazon ECS Cluster & Fargate Services Architecture
# Circuit-breaker rollbacks, rolling updates, non-root execution
# ==============================================================================

resource "aws_ecs_cluster" "main" {
  name = "${local.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }
}

# ------------------------------------------------------------------------------
# 1. API Service (Fargate)
# ------------------------------------------------------------------------------
resource "aws_ecs_task_definition" "api" {
  family                   = "veyora-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.api_cpu
  memory                   = var.api_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_api_task.arn

  container_definitions = jsonencode([
    {
      name      = "veyora-api"
      image     = "${aws_ecr_repository.services["api"].repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = 4000
          hostPort      = 4000
          protocol      = "tcp"
        }
      ]
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "4000" },
        { name = "API_PREFIX", value = "/api/v1" },
        { name = "LOG_LEVEL", value = "info" }
      ]
      secrets = [
        { name = "MONGODB_URI", valueFrom = "${aws_secretsmanager_secret.api_secrets.arn}:MONGODB_URI::" },
        { name = "REDIS_HOST", valueFrom = "${aws_secretsmanager_secret.api_secrets.arn}:REDIS_HOST::" },
        { name = "REDIS_PORT", valueFrom = "${aws_secretsmanager_secret.api_secrets.arn}:REDIS_PORT::" },
        { name = "REDIS_PASSWORD", valueFrom = "${aws_secretsmanager_secret.api_secrets.arn}:REDIS_PASSWORD::" },
        { name = "JWT_ACCESS_SECRET", valueFrom = "${aws_secretsmanager_secret.api_secrets.arn}:JWT_ACCESS_SECRET::" },
        { name = "JWT_REFRESH_SECRET", valueFrom = "${aws_secretsmanager_secret.api_secrets.arn}:JWT_REFRESH_SECRET::" },
        { name = "COOKIE_SECRET", valueFrom = "${aws_secretsmanager_secret.api_secrets.arn}:COOKIE_SECRET::" },
        { name = "RAZORPAY_KEY_ID", valueFrom = "${aws_secretsmanager_secret.api_secrets.arn}:RAZORPAY_KEY_ID::" },
        { name = "RAZORPAY_KEY_SECRET", valueFrom = "${aws_secretsmanager_secret.api_secrets.arn}:RAZORPAY_KEY_SECRET::" },
        { name = "RAZORPAY_WEBHOOK_SECRET", valueFrom = "${aws_secretsmanager_secret.api_secrets.arn}:RAZORPAY_WEBHOOK_SECRET::" }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.services["api"].name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "api"
        }
      }
      healthCheck = {
        command     = ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://127.0.0.1:4000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 15
      }
    }
  ])
}

resource "aws_ecs_service" "api" {
  name            = "veyora-api-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "veyora-api"
    container_port   = 4000
  }

  depends_on = [aws_lb_listener.https]
}

# ------------------------------------------------------------------------------
# 2. Worker Service (Fargate - No Load Balancer)
# ------------------------------------------------------------------------------
resource "aws_ecs_task_definition" "worker" {
  family                   = "veyora-worker"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.worker_cpu
  memory                   = var.worker_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_worker_task.arn

  container_definitions = jsonencode([
    {
      name      = "veyora-worker"
      image     = "${aws_ecr_repository.services["worker"].repository_url}:latest"
      essential = true
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "WORKER_CONCURRENCY", value = "5" },
        { name = "LOG_LEVEL", value = "info" }
      ]
      secrets = [
        { name = "MONGODB_URI", valueFrom = "${aws_secretsmanager_secret.api_secrets.arn}:MONGODB_URI::" },
        { name = "REDIS_HOST", valueFrom = "${aws_secretsmanager_secret.api_secrets.arn}:REDIS_HOST::" },
        { name = "REDIS_PORT", valueFrom = "${aws_secretsmanager_secret.api_secrets.arn}:REDIS_PORT::" },
        { name = "REDIS_PASSWORD", valueFrom = "${aws_secretsmanager_secret.api_secrets.arn}:REDIS_PASSWORD::" }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.services["worker"].name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "worker"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "worker" {
  name            = "veyora-worker-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.worker.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }
}

# ------------------------------------------------------------------------------
# 3. Storefront Web Service (Fargate)
# ------------------------------------------------------------------------------
resource "aws_ecs_task_definition" "web" {
  family                   = "veyora-web"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.web_cpu
  memory                   = var.web_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_web_task.arn

  container_definitions = jsonencode([
    {
      name      = "veyora-web"
      image     = "${aws_ecr_repository.services["web"].repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
          protocol      = "tcp"
        }
      ]
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3000" },
        { name = "NEXT_PUBLIC_API_URL", value = "https://api.${var.domain_name}/api/v1" },
        { name = "NEXT_PUBLIC_WEB_URL", value = "https://${var.domain_name}" }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.services["web"].name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "web"
        }
      }
      healthCheck = {
        command     = ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://127.0.0.1:3000 || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 20
      }
    }
  ])
}

resource "aws_ecs_service" "web" {
  name            = "veyora-web-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.web.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.web.arn
    container_name   = "veyora-web"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.https]
}

# ------------------------------------------------------------------------------
# 4. Admin Console Service (Fargate)
# ------------------------------------------------------------------------------
resource "aws_ecs_task_definition" "admin" {
  family                   = "veyora-admin"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.admin_cpu
  memory                   = var.admin_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_admin_task.arn

  container_definitions = jsonencode([
    {
      name      = "veyora-admin"
      image     = "${aws_ecr_repository.services["admin"].repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = 3001
          hostPort      = 3001
          protocol      = "tcp"
        }
      ]
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3001" },
        { name = "NEXT_PUBLIC_API_URL", value = "https://api.${var.domain_name}/api/v1" },
        { name = "NEXT_PUBLIC_ADMIN_URL", value = "https://admin.${var.domain_name}" }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.services["admin"].name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "admin"
        }
      }
      healthCheck = {
        command     = ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://127.0.0.1:3001 || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 20
      }
    }
  ])
}

resource "aws_ecs_service" "admin" {
  name            = "veyora-admin-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.admin.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.admin.arn
    container_name   = "veyora-admin"
    container_port   = 3001
  }

  depends_on = [aws_lb_listener.https]
}
