import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Room } from './room.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private roomsRepository: Repository<Room>,
    private usersService: UsersService,
    private dataSource: DataSource,
  ) {}

  async findAll(): Promise<Room[]> {
    return this.roomsRepository.find({
      relations: ['users'],
    });
  }

  async findOne(id: number): Promise<Room | null> {
    return this.roomsRepository.findOne({
      where: { id },
      relations: ['users'],
    });
  }

  async create(roomData: Partial<Room>): Promise<Room> {
    const room = this.roomsRepository.create(roomData);
    return this.roomsRepository.save(room);
  }

  async update(id: number, roomData: Partial<Room>): Promise<Room | null> {
    await this.roomsRepository.update(id, roomData);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.roomsRepository.delete(id);
  }

  async addUserToRoom(roomId: number, userId: number): Promise<Room> {
    // 首先檢查用戶是否已在房間中
    const existingRoom = await this.roomsRepository.findOne({
      where: { id: roomId },
      relations: ['users'],
    });

    if (!existingRoom) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    // 如果用戶已在房間中，直接返回房間信息
    if (existingRoom.users && existingRoom.users.some(u => u.id === userId)) {
      return existingRoom;
    }

    // 用戶不在房間中，使用查詢構建器執行更安全的插入
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      const user = await this.usersService.findOne(userId);
      
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      
      // 使用原始SQL查詢檢查關係是否已存在
      const checkRelation = await queryRunner.query(
        `SELECT * FROM room_users_user WHERE roomId = ? AND userId = ?`,
        [roomId, userId]
      );
      
      if (checkRelation.length === 0) {
        // 關係不存在，安全地創建它
        await queryRunner.query(
          `INSERT IGNORE INTO room_users_user (roomId, userId) VALUES (?, ?)`,
          [roomId, userId]
        );
      }
      
      await queryRunner.commitTransaction();
      
      // 返回更新後的房間數據
      return this.findOne(roomId).then(room => {
        if (!room) {
          throw new NotFoundException(`Room with ID ${roomId} not found after update`);
        }
        return room;
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async removeUserFromRoom(roomId: number, userId: number): Promise<Room> {
    const room = await this.findOne(roomId);
    
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    
    room.users = room.users.filter(user => user.id !== userId);
    return this.roomsRepository.save(room);
  }
  
  async getRoomWithMessages(roomId: number): Promise<Room | null> {
    return this.roomsRepository.findOne({
      where: { id: roomId },
      relations: ['messages', 'messages.user', 'users'],
    });
  }
}