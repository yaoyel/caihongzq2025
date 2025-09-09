import { Controller, Ctx, Get, Param, JsonController, QueryParam, Post, Body, Delete } from 'routing-controllers'; 
import { MajorRedisService } from '../services/major.redis.service';
import { MajorDetailViewModel, toMajorDetailViewModel, BaseMajorDetailViewModel } from '../view-models/major.view.model';
import { Service } from 'typedi';
import { MajorScoreService } from '../services/major.service';
import { User } from '../entities/User';
import { AppDataSource } from '../data-source';
import { UserService } from '../services/user.service';
import { SchoolViewModel } from '../view-models/base.school.view.model';
import { Intention } from '../entities/Intention';
import { Alternative } from '../entities/Alternative';
import { AlternativeViewModel, toAlternativeViewModel } from '../view-models/altrmative.view.model';
import { MajorGroupViewModel, toMajorGroupViewModels } from '../view-models/major.group.view,model';
import { PROVINCE_VOLUNTEER_COUNT } from '../config/province';
import { config } from 'dotenv'; 
import { extractRank } from '../utils/helper';
config();

/**
 * 专业匹配结果接口
 */
interface MajorMatchResult {
  majorCode: string;
  majorName: string;
  matchPattern: string;
  matchLevel: number;
  majorBrief?: string;
}

/**
 * 带排名信息的学校接口
 */
interface SchoolWithRank extends SchoolViewModel {
  id: number;
  historyScores?: any[];
  averageRank?: number;
  rankDiffPercentage?: number;
  group?: number;
  [key: string]: any;
}
  
/**
 * 专业信息控制器
 */ 
@JsonController('/majors')
@Service()
export class MajorController {
  constructor(
    private readonly majorRedisService: MajorRedisService,
    private readonly majorScoreService: MajorScoreService,
    private readonly userService: UserService,
  ) {}

  /**
   * 获取专业简略信息
   * @param code 专业代码
   * @returns 专业简略信息视图模型
   */
  @Get('/:code/brief')
  async getMajorBrief(@Param('code') code: string): Promise<BaseMajorDetailViewModel | {}> {
    try {
      // 参数验证
      if (!code) {
        throw new Error('专业代码不能为空');
      }

      // 从Redis服务获取原始数据
      const rawData = await this.majorRedisService.getMajorDetail(code);
      
      // 如果没有找到数据
      if (!rawData) {
        return {};
      }

      // 提取基础信息
      const briefInfo: BaseMajorDetailViewModel = {
        code: rawData.code,
        educationLevel: rawData.educationLevel,
        studyPeriod: rawData.studyPeriod,
        awardedDegree: rawData.awardedDegree,
        majorBrief: rawData.majorBrief,
        majorKey: rawData.majorKey,
        opportunityScore: rawData.opportunityScore,
        academicDevelopmentScore: rawData.academicDevelopmentScore,
        careerDevelopmentScore: rawData.careerDevelopmentScore,
        growthPotentialScore: rawData.growthPotentialScore,
        industryProspectsScore: rawData.industryProspectsScore,
        developmentPotential: ((Number(rawData.major?.score || 0) * 100 + Number(rawData.opportunityScore || 0)) / 2).toFixed(2),
        academicDevelopmentTag: rawData.academicDevelopmentTag,
        careerDevelopmentTag: rawData.careerDevelopmentTag,
        growthPotentialTag: rawData.growthPotentialTag,
        industryProspectsTag: rawData.industryProspectsTag,
        studyContent: rawData.studyContent,
        seniorTalk: rawData.seniorTalk,
        academicDevelopment: rawData.academicDevelopment,
        careerDevelopment: rawData.careerDevelopment,
        industryProspects: rawData.industryProspects,
        growthPotential: rawData.growthPotential,
      };

      return briefInfo;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      throw new Error(`获取专业简略信息失败: ${message}`);
    }
  }

  /**
   * 获取专业详细信息
   * @param code 专业代码
   * @returns 专业详情视图模型
   */
  @Get('/:code/detail') 
  async getMajorDetail(@Param('code') code: string, @Ctx() ctx: { state: { user?: { userId: number } } }): Promise<MajorDetailViewModel | {}> {
    try {
      // 参数验证
      if (!code) {
        throw new Error('专业代码不能为空');
      }

      if (!ctx?.state?.user?.userId) {
        console.error('未获取到用户信息，ctx.state:', ctx.state);
        return { code: 401, message: '未获取到用户信息' };
    }

      const userId = ctx.state.user.userId;
      const user = await this.userService.findOne(userId); 
      if (!user) {
        throw new Error('用户不存在');
      }

      // 从Redis服务获取原始数据
      const rawData = await this.majorRedisService.getMajorDetail(code);
      
      // 如果没有找到数据
      if (!rawData) {
        return {};
      }  
      
      // 获取用户的专业热爱值
      const scores = await this.majorScoreService.calculateMajorScoresByCode(userId.toString(), [code],user!.enrollType || '本科批');
      if (scores.length !== 0) {
              // 将专业分数信息添加到rawData中
       rawData.major.score = scores[0].score;
       rawData.major.lexueScore = scores[0].lexueScore;
       rawData.major.shanxueScore = scores[0].shanxueScore;
       rawData.major.yanxueDeduction = scores[0].yanxueDeduction;
       rawData.major.tiaozhanDeduction = scores[0].tiaozhanDeduction;
      } 
      

      // 根据用户信息，从redis中查询专业对应的分数
      const historyScore = await this.majorRedisService.getMajorScores(code, user!.province || '北京', user!.preferredSubjects || '综合', user!.secondarySubjects || '');
      const rank = user.rank;
 
      // 调用 MajorRedisService 的方法获取招生计划
      const enrollPlans = await this.majorRedisService.getEnrollPlans(
        code,
        user!.province || '北京',
        Number.parseInt(process.env.CURRENT_YEAR || '2025'),
        user!.enrollType || '本科批',
        '普通类',
        user!.preferredSubjects || '综合',
        user!.secondarySubjects?.split(',') || ['不限']
      );
 

      // 根据 enrollPlans 为 schools 添加 majorGroupId 和 majorGroupName
      if (Array.isArray(rawData.schools) && Array.isArray(enrollPlans)) {
        // 为每个学校添加 majorGroupId 和 majorGroupName
        rawData.schools = rawData.schools.map((school: { id: number; code?: string } & SchoolViewModel) => {
          // 在 enrollPlans 中查找对应的招生计划
          const enrollPlan = enrollPlans.find(plan => plan.schoolCode === school.code);
          return {
            ...school,
            majorGroupId: enrollPlan?.majorGroup || null,
            majorGroupName: enrollPlan?.majorGroupName || null
          };
        });
      } 
      // 将历年分数数据添加到对应的学校对象中，并按位次分组排序
      if (!rank) {
        // 转换为视图模型并返回
        const defaultViewModel = toMajorDetailViewModel(rawData);
        if (!defaultViewModel) {
          throw new Error('专业信息格式不正确');
        }
        return defaultViewModel;
      }
      
      // 同school.redis.services.ts中的getAverageRank方法，必须统一
      if (Array.isArray(rawData.schools) && Array.isArray(historyScore)) {
        // 获取本地批次名称列表
        const localBatchNames = process.env.LOCAL_BATCH_NAME?.split(',') || []; 
        
        // 先处理学校数据，添加历史分数信息
        const processedSchools = rawData.schools.map((school: { id: number } & SchoolViewModel) => {
          const schoolScores = historyScore.filter(score => 
            score.schoolMajorId === school.id && 
            (user.enrollType === '专科批' 
              ? localBatchNames.includes(score.batch)
              : !localBatchNames.includes(score.batch))
          ); 
    
          // 计算位次差值和位次差值百分比（与2024年位次比较）
          let rankDiff = 0;
          let rankDiffPer = 0;
          
          // 获取2024年的位次数据
          const rank2024 = extractRank(schoolScores.length > 0 ? schoolScores[0].historyScore : null);
          
          if (rank && rank > 0 && rank2024 && rank2024 > 0) {
            // 计算位次差值（用户位次 - 2024年位次）
            rankDiff = rank - rank2024;
            // 计算位次差值百分比（差值 / 2024年位次）
            rankDiffPer = rank2024 > 0 ? (rankDiff / rank2024) * 100 : 0;
          }
          
          // 确定分组
          let group = 6; // 默认组（无分数或差异过大）
          if (rank2024 && rank2024 > 0 && rank && rank > 0) { // 只对有位次的学校进行分组
            
            // 根据位次差异确定分组
            if (rankDiffPer >= 30 && rankDiffPer <= 100) {
              group = 1; // +30%到+100%位次段 
            } else if (rankDiffPer >= 5 && rankDiffPer < 30) {
              group = 2; // +5%到+30%位次段
            } else if (rankDiffPer >= -10 && rankDiffPer < 5) {
              group = 3; // （-10%）到+5%位次段
            } else if (rankDiffPer >= -30 && rankDiffPer < -10) {
              group = 4; // （-30%）到（-10%）位次段
            } else if (rankDiffPer >= -100 && rankDiffPer < -30) {
              group = 5; // （-100%）到（-30%）位次段
            } else {
              group = 6; // 其他位次段
            }
          }
          
          return {
            ...school,
            historyScores: schoolScores, 
            rankDiff,
            rankDiffPer,
            rank2024,
            group
          };
        });
        
        // 过滤掉 historyScores 数组长度为 0 的学校
        const filteredSchools = processedSchools.filter((school: SchoolWithRank) => 
          school.historyScores && school.historyScores.length > 0
        );
        
        // 对过滤后的学校进行排序
        rawData.schools = filteredSchools;
      }; 
     
      // 转换为视图模型
      const viewModel = toMajorDetailViewModel(rawData);
      if (!viewModel) {
        throw new Error('专业信息格式不正确');
      }

      return viewModel;
    } catch (error: unknown) { 
      const message = error instanceof Error ? error.message : '未知错误';
      throw new Error(`获取专业信息失败: ${message}`);
    }
  }

  /**
   * 根据评分维度对专业进行分组
   * @param scores 专业得分列表
   * @param scoreField 评分字段名
   * @returns 分组结果
   */
  private groupMajorsByScore(scores: any[], scoreField: string) {
    // 按指定字段排序
    const sortedScores = [...scores].sort((a, b) => b[scoreField] - a[scoreField]);
    const total = sortedScores.length;
    
    // 计算分组边界 - 前20%、20%-80%、后20%
    const top20Percent = Math.max(1, Math.floor(total * 0.20));
    const bottom20Percent = Math.max(1, Math.floor(total * 0.20));
    
    // 根据评分字段确定分组名称前缀
    const getGroupPrefix = (field: string) => {
      const fieldMap: { [key: string]: string } = {
        'developmentPotential': '发展潜能',
        'score': '热爱能量',
        'opportunityScore': '机遇指数',
        'lexueScore': '乐学',
        'shanxueScore': '善学',
        'yanxueDeduction': '厌学',
        'tiaozhanDeduction': '阻学',
        'academicDevelopmentScore': '学业发展',
        'careerDevelopmentScore': '职业回报',
        'industryProspectsScore': '产业前景',
        'growthPotentialScore': '成长空间'
      };
      return fieldMap[field] || '评分';
    };
    
    const prefix = getGroupPrefix(scoreField);
    
    return [
      {
        groupId: "1",
        description: `${prefix}前20%专业`,
        count: top20Percent,
        majorCodes: sortedScores.slice(0, top20Percent).map(s => s.majorCode)
      },
      {
        groupId: "2",
        description: `${prefix}20%-80%专业`,
        count: total - top20Percent - bottom20Percent,
        majorCodes: sortedScores.slice(top20Percent, total - bottom20Percent).map(s => s.majorCode)
      },
      {
        groupId: "3",
        description: `${prefix}后20%专业`,
        count: bottom20Percent,
        majorCodes: sortedScores.slice(total - bottom20Percent).map(s => s.majorCode)
      }
    ];
  }

  /**
   * 获取用户专业匹配得分
   * @param userId 用户ID
   * @returns 专业匹配得分结果
   */
  @Get('/userscores/:userId')
  async getUserMajorScores(@Param('userId') userId: string): Promise<any> {
    try {
      if (!userId) {
        throw new Error('用户ID不能为空');
      }

      // 判断用户是否存在，是否购买了产品
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: parseInt(userId) },
        relations: ['orders']
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      const {province, preferredSubjects, secondarySubjects,enrollType} = user; 
      const firstSubject = preferredSubjects || '综合';      
      // 获取选科匹配的专业代码列表
      const secondSubjectsArray = (secondarySubjects || '').split(',').filter(Boolean);
      const matchingMajorCodes = await this.majorRedisService.getMatchingStats(
        province || '北京',
        firstSubject,
        secondSubjectsArray
      );

      // 创建匹配专业代码的Set，用于快速查找
      const matchingMajorCodeSet = new Set(matchingMajorCodes);

      // 计算所有专业的匹配得分， 并计算得分
      const majorScores = await this.majorScoreService.calculateMajorScores(userId,enrollType || '本科批');

      // 为每个专业添加匹配标记
      const scoresWithMatchingFlag = majorScores.map(score => ({
        ...score,
        isMatching: matchingMajorCodeSet.has(score.majorCode),
        growthPotentialScore:  score.growthPotentialScore,
        careerDevelopmentScore:  score.careerDevelopmentScore,
        academicDevelopmentScore:  score.academicDevelopmentScore,
        industryProspectsScore:  score.industryProspectsScore
      }));

      // 将专业分为匹配和不匹配两组
      const matchingScores = scoresWithMatchingFlag.filter(score => score.isMatching);
      const nonMatchingScores = scoresWithMatchingFlag.filter(score => !score.isMatching);

      // 对匹配的专业按分数排序
      const sortedMatchingScores = matchingScores.sort((a, b) => b.score - a.score);

      // 对不匹配的专业按分数排序
      const sortedNonMatchingScores = nonMatchingScores.sort((a, b) => b.score - a.score);

      // 合并两组排序结果
      const sortedScores = [...sortedMatchingScores, ...sortedNonMatchingScores];

      // 判断用户是否已经购买了产品
      const hasPurchased = user.orders && user.orders.some(order => 
        order.trade_state === 'SUCCESS' || order.trade_state === 'COMPLETED'
      );

      let processedScores = sortedScores;
      if (!hasPurchased && sortedScores.length > 10) {
        // 获取前五条和后五条数据
        const topFive = sortedScores.slice(0, 5);
        const bottomFive = sortedScores.slice(-5);
        processedScores = [...topFive, ...bottomFive];
      }

      // 按照不同评分维度进行分组
      const groupedResults = {
        developmentPotential: this.groupMajorsByScore(processedScores, 'developmentPotential'),
        score: this.groupMajorsByScore(processedScores, 'score'),
        opportunityScore: this.groupMajorsByScore(processedScores, 'opportunityScore'),
        lexueScore: this.groupMajorsByScore(processedScores, 'lexueScore'),
        shanxueScore: this.groupMajorsByScore(processedScores, 'shanxueScore'),
        yanxueDeduction: this.groupMajorsByScore(processedScores, 'yanxueDeduction'),
        tiaozhanDeduction: this.groupMajorsByScore(processedScores, 'tiaozhanDeduction'),
        academicDevelopmentScore: this.groupMajorsByScore(processedScores, 'academicDevelopmentScore'),
        careerDevelopmentScore: this.groupMajorsByScore(processedScores, 'careerDevelopmentScore'),
        industryProspectsScore: this.groupMajorsByScore(processedScores, 'industryProspectsScore'),
        growthPotentialScore: this.groupMajorsByScore(processedScores, 'growthPotentialScore')
      };

      // 保持向后兼容性，同时返回原来的结构和新的分组结构
      return {
        userId,
        scores: processedScores, // 保持原有的scores字段
        groupedResults, // 新增的分组结果
        calculatedAt: new Date().toISOString()
      };
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      throw new Error(`计算专业匹配得分失败: ${message}`);
    }
  }

  /**
   * 根据选科要求查询匹配的专业
   * @param province 省份
   * @param firstSubject 首选科目
   * @param secondSubjects 次选科目（用逗号分隔）
   * @returns 匹配的专业列表，按匹配度排序
   */
  @Get('/match')
  async findMatchingMajors(
    @QueryParam('province') province: string,
    @QueryParam('firstSubject') firstSubject: string,
    @QueryParam('secondSubjects') secondSubjects: string
  ): Promise<{ 
    total: number;
    matches: MajorMatchResult[];
  }> {
    try {
      // 参数验证
      if (!province || !firstSubject || !secondSubjects) {
        throw new Error('省份、首选科目和次选科目都不能为空');
      }

      // 将次选科目字符串转换为数组
      const secondSubjectsArray = secondSubjects.split(',').map(s => s.trim());

      // 获取匹配的专业
      const matchingMajors = await this.majorRedisService.findMatchingMajors(
        province,
        firstSubject,
        secondSubjectsArray
      );


      // 获取专业详细信息并组装结果
      const majorDetails = await Promise.all(
        matchingMajors.map(async ({ majorCode, matchPattern, matchLevel }) => {
          const majorDetail = await this.majorRedisService.getMajorDetail(majorCode);
          return {
            majorCode,
            majorName: majorDetail?.major?.name || '未知专业',
            matchPattern,
            matchLevel,
            majorBrief: majorDetail?.majorBrief
          };
        })
      );

      return {
        total: majorDetails.length,
        matches: majorDetails
      };

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      throw new Error(`查询匹配专业失败: ${message}`);
    }
  }

  /**
   * 批量获取专业信息
   * @param codes 专业代码数组
   * @param page 页码（从1开始）
   * @param pageSize 每页数量（默认10）
   * @returns 分页后的专业信息列表
   */
  @Post('/batch/:userId')
  async getMajorDetailsBatch(
    @Param('userId') userId: string,
    @Body() body: { codes: string[] },
    @QueryParam('page') page: number = 1,
    @QueryParam('pageSize') pageSize: number = 10
  ): Promise<{
    total: number;
    data: any[];
    currentPage: number;
    totalPages: number;
  }> {
    try {
      // 参数验证
      if (!Array.isArray(body.codes) || body.codes.length === 0) {
        throw new Error('专业代码列表不能为空');
      }

      const user = await this.userService.findOne(parseInt(userId));
      if (!user) {
        throw new Error('用户不存在');
      } 

      // 验证页码和每页数量
      if (page < 1) page = 1;
      if (pageSize < 1) pageSize = 10;
      if (pageSize > 50) pageSize = 50; // 限制最大每页数量

      // 调用服务获取专业信息
      const result = await this.majorRedisService.getMajorDetails(
        body.codes,
        page,
        pageSize
      );

      // 获取专业分数
      const majorScores = await this.majorScoreService.calculateMajorScoresByCode(userId, body.codes,user!.enrollType || '本科批');

      // 将分数信息添加到对应的专业信息中
      const enrichedData = result.data.map(majorDetail => {
        const matchingScore = majorScores.find(score => score.majorCode === majorDetail.code);
        return {
          ...majorDetail,
          score: matchingScore?.score || 0
        };
      });

      return {
        ...result,
        data: enrichedData
      };
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      throw new Error(`批量获取专业信息失败: ${message}`);
    }
  }

  @Post('/intention/:majorCode')
  async addIntention(
    @Param('majorCode') majorCode: string, 
    @Ctx() ctx: { state: { user?: { userId: number } } }
  ): Promise<Intention> {
    try {
      if (!ctx.state.user?.userId) {
        throw new Error('未获取到用户信息');
      }

      const user = await this.userService.findOne(ctx.state.user.userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 检查是否已存在相同的意向记录
      const intentionRepository = AppDataSource.getRepository(Intention);
      const existingIntention = await intentionRepository.findOne({
        where: {
          userId: ctx.state.user.userId,
          majorCode: majorCode
        }
      });

      // 如果已存在，直接返回现有记录
      if (existingIntention) {
        return existingIntention;
      }

      const { province, preferredSubjects, secondarySubjects, score, rank } = user;
      
      // 获取专业详细信息
      const rawData = await this.majorRedisService.getMajorDetail(majorCode);
      if (!rawData) {
        throw new Error('专业信息不存在');
      }

      // 创建并保存意向记录
      const intention = new Intention();
      intention.majorCode = majorCode;
      intention.province = province;
      intention.preferredSubjects = preferredSubjects;
      intention.secondarySubjects = secondarySubjects;
      intention.score = score;
      intention.rank = rank;
      intention.userId = ctx.state.user.userId;

      await intentionRepository.save(intention);
      return intention;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      throw new Error(`添加专业意向失败: ${message}`);
    }
  }

  /**
   * 获取用户的所有专业意向信息
   * @param ctx 上下文对象，包含用户信息
   * @returns 专业意向视图模型数组
   */
  @Get('/intentions')
  async getUserIntentions(
    @Ctx() ctx: { state: { user?: { userId: number } } }
  ): Promise<any> {
    try {
      const user = await this.userService.findOne(ctx.state.user!.userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      const intentions = await AppDataSource.getRepository(Intention).find({
        where: {
          userId: ctx.state.user!.userId
        }
      }); 

      if(intentions.length === 0) {
        return {
          segmentStats: {
            totalCount: 0,
            userRank: user.rank,
            segments: {}
          }
        };
      }
      
      const rank = user.rank;
      const allMajors = await this.majorScoreService.calculateMajorScores(ctx.state.user!.userId.toString(),user!.enrollType || '本科批');
      const majors = allMajors.filter(s=>intentions.map(s=>s.majorCode).includes(s.majorCode));
      // 先获取招生计划数据
      const enrollPlansMap = await this.majorRedisService.getMultipleEnrollPlans(majors.map(s=>s.majorCode), user!.province || '北京',   Number.parseInt(process.env.CURRENT_YEAR || '2025'), user!.enrollType || '本科批', '普通类', user!.preferredSubjects || '综合', user!.secondarySubjects?.split(',') || ['不限']);
    
      // 使用过滤后的专业数据获取详细信息
      const majorDetails = await this.majorRedisService.getMajorDetails(majors.map(s=> s.majorCode),1,majors.length);
      
      // 根据用户信息，从redis中查询专业对应的分数
      const historyScoreMap = await this.majorRedisService.getMultipleMajorScores(majors.map(s=>s.majorCode), user!.province || '北京', user!.preferredSubjects || '综合', user!.secondarySubjects || '');
      // 将 Map 转换为数组格式，便于后续处理
      const historyScore: any[] = [];
      historyScoreMap.forEach((scores, majorCode) => {
        scores.forEach(score => {
          historyScore.push({
            ...score,
            majorCode, 
          });
        });
      }); 


      // 处理每个专业的学校数据，添加历史分数信息并按位次分组排序
      const processedMajorDetails = majorDetails.data.map((majorDetail: any) => { 
        if (!majorDetail.schools || !Array.isArray(majorDetail.schools)) {
          return majorDetail;
        }

        // 获取该专业的历史分数数据
        const majorHistoryScores = historyScore.filter((score: any) => 
          score.majorCode === majorDetail.code
        );

        // 获取该专业的招生计划数据
        const majorEnrollPlans = enrollPlansMap.get(majorDetail.code) || []; 
     
        // 根据 enrollPlans 为 schools 添加 majorGroupId 和 majorGroupName
        if (Array.isArray(majorDetail.schools) && Array.isArray(majorEnrollPlans)) {
          // 为每个学校添加 majorGroupId 和 majorGroupName
          majorDetail.schools = majorDetail.schools.map((school: any) => {
            // 在 enrollPlans 中查找对应的招生计划
            const enrollPlan = majorEnrollPlans.find((plan: any) => plan.schoolCode === school.code);
            return {
              ...school,
              majorGroupId: enrollPlan?.majorGroup || null,
              majorGroupName: enrollPlan?.majorGroupName || null
            };
          });
        }

        // 如果没有位次信息，直接返回原始数据
        if (!rank) {
          return majorDetail;
        }

        // 获取本地批次名称列表
        const localBatchNames = process.env.LOCAL_BATCH_NAME?.split(',') || []; 
        
        // 处理学校数据，添加历史分数信息
        const processedSchools = majorDetail.schools.map((school: any) => {
          const schoolScores = majorHistoryScores.filter((score: any) => 
            score.schoolMajorId === school.id && 
            (user.enrollType === '专科批' 
              ? localBatchNames.includes(score.batch)
              : !localBatchNames.includes(score.batch))
          );
          

          
          // 计算与用户位次的差异百分比
          // 计算位次差异百分比：正值表示学校平均位次比用户位次好，负值表示较差
          const rankDiffPercentage = 0;
          
          // 计算位次差值和位次差值百分比（与2024年位次比较）
          let rankDiff = 0;
          let rankDiffPer = 0;
          
          // 获取2024年的位次数据
          const rank2024 = extractRank(schoolScores.length > 0 ? schoolScores[0].historyScore : null);
          
          if (rank && rank > 0 && rank2024 && rank2024 > 0) {
            // 计算位次差值（2024年位次 - 用户位次）
            rankDiff = rank- rank2024 ;
            // 计算位次差值百分比（差值 / 2024年位次）
            rankDiffPer = rank2024 > 0 ? (rankDiff / rank2024) * 100 : 0;
          }
          
          // 确定分组（基于2024年位次，使用与suitable方法相同的分组逻辑）
          let group = 6; // 默认组（其他位次段）
          let isHighRange = false; // 新增字段：标识是否为较高范围
          
          if (rank2024 && rank2024 > 0 && rank && rank > 0) { // 只对有位次的学校进行分组
            
            // 根据位次差异确定分组
            if (rankDiffPer >= 30 && rankDiffPer <= 100) {
              group = 1; // +30%到+100%位次段
              isHighRange = true; // 30%到100%（较高范围）
            } else if (rankDiffPer >= 5 && rankDiffPer < 30) {
              group = 2; // +5%到+30%位次段
            } else if (rankDiffPer >= -10 && rankDiffPer < 5) {
              group = 3; // （-10%）到+5%位次段
            } else if (rankDiffPer >= -30 && rankDiffPer < -10) {
              group = 4; // （-30%）到（-10%）位次段
            } else if (rankDiffPer >= -100 && rankDiffPer < -30) {
              group = 5; // （-100%）到（-30%）位次段
            } else {
              group = 6; // 其他位次段
            }
          }
          
          return {
            ...school,
            historyScores: schoolScores,
            majorDisplayName: schoolScores.length > 0 ? schoolScores[0].planMajorName : null,
            rankDiffPercentage,
            rankDiff,
            rankDiffPer,
            rank2024,
            group
          };
        });
        
    
        const filteredSchools = processedSchools.filter((school: SchoolWithRank) => 
          school.historyScores && school.historyScores.length > 0
        );

        return {
          ...majorDetail,
          schools: filteredSchools
        };
      }); 

        // 修改后的逻辑：按照专业对学校进行分组，保持专业分组结构
        const majorsWithSchools: any[] = []; 
        processedMajorDetails.forEach((major, index) => {
          if (major.schools && Array.isArray(major.schools)) { 
            // 对每个专业下的学校进行排序
            const sortedSchools = major.schools.sort((a: any, b: any) => {
              const aRankDiff = a.rankDiffPer || 0;
              const bRankDiff = b.rankDiffPer || 0;
              return bRankDiff - aRankDiff;
            });

            // 为每个学校添加专业信息
            const schoolsWithMajorInfo = sortedSchools.map((school: any) => ({
              ...school,
              majorCode: major.code,
              majorName: major.major.name,
            }));

            majorsWithSchools.push({
              majorCode: major.code,
              majorName: major.major.name,
              schools: schoolsWithMajorInfo
            });
          }
        });
 

        // 从专业分组中提取所有学校，将专业信息放到学校里面
        const allSchools: any[] = [];
        majorsWithSchools.forEach(major => {
          major.schools.forEach((school: any) => {
            allSchools.push(school);
          });
        });

        const schoolsWithMajor = allSchools.map(school => ({
          id: school.id,
          schoolName: school.name,
          schoolCode: school.code,
          schoolNature: school.nature,
          rankDiffPercentage: school.rankDiffPercentage,
          rankDiff: school.rankDiff,
          rankDiffPer: school.rankDiffPer,
          group: school.group,
          isHighRange: school.isHighRange,
          historyScores: school.historyScores,
          schoolFeature: school.features,
          schoolType: school.schoolType,
          belong: school.belong,
          category: school.category,
          provinceName: school.provinceName,
          cityName: school.cityName,
          enrollmentRate: school.enrollmentRate,
          employmentRate: school.employmentRate,
          majorGroupNumber: school.majorGroupNumber,
          majorGroupId: school.majorGroupId,
          majorGroupName: school.majorGroupName, 
          // 添加专业信息到学校里面
          major: {
            code: school.majorCode,
            name: school.majorDisplayName || school.majorName,
            displayName: school.majorDisplayName,
            developmentPotential: majors.find(m => m.majorCode === school.majorCode)?.developmentPotential || 0 ,
            score: majors.find(m => m.majorCode === school.majorCode)?.score || 0,
            opportunityScore: majors.find(m => m.majorCode === school.majorCode)?.opportunityScore || 0,
            academicDevelopmentScore: majors.find(m => m.majorCode === school.majorCode)?.academicDevelopmentScore || 0,
            careerDevelopmentScore: majors.find(m => m.majorCode === school.majorCode)?.careerDevelopmentScore || 0,
            growthPotentialScore: majors.find(m => m.majorCode === school.majorCode)?.growthPotentialScore || 0,
            industryProspectsScore: majors.find(m => m.majorCode === school.majorCode)?.industryProspectsScore || 0,
            lexueScore: majors.find(m => m.majorCode === school.majorCode)?.lexueScore || 0,
            shanxueScore: majors.find(m => m.majorCode === school.majorCode)?.shanxueScore || 0,
            yanxueDeduction: majors.find(m => m.majorCode === school.majorCode)?.yanxueDeduction || 0,
            tiaozhanDeduction: majors.find(m => m.majorCode === school.majorCode)?.tiaozhanDeduction || 0  
          }
        }));

        // 计算实际返回的学校数量
        const actualTotal = schoolsWithMajor.length;

        // 构建分组统计信息
        const rankSegments = {
          '1': { name: '+30%到+100%位次段', count: 0, data: [] as any[] },
          '2': { name: '+5%到+30%位次段', count: 0, data: [] as any[] },
          '3': { name: '（-10%）到+5%位次段', count: 0, data: [] as any[] },
          '4': { name: '（-30%）到（-10%）位次段', count: 0, data: [] as any[] },
          '5': { name: '（-100%）到（-30%）位次段', count: 0, data: [] as any[] },
          '6': { name: '其他位次段', count: 0, data: [] as any[] }
        };

        // 统计各分组的学校数量
        schoolsWithMajor.forEach((school: any) => {
          const groupKey = school.group.toString();
          if (rankSegments[groupKey as keyof typeof rankSegments]) {
            rankSegments[groupKey as keyof typeof rankSegments].count++;
          } else {
            rankSegments['6'].count++;
          }
        });

        // 对 schools 进行分组处理
        // const schoolsByGroup = this.transformSchoolsByGroup(schoolsWithMajor);
        
        // 按照不同专业评分维度进行分组
        const schoolsByMajorScore = {
          developmentPotential: this.groupSchoolsByMajorScore(majorsWithSchools, allMajors, 'developmentPotential'),
          score: this.groupSchoolsByMajorScore(majorsWithSchools, allMajors, 'score'),
          opportunityScore: this.groupSchoolsByMajorScore(majorsWithSchools, allMajors, 'opportunityScore'),
          lexueScore: this.groupSchoolsByMajorScore(majorsWithSchools, allMajors, 'lexueScore'),
          shanxueScore: this.groupSchoolsByMajorScore(majorsWithSchools, allMajors, 'shanxueScore'),
          yanxueDeduction: this.groupSchoolsByMajorScore(majorsWithSchools, allMajors, 'yanxueDeduction'),
          tiaozhanDeduction: this.groupSchoolsByMajorScore(majorsWithSchools, allMajors, 'tiaozhanDeduction'),
          academicDevelopmentScore: this.groupSchoolsByMajorScore(majorsWithSchools, allMajors, 'academicDevelopmentScore'),
          careerDevelopmentScore: this.groupSchoolsByMajorScore(majorsWithSchools, allMajors, 'careerDevelopmentScore'),
          industryProspectsScore: this.groupSchoolsByMajorScore(majorsWithSchools, allMajors, 'industryProspectsScore'),
          growthPotentialScore: this.groupSchoolsByMajorScore(majorsWithSchools, allMajors, 'growthPotentialScore')
        };

        // 构建segmentStats - 包含位次分组和专业评分维度分组
        const segmentStats = {
          totalCount: actualTotal,
          userRank: user.rank || 0 
        };
        
        return {  
          segmentStats,
          user: {
            province: user.province,
            preferredSubjects: user.preferredSubjects,
            secondarySubjects: user.secondarySubjects,
            rank: user.rank,
            score: user.score
          },
          schoolsWithMajor,
          schoolsByMajorScore // 新增按专业评分维度分组显示的数据
        };
       

    } catch (error: any) {
      throw new Error('获取推荐专业失败');
    }
  }

  /**
   * 取消专业意向
   * @param majorCode 专业代码
   * @param ctx 上下文对象，包含用户信息
   * @returns 操作结果
   */
  @Delete('/intention/:majorCode')
  async cancelIntention(
    @Param('majorCode') majorCode: string,
    @Ctx() ctx: { state: { user?: { userId: number } } }
  ): Promise<boolean> {
    try {
      if (!ctx.state.user?.userId) {
        throw new Error('未获取到用户信息');
      }

      // 获取意向记录
      const intentionRepository = AppDataSource.getRepository(Intention);
      const intention = await intentionRepository.findOne({
        where: {
          userId: ctx.state.user.userId,
          majorCode: majorCode
        }
      });

      // 如果找不到意向记录
      if (!intention) {
         throw new Error('未找到该专业的意向记录');
      }

      // 删除意向记录
      await intentionRepository.remove(intention);

      return  true;

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      throw new Error(`取消专业意向失败: ${message}`);
    }
  }

  /**
   * 创建备选方案
   * @param ctx 上下文对象，包含用户信息
   * @param body 备选方案信息
   * @returns 创建的备选方案视图模型
   */
  @Post('/alternative')
  async createAlternative(
    @Ctx() ctx: { state: { user?: { userId: number } } },
    @Body() body: {
      majorCode: string;
      majorName: string;
      schoolCode: string;
      schoolName: string;
      schoolFeature: string;
      schoolNature: string;
      enrollmentRate?: number;
      employmentRate?: number;
      majorGroupId?: number;
      majorGroupName?: string;
      group: number;
      historyScore: object;
      selected?: boolean;
    }
  ): Promise<AlternativeViewModel> {
    try {
      if (!ctx.state.user?.userId) {
        throw new Error('未获取到用户信息');
      }

      const user = await this.userService.findOne(ctx.state.user.userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 检查是否已存在相同的方案
      const alternativeRepository = AppDataSource.getRepository(Alternative);
      const existingAlternative = await alternativeRepository.findOne({
        where: {
          userId: ctx.state.user.userId,
          majorCode: body.majorCode,
          schoolCode: body.schoolCode
        }
      });

      if (existingAlternative) {
        throw new Error('已存在相同的专业和学校组合的备选方案');
      }

      // 计算位次差值
      let rankDiff = 0;
      let rankDiffPer = 0;
      
      if (user.rank && user.rank > 0) {
        const year2024Rank = extractRank(body.historyScore);
        if (year2024Rank !== null) {
          // 计算位次差值（用户位次 - 2024年位次）
          rankDiff =  user.rank - year2024Rank;
          // 计算位次差值百分比（差值 / 2024年位次）
          rankDiffPer = year2024Rank > 0 ? (rankDiff / year2024Rank) * 100 : 0;
        }
      }

      // 创建新的备选方案实体
      const alternative = new Alternative();
      alternative.userId = ctx.state.user.userId;
      alternative.majorCode = body.majorCode;
      alternative.majorName = body.majorName;
      alternative.schoolCode = body.schoolCode;
      alternative.schoolName = body.schoolName;
      // 处理字段名不匹配的问题，优先使用schoolFeature，如果没有则使用schoolfeature
      alternative.schoolFeature = body.schoolFeature || '';
      alternative.group = body.group;
      alternative.historyScore = body.historyScore;
      alternative.selected = body.selected || false;
      alternative.enrollmentRate = body.enrollmentRate || 0;
      alternative.employmentRate = body.employmentRate || 0;
      alternative.majorGroupId = body.majorGroupId || 0;
      alternative.majorGroupName = body.majorGroupName || '';
      alternative.rankDiff = rankDiff;
      alternative.rankDiffPer = rankDiffPer;

      // 保存备选方案
      const savedAlternative = await alternativeRepository.save(alternative);

      // 转换为视图模型并返回
      return toAlternativeViewModel(savedAlternative);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      throw new Error(`创建备选方案失败: ${message}`);
    }
  }

  /**
   * 更新备选方案的选中状态
   * @param id 备选方案ID
   * @param ctx 上下文对象，包含用户信息
   * @returns 更新后的备选方案视图模型
   */
  @Post('/alternative/:id/select')
  async selectAlternative(
    @Param('id') id: number,
    @Ctx() ctx: { state: { user?: { userId: number } } }
  ): Promise<AlternativeViewModel> {
    try {
      if (!ctx.state.user?.userId) {
        throw new Error('未获取到用户信息');
      }

      // 获取备选方案
      const alternativeRepository = AppDataSource.getRepository(Alternative);
      const alternative = await alternativeRepository.findOne({
        where: {
          id: id,
          userId: ctx.state.user.userId
        }
      });

      if (!alternative) {
        throw new Error('未找到该备选方案');
      }

      // 更新选中状态
      alternative.selected = true;

      // 保存更新
      const updatedAlternative = await alternativeRepository.save(alternative);

      // 转换为视图模型并返回
      return toAlternativeViewModel(updatedAlternative);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      throw new Error(`更新备选方案选中状态失败: ${message}`);
    }
  }

  /**
   * 取消备选方案的选中状态
   * @param id 备选方案ID
   * @param ctx 上下文对象，包含用户信息
   * @returns 更新后的备选方案视图模型
   */
  @Post('/alternative/:id/unselect')
  async unselectAlternative(
    @Param('id') id: number,
    @Ctx() ctx: { state: { user?: { userId: number } } }
  ): Promise<AlternativeViewModel> {
    try {
      if (!ctx.state.user?.userId) {
        throw new Error('未获取到用户信息');
      }

      // 获取备选方案
      const alternativeRepository = AppDataSource.getRepository(Alternative);
      const alternative = await alternativeRepository.findOne({
        where: {
          id: id,
          userId: ctx.state.user.userId
        }
      });

      if (!alternative) {
        throw new Error('未找到该备选方案');
      }

      // 更新选中状态为false
      alternative.selected = false;

      // 保存更新
      const updatedAlternative = await alternativeRepository.save(alternative);

      // 转换为视图模型并返回
      return toAlternativeViewModel(updatedAlternative);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      throw new Error(`取消备选方案选中状态失败: ${message}`);
    }
  }

  /**
   * 获取用户的所有备选方案
   * @param ctx 上下文对象，包含用户信息
   * @param selected 可选参数，筛选选中状态
   * @param page 页码（从1开始）
   * @param pageSize 每页数量
   * @returns 分页后的备选方案列表
   */
  @Get('/alternatives')
  async getAlternatives(
    @Ctx() ctx: { state: { user?: { userId: number } } },
    @QueryParam('selected') selected?: boolean,
    @QueryParam('page') page: number = 1,
    @QueryParam('pageSize') pageSize: number = 1000
  ): Promise<{
    total: number;
    alternatives: AlternativeViewModel[];
    currentPage: number;
    totalPages: number;
    volunteerCount: number;
    topDevelopmentCount: number;
    topDevelopmentMajors: Array<{
      majorCode: string;
      majorName: string;
      developmentPotential: number;
    }>;
    groupedByDevelopmentPotential: Array<{
      groupId: string;
      description: string;
      count: number;
      alternativeIds: number[];
      rankDiffSubgroups: Array<{
        groupId: string;
        description: string;
        count: number;
        alternativeIds: number[];
      }>;
    }>;
    groupedByRankDiffPer: Array<{
      groupId: string;
      description: string;
      count: number;
      alternativeIds: number[];
    }>;
  }> {
    try {
      if (!ctx.state.user?.userId) {
        throw new Error('未获取到用户信息');
      }

      // 验证分页参数
      if (page < 1) page = 1;
      if (pageSize < 1) pageSize = 1000;
      if (pageSize > 1000) pageSize = 1000; // 限制最大每页数量

      const user = await this.userService.findOne(ctx.state.user.userId);
      const province = user?.province || '';
      const volunteerCount = PROVINCE_VOLUNTEER_COUNT[province] || 0;
      const rank = user?.rank || 0;
      // 构建查询
      const alternativeRepository = AppDataSource.getRepository(Alternative);
      const queryBuilder = alternativeRepository.createQueryBuilder('alternative')
        .leftJoinAndSelect('alternative.school', 'school') // 关联查询学校信息
        .where('alternative.userId = :userId', { userId: ctx.state.user.userId });

      // 如果指定了选中状态，添加筛选条件
      if (selected !== undefined) {
        queryBuilder.andWhere('alternative.selected = :selected', { selected });
      }

      // 获取总记录数
      const total = await queryBuilder.getCount();

      // 计算总页数
      const totalPages = Math.ceil(total / pageSize);

      // 获取当前页数据
      const alternatives = await queryBuilder
        .orderBy('alternative.position', 'ASC')
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getMany();

      
 
      // 获取所有专业代码
      const majorCodes = alternatives.map(alternative => alternative.majorCode);

      // 获取专业分数
      const scores = await this.majorScoreService.calculateMajorScoresByCode(
        ctx.state.user.userId.toString(),
        majorCodes,
        user!.enrollType || '本科批'
      );

      // 构建专业分数映射
      const majorScores: Record<string, number> = {};
      const majorScoreDetails: Record<string, {
        lexueScore?: number;
        shanxueScore?: number;
        yanxueDeduction?: number;
        tiaozhanDeduction?: number;
        opportunityScore?: number;
        academicDevelopmentScore?: number;
        careerDevelopmentScore?: number;
        growthPotentialScore?: number;
        industryProspectsScore?: number;
        developmentPotential?: number;
      }> = {};
      
      scores.forEach(score => {
        majorScores[score.majorCode] = score.score;
        majorScoreDetails[score.majorCode] = {
          lexueScore: score.lexueScore,
          shanxueScore: score.shanxueScore,
          yanxueDeduction: score.yanxueDeduction,
          tiaozhanDeduction: score.tiaozhanDeduction,
          opportunityScore: score.opportunityScore || undefined,
          academicDevelopmentScore: score.academicDevelopmentScore || undefined,
          careerDevelopmentScore: score.careerDevelopmentScore || undefined,
          growthPotentialScore: score.growthPotentialScore || undefined,
          industryProspectsScore: score.industryProspectsScore || undefined,
          developmentPotential: score.developmentPotential
        };
      });

      // 转换为视图模型，并添加分数信息，同时根据rank重新计算group值
      const alternativeViewModels = alternatives.map(alternative => {
        const viewModel = toAlternativeViewModel(alternative);
        
        // 根据rank重新计算group值
        const recalculatedGroup = this.calculateGroupByRank(rank, alternative.historyScore);
        
        return {
          ...viewModel,
          group: recalculatedGroup,
          score: majorScores[alternative.majorCode] || 0,
          developmentPotential: majorScoreDetails[alternative.majorCode]?.developmentPotential || 0 
        };
      });

      // 获取所有专业的发展潜力排名信息（只调用一次）
      const allDevelopmentRankings = await this.majorScoreService.getTopDevelopmentPotentialMajors(
        ctx.state.user.userId.toString(),
        user!.enrollType || '本科批'
      );

      // 获取前20%发展潜力最高的专业，并转换为期望的格式
      const topDevelopmentMajors = allDevelopmentRankings
        .filter(major => major.position === 'top')
        .map(major => ({
          majorCode: major.majorCode,
          majorName: major.majorName,
          developmentPotential: major.developmentpotential || 0
        }));

      // 创建前20%专业代码的Set，用于快速查找
      const topDevelopmentMajorSet = new Set(
        topDevelopmentMajors.map(major => major.majorCode)
      );

      // 统计备选方案中属于前20%发展潜力专业的唯一专业代码数量
      const topDevelopmentCount = new Set(
        alternatives
          .filter(alternative => topDevelopmentMajorSet.has(alternative.majorCode))
          .map(alternative => alternative.majorCode)
      ).size;

      // 按照 developmentPotential 进行分组，复用排名信息
      const groupedByDevelopmentPotential = this.groupAlternativesByDevelopmentPotential(
        alternativeViewModels,
        allDevelopmentRankings
      );

      // 按照 rankDiffPer 进行分组
      const groupedByRankDiffPer = this.groupAlternativesByRankDiffPer(alternativeViewModels);

      return {
        total,
        volunteerCount: volunteerCount,
        alternatives: alternativeViewModels,
        currentPage: page,
        totalPages,
        topDevelopmentCount,
        topDevelopmentMajors,
        groupedByDevelopmentPotential,
        groupedByRankDiffPer
      };

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      throw new Error(`获取备选方案列表失败: ${message}`);
    }
  }

  /**
   * 上移备选方案
   * @param id 备选方案ID
   * @param ctx 上下文对象，包含用户信息
   * @returns 移动后的备选方案视图模型
   */
  @Post('/alternative/:id/move-up')
  async moveAlternativeUp(
    @Param('id') id: number,
    @Ctx() ctx: { state: { user?: { userId: number } } }
  ): Promise<AlternativeViewModel> {
    try {
      if (!ctx.state.user?.userId) {
        throw new Error('未获取到用户信息');
      }

      const alternativeRepository = AppDataSource.getRepository(Alternative);
      
      // 获取要移动的备选方案
      const currentAlternative = await alternativeRepository.findOne({
        where: {
          id: id,
          userId: ctx.state.user.userId
        }
      });

      if (!currentAlternative) {
        throw new Error('未找到该备选方案');
      }

      // 获取用户的所有备选方案，按位置排序
      const allAlternatives = await alternativeRepository.find({
        where: { userId: ctx.state.user.userId },
        order: { position: 'ASC' }
      });

      // 找到当前备选方案在列表中的索引
      const currentIndex = allAlternatives.findIndex(alt => alt.id === id);
      if (currentIndex <= 0) {
        throw new Error('已经是第一个，无法上移');
      }

      // 获取上一个备选方案
      const previousAlternative = allAlternatives[currentIndex - 1];
      
      // 交换位置
      const tempPosition = currentAlternative.position;
      currentAlternative.position = previousAlternative.position || 0;
      previousAlternative.position = tempPosition || 0;

      // 保存两个备选方案
      await alternativeRepository.save([currentAlternative, previousAlternative]);

      // 获取更新后的备选方案
      const updatedAlternative = await alternativeRepository.findOne({
        where: { id: id }
      });

      if (!updatedAlternative) {
        throw new Error('更新备选方案失败');
      }

      // 转换为视图模型并返回
      return toAlternativeViewModel(updatedAlternative);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      throw new Error(`上移备选方案失败: ${message}`);
    }
  }

  /**
   * 下移备选方案
   * @param id 备选方案ID
   * @param ctx 上下文对象，包含用户信息
   * @returns 移动后的备选方案视图模型
   */
  @Post('/alternative/:id/move-down')
  async moveAlternativeDown(
    @Param('id') id: number,
    @Ctx() ctx: { state: { user?: { userId: number } } }
  ): Promise<AlternativeViewModel> {
    try {
      if (!ctx.state.user?.userId) {
        throw new Error('未获取到用户信息');
      }

      const alternativeRepository = AppDataSource.getRepository(Alternative);
      
      // 获取要移动的备选方案
      const currentAlternative = await alternativeRepository.findOne({
        where: {
          id: id,
          userId: ctx.state.user.userId
        }
      });

      if (!currentAlternative) {
        throw new Error('未找到该备选方案');
      }

      // 获取用户的所有备选方案，按位置排序
      const allAlternatives = await alternativeRepository.find({
        where: { userId: ctx.state.user.userId },
        order: { position: 'ASC' }
      });

      // 找到当前备选方案在列表中的索引
      const currentIndex = allAlternatives.findIndex(alt => alt.id === id);
      if (currentIndex === -1 || currentIndex >= allAlternatives.length - 1) {
        throw new Error('已经是最后一个，无法下移');
      }

      // 获取下一个备选方案
      const nextAlternative = allAlternatives[currentIndex + 1];
      
      // 交换位置
      const tempPosition = currentAlternative.position;
      currentAlternative.position = nextAlternative.position || 0;
      nextAlternative.position = tempPosition || 0;

      // 保存两个备选方案
      await alternativeRepository.save([currentAlternative, nextAlternative]);

      // 获取更新后的备选方案
      const updatedAlternative = await alternativeRepository.findOne({
        where: { id: id }
      });

      if (!updatedAlternative) {
        throw new Error('更新备选方案失败');
      }

      // 转换为视图模型并返回
      return toAlternativeViewModel(updatedAlternative);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      throw new Error(`下移备选方案失败: ${message}`);
    }
  }

  /**
   * 删除指定的备选方案
   * @param id 备选方案ID
   * @param ctx 上下文对象，包含用户信息
   * @returns 删除操作是否成功
   */
  @Delete('/alternative/:id')
  async deleteAlternative(
    @Param('id') id: number,
    @Ctx() ctx: { state: { user?: { userId: number } } }
  ): Promise<{ success: boolean }> {
    try {
      if (!ctx.state.user?.userId) {
        throw new Error('未获取到用户信息');
      }

      // 获取备选方案
      const alternativeRepository = AppDataSource.getRepository(Alternative);
      const alternative = await alternativeRepository.findOne({
        where: {
          id: id,
          userId: ctx.state.user.userId
        }
      });

      if (!alternative) {
        throw new Error('未找到该备选方案');
      }

      // 删除备选方案
      await alternativeRepository.remove(alternative);

      return { success: true };

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      throw new Error(`删除备选方案失败: ${message}`);
    }
  }

  /**
   * 根据专业组ID获取专业组信息
   * @param majorGroupId 专业组ID
   * @returns 专业组信息列表
   */
  @Get('/group/:majorGroupId')
  async getMajorGroupInfo(@Param('majorGroupId') majorGroupId: number,
                          @Ctx() ctx: { state: { user?: { userId: number } } }
                        ): Promise< MajorGroupViewModel[]> {
    try {
      // 参数验证
      if (!majorGroupId || majorGroupId <= 0) {
        throw new Error('专业组ID必须为正整数');
      }

      // 调用Redis服务获取专业组信息
      const majorGroupInfo = await this.majorRedisService.getMajorGroupInfo(majorGroupId);

      // 获取专业组内专业的潜能
      const majorCodes = majorGroupInfo.map(major => major.majorCode);
      const userId = ctx.state.user!.userId;
      if (userId) {  
        const user = await this.userService.findOne(userId);
        const majorGroupInfoWithPotential = await this.majorScoreService.calculateMajorScoresByCode(userId.toString(),  majorCodes,user!.enrollType || '本科批');
    
        // 为有潜能的专业设置developmentPotential
        majorGroupInfoWithPotential.forEach(major => {
          const majorInfo = majorGroupInfo.find(m => m.majorCode === major.majorCode);
          if (majorInfo) {
            majorInfo.developmentPotential = major.developmentPotential;
          }   
        });
        
        // 为没有潜能的专业设置developmentPotential为999
        majorGroupInfo.forEach(majorInfo => {
          if (!majorGroupInfoWithPotential.find(m => m.majorCode === majorInfo.majorCode)) {
            majorInfo.developmentPotential = "-";
          }
        });
      } 
      return  toMajorGroupViewModels(majorGroupInfo);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      throw new Error(`获取专业组信息失败: ${message}`);
    }
  }


  /**
   * 根据专业评分维度对学校进行分组
   * @param majorsWithSchools 按专业分组的学校数据
   * @param majors 专业评分数据
   * @param scoreField 评分字段名
   * @returns 分组结果
   */
  private groupSchoolsByMajorScore(majorsWithSchools: any[], majors: any[], scoreField: string) {
    // 按 majors 中的 scoreField 进行排序
    const sortedMajors = [...majors].sort((a, b) => (b[scoreField] || 0) - (a[scoreField] || 0));
    const totalMajors = sortedMajors.length;
    
    // 根据 majors 的排序结果计算分组边界
    const top1Percent = Math.max(1, Math.floor(totalMajors * 0.01));
    const top5Percent = Math.max(1, Math.floor(totalMajors * 0.05));
    const top10Percent = Math.max(1, Math.floor(totalMajors * 0.10));
    const top20Percent = Math.max(1, Math.floor(totalMajors * 0.20));
    const bottom20Percent = Math.max(1, Math.floor(totalMajors * 0.20));
    
    // 创建专业代码到分组的映射
    const majorToGroup = new Map<string, string>();
    
    // 为每个专业分配分组
    sortedMajors.forEach((major, index) => {
      let groupId = '6'; // 默认分组
      
      if (index < top1Percent) {
        groupId = '1';
      } else if (index < top5Percent) {
        groupId = '2';
      } else if (index < top10Percent) {
        groupId = '3';
      } else if (index < top20Percent) {
        groupId = '4';
      } else if (index < totalMajors - bottom20Percent) {
        groupId = '5';
      } else {
        groupId = '6';
      }
      
      majorToGroup.set(major.majorCode, groupId);
    });
    
    // 为每个专业分组下的学校添加对应的分组信息
    const majorsWithGroupedSchools = majorsWithSchools.map(major => {
      const groupId = majorToGroup.get(major.majorCode) || '6';
      const schoolsWithGroupInfo = major.schools.map((school: any) => ({
        ...school,
        groupId: groupId
      }));
      
      return {
        ...major,
        schools: schoolsWithGroupInfo,
        groupId: groupId
      };
    });
    
    // 根据评分字段确定分组名称前缀
    const getGroupPrefix = (field: string) => {
      const fieldMap: { [key: string]: string } = {
        'developmentPotential': '发展潜能',
        'score': '热爱能量',
        'opportunityScore': '机遇指数',
        'lexueScore': '乐学',
        'shanxueScore': '善学',
        'yanxueDeduction': '厌学',
        'tiaozhanDeduction': '阻学',
        'academicDevelopmentScore': '学业发展',
        'careerDevelopmentScore': '职业回报',
        'industryProspectsScore': '产业前景',
        'growthPotentialScore': '成长空间'
      };
      return fieldMap[field] || '评分';
    };
    
    const prefix = getGroupPrefix(scoreField);
    
    // 对每个分组内的学校进行rankSegments处理，包含位次段分组和录取率/就业率分组
    const processRankSegments = (schoolsInGroup: any[]) => {
      const segments = ['1', '2', '3', '4', '5', '6'];
      const result: any = {};
      
      // 生成segment名称 - 根据位次段分组规则
      const getSegmentName = (segment: string) => {
        const segmentNames: { [key: string]: string } = {
          '1': '+30%到+100%位次段',
          '2': '+5%到+30%位次段',
          '3': '（-10%）到+5%位次段',
          '4': '（-30%）到（-10%）位次段',
          '5': '（-100%）到（-30%）位次段',
          '6': '其他位次段'
        };
        return segmentNames[segment] || `分组${segment}`;
      };

      // 计算录取率和就业率的中位数，用于分组
      const calculateMedian = (values: number[]) => {
        if (values.length === 0) return 0;
        const sorted = values.filter(v => v > 0).sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
      };

      // 获取所有学校的录取率和就业率数据
      const enrollmentRates = schoolsInGroup.map(school => school.enrollmentRate || 0);
      const employmentRates = schoolsInGroup.map(school => school.employmentRate || 0);
      
      const enrollmentMedian = calculateMedian(enrollmentRates);
      const employmentMedian = calculateMedian(employmentRates);
      
      // 初始化分组结构
      segments.forEach(segment => {
        result[segment] = {
          groupId: segment,
          name: getSegmentName(segment),
          count: 0,
          ids: [],
          enrollmentRate: [
            { type: "high", name: "录取率前50%", count: 0, ids: [] },
            { type: "low", name: "录取率后50%", count: 0, ids: [] }
          ],
          employmentRate: [
            { type: "high", name: "就业率前50%", count: 0, ids: [] },
            { type: "low", name: "就业率后50%", count: 0, ids: [] }
          ]
        };
      });
      
      // 按 group 分组学校数据，并同时进行录取率和就业率分组
      schoolsInGroup.forEach(school => {
        const groupKey = school.group.toString();
        const targetGroup = result[groupKey] || result['3'];
        
        targetGroup.count++;
        targetGroup.ids.push(school.id);
        
        // 录取率分组
        if (school.enrollmentRate >= enrollmentMedian) {
          targetGroup.enrollmentRate[0].count++;
          targetGroup.enrollmentRate[0].ids.push(school.id);
        } else {
          targetGroup.enrollmentRate[1].count++;
          targetGroup.enrollmentRate[1].ids.push(school.id);
        }
        
        // 就业率分组
        if (school.employmentRate >= employmentMedian) {
          targetGroup.employmentRate[0].count++;
          targetGroup.employmentRate[0].ids.push(school.id);
        } else {
          targetGroup.employmentRate[1].count++;
          targetGroup.employmentRate[1].ids.push(school.id);
        }
      });
      
      // 返回数组格式，每个元素包含完整的分组信息
      return Object.values(result).map((segment: any) => ({
        groupId: segment.groupId,
        name: segment.name,
        count: segment.count,
        ids: segment.ids,
        enrollmentRate: segment.enrollmentRate,
        employmentRate: segment.employmentRate
      }));
    };
    // 根据分组ID收集学校和专业 - 前20%、20%-80%、后20%
    const majorsByGroup = {
      '1': [] as any[],
      '2': [] as any[],
      '3': [] as any[]
    };
    
    // 将专业分配到对应的分组 - 将原来的6个分组映射到3个分组
    majorsWithGroupedSchools.forEach(major => {
      const originalGroupId = major.groupId;
      let newGroupId: string;
      
      // 映射规则：1,2,3,4 -> 1 (前20%)，5 -> 2 (20%-80%)，6 -> 3 (后20%)
      if (['1', '2', '3', '4'].includes(originalGroupId)) {
        newGroupId = '1'; // 前20%
      } else if (originalGroupId === '5') {
        newGroupId = '2'; // 20%-80%
      } else {
        newGroupId = '3'; // 后20%
      }
      
      majorsByGroup[newGroupId as keyof typeof majorsByGroup].push(major);
    });
    
    return [
      {
        groupId: "1",
        description: `${prefix}前20%专业`,
        count: majorsByGroup['1'].length,
        majors: majorsByGroup['1'].map(major => ({
          majorCode: major.majorCode,
          majorName: major.majorName,
          schoolsByRank: processRankSegments(major.schools)
        }))
      },
      {
        groupId: "2", 
        description: `${prefix}20%-80%专业`,
        count: majorsByGroup['2'].length,
        majors: majorsByGroup['2'].map(major => ({
          majorCode: major.majorCode,
          majorName: major.majorName,
          schoolsByRank: processRankSegments(major.schools)
        }))
      },
      {
        groupId: "3",
        description: `${prefix}后20%专业`,
        count: majorsByGroup['3'].length,
        majors: majorsByGroup['3'].map(major => ({
          majorCode: major.majorCode,
          majorName: major.majorName,
          schoolsByRank: processRankSegments(major.schools)
        }))
      }
    ];
  }

  /**
   * 根据发展潜力对备选方案进行分组
   * @param alternatives 备选方案列表
   * @param developmentRankings 专业发展潜力排名信息
   * @returns 分组结果，格式为 {groupId:"1",count:0,data:[]}
   */
  private groupAlternativesByDevelopmentPotential(
    alternatives: AlternativeViewModel[], 
    developmentRankings: Array<{majorCode: string, percentRange: string}>
  ) { 
    // 初始化分组结构 - 前20%、20%-80%、后20%
    const groups = {
      '1': { count: 0, alternativeIds: [] as number[] }, // 前20%
      '2': { count: 0, alternativeIds: [] as number[] }, // 20%-80%
      '3': { count: 0, alternativeIds: [] as number[] }, // 后20%
      '9': { count: 0, alternativeIds: [] as number[] }  // 其他
    };
    
    // 创建专业代码到排名分组的映射
    const majorCodeToGroup = new Map<string, string>();
    developmentRankings.forEach(ranking => {
      majorCodeToGroup.set(ranking.majorCode, ranking.percentRange);
    }); 
    
    // 遍历备选方案，根据专业代码匹配排名分组
    alternatives.forEach(alternative => {
      const originalGroupId = majorCodeToGroup.get(alternative.majorCode);
      let newGroupId: string;
      
      // 映射规则：1,2,3,4 -> 1 (前20%)，5 -> 2 (20%-80%)，6 -> 3 (后20%)
      if (['1', '2', '3', '4'].includes(originalGroupId || '')) {
        newGroupId = '1'; // 前20%
      } else if (originalGroupId === '5') {
        newGroupId = '2'; // 20%-80%
      } else if (originalGroupId === '6') {
        newGroupId = '3'; // 后20%
      } else {
        newGroupId = '9'; // 其他
      }
      
      groups[newGroupId as keyof typeof groups].count++;
      groups[newGroupId as keyof typeof groups].alternativeIds.push(alternative.id);
    });
    
    // 为每个发展潜力分组创建 RankdiffPer 子分组
    const createRankDiffSubgroups = (alternativeIds: number[]) => {
      // 获取这些备选方案
      const relevantAlternatives = alternatives.filter(alt => alternativeIds.includes(alt.id));
      
      // 创建 RankdiffPer 子分组
      const rankDiffSubgroups = {
        '1': { count: 0, alternativeIds: [] as number[] }, // +30%到+100%位次段
        '2': { count: 0, alternativeIds: [] as number[] }, // +5%到+30%位次段
        '3': { count: 0, alternativeIds: [] as number[] }, // （-10%）到+5%位次段
        '4': { count: 0, alternativeIds: [] as number[] }, // （-30%）到（-10%）位次段
        '5': { count: 0, alternativeIds: [] as number[] }, // （-100%）到（-30%）位次段
        '6': { count: 0, alternativeIds: [] as number[] }  // 其他位次段
      };
      
      // 根据 RankdiffPer 值进行子分组
      relevantAlternatives.forEach(alternative => {
        const rankDiffPer = alternative.RankdiffPer || 0;
        
        if (rankDiffPer >= 30 && rankDiffPer <= 100) {
          rankDiffSubgroups['1'].count++;
          rankDiffSubgroups['1'].alternativeIds.push(alternative.id);
        } else if (rankDiffPer >= 5 && rankDiffPer < 30) {
          rankDiffSubgroups['2'].count++;
          rankDiffSubgroups['2'].alternativeIds.push(alternative.id);
        } else if (rankDiffPer >= -10 && rankDiffPer < 5) {
          rankDiffSubgroups['3'].count++;
          rankDiffSubgroups['3'].alternativeIds.push(alternative.id);
        } else if (rankDiffPer >= -30 && rankDiffPer < -10) {
          rankDiffSubgroups['4'].count++;
          rankDiffSubgroups['4'].alternativeIds.push(alternative.id);
        } else if (rankDiffPer >= -100 && rankDiffPer < -30) {
          rankDiffSubgroups['5'].count++;
          rankDiffSubgroups['5'].alternativeIds.push(alternative.id);
        } else {
          rankDiffSubgroups['6'].count++;
          rankDiffSubgroups['6'].alternativeIds.push(alternative.id);
        }
      });
      
      return [
        {
          groupId: "1",
          description: "+30%到+100%位次段",
          count: rankDiffSubgroups['1'].count,
          alternativeIds: rankDiffSubgroups['1'].alternativeIds
        },
        {
          groupId: "2",
          description: "+5%到+30%位次段",
          count: rankDiffSubgroups['2'].count,
          alternativeIds: rankDiffSubgroups['2'].alternativeIds
        },
        {
          groupId: "3",
          description: "（-10%）到+5%位次段",
          count: rankDiffSubgroups['3'].count,
          alternativeIds: rankDiffSubgroups['3'].alternativeIds
        },
        {
          groupId: "4",
          description: "（-30%）到（-10%）位次段",
          count: rankDiffSubgroups['4'].count,
          alternativeIds: rankDiffSubgroups['4'].alternativeIds
        },
        {
          groupId: "5",
          description: "（-100%）到（-30%）位次段",
          count: rankDiffSubgroups['5'].count,
          alternativeIds: rankDiffSubgroups['5'].alternativeIds
        },
        {
          groupId: "6",
          description: "其他位次段",
          count: rankDiffSubgroups['6'].count,
          alternativeIds: rankDiffSubgroups['6'].alternativeIds
        }
      ];
    };
    
    // 返回分组结果，每个分组包含 RankdiffPer 子分组
    return [
      {
        groupId: "1",
        description: "发展潜能前20%专业",
        count: groups['1'].count,
        alternativeIds: groups['1'].alternativeIds,
        rankDiffSubgroups: createRankDiffSubgroups(groups['1'].alternativeIds)
      },
      {
        groupId: "2",
        description: "发展潜能20%-80%专业",
        count: groups['2'].count,
        alternativeIds: groups['2'].alternativeIds,
        rankDiffSubgroups: createRankDiffSubgroups(groups['2'].alternativeIds)
      },
      {
        groupId: "3",
        description: "发展潜能后20%专业",
        count: groups['3'].count,
        alternativeIds: groups['3'].alternativeIds,
        rankDiffSubgroups: createRankDiffSubgroups(groups['3'].alternativeIds)
      }
    ];
  }

  /**
   * 根据位次差值百分比对备选方案进行分组
   * @param alternatives 备选方案列表
   * @returns 分组结果，格式为 {groupId:"1",count:0,data:[]}
   */
  private groupAlternativesByRankDiffPer(alternatives: AlternativeViewModel[]) {
    const total = alternatives.length;
    
    // 按照位次差值百分比范围进行分组
    const rankDiffGroups = {
      '1': { count: 0, alternativeIds: [] as number[] }, // +30%到+100%位次段
      '2': { count: 0, alternativeIds: [] as number[] }, // +5%到+30%位次段
      '3': { count: 0, alternativeIds: [] as number[] }, // （-10%）到+5%位次段
      '4': { count: 0, alternativeIds: [] as number[] }, // （-30%）到（-10%）位次段
      '5': { count: 0, alternativeIds: [] as number[] }, // （-100%）到（-30%）位次段
      '6': { count: 0, alternativeIds: [] as number[] }  // 其他位次段
    };
    
    // 遍历备选方案，根据 rankDiffPer 值进行分组
    alternatives.forEach(alternative => {
      const rankDiffPer = alternative.RankdiffPer || 0;
      
      if (rankDiffPer >= 30 && rankDiffPer <= 100) {
        rankDiffGroups['1'].count++;
        rankDiffGroups['1'].alternativeIds.push(alternative.id);
      } else if (rankDiffPer >= 5 && rankDiffPer < 30) {
        rankDiffGroups['2'].count++;
        rankDiffGroups['2'].alternativeIds.push(alternative.id);
      } else if (rankDiffPer >= -10 && rankDiffPer < 5) {
        rankDiffGroups['3'].count++;
        rankDiffGroups['3'].alternativeIds.push(alternative.id);
      } else if (rankDiffPer >= -30 && rankDiffPer < -10) {
        rankDiffGroups['4'].count++;
        rankDiffGroups['4'].alternativeIds.push(alternative.id);
      } else if (rankDiffPer >= -100 && rankDiffPer < -30) {
        rankDiffGroups['5'].count++;
        rankDiffGroups['5'].alternativeIds.push(alternative.id);
      } else {
        rankDiffGroups['6'].count++;
        rankDiffGroups['6'].alternativeIds.push(alternative.id);
      }
    });
    
    // 返回分组结果
    return [
      {
        groupId: "1",
        description: "+30%到+100%位次段",
        count: rankDiffGroups['1'].count,
        alternativeIds: rankDiffGroups['1'].alternativeIds
      },
      {
        groupId: "2",
        description: "+5%到+30%位次段",
        count: rankDiffGroups['2'].count,
        alternativeIds: rankDiffGroups['2'].alternativeIds
      },
      {
        groupId: "3",
        description: "（-10%）到+5%位次段",
        count: rankDiffGroups['3'].count,
        alternativeIds: rankDiffGroups['3'].alternativeIds
      },
      {
        groupId: "4",
        description: "（-30%）到（-10%）位次段",
        count: rankDiffGroups['4'].count,
        alternativeIds: rankDiffGroups['4'].alternativeIds
      },
      {
        groupId: "5",
        description: "（-100%）到（-30%）位次段",
        count: rankDiffGroups['5'].count,
        alternativeIds: rankDiffGroups['5'].alternativeIds
      },
      {
        groupId: "6",
        description: "其他位次段",
        count: rankDiffGroups['6'].count,
        alternativeIds: rankDiffGroups['6'].alternativeIds
      }
    ];
  }

  private transformSchoolsByGroup(schools: any[]) {
    const segments = ['1', '2', '3', '4', '5', '6'];
    const result: any = {};
    
    // 初始化分组结构
    segments.forEach(segment => {
      result[segment] = {
        count: 0,
        data: []
      };
    });
    
    // 按 group 分组学校数据
    schools.forEach(school => {
      const groupKey = school.group.toString();
      if (result[groupKey]) {
        result[groupKey].count++;
        result[groupKey].data.push(school);
      } else {
        // 如果 group 不在预定义范围内，归类到 group 9
        result['6'].count++;
        result['6'].data.push(school);
      }
    });
    
    // 对每个分组内的数据按 rankDiffPer 排序（从高到低）
    segments.forEach(segment => {
      result[segment].data.sort((a: any, b: any) => {
        const aRankDiff = a.rankDiffPer || 0;
        const bRankDiff = b.rankDiffPer || 0;
        return aRankDiff - bRankDiff;
      });
    });
    
    return result;
  }

  /**
   * 根据用户位次和历史分数重新计算group值
   * @param userRank 用户位次
   * @param historyScore 历史分数对象
   * @returns 重新计算后的group值
   */
  private calculateGroupByRank(userRank: number, historyScore: any): number {
    if (!userRank || userRank <= 0 || !historyScore) {
      return 6; // 默认组（无位次或历史分数）
    }

    // 获取2024年的位次数据
    const rank2024 = extractRank(historyScore);
    
    if (!rank2024 || rank2024 <= 0) {
      return 6; // 默认组（无2024年位次数据）
    }

    // 计算位次差值（用户位次 - 2024年位次）
    const rankDiff = userRank - rank2024;
    
    // 计算位次差值百分比（差值 / 2024年位次）
    const rankDiffPer = rank2024 > 0 ? (rankDiff / rank2024) * 100 : 0;

    // 根据位次差异确定分组
    if (rankDiffPer >= 30 && rankDiffPer <= 100) {
      return 1; // +30%到+100%位次段 
    } else if (rankDiffPer >= 5 && rankDiffPer < 30) {
      return 2; // +5%到+30%位次段
    } else if (rankDiffPer >= -10 && rankDiffPer < 5) {
      return 3; // （-10%）到+5%位次段
    } else if (rankDiffPer >= -30 && rankDiffPer < -10) {
      return 4; // （-30%）到（-10%）位次段
    } else if (rankDiffPer >= -100 && rankDiffPer < -30) {
      return 5; // （-100%）到（-30%）位次段
    } else {
      return 6; // 其他位次段
    }
  }

}