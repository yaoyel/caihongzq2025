import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Repository } from 'typeorm';
import { User } from '../entities/User';

@Service()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>
    ) {}

    async login(code: string) {
        // 微信登录逻辑
        return { status: 'success' };
    }

    async findOne(id: number) {
        return this.userRepository.findOne({ where: { id } });
    }
} 