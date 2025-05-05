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

  async findByRoomId(roomId: number): Promise<Message[]> {
    return this.messagesRepository.find({
      where: { room: { id: roomId } },
      relations: ['user', 'room'],
      order: { sentAt: 'ASC' },
    });
  }

  async create(
    content: string,
    userId: number | null,
    roomId: number,
    isSystem: boolean = false
  ): Promise<Message> {
    const room = await this.roomsService.findOne(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const message = this.messagesRepository.create({
      content,
      room,
      isSystem
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