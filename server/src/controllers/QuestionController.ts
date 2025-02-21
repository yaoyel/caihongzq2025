import { JsonController, Get, Post, Put, Body, Param, QueryParam } from 'routing-controllers';
import { AppDataSource } from '../data-source';
import { Question } from '../entity/Question';
import { QuestionAnswer } from '../entity/QuestionAnswer';

@JsonController('/questions')
export class QuestionController {
  private questionRepository = AppDataSource.getRepository(Question);
  private answerRepository = AppDataSource.getRepository(QuestionAnswer);

  @Get()
  async getAll(@QueryParam('ageRange') ageRange: '4-8' | '9-14' | '14+') {
    if (!ageRange) {
      throw new Error('必须指定年龄段');
    }

    return this.questionRepository.find({
      where: { ageRange },
      order: { id: 'ASC' }
    });
  }

  @Get('/answers/user/:userId')
  async getUserAnswers(
    @Param('userId') userId: number,
    @QueryParam('ageRange') ageRange?: '4-8' | '9-14' | '14+'
  ) {
    const query = this.answerRepository.createQueryBuilder('answer')
      .leftJoinAndSelect('answer.question', 'question')
      .where('answer.userId = :userId', { userId });

    if (ageRange) {
      query.andWhere('question.ageRange = :ageRange', { ageRange });
    }

    return query.orderBy('answer.submittedAt', 'DESC').getMany();
  }

  @Get('/answers/user/:userId/summary')
  async getUserAnswerSummary(
    @Param('userId') userId: number,
    @QueryParam('ageRange') ageRange: '4-8' | '9-14' | '14+'
  ) {
    if (!ageRange) {
      throw new Error('必须指定年龄段');
    }

    const [answers, total] = await Promise.all([
      this.answerRepository.createQueryBuilder('answer')
        .leftJoinAndSelect('answer.question', 'question')
        .where('answer.userId = :userId', { userId })
        .andWhere('question.ageRange = :ageRange', { ageRange })
        .orderBy('answer.submittedAt', 'DESC')
        .getMany(),
      this.questionRepository.count({
        where: { ageRange }
      })
    ]);

    return {
      total,
      completed: answers.length,
      answers: answers.map(answer => ({
        questionId: answer.questionId,
        content: answer.content.substring(0, 50) + (answer.content.length > 50 ? '...' : ''),
        submittedAt: answer.submittedAt
      }))
    };
  }

  @Post('/:id/answers')
  async submitAnswer(
    @Param('id') questionId: number,
    @Body() data: { userId: number; content: string; submittedBy: string }
  ) {
    // 检查问题是否存在
    const question = await this.questionRepository.findOne({
      where: { id: questionId }
    });

    if (!question) {
      throw new Error('问题不存在');
    }

    // 检查是否已有答案
    let answer = await this.answerRepository.findOne({
      where: {
        questionId,
        userId: data.userId
      }
    });

    if (answer) {
      // 更新现有答案
      answer.content = data.content;
      answer.lastModifiedAt = new Date();
    } else {
      // 创建新答案
      answer = this.answerRepository.create({
        questionId,
        ...data
      });
    }

    return this.answerRepository.save(answer);
  }

  @Put('/answers/:id')
  async updateAnswer(
    @Param('id') id: number,
    @Body() data: { content: string }
  ) {
    const answer = await this.answerRepository.findOne({
      where: { id },
      relations: ['question']
    });

    if (!answer) {
      throw new Error('答案不存在');
    }

    answer.content = data.content;
    answer.lastModifiedAt = new Date();

    return this.answerRepository.save(answer);
  }
} 