locals {
  region = get_env("AWS_REGION")
  stage  = get_env("AWS_STAGE")
  stages = {
    test = {
      name = "Testing"
    },
    localstack = {
      name = "Localstack"
    },
    prod = {
      name = "Production"
    }
  }
  service_name   = get_env("PROJECT_NAME", "tvo-task-trigger")
  service_bucket = get_env("BUCKET_STATE_NAME", "${local.service_name}-${local.region}")
  parameter_path = get_env("PARAMETER_PATH", "/tvo/security-scan")
  tags_file_path = "${get_terragrunt_dir()}/common_tags.json"
  log_retention  = 7
  common_tags = fileexists(local.tags_file_path) ? jsondecode(file(local.tags_file_path)) : {
    Project     = "Titvo Security Scan"
    Customer    = "Titvo"
    Team        = "Area Creacion"
    Environment = "${local.stages[local.stage].name}"
  }
}
