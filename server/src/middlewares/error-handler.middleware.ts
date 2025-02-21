import { KoaMiddlewareInterface } from 'routing-controllers';
import { Service } from 'typedi';
import { Context } from 'koa';
import { logger } from '../config/logger';

@Service()
export class ErrorHandlerMiddleware implements KoaMiddlewareInterface {
    async use(ctx: Context, next: (err?: any) => Promise<any>): Promise<any> {
        try {
            await next();
        } catch (error) {
            // 记录错误日志
            logger.error('Request failed', {
                path: ctx.path,
                method: ctx.method,
                params: ctx.params,
                query: ctx.query,
                body: ctx.request.body,
                error: {
                    message: (error as Error).message,
                    stack: (error as Error).stack,
                    name: (error as Error).name,
                    ...((error as Error).cause ? { cause: (error as Error).cause } : {})
                }
            });

            // 重新抛出错误让上层处理
            throw error;
        }
    }
} 