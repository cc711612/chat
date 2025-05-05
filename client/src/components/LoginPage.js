import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { useHistory, useLocation } from 'react-router-dom';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    // 處理從其他頁面傳入的消息
    if (location.state?.message) {
      setNotification(location.state.message);
      // 清除 location state 以避免重新載入頁面時再次顯示消息
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 調用後端 API 進行登入
      const response = await api.users.login(formData);
      const { user } = response.data;
      
      // 存儲用戶資訊到 localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      // 連接 WebSocket 並發送登入訊息
      socketService.connect();
      await socketService.login(user.id);
      
      // 導航到聊天室列表頁面
      history.push('/rooms');
    } catch (err) {
      setError(err.response?.data?.message || '登入失敗，請檢查用戶名和密碼');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card>
            <Card.Header as="h4" className="text-center">登入</Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {notification && <Alert variant="success">{notification}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>用戶名</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder="請輸入用戶名"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>密碼</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="請輸入密碼"
                  />
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? '登入中...' : '登入'}
                  </Button>
                  
                  <div className="text-center mt-3">
                    還沒有帳號？<Button variant="link" onClick={() => history.push('/register')} className="p-0">註冊</Button>
                  </div>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;