FROM node:16.15-alpine3.14
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
ENTRYPOINT ["node", "app.js"]
