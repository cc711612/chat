import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, Modal } from 'react-bootstrap';
import { api } from '../services/api';
import { useHistory } from 'react-router-dom';

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomData, setNewRoomData] = useState({ name: '', description: '' });
  const history = useHistory();

  useEffect(() => {
    // 從 localStorage 獲取用戶信息
    const userString = localStorage.getItem('user');
    if (!userString) {
      // 如果沒有用戶信息，重定向到登入頁面
      history.push('/login');
      return;
    }

    // 獲取所有聊天室
    fetchRooms();
  }, [history]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await api.rooms.getAll();
      setRooms(response.data);
    } catch (error) {
      console.error('獲取聊天室失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = (roomId) => {
    history.push(`/chat/${roomId}`);
  };

  const handleCreateRoom = async () => {
    try {
      const response = await api.rooms.create(newRoomData);
      setRooms([...rooms, response.data]);
      setShowCreateModal(false);
      setNewRoomData({ name: '', description: '' });
    } catch (error) {
      console.error('創建聊天室失敗:', error);
    }
  };

  const handleInputChange = (e) => {
    setNewRoomData({
      ...newRoomData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>聊天室列表</h2>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              創建新聊天室
            </Button>
          </div>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center">
          <p>載入中...</p>
        </div>
      ) : (
        <Row>
          {rooms.length === 0 ? (
            <Col>
              <Card className="text-center p-4">
                <p>目前沒有聊天室。點擊上方的「創建新聊天室」按鈕來創建第一個聊天室。</p>
              </Card>
            </Col>
          ) : (
            rooms.map(room => (
              <Col md={4} key={room.id} className="mb-4">
                <Card>
                  <Card.Header as="h5">{room.name}</Card.Header>
                  <Card.Body>
                    <Card.Text>{room.description || '沒有描述'}</Card.Text>
                    <div className="d-flex justify-content-between align-items-center">
                      <Badge bg="info">
                        {room.users?.length || 0} 位用戶
                      </Badge>
                      <Button variant="success" onClick={() => handleJoinRoom(room.id)}>
                        加入聊天
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))
          )}
        </Row>
      )}

      {/* 創建聊天室的彈出窗口 */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>創建新聊天室</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>聊天室名稱</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={newRoomData.name}
                onChange={handleInputChange}
                required
                placeholder="請輸入聊天室名稱"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>描述</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={newRoomData.description}
                onChange={handleInputChange}
                placeholder="請輸入聊天室描述（可選）"
                rows={3}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            取消
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateRoom}
            disabled={!newRoomData.name}
          >
            創建
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default RoomsPage;