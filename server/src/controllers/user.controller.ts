import { JsonController, Post, Body, Get, Param, Authorized, Ctx, NotFoundError, Put } from 'routing-controllers';
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

    @Put('/updateNickname/:id')
    @OpenAPI({ summary: '更新用户昵称' })
    async updateNickname(
        @Param('id') id: number, 
        @Body() updateData: { nickname: string }
    ) {
        try {
            console.log(`尝试更新用户昵称，id: ${id}, nickname: ${updateData.nickname}`);
            
            // 验证昵称不能为空
            if (!updateData.nickname || updateData.nickname.trim() === '') {
                return { code: 400, message: '昵称不能为空' };
            }

            // 验证昵称长度
            if (updateData.nickname.length > 50) {
                return { code: 400, message: '昵称长度不能超过50个字符' };
            }

            const updatedUser = await this.userService.updateNickname(id, updateData.nickname.trim());
            
            if (!updatedUser) {
                return { code: 404, message: '用户不存在' };
            }
            
            console.log('成功更新用户昵称:', updatedUser);
            return { 
                code: 200, 
                message: '昵称更新成功', 
                data: updatedUser 
            };
        } catch (error) {
            console.error('更新用户昵称失败:', error);
            return { 
                code: 500, 
                message: `更新用户昵称失败: ${error instanceof Error ? error.message : '未知错误'}` 
            };
        }
    }
  
}