import { Controller, Get, Post, Body, Param, Put, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<User[]> {
    // Omit password from response
    const users = await this.usersService.findAll();
    return users.map(user => {
      const { password, ...result } = user;
      return result as User;
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    const user = await this.usersService.findOne(+id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    // Omit password from response
    const { password, ...result } = user;
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
      // Omit password from response
      const { password, ...result } = user;
      return result as User;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to create user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('login')
  async login(@Body() loginData: { username: string; password: string }): Promise<any> {
    const user = await this.usersService.validateUser(
      loginData.username,
      loginData.password,
    );
    
    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    
    // Update online status
    await this.usersService.updateOnlineStatus(user.id, true);
    
    return {
      user,
      message: 'Login successful',
    };
  }

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
    
    // Omit password from response
    const { password, ...result } = user;
    return result as User;
  }
}