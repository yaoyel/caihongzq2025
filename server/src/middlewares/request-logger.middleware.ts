import { Context, Next } from 'koa';
import { logger } from '../config/logger';

/**
 * 请求日志中间件
 * 只记录请求的基本信息和耗时，错误和响应信息由其他中间件处理
 */
export async function requestLoggerMiddleware(ctx: Context, next: Next) {
    const start = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    // 记录请求基本信息
    logger.info(`[${requestId}] Request Started`, {
        method: ctx.method,
        url: ctx.url,
        query: ctx.query,
        headers: {
            'user-agent': ctx.headers['user-agent'],
            'content-type': ctx.headers['content-type'],
            'accept': ctx.headers['accept']
        }
    });

    try {
        // 执行后续中间件
        await next();
    } finally {
        // 只记录请求完成时间，不管成功失败
        const ms = Date.now() - start;
        logger.info(`[${requestId}] Request Ended`, {
            method: ctx.method,
            url: ctx.url,
            duration: `${ms}ms`
        });
    }
}
 