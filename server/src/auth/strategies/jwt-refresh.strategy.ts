import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('JWT_REFRESH_SECRET') || 'default_jwt_refresh_secret_for_development';
    console.log('JWT_REFRESH_SECRET:', secret ? '已設定' : '未設定');
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const authHeader = req.headers.authorization || '';
    const refreshToken = authHeader.replace('Bearer ', '').trim();
    
    console.log('JWT Refresh 驗證：');
    console.log('- 收到的 Authorization 標頭:', authHeader ? '有值' : '無值');
    console.log('- 提取的 refreshToken:', refreshToken ? `${refreshToken.substring(0, 10)}...` : '無值');
    console.log('- 解析的 payload:', payload);
    
    return { userId: payload.sub, username: payload.username, refreshToken };
  }
}
