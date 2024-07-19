
#!/bin/bash

set -e



APP_DIR="/path/to/your/app"  
BRANCH_NAME=$1 
PR_NUMBER=$2  
REPO_NAME=$3
REPO_URL=$4
DOCKER_COMPOSE_PROJECT_NAME="${REPO_NAME}-${PR_NUMBER}"  
#ssh to be stored here
docker exec -it task-4 /bin/bash
# Navigate to the application directory

# Check if the repository directory exists
if [! -d "$APP_DIR" ]; then
  echo "Repository directory $REPO_DIR not found. Cloning repository..."
  git clone $REPO_URL $REPO_DIR
fi
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
