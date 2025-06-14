import { Controller, Post, Body, UseGuards, Get, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard, JwtRefreshGuard } from './guards';
import { User } from '../users/user.entity';
import { GetUser } from './decorators/get-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@GetUser('userId') userId: number) {
    return this.authService.logout(userId);
  }

  @Post('refresh')
  async refreshTokens(@Body() body: { refreshToken: string }) {
    try {
      // 解析 refreshToken
      const decoded = await this.authService.verifyRefreshToken(body.refreshToken);
      const userId = decoded.sub;
      
      // 刷新 token
      return this.authService.refreshTokens(userId, body.refreshToken);
    } catch (error) {
      throw new UnauthorizedException('無效的 refresh token');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@GetUser() user: User) {
    return user;
  }
}
