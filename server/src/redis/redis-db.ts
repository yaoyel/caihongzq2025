import { MajorDetail } from '../entities/MajorDetail';
import { AppDataSource } from '../data-source';
import RedisModule from './redis.module';
import { School } from '../entities/School';

/**
 * 转换专业详情数据结构，提取学校列表和专业要素分析
 * @param majorDetail 原始专业详情数据
 * @returns 转换后的专业详情数据
 */
function transformMajorDetail(majorDetail: MajorDetail): any {
  if (!majorDetail) {
    console.log('警告: majorDetail为空');
    return null;
  }
  
  // 记录原始数据的关键信息
  console.log(`处理专业: ${majorDetail.code}, 名称: ${majorDetail.major?.name || '未知'}`);
  
  // 处理学校信息
  const schools = majorDetail.schoolMajors?.map(sm => ({
    code: sm.school?.code,
    name: sm.school?.name,
    nature: sm.school?.nature,
    level: sm.school?.level,
    belong: sm.school?.belong,
    categories: sm.school?.categories,
    features: sm.school?.features,
    provinceName: sm.school?.provinceName,
    cityName: sm.school?.cityName,
    // 添加专业在该学校的特色信息
    isNationalFeature: sm.isNationalFeature,
    isProvinceFeature: sm.isProvinceFeature,
    isImportant: sm.isImportant,
    isFirstClass: sm.isFirstClass,
    studyPeriod: sm.studyPeriod,
    year: sm.year,
    rank: sm.rank
  })).filter(school => school.code && school.name) || [];
  
  // 处理专业要素分析
  const majorElementAnalyses = majorDetail.majorElementAnalyses?.map(analysis => ({
    id: analysis.id,
    majorDetailId: analysis.majorDetailId,
    type: analysis.type,
    weight: analysis.weight,
    element: {
      id: analysis.element?.id,
      name: analysis.element?.name,
      type: analysis.element?.type,
      dimension: analysis.element?.dimension
    },
    summary: analysis.summary,
    matchReason: analysis.matchReason,
    theoryBasis: analysis.theoryBasis,
    rawInput: analysis.rawInput,
    lastUpdateUser: analysis.lastUpdateUser
  })).filter(analysis => analysis.element?.id && analysis.element?.name) || [];
  
  // 创建新的数据结构，包含所有必要信息
  const transformed = {
    // 基本信息
    id: majorDetail.id,
    code: majorDetail.code,
    // 关联的专业基本信息
    major: {
      code: majorDetail.major?.code,
      name: majorDetail.major?.name
    },
    // 专业详情信息
    educationLevel: majorDetail.educationLevel,
    studyPeriod: majorDetail.studyPeriod,
    awardedDegree: majorDetail.awardedDegree,
    majorBrief: majorDetail.majorBrief,
    studyContent: majorDetail.studyContent,
    seniorTalk: majorDetail.seniorTalk,
    careerDevelopment: majorDetail.careerDevelopment,
    // 关联数据
    schools,
    majorElementAnalyses,
    // 统计信息
    schoolCount: schools.length,
    elementAnalysisCount: majorElementAnalyses.length
  };
  
  // 检查转换后的数据是否包含必要字段
  if (!transformed.code || !transformed.major.name) {
    console.log(`警告: 专业 ${majorDetail.code} 转换后缺少必要字段`);
  }
  
  // 调试信息
  console.log(`专业 ${majorDetail.code} 处理完成:`);
  console.log(`- 关联学校数量: ${transformed.schoolCount}`);
  console.log(`- 专业要素分析数量: ${transformed.elementAnalysisCount}`);
  
  return transformed;
}

/**
 * 将单条专业详情写入Redis缓存
 * @param majorDetail MajorDetail实体对象
 * @returns Promise<void>
 */
export async function setMajorDetailToRedis(majorDetail: MajorDetail): Promise<void> {
  // 获取Redis客户端
  const client = RedisModule.getClient();
  // 使用专业代码作为key
  const key = `major_detail:${majorDetail.code}`;
  // 转换数据结构并序列化为JSON字符串
  const transformed = transformMajorDetail(majorDetail);
  await client.set(key, JSON.stringify(transformed));
}

/**
 * 从Redis读取单条专业详情
 * @param code 专业代码
 * @returns Promise<MajorDetail | null>
 */
export async function getMajorDetailFromRedis(code: string): Promise<MajorDetail | null> {
  const client = RedisModule.getClient();
  const key = `major_detail:${code}`; 
  const data = await client.get(key); 
  if (!data) return null;
  // 反序列化为对象
  return JSON.parse(data) as MajorDetail;
}

/**
 * 将单条专业详情（含关联关系）写入Redis缓存
 * @param code 专业代码
 * @returns Promise<void>
 */
export async function setMajorDetailToRedisByCode(code: string): Promise<void> {
  // 获取数据源和Redis客户端
  const repo = AppDataSource.getRepository(MajorDetail);
  const client = RedisModule.getClient();
  // 查询包含所有关联关系的专业详情
  const majorDetail = await repo.findOne({
    where: { code },
    relations: ['major', 'schoolMajors', 'schoolMajors.school', 'majorElementAnalyses', 'majorElementAnalyses.element'],
  });
  if (!majorDetail) return;
  // 使用专业代码作为key
  const key = `major_detail:${majorDetail.code}`;
  // 转换数据结构并序列化为JSON字符串
  const transformed = transformMajorDetail(majorDetail);
  await client.set(key, JSON.stringify(transformed));
}

/**
 * 批量缓存所有专业详情（含关联关系）到Redis
 * @returns Promise<void>
 */
export async function cacheAllMajorDetails(): Promise<void> {
  const repo = AppDataSource.getRepository(MajorDetail);
  
  // 使用分页查询所有专业详情
  const pageSize = 100; // 每次处理100条数据
  let page = 0;
  let hasMore = true;
  let totalSaved = 0;
  let totalProcessed = 0;
  let totalSkipped = 0;
  
  while (hasMore) {
    // 使用 QueryBuilder 来构建查询
    const allDetails = await repo
      .createQueryBuilder('majorDetail')
      .leftJoinAndSelect('majorDetail.major', 'major')
      .leftJoinAndSelect('majorDetail.schoolMajors', 'schoolMajors')
      .leftJoinAndSelect('schoolMajors.school', 'school')
      .leftJoinAndSelect('majorDetail.majorElementAnalyses', 'majorElementAnalyses')
      .leftJoinAndSelect('majorElementAnalyses.element', 'element')
      .skip(page * pageSize)
      .take(pageSize)
      .getMany();

    console.log(`\n===== 开始处理第 ${page + 1} 页数据 =====`);
    console.log(`本页查询到 ${allDetails.length} 条记录`);
    
    // 调试：打印第一条记录的详细信息
    if (allDetails.length > 0) {
      const firstDetail = allDetails[0];
      console.log('第一条记录信息:');
      console.log('- 专业代码:', firstDetail.code);
      console.log('- 专业名称:', firstDetail.major?.name);
      console.log('- schoolMajors 数量:', firstDetail.schoolMajors?.length);
      if (firstDetail.schoolMajors?.length > 0) {
        const firstSchool = firstDetail.schoolMajors[0].school;
        console.log('- 第一个关联学校信息:', {
          code: firstSchool?.code,
          name: firstSchool?.name,
          nature: firstSchool?.nature,
          level: firstSchool?.level
        });
      }
    }

    // 如果查询结果少于pageSize，说明已经是最后一页
    if (allDetails.length < pageSize) {
      hasMore = false;
    }

    // 处理当前页的数据
    for (const detail of allDetails) {
      totalProcessed++;
      try {
        // 使用专业代码作为key
        const key = `major_detail:${detail.code}`;
        // 转换数据结构并序列化为JSON字符串
        const transformed = transformMajorDetail(detail);
        
        if (transformed) {
          await RedisModule.getClient().set(key, JSON.stringify(transformed));
          totalSaved++;
        } else {
          totalSkipped++;
          console.log(`警告: 专业 ${detail.code} 的数据转换结果为空，已跳过`);
        }
      } catch (error) {
        totalSkipped++;
        console.error(`处理专业 ${detail.code} 时出错:`, error);
      }
    }

    // 增加页码
    page++;
    
    // 打印详细进度
    console.log(`\n当前进度统计:`);
    console.log(`- 总处理数据: ${totalProcessed} 条`);
    console.log(`- 成功保存到Redis: ${totalSaved} 条`);
    console.log(`- 跳过处理: ${totalSkipped} 条`);
    console.log(`- 处理失败: ${totalProcessed - totalSaved - totalSkipped} 条\n`);
  }

  console.log('\n========== 最终统计 ==========');
  console.log(`总处理数据: ${totalProcessed} 条`);
  console.log(`成功保存到Redis: ${totalSaved} 条`);
  console.log(`跳过处理: ${totalSkipped} 条`);
  console.log(`处理失败: ${totalProcessed - totalSaved - totalSkipped} 条`);
}

/**
 * 转换学校数据结构
 * @param school 原始学校数据
 * @returns 转换后的学校数据
 */
function transformSchool(school: School): any {
  if (!school) return null;
  
  // 提取专业信息列表，并包含特色信息
  const majors = school.schoolMajors?.reduce<any[]>((acc, sm) => {
    if (sm.majorDetail?.major) {
      // 将专业基本信息与特色信息合并
      acc.push({
        ...sm.majorDetail.major,
        // 添加特色信息
        isNationalFeature: sm.isNationalFeature,
        isProvinceFeature: sm.isProvinceFeature,
        isImportant: sm.isImportant,
        isFirstClass: sm.isFirstClass,
        studyPeriod: sm.studyPeriod,
        rank: sm.rank
      });
    }
    return acc;
  }, []) || [];
  
  // 创建新的数据结构，去掉schoolMajors，只保留专业基本信息列表
  const { schoolMajors, ...schoolWithoutMajors } = school;
  const transformed = {
    ...schoolWithoutMajors,
    schoolDetail: school.schoolDetail || null,
    majors // 包含特色信息的专业列表
  };
  
  return transformed;
}

/**
 * 将单个学校信息写入Redis缓存
 * @param school School实体对象
 * @returns Promise<void>
 */
export async function setSchoolToRedis(school: School): Promise<void> {
  const client = RedisModule.getClient();
  // 使用学校代码作为key
  const key = `school_detail:${school.code}`;
  // 转换数据结构并序列化为JSON字符串
  const transformed = transformSchool(school);
  await client.set(key, JSON.stringify(transformed));
}

/**
 * 从Redis读取单个学校信息
 * @param code 学校代码
 * @returns Promise<School | null>
 */
export async function getSchoolFromRedis(code: string): Promise<School | null> {
  const client = RedisModule.getClient();
  const key = `school_detail:${code}`;
  const data = await client.get(key);
  if (!data) return null;
  // 反序列化为对象
  return JSON.parse(data) as School;
}

/**
 * 将单个学校信息（含关联关系）写入Redis缓存
 * @param code 学校代码
 * @returns Promise<void>
 */
export async function setSchoolToRedisByCode(code: string): Promise<void> {
  const repo = AppDataSource.getRepository(School);
  const client = RedisModule.getClient();
  // 查询包含所有关联关系的学校信息
  const school = await repo.findOne({
    where: { code },
    relations: [
      'schoolDetail', 
      'schoolMajors', 
      'schoolMajors.majorDetail',
      'schoolMajors.majorDetail.major'
    ],
  });
  if (!school) return;
  // 使用学校代码作为key
  const key = `school_detail:${school.code}`;
  // 转换数据结构并序列化为JSON字符串
  const transformed = transformSchool(school);
  await client.set(key, JSON.stringify(transformed));
}

/**
 * 批量缓存所有学校信息（含关联关系）到Redis
 * @returns Promise<void>
 */
export async function cacheAllSchools(): Promise<void> {
  const repo = AppDataSource.getRepository(School);
  // 查询所有学校信息，包含所有关联关系
  const allSchools = await repo.find({
    relations: [
      'schoolDetail', 
      'schoolMajors',
      'schoolMajors.majorDetail',
      'schoolMajors.majorDetail.major'
    ],
  });
  for (const school of allSchools) {
    // 使用学校代码作为key
    const key = `school_detail:${school.code}`;
    // 转换数据结构并序列化为JSON字符串
    const transformed = transformSchool(school);
    await RedisModule.getClient().set(key, JSON.stringify(transformed));
  }
}

// ========== 启动时自动批量缓存所有专业详情到Redis ==========
(async () => {
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      await cacheAllMajorDetails();
      console.log('所有专业详情已成功缓存到Redis');
    } catch (error) {
      console.error('批量缓存专业详情到Redis时出错：', error);
    }
  })();

// ========== 启动时自动批量缓存所有学校信息到Redis ==========
(async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    await cacheAllSchools();
    console.log('所有学校信息已成功缓存到Redis');
  } catch (error) {
    console.error('批量缓存学校信息到Redis时出错：', error);
  }
})();