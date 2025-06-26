import { Controller, Ctx, Get, Param, JsonController, QueryParam } from 'routing-controllers'; 
import { MajorRedisService } from '../services/major.redis.service';
import { MajorDetailViewModel, toMajorDetailViewModel, BaseMajorDetailViewModel } from '../view-models/major.view.model';
import { Service } from 'typedi';
import { ScaleService } from '../services/scale.service';
import { MajorScoreService } from '../services/major.service';
import { UserMajorScoresViewModel, toUserMajorScoresViewModel } from '../view-models/major.score.view.model';
import { getRepository } from 'typeorm';
import { User } from '../entities/User';
import { Order } from '../entities/Order';
import { AppDataSource } from '../data-source';
import { UserService } from '../services/user.service';
import { PROVINCE_CODE_TO_NAME } from '../config/province';
import { SchoolViewModel } from '../view-models/base.school.view.model';

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
 * 专业信息控制器
 */ 
@JsonController('/majors')
@Service()
export class MajorController {
  constructor(
    private readonly majorRedisService: MajorRedisService,
    private readonly userScaleService: ScaleService,
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

      console.log(PROVINCE_CODE_TO_NAME[user!.province || '11'],user!.preferredSubjects);
      
      // 根据用户信息，从redis中查询专业对应的分数
      const historyScore = await this.majorRedisService.getMajorScores(code, PROVINCE_CODE_TO_NAME[user!.province || '11'], user!.preferredSubjects || '综合', user.enrollType || '本科批');

      // 将历年分数数据添加到对应的学校对象中
      if (Array.isArray(rawData.schools) && Array.isArray(historyScore)) {
        rawData.schools = rawData.schools.map((school: { id: number } & SchoolViewModel) => {
          const schoolScores = historyScore.filter(score => score.schoolMajorId === school.id);
          return {
            ...school,
            historyScores: schoolScores
          };
        });
      }
      
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

      // 对匹配的专业按分数和潜力值排序
      const sortedMatchingScores = matchingScores.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return b.potentialScore - a.potentialScore;
      });

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
}