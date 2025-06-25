import { JsonController, Post, Body, Get, Param, Authorized, Ctx, NotFoundError, Put } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Service } from 'typedi';
import { UserService } from '../services/user.service';
import { UserViewModel } from '../view-models/user.view.model';

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
    @OpenAPI({ summary: '获取当前用户信息' }) 
    async me(@Ctx() ctx: { state: { user?: { userId: number } } }): Promise<UserViewModel | { code: number, message: string }> {
        try {
    
            if (!ctx?.state?.user?.userId) {
                console.error('未获取到用户信息，ctx.state:', ctx.state);
                return { code: 401, message: '未获取到用户信息' };
            }
            
            const userId = ctx.state.user.userId;
            console.log('尝试获取用户信息，userId:', userId);
            
            const user = await this.userService.findOneWithCounts(userId);
            
            if (!user) {
                console.error(`未找到用户，userId: ${userId}`);
                throw new NotFoundError('用户不存在');
            }
            
            // 转换为视图模型
            const userViewModel: UserViewModel = {
                id: user.id,
                openid: user.openid,
                nickname: user.nickname,
                avatarUrl: user.avatarUrl,
                provinceId: user.provinceId,
                score: user.score,
                preferredSubjects: user.preferredSubjects,
                secondarySubjects: user.secondarySubjects,
                enrollType: user.enrollType,
                userType: user.userType,
                age: user.age,
                gender: user.gender,
                orderCount: user.orderCount,
                scaleAnswerCount: user.scaleAnswerCount
            };
             
            return userViewModel;
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

    /**
     * 更新用户选科和分数信息
     */
    @Put('/:id/profile')
    @OpenAPI({ summary: '更新用户选科和分数信息' })
    async updateProfile(
        @Param('id') id: number,
        @Body() updateData: {
            provinceId?: number;
            preferredSubjects?: string;
            secondarySubjects?: string;
            enrollType?: string;
            score?: number;
            rank?: number;
        }
    ) {
        try { 
            // 验证省份ID
            if (updateData.provinceId && (updateData.provinceId < 11 || updateData.provinceId > 65)) {
                 throw new Error('无效的省份ID');
            }

            // 验证首选科目
            if (updateData.preferredSubjects && !['物理', '历史', '综合','文科','理科'].includes(updateData.preferredSubjects)) {
                throw new Error('无效的首选科目');
            }

            // 验证次选科目（可以是多个，用逗号分隔）
            if (updateData.secondarySubjects && updateData.preferredSubjects !=="文科" && updateData.preferredSubjects !=="理科") {
                const validSecondarySubjects = ['物理', '化学', '生物', '政治', '历史', '地理','技术'];
                const subjects = updateData.secondarySubjects.split(',').map(s => s.trim());
                const isValid = subjects.every(s => validSecondarySubjects.includes(s));
                if (!isValid) {
                   throw new Error('无效的次选科目');
                }

                // 验证物理和历史的互斥关系
                if (updateData.preferredSubjects === '物理' && subjects.includes('历史')) {
                    throw new Error('首选科目为物理时，次选科目不能包含历史');
                }
                if (updateData.preferredSubjects === '历史' && subjects.includes('物理')) {
                    throw new Error('首选科目为历史时，次选科目不能包含物理');
                }
            } 

            // 验证分数范围
            if (updateData.score !== undefined && (updateData.score < 0 || updateData.score > 750)) {
                throw new Error('无效的分数范围');
            }

            // 验证排名范围
            if (updateData.rank !== undefined && (updateData.rank < 0)) {
                throw new Error('无效的位次范围');
            }

            const updatedUser = await this.userService.updateProfile(id, updateData);

            if (!updatedUser) {
                throw new Error('用户不存在');
            }
 
            return  updatedUser ;
        } catch (error) {
            throw new Error(`更新用户信息失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
}