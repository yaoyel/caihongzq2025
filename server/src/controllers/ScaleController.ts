import { JsonController, Get, Post, Body, Param, QueryParam } from 'routing-controllers';
import { AppDataSource } from '../data-source';
import { Scale } from '../entity/Scale';
import { ScaleAnswer } from '../entity/ScaleAnswer';

@JsonController('/scales')
export class ScaleController {
  private scaleRepository = AppDataSource.getRepository(Scale);
  private answerRepository = AppDataSource.getRepository(ScaleAnswer);

  @Get()
  async getAll(
    @QueryParam('type') type?: 'like' | 'talent',
    @QueryParam('direction') direction?: 'positive' | 'negative'
  ) {
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

  @Get('/:id')
  async getOne(@Param('id') id: number) {
    return this.scaleRepository.findOne({ 
      where: { id },
      relations: ['element']
    });
  }

  @Post('/:id/answers')
  async submitAnswer(
    @Param('id') scaleId: number,
    @Body() data: { userId: number; score: number }
  ) {
    const answer = this.answerRepository.create({
      scaleId,
      ...data
    });
    return this.answerRepository.save(answer);
  }

  @Get('/answers/user/:userId')
  async getUserAnswers(@Param('userId') userId: number) {
    return this.answerRepository.find({
      where: { userId },
      relations: ['scale', 'scale.element']
    });
  }
} 