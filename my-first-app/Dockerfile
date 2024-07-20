FROM node:20-slim
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install
RUN npm install pm2 -g

RUN npm ci --production
RUN npm cache clean --force
ENV NODE_ENV="production"
COPY . .
# CMD [ "npm", "start" ]
CMD [ "pm2-runtime", "npm start" ]

