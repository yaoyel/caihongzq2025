import { MajorViewModel } from './major.view.model';
import { SchoolViewModel, toSchoolViewModel } from './base.school.view.model';

/**
 * 学校详细信息接口
 */
export interface SchoolDetailInfo {
  // 基本信息
  code: string;                       // 学校代码
  briefComment: string;               // 一句话点评
  keyTags: string;                    // 重点标签信息
  historyIntro: string;              // 学校历史及简介
  advantageMajors: string;           // 优势专业
  nationalLabs: string;              // 国家级实验室或项目
  provincialLabs: string;            // 省级实验室或项目
  seniorRecommendations: string;     // 学长推荐
  disadvantages: string;             // 学校槽点
  dataSource: string;                // 数据来源
}

/**
 * 学校专业信息接口
 * 包含专业基本信息和特色信息
 */
export interface SchoolMajorViewModel extends MajorViewModel {
  // 专业特色信息
  isNationalFeature: boolean;   // 国家特色专业
  isProvinceFeature: boolean;   // 省级特色专业
  isImportant: boolean;         // 重点专业
  isFirstClass: boolean;        // 一流专业
  studyPeriod: number;          // 学制
  rank?: number;                // 排名
}

/**
 * 学校完整视图模型接口
 * 包含学校基本信息、详情和专业列表
 */
export interface SchoolDetailViewModel extends SchoolViewModel {
  schoolDetail: SchoolDetailInfo | null;
  majors: SchoolMajorViewModel[];
}

/**
 * 将数据转换为学校详细信息模型
 * @param data 原始数据
 * @returns SchoolDetailInfo
 */
function toSchoolDetailInfo(data: any): SchoolDetailInfo {
  return {
    code: data.code || '',
    briefComment: JSON.stringify(data.briefComment || ''),
    keyTags: JSON.stringify(data.keyTags || ''),
    historyIntro: JSON.stringify(data.historyIntro || ''),
    advantageMajors: JSON.stringify(data.advantageMajors || ''),
    nationalLabs: JSON.stringify(data.nationalLabs || ''),
    provincialLabs: JSON.stringify(data.provincialLabs || ''),
    seniorRecommendations: JSON.stringify(data.seniorRecommendations || ''),
    disadvantages: JSON.stringify(data.disadvantages || ''),
    dataSource: JSON.stringify(data.dataSource || '')
  };
}

/**
 * 将数据转换为学校专业视图模型
 * @param data 原始专业数据
 * @returns SchoolMajorViewModel
 */
function toSchoolMajorViewModel(data: any): SchoolMajorViewModel {
  return {
    ...MajorViewModel.fromEntity(data),
    isNationalFeature: data.isNationalFeature || false,
    isProvinceFeature: data.isProvinceFeature || false,
    isImportant: data.isImportant || false,
    isFirstClass: data.isFirstClass || false,
    studyPeriod: data.studyPeriod || 4,
    rank: data.rank || undefined
  };
}

/**
 * 将数据转换为学校完整视图模型
 * @param data 原始数据
 * @returns SchoolDetailViewModel
 */
export function toSchoolDetailViewModel(data: any): SchoolDetailViewModel {
  return {
    ...toSchoolViewModel(data),
    schoolDetail: data.schoolDetail ? toSchoolDetailInfo(data.schoolDetail) : null,
    majors: data.majors ? data.majors.map(toSchoolMajorViewModel) : []
  };
}

/**
 * 批量转换为学校完整视图模型
 * @param dataList 原始数据列表
 * @returns SchoolDetailViewModel[]
 */
export function toSchoolDetailViewModelList(dataList: any[]): SchoolDetailViewModel[] {
  return dataList.map(data => toSchoolDetailViewModel(data));
}