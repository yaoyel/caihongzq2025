import RedisModule from '../redis/redis.module';

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
  private static getAverageRank(historyScore: any): number {
    try {
      if (!historyScore) return 0;
      
      // 如果是字符串，尝试解析为对象
      const scores = typeof historyScore === 'string' 
        ? JSON.parse(historyScore)
        : historyScore;

      if (!Array.isArray(scores) || scores.length === 0) return 0;

      // 遍历所有年份的记录，找到最新的有效位次
      for (const score of scores) {
        const year = Object.keys(score)[0];
        const scoreStr = score[year];
        
        // 如果分数字符串无效，继续下一条记录
        if (!scoreStr || scoreStr === '-,-,-') continue;

        // 分割分数字符串，获取位次（位次在第二个位置）
        const [, rank] = scoreStr.split(',');
        const parsedRank = parseInt(rank, 10);

        // 如果解析出有效的位次，直接返回
        if (!isNaN(parsedRank) && parsedRank > 0) {
          return parsedRank;
        }
      }

      return 0;
    } catch (error) {
      console.error('解析位次数据出错：', error);
      return 0;
    }
  }

  /**
   * 获取指定学校和省份的专业分数信息，并按照位次进行分组排序
   * @param schoolCode 学校代码
   * @param province 省份
   * @param rank 用户位次
   * @returns Promise<any[]> 专业分数列表（已分组排序）
   */
  static async getMajorScores(schoolCode: string, province: string, rank: number): Promise<any[]> {
    const client = RedisModule.getClient();
    const key = `school_scores:${schoolCode}_${province}`;
    const scores = await client.lRange(key, 0, -1);
    
    if (!scores.length) return [];

    return scores.map(score => {
      const scoreData = JSON.parse(score);
      const avgRank = this.getAverageRank(scoreData.historyscore); // 注意这里使用 historyscore
      
      // 计算与用户位次的差异百分比
      let rankDiffPercentage = 0;
      if (rank > 0 && avgRank > 0) {
        rankDiffPercentage = ((avgRank - rank) / rank) * 100;
      }
      
      // 确定分组
      let group = 0; // 默认组（无分数或差异过大）
      
      if (avgRank > 0 && rank > 0) {
        const absDiff = Math.abs(rankDiffPercentage);
        if (absDiff <= 5) {
          group = 2; // 最匹配（-5% ~ 5%）
        } else if (rankDiffPercentage > 5 && rankDiffPercentage <= 10) {
          group = 1; // 稍高（5% ~ 10%）
        } else if (rankDiffPercentage < -5 && rankDiffPercentage >= -15) {
          group = 3; // 稍低（-15% ~ -5%）
        }
      }

      console.log('位次差异:', rankDiffPercentage, '分组:', group);

      return {
        ...scoreData,
        averageRank: avgRank || 0,
        rankDiffPercentage: rankDiffPercentage || 0,
        group
      };
    }).sort((a, b) => {
      // 首先按分组排序（组2最优先，然后是组3，组1，最后是组0）
      const groupOrder = [2, 3, 1, 0];
      const groupDiff = groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group);
      if (groupDiff !== 0) return groupDiff;
      
      // 在同一分组内，按位次差异的绝对值排序（差异越小越靠前）
      return Math.abs(a.rankDiffPercentage) - Math.abs(b.rankDiffPercentage);
    });
  }
}
