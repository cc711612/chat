import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, ListGroup, Alert, Dropdown } from 'react-bootstrap';
import { useParams, useHistory } from 'react-router-dom';
import { api } from '../services/api';
import { socketService } from '../services/socket';

// 常用 emoji 列表
const commonEmojis = [
  '😀', '😂', '😊', '🥰', '😎', '👍', '❤️', '🎉',
  '🔥', '✨', '🙏', '👏', '🤔', '😢', '😭', '🥺',
  '👌', '🤣', '😍', '🙄', '😬', '🤩', '😴', '🤯'
];

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

  // 將 addMessageSafely 函數定義移到這裡，在它被使用之前
  const addMessageSafely = useCallback((message) => {
    if (!message || !message.id) return false;
    
    // 检查消息是否已存在
    if (messageIdsRef.current.has(message.id)) {
      return false; // 消息已存在，不添加
    }
    
    // 添加消息并更新追踪集合
    setMessages(prevMessages => [...prevMessages, message]);
    messageIdsRef.current.add(message.id);
    return true;
  }, []);

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

  const fetchRoomDetails = useCallback(async () => {
    try {
      setLoading(true);
      
      // 獲取聊天室詳細信息
      const response = await api.rooms.getRoom(roomId);
      setRoom(response.data);
      
      // 獲取聊天室的訊息
      const messagesResponse = await api.messages.getRoomMessages(roomId);
      const fetchedMessages = messagesResponse.data;
      
      // 更新消息并记录ID
      setMessages(fetchedMessages);
      messageIdsRef.current = new Set(fetchedMessages.map(msg => msg.id));
      
      setRoomUsers(response.data.users || []);
    } catch (error) {
      console.error('獲取聊天室數據失敗:', error);
      setError('無法載入聊天室數據，請稍後再試。');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

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
  }, [messages]);

  const leaveRoom = async (userId, roomId) => {
    try {
      await socketService.leaveRoom(userId, roomId);
    } catch (error) {
      console.error('離開聊天室失敗:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
            <Card.Body className="chat-messages" style={{ height: '70vh', overflowY: 'auto' }}>
              {messages.length === 0 ? (
                <div className="text-center text-muted my-5">
                  <p>還沒有訊息，發送第一條訊息來開始聊天吧！</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div 
                    key={message.id} 
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
                      {message.content}
                    </div>
                    <div className="message-time text-muted" style={{ fontSize: '0.75rem' }}>
                      {formatTimestamp(message.sentAt)}
                    </div>
                  </div>
                ))
              )}
              {Object.keys(typingUsers).length > 0 && (
                <div className="typing-indicator text-muted" style={{ fontSize: '0.9rem' }}>
                  有人正在輸入...
                </div>
              )}
              <div ref={messagesEndRef} />
            </Card.Body>
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
                      😊
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
                            {emoji}
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