import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Repository } from 'typeorm';
import { Scale } from '../entities/Scale';
import { ScaleAnswer } from '../entities/ScaleAnswer';

@Service()
export class ScaleService {
    constructor(
        @InjectRepository(Scale)
        private scaleRepository: Repository<Scale>,
        @InjectRepository(ScaleAnswer)
        private answerRepository: Repository<ScaleAnswer>
    ) {}

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
} 