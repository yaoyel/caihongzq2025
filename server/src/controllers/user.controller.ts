import { JsonController, Post, Body, Get, Param, Authorized } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Service } from 'typedi';
import { UserService } from '../services/user.service';
import { logger } from '../config/logger';

@JsonController('/users')
@Service()
export class UserController {
    constructor(private userService: UserService) {}

    @Post('/login')
    @OpenAPI({ summary: '用户登录' })
    async login(@Body() userData: { code: string }) {
        try {
            return await this.userService.login(userData.code);
        } catch (error) {
            logger.error({ userData, error }, 'Failed to login');
            throw error;
        }
    }

    @Get('/:id')
    @Authorized()
    @OpenAPI({ summary: '获取用户信息' })
    async getUser(@Param('id') id: number) {
        try {
            return await this.userService.findOne(id);
        } catch (error) {
            logger.error({ id, error }, 'Failed to get user');
            throw error;
        }
    }
} 