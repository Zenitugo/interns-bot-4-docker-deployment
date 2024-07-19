#!/bin/bash

set -e

BRANCH_NAME=$1 
PR_NUMBER=$2  
REPO_NAME=$3
REPO_URL=$4
APP_DIR="${HOME}/my-first-app-${PR_NUMBER}"
DOCKER_COMPOSE_PROJECT_NAME="${REPO_NAME}-${PR_NUMBER}"

#ssh to be stored here
# Navigate to the application directory

mkdir -p $APP_DIR
rm -rf $APP_DIR/*
git clone $REPO_URL $APP_DIR
cd $APP_DIR
# Pull the latest code from the specified branch
echo "Pulling latest code from branch ${BRANCH_NAME}..."
git fetch origin
git checkout $BRANCH_NAME
git pull origin $BRANCH_NAME

# run the Docker Compose
echo "Building and running Docker Compose services..."
docker-compose -p $DOCKER_COMPOSE_PROJECT_NAME up -d --build

echo "Deployment for PR #${PR_NUMBER} completed successfully."
