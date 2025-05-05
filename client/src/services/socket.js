import { io } from 'socket.io-client';

// 從環境變數中獲取 API URL，如果沒有設定，則使用預設值
const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// 創建 socket 實例
let socket;

export const socketService = {
  // 連接到 WebSocket 服務器
  connect: () => {
    socket = io(SOCKET_URL, {
      // Add reconnection options for better reliability
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,  // 確保自動連接
      forceNew: false     // 允許重用連接
    });
    
    // Log connection status for debugging
    socket.on('connect', () => {
      console.log('Socket connected successfully');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    return socket;
  },
  
  // 獲取當前 socket 實例
  getSocket: () => {
    if (!socket) {
      console.log('Creating new socket connection');
      return socketService.connect();
    }
    
    if (!socket.connected) {
      console.log('Reconnecting socket');
      socket.connect();
    }
    
    return socket;
  },
  
  // 斷開連接
  disconnect: () => {
    if (socket) {
      console.log('Disconnecting socket');
      socket.disconnect();
      socket = null;
    }
  },
  
  // 用戶登入
  login: (userId) => {
    return new Promise((resolve, reject) => {
      const currentSocket = socketService.getSocket();
      console.log(`Logging in user ${userId}`);
      currentSocket.emit('login', { userId }, (response) => {
        if (response.success) {
          console.log('Login successful');
          resolve(response);
        } else {
          console.error('Login failed:', response.message);
          reject(new Error(response.message || 'Login failed'));
        }
      });
    });
  },
  
  // 用戶登出
  logout: (userId) => {
    return new Promise((resolve, reject) => {
      // 確保有一個有效的 socket 連接
      const currentSocket = socketService.getSocket();
      currentSocket.emit('logout', { userId }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.message || 'Logout failed'));
        }
      });
    });
  },
  
  // 加入聊天室
  joinRoom: (userId, roomId) => {
    return new Promise((resolve, reject) => {
      console.log(`Attempting to join room: userId=${userId}, roomId=${roomId}`);
      const currentSocket = socketService.getSocket();
      currentSocket.emit('joinRoom', { userId, roomId }, (response) => {
        if (response && response.success) {
          console.log(`Successfully joined room ${roomId}`, response);
          resolve(response);
        } else {
          const errorMsg = response ? response.message : 'No response received';
          console.error(`Failed to join room: ${errorMsg}`);
          reject(new Error(errorMsg || 'Failed to join room'));
        }
      });
    });
  },
  
  // 離開聊天室
  leaveRoom: (userId, roomId) => {
    return new Promise((resolve, reject) => {
      const currentSocket = socketService.getSocket();
      currentSocket.emit('leaveRoom', { userId, roomId }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.message || 'Failed to leave room'));
        }
      });
    });
  },
  
  // 發送訊息
  sendMessage: (content, userId, roomId) => {
    return new Promise((resolve, reject) => {
      const currentSocket = socketService.getSocket();
      console.log(`Sending message to room ${roomId}: ${content.substring(0, 30)}...`);
      
      currentSocket.emit('sendMessage', { content, userId, roomId }, (response) => {
        if (response && response.success) {
          console.log('Message sent successfully');
          resolve(response);
        } else {
          const errorMsg = response ? response.message : 'No response received';
          console.error(`Failed to send message: ${errorMsg}`);
          reject(new Error(errorMsg || 'Failed to send message'));
        }
      });
    });
  },
  
  // 通知其他用戶正在輸入
  typing: (userId, roomId, isTyping) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit('typing', { userId, roomId, isTyping });
  },
  
  // 監聽訊息事件
  onNewMessage: (callback) => {
    const currentSocket = socketService.getSocket();
    // 移除任何現有的 newMessage 事件監聽器，以避免重複
    currentSocket.off('newMessage');
    currentSocket.on('newMessage', (message) => {
      console.log('New message received in socket service:', message);
      callback(message);
    });
  },
  
  // 監聽用戶加入聊天室
  onUserJoined: (callback) => {
    const currentSocket = socketService.getSocket();
    currentSocket.off('userJoined');
    currentSocket.on('userJoined', callback);
  },
  
  // 監聽用戶離開聊天室
  onUserLeft: (callback) => {
    const currentSocket = socketService.getSocket();
    currentSocket.off('userLeft');
    currentSocket.on('userLeft', callback);
  },
  
  // 監聽用戶在線狀態變化
  onUserStatus: (callback) => {
    const currentSocket = socketService.getSocket();
    currentSocket.off('userStatus');
    currentSocket.on('userStatus', callback);
  },
  
  // 監聽用戶輸入狀態
  onTyping: (callback) => {
    const currentSocket = socketService.getSocket();
    currentSocket.off('typing');
    currentSocket.on('typing', callback);
  },
  
  // 移除所有事件監聽
  removeAllListeners: () => {
    if (socket) {
      ['newMessage', 'userJoined', 'userLeft', 'userStatus', 'typing'].forEach(event => {
        socket.off(event);
      });
      console.log('All socket listeners removed');
    }
  }
};