import { GAOKAO_SUBJECT_CONFIG } from '../config/gaokao-subjects';
import { Get, JsonController, Post, Body } from 'routing-controllers';
import { Service } from 'typedi';
import RedisModule from '../redis/redis.module';

/**
 * 配置控制器类
 */
@JsonController("/config")
@Service()
export class ConfigController {
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
      firstSubject: string;
      secondSubjects?: string[];
    }
  ) {
    try {
      const { firstSubject, secondSubjects = [] } = body;
      
      // 调用 RedisModule 的方法获取所有可能的组合
      const combinations = RedisModule.getMatchingPatterns(firstSubject, secondSubjects);
      
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
}
