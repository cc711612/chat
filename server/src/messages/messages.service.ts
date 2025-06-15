import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { UsersService } from '../users/users.service';
import { RoomsService } from '../rooms/rooms.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private usersService: UsersService,
    private roomsService: RoomsService,
  ) {}

  async findAll(): Promise<Message[]> {
    return this.messagesRepository.find({
      relations: ['user', 'room'],
    });
  }

  async findOne(id: number): Promise<Message | null> {
    return this.messagesRepository.findOne({
      where: { id },
      relations: ['user', 'room'],
    });
  }

  async findByRoomId(
    roomId: number, 
    options?: { 
      limit?: number; 
      before?: Date | string; 
      beforeId?: number;
      excludeSystem?: boolean;
    }
  ): Promise<Message[]> {
    const { limit = 50, before, beforeId, excludeSystem = false } = options || {};
    
    // 記錄參數資訊
    console.log('在 Service 中的參數:', { roomId, limit, before, beforeId, excludeSystem });
    
    // 使用 QueryBuilder 建立查詢
    const queryBuilder = this.messagesRepository.createQueryBuilder('message')
      .leftJoinAndSelect('message.user', 'user')
      .leftJoinAndSelect('message.room', 'room')
      .where('room.id = :roomId', { roomId })
      .orderBy('message.sentAt', 'DESC')
      .take(limit);
    
    // 如果需要排除系統訊息
    if (excludeSystem) {
      queryBuilder.andWhere('message.isSystem = :isSystem', { isSystem: false });
    }
    
    // 優先使用 ID 進行分頁，因為這比日期更精確
    if (beforeId) {
      console.log('使用 ID 進行分頁:', beforeId);
      queryBuilder.andWhere('message.id < :beforeId', { beforeId });
    }
    // 如果沒有 ID 但有日期，則使用日期進行分頁
    else if (before) {
      try {
        const beforeDate = before instanceof Date ? before : new Date(before);
        console.log('轉換後的日期:', beforeDate);
        queryBuilder.andWhere('message.sentAt < :beforeDate', { beforeDate });
      } catch (error) {
        console.error('日期轉換錯誤:', error);
        throw new Error(`日期參數格式錯誤: ${before}`);
      }
    }
    
    // 執行查詢並返回結果
    return queryBuilder.getMany();
  }

  async create(
    content: string,
    userId: number | null,
    roomId: number,
    isSystem: boolean = false,
    sentAt: Date = new Date()
  ): Promise<Message> {
    const room = await this.roomsService.findOne(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const message = this.messagesRepository.create({
      content,
      room,
      isSystem,
      sentAt
    });

    // 只有非系統消息才需要用戶信息
    if (!isSystem && userId !== null) {
      const user = await this.usersService.findOne(userId);
      if (!user) {
        throw new Error('User not found');
      }
      message.user = user;
    }

    return this.messagesRepository.save(message);
  }

  async update(id: number, content: string): Promise<Message | null> {
    await this.messagesRepository.update(id, { content });
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.messagesRepository.delete(id);
  }
}