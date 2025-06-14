import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    userId: number;
    username: string;
    refreshToken?: string;
    [key: string]: any;
  };
}
