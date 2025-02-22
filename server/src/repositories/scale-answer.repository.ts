import { Repository } from 'typeorm';
import { ScaleAnswer } from '../entities/ScaleAnswer';
import { Service } from 'typedi';
import { AppDataSource } from '../data-source';

@Service()
export class ScaleAnswerRepository {
  private repository: Repository<ScaleAnswer>;

  constructor() {
    this.repository = AppDataSource.getRepository(ScaleAnswer);
  }

  async findLatestByUserId(userId: number): Promise<ScaleAnswer | null> {
    return this.repository.createQueryBuilder('answer')
      .where('answer.userId = :userId', { userId })
      .orderBy('answer.submittedAt', 'DESC')
      .getOne();
  }

  async findAllByUserIdWithScale(userId: number): Promise<ScaleAnswer[]> {
    return this.repository.createQueryBuilder('answer')
      .leftJoinAndSelect('answer.scale', 'scale')
      .where('answer.userId = :userId', { userId })
      .getMany();
  }
}