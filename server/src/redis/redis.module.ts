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

    // 添加"或"组合
    if (n >= 2) {
      // 生成所有可能的两科"或"组合
      for (let i = 0; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {
          if (!([subjects[i], subjects[j]].includes(firstSubject))) {
            combinations.push(`${firstSubject}_${subjects[i]}或${subjects[j]}`);
          }
        }
      }

      // 当科目数量大于等于3时，生成三科"或"组合
      if (n >= 3) {
        for (let i = 0; i < n - 2; i++) {
          for (let j = i + 1; j < n - 1; j++) {
            for (let k = j + 1; k < n; k++) {
              if (!([subjects[i], subjects[j], subjects[k]].includes(firstSubject))) {
                combinations.push(`${firstSubject}_${subjects[i]}或${subjects[j]}或${subjects[k]}`);
              }
            }
          }
        }
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
   * @param keyPrefix key前缀，如 "subject_req" 或 "enroll_plans"
   * @param firstSubject 首选科目
   * @param secondSubjects 次选科目数组
   * @returns 可能匹配的模式数组
   */
  private static generateMatchingPatterns(keyPrefix: string, firstSubject: string, secondSubjects: string[]): string[] {
    // 写死的匹配数据
    const subjectReqPatterns = [
      "理科_不限",
      "历史_不限",
      "历史_地理",
      "历史_化学",
      "历史_化学_地理",
      "历史_化学_生物",
      "历史_化学_政治",
      "历史_生物",
      "历史_生物_地理",
      "历史_生物_政治",
      "历史_政治",
      "历史_政治_地理",
      "文科_不限",
      "物理_不限",
      "物理_地理",
      "物理_化学",
      "物理_化学_地理",
      "物理_化学_生物",
      "物理_化学_政治",
      "物理_化学或生物",
      "物理_生物",
      "物理_生物_地理",
      "物理_生物_政治",
      "物理_政治",
      "物理_政治_地理",
      "综合_不限",
      "综合_地理",
      "综合_化学",
      "综合_化学_地理",
      "综合_化学_生物",
      "综合_历史",
      "综合_历史_地理",
      "综合_历史_生物_政治",
      "综合_历史_政治",
      "综合_历史_政治_地理",
      "综合_历史_政治_技术",
      "综合_生物",
      "综合_生物_地理",
      "综合_生物_政治",
      "综合_物理",
      "综合_物理_地理",
      "综合_物理_地理_技术",
      "综合_物理_化学",
      "综合_物理_化学_地理",
      "综合_物理_化学_技术",
      "综合_物理_化学_生物",
      "综合_物理_化学_政治",
      "综合_物理_技术",
      "综合_物理_生物",
      "综合_物理_生物_地理",
      "综合_物理_生物_技术",
      "综合_物理_生物_政治",
      "综合_物理_政治",
      "综合_物理_政治_技术",
      "综合_政治",
      "综合_政治_地理"
    ];

    const enrollPlansPatterns = [
      "3+证书_不限",
      "理科_不限",
      "历史__化学_地理",
      "历史_不限",
      "历史_地理",
      "历史_化学",
      "历史_化学_地理",
      "历史_化学_生物",
      "历史_化学_政治",
      "历史_化学或地理",
      "历史_化学或生物",
      "历史_化学或政治",
      "历史_生物",
      "历史_生物_地理",
      "历史_生物_政治",
      "历史_生物或地理",
      "历史_生物或政治",
      "历史_政治",
      "历史_政治_地理",
      "历史_政治或地理",
      "蒙授理科_不限",
      "蒙授文科_不限",
      "体育（历史）_不限",
      "体育（物理）_不限",
      "体育_不限",
      "体育理_不限",
      "体育文_不限",
      "文科_不限",
      "物理_不限",
      "物理_地理",
      "物理_化学",
      "物理_化学_地理",
      "物理_化学_生物",
      "物理_化学_政治",
      "物理_化学或地理",
      "物理_化学或生物",
      "物理_化学或政治",
      "物理_生物",
      "物理_生物_地理",
      "物理_生物_政治",
      "物理_生物或地理",
      "物理_生物或政治",
      "物理_政治",
      "物理_政治_地理",
      "物理_政治或地理",
      "学考_不限",
      "艺术（历史）_不限",
      "艺术（历史）_历史_政治或地理",
      "艺术（历史）_政治或地理",
      "艺术（物理）_不限",
      "艺术_不限",
      "艺术_政治或地理",
      "艺术理_不限",
      "艺术文_不限",
      "综合_不限",
      "综合_地理",
      "综合_化学",
      "综合_化学_地理",
      "综合_化学_生物",
      "综合_化学_生物_历史",
      "综合_化学_生物_政治",
      "综合_化学或地理",
      "综合_化学或地理或技术",
      "综合_化学或历史或地理",
      "综合_化学或历史或技术",
      "综合_化学或历史或生物",
      "综合_化学或历史或政治",
      "综合_化学或生物",
      "综合_化学或生物或地理",
      "综合_化学或生物或技术",
      "综合_化学或生物或历史",
      "综合_化学或生物或政治",
      "综合_化学或政治或技术",
      "综合_历史",
      "综合_历史_地理",
      "综合_历史_政治",
      "综合_历史_政治_地理",
      "综合_历史_政治_技术",
      "综合_历史或地理",
      "综合_历史或地理或技术",
      "综合_历史或地理或生物",
      "综合_历史或政治",
      "综合_历史或政治或地理",
      "综合_历史或政治或技术",
      "综合_生物",
      "综合_生物_地理",
      "综合_生物_技术",
      "综合_生物_历史_地理",
      "综合_生物_历史_政治",
      "综合_生物_政治",
      "综合_生物或地理",
      "综合_生物或地理或技术",
      "综合_生物或历史",
      "综合_生物或历史或地理",
      "综合_生物或历史或技术",
      "综合_生物或历史或政治",
      "综合_生物或政治",
      "综合_生物或政治或地理",
      "综合_生物或政治或技术",
      "综合_生物或政治或历史",
      "综合_物理",
      "综合_物理_地理",
      "综合_物理_地理_技术",
      "综合_物理_化学",
      "综合_物理_化学_地理",
      "综合_物理_化学_技术",
      "综合_物理_化学_生物",
      "综合_物理_化学_政治",
      "综合_物理_技术",
      "综合_物理_历史",
      "综合_物理_生物",
      "综合_物理_生物_地理",
      "综合_物理_生物_技术",
      "综合_物理_生物_政治",
      "综合_物理_政治",
      "综合_物理_政治_技术",
      "综合_物理或地理",
      "综合_物理或地理或技术",
      "综合_物理或化学",
      "综合_物理或化学或地理",
      "综合_物理或化学或技术",
      "综合_物理或化学或历史",
      "综合_物理或化学或生物",
      "综合_物理或化学或政治",
      "综合_物理或技术",
      "综合_物理或历史",
      "综合_物理或历史或地理",
      "综合_物理或历史或技术",
      "综合_物理或历史或政治",
      "综合_物理或生物",
      "综合_物理或生物或地理",
      "综合_物理或生物或技术",
      "综合_物理或生物或历史",
      "综合_物理或生物或政治",
      "综合_物理或政治",
      "综合_物理或政治或地理",
      "综合_物理或政治或技术",
      "综合_政治",
      "综合_政治_地理",
      "综合_政治或地理",
      "综合_政治或地理或技术" 
    ];

    // 构建学生选科数组
    const studentSubjects = [firstSubject, ...secondSubjects];
    
    // 根据keyPrefix选择对应的模式数据
    let patternsToCheck: string[] = [];
    
    if (keyPrefix === 'subject_req' || keyPrefix==='major_scores') {
      patternsToCheck = subjectReqPatterns;
    } else if (keyPrefix === 'enroll_plans') {
      patternsToCheck = enrollPlansPatterns;
    } else {
      // 如果keyPrefix不匹配，返回空数组
      return [];
    }
    
    // 过滤出学生选科能满足的模式，且firstSubject一致
    const matchingPatterns: string[] = [];
    
    for (const pattern of patternsToCheck) {
      // 检查模式的首选科目是否与学生的firstSubject一致
      const patternFirstSubject = pattern.split('_')[0];
      if (patternFirstSubject === firstSubject && RedisModule.checkSubjectRequirement(studentSubjects, pattern)) {
        matchingPatterns.push(pattern);
      }
    }
    
    return matchingPatterns;
  }

  /**
   * 智能判断学生选科是否满足某个模式要求
   * @param studentSubjects 学生选科数组
   * @param pattern 模式字符串
   * @returns boolean 是否满足要求
   */
  private static checkSubjectRequirement(studentSubjects: string[], pattern: string): boolean {
    // 检查pattern是否为空或undefined
    if (!pattern || pattern.trim() === '') {
      return false;
    }
    
    // 处理"不限"情况
    if (pattern.includes('不限')) {
      return true;
    }

    // 分割模式，处理"或"关系
    const parts = pattern.split('或');
    
    // 如果只有一个部分，直接检查
    if (parts.length === 1) {
      return RedisModule.checkSingleRequirement(studentSubjects, parts[0]);
    }

    // 处理"或"关系：只要满足其中一个部分即可
    return parts.some(part => RedisModule.checkSingleRequirement(studentSubjects, part.trim()));
  }

  /**
   * 检查单个要求部分（不包含"或"）
   * @param studentSubjects 学生选科数组
   * @param requirement 单个要求
   * @returns boolean 是否满足要求
   */
  private static checkSingleRequirement(studentSubjects: string[], requirement: string): boolean {
    // 分割要求中的科目（用下划线分隔）
    const requiredSubjects = requirement.split('_').filter(subject => subject.trim() !== '');
    
    // 检查学生是否选择了所有要求的科目
    return requiredSubjects.every(subject => studentSubjects.includes(subject));
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
      // 分别获取subject_req和enroll_plans的匹配模式
      const subjectReqPatterns = RedisModule.generateMatchingPatterns('subject_req', firstSubject, secondSubjects);
      const enrollPlansPatterns = RedisModule.generateMatchingPatterns('enroll_plans', firstSubject, secondSubjects);
      const matchingMajors = new Set<string>();

      // 使用multi代替pipeline
      const multi = client.multi();
      
      // 查询subject_req匹配模式
      for (const pattern of subjectReqPatterns) {
        const key = `subject_req:${province}:${pattern}`;
        multi.sMembers(key);
      }
      
      // 查询enroll_plans匹配模式
      for (const pattern of enrollPlansPatterns) {
        const key = `enroll_plans:${province}:${pattern}`;
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
   * @param keyPrefix key前缀，如 "subject_req" 或 "enroll_plans"
   * @param firstSubject 首选科目
   * @param secondSubjects 次选科目数组
   * @returns string[] 匹配模式数组
   */
  public static getMatchingPatterns(keyPrefix: string, firstSubject: string, secondSubjects: string[]): string[] {
    return RedisModule.generateMatchingPatterns(keyPrefix, firstSubject, secondSubjects);
  }

  /**
   * 获取所有可能的匹配模式（便捷方法，同时获取两种前缀）
   * @param firstSubject 首选科目
   * @param secondSubjects 次选科目数组
   * @returns string[] 匹配模式数组
   */
  public static getAllMatchingPatterns(firstSubject: string, secondSubjects: string[]): string[] {
    const subjectReqPatterns = RedisModule.generateMatchingPatterns('subject_req', firstSubject, secondSubjects);
    const enrollPlansPatterns = RedisModule.generateMatchingPatterns('enroll_plans', firstSubject, secondSubjects);
    return [...subjectReqPatterns, ...enrollPlansPatterns];
  }
}

// 导出 RedisModule 供其他模块使用
export default RedisModule;