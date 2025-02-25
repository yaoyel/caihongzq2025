import { Service } from 'typedi';
import { KoaMiddlewareInterface } from 'routing-controllers';
import { Context, Next } from 'koa';
import { logger } from '../config/logger';

@Service()
export class RequestLoggerMiddleware implements KoaMiddlewareInterface {
    async use(ctx: Context, next: Next): Promise<void> {
        const start = Date.now();
        const requestId = Math.random().toString(36).substring(7);

        // 记录请求信息
        logger.info(`[${requestId}] Incoming Request`, {
            method: ctx.method,
            url: ctx.url,
            query: ctx.query,
            body: ctx.request.body,
            headers: ctx.headers,
        });

        try {
            await next();

            // 记录响应信息
            const ms = Date.now() - start;
            logger.info(`[${requestId}] Request Completed`, {
                method: ctx.method,
                url: ctx.url,
                status: ctx.status,
                duration: `${ms}ms`,
                response: ctx.body,
            });
        } catch (error) {
            // 记录错误信息
            const ms = Date.now() - start;
            logger.error(`[${requestId}] Request Failed`, {
                method: ctx.method,
                url: ctx.url,
                status: ctx.status,
                duration: `${ms}ms`,
                error: {
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                },
            });
            throw error;
        }
    }
} 