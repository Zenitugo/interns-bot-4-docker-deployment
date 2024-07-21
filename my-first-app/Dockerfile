FROM node:20-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
RUN npm install pm2 -g

# install net tools and sshpass
RUN apt-get update && \
    apt-get install -y sshpass && \
    apt-get install -y net-tools && \
    rm -rf /var/lib/apt/lists/*
RUN npm ci --production
RUN npm cache clean --force
ENV NODE_ENV="production"
COPY . .
#CMD [ "sh", "-c", "npm start &> /dev/null &"]
CMD [ "pm2-runtime", "npm start" ]

