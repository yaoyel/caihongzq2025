import { Service } from 'typedi';
import RedisModule from '../redis/redis.module';
import { RedisClientType } from 'redis';
import { MajorHistoryScore } from '../entities/MajorHistoryScore';  
import { getAverageRank } from '../common/utils';
/**
 * 专业信息Redis服务
 */
@Service()
export class MajorRedisService {
  private readonly redisClient: RedisClientType;

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

  /**
   * 获取专业在指定省份和科类的分数信息
   * @param code 专业代码
   * @param province 省份名称
   * @param subjectType 科类（如：物理、历史）
   * @param secondarySelected 次选科目（用逗号分隔的字符串）
   * @param batch 批次（可选，如：本科批）
   * @param start 起始位置（可选，默认0）
   * @param end 结束位置（可选，默认-1表示所有）
   * @returns 分数信息列表，按2024年分数倒序排序
   */
  async getMajorScores(
    code: string,
    province: string,
    subjectType: string,
    secondarySelected: string,
    batch?: string,
    start: number = 0,
    end: number = -1
  ): Promise<MajorHistoryScore[]> {
    try {
      // 将次选科目字符串转换为数组
      const secondSubjects = secondarySelected.split(',').filter(Boolean);
      
      // 使用RedisModule获取所有可能的组合
      const patterns = await RedisModule.getMatchingPatterns("major_scores",subjectType, secondSubjects);
      
      // 给每个组合添加前缀
      const redisKeys = patterns.map(pattern => `major_scores:${code}_${province}_${pattern}`);
      
      // 使用multi进行批量查询
      const multi = this.redisClient.multi();
      
      // 为每个组合构建Redis键并添加到查询中
      for (const redisKey of redisKeys) {
        const finalKey = batch ? `${redisKey}_${batch}` : redisKey;
        multi.zRange(finalKey, start, end, { REV: true });
      }
  
      // 执行批量查询
      const results = await multi.exec();
      if (!results) return []; 
      // 合并所有查询结果
      const allData = results
        .filter(result => Array.isArray(result) && result.length > 0)
        .flatMap(result => 
          (result as string[]).map(item => ({
            ...JSON.parse(item),
            // pattern: patterns[results.indexOf(result)], // 保留原始pattern，不带前缀
            // batch: batch || '所有批次'
          }))
        );
        return allData; 

      // // 按2024年分数排序
      // return allData.sort((a: MajorHistoryScore, b: MajorHistoryScore) => {
      //   const scoreA = this.get2024Score(a.historyScore as unknown as string);
      //   const scoreB = this.get2024Score(b.historyScore as unknown as string);
      //   return scoreB - scoreA;
      // });
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('获取专业分数信息失败:', errorMessage);
      throw new Error(`获取专业分数信息失败: ${errorMessage}`);
    }
  }

  /**
   * 获取专业分数的排名信息
   * @param code 专业代码
   * @param province 省份名称
   * @param subjectType 科类
   * @param batch 批次
   * @param score 2024年分数
   * @returns 排名信息
   */
  async getMajorScoreRank(
    code: string,
    province: string,
    subjectType: string,
    batch: string,
    score: number
  ): Promise<{ rank: number; total: number }> {
    try {
      const redisKey = `major_scores:${code}_${province}_${subjectType}_${batch}`;
      
      // 获取该分数的排名（从高到低）
      const rank = await this.redisClient.zRevRank(redisKey, score.toString());
      // 获取集合中的总元素数
      const total = await this.redisClient.zCard(redisKey);
      
      return {
        rank: rank !== null ? rank + 1 : 0, // 排名从1开始
        total
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('获取专业分数排名失败:', errorMessage);
      throw new Error(`获取专业分数排名失败: ${errorMessage}`);
    }
  }

  /**
   * 获取分数区间内的专业记录
   * @param code 专业代码
   * @param province 省份名称
   * @param subjectType 科类
   * @param batch 批次
   * @param minScore 最低分数
   * @param maxScore 最高分数
   * @returns 区间内的专业记录
   */
  async getMajorScoresByRange(
    code: string,
    province: string,
    subjectType: string,
    batch: string,
    minScore: number,
    maxScore: number
  ): Promise<any[]> {
    try {
      const redisKey = `major_scores:${code}_${province}_${subjectType}_${batch}`;
      
      // 获取分数区间内的记录
      const data = await this.redisClient.zRangeByScore(redisKey, minScore, maxScore);
      return data.map(item => JSON.parse(item));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('获取专业分数区间数据失败:', errorMessage);
      throw new Error(`获取专业分数区间数据失败: ${errorMessage}`);
    }
  }

  /**
   * 从历年分数数据中获取2024年的分数
   * @param historyScore 历年分数数据
   * @returns 2024年分数，如果没有则返回0
   */
  public get2024Score(historyScore: string | null): number {
    try {
      if (!historyScore) return 0;
      
      // 解析JSON字符串为数组（如果已经是数组则直接使用）
      const scoresArray = typeof historyScore === 'string' 
        ? JSON.parse(historyScore)
        : historyScore;
        
      // 确保是数组
      if (!Array.isArray(scoresArray)) return 0;
      
      // 查找2024年的记录
      const score2024 = scoresArray.find((item: MajorHistoryScore) => Object.keys(item)[0] === '2024');
      if (!score2024) return 0;
      
      // 获取2024年的分数
      const scoreStr = score2024['2024'];
      if (scoreStr === '-,-,-') return 0;
      
      // 分割分数字符串，获取第一个值（分数）
      const [score] = scoreStr.split(',');
      const parsedScore = parseFloat(score);
      
      // 确保返回有效的浮点数
      return isNaN(parsedScore) ? 0 : parsedScore;
    } catch (error) {
      console.error('解析2024年分数数据出错：', error);
      return 0;
    }
  }

  /**
   * 根据学生选科情况查询匹配的专业代码
   * @param province 省份
   * @param firstSubject 首选科目（如：物理、历史）
   * @param secondSubjects 次选科目数组（如：['化学', '生物']）
   * @returns Promise<Array<{majorCode: string, matchPattern: string, matchLevel: number}>> 匹配的专业代码列表，按匹配度排序
   */
  async findMatchingMajors(
    province: string,
    firstSubject: string,
    secondSubjects: string[]
  ): Promise<Array<{majorCode: string, matchPattern: string, matchLevel: number}>> {
    try {
      // 使用 RedisModule 的方法获取匹配模式
      const patterns =await RedisModule.getMatchingPatterns("major_scores",firstSubject, secondSubjects);
      const matchingMajors = new Map<string, { matchPattern: string, matchLevel: number }>();

      // 使用 multi 批量查询
      const multi = this.redisClient.multi();
      
      // 查询所有匹配模式
      for (const pattern of patterns) {
        const key = `subject_req:${province}_${pattern}`;
        multi.sMembers(key);
      }

      // 执行 multi 命令并处理结果
      const results = await multi.exec();
      if (!results) return [];

      // 处理结果，计算每个专业的最佳匹配模式和匹配度
      results.forEach((result, index) => {
        if (!result || !Array.isArray(result)) return;

        const currentPattern = patterns[index];
        // 使用第一个_分割，前面是subjectType，后面是selection
        const firstUnderscoreIndex = currentPattern.indexOf('_');
        if (firstUnderscoreIndex === -1) {
          // 如果没有_，说明是不限
          return;
        }
        const subjectType = currentPattern.substring(0, firstUnderscoreIndex);
        const selection = currentPattern.substring(firstUnderscoreIndex + 1);
        
        // 计算当前模式的匹配度
        let matchLevel = this.calculateMatchLevel(
          firstSubject,
          secondSubjects,
          subjectType,
          selection
        );

        result.forEach(majorCode => {
          if (typeof majorCode !== 'string') return;

          // 如果专业已存在，只在匹配度更高时更新
          const existing = matchingMajors.get(majorCode);
          if (!existing || existing.matchLevel < matchLevel) {
            matchingMajors.set(majorCode, {
              matchPattern: currentPattern,
              matchLevel
            });
          }
        });
      });

      // 转换为数组并排序
      return Array.from(matchingMajors.entries())
        .map(([majorCode, { matchPattern, matchLevel }]) => ({
          majorCode,
          matchPattern,
          matchLevel
        }))
        .sort((a, b) => b.matchLevel - a.matchLevel);

    } catch (error) {
      console.error('查询匹配专业时出错:', error);
      throw new Error('查询匹配专业失败');
    }
  }

  /**
   * 计算选科匹配度
   * @param studentFirst 学生的首选科目
   * @param studentSeconds 学生的次选科目
   * @param patternFirst 匹配模式的首选科目
   * @param patternSecond 匹配模式的次选科目
   * @returns number 匹配度分数（0-100）
   */
  private calculateMatchLevel(
    studentFirst: string,
    studentSeconds: string[],
    patternFirst: string,
    patternSecond: string
  ): number {
    try {
      // 参数验证
      if (!studentFirst || !patternFirst || !patternSecond) {
        return 0;
      }

      // 如果是"不限"模式，返回最低分数
      if (patternSecond === '不限') {
        return 10;
      }

      let score = 0;
      const allStudentSubjects = [studentFirst, ...(studentSeconds || [])];
      const patternSubjects = [patternFirst];

      // 处理次选科目
      const isMultipleRequired = patternSecond.includes('_');
      const isOrCondition = patternSecond.includes('或');

      if (isOrCondition) {
        // 处理"或"条件，例如"化学或生物"
        const [subject1, subject2] = patternSecond.split('或');
        patternSubjects.push(subject1, subject2);
      } else if (isMultipleRequired) {
        // 处理多科目组合，例如"物理_化学"
        patternSubjects.push(...patternSecond.split('_'));
      } else {
        // 单科目
        patternSubjects.push(patternSecond);
      }

      // 计算匹配的科目数量
      const matchCount = patternSubjects.filter(subject => 
        allStudentSubjects.includes(subject)
      ).length;

      // 根据匹配科目数量计算分数
      if (matchCount === patternSubjects.length) {
        // 完全匹配
        score = 100;
        // 如果是组合要求（如化学_生物），增加优先级
        if (isMultipleRequired) {
          score += 10;
        }
      } else if (matchCount > 0) {
        // 部分匹配，按比例计算
        score = Math.floor(90 * (matchCount / patternSubjects.length));
        // 组合要求的部分匹配也给予额外分数
        if (isMultipleRequired) {
          score += 5;
        }
      }

      return score;
    } catch (error) {
      console.error('计算匹配度时出错:', error);
      return 0;
    }
  }

  /**
   * 获取选科匹配的专业代码列表
   * @param province 省份
   * @param firstSubject 首选科目
   * @param secondSubjects 次选科目数组
   * @returns Promise<string[]> 匹配的专业代码列表
   */
  async getMatchingStats(
    province: string,
    firstSubject: string,
    secondSubjects: string[]
  ): Promise<string[]> {
    try {
      // 获取所有匹配的专业信息（包含匹配度）
      const matchingMajors = await this.findMatchingMajors(
        province,
        firstSubject,
        secondSubjects
      );

      // 只返回按匹配度排序后的专业代码列表
      return matchingMajors.map(major => major.majorCode);
    } catch (error) {
      console.error('获取选科匹配专业列表时出错:', error);
      throw new Error('获取选科匹配专业列表失败');
    }
  }

  /**
   * 从历年分数数据中获取位次平均值
   * @param historyScore 历年分数数据
   * @returns 位次平均值，如果没有则返回0
   */
  public getAverageRank(historyScore: string | null): number {
    return getAverageRank(historyScore);
  }

  /**
   * 批量获取专业详细信息
   * @param codes 专业代码数组
   * @param page 页码（从1开始）
   * @param pageSize 每页数量（默认10）
   * @returns 包含分页数据和总数的对象
   */
  async getMajorDetails(
    codes: string[],
    page: number = 1,
    pageSize: number = 10
  ): Promise<{
    total: number;
    data: any[];
    currentPage: number;
    totalPages: number;
  }> {
    try {
      // 参数验证
      if (!Array.isArray(codes) || codes.length === 0) {
        return {
          total: 0,
          data: [],
          currentPage: page,
          totalPages: 0
        };
      }

      // 计算分页参数
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedCodes = codes.slice(startIndex, endIndex);

      // 使用multi进行批量查询
      const multi = this.redisClient.multi();
      
      // 为每个专业代码构建Redis键并添加到查询中
      for (const code of paginatedCodes) {
        const redisKey = `major_detail:${code}`;
        multi.get(redisKey);
      }
      
      // 执行批量查询
      const results = await multi.exec();
      if (!results) {
        return {
          total: codes.length,
          data: [],
          currentPage: page,
          totalPages: Math.ceil(codes.length / pageSize)
        };
      }

      // 处理查询结果
      const data = results
        .map((result, index) => {
          if (!result) return null;
          try {
            const parsed = JSON.parse(result as string);
            return {
              ...parsed,
              code: paginatedCodes[index] // 添加专业代码到返回数据中
            };
          } catch (e) {
            console.error(`解析专业数据失败: ${paginatedCodes[index]}`, e);
            return null;
          }
        })
        .filter(item => item !== null);

      return {
        total: codes.length,
        data,
        currentPage: page,
        totalPages: Math.ceil(codes.length / pageSize)
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('批量获取专业信息失败:', errorMessage);
      throw new Error(`批量获取专业信息失败: ${errorMessage}`);
    }
  }

  /**
   * 获取招生计划数据
   * @param majorCode 专业代码
   * @param province 省份
   * @param year 年份
   * @param batch 批次
   * @param enrollType 考生类型
   * @param preferredSubjects 首选科目
   * @param secondarySubjects 次选科目数组
   * @returns Promise<any[]> 招生计划列表
   */
  async getEnrollPlans(
    majorCode: string,
    province: string,
    year: number,
    batch: string,
    enrollType: string,
    preferredSubjects: string,
    secondarySubjects: string[]
  ): Promise<any[]> {
    try {
      // 使用 RedisModule 获取所有可能的匹配模式
      const patterns = await RedisModule.getMatchingPatterns(
        'enroll_plans',
        preferredSubjects,
        secondarySubjects
      );

      if (patterns.length === 0) {
        console.log('未找到匹配的科目模式');
        return [];
      }

      console.log(patterns);

      // 构建所有可能的 Redis key
      const redisKeys = patterns.map(pattern => 
        `enroll_plans:${majorCode}_${province}_${year}_${batch}_${enrollType}_${pattern}`
      );

      console.log(`查询 ${redisKeys.length} 个匹配的招生计划键:`, redisKeys);

      // 使用 multi 进行批量查询
      const multi = this.redisClient.multi();
      
      // 为每个匹配的模式构建 Redis key 并添加到查询中
      for (const redisKey of redisKeys) {
        multi.hGetAll(redisKey);
      }

      // 执行批量查询
      const results = await multi.exec();
      if (!results) return [];

      // 合并所有查询结果
      const allEnrollPlans = results
        .filter(result => result && typeof result === 'object' && Object.keys(result).length > 0)
        .flatMap(result => {
          if (typeof result === 'object' && result !== null) {
            return Object.values(result).map(item => {
              try {
                return JSON.parse(item as string);
              } catch (e) {
                console.error('解析招生计划数据失败:', e);
                return null;
              }
            }).filter(item => item !== null);
          }
          return [];
        });

      console.log(`成功获取 ${allEnrollPlans.length} 条招生计划数据`);
      return allEnrollPlans;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('获取招生计划数据失败:', errorMessage);
      throw new Error(`获取招生计划数据失败: ${errorMessage}`);
    }
  }


}