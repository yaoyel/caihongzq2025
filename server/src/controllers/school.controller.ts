import { Controller, Ctx, Get, JsonController, Param } from 'routing-controllers'; 
import { SchoolRedisService } from '../services/school.redis.services';
import { SchoolViewModel,toSchoolViewModelList } from '../view-models/base.school.view.model';
import { SchoolDetailViewModel, toSchoolDetailViewModel } from '../view-models/school.view.model';
import { Service } from 'typedi';
import { MajorScoreService } from '../services/major.service';

/**
 * 学校专业信息接口
 */
interface SchoolMajor {
  id: number;
  name: string;
  code: string;
  eduLevel: string;
  level: number;
  parentId: number;
  isNationalFeature: boolean;
  isProvinceFeature: boolean;
  isImportant: boolean;
  isFirstClass: boolean;
  studyPeriod: string;
  score?: number;
}
 
@JsonController('/schools')
@Service()
export class SchoolController {
  constructor(private majorScoreService: MajorScoreService) {}

  /**
   * 获取所有学校的基本信息
   * @returns Promise<BaseSchoolViewModel[]>
   */
  @Get() 
  async getAllSchools(): Promise<SchoolViewModel[]> {
    // 从Redis获取原始数据
    const schools = await SchoolRedisService.getAllSchools();
    // 转换为基础视图模型
    return toSchoolViewModelList(schools);
  }

  /**
   * 获取指定学校的详细信息
   * @param code 学校代码
   * @returns Promise<SchoolViewModel>
   */
  @Get('/:code') 
  async getSchoolByCode(@Param('code') code: string, @Ctx() ctx: { state: { user?: { userId: number } } }): Promise<SchoolDetailViewModel | {}> { 
    // 获取学校详细信息
    const school = await SchoolRedisService.getSchool(code);
    if (!school) {
      return {};
    }
    if (!ctx?.state?.user?.userId) {
      console.error('未获取到用户信息，ctx.state:', ctx.state);
      return { code: 401, message: '未获取到用户信息' };
    }
  
    const userId = ctx.state.user.userId;

    // 如果学校有专业信息，计算专业匹配得分
    if (school.majors && school.majors.length > 0) {
      // 获取所有专业代码
      const majorCodes = school.majors.map((major: SchoolMajor) => major.code);
      
      // 计算专业得分
      const majorScores = await this.majorScoreService.calculateMajorScoresByCode(userId.toString(), majorCodes);
      
      // 将得分添加到对应的专业信息中
      school.majors = school.majors.map((major: SchoolMajor) => ({
        ...major,
        score: majorScores.find(score => score.majorCode === major.code)?.score || 0
      }));
    }

    // 转换为完整视图模型
    return toSchoolDetailViewModel(school);
  }
}
