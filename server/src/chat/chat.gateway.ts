import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  OnGatewayConnection, 
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from '../messages/messages.service';
import { UsersService } from '../users/users.service';
import { RoomsService } from '../rooms/rooms.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // 在生產環境應該設定為特定來源
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger('ChatGateway');
  private userSocketMap = new Map<number, string>(); // userId -> socketId
  private socketUserMap = new Map<string, number>(); // socketId -> userId

  @WebSocketServer()
  server: Server;

  constructor(
    private messagesService: MessagesService,
    private usersService: UsersService,
    private roomsService: RoomsService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // 用戶登出
    const userId = this.socketUserMap.get(client.id);
    if (userId) {
      await this.handleUserLogout(userId, client);
    }
  }

  @SubscribeMessage('login')
  async handleLogin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number }
  ) {
    try {
      const { userId } = data;
      const user = await this.usersService.findOne(userId);
      
      if (!user) {
        return { success: false, message: 'User not found' };
      }
      // 更新用戶的在線狀態
      await this.usersService.updateOnlineStatus(userId, true);
      
      // 儲存用戶和 socket 的關聯
      this.userSocketMap.set(userId, client.id);
      this.socketUserMap.set(client.id, userId);
      
      // 通知所有客戶端用戶上線
      this.server.emit('userStatus', { userId, isOnline: true });
      
      return { 
        success: true, 
        user: { id: user.id, username: user.username, displayName: user.displayName },
        message: 'Login successful' 
      };
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`);
      return { success: false, message: 'Login failed' };
    }
  }

  @SubscribeMessage('logout')
  async handleUserLogout(
    userId: number,
    @ConnectedSocket() client: Socket
  ) {
    try {
      // 更新用戶的在線狀態
      await this.usersService.updateOnlineStatus(userId, false);
      
      // 移除用戶和 socket 的關聯
      this.userSocketMap.delete(userId);
      this.socketUserMap.delete(client.id);
      
      // 通知所有客戶端用戶下線
      this.server.emit('userStatus', { userId, isOnline: false });
      
      return { success: true, message: 'Logout successful' };
    } catch (error) {
      this.logger.error(`Logout error: ${error.message}`);
      return { success: false, message: 'Logout failed' };
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number; roomId: number }
  ) {
    try {
      const { userId, roomId } = data;
      this.logger.log(`User ${userId} attempting to join room ${roomId}`);
      
      // 將用戶加入房間
      const room = await this.roomsService.addUserToRoom(roomId, userId);
      
      // Socket.io 的房間機制
      const roomName = `room-${roomId}`;
      client.join(roomName);
      
      // 取得房間的歷史訊息
      const messages = await this.messagesService.findByRoomId(roomId);
      
      // 獲取用戶資訊
      const user = room.users.find(u => u.id === userId);
      
      // 通知房間內其他用戶有新成員加入
      client.to(roomName).emit('userJoined', {
        userId,
        roomId,
        user
      });
      
      // 確保 user 不為 undefined
      const userDisplayName = user ? (user.username || user.displayName) : '未知用戶';

      // 創建一條系統消息，通知所有人有新用戶加入
      const systemMessage = await this.messagesService.create(
        `${userDisplayName} 已加入聊天室`,
        null, // 系統消息沒有用戶ID
        roomId,
        true // 標記為系統消息
      );
      
      // 廣播系統消息給房間內所有用戶
      this.server.to(roomName).emit('newMessage', systemMessage);
      
      this.logger.log(`User ${userId} successfully joined room ${roomId}`);
      return { 
        success: true, 
        roomId, 
        messages,
        users: room.users
      };
    } catch (error) {
      this.logger.error(`Join room error for user ${data?.userId} room ${data?.roomId}: ${error.message}`);
      return { success: false, message: `Failed to join room: ${error.message}` };
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number; roomId: number }
  ) {
    try {
      const { userId, roomId } = data;
      
      // 獲取用戶信息，用於在系統消息中顯示用戶名
      const user = await this.usersService.findOne(userId);
      
      // 將用戶從房間移除
      await this.roomsService.removeUserFromRoom(roomId, userId);
      
      // Socket.io 的房間機制
      const roomName = `room-${roomId}`;
      client.leave(roomName);
      
      // 通知房間內其他用戶有成員離開
      this.server.to(roomName).emit('userLeft', { userId, roomId });
      
      // 創建一條系統消息，通知所有人有用戶離開
      if (user) {
        const systemMessage = await this.messagesService.create(
          `${user.username || user.displayName} 已離開聊天室`,
          null, // 系統消息沒有用戶ID
          roomId,
          true // 標記為系統消息
        );
        
        // 廣播系統消息給房間內所有用戶
        this.server.to(roomName).emit('newMessage', systemMessage);
      }
      
      return { success: true, message: 'Left room successfully' };
    } catch (error) {
      this.logger.error(`Leave room error: ${error.message}`);
      return { success: false, message: 'Failed to leave room' };
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { content: string; userId: number; roomId: number }
  ) {
    try {
      const { content, userId, roomId } = data;
      this.logger.log(`User ${userId} sending message to room ${roomId}: ${content.substring(0, 30)}...`);
      
      // 創建新訊息並儲存到資料庫
      const message = await this.messagesService.create(content, userId, roomId);
      
      // 廣播訊息給房間內所有用戶 (使用 server.to 而非 client.to 確保發送者也能收到)
      const roomName = `room-${roomId}`;
      this.server.to(roomName).emit('newMessage', message);
      this.logger.log(`Message broadcasted to room ${roomId}`);
      
      // 傳回給發送者
      return { success: true, message };
    } catch (error) {
      this.logger.error(`Send message error: ${error.message}`);
      return { success: false, message: 'Failed to send message' };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number; roomId: number; isTyping: boolean }
  ) {
    const { userId, roomId, isTyping } = data;
    const roomName = `room-${roomId}`;
    
    // 通知房間內的其他用戶有人正在輸入
    client.to(roomName).emit('typing', { userId, isTyping });
    
    return { success: true };
  }
}