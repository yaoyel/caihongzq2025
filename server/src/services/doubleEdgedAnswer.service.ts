import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { DoubleEdgedAnswer } from '../entities/DoubleEdgedAnswer';
import { CreateDoubleEdgedAnswerDto, UpdateDoubleEdgedAnswerDto } from '../dtos/DoubleEdgedAnswerDto';
import { AppDataSource } from '../data-source';

@Service()
export class DoubleEdgedAnswerService {
  private doubleEdgedAnswerRepository: Repository<DoubleEdgedAnswer>;

  constructor() {
    this.doubleEdgedAnswerRepository = AppDataSource.getRepository(DoubleEdgedAnswer);
  }

  async create(createDto: CreateDoubleEdgedAnswerDto): Promise<DoubleEdgedAnswer> {
    const answer = this.doubleEdgedAnswerRepository.create(createDto);
    return await this.doubleEdgedAnswerRepository.save(answer);
  }

  async findAll(): Promise<DoubleEdgedAnswer[]> {
    return await this.doubleEdgedAnswerRepository.find({
      relations: ['scale', 'user']
    });
  }

  async findOne(id: number): Promise<DoubleEdgedAnswer | null> {
    return await this.doubleEdgedAnswerRepository.findOne({
      where: { id },
      relations: ['scale', 'user']
    });
  }

  async findByUserId(userId: number): Promise<DoubleEdgedAnswer[]> {
    return await this.doubleEdgedAnswerRepository.find({
      where: { userId },
      relations: ['scale']
    });
  }

  async update(id: number, updateDto: UpdateDoubleEdgedAnswerDto): Promise<DoubleEdgedAnswer | null> {
    await this.doubleEdgedAnswerRepository.update(id, updateDto);
    return await this.doubleEdgedAnswerRepository.findOne({
      where: { id },
      relations: ['scale', 'user']
    });
  }

  async remove(id: number): Promise<void> {
    await this.doubleEdgedAnswerRepository.delete(id);
  }

  async findByDoubleEdgedIdAndUserId(doubleEdgedId: number, userId: number): Promise<DoubleEdgedAnswer[]> {
    return await this.doubleEdgedAnswerRepository.find({
      where: {
        doubleEdgedId,
        userId
      },
      relations: ['scale']
    });
  }
}