import { Controller, Get, Post, Body, Param, Put, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<User[]> {
    // 移除敏感資訊
    const users = await this.usersService.findAll();
    return users.map(user => {
      const { password, refreshToken, ...result } = user;
      return result as User;
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    const user = await this.usersService.findOne(+id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    // 移除敏感資訊
    const { password, refreshToken, ...result } = user;
    return result as User;
  }

  @Post()
  async create(@Body() userData: Partial<User>): Promise<User> {
    try {
      if (!userData.username) {
        throw new HttpException('Username is required', HttpStatus.BAD_REQUEST);
      }
      
      const existingUser = await this.usersService.findByUsername(userData.username);
      if (existingUser) {
        throw new HttpException('Username already exists', HttpStatus.CONFLICT);
      }
      
      const user = await this.usersService.create(userData);
      // 移除敏感資訊
      const { password, refreshToken, ...result } = user;
      return result as User;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to create user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 移除多餘的 login 方法，因為已經有 AuthController 處理登入

  @Put(':id')
  async update(@Param('id') id: string, @Body() userData: Partial<User>): Promise<User> {
    // Don't allow password updates through this endpoint for security
    if (userData.password) {
      delete userData.password;
    }
    
    const user = await this.usersService.update(+id, userData);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    
    // 移除敏感資訊
    const { password, refreshToken, ...result } = user;
    return result as User;
  }
}