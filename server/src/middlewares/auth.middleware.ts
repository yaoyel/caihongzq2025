import { KoaMiddlewareInterface } from 'routing-controllers';
import jwt from 'koa-jwt';
import { config } from 'dotenv';

config();

export const authMiddleware = jwt({
  secret: process.env.JWT_SECRET || 'your-secret-key'
}); 