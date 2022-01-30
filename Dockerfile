FROM node:12
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install
COPY . .

EXPOSE 5000
ENTRYPOINT ["node", "src/server.js"]