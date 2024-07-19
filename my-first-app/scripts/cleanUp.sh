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
cd $APP_DIR

docker-compose -p $DOCKER_COMPOSE_PROJECT_NAME down
rm -rf $APP_DIR/*
echo "cleanup for PR #${PR_NUMBER} completed successfully."
