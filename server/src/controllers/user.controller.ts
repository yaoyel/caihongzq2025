import { JsonController, Post, Body, Get, Param, Authorized, Ctx, NotFoundError } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Service } from 'typedi';
import { UserService } from '../services/user.service';

@JsonController('/users')
@Service()
export class UserController {
    constructor(private userService: UserService) {}

    @Post('/login')
    @OpenAPI({ summary: '用户登录' })
    async login(@Body() userData: { code: string }) {
        return await this.userService.login(userData.code);
    }

    @Get('/getById/:id')
    @OpenAPI({ summary: '获取用户信息' })
    async getUser(@Param('id') id: number) {
        return await this.userService.findOne(id);
    }

    @Get('/me')
    @OpenAPI({ summary: '获取用户信息' }) 
    async me(@Ctx() ctx: { state: { user?: { userId: number } } }) {
        try {
            console.log('获取当前用户信息，ctx.state:', ctx.state);
            
            if (!ctx?.state?.user?.userId) {
                console.error('未获取到用户信息，ctx.state:', ctx.state);
                return { code: 401, message: '未获取到用户信息' };
            }
            
            const userId = ctx.state.user.userId;
            console.log('尝试获取用户信息，userId:', userId);
            
            const user = await this.userService.findOne(userId);
            
            if (!user) {
                console.error(`未找到用户，userId: ${userId}`);
                throw new NotFoundError('用户不存在');
            }
            
            console.log('成功获取用户信息:', user);
            return user;
        } catch (error) {
            console.error('获取用户信息失败:', error);
            return { code: 500, message: `获取用户信息失败: ${error instanceof Error ? error.message : '未知错误'}` };
        }
    } 
  
}