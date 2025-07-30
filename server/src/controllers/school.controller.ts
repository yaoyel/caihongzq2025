import { Controller, Ctx, Get, JsonController, Param } from 'routing-controllers'; 
import { SchoolRedisService } from '../services/school.redis.services';
import { SchoolViewModel,toSchoolViewModelList } from '../view-models/base.school.view.model';
import { SchoolDetailViewModel, toSchoolDetailViewModel } from '../view-models/school.view.model';
import { Service } from 'typedi';
import { MajorScoreService } from '../services/major.service';
import { UserService } from '../services/user.service';
import { EnrollCharterService } from '../services/enroll-charter.service';

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
  averageRank?: number;
  rankDiffPercentage?: number;
  group?: number;
  historyScore?: any;
}
 
@JsonController('/schools')
@Service()
export class SchoolController {
  constructor(
    private majorScoreService: MajorScoreService,
    private userService: UserService,
    private enrollCharterService: EnrollCharterService
  ) {}

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
    const user = await this.userService.findOne(userId); 
    if (!user) {
      throw new Error('用户不存在');
    }

    const majorRank = await SchoolRedisService.getMajorScores(code, user.province || '', user.rank || 0); 
    // 如果学校有专业信息，计算专业匹配得分
    if (school.majors && school.majors.length > 0) {
      // 获取所有专业代码
      const majorCodes = school.majors.map((major: SchoolMajor) => major.code);
      
      // 计算专业得分
      const majorScores = await this.majorScoreService.calculateMajorScoresByCode(userId.toString(), majorCodes);
      
      // 将得分和排名信息添加到对应的专业信息中
      school.majors = school.majors.map((major: SchoolMajor) => {
        // 查找对应的排名信息
        const rankInfo = majorRank.find(rank => rank.majorcode === major.code);
        
        return {
          ...major,
          score: majorScores.find(score => score.majorCode === major.code)?.score || 0,
          // 添加排名相关信息
          averageRank: rankInfo?.averageRank || 0,
          rankDiffPercentage: rankInfo?.rankDiffPercentage || 0,
          group: rankInfo?.group || 0,
          historyScore: rankInfo?.historyscore || null
        };
      }).sort((a: SchoolMajor, b: SchoolMajor) => {
        // 首先按分组排序（组2最优先，然后是组3，组1，最后是组0）
        const groupOrder = [2, 3, 1, 0];
        const groupDiff = groupOrder.indexOf(a.group || 0) - groupOrder.indexOf(b.group || 0);
        if (groupDiff !== 0) return groupDiff;
        
        // 在同一分组内，按位次差异的绝对值排序
        return Math.abs(a.rankDiffPercentage || 0) - Math.abs(b.rankDiffPercentage || 0);
      });
    }

    // 转换为完整视图模型
    return toSchoolDetailViewModel(school);
  }

  /**
   * 根据学校代码获取招生章程列表
   * @param code 学校代码
   * @returns Promise<EnrollCharters[]> 招生章程列表
   */
  @Get('/:code/charters')
  async getSchoolCharters(@Param('code') code: string): Promise<any[]> {
    try {
      // 验证学校代码是否有效
      const school = await SchoolRedisService.getSchool(code);
      if (!school) {
        throw new Error('学校不存在'); 
      }

      // 获取招生章程列表
      const charters = await this.enrollCharterService.getChartersBySchoolCode(code);
      
      return charters;
       
    } catch (error) { 
      throw new Error('获取招生章程失败');
    }
  } 
 
}
