FROM node:20-alpine

WORKDIR /app
COPY package.json ./
COPY server.mjs ./

ENV DASHBOARD_API_HOST=0.0.0.0
ENV DASHBOARD_API_PORT=8080

EXPOSE 8080
CMD ["node", "server.mjs"]
