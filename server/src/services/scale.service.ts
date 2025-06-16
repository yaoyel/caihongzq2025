import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { Scale } from '../entities/Scale';
import { ScaleAnswer } from '../entities/ScaleAnswer';
import { AppDataSource } from '../data-source';

/**
 * 用户量表选择结果
 */
export interface UserScaleResult {
  elementId: number;
  scaleId: number;
  score: number;
}

@Service()
export class ScaleService {
    private scaleRepository: Repository<Scale>;
    private answerRepository: Repository<ScaleAnswer>;

    constructor() {
        this.scaleRepository = AppDataSource.getRepository(Scale);
        this.answerRepository = AppDataSource.getRepository(ScaleAnswer);
    }

    /**
     * 获取指定用户和元素列表的量表及答案
     * @param userId - 用户ID
     * @param elementIds - 元素ID列表
     * @returns 包含量表、选项和用户答案的数组
     */
    async getScalesWithAnswers(userId: number, elementIds: number[]) {
        return this.scaleRepository.createQueryBuilder('scale')
            .leftJoinAndSelect('scale.options', 'options')
            .leftJoinAndSelect('scale.answers', 'answers', 'answers.userId = :userId', { userId })
            .where('scale.elementId IN (:...elementIds)', { elementIds })
            .andWhere('scale.direction = :direction', { direction: '168' })
            .orderBy('scale.elementId', 'ASC')
            .addOrderBy('options.displayOrder', 'ASC')
            .getMany();
    }

    /**
     * 获取用户的问卷答案
     * @param userId 用户ID
     * @returns 用户的量表选择结果
     */
    async getUserScales(userId: string): Promise<UserScaleResult[]> {
        const userScales = await this.scaleRepository
            .createQueryBuilder('scale')
            .innerJoin('scale.answers', 'answer', 'answer.userId = :userId', { userId })
            .innerJoin('scale.element', 'element')
            .innerJoin('major_element_analysis', 'analysis', 'analysis.element_id = element.id')
            .select([
                'scale.element.id as elementId',
                'scale.id as scaleId',
                'answer.score as score'
            ])
            .getRawMany();

        return userScales.map(scale => ({
            elementId: scale.elementId,
            scaleId: scale.scaleId,
            score: scale.score
        }));
    }

    async findAll(type?: 'like' | 'talent', direction?: 'positive' | 'negative') {
        const query = this.scaleRepository.createQueryBuilder('scale')
            .leftJoinAndSelect('scale.element', 'element')
            .orderBy('scale.id', 'ASC');

        if (type) {
            query.andWhere('scale.type = :type', { type });
        }
        if (direction) {
            query.andWhere('scale.direction = :direction', { direction });
        }

        return query.getMany();
    }

    async findOne(id: number) {
        return this.scaleRepository.findOne({
            where: { id },
            relations: ['element']
        });
    }

    async submitAnswer(scaleId: number, data: { userId: number; score: number }) {
        const answer = this.answerRepository.create({
            scaleId,
            ...data
        });
        return this.answerRepository.save(answer);
    }

    async getUserAnswers(userId: number) {
        return this.answerRepository.find({
            where: { userId },
            relations: ['scale', 'scale.element']
        });
    }

    async getUserAnswersSummary(userId: number) {
        const answers = await this.answerRepository
            .createQueryBuilder('answer')
            .leftJoinAndSelect('answer.scale', 'scale')
            .leftJoinAndSelect('scale.element', 'element')
            .where('answer.userId = :userId', { userId })
            .getMany();

        const dimensionScores = answers.reduce((acc: any[], answer) => {
            const dimension = answer.scale.element.dimension;
            const score = answer.score;
            
            const existingDimension = acc.find(item => item.dimension === dimension);
            if (existingDimension) {
                existingDimension.total += score;
                existingDimension.count += 1;
            } else {
                acc.push({
                    dimension,
                    total: score,
                    count: 1
                });
            }
            return acc;
        }, []);

        return dimensionScores.map(item => ({
            dimension: item.dimension,
            score: item.total / item.count
        }));
    }

    async findByElements(elementIds: number[]) {
        return this.scaleRepository.createQueryBuilder('scale')
            .leftJoinAndSelect('scale.element', 'element')
            .where('element.id IN (:...elementIds)', { elementIds })
            .orderBy('scale.id', 'ASC')
            .getMany();
    }
}