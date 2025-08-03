import { GAOKAO_SUBJECT_CONFIG } from '../config/gaokao-subjects';
import { Get, JsonController, Post, Body, Ctx, QueryParam } from 'routing-controllers';
import { Service } from 'typedi';
import RedisModule from '../redis/redis.module';
import { MajorRedisService } from '../services/major.redis.service';
import { UserService } from '../services/user.service';
import { MajorScoreService } from '../services/major.service'; 
import { PROVINCE_VOLUNTEER_COUNT } from '../config/province';

/**
 * 带排名信息的学校接口
 */
interface SchoolWithRank {
  id: number;
  code: string;
  name: string;
  historyScores?: any[];
  averageRank?: number;
  rankDiffPercentage?: number;
  group?: number;
  [key: string]: any;
}

/**
 * 从history_score中提取2024年的位次信息
 * @param historyScore 历史分数数据
 * @returns 2024年的位次，如果不存在或为空则返回null
 */
function extract2024Rank(historyScore: any): number | null {
  if (!historyScore || !Array.isArray(historyScore)) {
    return null;
  }

  // 查找2024年的数据
  const year2024Data = historyScore.find((item: any) => item['2024']);
  if (!year2024Data || !year2024Data['2024']) {
    return null;
  }

  // 解析"分数,位次,招生人数"格式的数据
  const parts = year2024Data['2024'].split(',');
  if (parts.length < 2) {
    return null;
  }

  const rankStr = parts[1].trim();
  // 检查位次是否为空或"-"
  if (!rankStr || rankStr === '-' || rankStr === '') {
    return null;
  }

  const rank = parseInt(rankStr, 10);
  return isNaN(rank) ? null : rank;
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
      const majors = (await this.majorScoreService.getTopDevelopmentPotentialMajors(ctx.state.user!.userId.toString())).filter(s=> s.lexue_score > 0);

      const volunteerCount = PROVINCE_VOLUNTEER_COUNT[user.province??""] || 0;
      const recommendCount = volunteerCount * 3;
      const majorDetails = await this.majorRedisService.getMajorDetails(majors.map(s=> s.majorCode),1,recommendCount);
      
      // 根据用户信息，从redis中查询专业对应的分数
      const historyScoreMap = await this.majorRedisService.getMultipleMajorScores(majors.map(s=>s.majorCode), user!.province || '北京', user!.preferredSubjects || '综合', user!.secondarySubjects || '');

      const enrollPlansMap = await this.majorRedisService.getMultipleEnrollPlans(majors.map(s=>s.majorCode), user!.province || '北京', 2025, '专科批', '普通类', user!.preferredSubjects || '综合', user!.secondarySubjects?.split(',') || ['不限']);
        
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
            (localBatchNames.length === 0 || localBatchNames.includes(score.batch))
          );
          
          const avgRank = this.majorRedisService.getAverageRank(
            schoolScores.length > 0 ? schoolScores[0].historyScore as unknown as string : null
          );
          
          // 计算与用户位次的差异百分比
          // 计算位次差异百分比：正值表示学校平均位次比用户位次好，负值表示较差
          const rankDiffPercentage = avgRank === 0 ? 0 : ((avgRank - rank) / avgRank) * 100;
          
          // 计算位次差值和位次差值百分比（与2024年位次比较）
          let rankDiff = 0;
          let rankDiffPer = 0;
          
          // 获取2024年的位次数据
          const rank2024 = extract2024Rank(schoolScores.length > 0 ? schoolScores[0].historyScore : null);
          
          if (rank && rank > 0 && rank2024 && rank2024 > 0) {
            // 计算位次差值（2024年位次 - 用户位次）
            rankDiff = rank2024 - rank;
            // 计算位次差值百分比（差值 / 2024年位次）
            rankDiffPer = rank2024 > 0 ? (rankDiff / rank2024) * 100 : 0;
          }
          
          // 确定分组（基于平均位次，用于sortByMajor=true时的排序）
          let group = 0; // 默认组（无分数或差异过大）
          if (avgRank > 0) { // 只对有位次的学校进行分组
            // 30%到100%范围使用2024年位次与用户位次比较
            if (rank2024 && rank2024 > 0 && rank && rank > 0) {
              const rankDiffPercentage2024 = ((rank2024 - rank) / rank2024) * 100;
              if (rankDiffPercentage2024 > 30 && rankDiffPercentage2024 <= 100) {
                group = 5; // 30%到100%（较高范围）- 基于2024年位次
              }
            }
            
            // 其他分组使用平均位次比较
            if (group === 0) { // 如果还没有分组，继续使用平均位次判断
              if (rankDiffPercentage > 5 && rankDiffPercentage <= 30) {
                group = 1; // 5%到30%（稍高）
              } else if (rankDiffPercentage >= -10 && rankDiffPercentage <= 5) {
                group = 2; // -10%到5%（最匹配）
              } else if (rankDiffPercentage >= -30 && rankDiffPercentage < -10) {
                group = 3; // -30%到-10%（稍低）
              } else if (rankDiffPercentage >= -100 && rankDiffPercentage < -30) {
                group = 4; // -100%到-30%（较低范围）- 新增
              }
            }
          }
          
          return {
            ...school,
            historyScores: schoolScores,
            majorDisplayName: schoolScores.length > 0 ? schoolScores[0].planMajorName : null,
            averageRank: avgRank,
            rankDiffPercentage,
            rankDiff,
            rankDiffPer,
            rank2024,
            group
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
          
          // 对每个专业内的学校进行排序
          const sortedSchools = major.schools.sort((a: any, b: any) => {
            // 首先按 group 排序（group 5 排在前面）
            if (a.group !== b.group) {
              return (b.group || 0) - (a.group || 0);
            }
            
            // 对于 group 5 的学校，优先显示国家级特征的学校
            if (a.group === 5 && b.group === 5) {
              const aIsValid = a.features && (
                a.features.includes('国家级示范') || 
                a.features.includes('国家级骨干')
              );
              const bIsValid = b.features && (
                b.features.includes('国家级示范') || 
                b.features.includes('国家级骨干')
              );
              
              if (aIsValid !== bIsValid) {
                return aIsValid ? -1 : 1;
              }
              
              // 如果都有效，按 averageRank 从高到低排序
              if (aIsValid && bIsValid) {
                return (b.averageRank || 0) - (a.averageRank || 0);
              }
            }
            
            // 优先显示 rankDiffPercentage 在 -30% 到 30% 范围内的学校
            const aRankDiff = a.rankDiffPercentage || 0;
            const bRankDiff = b.rankDiffPercentage || 0;
            
            const aInRange = aRankDiff >= -30 && aRankDiff <= 30;
            const bInRange = bRankDiff >= -30 && bRankDiff <= 30;  
            
            // 如果两个学校都在范围内，按 rankDiffPercentage 从高到低排序
            if (aInRange && bInRange) {
              return bRankDiff - aRankDiff;
            }
            
            // 如果只有一个在范围内，在范围内的排在前面
            if (aInRange && !bInRange) return -1;
            if (!aInRange && bInRange) return 1;
            
            // 如果都不在范围内，按 rankDiffPercentage 从高到低排序
            if (!aInRange && !bInRange) {
              return bRankDiff - aRankDiff;
            }
            
            return 0;
          });
          
             return {
              code: major.code,
              name: major.major.name,
              developmentPotential: majors.find(m => m.majorCode === major.code)?.developmentpotential || 0,
              schools: sortedSchools.map((school: any) => ({
                id: school.id,
                name: school.name,  
                schoolNature: school.nature,
                displayName: school.majorDisplayName,
                schoolCode: school.code, 
                averageRank: school.averageRank,
                rankDiffPercentage: school.rankDiffPercentage,
                rankDiff: school.rankDiff,
                rankDiffPer: school.rankDiffPer,
                group: school.group,
                historyScores: school.historyScores,
                schoolFeature: school.features,
                schoolType: school.schoolType,
                belong: school.belong,
                category: school.category,
                prvinceName: school.prvinceName,
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
          const aPotential = majors.find(m => m.majorCode === a.code)?.developmentpotential || 0;
          const bPotential = majors.find(m => m.majorCode === b.code)?.developmentpotential || 0;
          return bPotential - aPotential;
        });
        
        return {  
          user: {
            province: user.province,
            preferredSubjects: user.preferredSubjects,
            secondarySubjects: user.secondarySubjects,
            rank: user.rank,
            score: user.score
          },
          volunteerCount,
          recommendCount,
          total: sortedByDevelopmentPotential.length,
          majors: sortedByDevelopmentPotential // 返回按专业分组的数据
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

          // 对于置顶的学校，筛选 group 为 5 且包含国家级特征的学校
          if (a.isTopFive && b.isTopFive) {
            const aIsValid = a.group === 5 && a.features && (
              a.features.includes('国家级示范') || 
              a.features.includes('国家级骨干')
            );
            const bIsValid = b.group === 5 && b.features && (
              b.features.includes('国家级示范') || 
              b.features.includes('国家级骨干')
            );
            
            if (aIsValid !== bIsValid) {
              return aIsValid ? -1 : 1;
            }
            
            // 如果都有效，按2024年录取位次从高到低排序
            if (aIsValid && bIsValid) {
              // 获取2024年位次
              const aRank2024 = extract2024Rank(a.historyScores?.length > 0 ? a.historyScores[0].historyScore : null);
              const bRank2024 = extract2024Rank(b.historyScores?.length > 0 ? b.historyScores[0].historyScore : null);
              
              // 从高到低排序（位次数值越小越好）
              return (aRank2024 || 0) - (bRank2024 || 0);
            }
          }

            // 对于非置顶的学校，优先显示 rankDiffPercentage 在 -30% 到 30% 范围内的学校
            if (!a.isTopFive && !b.isTopFive) {
              // 首先将 averageRank 为 0 的排在后面
              if ((a.averageRank || 0) === 0 && (b.averageRank || 0) !== 0) return 1;
              if ((b.averageRank || 0) === 0 && (a.averageRank || 0) !== 0) return -1;
              
              // 使用已存储的2024年位次数据
              const aRank2024 = a.rank2024 || 0;
              const bRank2024 = b.rank2024 || 0;
              
              const aRankDiff = aRank2024 && rank ? ((aRank2024 - rank) / aRank2024) * 100 : 0;
              const bRankDiff = bRank2024 && rank ? ((bRank2024 - rank) / bRank2024) * 100 : 0;
              
              const aInRange = aRankDiff >= -30 && aRankDiff <= 30;
              const bInRange = bRankDiff >= -30 && bRankDiff <= 30;  
            
            // 如果两个学校都在范围内，按 rankDiffPercentage 从高到低排序
            if (aInRange && bInRange) {
              const aRank2024 = extract2024Rank(a.historyScores?.length > 0 ? a.historyScores[0].historyScore : null);
              const bRank2024 = extract2024Rank(b.historyScores?.length > 0 ? b.historyScores[0].historyScore : null);
              
              // 从高到低排序（位次数值越小越好）
              return (aRank2024 || 0) - (bRank2024 || 0);
            }
            
            // 如果只有一个在范围内，在范围内的排在前面
            if (aInRange && !bInRange) return -1;
            if (!aInRange && bInRange) return 1;
            
            // 如果都不在范围内，按 rankDiffPercentage 从高到低排序
            if (!aInRange && !bInRange) {
              return bRankDiff - aRankDiff;
            }
            
            // 如果有 enrollmentRate 和 employmentRate，按照 employmentRate*0.5 + enrollmentRate*0.5 倒序
            if (a.enrollmentRate && a.employmentRate && b.enrollmentRate && b.employmentRate) {
              const scoreA = (a.employmentRate * 0.5) + (a.enrollmentRate * 0.5);
              const scoreB = (b.employmentRate * 0.5) + (b.enrollmentRate * 0.5);
              return scoreB - scoreA;
            }
            
            // 如果没有，按照 features 中的国家级标识排序
            const getFeatureScore = (feature: string) => {
              if (feature.includes('国家级示范')) return 3;
              if (feature.includes('国家级骨干')) return 2;
              if (feature.includes('双高计划')) return 1;
              return 0;
            };
            
            const scoreA = getFeatureScore(a.features || '');
            const scoreB = getFeatureScore(b.features || '');
            
            if (scoreA !== scoreB) {
              return scoreB - scoreA;
            }
            
            // 如果 features 分数相同，其他 features 排在后面
            const hasNationalFeatureA = scoreA > 0;
            const hasNationalFeatureB = scoreB > 0;
            
            if (hasNationalFeatureA !== hasNationalFeatureB) {
              return hasNationalFeatureA ? -1 : 1;
            }
          }

          return 0;
        });

        // 选出置顶的学校和非置顶的学校
        const topFiveSchools = sortedAllSchools.filter(school => 
          school.isTopFive && 
          school.group === 5 && 
          school.features && (
            school.features.includes('国家级示范') || 
            school.features.includes('国家级骨干')
          )
        );
        const nonTopFiveSchools = sortedAllSchools.filter(school => 
          !school.isTopFive && 
          school.rankDiffPer >= -30 && 
          school.rankDiffPer <= 30
        );
        const selectedNonTopFiveSchools = nonTopFiveSchools;//.slice(0, recommendCount);
        
        // 合并置顶和非置顶学校
        const allSelectedSchools = [...topFiveSchools, ...selectedNonTopFiveSchools];

        // 将专业信息放到学校里面，每个学校单独显示
        const schoolsWithMajor = allSelectedSchools.map(school => ({
          id: school.id,
          name: school.name,
          schoolCode: school.code,
          schoolNature: school.nature,
          averageRank: school.averageRank,
          rankDiffPercentage: school.rankDiffPercentage,
          rankDiff: school.rankDiff,
          rankDiffPer: school.rankDiffPer,
          group: school.group,
          historyScores: school.historyScores,
          schoolFeature: school.features,
          schoolType: school.schoolType,
          belong: school.belong,
          category: school.category,
          prvinceName: school.prvinceName,
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
            developmentPotential: majors.find(m => m.majorCode === school.majorCode)?.developmentpotential || 0 
          }
        }));

        // 计算实际返回的学校数量
        const actualTotal = schoolsWithMajor.length;

        return {  
          user: {
            province: user.province,
            preferredSubjects: user.preferredSubjects,
            secondarySubjects: user.secondarySubjects,
            rank: user.rank,
            score: user.score
          },
          volunteerCount,
          recommendCount:actualTotal,
          total: actualTotal, // 更新为实际返回的学校数量
          schools: schoolsWithMajor // 改为 schools 数组，每个学校单独显示
        };
      }

    } catch (error: any) {
      throw new Error('获取推荐专业失败');
    }
  }
}
