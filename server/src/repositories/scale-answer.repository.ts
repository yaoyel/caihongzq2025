import { EntityRepository, Repository } from 'typeorm';
import { ScaleAnswer } from '../entities/ScaleAnswer';
import { Service } from 'typedi';

@Service()
@EntityRepository(ScaleAnswer)
export class ScaleAnswerRepository extends Repository<ScaleAnswer> {
  async findLatestByUserId(userId: number): Promise<ScaleAnswer | null> {
    return this.createQueryBuilder('answer')
      .where('answer.userId = :userId', { userId })
      .orderBy('answer.submittedAt', 'DESC')
      .getOne();
  }

  async findAllByUserIdWithScale(userId: number): Promise<ScaleAnswer[]> {
    return this.createQueryBuilder('answer')
      .leftJoinAndSelect('answer.scale', 'scale')
      .where('answer.userId = :userId', { userId })
      .getMany();
  }
} 