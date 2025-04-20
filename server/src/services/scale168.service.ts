import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { Scale } from '../entities/Scale';
import { ScaleOption } from '../entities/ScaleOption';
import { ScaleAnswer } from '../entities/ScaleAnswer';
import { AppDataSource } from '../data-source';
@Service()
export class Scale168Service {
  private scaleRepository: Repository<Scale>;
  private scaleAnswerRepository: Repository<ScaleAnswer>;
  private scaleOptionRepository: Repository<ScaleOption>;
  
  constructor() {   
    this.scaleRepository = AppDataSource.getRepository(Scale);
    this.scaleAnswerRepository = AppDataSource.getRepository(ScaleAnswer);
    this.scaleOptionRepository = AppDataSource.getRepository(ScaleOption);
  }

  /**
   * 获取所有量表题目
   * @returns 量表题目列表
   */
  async getAllScales(): Promise<Scale[]> {
    return this.scaleRepository.find({where: { direction: '168' }, relations: ['options']});
  }

  /**
   * 根据ID获取单个量表题目
   * @param id 量表ID
   * @returns 量表题目信息或null
   */
  async getScaleById(id: number): Promise<Scale | null> {
    return this.scaleRepository.findOne({ where: { id } });
  }

  /**
   * 获取量表题目及其选项
   * @param scaleId 量表ID
   * @returns 包含选项的量表信息
   */
  async getScaleWithOptions(scaleId: number): Promise<{scale: Scale | null, options: ScaleOption[]}> {
    const scale = await this.scaleRepository.findOne({ where: { id: scaleId } });
    const options = await this.scaleOptionRepository.find({ 
      where: { scaleId },
      order: { displayOrder: 'ASC' }
    });
    
    return { scale, options };
  }

  /**
   * 获取用户的量表答案
   * @param userId 用户ID
   * @param scaleId 量表ID，可选
   * @returns 用户的量表答案
   */
  async getUserAnswers(userId: number, scaleId?: number): Promise<ScaleAnswer[]> {
    const query = this.scaleAnswerRepository.createQueryBuilder('answer')
      .where('answer.user_id = :userId', { userId });
    
    if (scaleId) {
      query.andWhere('answer.scale_id = :scaleId', { scaleId });
    }
    
    return query.getMany();
  }

  /**
   * 获取用户的168量表答案（仅direction为168的量表）
   * @param userId 用户ID
   * @param scaleId 量表ID，可选
   * @returns 168方向的量表答案
   */
  async get168Answers(userId: number, scaleId?: number): Promise<ScaleAnswer[]> {
    const query = this.scaleAnswerRepository.createQueryBuilder('answer')
      .innerJoin('scales', 's', 's.id = answer.scale_id AND s.direction = :direction', { direction: '168' })
      .where('answer.user_id = :userId', { userId });
    
    if (scaleId) {
      query.andWhere('answer.scale_id = :scaleId', { scaleId });
    }
    
    return query.getMany();
  }

  /**
   * 提交用户对量表的回答
   * @param userId 用户ID
   * @param scaleId 量表ID
   * @param optionId 选项ID
   * @returns 保存的答案记录
   */
  async submitAnswer(userId: number, scaleId: number, optionId: number): Promise<ScaleAnswer> {
    // 检查量表和选项是否存在
    const scale = await this.scaleRepository.findOne({ where: { id: scaleId } });
    if (!scale) {
      throw new Error('量表不存在');
    }
    
    const option = await this.scaleOptionRepository.findOne({ 
      where: { id: optionId, scaleId } 
    });
    if (!option) {
      throw new Error('选项不存在或不属于该量表');
    }
    
    // 检查用户是否已经回答过这个量表问题
    let answer = await this.scaleAnswerRepository.findOne({
      where: { userId, scaleId }
    });
    
    // 如果存在则更新，不存在则创建
    if (answer) {
      answer.score = option.optionValue;
    } else {
      answer = this.scaleAnswerRepository.create({
        userId,
        scaleId,
        score: option.optionValue
      });
    }
    
    return this.scaleAnswerRepository.save(answer);
  }

  /**
   * 更新用户的量表答案
   * @param answerId 答案ID
   * @param optionId 新的选项ID
   * @returns 更新后的答案记录
   */
  async updateAnswer(answerId: number, optionId: number): Promise<ScaleAnswer> {
    const answer = await this.scaleAnswerRepository.findOne({ where: { id: answerId } });
    if (!answer) {
      throw new Error('答案记录不存在');
    }
    
    const option = await this.scaleOptionRepository.findOne({ 
      where: { id: optionId, scaleId: answer.scaleId } 
    });
    if (!option) {
      throw new Error('选项不存在或不属于该量表');
    }
    
    answer.score = option.optionValue;
    
    return this.scaleAnswerRepository.save(answer);
  }

  /**
   * 删除用户的量表答案
   * @param userId 用户ID
   * @param scaleId 量表ID
   * @returns 操作结果
   */
  async deleteAnswer(userId: number, scaleId: number): Promise<boolean> {
    const result = await this.scaleAnswerRepository.delete({
      userId,
      scaleId
    });
    
    return result.affected ? result.affected > 0 : false;
  }
}
