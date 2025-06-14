import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.validateUser(username, password);
    if (!user) {
      return null;
    }
    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('無效的憑證');
    }
    
    // 更新用戶在線狀態
    await this.usersService.updateOnlineStatus(user.id, true);
    
    const tokens = await this.getTokens(user);
    
    // 儲存 refresh token 雜湊到資料庫
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
    
    // 移除敏感資訊
    const { password, refreshToken, ...userWithoutSensitiveInfo } = user;
    
    return {
      user: userWithoutSensitiveInfo,
      ...tokens,
      message: '登入成功',
    };
  }

  async refreshTokens(userId: number, refreshToken: string) {
    console.log('開始處理 refreshTokens:');
    console.log('- userId:', userId);
    console.log('- refreshToken:', refreshToken ? `${refreshToken.substring(0, 10)}...` : '無值');
    
    const user = await this.usersService.findOne(userId);
    
    console.log('- 找到用戶:', user ? '是' : '否');
    console.log('- 用戶有 refreshToken:', user?.refreshToken ? '是' : '否');
    
    if (!user || !user.refreshToken) {
      console.log('- 無效用戶或無 refreshToken');
      throw new UnauthorizedException('拒絕存取');
    }
    
    const isRefreshTokenValid = await this.usersService.compareRefreshToken(
      refreshToken,
      user.refreshToken,
    );
    
    console.log('- refreshToken 驗證結果:', isRefreshTokenValid ? '有效' : '無效');
    
    if (!isRefreshTokenValid) {
      console.log('- refreshToken 無效');
      throw new UnauthorizedException('拒絕存取');
    }
    
    const tokens = await this.getTokens(user);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
    
    return tokens;
  }

  async logout(userId: number) {
    // 清除 refresh token 並更新用戶在線狀態
    await this.usersService.update(userId, { 
      refreshToken: '',
      isOnline: false 
    });
    return { message: '登出成功' };
  }

  async verifyRefreshToken(refreshToken: string) {
    try {
      // 確保 JWT_REFRESH_SECRET 有預設值
      const jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'default_jwt_refresh_secret_for_development';
      
      // 驗證 refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: jwtRefreshSecret,
      });
      
      return payload;
    } catch (error) {
      throw new UnauthorizedException('無效的 refresh token');
    }
  }

  async getTokens(user: User) {
    const payload = { sub: user.id, username: user.username };
    
    // 確保 JWT_SECRET 和 JWT_REFRESH_SECRET 有預設值
    const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'default_jwt_secret_for_development';
    const jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'default_jwt_refresh_secret_for_development';
    
    console.log('JWT_SECRET 是否已設定:', !!this.configService.get<string>('JWT_SECRET'));
    console.log('JWT_REFRESH_SECRET 是否已設定:', !!this.configService.get<string>('JWT_REFRESH_SECRET'));
    
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: this.configService.get('JWT_EXPIRATION', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: jwtRefreshSecret,
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ]);
    
    return {
      accessToken,
      refreshToken,
    };
  }

  async updateRefreshTokenHash(userId: number, refreshToken: string) {
    const hashedRefreshToken = await this.usersService.hashData(refreshToken);
    await this.usersService.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }
}
