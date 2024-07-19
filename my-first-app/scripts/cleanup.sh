#!/bin/bash

set -e

# Ensure required arguments are provided
if [ "$#" -ne 3 ]; then
  echo "Usage: $0 <branch_name> <pr_number> <repo_name>"
  exit 1
fi

# Variables
BRANCH_NAME=$1
PR_NUMBER=$2
REPO_NAME=$3
APP_DIR="${HOME}/my-first-app-${PR_NUMBER}"
CONTAINER_NAME="${REPO_NAME}-${PR_NUMBER}"
LOG_FILE="cleanup.log"

# Function to log status
log_status() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
}

log_status "Starting cleanup for PR #${PR_NUMBER}"

# Navigate to the application directory
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR"
  log_status "Changed directory to $APP_DIR"
else
  log_status "Error: Application directory $APP_DIR does not exist"
  exit 1
fi

# Stop and remove the Docker container if it exists
if docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
  if docker stop "$CONTAINER_NAME"; then
    log_status "Stopped Docker container $CONTAINER_NAME"
  else
    log_status "Error: Failed to stop Docker container $CONTAINER_NAME"
    exit 1
  fi
else
  log_status "Docker container $CONTAINER_NAME is not running"
fi

if docker ps -a -q -f name="$CONTAINER_NAME" | grep -q .; then
  if docker rm "$CONTAINER_NAME"; then
    log_status "Removed Docker container $CONTAINER_NAME"
  else
    log_status "Error: Failed to remove Docker container $CONTAINER_NAME"
    exit 1
  fi
else
  log_status "Docker container $CONTAINER_NAME does not exist"
fi

# Remove all contents of the application directory
if rm -rf "$APP_DIR"/*; then
  log_status "Removed all contents of $APP_DIR"
else
  log_status "Error: Failed to remove contents of $APP_DIR"
  exit 1
fi

log_status "Cleanup for PR #${PR_NUMBER} completed successfully"
echo "Cleanup for PR #${PR_NUMBER} completed successfully."
