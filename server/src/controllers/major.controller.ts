import { Controller, Get, Param, JsonController } from 'routing-controllers'; 
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
  async getMajorDetail(@Param('code') code: string): Promise<MajorDetailViewModel | {}> {
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

      // 转换为视图模型
      const viewModel = toMajorDetailViewModel(rawData);
      console.log(rawData.majorElementAnalyses);
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

      // 计算所有专业的匹配得分
      const majorScores = await this.majorScoreService.calculateMajorScores(userId);

      // 按总分降序排序，总分相同时按潜力值降序排序
      const sortedScores = majorScores.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return b.potentialScore - a.potentialScore;
      });

      // 判断用户是否已经购买了产品，如果未购买，只提取majorScores数组的前三条和最后三条
      const hasPurchased = user.orders && user.orders.some(order => 
        order.trade_state === 'SUCCESS' || order.trade_state === 'COMPLETED'
      );

      let processedScores = sortedScores;
      if (!hasPurchased && sortedScores.length > 6) {
        // 获取前三条和后三条数据
        const topThree = sortedScores.slice(0, 3);
        const bottomThree = sortedScores.slice(-3);
        processedScores = [...topThree, ...bottomThree];
      }

      return toUserMajorScoresViewModel(userId, processedScores);
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      throw new Error(`计算专业匹配得分失败: ${message}`);
    }
  }
}