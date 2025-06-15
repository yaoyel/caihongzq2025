import { Controller, Get, Param, JsonController } from 'routing-controllers'; 
import { MajorRedisService } from '../services/major.redis.service';
import { MajorDetailViewModel, toMajorDetailViewModel } from '../view-models/major.view.model';
import { Service } from 'typedi';
import { ScaleService } from '../services/scale.service';
import { MajorScoreService } from '../services/major.service';
import { UserMajorScoresViewModel, toUserMajorScoresViewModel } from '../view-models/major.score.view.model';

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
   * @returns 专业匹配得分视图模型
   */
  @Get('/userscores/:userId')
  async getUserMajorScores(@Param('userId') userId: string): Promise<UserMajorScoresViewModel> {
    try {
      // 参数验证
      if (!userId) {
        throw new Error('用户ID不能为空');
      }

      // 计算所有专业的匹配得分
      const majorScores = await this.majorScoreService.calculateMajorScores(userId);

      // 按得分降序排序并转换为视图模型
      const sortedScores = majorScores.sort((a, b) => b.score - a.score);
      return toUserMajorScoresViewModel(userId, sortedScores);
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      throw new Error(`计算专业匹配得分失败: ${message}`);
    }
  }
}