import { SchoolDetail } from "../entities/SchoolDetail";
import { SchoolViewModel } from "./base.school.view.model";

/**
 * 专业详情视图模型
 */
export class MajorDetailViewModel {
  code: string;
  educationLevel: string | null;
  studyPeriod: string | null;
  awardedDegree: string | null;
  majorBrief: string | null;
  studyContent: string | null;
  seniorTalk: string | null;
  careerDevelopment: string | null;
  major: {
    name: string;
    code: string;
    eduLevel: string;
    level: 1 | 2 | 3;
  };
  schools: SchoolViewModel[];
  majorElementAnalyses: Array<{
    id: number;
    type: 'lexue' | 'shanxue';
    summary: string | null;
    matchReason: string | null;
    theoryBasis: string | null;
    element: {
      /** 元素ID */
      id: number;
      /** 元素名称 */
      name: string;
      /** 元素类型 */
      type: string;
      /** 元素状态 */
      status: string | null;
      /** 维度 */
      dimension: string | null;
      /** 对应元素ID */
      correspondingElementId: number | null;
      /** 双刃ID */
      doubleEdgedId: number | null;
      /** 拥有的自然状态描述 */
      ownedNaturalState: string | null;
      /** 未拥有的自然状态描述 */
      unownedNaturalState: string | null;
    };
  }>;
}

export function toMajorDetailViewModel(data: any): MajorDetailViewModel | undefined {
  if (!data || !data.major) return undefined;
  return {
    code: data.code,
    educationLevel: data.educationLevel,
    studyPeriod: data.studyPeriod,
    awardedDegree: data.awardedDegree,
    majorBrief: data.majorBrief,
    studyContent: data.studyContent,
    seniorTalk: data.seniorTalk,
    careerDevelopment: data.careerDevelopment,
    major: {
      name: data.major.name,
      code: data.major.code,
      eduLevel: data.major.eduLevel,
      level: data.major.level,
    },
    schools: Array.isArray(data.schools) ? data.schools.map((school: any) => ({
      code: school.code,
      name: school.name,
      nature: school.nature,
      level: school.level,
      belong: school.belong,
      categories: school.categories,
      features: school.features,
      provinceName: school.provinceName,
      cityName: school.cityName,
      rankingOfRK: school.rankingOfRK,
      rankingOfXYH: school.rankingOfXYH,
    })) : [],
    majorElementAnalyses: Array.isArray(data.majorElementAnalyses) ? data.majorElementAnalyses.map((analysis: any) => ({
      id: analysis.id,
      type: analysis.type,
      summary: analysis.summary,
      matchReason: analysis.matchReason,
      theoryBasis: analysis.theoryBasis,
      element: analysis.element ? {
        id: analysis.element.id,
        name: analysis.element.name,
        type: analysis.element.type,
        status: analysis.element.status,
        dimension: analysis.element.dimension,
        correspondingElementId: analysis.element.correspondingElementId,
        doubleEdgedId: analysis.element.doubleEdgedId,
        ownedNaturalState: analysis.element.ownedNaturalState,
        unownedNaturalState: analysis.element.unownedNaturalState,
      } : null,
    })).filter((item: any) => item.element !== null) : [],
  };
}

/**
 * 专业基础视图模型
 * 只包含专业基本信息
 */
export class MajorViewModel {
  /**
   * 专业ID
   */
  id: number;

  /**
   * 专业名称
   */
  name: string;

  /**
   * 专业代码
   */
  code: string;

  /**
   * 教育层次
   */
  eduLevel: string;

  /**
   * 层级
   */
  level: number;

  /**
   * 父级ID
   */
  parentId: number;

  /**
   * 从实体对象创建视图模型
   * @param data 原始数据对象
   * @returns MajorViewModel实例
   */
  static fromEntity(data: any): MajorViewModel {
    const viewModel = new MajorViewModel();
    
    viewModel.id = data.id;
    viewModel.name = data.name;
    viewModel.code = data.code;
    viewModel.eduLevel = data.eduLevel;
    viewModel.level = data.level;
    viewModel.parentId = data.parentId;

    return viewModel;
  }

  /**
   * 批量转换实体对象为视图模型
   * @param dataList 原始数据对象数组
   * @returns MajorViewModel数组
   */
  static fromEntityList(dataList: any[]): MajorViewModel[] {
    return dataList.map(data => MajorViewModel.fromEntity(data));
  }
} 