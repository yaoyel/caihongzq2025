import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { User } from '../entities/User';
import { AppDataSource } from '../data-source';

@Service()
export class UserService {
    private userRepository: Repository<User>;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
    }

    async login(code: string) {
        // 微信登录逻辑
        return { status: 'success' };
    }

    async findOne(id: number) {
        try {
            console.log(`尝试查找用户，id: ${id}`);
            const user = await this.userRepository.findOne({ where: { id } });
            
            if (!user) {
                console.log(`未找到用户，id: ${id}`);
                return null;
            }
            
            console.log(`成功找到用户: ${JSON.stringify(user)}`);
            return user;
        } catch (error) {
            console.error(`查找用户失败，id: ${id}`, error);
            throw error;
        }
    }

    /**
     * 更新用户昵称
     * @param id 用户ID
     * @param nickname 新昵称
     * @returns 更新后的用户信息
     */
    async updateNickname(id: number, nickname: string) {
        try {
            console.log(`尝试更新用户昵称，id: ${id}, nickname: ${nickname}`);
            
            // 检查用户是否存在
            const existingUser = await this.userRepository.findOne({ where: { id } });
            if (!existingUser) {
                console.log(`用户不存在，id: ${id}`);
                return null;
            }

            // 更新用户昵称
            await this.userRepository.update(id, { nickname });
            
            // 返回更新后的用户信息
            const updatedUser = await this.userRepository.findOne({ where: { id } });
            console.log(`成功更新用户昵称: ${JSON.stringify(updatedUser)}`);
            
            return updatedUser;
        } catch (error) {
            console.error(`更新用户昵称失败，id: ${id}`, error);
            throw error;
        }
    }

    /**
     * 查找用户并计算订单和量表答案数量
     * @param id 用户ID
     * @returns 包含统计数据的用户信息
     */
    async findOneWithCounts(id: number) {
        try {
            console.log(`尝试查找用户及统计数据，id: ${id}`);
            
            const user = await this.userRepository
                .createQueryBuilder('user')
                .select('user')
                .addSelect(subQuery => {
                    return subQuery
                        .select('COUNT(orders.id)', 'orderCount')
                        .from('orders', 'orders')
                        .where('orders.openid = user.openid');
                }, 'orderCount')
                .addSelect(subQuery => {
                    return subQuery
                        .select('COUNT(answers.id)', 'scaleAnswerCount')
                        .from('scale_answers', 'answers')
                        .where('answers.userId = user.id and answers.scale_id > 112');
                }, 'scaleAnswerCount')
                .where('user.id = :id', { id })
                .getRawAndEntities();
             
            if (!user.entities[0]) {
                console.log(`未找到用户，id: ${id}`);
                return null;
            }

            // 合并用户数据和统计数据
            const userData = user.entities[0];
            const counts = user.raw[0];
             
            return {
                ...userData,
                orderCount: parseInt(counts.orderCount) || 0,
                scaleAnswerCount: parseInt(counts.scaleAnswerCount) || 0
            };
        } catch (error) {
            console.error(`查找用户及统计数据失败，id: ${id}`, error);
            throw error;
        }
    }

    /**
     * 更新用户选科和分数信息
     */
    async updateProfile(
        id: number,
        updateData: {
            province?: string;
            preferredSubjects?: string;
            secondarySubjects?: string;
            enrollType?: string;
            score?: number;
            rank?: number;
            
        }
    ): Promise<User | null> {
        try {
            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOne({ where: { id } });

            if (!user) {
                return null;
            }

            // 只更新提供的字段
            if (updateData.province !== undefined) {
                user.province = updateData.province;
            }
            if (updateData.preferredSubjects !== undefined) {
                user.preferredSubjects = updateData.preferredSubjects;
            }
            if (updateData.secondarySubjects !== undefined) {
                user.secondarySubjects = updateData.secondarySubjects;
            }
            if (updateData.enrollType !== undefined) {
                user.enrollType = updateData.enrollType;
            }
            if (updateData.score !== undefined) {
                user.score = updateData.score;
            }
            if (updateData.rank !== undefined) {
                user.rank = updateData.rank;
            }

            // 保存更新后的用户信息
            return await userRepository.save(user);
        } catch (error) {
            console.error('更新用户信息失败:', error);
            throw error;
        }
    }
} 