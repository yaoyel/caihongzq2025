import jwt, { SignOptions, Secret, JwtPayload } from 'jsonwebtoken';

// 从环境变量中获取配置，如果没有则使用默认值
const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-secret-key'; 

export class JwtUtil {
    /**
     * 生成JWT token
     * @param payload 需要加密的数据
     * @returns JWT token字符串
     */
    static generateToken(payload: string | object | Buffer): string {
        const options: SignOptions = { expiresIn: 30*24*60*60 };
        return jwt.sign(payload, JWT_SECRET, options);
    }

    /**
     * 验证JWT token
     * @param token JWT token字符串
     * @returns 解密后的数据
     */
    static verifyToken(token: string): any {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            throw new Error('无效的token');
        }
    }

    /**
     * 从Authorization header中提取token
     * @param authHeader Authorization header值
     * @returns JWT token字符串
     */
    static extractTokenFromHeader(authHeader: string): string {
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new Error('无效的Authorization header格式');
        }
        return parts[1];
    }
}