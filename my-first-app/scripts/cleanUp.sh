#!/bin/bash

# set -e

# BRANCH_NAME=$1 
# PR_NUMBER=$2  
# REPO_NAME=$3
# REPO_URL=$4
# APP_DIR="${HOME}/my-first-app-${PR_NUMBER}"
# DOCKER_COMPOSE_PROJECT_NAME="${REPO_NAME}-${PR_NUMBER}"

# #ssh to be stored here
# # Navigate to the application directory
# cd $APP_DIR

# docker-compose -p $DOCKER_COMPOSE_PROJECT_NAME down
# rm -rf $APP_DIR/*
# echo "cleanup for PR #${PR_NUMBER} completed successfully."
Variable
BRANCH_NAME=$1
PR_NUMBER=$2
REPO_NAME=$3
SERVER_USER=$4
SERVER_IP=$5
SERVER_PASSWORD=$6
# APP_DIR="/home/$SERVER_USER/my-first-app-${PR_NUMBER}"
# APP_DIR="/home/$SERVER_USER/flask-example-${PR_NUMBER}"
# APP_DIR="$HOME/flask-example-${PR_NUMBER}"
APP_DIR="/root/app_${PR_NUMBER}"
# APP_DIR="$HOME/flask-example"
CONTAINER_NAME="pr_${PR_NUMBER}"
LOG_FILE="/root/cleanup.log"
IMAGE_NAME="myapp_pr_${PR_NUMBER}"
# Function to log status
log_status() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> cleanup.log
}
log_status "Starting cleanup for PR #${PR_NUMBER} on server $SERVER_IP"
# SSH into the remote server and perform cleanup
sshpass -p $SERVER_PASSWORD ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << EOF
  set -e
  # Function to log status on the remote server
  remote_log_status() {
    echo "\$(date '+%Y-%m-%d %H:%M:%S') - \$1" >> $LOG_FILE
  }
  remote_log_status "Starting cleanup for PR #${PR_NUMBER}"
  # Navigate to the application directory
  if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    remote_log_status "Changed directory to $APP_DIR"
  else
    remote_log_status "Error: Application directory $APP_DIR does not exist"
    exit 1
  fi
  # Stop and remove the Docker container if it exists
  if docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
    if docker stop "$CONTAINER_NAME"; then
      remote_log_status "Stopped Docker container $CONTAINER_NAME"
    else
      remote_log_status "Error: Failed to stop Docker container $CONTAINER_NAME"
      exit 1
    fi
  else
    remote_log_status "Docker container $CONTAINER_NAME is not running"
  fi
  if docker rm "$CONTAINER_NAME"; then
    remote_log_status "Removed Docker container $CONTAINER_NAME"
  else
    remote_log_status "Failed to remove Docker container $CONTAINER_NAME"
  fi
  # Remove the Docker image if it exists
  if docker rmi "$IMAGE_NAME"; then
    remote_log_status "Removed Docker image $IMAGE_NAME"
  else
    remote_log_status "No Docker image named $IMAGE_NAME found to remove"
  fi
  # Remove all contents of the application directory
  if rm -rf "$APP_DIR"/; then
    remote_log_status "Removed all contents of $APP_DIR"
  else
    remote_log_status "Error: Failed to remove contents of $APP_DIR"
    exit 1
  fi
  rm "/root/deployment.log"
  remote_log_status "Cleanup for PR #${PR_NUMBER} completed successfully"
  echo "Cleanup for PR #${PR_NUMBER} completed successfully."
EOF
log_status "Cleanup for PR #${PR_NUMBER} on server $SERVER_IP completed successfully"
echo "Cleanup for PR #${PR_NUMBER} on server $SERVER_IP completed successfully."
