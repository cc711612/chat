<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# 聊天應用 - 後端 API

這是一個基於 NestJS 開發的實時聊天應用程式後端 API。此服務提供用戶認證、聊天室管理和訊息處理等功能，支持前端應用與資料庫之間的交互。

## 功能特色

- RESTful API 端點，用於用戶管理、聊天室管理和訊息處理
- 基於 Socket.io 的實時通訊系統
- 用戶認證與授權
- 資料持久化存儲

## 技術棧

- NestJS 框架
- TypeScript
- Socket.io (用於實時通訊)
- TypeORM (資料庫 ORM)
- JWT 認證

## 開始使用

### 必要條件

- Node.js 16.x 或更高版本
- npm 7.x 或更高版本
- 資料庫 (MySQL/PostgreSQL/SQLite)

### 安裝步驟

1. 複製專案後，進入 server 目錄

```bash
cd server
```

2. 安裝相依套件

```bash
npm install
```

3. 設定環境變數

將 `.env.example` 複製為 `.env` 並根據您的環境配置以下變數：

```
# 應用設定
PORT=3001
NODE_ENV=development

# 資料庫設定
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=chat_db

# JWT 設定
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=86400
```

4. 啟動伺服器

開發模式（自動重載）：
```bash
npm run start:dev
```

生產模式：
```bash
npm run build
npm run start:prod
```

伺服器將在設定的端口 (預設 3001) 上運行。

## API 端點

### 用戶管理
- `POST /users/register` - 註冊新用戶
- `POST /users/login` - 用戶登入
- `GET /users/profile` - 獲取用戶資料

### 聊天室管理
- `GET /rooms` - 獲取所有聊天室
- `POST /rooms` - 創建新聊天室
- `GET /rooms/:id` - 獲取特定聊天室
- `DELETE /rooms/:id` - 刪除聊天室

### 訊息管理
- `GET /messages/room/:roomId` - 獲取特定聊天室的訊息
- `POST /messages` - 發送新訊息

## WebSocket 事件

- `connection` - 用戶連接
- `disconnect` - 用戶斷開連接
- `joinRoom` - 用戶加入聊天室
- `leaveRoom` - 用戶離開聊天室
- `sendMessage` - 發送訊息
- `receiveMessage` - 接收訊息

## 專案結構

```
src/
├── main.ts                 # 應用入口點
├── app.module.ts           # 主應用模組
├── users/                  # 用戶管理模組
│   ├── user.entity.ts
│   ├── users.controller.ts
│   ├── users.module.ts
│   └── users.service.ts
├── rooms/                  # 聊天室管理模組
│   ├── room.entity.ts
│   ├── rooms.controller.ts
│   ├── rooms.module.ts
│   └── rooms.service.ts
├── messages/               # 訊息管理模組
│   ├── message.entity.ts
│   ├── messages.controller.ts
│   ├── messages.module.ts
│   └── messages.service.ts
├── chat/                   # WebSocket 通訊模組
│   └── chat.gateway.ts
└── config/                 # 應用配置模組
    ├── config.module.ts
    ├── database.config.ts
    └── env.config.ts
```

## 資料庫遷移

初始化資料庫結構（如果使用 TypeORM 遷移）：

```bash
npm run typeorm migration:run
```

## 測試

執行單元測試：
```bash
npm run test
```

執行端到端測試：
```bash
npm run test:e2e
```

## 部署

生產環境部署建議：

1. 使用 PM2 或類似工具管理 Node.js 進程
2. 設置反向代理，如 Nginx
3. 確保環境變數正確配置
4. 考慮使用容器化，如 Docker

## 安全性注意事項

- 確保 JWT_SECRET 的複雜性和定期輪換
- 所有敏感資訊應存儲在環境變數中，不應硬編碼在代碼中
- 生產環境應啟用 HTTPS
- 實施速率限制以防止暴力攻擊

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
