import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 自定義裝飾器，用於從請求中提取使用者資訊
 * 使用方式：
 * @GetUser() user: User - 獲取整個使用者物件
 * @GetUser('userId') userId: number - 獲取使用者的特定屬性
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    // 如果沒有指定屬性名稱，返回整個使用者物件
    if (!data) {
      return request.user;
    }
    
    // 返回使用者物件的特定屬性
    return request.user[data];
  },
);
