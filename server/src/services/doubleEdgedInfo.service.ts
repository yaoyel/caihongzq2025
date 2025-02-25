import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { DoubleEdgedInfo } from '../entities/DoubleEdgedInfo';

@Service()
export class DoubleEdgedInfoService {
    private repository: Repository<DoubleEdgedInfo>;

    constructor() {
        this.repository = AppDataSource.getRepository(DoubleEdgedInfo);
    }

    async findOne(id: number): Promise<DoubleEdgedInfo | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ['likeElement', 'talentElement']
        });
    }

    async findByElementIds(likeElementId: number, talentElementId: number): Promise<DoubleEdgedInfo | null> {
        return await this.repository.findOne({
            where: {
                likeElementId,
                talentElementId
            },
            relations: ['likeElement', 'talentElement']
        });
    }

    async findByLikeElementId(likeElementId: number): Promise<DoubleEdgedInfo[]> {
        return await this.repository.find({
            where: { likeElementId },
            relations: ['likeElement', 'talentElement']
        });
    }

    async findByTalentElementId(talentElementId: number): Promise<DoubleEdgedInfo[]> {
        return await this.repository.find({
            where: { talentElementId },
            relations: ['likeElement', 'talentElement']
        });
    }

    async findAll() {
        return await this.repository.find({
            relations: ['likeElement', 'talentElement']
        });
    }
} 