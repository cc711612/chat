import axios from 'axios';

// 從環境變數中獲取 API URL，如果沒有設定，則使用預設值
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const api = {
  // 用戶相關 API
  users: {
    // 獲取所有用戶
    getAll: () => {
      return axios.get(`${API_URL}/users`);
    },
    // 獲取單個用戶
    getUser: (id) => {
      return axios.get(`${API_URL}/users/${id}`);
    },
    // 創建用戶 (註冊)
    register: (userData) => {
      return axios.post(`${API_URL}/users`, userData);
    },
    // 登入
    login: (credentials) => {
      return axios.post(`${API_URL}/users/login`, credentials);
    },
    // 更新用戶資料
    update: (id, userData) => {
      return axios.put(`${API_URL}/users/${id}`, userData);
    }
  },
  
  // 聊天室相關 API
  rooms: {
    // 獲取所有聊天室
    getAll: () => {
      return axios.get(`${API_URL}/rooms`);
    },
    // 獲取單個聊天室
    getRoom: (id) => {
      return axios.get(`${API_URL}/rooms/${id}`);
    },
    // 創建聊天室
    create: (roomData) => {
      return axios.post(`${API_URL}/rooms`, roomData);
    },
    // 更新聊天室資料
    update: (id, roomData) => {
      return axios.put(`${API_URL}/rooms/${id}`, roomData);
    },
    // 刪除聊天室
    delete: (id) => {
      return axios.delete(`${API_URL}/rooms/${id}`);
    },
    // 加入用戶到聊天室
    addUser: (roomId, userId) => {
      return axios.post(`${API_URL}/rooms/${roomId}/users/${userId}`);
    },
    // 從聊天室移除用戶
    removeUser: (roomId, userId) => {
      return axios.delete(`${API_URL}/rooms/${roomId}/users/${userId}`);
    },
    // 獲取聊天室的訊息
    getMessages: (roomId) => {
      return axios.get(`${API_URL}/rooms/${roomId}/messages`);
    }
  },
  
  // 訊息相關 API
  messages: {
    // 獲取所有訊息
    getAll: () => {
      return axios.get(`${API_URL}/messages`);
    },
    // 獲取單個訊息
    getMessage: (id) => {
      return axios.get(`${API_URL}/messages/${id}`);
    },
    // 獲取聊天室的所有訊息
    getRoomMessages: (roomId) => {
      return axios.get(`${API_URL}/messages/room/${roomId}`);
    },
    // 發送訊息
    create: (messageData) => {
      return axios.post(`${API_URL}/messages`, messageData);
    },
    // 更新訊息
    update: (id, content) => {
      return axios.put(`${API_URL}/messages/${id}`, { content });
    },
    // 刪除訊息
    delete: (id) => {
      return axios.delete(`${API_URL}/messages/${id}`);
    }
  }
};