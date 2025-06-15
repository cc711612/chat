import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, ListGroup, Alert } from 'react-bootstrap';
import { useParams, useHistory } from 'react-router-dom';
import { api } from '../services/api';
import ReactStringReplace from 'react-string-replace';
import { socketService } from '../services/socket';

// 常用 emoji 列表
const commonEmojis = [
  '😀', '😂', '😊', '🥰', '😎', '👍', '❤️', '🎉',
  '🔥', '✨', '🙏', '👏', '🤔', '😢', '😭', '🥺',
  '👌', '🤣', '😍', '🙄', '😬', '🤩', '😴', '🤯'
];

const emojiLabels = {
  '😀': '笑臉',
  '😂': '笑哭',
  '😊': '微笑',
  '🥰': '開心',
  '😎': '酷',
  '👍': '讚',
  '❤️': '愛心',
  '🎉': '慶祝',
  '🔥': '火焰',
  '✨': '閃亮',
  '🙏': '祈禱',
  '👏': '鼓掌',
  '🤔': '思考',
  '😢': '哭泣',
  '😭': '大哭',
  '🥺': '可憐',
  '👌': '讚',
  '🤣': '大笑',
  '😍': '愛心眼',
  '🙄': '無奈',
  '😬': '尷尬',
  '🤩': '興奮',
  '😴': '睡覺',
  '🤯': '爆炸',
};

function getEmojiLabel(emoji) {
  return emojiLabels[emoji] || '表情符號';
}

function renderMessageContent(content) {
  return ReactStringReplace(content, /([\u231A-\uD83E\uDDFF])/gu, (match, i) => (
    <span key={i} role="img" aria-label={getEmojiLabel(match)}>
      {match}
    </span>
  ));
}

const ChatPage = () => {
  const { roomId } = useParams();
  const history = useHistory();
  const [currentUser, setCurrentUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roomUsers, setRoomUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageIdsRef = useRef(new Set()); // 用于跟踪已显示的消息ID
  const [showEmojis, setShowEmojis] = useState(false);
  const emojiPickerRef = useRef(null);
  
  // 點擊外部關閉 emoji 選擇器
  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojis(false);
      }
    }
    
    if (showEmojis) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojis]);

  // 判斷用戶是否已經滾動到底部或接近底部
  const isNearBottom = useCallback(() => {
    if (!chatBodyRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = chatBodyRef.current;
    // 如果距離底部小於 100px，則視為已經在底部
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);
  
  // 智能滾動到底部，只有當用戶已經在底部時才會自動滾動
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && isNearBottom()) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isNearBottom]);

  // 將 addMessageSafely 函數定義移到這裡，在它被使用之前
  const addMessageSafely = useCallback((message) => {
    if (!message || !message.id) return false;
    
    // 添加新訊息到列表
    // 確保不重複添加相同的訊息
    if (!messageIdsRef.current.has(message.id)) {
      setMessages(prevMessages => [...prevMessages, message]);
      messageIdsRef.current.add(message.id);
      
      // 如果是在底部或是自己發送的訊息，更新最後讀取的訊息 ID
      if (isNearBottom() || message.user?.id === currentUser?.id) {
        setLastReadMessageId(message.id);
      } 
      // 如果不在底部，且不是自己發送的訊息，顯示新訊息提示
      else if (message.user?.id !== currentUser?.id) {
        setHasNewMessages(true);
      }
      return true;
    }
    return false;
  }, [currentUser?.id, isNearBottom]);

  const setupSocketListeners = useCallback(() => {
    socketService.onNewMessage((message) => {
      console.log('New message received:', message);
      addMessageSafely(message);
    });
    
    // 監聽用戶加入
    socketService.onUserJoined((data) => {
      // 更新聊天室用戶列表
      setRoomUsers((prevUsers) => {
        if (!prevUsers.some(user => user.id === data.user.id)) {
          return [...prevUsers, data.user];
        }
        return prevUsers;
      });
    });
    
    // 監聽用戶離開
    socketService.onUserLeft((data) => {
      // 從用戶列表中移除離開的用戶
      setRoomUsers((prevUsers) => prevUsers.filter(user => user.id !== data.userId));
    });
    
    // 監聽用戶輸入狀態
    socketService.onTyping((data) => {
      if (data.userId !== currentUser?.id) {
        if (data.isTyping) {
          setTypingUsers(prev => ({ ...prev, [data.userId]: true }));
        } else {
          setTypingUsers(prev => {
            const newState = { ...prev };
            delete newState[data.userId];
            return newState;
          });
        }
      }
    });
  }, [currentUser, addMessageSafely]);

  // 添加狀態來追蹤是否還有更多訊息可以載入
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [oldestMessageDate, setOldestMessageDate] = useState(null);
  // 新增未讀訊息提示狀態
  const [hasNewMessages, setHasNewMessages] = useState(false);
  // 記錄上次讀取的最新訊息 ID
  const [lastReadMessageId, setLastReadMessageId] = useState(null);
  
  const fetchRoomDetails = useCallback(async () => {
    try {
      setLoading(true);
      
      // 獲取聊天室詳細信息
      const response = await api.rooms.getRoom(roomId);
      setRoom(response.data);
      
      // 獲取聊天室的訊息，排除系統訊息
      const messagesResponse = await api.messages.getRoomMessages(roomId, {
        limit: 50,
        excludeSystem: true
      });
      const fetchedMessages = messagesResponse.data;
      
      // 更新消息并记录ID
      setMessages(fetchedMessages);
      messageIdsRef.current = new Set(fetchedMessages.map(msg => msg.id));
      
      // 設置最老訊息的日期和 ID，用於分頁載入
      if (fetchedMessages.length > 0) {
        // 記錄最老訊息的日期和 ID
        const oldestMessage = fetchedMessages.reduce((oldest, current) => 
          new Date(current.sentAt) < new Date(oldest.sentAt) ? current : oldest
        );
        console.log('初始載入後的最老訊息:', oldestMessage);
        setOldestMessageDate(oldestMessage.sentAt);
        setOldestMessageId(oldestMessage.id);
        
        // 記錄最新訊息的 ID，用於標記已讀訊息
        const newestMessage = fetchedMessages.reduce((newest, current) => 
          new Date(current.sentAt) > new Date(newest.sentAt) ? current : newest
        );
        setLastReadMessageId(newestMessage.id);
        
        // 如果返回的訊息數量等於請求的數量，則可能還有更多訊息
        const hasMore = fetchedMessages.length >= 50;
        console.log('是否有更多訊息:', hasMore, '訊息數量:', fetchedMessages.length);
        setHasMoreMessages(hasMore);
        
        // 確保初始載入後立即滾動到底部
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
          }
        }, 100);
      } else {
        setHasMoreMessages(false);
      }
      
      setRoomUsers(response.data.users || []);
    } catch (error) {
      console.error('獲取聊天室數據失敗:', error);
      setError('無法載入聊天室數據，請稍後再試。');
    } finally {
      setLoading(false);
    }
  }, [roomId]);
  
  // 記錄滾動位置的參考元素
  const scrollPositionMarkerRef = useRef(null);
  const chatBodyRef = useRef(null);
  
  // 儲存最老訊息的 ID
  const [oldestMessageId, setOldestMessageId] = useState(null);
  
  // 載入更多歷史訊息
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || loadingMoreMessages) return;
    
    console.log('開始載入更多訊息');
    console.log('當前最老訊息 ID:', oldestMessageId);
    
    try {
      setLoadingMoreMessages(true);
      
      // 在載入前記錄當前第一條訊息的位置和滾動高度
      const chatBody = chatBodyRef.current;
      const scrollHeight = chatBody ? chatBody.scrollHeight : 0;
      const firstMessageElement = document.querySelector('.message');
      if (firstMessageElement) {
        scrollPositionMarkerRef.current = firstMessageElement;
      }
      
      // 使用 ID 進行分頁
      const params = {
        limit: 50,
        excludeSystem: true
      };
      
      // 如果有最老訊息 ID，則使用 ID 進行分頁
      if (oldestMessageId) {
        params.beforeId = oldestMessageId;
      } 
      // 否則使用日期進行分頁（只有在第一次載入更多訊息時才會使用）
      else if (oldestMessageDate) {
        params.before = oldestMessageDate;
      }
      
      console.log('請求參數:', params);
      
      const messagesResponse = await api.messages.getRoomMessages(roomId, params);
      
      const olderMessages = messagesResponse.data;
      console.log('載入到的訊息數量:', olderMessages.length);
      
      if (olderMessages.length > 0) {
        // 尋找最老的訊息
        const oldestMessage = olderMessages.reduce((oldest, current) => 
          new Date(current.sentAt) < new Date(oldest.sentAt) ? current : oldest
        );
        console.log('新的最老訊息:', oldestMessage);
        
        // 更新最老訊息的 ID 和日期
        setOldestMessageId(oldestMessage.id);
        setOldestMessageDate(oldestMessage.sentAt);
        
        // 添加新訊息到現有訊息列表的前面
        setMessages(prevMessages => {
          // 記錄更新前的訊息狀態
          console.log('更新前的訊息列表:', prevMessages.length, '條訊息');
          console.log('更新前的訊息 ID 集合大小:', messageIdsRef.current.size);
          
          // 過濾掉已經存在的訊息
          const existingIds = new Set(prevMessages.map(msg => msg.id));
          const newMessages = olderMessages.filter(msg => !existingIds.has(msg.id));
          console.log('新增的不重複訊息數量:', newMessages.length);
          console.log('新訊息 ID:', newMessages.map(msg => msg.id));
          
          // 更新已顯示訊息的 ID 集合
          newMessages.forEach(msg => messageIdsRef.current.add(msg.id));
          
          // 將新訊息添加到現有訊息的前面
          const updatedMessages = [...newMessages, ...prevMessages];
          console.log('更新後的訊息列表:', updatedMessages.length, '條訊息');
          
          return updatedMessages;
        });
        
        // 如果返回的訊息數量等於請求的數量，則可能還有更多訊息
        const hasMore = olderMessages.length >= 50;
        console.log('是否還有更多訊息:', hasMore);
        setHasMoreMessages(hasMore);
        
        // 使用 setTimeout 確保在 DOM 更新後恢復滾動位置
        setTimeout(() => {
          if (chatBodyRef.current) {
            // 計算新增內容的高度差異，並調整滾動位置
            const newScrollHeight = chatBodyRef.current.scrollHeight;
            const heightDifference = newScrollHeight - scrollHeight;
            chatBodyRef.current.scrollTop = heightDifference;
            console.log('滾動位置調整完成，高度差異:', heightDifference);
          } else {
            console.log('無法調整滾動位置，聊天容器不存在');
          }
        }, 100);
      } else {
        console.log('沒有更多訊息了');
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('載入更多訊息失敗:', error);
      setError('無法載入更多訊息，請稍後再試。');
    } finally {
      setLoadingMoreMessages(false);
    }
  }, [hasMoreMessages, loadingMoreMessages, roomId, oldestMessageId, oldestMessageDate, setOldestMessageId, setOldestMessageDate, setMessages, messageIdsRef, setHasMoreMessages, setError]);

  const joinRoom = useCallback(async (userId, roomId) => {
    try {
      console.log(`ChatPage: Attempting to join room ${roomId} with user ID ${userId}`);
      setError(''); // Clear any previous errors
      
      // First check if the room exists
      const roomResponse = await api.rooms.getRoom(roomId);
      if (!roomResponse || !roomResponse.data) {
        throw new Error(`Room ${roomId} does not exist`);
      }
      
      const response = await socketService.joinRoom(userId, roomId);
      console.log('Join room response:', response);
      
      if (response.messages) {
        setMessages(response.messages);
        messageIdsRef.current = new Set(response.messages.map(msg => msg.id));
      }
      
      if (response.users) {
        setRoomUsers(response.users);
      }
    } catch (error) {
      console.error('加入聊天室失敗:', error);
      // Set more helpful error message
      setError(`無法加入聊天室 (${roomId}): ${error.message}`);
      
      // Attempt to recover by retrying once
      setTimeout(() => {
        if (currentUser) {
          console.log('Retrying join room...');
          fetchRoomDetails();
        }
      }, 2000);
    }
  }, [currentUser, fetchRoomDetails]);

  // 確保用戶已登入
  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (!userString) {
      history.push('/login');
      return;
    }
    
    const user = JSON.parse(userString);
    setCurrentUser(user);
    
    // 連接 WebSocket (只執行一次)
    socketService.getSocket();
    
    // 組件解除掛載時的清理工作
    return () => {
      // 離開聊天室
      if (user && roomId) {
        leaveRoom(user.id, parseInt(roomId));
      }
      
      // 移除事件監聽
      socketService.removeAllListeners();
    };
  }, [history, roomId]); // 添加適當的依賴
  
  // 處理聊天室加入和獲取數據的邏輯
  useEffect(() => {
    if (!currentUser || !roomId) return;
    
    // 設置 WebSocket 事件監聽
    setupSocketListeners();
    
    // 獲取聊天室信息和訊息，然後加入聊天室
    const setupRoom = async () => {
      try {
        await fetchRoomDetails();
        await joinRoom(currentUser.id, parseInt(roomId));
      } catch (error) {
        console.error('設置聊天室失敗:', error);
      }
    };
    
    setupRoom();
    
  }, [currentUser, roomId, setupSocketListeners, fetchRoomDetails, joinRoom]);

  // 當訊息列表更新時，滾動到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // 添加滾動事件監聽，處理滾動到底部清除新訊息提示和滾動到頂部載入更多訊息
  useEffect(() => {
    const handleScroll = () => {
      // 當滾動到底部時，清除新訊息提示
      if (isNearBottom() && hasNewMessages) {
        setHasNewMessages(false);
      }
      
      // 當滾動到頂部或接近頂部時，自動載入更多訊息
      const { scrollTop } = chatBodyRef.current;
      if (scrollTop < 50 && hasMoreMessages && !loadingMoreMessages) {
        loadMoreMessages();
      }
    };
    
    const chatBodyElement = chatBodyRef.current;
    if (chatBodyElement) {
      chatBodyElement.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (chatBodyElement) {
        chatBodyElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [hasNewMessages, isNearBottom, hasMoreMessages, loadingMoreMessages, loadMoreMessages]);

  const leaveRoom = async (userId, roomId) => {
    try {
      await socketService.leaveRoom(userId, roomId);
    } catch (error) {
      console.error('離開聊天室失敗:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      // 创建临时消息对象用于本地显示
      const tempMessage = {
        id: `temp-${Date.now()}`, // 临时ID
        content: newMessage,
        user: currentUser,
        sentAt: new Date().toISOString(),
        temporary: true // 标记为临时消息
      };
      
      // 先显示临时消息，提高用户体验
      addMessageSafely(tempMessage);
      
      // 清空输入框
      setNewMessage('');
      
      // 发送消息到服务器
      const response = await socketService.sendMessage(tempMessage.content, currentUser.id, parseInt(roomId));
      
      // 如果服务器返回的消息与临时消息不同，则需要替换
      if (response.success && response.message) {
        // 移除临时消息
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg.id !== tempMessage.id)
        );
        messageIdsRef.current.delete(tempMessage.id);
        
        // 添加服务器返回的真实消息
        addMessageSafely(response.message);
      }
      
      // 通知其他用戶不再輸入
      socketService.typing(currentUser.id, parseInt(roomId), false);
    } catch (error) {
      console.error('發送訊息失敗:', error);
      setError('發送訊息失敗，請稍後再試。');
      
      // 移除临时消息
      setMessages(prevMessages => 
        prevMessages.filter(msg => !msg.temporary)
      );
    }
  };

  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
    
    // 通知其他用戶正在輸入
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    socketService.typing(currentUser.id, parseInt(roomId), true);
    
    // 3秒後自動將輸入狀態設為 false
    typingTimeoutRef.current = setTimeout(() => {
      socketService.typing(currentUser.id, parseInt(roomId), false);
    }, 3000);
  };

  const handleBack = () => {
    history.push('/rooms');
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    // 使用台灣時區 (UTC+8)
    return date.toLocaleTimeString('zh-TW', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Taipei' 
    });
  };

  const handleEmojiClick = (emoji) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojis(false);
  };

  const toggleEmojiPicker = () => {
    setShowEmojis(!showEmojis);
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <p>載入中...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={handleBack}>返回聊天室列表</Button>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-3">
      <Row>
        <Col md={9}>
          <Card className="chat-card">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h4>{room?.name}</h4>
                <small>{room?.description}</small>
              </div>
              <Button variant="outline-secondary" size="sm" onClick={handleBack}>
                返回聊天室列表
              </Button>
            </Card.Header>
            <Card.Body 
              ref={chatBodyRef}
              className="chat-messages" 
              style={{ height: '70vh', overflowY: 'auto' }}
            >
              {/* 加載更多訊息按鈕 */}
              {hasMoreMessages && (
                <div className="text-center my-2">
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={loadMoreMessages}
                    disabled={loadingMoreMessages}
                  >
                    {loadingMoreMessages ? '載入中...' : '加載更多訊息'}
                  </Button>
                </div>
              )}
              
              {messages.length === 0 ? (
                <div className="text-center text-muted my-5">
                  <p>還沒有訊息，發送第一條訊息來開始聊天吧！</p>
                </div>
              ) : (
                messages.map((message, index, allMessages) => (
                  <React.Fragment key={message.id}>
                    {/* 如果前一條訊息是已讀的，而當前訊息是未讀的，顯示分隔線 */}
                    {index > 0 && 
                     lastReadMessageId === allMessages[index-1].id && 
                     message.id !== lastReadMessageId && (
                      <div className="unread-divider text-center my-3">
                        <div style={{ 
                          height: '1px', 
                          backgroundColor: '#dc3545', 
                          position: 'relative',
                          marginBottom: '8px'
                        }}></div>
                        <small className="text-danger bg-white px-2" style={{ 
                          position: 'relative', 
                          top: '-18px',
                          padding: '0 10px'
                        }}>
                          新訊息
                        </small>
                      </div>
                    )}
                    <div 
                      className={`message ${message.isSystem ? 'text-center' : message.user?.id === currentUser?.id ? 'text-end' : ''}`}
                      style={{ marginBottom: '15px' }}
                    >
                      {!message.isSystem && message.user?.id !== currentUser?.id && (
                        <div className="message-sender">
                          <strong>{message.user?.displayName || message.user?.username}</strong>
                        </div>
                      )}
                      <div 
                        className={`message-content ${
                          message.isSystem 
                            ? 'bg-light text-muted font-italic' 
                            : message.user?.id === currentUser?.id 
                              ? 'bg-primary text-white' 
                              : 'bg-light'
                        } ${message.temporary ? 'opacity-75' : ''}`}
                        style={{ 
                          display: 'inline-block', 
                          padding: '8px 12px', 
                          borderRadius: '12px',
                          maxWidth: message.isSystem ? '50%' : '80%',
                          wordBreak: 'break-word',
                          fontStyle: message.isSystem ? 'italic' : 'normal'
                        }}
                      >
                        {renderMessageContent(message.content)}
                      </div>
                      <div className="message-time text-muted" style={{ fontSize: '0.75rem' }}>
                        {formatTimestamp(message.sentAt)}
                      </div>
                    </div>
                  </React.Fragment>
                ))
              )}
              {Object.keys(typingUsers).length > 0 && (
                <div className="typing-indicator text-muted" style={{ fontSize: '0.9rem' }}>
                  有人正在輸入...
                </div>
              )}
              <div ref={messagesEndRef} />
            </Card.Body>
            
            {/* 新訊息提示按鈕 */}
            {hasNewMessages && (
              <div 
                style={{
                  position: 'absolute',
                  bottom: '80px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 1000
                }}
              >
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="d-flex align-items-center"
                  onClick={() => {
                    if (messagesEndRef.current) {
                      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                    }
                    setHasNewMessages(false);
                  }}
                >
                  <span className="me-2">⚡</span>
                  新訊息
                </Button>
              </div>
            )}
            <Card.Footer>
              <Form onSubmit={handleSendMessage}>
                <div className="d-flex">
                  <div className="position-relative flex-grow-1">
                    <Form.Control
                      type="text"
                      placeholder="輸入訊息..."
                      value={newMessage}
                      onChange={handleMessageChange}
                    />
                    <Button 
                      variant="link" 
                      className="emoji-toggle"
                      style={{ 
                        position: 'absolute', 
                        right: '10px', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        zIndex: 2,
                        fontSize: '1.2rem',
                        color: '#666',
                        background: 'none',
                        border: 'none',
                        padding: '0 5px'
                      }} 
                      onClick={toggleEmojiPicker}
                    >
                      <span role="img" aria-label="微笑">😊</span>
                    </Button>
                    {showEmojis && (
                      <div 
                        className="emoji-picker"
                        ref={emojiPickerRef}
                        style={{
                          position: 'absolute',
                          bottom: '40px',
                          right: '0',
                          backgroundColor: '#fff',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          padding: '10px',
                          boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
                          zIndex: 1000,
                          display: 'flex',
                          flexWrap: 'wrap',
                          width: '250px',
                          maxHeight: '200px',
                          overflow: 'auto'
                        }}
                      >
                        {commonEmojis.map((emoji, index) => (
                          <div
                            key={index}
                            onClick={() => handleEmojiClick(emoji)}
                            style={{
                              background: 'none',
                              width: '30px',
                              height: '30px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontSize: '20px',
                              borderRadius: '4px',
                              margin: '2px',
                              transition: 'all 0.2s',
                              hoverBackgroundColor: '#f0f0f0'
                            }}
                          >
                            <span role="img" aria-label={getEmojiLabel(emoji)}>{emoji}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button type="submit" variant="primary" className="ms-2">
                    發送
                  </Button>
                </div>
              </Form>
            </Card.Footer>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Header>
              <h5>在線用戶 <Badge bg="success">{roomUsers.length}</Badge></h5>
            </Card.Header>
            <Card.Body style={{ height: '80vh', overflowY: 'auto' }}>
              <ListGroup variant="flush">
                {roomUsers.map(user => (
                  <ListGroup.Item key={user.id} className="d-flex justify-content-between align-items-center">
                    <div>
                      {user.displayName || user.username}
                      {user.id === currentUser?.id && <span className="text-muted"> (你)</span>}
                    </div>
                    <div>
                      <Badge bg="success" pill>在線</Badge>
                      {typingUsers[user.id] && <Badge bg="info" className="ms-1" pill>輸入中</Badge>}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ChatPage;