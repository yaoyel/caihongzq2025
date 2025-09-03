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
  developmentPotential?: number;
  rank2024?: number;
  rankDiffPer?: number;
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
  async getSchoolByCode(@Param('code') code: string, @Ctx() ctx: { state: { user?: { userId: number } } }): Promise<any> { 
    // 获取学校详细信息
    const school = await SchoolRedisService.getSchool(code);
    if (!school) {
      return { code: 404, message: '学校不存在' };
    }
    if (!ctx?.state?.user?.userId) {
      console.error('未获取到用户信息，ctx.state:', ctx.state);
      return { code: 401, message: '未获取到用户信息' };
    }
  
    const userId = ctx.state.user.userId;
    const user = await this.userService.findOne(userId); 
    if (!user) {
      return { code: 404, message: '用户不存在' };
    }

    const majorRank = await SchoolRedisService.getMajorScores(code, user.province || ''); 
    // 如果学校有专业信息，计算专业匹配得分
    if (school.majors && school.majors.length > 0) {
      // 获取所有专业代码
      const majorCodes = school.majors.map((major: SchoolMajor) => major.code);
      
      // 计算专业得分
      const majorScores = await this.majorScoreService.calculateMajorScoresByCode(userId.toString(), majorCodes, user!.enrollType || '本科批');
      
      // 将得分和排名信息添加到对应的专业信息中，并处理分组逻辑
      school.majors = school.majors.map((major: SchoolMajor) => {
        // 查找对应的排名信息
        const rankInfo = majorRank.find(rank => rank.majorcode === major.code);
        // 查找对应的专业得分信息
        const majorScore = majorScores.find(score => score.majorCode === major.code);
        
        // 计算与用户位次的差异百分比
        let rankDiffPer = 0;
        if (user.rank && rankInfo?.rank2024) {
          rankDiffPer = ((user.rank - rankInfo.rank2024) / user.rank) * 100;
        }
        
        // 确定分组 - 业务逻辑放在Controller层
        let group = 6; // 默认组（其他位次段）
        
        if (user.rank && rankInfo?.rank2024) {
          if (rankDiffPer >= 30 && rankDiffPer <= 100) {
            group = 1; // +30%到+100%位次段（学校位次比用户好很多）
          } else if (rankDiffPer >= 5 && rankDiffPer < 30) {
            group = 2; // +5%到+30%位次段（学校位次比用户好一些）
          } else if (rankDiffPer >= -10 && rankDiffPer < 5) {
            group = 3; // （-10%）到+5%位次段（学校位次与用户相近）
          } else if (rankDiffPer >= -30 && rankDiffPer < -10) {
            group = 4; // （-30%）到（-10%）位次段（学校位次比用户差一些）
          } else if (rankDiffPer >= -100 && rankDiffPer < -30) {
            group = 5; // （-100%）到（-30%）位次段（学校位次比用户差很多）
          } else {
            group = 6; // 其他位次段（超出上述范围）
          }
        }
        
        return {
          ...major,
          score: majorScore?.score || 0,
          developmentPotential: majorScore?.developmentPotential || 0,
          // 添加排名相关信息
          averageRank: rankInfo?.averageRank || 0,
          rankDiffPer: rankDiffPer,
          group: group,
          historyScore: rankInfo?.historyscore || null
        };
      }).sort((a: SchoolMajor, b: SchoolMajor) => {
        // 首先按分组排序（组1最优先，然后是组2，组3，组4，组5，最后是组6）
        if ((a.group || 0) !== (b.group || 0)) {
          return (a.group || 0) - (b.group || 0);
        }
        
        // 在同一分组内，按位次差异的绝对值排序（差异越小越靠前）
        return Math.abs(a.rankDiffPer || 0) - Math.abs(b.rankDiffPer || 0);
      });
    }

    // 转换为完整视图模型并返回标准格式
    const schoolDetail = toSchoolDetailViewModel(school);
    return { code: 200, data: schoolDetail };
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
