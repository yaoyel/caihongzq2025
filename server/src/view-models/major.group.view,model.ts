/**
 * 专业组信息视图模型（贫血版本）
 * 只包含数据结构和基本转换功能
 */

/**
 * 专业组信息接口
 */
export interface MajorGroupViewModel { 
  /** 学校代码 */
  schoolCode: string;
  /** 专业代码 */
  majorCode: string; 
  /** 科目类型（如：物理、历史） */
  subjectType: string;
  /** 批次（如：本科批、专科批） */
  batch: string;
  /** 招生人数 */
  num: string;
  /** 考生类型（如：普通类） */
  enrollType: string;
  /** 学制年限（如：四年、三年） */
  studyPeriod: string;
  /** 省份 */
  province: string;
  /** 学费 */
  tuition: string;
  /** 备注信息 */
  remark: string;
  /** 专业组ID */
  majorGroup: number;
  /** 专业组选科要求信息 */
  majorGroupInfo: string;
  /** 专业组名称 */
  majorGroupName: string;
  /** 专业详细名称（包含备注信息） */
  majorNameDetail: string;
  /** 专业名称 */
  majorName: string;
  /** 年份 */
  year: number; 

  developmentPotential: number;
}
  
/**
 * 将原始数据转换为专业组视图模型
 * @param rawData 原始数据
 * @returns 专业组视图模型
 */
export function toMajorGroupViewModel(rawData: any): MajorGroupViewModel {
  return { 
    schoolCode: rawData.schoolCode || '',
    majorCode: rawData.majorCode || '', 
    subjectType: rawData.subjectType || '',
    batch: rawData.batch || '',
    num: rawData.num || '',
    enrollType: rawData.enrollType || '',
    studyPeriod: rawData.studyPeriod || '',
    province: rawData.province || '',
    tuition: rawData.tuition || '',
    remark: rawData.remark || '',
    majorGroup: rawData.majorGroup || 0,
    majorGroupInfo: rawData.majorGroupInfo || '',
    majorGroupName: rawData.majorGroupName || '',
    majorNameDetail: rawData.majorNameDetail || '',
    majorName: rawData.majorName || '',
    year: rawData.year || 0 ,
    developmentPotential: rawData.developmentPotential || 0,
  };
}

/**
 * 将原始数据数组转换为专业组视图模型数组
 * @param rawDataArray 原始数据数组
 * @returns 专业组视图模型数组
 */
export function toMajorGroupViewModels(rawDataArray: any[]): MajorGroupViewModel[] {
  if (!Array.isArray(rawDataArray)) {
    return [];
  }
  
  return rawDataArray.map(item => toMajorGroupViewModel(item));
} 