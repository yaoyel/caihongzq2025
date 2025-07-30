import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { EnrollCharters } from '../entities/EnrollCharter';
import { AppDataSource } from '../data-source';

/**
 * 招生章程服务类
 * 提供招生章程相关的数据操作功能
 */
@Service()
export class EnrollCharterService {
  private enrollCharterRepository: Repository<EnrollCharters>;

  constructor() {
    this.enrollCharterRepository = AppDataSource.getRepository(EnrollCharters);
  }

  /**
   * 根据学校代码获取招生章程列表
   * @param schoolCode 学校代码
   * @returns Promise<EnrollCharters[]> 招生章程列表
   */
  async getChartersBySchoolCode(schoolCode: string): Promise<EnrollCharters[]> {
    try {
      const charters = await this.enrollCharterRepository.find({
        where: { code: schoolCode,type: '招生章程' }, 
        select: { 
          code: true,
          year: true,
          type: true,
          title: true,
          content: true 
        },
        order: { 
          year: 'DESC',  // 按年份降序排列，最新的在前
          createdAt: 'DESC'  // 如果年份相同，按创建时间降序
        }
      });
      
      return charters;
    } catch (error) { 
      throw new Error('获取招生章程数据失败');
    }
  }

  /**
   * 根据学校代码和年份获取招生章程
   * @param schoolCode 学校代码
   * @param year 年份
   * @returns Promise<EnrollCharters | null> 招生章程信息
   */
  async getCharterBySchoolCodeAndYear(schoolCode: string, year: number): Promise<EnrollCharters | null> {
    try {
      const charter = await this.enrollCharterRepository.findOne({
        where: { 
          code: schoolCode,
          year: year
        }
      });
      
      return charter;
    } catch (error) {
      console.error('获取指定年份招生章程失败:', error);
      throw new Error('获取招生章程数据失败');
    }
  }

  /**
   * 根据学校代码和类型获取招生章程
   * @param schoolCode 学校代码
   * @param type 章程类型
   * @returns Promise<EnrollCharters[]> 招生章程列表
   */
  async getChartersBySchoolCodeAndType(schoolCode: string, type: string): Promise<EnrollCharters[]> {
    try {
      const charters = await this.enrollCharterRepository.find({
        where: { 
          code: schoolCode,
          type: type
        },
        order: { 
          year: 'DESC',
          createdAt: 'DESC'
        }
      });
      
      return charters;
    } catch (error) {
      console.error('获取指定类型招生章程失败:', error);
      throw new Error('获取招生章程数据失败');
    }
  }

  /**
   * 获取所有招生章程
   * @returns Promise<EnrollCharters[]> 所有招生章程列表
   */
  async getAllCharters(): Promise<EnrollCharters[]> {
    try {
      const charters = await this.enrollCharterRepository.find({
        order: { 
          code: 'ASC',
          year: 'DESC',
          createdAt: 'DESC'
        }
      });
      
      return charters;
    } catch (error) {
      console.error('获取所有招生章程失败:', error);
      throw new Error('获取招生章程数据失败');
    }
  }
} 