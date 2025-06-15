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
    const keys = await client.keys('school:*');
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
    const key = `school:${code}`;
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
}
