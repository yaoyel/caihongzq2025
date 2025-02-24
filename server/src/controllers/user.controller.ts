import { JsonController, Post, Body, Get, Param, Authorized, Ctx } from 'routing-controllers';
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
        if (!ctx?.state?.user?.userId) {
            throw new Error('未获取到用户信息');
        }
        const userId = ctx.state.user.userId;
        return await this.userService.findOne(userId);
    } 
  
}