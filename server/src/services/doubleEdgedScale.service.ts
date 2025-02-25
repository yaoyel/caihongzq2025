import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { DoubleEdgedScale } from '../entities/DoubleEdgedScale';
import { DoubleEdgedAnswer } from '../entities/DoubleEdgedAnswer';

interface AnswerData {
  userId: number;
  scaleId: number;
  score: number;
  doubleEdgedId: number;
}

@Service()
export class DoubleEdgedScaleService {
    private repository: Repository<DoubleEdgedScale>;
    private answerRepository: Repository<DoubleEdgedAnswer>;

    constructor() {
        this.repository = AppDataSource.getRepository(DoubleEdgedScale);
        this.answerRepository = AppDataSource.getRepository(DoubleEdgedAnswer);
    }

    async findByDoubleEdgedId(doubleEdgedId: number): Promise<DoubleEdgedScale[]> {
        return await this.repository.find({
            where: { doubleEdgedId },
            relations: ['doubleEdged']
        });
    }

    async saveAnswers(answers: AnswerData[]): Promise<DoubleEdgedAnswer[]> {
        const savedAnswers = await Promise.all(
            answers.map(async (answer) => {
                const newAnswer = this.answerRepository.create({
                    userId: answer.userId,
                    scaleId: answer.scaleId,
                    score: answer.score,
                    doubleEdgedId: answer.doubleEdgedId
                });
                return await this.answerRepository.save(newAnswer);
            })
        );
        return savedAnswers;
    }
} 