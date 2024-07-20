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

# mkdir -p $APP_DIR
# rm -rf $APP_DIR/*
# git clone $REPO_URL $APP_DIR
# cd $APP_DIR
# # Pull the latest code from the specified branch
# echo "Pulling latest code from branch ${BRANCH_NAME}..."
# git fetch origin
# git checkout $BRANCH_NAME
# git pull origin $BRANCH_NAME

# # run the Docker Compose
# echo "Building and running Docker Compose services..."
# docker-compose -p $DOCKER_COMPOSE_PROJECT_NAME up -d --build

# echo "Deployment for PR #${PR_NUMBER} completed successfully."


# #!/bin/bash


# Variables
 REPO_URL=$1
 PR_NUMBER=$2
 SERVER_USER=$3
 SERVER_IP=$4
 SERVER_PASSWORD=$5
 BRANCH_NAME=$6
 LOG_FILE="/root/cleanup.log"
 CONTAINER_NAME="pr_${PR_NUMBER}"
 IMAGE_NAME="myapp_pr_${PR_NUMBER}"
 APP_DIR="/root/app_${PR_NUMBER}"

# Function to install Git if not already installed
install_git() {
  if ! command -v git &> /dev/null; then
    echo "Git is not installed. Installing Git..."
    sudo apt-get update
    sudo apt-get install -y git
    echo "Git installation completed."
  else
    echo "Git is already installed."
  fi
}


# Function to install Docker if not already installed
install_docker() {
  if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Installing Docker..."
    sudo apt-get update
    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    sudo usermod -aG docker $USER
    echo "Docker installation completed."
  else
    echo "Docker is already installed."
  fi
}


# Function to log status
log_status() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> deployment.log
}


# install netstat if not exists
install_netstat() {
  if ! command -v netstat &> /dev/null; then
    echo "Netstat is not installed. Installing Netstat..."
    sudo apt-get update
    sudo apt-get install -y net-tools
    echo "Netstat installation completed."
  else
    echo "Netstat is already installed."
  fi
}


# Function to find an available port
find_available_port() {
  local PORT=8000
  while netstat -tuln | grep -q ":$PORT "; do
    ((PORT++))
  done
  echo $PORT
}
find_available_port



# SSH into the remote server and run deployment commands using sshpass
# sshpass -p $SERVER_PASSWORD ssh -o StrictHostKeyChecking=no @$SERVER_IP << EOF
sshpass -p $SERVER_PASSWORD ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << EOF
  # Install Git and Docker if not already installed
  $(declare -f install_git)
  $(declare -f install_docker)
  $(declare -f log_status)
  $(declare -f install_netstat)
  $(declare -f find_available_port)
  install_git
  install_docker
  install_netstat

  # Variables for deployment
  log_status "Deployment started for image ${IMAGE_NAME} APP: ${APP_DIR}"
  log_status "Starting deployment for PR #${PR_NUMBER} from branch ${BRANCH_NAME}"


  # Clone the repository if it doesn't exist
  if [ ! -d "$APP_DIR" ]; then
    sudo mkdir -p $APP_DIR
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
    git fetch --all
    log_status "Repository cloned successfully"
  else
    cd $APP_DIR
    git fetch --all
    log_status "Repository fetched successfully"
  fi


  # Checkout the branch
  if ! git checkout $BRANCH_NAME; then
    log_status "Error: Failed to checkout branch ${BRANCH_NAME}"
    exit 1
  fi
  if ! git pull origin $BRANCH_NAME; then
    log_status "Error: Failed to pull latest changes from branch ${BRANCH_NAME}"
    exit 1
  fi
  log_status "Checked out and pulled branch: ${BRANCH_NAME}"


  # Build the Docker image
  if ! docker build -t $IMAGE_NAME .; then
    log_status "Error: Docker image build failed"
    exit 1
  fi
  log_status "Docker image built successfully"


  # Stop and remove existing container if it exists
  docker stop $CONTAINER_NAME 2>/dev/null
  docker rm $CONTAINER_NAME 2>/dev/null
  log_status "Removed existing container (if any)"


  # Find an available port
  PORT=$(find_available_port)
  log_status "Selected available port: \$PORT"
  # Start the new Docker container
  if ! docker run -d -p \$PORT:5000 --name $CONTAINER_NAME $IMAGE_NAME; then
    log_status "Error: Failed to start container"
    exit 1
  fi
  log_status "Container started successfully on port \$PORT"


  # Get the deployment URL
  DEPLOY_URL="http://$SERVER_IP:\$PORT"
  log_status "Deployment URL: \$DEPLOY_URL"
  # Output deployment details
  echo "Deployment completed successfully"
  echo "Preview URL: \$DEPLOY_URL"
  echo "Deployment time: \$(date)"
EOF


# Capture the output of the SSH command
DEPLOY_STATUS=$?
# Log the final status
if [ $DEPLOY_STATUS -eq 0 ]; then
  log_status "Deployment completed successfully for PR #${PR_NUMBER}"
else
  log_status "Error: Deployment failed for PR #${PR_NUMBER}"
fi
# Output deployment status
echo "Deployment status: $DEPLOY_STATUS"
