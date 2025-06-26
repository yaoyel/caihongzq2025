// 引入 redis 和 dotenv 包
import { createClient, RedisClientType } from 'redis';
import * as dotenv from 'dotenv';
import * as path from 'path'; 

// 加载 .env 文件中的环境变量
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
console.log('REDIS_MASTER_HOST:', process.env.REDIS_MASTER_HOST);
console.log('REDIS_MASTER_PORT:', process.env.REDIS_MASTER_PORT);
console.log('REDIS_PASSWORD:', process.env.REDIS_PASSWORD);
console.log('REDIS_DB:', process.env.REDIS_DB);

/**
 * Redis 客户端单例模块
 * 负责初始化并导出 Redis 客户端实例
 */
class RedisModule {
  // Redis 客户端实例
  private static client: RedisClientType | null = null;

  /**
   * 获取 Redis 客户端实例（单例模式）
   */
  public static getClient(): RedisClientType {
    if (!RedisModule.client) {
      // 创建 Redis 客户端，读取环境变量配置
      RedisModule.client = createClient({
        socket: {
          host: process.env.REDIS_MASTER_HOST, // Redis 主机地址
          port: Number(process.env.REDIS_MASTER_PORT), // Redis 端口
        },
        password: process.env.REDIS_PASSWORD, // Redis 密码
        database: Number(process.env.REDIS_DB), // Redis 数据库编号
      });

      // 监听错误事件，防止未捕获异常导致进程退出
      RedisModule.client.on('error', (err:any) => {
        console.error('Redis 连接错误：', err);
      });

      // 连接 Redis 服务器
      RedisModule.client.connect().then(() => {
        console.log('Redis 连接成功');
      }).catch((err:any) => {
        console.error('Redis 连接失败：', err);
      });
    }
    return RedisModule.client;
  }

  /**
   * 生成所有可能的选科组合
   * @param firstSubject 首选科目
   * @param subjects 选科数组
   * @returns 所有可能的组合
   */
  private static generateAllCombinations(firstSubject: string, subjects: string[]): string[] {
    const combinations: string[] = [];
    const n = subjects.length;

    // 如果subjects为空，直接返回不限组合
    if (n === 0) {
      return [`${firstSubject}_不限`];
    }

    // 单科
    subjects.forEach(subject => {
      if (subject !== firstSubject) {  // 避免自己组合自己
        combinations.push(`${firstSubject}_${subject}`);
      }
    });

    // 双科组合
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        if (subjects[i] !== firstSubject && subjects[j] !== firstSubject) {  // 避免自己组合自己
          combinations.push(`${firstSubject}_${subjects[i]}_${subjects[j]}`);
        }
      }
    }

    // 三科组合
    if (n >= 3) {
      for (let i = 0; i < n - 2; i++) {
        for (let j = i + 1; j < n - 1; j++) {
          for (let k = j + 1; k < n; k++) {
            if (subjects[i] !== firstSubject && subjects[j] !== firstSubject && subjects[k] !== firstSubject) {
              combinations.push(`${firstSubject}_${subjects[i]}_${subjects[j]}_${subjects[k]}`);
            }
          }
        }
      }
    }

    // 添加最后两个科目的"或"组合
    if (n >= 2) {
      const lastTwo = subjects.slice(-2);
      if (!lastTwo.includes(firstSubject)) {
        combinations.push(`${firstSubject}_${lastTwo[0]}或${lastTwo[1]}`);
      }
    }

    // 添加"不限"组合
    combinations.push(`${firstSubject}_不限`);

    return combinations;

    // 验证生成的组合是否在配置的有效组合中
    // return combinations.filter(combo => {
    //   const [subject, pattern] = combo.split(':');
    //   return isValidCombination(subject, pattern);
    // });
  }

  /**
   * 生成学生选科可能匹配的模式
   * @param firstSubject 首选科目
   * @param secondSubjects 次选科目数组
   * @returns 可能匹配的模式数组
   */
  private static generateMatchingPatterns(firstSubject: string, secondSubjects: string[]): string[] {
    // 生成所有可能的组合
    const patterns = RedisModule.generateAllCombinations(firstSubject, secondSubjects);
    
    // 添加综合科目的组合
    // const comprehensivePatterns = RedisModule.generateAllCombinations('综合', secondSubjects);
    
    return patterns;
  }

  /**
   * 查找匹配的专业代码
   * @param province 省份
   * @param firstSubject 首选科目
   * @param secondSubjects 次选科目数组
   * @returns Promise<string[]> 匹配的专业代码数组
   */
  public static async findMatchingMajors(
    province: string,
    firstSubject: string,
    secondSubjects: string[]
  ): Promise<string[]> {
    try {
      const client = RedisModule.getClient();
      const patterns = RedisModule.generateMatchingPatterns(firstSubject, secondSubjects);
      const matchingMajors = new Set<string>();

      // 使用multi代替pipeline
      const multi = client.multi();
      
      // 查询所有匹配模式
      for (const pattern of patterns) {
        const key = `subject_req:${province}:${pattern}`;
        multi.sMembers(key);
      }

      // 执行multi命令并处理结果
      const results = await multi.exec();
      if (!results) return [];

      // 处理结果
      for (const result of results) {
        if (result && Array.isArray(result)) {
          result.forEach(major => {
            if (typeof major === 'string') {
              matchingMajors.add(major);
            }
          });
        }
      }

      return Array.from(matchingMajors);
    } catch (error) {
      console.error('查询匹配专业时出错:', error);
      return [];
    }
  }

  /**
   * 获取所有可能的匹配模式
   * @param firstSubject 首选科目
   * @param secondSubjects 次选科目数组
   * @returns string[] 匹配模式数组
   */
  public static getMatchingPatterns(firstSubject: string, secondSubjects: string[]): string[] {
    return RedisModule.generateMatchingPatterns(firstSubject, secondSubjects);
  }
}

// 导出 RedisModule 供其他模块使用
export default RedisModule;