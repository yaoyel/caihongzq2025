import { KoaMiddlewareInterface } from 'routing-controllers';
import { Service } from 'typedi';
import { Context } from 'koa';
import { logger } from '../config/logger';

@Service()
export class RequestLoggerMiddleware implements KoaMiddlewareInterface {
    async use(ctx: Context, next: (err?: any) => Promise<any>): Promise<any> {
        const start = Date.now();
        
        // 记录请求开始
        logger.info('Request started', {
            path: ctx.path,
            method: ctx.method,
            params: ctx.params,
            query: ctx.query,
            body: ctx.request.body
        });

        await next();

        // 记录请求完成
        const ms = Date.now() - start;
        logger.info('Request completed', {
            path: ctx.path,
            method: ctx.method,
            status: ctx.status,
            duration: `${ms}ms`
        });
    }
} 