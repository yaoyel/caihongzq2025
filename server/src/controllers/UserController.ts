import { JsonController, Post, Body, Get, Param } from 'routing-controllers';
import { User } from '../entity/User';
import { AppDataSource } from '../data-source';

@JsonController('/users')
export class UserController {
  private userRepository = AppDataSource.getRepository(User);

  @Post('/login')
  async login(@Body() userData: { code: string }) {
    // 微信登录逻辑
    return { status: 'success' };
  }

  @Get('/:id')
  async getUser(@Param('id') id: number) {
    return this.userRepository.findOne({ where: { id } });
  }
} 