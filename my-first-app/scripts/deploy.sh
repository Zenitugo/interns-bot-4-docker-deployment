#!/bin/bash

# Variables
 REPO_URL=$1
 PR_NUMBER=$2
 SERVER_USER=$3
 SERVER_IP=$4
 SERVER_PASSWORD=$5
 BRANCH_NAME=$6
 LOG_FILE="/app/logs/deployment.log"
 CONTAINER_NAME="${BRANCH_NAME}_pr_${PR_NUMBER}_con"
 IMAGE_NAME="${BRANCH_NAME}_pr_${PR_NUMBER}_img"
 APP_DIR="/root/app_${BRANCH_NAME}_${PR_NUMBER}"
 PORT=$((8000 + PR_NUMBER))

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
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> /root/logs/deployment.log
}

log_status_container() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> /app/logs/deployment.log
}
# install netstat if not exists
install_netstat() {
  if ! command -v netstat &> /dev/null; then
    echo "Netstat is not installed. Installing Netstat..."
    sudo apt-get update
    sudo apt-get install -y net-tools
 #   sudo apt-get install -y sshpass
    echo "Netstat installation completed."
  else
    echo "Netstat is already installed."
  fi
}
#install_netstat

# SSH into the remote server and run deployment commands using sshpass
sshpass -p $SERVER_PASSWORD ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << EOF
  # Install Git and Docker if not already installed
  $(declare -f install_git)
  $(declare -f install_docker)
  $(declare -f log_status)
  $(declare -f install_netstat)
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
  log_status "Selected available port: $PORT"
  # Start the new Docker container
  if ! docker run -d -p $PORT:5000 --name $CONTAINER_NAME $IMAGE_NAME; then
    log_status "Error: Failed to start container"
    exit 1
  fi
  log_status "Container started successfully on port $PORT"


  # Get the deployment URL
  DEPLOY_URL="http://$SERVER_IP:$PORT"
  log_status "Deployment URL: $DEPLOY_URL"
  # Output deployment details
  echo "Deployment completed successfully"
  echo "Preview URL: $DEPLOY_URL"
  echo "Deployment time: $(date)"
EOF


# Capture the output of the SSH command
DEPLOY_STATUS=$?
# Log the final status
if [ $DEPLOY_STATUS -eq 0 ]; then
  log_status_container "Deployment completed successfully for PR #${PR_NUMBER}"
else
  log_status_container "Error: Deployment failed for PR #${PR_NUMBER}"
fi
# Output deployment status
echo "Deployment status: $DEPLOY_STATUS, PORT: $PORT"
