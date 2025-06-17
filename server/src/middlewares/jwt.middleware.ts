import { Context, Next } from 'koa';
import { UnauthorizedError } from 'routing-controllers';
import { Container } from 'typedi';
import { JwtUtil } from '../utils/jwt';
 
export async function jwtMiddleware(ctx: Context, next: Next) {
    try {
        // 排除不需要验证的路由
        const publicPaths = [
            '/api/auth/login',
            '/api/auth/register',
            '/api/auth/wechat-login',
            '/api/health-check',
            '/api/user/login',
            '/api/wechat/qrcode',
            '/api/wechat/callback',
            '/api/wechat/check-login',
           '/ api/wechat/check',
           '/api/chat/stream' ,
           '/MP_verify_s4aW7Fr0j7gMb5cG.txt'
        ];

        if (publicPaths.includes(ctx.path)) {
            return await next();
        }

        const authHeader = ctx.headers.authorization;
        if (!authHeader) {
            throw new UnauthorizedError('未提供认证token');
        }

        try {
            const token = JwtUtil.extractTokenFromHeader(authHeader);
            const payload = JwtUtil.verifyToken(token);
            
            // 将解析后的用户信息添加到上下文中
            ctx.state.user = payload;
            
            await next();
        } catch (error: any) {
            throw new UnauthorizedError(error?.message || '无效的token');
        }
    } catch (error: any) {
        if (ctx.status == 401) {
            ctx.body = {
                code: ctx.status,
                message: error?.message || '认证失败'
            };
        } else {
            ctx.body = {
                code: ctx.status || 500,
                message: error?.message || '服务器内部错误'
            };
        }
        
    }
}