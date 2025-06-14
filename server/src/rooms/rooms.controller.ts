import { Controller, Get, Post, Put, Delete, Body, Param, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards';
import { RoomsService } from './rooms.service';
import { Room } from './room.entity';
import { User } from '../users/user.entity';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  async findAll(): Promise<Room[]> {
    // 直接返回結果，轉換攝截器會自動處理敏感資訊
    return this.roomsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Room> {
    const room = await this.roomsService.findOne(+id);
    if (!room) {
      throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
    }
    
    // 直接返回結果，轉換攝截器會自動處理敏感資訊
    return room;
  }

  @Post()
  async create(@Body() roomData: Partial<Room>): Promise<Room> {
    try {
      return await this.roomsService.create(roomData);
    } catch (error) {
      throw new HttpException('Failed to create room', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() roomData: Partial<Room>): Promise<Room> {
    try {
      const room = await this.roomsService.update(+id, roomData);
      if (!room) {
        throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
      }
      return room;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to update room', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    try {
      const room = await this.roomsService.findOne(+id);
      if (!room) {
        throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
      }
      await this.roomsService.delete(+id);
      return { message: 'Room deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to delete room', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':id/users/:userId')
  async addUserToRoom(
    @Param('id') roomId: string,
    @Param('userId') userId: string,
  ): Promise<Room> {
    try {
      return await this.roomsService.addUserToRoom(+roomId, +userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to add user to room',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id/users/:userId')
  async removeUserFromRoom(
    @Param('id') roomId: string,
    @Param('userId') userId: string,
  ): Promise<Room> {
    try {
      return await this.roomsService.removeUserFromRoom(+roomId, +userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to remove user from room',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id/messages')
  async getRoomWithMessages(@Param('id') id: string): Promise<Room> {
    try {
      const room = await this.roomsService.getRoomWithMessages(+id);
      if (!room) {
        throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
      }
      return room;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to get room messages', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}