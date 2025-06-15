import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards';
import { MessagesService } from './messages.service';
import { Message } from './message.entity';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  async findAll(): Promise<Message[]> {
    return this.messagesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Message> {
    const message = await this.messagesService.findOne(+id);
    if (!message) {
      throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
    }
    return message;
  }

  @Get('room/:roomId')
  async findByRoomId(
    @Param('roomId') roomId: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
    @Query('beforeId') beforeId?: string,
    @Query('excludeSystem') excludeSystem?: string,
  ): Promise<Message[]> {
    try {
      console.log('查詢參數:', { roomId, limit, before, beforeId, excludeSystem });
      
      // 轉換參數
      const options = {
        limit: limit ? +limit : 50,
        before: before ? new Date(before) : undefined,
        beforeId: beforeId ? +beforeId : undefined,
        excludeSystem: excludeSystem === 'true',
      };
      
      console.log('轉換後的參數:', options);
      
      return await this.messagesService.findByRoomId(+roomId, options);
    } catch (error) {
      console.error('獲取聊天室訊息失敗:', error);
      throw new HttpException(`Failed to get room messages: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  async create(
    @Body() messageData: { content: string; userId: number; roomId: number },
  ): Promise<Message> {
    try {
      return await this.messagesService.create(
        messageData.content,
        messageData.userId,
        messageData.roomId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create message',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() messageData: { content: string },
  ): Promise<Message> {
    try {
      const message = await this.messagesService.update(+id, messageData.content);
      if (!message) {
        throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
      }
      return message;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to update message', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    try {
      const message = await this.messagesService.findOne(+id);
      if (!message) {
        throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
      }
      await this.messagesService.delete(+id);
      return { message: 'Message deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to delete message', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}