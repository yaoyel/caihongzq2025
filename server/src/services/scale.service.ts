import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { Scale } from '../entities/Scale';
import { ScaleAnswer } from '../entities/ScaleAnswer';
import { AppDataSource } from '../data-source';

@Service()
export class ScaleService {
    private scaleRepository: Repository<Scale>;
    private answerRepository: Repository<ScaleAnswer>;

    constructor() {
        this.scaleRepository = AppDataSource.getRepository(Scale);
        this.answerRepository = AppDataSource.getRepository(ScaleAnswer);
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
}