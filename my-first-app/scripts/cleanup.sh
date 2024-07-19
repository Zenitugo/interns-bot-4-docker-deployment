#!/bin/bash

set -e

# Variables
BRANCH_NAME=$1 
PR_NUMBER=$2  
REPO_NAME=$3
APP_DIR="${HOME}/my-first-app-${PR_NUMBER}"
CONTAINER_NAME="${REPO_NAME}-${PR_NUMBER}"
LOG_FILE="cleanup.log"

# Ensure required arguments are provided
if [ -z "$BRANCH_NAME" ] || [ -z "$PR_NUMBER" ] || [ -z "$REPO_NAME" ]; then
  echo "Usage: $0 <branch_name> <pr_number> <repo_name>"
  exit 1
fi

# Function to log status
log_status() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
}

log_status "Starting cleanup for PR #${PR_NUMBER}"

# Navigate to the application directory
if cd "$APP_DIR"; then
  log_status "Changed directory to $APP_DIR"
else
  log_status "Error: Failed to change directory to $APP_DIR"
  exit 1
fi

# Stop and remove the Docker container if it exists
if docker stop "$CONTAINER_NAME" 2>/dev/null; then
  log_status "Stopped Docker container $CONTAINER_NAME"
else
  log_status "Docker container $CONTAINER_NAME not running"
fi

if docker rm "$CONTAINER_NAME" 2>/dev/null; then
  log_status "Removed Docker container $CONTAINER_NAME"
else
  log_status "Docker container $CONTAINER_NAME not found"
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
