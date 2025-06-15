import { Service } from 'typedi';
import RedisModule from '../redis/redis.module';

/**
 * 专业信息Redis服务
 */
@Service()
export class MajorRedisService {
  private readonly redisClient;

  constructor() {
    this.redisClient = RedisModule.getClient();
  }

  /**
   * 从Redis获取专业详细信息
   * @param code 专业代码
   * @returns 专业详情数据
   */
  async getMajorDetail(code: string): Promise<any | null> {
    try {
      // 构建Redis键名
      const redisKey = `major_detail:${code}`;

      // 从Redis获取数据
      const data = await this.redisClient.get(redisKey);
      console.log(redisKey);
      if (!data) {
        return null;
      }

      // 解析JSON数据
      return JSON.parse(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('获取专业信息失败:', errorMessage);
      throw new Error(`获取专业信息失败: ${errorMessage}`);
    }
  }

  /**
   * 将专业详细信息存入Redis
   * @param code 专业代码
   * @param data 专业详情数据
   * @param ttl 过期时间（秒）
   */
  async setMajorDetail(code: string, data: any, ttl: number = 3600): Promise<void> {
    try {
      const redisKey = `major:detail:${code}`;
      await this.redisClient.setEx(redisKey, ttl, JSON.stringify(data));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('保存专业信息失败:', errorMessage);
      throw new Error(`保存专业信息失败: ${errorMessage}`);
    }
  }

  /**
   * 删除Redis中的专业详细信息
   * @param code 专业代码
   */
  async deleteMajorDetail(code: string): Promise<void> {
    try {
      const redisKey = `major:detail:${code}`;
      await this.redisClient.del(redisKey);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('删除专业信息失败:', errorMessage);
      throw new Error(`删除专业信息失败: ${errorMessage}`);
    }
  }
} 