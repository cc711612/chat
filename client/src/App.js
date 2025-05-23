import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import { Container, Navbar, Nav, Button } from 'react-bootstrap';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import RoomsPage from './components/RoomsPage';
import ChatPage from './components/ChatPage';
import { socketService } from './services/socket';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // 從 localStorage 獲取用戶信息
    const userString = localStorage.getItem('user');
    try {
      if (userString) {
        const user = JSON.parse(userString);
        // 檢查 user 是否為物件且有 id
        if (user && typeof user === 'object' && (typeof user.id === 'number' ? !isNaN(user.id) : !!user.id)) {
          setCurrentUser(user);
        } else {
          // 若 user 無效則清除 localStorage
          localStorage.removeItem('user');
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      // JSON 解析錯誤時清除 localStorage
      localStorage.removeItem('user');
      setCurrentUser(null);
    }
  }, []);

  const handleLogout = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      console.log('logout user:', user);
      
      if (user) {
        // 通知 WebSocket 伺服器用戶登出
        await socketService.logout(user.id);
      }
      
      // 移除本地儲存的用戶資訊
      localStorage.removeItem('user');
      setCurrentUser(null);
      
      // 斷開 WebSocket 連接
      socketService.disconnect();
      
      // 重新導向到登入頁面
      window.location.href = '/login';
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  return (
    <Router>
      <div className="App">
        <Navbar bg="dark" variant="dark" expand="lg">
          <Container>
            <Navbar.Brand href="/">聊天應用</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                {currentUser && (
                  <Nav.Link href="/rooms">聊天室</Nav.Link>
                )}
              </Nav>
              <Nav>
                {currentUser ? (
                  <div className="d-flex align-items-center">
                    <span className="text-light me-3">
                      {currentUser.displayName || currentUser.username}
                    </span>
                    <Button variant="outline-light" size="sm" onClick={handleLogout}>
                      登出
                    </Button>
                  </div>
                ) : (
                  <>
                    <Nav.Link href="/login">登入</Nav.Link>
                    <Nav.Link href="/register">註冊</Nav.Link>
                  </>
                )}
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <Switch>
          <Route path="/login">
            <LoginPage setCurrentUser={setCurrentUser} />
          </Route>
          <Route path="/register" component={RegisterPage} />
          <Route path="/rooms" component={RoomsPage} />
          <Route path="/chat/:roomId" component={ChatPage} />
          <Route path="/">
            {currentUser ? <Redirect to="/rooms" /> : <Redirect to="/login" />}
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;
