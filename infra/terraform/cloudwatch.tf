# ==============================================================================
# Amazon CloudWatch Logs & Automated Metric Alarms
# Centralized structured logging, ECS container alarms, 5xx error monitoring
# ==============================================================================

resource "aws_cloudwatch_log_group" "services" {
  for_each          = toset(["api", "worker", "web", "admin"])
  name              = "/ecs/veyora-${each.key}"
  retention_in_days = 30

  tags = {
    Name    = "veyora-${each.key}-logs"
    Service = each.key
  }
}

# ------------------------------------------------------------------------------
# CloudWatch Metric Alarms: High CPU & Memory Utilization
# ------------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "api_high_cpu" {
  alarm_name          = "${local.name_prefix}-api-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Triggered when API container CPU exceeds 80% for 2 consecutive minutes"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.api.name
  }
}

resource "aws_cloudwatch_metric_alarm" "api_high_memory" {
  alarm_name          = "${local.name_prefix}-api-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "Triggered when API container memory exceeds 85% for 2 consecutive minutes"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.api.name
  }
}

# ------------------------------------------------------------------------------
# CloudWatch Metric Alarm: High 5xx HTTP Error Rate
# ------------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "${local.name_prefix}-alb-high-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Triggered when ALB target 5xx error count exceeds 10 per minute"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }
}
