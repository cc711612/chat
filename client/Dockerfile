# Client Dockerfile (React)
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .

# 預設 PORT=5173，可用 docker env 覆蓋
ARG PORT=5173
ENV PORT=${PORT}

EXPOSE ${PORT}

CMD ["npm", "start"]
