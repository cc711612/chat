# 即時聊天應用

這是一個功能完整的即時聊天應用，採用前後端分離架構，提供多人聊天室、即時訊息傳遞、用戶狀態更新和身份驗證等功能。

## 功能特色

- 🔐 **用戶認證**：註冊、登入、登出功能
- 💬 **即時訊息**：使用 Socket.IO 實現的即時聊天
- 👥 **聊天室**：支援多個聊天室並顯示線上用戶
- 📡 **狀態更新**：顯示用戶正在輸入的狀態提示
- 📱 **響應式設計**：適應各種裝置螢幕大小

## 技術堆疊

### 前端 (client)
- **React**：使用 React 19 構建用戶界面
- **React Router**：實現頁面路由管理
- **Bootstrap & React-Bootstrap**：響應式 UI 元件
- **Socket.IO Client**：即時通訊
- **Axios**：API 請求處理

### 後端 (server)
- **NestJS**：Node.js 框架，提供模組化架構
- **TypeORM**：數據庫 ORM
- **MySQL**：數據持久化存儲
- **Socket.IO**：WebSocket 實現即時通訊
- **bcrypt**：密碼加密
- **JSON Web Token**：用戶認證

## 專案結構

```
/chat-api
  /client               # 前端 React 應用
    /src
      /components       # React 元件
      /services         # API 與 Socket 服務
    /public             # 靜態資源
  /server               # 後端 NestJS 應用
    /src
      /chat            # WebSocket 相關代碼
      /config          # 應用配置
      /messages        # 訊息相關模組
      /rooms           # 聊天室相關模組
      /users           # 用戶相關模組
```

## 安裝與運行

### 環境要求
- Node.js 18+ 
- MySQL 8+

### 前端 (client)

```bash
cd client
npm install
npm start
```

前端應用將在 http://localhost:3000 運行

### 後端 (server)

1. 設置數據庫

```bash
# 建立 MySQL 數據庫
CREATE DATABASE chat_app_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 配置環境變數

在 server 目錄下創建 .env 檔案:

```env
# 服務器配置
SERVER_PORT=3001

# 數據庫配置
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=chat_app_db

# CORS 設定
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true
```

3. 啟動服務器

```bash
cd server
npm install
npm run start:dev
```

後端 API 將在 http://localhost:3001 運行

## 使用指南

1. 註冊新帳號或使用現有帳號登入
2. 瀏覽可用的聊天室或創建新的聊天室
3. 進入聊天室，開始即時聊天
4. 可以看到誰在線上以及誰正在輸入訊息

## 開發須知

- 前端開發時，確保後端服務已啟動
- 修改後端配置後需要重新啟動服務
- 使用 `npm run build` 產生生產環境的前後端代碼