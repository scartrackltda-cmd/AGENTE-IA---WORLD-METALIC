FROM node:20-alpine
WORKDIR /app
COPY package.json .
COPY worker.js .
RUN npm install
CMD ["node", "worker.js"]
