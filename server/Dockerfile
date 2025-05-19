# Server Dockerfile (NestJS)
FROM node:18
# 改用完整版 node:18，alpine 可能缺少 openssl 導致 crypto module 不可用

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps && npm install crypto \
    && npm rebuild bcrypt --build-from-source
COPY . .

# 編譯 TypeScript
RUN npm run build

# 預設 PORT=3000，可用 docker env 覆蓋
ARG PORT=3000
ENV PORT=${PORT}

EXPOSE ${PORT}

# 支援 dev/prod 模式切換
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# 開發模式: 掛載 src 並用 start:dev
CMD if [ "$NODE_ENV" = "development" ]; then npm run start:dev; else npm run start:prod; fi
