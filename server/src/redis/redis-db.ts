import { MajorDetail } from '../entities/MajorDetail';
import { AppDataSource } from '../data-source';
import RedisModule from './redis.module';
import { School } from '../entities/School';

/**
 * 转换专业详情数据结构，提取学校列表
 * @param majorDetail 原始专业详情数据
 * @returns 转换后的专业详情数据
 */
function transformMajorDetail(majorDetail: MajorDetail): any {
  if (!majorDetail) return null;
  
  // 提取学校列表
  const schools = majorDetail.schoolMajors?.map(sm => sm.school) || [];
  
  // 创建新的数据结构
  const transformed = {
    ...majorDetail,
    schools, // 添加schools字段
    schoolMajors: undefined // 移除原有的schoolMajors
  };
  
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
  // 查询所有专业详情，包含所有关联关系
  const allDetails = await repo.find({
    relations: ['major', 'schoolMajors', 'schoolMajors.school', 'majorElementAnalyses', 'majorElementAnalyses.element'],
  });
  for (const detail of allDetails) {
    // 使用专业代码作为key
    const key = `major_detail:${detail.code}`;
    // 转换数据结构并序列化为JSON字符串
    const transformed = transformMajorDetail(detail);
    await RedisModule.getClient().set(key, JSON.stringify(transformed));
  }
}

/**
 * 转换学校数据结构
 * @param school 原始学校数据
 * @returns 转换后的学校数据
 */
function transformSchool(school: School): any {
  if (!school) return null;
  
  // 只提取专业基本信息列表
  const majors = school.schoolMajors?.reduce<any[]>((acc, sm) => {
    if (sm.majorDetail?.major) {
      acc.push(sm.majorDetail.major);
    }
    return acc;
  }, []) || [];
  
  // 创建新的数据结构，去掉schoolMajors，只保留专业基本信息列表
  const { schoolMajors, ...schoolWithoutMajors } = school;
  const transformed = {
    ...schoolWithoutMajors,
    schoolDetail: school.schoolDetail || null,
    majors // 只保存专业基本信息列表
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
  const key = `school:${school.code}`;
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
  const key = `school:${code}`;
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
  const key = `school:${school.code}`;
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
    const key = `school:${school.code}`;
    // 转换数据结构并序列化为JSON字符串
    const transformed = transformSchool(school);
    await RedisModule.getClient().set(key, JSON.stringify(transformed));
  }
}

// ========== 启动时自动批量缓存所有专业详情到Redis ==========
// (async () => {
//     try {
//       if (!AppDataSource.isInitialized) {
//         await AppDataSource.initialize();
//       }
//       await cacheAllMajorDetails();
//       console.log('所有专业详情已成功缓存到Redis');
//     } catch (error) {
//       console.error('批量缓存专业详情到Redis时出错：', error);
//     }
//   })();

// // ========== 启动时自动批量缓存所有学校信息到Redis ==========
// (async () => {
//   try {
//     if (!AppDataSource.isInitialized) {
//       await AppDataSource.initialize();
//     }
//     await cacheAllSchools();
//     console.log('所有学校信息已成功缓存到Redis');
//   } catch (error) {
//     console.error('批量缓存学校信息到Redis时出错：', error);
//   }
// })();