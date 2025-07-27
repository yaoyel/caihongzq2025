import { GAOKAO_SUBJECT_CONFIG } from '../config/gaokao-subjects';
import { Get, JsonController, Post, Body } from 'routing-controllers';
import { Service } from 'typedi';
import RedisModule from '../redis/redis.module';
import { MajorRedisService } from '../services/major.redis.service';

/**
 * 配置控制器类
 */
@JsonController("/config")
@Service()
export class ConfigController {
  private majorRedisService: MajorRedisService;

  constructor() {
    this.majorRedisService = new MajorRedisService();
  }

  /**
   * 获取高考科目配置信息
   * @returns 返回所有省份的高考科目配置信息
   */
  @Get("/gaokao")
  async getGaoKaoConfig() {
    try {
      return GAOKAO_SUBJECT_CONFIG;
    } catch (error) {
      throw new Error('获取高考配置信息失败');
    }
  }

  /**
   * 获取科目组合
   * @param firstSubject 首选科目
   * @param secondSubjects 次选科目数组
   * @returns 返回所有可能的科目组合
   */
  @Post("/subject-combinations")
  async getSubjectCombinations(
    @Body() body: {
      key: string;
      firstSubject: string;
      secondSubjects?: string[];
    }
  ) {
    try {
      const { key,firstSubject, secondSubjects = [] } = body;
      
      // 调用 RedisModule 的方法获取所有可能的组合
      const combinations =  RedisModule.getMatchingPatterns(key,firstSubject, secondSubjects);
      
      return {
        success: true,
        data: {
          firstSubject,
          secondSubjects,
          combinations
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: '获取科目组合失败',
        message: error?.message || '未知错误'
      };
    }
  }

  /**
   * 获取招生计划数据
   * @param body 请求体参数
   * @returns 返回匹配的招生计划数据
   */
  @Post("/enroll-plans")
  async getEnrollPlans(
    @Body() body: {
      majorCode: string;
      province: string;
      year: number;
      batch: string;
      enrollType: string;
      preferredSubjects: string;
      secondarySubjects: string[];
    }
  ) {
    try {
      const {
        majorCode,
        province,
        year,
        batch,
        enrollType,
        preferredSubjects,
        secondarySubjects
      } = body;

      // 参数验证
      if (!majorCode || !province || !year || !batch || !enrollType || !preferredSubjects) {
        return {
          success: false,
          error: '参数不完整',
          message: '请提供完整的参数信息'
        };
      }

      // 调用 MajorRedisService 的方法获取招生计划
      const enrollPlans = await this.majorRedisService.getEnrollPlans(
        majorCode,
        province,
        year,
        batch,
        enrollType,
        preferredSubjects,
        secondarySubjects || []
      );

      return {
        success: true,
        data: {
          majorCode,
          province,
          year,
          batch,
          enrollType,
          preferredSubjects,
          secondarySubjects: secondarySubjects || [],
          total: enrollPlans.length,
          enrollPlans
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: '获取招生计划失败',
        message: error?.message || '未知错误'
      };
    }
  }
}
