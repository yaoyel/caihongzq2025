import { GAOKAO_SUBJECT_CONFIG } from '../config/gaokao-subjects';
import { Get, JsonController, Post, Body, Ctx, QueryParam, Param } from 'routing-controllers';
import { Service } from 'typedi';
import RedisModule from '../redis/redis.module';
import { MajorRedisService } from '../services/major.redis.service';
import { UserService } from '../services/user.service';
import { MajorScoreService } from '../services/major.service'; 
import { PROVINCE_VOLUNTEER_COUNT } from '../config/province';
import { extractRank } from '../utils/helper';
 
/**
 * 带排名信息的学校接口
 */
interface SchoolWithRank {
  id: number;
  code: string;
  name: string;
  historyScores?: any[];
  rankDiffPercentage?: number;
  group?: number; 
  [key: string]: any;
}



/**
 * 配置控制器类
 */
@JsonController("/config")
@Service()
export class ConfigController {
  constructor(
    private readonly majorRedisService: MajorRedisService,
    private readonly userService: UserService,
    private readonly majorScoreService: MajorScoreService
  ) {}

  /**
   * 获取高考科目配置信息
   * @returns 返回所有省份的高考科目配置信息
   */
  @Get("/gaokao")
  async getGaoKaoConfig() {
    try {
      return GAOKAO_SUBJECT_CONFIG;
    } catch (error) {
      throw new Error('获取高考配置信息失败');
    }
  }

  /**
   * 获取科目组合
   * @param firstSubject 首选科目
   * @param secondSubjects 次选科目数组
   * @returns 返回所有可能的科目组合
   */
  @Post("/subject-combinations")
  async getSubjectCombinations(
    @Body() body: {
      key: string;
      firstSubject: string;
      secondSubjects?: string[];
    }
  ) {
    try {
      const { key,firstSubject, secondSubjects = [] } = body;
      
      // 调用 RedisModule 的方法获取所有可能的组合
      const combinations =  RedisModule.getMatchingPatterns(key,firstSubject, secondSubjects);
      
      return {
        success: true,
        data: {
          firstSubject,
          secondSubjects,
          combinations
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: '获取科目组合失败',
        message: error?.message || '未知错误'
      };
    }
  }

  /**
   * 获取招生计划数据
   * @param body 请求体参数
   * @returns 返回匹配的招生计划数据
   */
  @Post("/enroll-plans")
  async getEnrollPlans(
    @Body() body: {
      majorCode: string;
      province: string;
      year: number;
      batch: string;
      enrollType: string;
      preferredSubjects: string;
      secondarySubjects: string[];
    }
  ) {
    try {
      const {
        majorCode,
        province,
        year,
        batch,
        enrollType,
        preferredSubjects,
        secondarySubjects
      } = body;

      // 参数验证
      if (!majorCode || !province || !year || !batch || !enrollType || !preferredSubjects) {
        return {
          success: false,
          error: '参数不完整',
          message: '请提供完整的参数信息'
        };
      }

      // 调用 MajorRedisService 的方法获取招生计划
      const enrollPlans = await this.majorRedisService.getEnrollPlans(
        majorCode,
        province,
        year,
        batch,
        enrollType,
        preferredSubjects,
        secondarySubjects || []
      );

      return {
        success: true,
        data: {
          majorCode,
          province,
          year,
          batch,
          enrollType,
          preferredSubjects,
          secondarySubjects: secondarySubjects || [],
          total: enrollPlans.length,
          enrollPlans
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: '获取招生计划失败',
        message: error?.message || '未知错误'
      };
    }
  }

  @Get("/nominate")
  async RecommendMajor(
    @Ctx() ctx: { state: { user?: { userId: number } } },
    @QueryParam('sortByMajor') sortByMajor?: string,
  ) {
    try {
      const user = await this.userService.findOne(ctx.state.user!.userId);
      if (!user) {
        throw new Error('用户不存在');
      }
      
      const rank = user.rank;
      const computeMajors = await this.majorScoreService.getTopDevelopmentPotentialMajors(ctx.state.user!.userId.toString(),user!.enrollType || '本科批');
      const majors = computeMajors.filter(s=> s.lexue_score > 0 && s.position === 'top');
      const buttomMajors =  computeMajors.filter(s => s.position === 'bottom'); 
      const volunteerCount = PROVINCE_VOLUNTEER_COUNT[user.province??""] || 0;
      const recommendCount = volunteerCount * 3;
      // 先获取招生计划数据
      const enrollPlansMap = await this.majorRedisService.getMultipleEnrollPlans(computeMajors.map(s=>s.majorCode), user!.province || '北京',   Number.parseInt(process.env.CURRENT_YEAR || '2025'), user!.enrollType || '本科批', '普通类', user!.preferredSubjects || '综合', user!.secondarySubjects?.split(',') || ['不限']);
   
      // 按照 majorGroup 分组，删除冲突的 majors 数据
      const filteredMajors = this.filterConflictingMajors(majors, buttomMajors, enrollPlansMap);
      // 使用过滤后的专业数据获取详细信息
      const majorDetails = await this.majorRedisService.getMajorDetails(filteredMajors.map(s=> s.majorCode),1,recommendCount);
      
      // 根据用户信息，从redis中查询专业对应的分数
      const historyScoreMap = await this.majorRedisService.getMultipleMajorScores(filteredMajors.map(s=>s.majorCode), user!.province || '北京', user!.preferredSubjects || '综合', user!.secondarySubjects || '');
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
          let group = 9; // 默认组（其他位次段）
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
              group = 9; // 其他位次段
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
            group,
            isHighRange
          };
        });
        
        // 过滤掉 historyScores 数组长度为 0 的学校和2024年位次数据无效的学校
        const filteredSchools = processedSchools.filter((school: SchoolWithRank) => {
          // 检查是否有历史分数数据
          if (!school.historyScores || school.historyScores.length === 0) {
            return false;
          }
          
          // 检查2024年位次数据是否有效
          const rank2024 = school.rank2024;
          if (!rank2024 || rank2024 <= 0) {
            return false;
          }
          
          return true;
        });

        return {
          ...majorDetail,
          schools: filteredSchools
        };
      });

      // 检查是否按照专业排序
      const isSortByMajor = sortByMajor === 'true';
      
      if (isSortByMajor) {
        // 按照专业排序，保持专业分组结构
        const sortedMajorDetails = processedMajorDetails.map((major, index) => {
          const isTopFive = index < 5; // 前五个专业为置顶
          
          // 当 isSortByMajor 为 true 时，过滤掉不在合适范围内的学校
          const filteredSchools = major.schools.filter((school: any) => {
            const rankDiffPer = school.rankDiffPer || 0;
            // 保留在 -100% 到 +100% 范围内的学校
            return rankDiffPer >= -100 && rankDiffPer <= 100;
          });
          
          // 对每个专业内的学校进行排序
          const sortedSchools = filteredSchools.sort((a: any, b: any) => {
            // 首先按 group 排序
            if (a.group !== b.group) {
              return a.group - b.group;
            }
            
            // 组内按照 rankDiffPer 进行排序（从高到低）
            const aRankDiff = a.rankDiffPer || 0;
            const bRankDiff = b.rankDiffPer || 0;
            return bRankDiff - aRankDiff;
          });
          
             return {
              code: major.code,
              name: major.major.name,
              developmentPotential: filteredMajors.find(m => m.majorCode === major.code)?.developmentpotential || 0,
              schools: sortedSchools.map((school: any) => ({
                id: school.id,
                schoolName: school.name,  
                schoolNature: school.nature,
                displayName: school.majorDisplayName,
                schoolCode: school.code, 
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
                majorGroupName: school.majorGroupName
              })),
              isTopFive
            };
        });
        
        // 按专业的发展潜力排序
        const sortedByDevelopmentPotential = sortedMajorDetails.sort((a, b) => {
          const aPotential = filteredMajors.find(m => m.majorCode === a.code)?.developmentpotential || 0;
          const bPotential = filteredMajors.find(m => m.majorCode === b.code)?.developmentpotential || 0;
          return bPotential - aPotential;
        });
        
        // 构建分组统计信息
        const rankSegments = {
          '1': { name: '+30%到+100%位次段', count: 0, data: [] as any[] },
          '2': { name: '+5%到+30%位次段', count: 0, data: [] as any[] },
          '3': { name: '（-10%）到+5%位次段', count: 0, data: [] as any[] },
          '4': { name: '（-30%）到（-10%）位次段', count: 0, data: [] as any[] },
          '5': { name: '（-100%）到（-30%）位次段', count: 0, data: [] as any[] },
          '9': { name: '其他位次段', count: 0, data: [] as any[] }
        };

        // 统计各分组的学校数量
        sortedByDevelopmentPotential.forEach(major => {
          major.schools.forEach((school: any) => {
            const groupKey = school.group.toString();
            if (rankSegments[groupKey as keyof typeof rankSegments]) {
              rankSegments[groupKey as keyof typeof rankSegments].count++;
            } else {
              rankSegments['9'].count++;
            }
          });
        });

        // 构建segmentStats
        const segmentStats = {
          totalCount: sortedByDevelopmentPotential.reduce((total, major) => total + major.schools.length, 0),
          userRank: user.rank || 0,
          segments: {
            '1': { name: '+30%到+100%位次段', count: rankSegments['1'].count },
            '2': { name: '+5%到+30%位次段', count: rankSegments['2'].count },
            '3': { name: '（-10%）到+5%位次段', count: rankSegments['3'].count },
            '4': { name: '（-30%）到（-10%）位次段', count: rankSegments['4'].count },
            '5': { name: '（-100%）到（-30%）位次段', count: rankSegments['5'].count },
            '9': { name: '其他位次段', count: rankSegments['9'].count }
          }
        };

        // 对专业数据进行分组处理
        // const majorsByGroup = this.transformMajorsByGroup(sortedByDevelopmentPotential);
        
        return {  
          segmentStats,
          user: {
            province: user.province,
            preferredSubjects: user.preferredSubjects,
            secondarySubjects: user.secondarySubjects,
            rank: user.rank,
            score: user.score
          },
          volunteerCount,
          recommendCount: sortedByDevelopmentPotential.length,
          total: sortedByDevelopmentPotential.length,
          majors: sortedByDevelopmentPotential, // 返回按专业分组的数据
          // majorsByGroup // 新增按分组显示的专业数据
        };
      } else {

        // 原有的逻辑：将所有学校展开并添加专业信息
        const allSchools: any[] = []; 
        processedMajorDetails.forEach((major, index) => {
          if (major.schools && Array.isArray(major.schools)) {
            const isTopFive = index < 5; // 前五个专业为置顶
            major.schools.forEach((school: any) => {
              allSchools.push({
                ...school,
                majorCode: major.code,
                majorName: major.major.name,
                isTopFive
              });
            });
          }
        });

        // 对所有学校进行统一排序
        const sortedAllSchools = allSchools.sort((a: any, b: any) => {
          // 首先按 isTopFive 排序（置顶的排在前面）
          if (a.isTopFive !== b.isTopFive) {
            return a.isTopFive ? -1 : 1;
          }

 

          // 对于非置顶的学校，按照 group 进行分组，组内按照 rankDiffPer 排序
          if (!a.isTopFive && !b.isTopFive) {
            // 首先按 group 排序
            if (a.group !== b.group) {
              return a.group - b.group;
            }
            
            // 组内按照 rankDiffPer 进行排序（从高到低）
            const aRankDiff = a.rankDiffPer || 0;
            const bRankDiff = b.rankDiffPer || 0;
            return bRankDiff - aRankDiff;
          }

          return 0;
        });

        // 选出置顶的学校和非置顶的学校
        const topFiveSchools = sortedAllSchools.filter(school => 
          school.isTopFive && 
          school.isHighRange && 
          school.features  
        ); 
        const nonTopFiveSchools = sortedAllSchools.filter(school => 
          !school.isTopFive && 
          school.rankDiffPer >= -100 && 
          school.rankDiffPer <= 100
        );
        const selectedNonTopFiveSchools = nonTopFiveSchools;//.slice(0, recommendCount);
        
        // 合并置顶和非置顶学校
        const allSelectedSchools = [...topFiveSchools, ...selectedNonTopFiveSchools];

        // 将专业信息放到学校里面，每个学校单独显示
        const schoolsWithMajor = allSelectedSchools.map(school => ({
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
          isTopFive: school.isTopFive, // 添加 isTopFive 字段
          // 添加专业信息到学校里面
          major: {
            code: school.majorCode,
            name: school.majorDisplayName || school.majorName,
            displayName: school.majorDisplayName,
            developmentPotential: filteredMajors.find(m => m.majorCode === school.majorCode)?.developmentpotential || 0 
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
          '9': { name: '其他位次段', count: 0, data: [] as any[] }
        };

        // 统计各分组的学校数量
        schoolsWithMajor.forEach((school: any) => {
          const groupKey = school.group.toString();
          if (rankSegments[groupKey as keyof typeof rankSegments]) {
            rankSegments[groupKey as keyof typeof rankSegments].count++;
          } else {
            rankSegments['9'].count++;
          }
        });

        // 构建segmentStats
        const segmentStats = {
          totalCount: actualTotal,
          userRank: user.rank || 0,
          segments: {
            '1': { name: '+30%到+100%位次段', count: rankSegments['1'].count },
            '2': { name: '+5%到+30%位次段', count: rankSegments['2'].count },
            '3': { name: '（-10%）到+5%位次段', count: rankSegments['3'].count },
            '4': { name: '（-30%）到（-10%）位次段', count: rankSegments['4'].count },
            '5': { name: '（-100%）到（-30%）位次段', count: rankSegments['5'].count },
            '9': { name: '其他位次段', count: rankSegments['9'].count }
          }
        };

        // 对 schools 进行分组处理
        const schoolsByGroup = this.transformSchoolsByGroup(schoolsWithMajor);
        
        return {  
          segmentStats,
          user: {
            province: user.province,
            preferredSubjects: user.preferredSubjects,
            secondarySubjects: user.secondarySubjects,
            rank: user.rank,
            score: user.score
          },
          volunteerCount,
          recommendCount: actualTotal,
          total: actualTotal, // 更新为实际返回的学校数量
          // schools: schoolsWithMajor, // 保持原有的 schools 数组
          schoolsByGroup // 新增分组显示的数据
        };
      }

    } catch (error: any) {
      throw new Error('获取推荐专业失败');
    }
  }

  

  /**
   * 转换学校数据为指定格式
   * @param school 学校数据
   * @returns 转换后的学校数据
   */
  private transformSchoolData(school: any) {  
    return {
      schoolName: school.schoolName,
      schoolCode: school.schoolCode,
      schoolNature: school.schoolNature,
      rankDiffPercentage: school.rankDiffPercentage,
      rankDiff: school.rankDiff,
      rankDiffPer: school.rankDiffPer,
      group: school.group, 
      historyScores: {
        historyScore: school.historyScores,
        planMajorName: school.planMajorName,
        planNum: school.planNum,
        subjectSelection: school.subjectSelection,
        studyPeriod: school.studyPeriod,
        tuition: school.tuition, 
        majorCode: school.majorCode,
        remark: school.remark,
      },
      schoolFeature: school.schoolFeatures, 
      belong: school.schoolBelong,
      category: school.schoolCategories,
      provinceName: school.provinceName,
      cityName: school.cityName,
      enrollmentRate: school.enrollmentRate,
      employmentRate: school.employmentRate, 
      majorGroupId: school.majorGroupId,
      majorGroupName: school.majorGroupName, 
      major: {
        code: school.majorCode,
        name: school.planMajorName || school.majorName,
        displayName: school.planMajorName
      }
    };
  }

  /**
   * 转换位次段数据
   * @param rankSegments 位次段数据
   * @returns 转换后的位次段数据
   */
  private transformRankSegments(rankSegments: any) {
    const segments = ['1', '2', '3', '4', '5', '9'];
    const result: any = {};
    
    segments.forEach(segment => {
      result[segment] = {
        count: rankSegments[segment].count,
        data: rankSegments[segment].data.map((school: any) => this.transformSchoolData(school))
      };
    });
    
    return result;
  }

  /**
   * 对学校数据进行分组处理
   * @param schools 学校数据数组
   * @returns 按分组组织的学校数据
   */
  private transformSchoolsByGroup(schools: any[]) {
    const segments = ['1', '2', '3', '4', '5', '9'];
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
        result['9'].count++;
        result['9'].data.push(school);
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
   * 过滤冲突的专业数据
   * @param majors 主要专业数据
   * @param buttomMajors 底部专业数据
   * @param enrollPlansMap 招生计划映射
   * @returns 过滤后的专业数据
   */
  private filterConflictingMajors(majors: any[], buttomMajors: any[], enrollPlansMap: Map<string, any[]>) {  
    // 按 majorGroup 分组
    const groupMap = new Map<string, { majors: string[], buttomMajors: string[] }>();   
    // 处理 majors 数据
    majors.forEach(major => { 
      const enrollPlans = enrollPlansMap.get(major.majorCode) || [];
      enrollPlans.forEach(plan => { 
        const majorGroup = plan.majorGroup;
        if (majorGroup) {
          if (!groupMap.has(majorGroup)) {
            groupMap.set(majorGroup, { majors: [], buttomMajors: [] });
          }
          groupMap.get(majorGroup)!.majors.push(major.majorCode);
        }
      });
    });
 
    // 处理 buttomMajors 数据
    buttomMajors.forEach(major => { 
      const enrollPlans = enrollPlansMap.get(major.majorCode) || []; 
      enrollPlans.forEach(plan => { 
        const majorGroup = plan.majorGroup;
        if (majorGroup) {
          if (!groupMap.has(majorGroup)) {
            groupMap.set(majorGroup, { majors: [], buttomMajors: [] });
          }
          groupMap.get(majorGroup)!.buttomMajors.push(major.majorCode);
        }
      });
    });
    
    // 找出冲突的 majorGroup（同时包含 majors 和 buttomMajors）
    const conflictingGroups = new Set<string>();
    groupMap.forEach((value, key) => {
      if (value.majors.length > 0 && value.buttomMajors.length > 0) {
        console.log(key,value.majors,value.buttomMajors);
        conflictingGroups.add(key);
      }
    }); 

    // 过滤掉冲突组中的 majors 数据
    const filteredMajors = majors.filter(major => {
      const enrollPlans = enrollPlansMap.get(major.majorCode) || [];
      return !enrollPlans.some(plan => {
        const majorGroup = plan.majorGroup;
        return majorGroup && conflictingGroups.has(majorGroup);
      });
    });
    
    return filteredMajors;
  }

  /**
   * 对专业数据进行分组处理
   * @param majors 专业数据数组
   * @returns 按分组组织的专业数据
   */
  private transformMajorsByGroup(majors: any[]) {
    const segments = ['1', '2', '3', '4', '5', '9'];
    const result: any = {};
    
    // 初始化分组结构
    segments.forEach(segment => {
      result[segment] = {
        count: 0,
        data: []
      };
    });
    
    // 按 group 分组专业数据
    majors.forEach(major => {
      // 统计该专业下各分组的学校数量
      const groupCounts: { [key: string]: number } = {};
      
      major.schools.forEach((school: any) => {
        const groupKey = school.group.toString();
        groupCounts[groupKey] = (groupCounts[groupKey] || 0) + 1;
      });
      
      // 将专业添加到包含学校最多的分组中
      let maxGroup = '9';
      let maxCount = 0;
      
      Object.keys(groupCounts).forEach(groupKey => {
        if (groupCounts[groupKey] > maxCount) {
          maxCount = groupCounts[groupKey];
          maxGroup = groupKey;
        }
      });
      
      // 如果该分组存在，则添加到该分组
      if (result[maxGroup]) {
        result[maxGroup].count++;
        result[maxGroup].data.push(major);
      } else {
        // 如果分组不存在，归类到 group 9
        result['9'].count++;
        result['9'].data.push(major);
      }
    });
    
    // 对每个分组内的数据按发展潜力排序（从高到低）
    segments.forEach(segment => {
      result[segment].data.sort((a: any, b: any) => {
        const aPotential = a.developmentPotential || 0;
        const bPotential = b.developmentPotential || 0;
        return bPotential - aPotential;
      });
    });
    
    return result;
  }

  /**
   * 获取适合的专业信息
   * @param ctx 上下文，包含用户信息
   * @param group 分组参数，默认为'1'，对应分组：
   *   - '1': +30%到+100%位次段 (默认)
   *   - '2': +5%到+30%位次段
   *   - '3': （-10%）到+5%位次段
   *   - '4': （-30%）到（-10%）位次段
   *   - '5': （-100%）到（-30%）位次段
   *   - '9': 其他位次段
   */
  @Get("/suitability")
  async suitable(
    @Ctx() ctx: { state: { user?: { userId: number } } },
    @QueryParam('group') groupSelected?: string
  ) { 
    try {
      const user = await this.userService.findOne(ctx.state.user!.userId);
      const year = process.env.YEAR || '2025';
      const matchSubjects = await RedisModule.getMatchingPatterns("major_scores",user!.preferredSubjects!, user!.secondarySubjects!.split(',') );
      
      // 处理 matchSubjects 数组，去掉下划线前面的内容，只保留后面的部分
      const processedMatchSubjects = matchSubjects.map((subject: string) => {
        const parts = subject.split('_');
        return parts.length > 1 ? parts.slice(1).join('_') : subject;
      });
      
      // 获取适合的专业信息
      const suitableMajors = await this.majorScoreService.getSuitableMajors(
        user!.province || '北京',
        user!.preferredSubjects || '综合',
        user!.enrollType || '本科批',
        processedMatchSubjects,
        year
      ); 
      
      // 转换数据结构并计算分组信息
      const transformedData = await Promise.all(suitableMajors.map(async (item: any) => {
        // 解析历史分数数据
        const historyScoreData = typeof item.historyscore === 'string' 
          ? JSON.parse(item.historyscore) 
          : item.historyscore;
        
        // 提取2024年位次
        const rank2024 = extractRank(historyScoreData);
  
        
        // 计算排名差异（如果提供了用户位次）
        let rankDiff = 0;
        let rankDiffPer = 0;
        let group = 0;
        let isHighRange = false;
        
        if (user!.rank && rank2024) {
          rankDiff = user!.rank - rank2024;
          rankDiffPer = ((user!.rank - rank2024) / rank2024) * 100;  
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
            group = 9; // 其他位次段
          }
        }
        const result = { 
          schoolName: item.schoolname,
          schoolCode: item.schoolcode,
          schoolNature: item.schoolnature,
          rankDiff,
          rankDiffPer,
          group,
          isHighRange,
          historyScores:  {
            historyScore: item.historyscore
          } ,
          schoolFeatures: item.schoolfeatures, 
          schoolBelong: item.schoolbelong,
          schoolCategories: item.schoolcategories,
          provinceName: item.provincename,
          cityName: item.cityname,
          enrollmentRate: item.enrollmentrate,
          employmentRate: item.employmentrate,
          majorGroupName: item.majorgroupname,
          majorGroupId: item.majorgroup, 
          majorCode: item.majorcode,
          planMajorName: item.planmajorname,
          majorDisplayName: item.planmajorname,
          planNum: item.plannum,
          subjectSelection: item.subjectselection,
          studyPeriod: item.studyperiod,
          tuition: item.tuition, 
          remark: item.remark,
        }; 
        return result;
      }));
      
      // 直接基于转换后的数据进行分组统计
      const rankSegments = {
        '1': { name: '+30%到+100%位次段', count: 0, data: [] as any[] },
        '2': { name: '+5%到+30%位次段', count: 0, data: [] as any[] },
        '3': { name: '（-10%）到+5%位次段', count: 0, data: [] as any[] },
        '4': { name: '（-30%）到（-10%）位次段', count: 0, data: [] as any[] },
        '5': { name: '（-100%）到（-30%）位次段', count: 0, data: [] as any[] },
        '9': { name: '其他位次段', count: 0, data: [] as any[] }
      };

      // 根据已计算的group字段进行分组
      transformedData.forEach(item => {
        const groupKey = item.group.toString();
        if (rankSegments[groupKey as keyof typeof rankSegments]) {
          rankSegments[groupKey as keyof typeof rankSegments].count++;
          rankSegments[groupKey as keyof typeof rankSegments].data.push(item);
        } else {
          rankSegments['9'].count++;
          rankSegments['9'].data.push(item);
        }
      });

      // 对每个分组的数据按rank2024进行升序排序
      Object.keys(rankSegments).forEach(key => {
        rankSegments[key as keyof typeof rankSegments].data.sort((a: any, b: any) => {
          const rankA = a.rankDiffPer || 0;
          const rankB = b.rankDiffPer || 0;
          return rankA - rankB; // 升序排序
        });
      });

      // 构建segmentStats
      const segmentStats = {
        totalCount: transformedData.length,
        userRank: user!.rank || 0,
        segments: {
          '1': { name: '+30%到+100%位次段', count: rankSegments['1'].count },
          '2': { name: '+5%到+30%位次段', count: rankSegments['2'].count },
          '3': { name: '（-10%）到+5%位次段', count: rankSegments['3'].count },
          '4': { name: '（-30%）到（-10%）位次段', count: rankSegments['4'].count },
          '5': { name: '（-100%）到（-30%）位次段', count: rankSegments['5'].count },
          '9': { name: '其他位次段', count: rankSegments['9'].count }
        }
      };
      
      // 确定要返回的分组，默认为2
      const targetGroup = groupSelected || '1';
      const rankSegmentTrans =this.transformRankSegments(rankSegments);
      
      // 转换最终返回的数据结构
      return {
        segmentStats, 
        // 返回指定分组的数据
        targetGroup: targetGroup,
        targetGroupData: rankSegmentTrans[targetGroup as keyof typeof rankSegments] || rankSegments['1']
      };
     
    } catch (error: any) {
      throw new Error('获取推荐专业失败' +error.message) ;
    }
  }
} 
