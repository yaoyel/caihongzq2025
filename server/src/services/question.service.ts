import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { Question } from '../entities/Question';
import { QuestionAnswer } from '../entities/QuestionAnswer';
import { AppDataSource } from '../data-source';

type AgeRange = '4-8' | '9-14' | '14+';

@Service()
export class QuestionService {
    private questionRepository: Repository<Question>;
    private answerRepository: Repository<QuestionAnswer>;

    constructor() {
        this.questionRepository = AppDataSource.getRepository(Question);
        this.answerRepository = AppDataSource.getRepository(QuestionAnswer);
    }

    async findByAgeRange(ageRange: AgeRange) {
        return this.questionRepository.find({
            where: { ageRange },
            order: { id: 'ASC' }
        });
    }

    async getUserAnswers(userId: number, ageRange?: string) {
        const query = this.answerRepository.createQueryBuilder('answer')
            .leftJoinAndSelect('answer.question', 'question')
            .where('answer.userId = :userId', { userId });

        if (ageRange) {
            query.andWhere('question.ageRange = :ageRange', { ageRange });
        }

        return query.orderBy('answer.submittedAt', 'DESC').getMany();
    }

    async getUserAnswerSummary(userId: number, ageRange: AgeRange) {
        const [answers, total] = await Promise.all([
            this.getUserAnswers(userId, ageRange),
            this.questionRepository.count({ where: { ageRange } })
        ]);

        return {
            total,
            completed: answers.length,
            answers: answers.map(answer => ({
                questionId: answer.questionId,
                content: answer.content,
                submittedAt: answer.submittedAt
            }))
        };
    }

    async submitAnswer(questionId: number, data: { userId: number; content: string; submittedBy: string }) {
        let answer = await this.answerRepository.findOne({
            where: { questionId, userId: data.userId }
        });

        if (answer) {
            answer.content = data.content;
            answer.lastModifiedAt = new Date();
        } else {
            answer = this.answerRepository.create({
                questionId,
                ...data
            });
        }

        return this.answerRepository.save(answer);
    }

    async updateAnswer(id: number, content: string) {
        const answer = await this.answerRepository.findOne({
            where: { id },
            relations: ['question']
        });

        if (!answer) {
            throw new Error('答案不存在');
        }

        answer.content = content;
        answer.lastModifiedAt = new Date();

        return this.answerRepository.save(answer);
    }
} 