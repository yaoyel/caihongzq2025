import RedisModule from '../redis/redis.module';
import { getAverageRank } from '../common/utils';
import { extractRank } from '../utils/helper';

/**
 * 学校Redis服务
 * 处理学校数据的缓存读写操作
 */
export class SchoolRedisService {
  /**
   * 从Redis获取所有学校数据
   * @returns Promise<any[]>
   */
  static async getAllSchools(): Promise<any[]> {
    const client = RedisModule.getClient();
    // 获取所有学校的key
    const keys = await client.keys('school_detail:*');
    if (!keys.length) return [];

    // 批量获取学校数据
    const schools = await Promise.all(
      keys.map(async (key) => {
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
      })
    );

    // 过滤掉null值并返回
    return schools.filter(school => school !== null);
  }

  /**
   * 从Redis获取单个学校数据
   * @param code 学校代码
   * @returns Promise<any | null>
   */
  static async getSchool(code: string): Promise<any | null> {
    const client = RedisModule.getClient();
    const key = `school_detail:${code}`;
    const data = await client.get(key);
    
    return data ? JSON.parse(data) : null;
  }

  /**
   * 检查Redis中是否存在指定学校的数据
   * @param code 学校代码
   * @returns Promise<boolean>
   */
  static async exists(code: string): Promise<boolean> {
    const client = RedisModule.getClient();
    const key = `school:${code}`;
    return (await client.exists(key)) === 1;
  }

  /**
   * 获取平均位次
   * @param historyScore 历年分数数据
   * @returns number 平均位次
   */
  // 同major.redis.service.ts中的getAverageRank方法，必须统一
  public static getAverageRank(historyScore: string | null): number {
    return getAverageRank(historyScore);
  }

  /**
   * 获取指定学校和省份的专业分数信息，并按照位次进行分组排序
   * @param schoolCode 学校代码
   * @param province 省份
   * @param rank 用户位次
   * @returns Promise<any[]> 专业分数列表（已分组排序）
   */
  /**
   * 获取指定学校和省份的专业分数信息（仅数据查询，不包含业务逻辑）
   * @param schoolCode 学校代码
   * @param province 省份
   * @returns Promise<any[]> 专业分数列表（原始数据）
   */
  static async getMajorScores(schoolCode: string, province: string): Promise<any[]> {
    const client = RedisModule.getClient();
    const key = `school_scores:${schoolCode}_${province}`;
    const scores = await client.lRange(key, 0, -1);
    
    if (!scores.length) return [];

    return scores.map(score => {
      const scoreData = JSON.parse(score);
      const rank2024 =  extractRank(scoreData.length > 0 ? scoreData[0].historyScore : null);
          
      
      return {
        ...scoreData,
        rank2024: rank2024 || 0
      };
    });
  }
}
