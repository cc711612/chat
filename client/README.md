# 聊天應用 - 前端

這是一個基於 React 開發的實時聊天應用程式前端。此前端應用為使用者提供直觀的界面，用於註冊、登入、加入聊天室以及傳送和接收即時訊息。

## 功能特色

- 使用者註冊與登入系統
- 聊天室列表與管理
- 即時訊息交流
- 響應式設計，適合桌面和移動裝置使用

## 技術棧

- React.js
- Socket.io-client (用於實時通訊)
- CSS (樣式設計)
- RESTful API 整合

## 開始使用

### 必要條件

- Node.js 16.x 或更高版本
- npm 7.x 或更高版本

### 安裝步驟

1. 複製專案後，進入 client 目錄

```bash
cd client
```

2. 安裝相依套件

```bash
npm install
```

3. 創建環境變數檔案

在 client 目錄下創建 `.env` 檔案，並添加以下內容：

```
REACT_APP_API_URL=http://localhost:3001
REACT_APP_SOCKET_URL=http://localhost:3001
```

請根據您的後端服務配置調整 URL。

4. 啟動開發伺服器

```bash
npm start
```

應用將在 [http://localhost:3000](http://localhost:3000) 運行。

## 構建生產版本

要構建用於生產環境的優化版本，請運行：

```bash
npm run build
```

構建後的檔案將輸出到 `build` 目錄中。

## 專案結構

```
src/
├── components/       # React 元件
│   ├── ChatPage.js   # 聊天室頁面
│   ├── LoginPage.js  # 登入頁面
│   ├── RegisterPage.js # 註冊頁面
│   └── RoomsPage.js  # 聊天室列表頁面
├── services/         # API 和服務
│   ├── api.js        # REST API 請求函數
│   └── socket.js     # Socket.io 連接管理
├── App.js            # 主應用元件
└── index.js          # 應用入口點
```

## 與後端連接

此前端應用需要與對應的後端服務一起運行。請確保按照後端 README 指示啟動後端服務器。

## 故障排除

如果您遇到連接問題：

1. 確認後端服務是否正在運行
2. 檢查 `.env` 檔案中的 URL 配置是否正確
3. 確認瀏覽器 console 中沒有 CORS 相關錯誤

## 開發指南

- API 請求應添加到 `services/api.js`
- Socket.io 事件處理應添加到 `services/socket.js`
- 新頁面或元件應添加到 `components` 目錄
