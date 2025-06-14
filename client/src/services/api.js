import axios from 'axios';

// 從環境變數中獲取 API URL，如果沒有設定，則使用預設值
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// 創建 axios 實例
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加請求攔截器，自動添加 token 到請求標頭
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 添加響應攔截器，處理 token 過期的情況
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 如果是 401 錯誤（未授權）且不是重試請求
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // 嘗試使用 refresh token 獲取新的 access token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // 如果沒有 refresh token，則登出用戶
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // 發送請求獲取新的 token
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });
        
        // 保存新的 token
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        // 使用新的 token 重試原始請求
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // refresh token 也失效，登出用戶
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Token 管理函數
const tokenService = {
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },
  getAccessToken: () => {
    return localStorage.getItem('accessToken');
  },
  getRefreshToken: () => {
    return localStorage.getItem('refreshToken');
  },
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  }
};

export const api = {
  // 認證相關 API
  auth: {
    // 登入
    login: (credentials) => {
      return axiosInstance.post('/auth/login', credentials)
        .then(response => {
          // 儲存 token 和用戶資訊
          const { accessToken, refreshToken, user } = response.data;
          console.log('登入成功，取得 token:', { accessToken, refreshToken });
          tokenService.setTokens(accessToken, refreshToken);
          localStorage.setItem('user', JSON.stringify(user));
          return response;
        });
    },
    // 登出
    logout: () => {
      return axiosInstance.post(`${API_URL}/auth/logout`)
        .then(() => {
          // 清除本地儲存的 token 和用戶資訊
          tokenService.clearTokens();
          localStorage.removeItem('user');
        });
    },
    // 刷新 token
    refreshToken: () => {
      // 使用 axiosInstance 並在標頭中發送 refreshToken
      return axiosInstance.post('/auth/refresh', {}, {
        headers: {
          'Authorization': `Bearer ${tokenService.getRefreshToken()}`
        }
      });
    },
    // 獲取當前用戶資料
    getProfile: () => {
      return axiosInstance.get(`${API_URL}/auth/profile`);
    },
    // 檢查是否已認證
    isAuthenticated: () => {
      return tokenService.isAuthenticated();
    }
  },
  
  // 用戶相關 API
  users: {
    // 獲取所有用戶
    getAll: () => {
      return axiosInstance.get(`${API_URL}/users`);
    },
    // 獲取單個用戶
    getUser: (id) => {
      return axiosInstance.get(`${API_URL}/users/${id}`);
    },
    // 創建用戶 (註冊)
    register: (userData) => {
      return axios.post(`${API_URL}/users`, userData);
    },
    // 更新用戶資料
    update: (id, userData) => {
      return axiosInstance.put(`${API_URL}/users/${id}`, userData);
    }
  },
  
  // 聊天室相關 API
  rooms: {
    // 獲取所有聊天室
    getAll: () => {
      return axiosInstance.get(`${API_URL}/rooms`);
    },
    // 獲取單個聊天室
    getRoom: (id) => {
      return axiosInstance.get(`${API_URL}/rooms/${id}`);
    },
    // 創建聊天室
    create: (roomData) => {
      return axiosInstance.post(`${API_URL}/rooms`, roomData);
    },
    // 更新聊天室資料
    update: (id, roomData) => {
      return axiosInstance.put(`${API_URL}/rooms/${id}`, roomData);
    },
    // 刪除聊天室
    delete: (id) => {
      return axiosInstance.delete(`${API_URL}/rooms/${id}`);
    },
    // 加入用戶到聊天室
    addUser: (roomId, userId) => {
      return axiosInstance.post(`${API_URL}/rooms/${roomId}/users/${userId}`);
    },
    // 從聊天室移除用戶
    removeUser: (roomId, userId) => {
      return axiosInstance.delete(`${API_URL}/rooms/${roomId}/users/${userId}`);
    },
    // 獲取聊天室的訊息
    getMessages: (roomId) => {
      return axiosInstance.get(`${API_URL}/rooms/${roomId}/messages`);
    }
  },
  
  // 訊息相關 API
  messages: {
    // 獲取所有訊息
    getAll: () => {
      return axiosInstance.get(`${API_URL}/messages`);
    },
    // 獲取單個訊息
    getMessage: (id) => {
      return axiosInstance.get(`${API_URL}/messages/${id}`);
    },
    // 獲取聊天室的所有訊息
    getRoomMessages: (roomId) => {
      return axiosInstance.get(`${API_URL}/messages/room/${roomId}`);
    },
    // 發送訊息
    create: (messageData) => {
      return axiosInstance.post(`${API_URL}/messages`, messageData);
    },
    // 更新訊息
    update: (id, content) => {
      return axiosInstance.put(`${API_URL}/messages/${id}`, { content });
    },
    // 刪除訊息
    delete: (id) => {
      return axiosInstance.delete(`${API_URL}/messages/${id}`);
    }
  },
  
  // 導出 token 服務
  tokenService
};