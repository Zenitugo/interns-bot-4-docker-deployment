#!/bin/bash

set -e

APP_DIR="/path/to/your/app"
PR_NUMBER=$1
REPO_NAME=$2
DOCKER_COMPOSE_PROJECT_NAME="${REPO_NAME}-${PR_NUMBER}"

# Navigate to the application directory
cd $APP_DIR

# Checkout the deployment branch
git checkout "pr-$PR_NUMBER"

# Stop and remove the Docker Compose services
echo "Stopping and removing Docker Compose services..."
docker-compose -p $DOCKER_COMPOSE_PROJECT_NAME down

# Rollback the deployment
echo "Rolling back the deployment to the previous version..."
git checkout -
docker-compose -p $DOCKER_COMPOSE_PROJECT_NAME up -d --build

echo "Cleanup and rollback for PR #${PR_NUMBER} completed successfully."