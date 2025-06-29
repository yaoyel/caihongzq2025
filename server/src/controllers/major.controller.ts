import { Controller, Ctx, Get, Param, JsonController, QueryParam, Post, Body, Delete } from 'routing-controllers'; 
import { MajorRedisService } from '../services/major.redis.service';
import { MajorDetailViewModel, toMajorDetailViewModel, BaseMajorDetailViewModel } from '../view-models/major.view.model';
import { Service } from 'typedi';
import { MajorScoreService } from '../services/major.service';
import { UserMajorScoresViewModel, toUserMajorScoresViewModel } from '../view-models/major.score.view.model';
import { User } from '../entities/User';
import { AppDataSource } from '../data-source';
import { UserService } from '../services/user.service';
import { SchoolViewModel } from '../view-models/base.school.view.model';
import { Intention } from '../entities/Intention';
import { IntentionViewModel, toIntentionViewModels } from '../view-models/intention.view.model';
import { Alternative } from '../entities/Alternative';
import { AlternativeViewModel, toAlternativeViewModel } from '../view-models/altrmative.view.model';

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
        studyContent: rawData.studyContent,
        seniorTalk: rawData.seniorTalk,
        careerDevelopment: rawData.careerDevelopment,
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
      const scores = await this.majorScoreService.calculateMajorScoresByCode(userId.toString(), [code]);
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

      // 将历年分数数据添加到对应的学校对象中，并按位次分组排序
      if (!rank) {
        console.warn('用户位次信息缺失，将按照默认顺序排序');
        // 转换为视图模型并返回
        const defaultViewModel = toMajorDetailViewModel(rawData);
        if (!defaultViewModel) {
          throw new Error('专业信息格式不正确');
        }
        return defaultViewModel;
      }
      
      // 同school.redis.services.ts中的getAverageRank方法，必须统一
      if (Array.isArray(rawData.schools) && Array.isArray(historyScore)) {
        rawData.schools = rawData.schools.map((school: { id: number } & SchoolViewModel) => {
          const schoolScores = historyScore.filter(score => score.schoolMajorId === school.id);
          const avgRank = this.majorRedisService.getAverageRank(
            schoolScores.length > 0 ? schoolScores[0].historyScore as unknown as string : null
          );
          
          // 计算与用户位次的差异百分比
          // 计算位次差异百分比：正值表示学校平均位次比用户位次好，负值表示较差
          const rankDiffPercentage = avgRank === 0 ? 0 : ((rank - avgRank) / rank) * 100;
          
          // 确定分组
          let group = 0; // 默认组（无分数或差异过大）
          if (avgRank > 0) { // 只对有位次的学校进行分组
            if (rankDiffPercentage > 5 && rankDiffPercentage <= 10) {
              group = 1; // 5%到10%
            } else if (rankDiffPercentage >= -5 && rankDiffPercentage <= 5) {
              group = 2; // -5%到5%（最匹配）
            } else if (rankDiffPercentage >= -15 && rankDiffPercentage < -5) {
              group = 3; // -5%到-15%
            }
          }
          
          return {
            ...school,
            historyScores: schoolScores,
            averageRank: avgRank,
            rankDiffPercentage,
            group
          };
        }).sort((a: SchoolWithRank, b: SchoolWithRank) => {
          // 首先按分组排序（组2最优先，然后是组3，组1，最后是组0）
          const groupOrder = [2, 3, 1, 0];
          const groupDiff = groupOrder.indexOf(a.group || 0) - groupOrder.indexOf(b.group || 0);
          if (groupDiff !== 0) return groupDiff;
          
          // 在同一分组内，按位次差异的绝对值排序（差异越小越靠前）
          if (a.averageRank && b.averageRank) {
            return Math.abs(a.rankDiffPercentage || 0) - Math.abs(b.rankDiffPercentage || 0);
          }
          
          // 如果一个有位次一个没有，有位次的排前面
          if (a.averageRank && !b.averageRank) return -1;
          if (!a.averageRank && b.averageRank) return 1;
          
          return 0;
        });
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
   * 获取用户的专业匹配得分
   * @param userId 用户ID
   * @returns 专业匹配得分视图模型，包含总分和潜力值得分
   */
  @Get('/userscores/:userId')
  async getUserMajorScores(@Param('userId') userId: string): Promise<UserMajorScoresViewModel> {
    try {
      // 参数验证
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

      const {province, preferredSubjects, secondarySubjects} = user; 
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

      // 计算所有专业的匹配得分
      const majorScores = await this.majorScoreService.calculateMajorScores(userId);

      // 将专业分为匹配和不匹配两组
      const matchingScores = majorScores.filter(score => matchingMajorCodeSet.has(score.majorCode));
      const nonMatchingScores = majorScores.filter(score => !matchingMajorCodeSet.has(score.majorCode));

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

      return toUserMajorScoresViewModel(userId, processedScores);
      
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
      const majorScores = await this.majorScoreService.calculateMajorScoresByCode(userId, body.codes);

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

      const { province, preferredSubjects, secondarySubjects, score, rank } = user;
      
      // 获取专业详细信息
      const rawData = await this.majorRedisService.getMajorDetail(majorCode);
      if (!rawData) {
        throw new Error('专业信息不存在');
      }

      // 获取专业历年分数
      const historyScore = await this.majorRedisService.getMajorScores(
        majorCode, 
        province || '北京', 
        preferredSubjects || '综合', 
        secondarySubjects || ''
      );

      // 初始化分组计数
      let group0Count = 0;
      let group1Count = 0;
      let group2Count = 0;
      let group3Count = 0;

      // 计算各分组的学校数量
      if (Array.isArray(rawData.schools) && Array.isArray(historyScore) && rank) {
        rawData.schools.forEach((school: { id: number }) => {
          const schoolScores = historyScore.filter(score => score.schoolMajorId === school.id);
          const avgRank = this.majorRedisService.getAverageRank(
            schoolScores.length > 0 ? schoolScores[0].historyScore as unknown as string : null
          );
          
          if (avgRank > 0) {
            // 计算位次差异百分比
            const rankDiffPercentage = ((rank - avgRank) / rank) * 100;
            
            // 根据差异百分比分组
            if (rankDiffPercentage > 5 && rankDiffPercentage <= 10) {
              group1Count++;
            } else if (rankDiffPercentage >= -5 && rankDiffPercentage <= 5) {
              group2Count++;
            } else if (rankDiffPercentage >= -15 && rankDiffPercentage < -5) {
              group3Count++;
            } else {
              group0Count++;
            }
          } else {
            group0Count++;
          }
        });
      } else {
        // 如果没有位次信息，所有学校都归入group0
        group0Count = rawData.schools?.length || 0;
      }

      // 创建并保存意向记录
      const intention = new Intention();
      intention.majorCode = majorCode;
      intention.province = province;
      intention.preferredSubjects = preferredSubjects;
      intention.secondarySubjects = secondarySubjects;
      intention.score = score;
      intention.rank = rank;
      intention.group0 = group0Count;
      intention.group1 = group1Count;
      intention.group2 = group2Count;
      intention.group3 = group3Count;
      intention.userId = ctx.state.user.userId;

      await AppDataSource.getRepository(Intention).save(intention);
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
  ): Promise<IntentionViewModel[]> {
    try {
      if (!ctx.state.user?.userId) {
        throw new Error('未获取到用户信息');
      }

      // 获取用户的所有意向记录，同时关联查询专业详情和专业基本信息
      const intentionRepository = AppDataSource.getRepository(Intention);
      const intentions = await intentionRepository
        .createQueryBuilder('intention')
        .leftJoinAndSelect('intention.majorDetail', 'majorDetail')
        .leftJoinAndSelect('majorDetail.major', 'major')
        .where('intention.userId = :userId', { userId: ctx.state.user.userId })
        .orderBy('intention.createdAt', 'DESC')
        .getMany();

      // 如果没有意向记录，返回空数组
      if (!intentions.length) {
        return [];
      }

      // 构建专业名称映射
      const majorNames: Record<string, string> = {};
      intentions.forEach(intention => {
        if (intention.majorDetail?.major?.name) {
          majorNames[intention.majorCode] = intention.majorDetail.major.name;
        }
      });

      // 获取专业分数
      const majorCodes = intentions.map(intention => intention.majorCode);
      const scores = await this.majorScoreService.calculateMajorScoresByCode(
        ctx.state.user.userId.toString(),
        majorCodes
      );

      // 构建专业分数映射
      const majorScores: Record<string, number> = {};
      scores.forEach(score => {
        majorScores[score.majorCode] = score.score;
      });

      // 转换为视图模型并返回
      return toIntentionViewModels(intentions, majorNames, majorScores);
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      throw new Error(`获取用户专业意向列表失败: ${message}`);
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

      // 创建新的备选方案实体
      const alternative = new Alternative();
      alternative.userId = ctx.state.user.userId;
      alternative.majorCode = body.majorCode;
      alternative.majorName = body.majorName;
      alternative.schoolCode = body.schoolCode;
      alternative.schoolName = body.schoolName;
      alternative.schoolFeature = body.schoolFeature;
      alternative.group = body.group;
      alternative.historyScore = body.historyScore;
      alternative.selected = body.selected || false;

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
    @QueryParam('pageSize') pageSize: number = 10
  ): Promise<{
    total: number;
    data: AlternativeViewModel[];
    currentPage: number;
    totalPages: number;
  }> {
    try {
      if (!ctx.state.user?.userId) {
        throw new Error('未获取到用户信息');
      }

      // 验证分页参数
      if (page < 1) page = 1;
      if (pageSize < 1) pageSize = 10;
      if (pageSize > 50) pageSize = 50; // 限制最大每页数量

      // 构建查询
      const alternativeRepository = AppDataSource.getRepository(Alternative);
      const queryBuilder = alternativeRepository.createQueryBuilder('alternative')
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
        .orderBy('alternative.createdAt', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getMany();

      // 获取所有专业代码
      const majorCodes = alternatives.map(alternative => alternative.majorCode);

      // 获取专业分数
      const scores = await this.majorScoreService.calculateMajorScoresByCode(
        ctx.state.user.userId.toString(),
        majorCodes
      );

      // 构建专业分数映射
      const majorScores: Record<string, number> = {};
      scores.forEach(score => {
        majorScores[score.majorCode] = score.score;
      });

      // 转换为视图模型，并添加分数信息
      const alternativeViewModels = alternatives.map(alternative => ({
        ...toAlternativeViewModel(alternative),
        score: majorScores[alternative.majorCode] || 0
      }));

      return {
        total,
        data: alternativeViewModels,
        currentPage: page,
        totalPages
      };

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      throw new Error(`获取备选方案列表失败: ${message}`);
    }
  }
}