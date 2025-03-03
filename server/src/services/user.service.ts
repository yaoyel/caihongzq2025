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
} 