import { Context, Next } from 'koa';
import * as fs from 'fs';
import * as path from 'path';
import * as pino from 'pino';

// 创建日志目录
const logDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// 配置日志记录器
const logger = pino.pino({
    level: 'info',
    timestamp: () => `,\"time\":${Date.now()}`,
}, pino.destination(path.join(logDir, 'app.log')));

// 日志中间件
export const loggerMiddleware = async (ctx: Context, next: Next) => {
    const startTime = Date.now();

    try {
        await next();

        const duration = Date.now() - startTime;
        const userId = ctx.state.user?.id || 'anonymous';

        logger.info({
            method: ctx.method,
            url: ctx.url,
            status: ctx.status,
            duration: `${duration}ms`,
            userId: userId,
            ip: ctx.ip,
            userAgent: ctx.get('user-agent'),
            requestBody: ctx.request.body,
            responseBody: ctx.body,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        const duration = Date.now() - startTime;

        logger.error({
            method: ctx.method,
            url: ctx.url,
            status: ctx.status,
            duration: `${duration}ms`,
            error: {
                message: (error as Error).message,
                stack: (error as Error).stack
            },
            userId: ctx.state.user?.id || 'anonymous',
            ip: ctx.ip,
            userAgent: ctx.get('user-agent'),
            requestBody: ctx.request.body,
            timestamp: new Date().toISOString()
        });

        throw error;
    }
};