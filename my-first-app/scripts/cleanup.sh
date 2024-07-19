#!/bin/bash

# Exit on any error
set -e

# Variables
APP_DIR=$1
PR_NUMBER=$2
REPO_NAME=$3
DOCKER_COMPOSE_PROJECT_NAME="${REPO_NAME}-${PR_NUMBER}"
LOG_FILE="cleanup.log"

# Function to log status
log_status() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
}

# Ensure required arguments are provided
if [ -z "$APP_DIR" ] || [ -z "$PR_NUMBER" ] || [ -z "$REPO_NAME" ]; then
  echo "Usage: $0 <app_dir> <pr_number> <repo_name>"
  exit 1
fi

log_status "Starting cleanup for PR #${PR_NUMBER}"

# Navigate to the application directory
if cd "$APP_DIR"; then
  log_status "Changed directory to $APP_DIR"
else
  log_status "Error: Failed to change directory to $APP_DIR"
  exit 1
fi

# Checkout the deployment branch
if git checkout "pr-$PR_NUMBER"; then
  log_status "Checked out branch pr-$PR_NUMBER"
else
  log_status "Error: Failed to checkout branch pr-$PR_NUMBER"
  exit 1
fi

# Stop and remove the Docker Compose services
if docker-compose -p "$DOCKER_COMPOSE_PROJECT_NAME" down; then
  log_status "Stopped and removed Docker Compose services for project $DOCKER_COMPOSE_PROJECT_NAME"
else
  log_status "Error: Failed to stop and remove Docker Compose services for project $DOCKER_COMPOSE_PROJECT_NAME"
  exit 1
fi

log_status "Cleanup for PR #${PR_NUMBER} completed successfully"
echo "Cleanup for PR #${PR_NUMBER} completed successfully."
