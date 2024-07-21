# Use the official Node.js 14 image as a parent image
FROM node:20-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available) to the working directory
COPY package*.json ./

# Install any dependencies
RUN npm install
RUN npm install pm2 -g

# Copy the rest of the application's source code from the local directory to the working directory inside the container
COPY . .

# Make port 7000 available to the world outside this container
EXPOSE 7000

# Run the application when the container launches
#CMD ["npm", "start"]
CMD ["pm2-runtime", "server.js"]
