import { SchoolDetail } from "../entities/SchoolDetail";
import { SchoolViewModel } from "./base.school.view.model";

/**
 * 专业历年分数视图模型
 */
interface MajorHistoryScoreViewModel {
  /** 学校专业ID */
  // schoolMajorId: number;
  
  /** 省份 */
  province: string;
  
  /** 科类（文科/理科/综合） */
  subjectType: string;
  
  /** 批次 */
  batch: string;
  
  /** 选科要求 */
  subjectSelection: string | null;
  
  /** 计划专业名称 */
  planMajorName: string | null;
  
  /** 计划招生人数 */
  // planNum: number | null;
  
  /** 学制 */
  studyPeriod: string | null;
  
  /** 学费 */
  tuition: string | null;
  
  /** 历年分数数据 */
  historyScore: {
    [year: string]: {
      minScore?: number;
      avgScore?: number;
      maxScore?: number;
      enrollmentCount?: number;
      notes?: string;
    };
  } | null;
  
  /** 年份 */
  // year: number;
}

/**
 * 扩展的学校视图模型，包含历年分数
 */
interface ExtendedSchoolViewModel extends SchoolViewModel {
  historyScores?: MajorHistoryScoreViewModel[];
}

/**
 * 专业详情基础视图模型
 * 包含专业的基本信息字段
 */
export class BaseMajorDetailViewModel {
  /** 专业代码 */
  code: string;
  
  /** 教育层次 */
  educationLevel: string | null;
  
  /** 学习年限 */
  studyPeriod: string | null;
  
  /** 授予学位 */
  awardedDegree: string | null;
  
  /** 专业简介 */
  majorBrief: string | null;
  
  /** 专业关键词 */
  majorKey: string | null;
  
  /** 机遇指数 */
  opportunityScore: number | null;
  
  /** 学业发展分数 */
  academicDevelopmentScore: number | null;
  
  /** 职业发展分数 */
  careerDevelopmentScore: number | null;
  
  /** 成长潜力分数 */
  growthPotentialScore: number | null;
  
  /** 行业前景分数 */
  industryProspectsScore: number | null;
  
  /** 学业发展标签 */
  academicDevelopmentTag: string | null;
  
  /** 职业发展标签 */
  careerDevelopmentTag: string | null;
  
  /** 成长潜力标签 */
  growthPotentialTag: string | null;
  
  /** 行业前景标签 */
  industryProspectsTag: string | null;
  
  /** 学习内容 */
  studyContent: string | null;
  
  /** 学长说 */
  seniorTalk: string | null;
  
  /** 学业发展 */
  academicDevelopment: string | null;
  
  /** 职业发展 */
  careerDevelopment: string | null;
  
  /** 行业前景 */
  industryProspects: string | null;
  
  /** 成长潜力 */
  growthPotential: string | null;
}

/**
 * 专业详情视图模型
 * 继承基础视图模型，添加关联信息
 */
export class MajorDetailViewModel extends BaseMajorDetailViewModel {

  major: {
    name: string;
    code: string;
    eduLevel: string;
    level: 1 | 2 | 3;
    score?: number;
    lexueScore?: number;
    shanxueScore?: number;
    yanxueDeduction?: number;
    tiaozhanDeduction?: number;

  };
  schools: ExtendedSchoolViewModel[];
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
  
  // 创建基础视图模型部分
  const baseViewModel: BaseMajorDetailViewModel = {
    code: data.code,
    educationLevel: data.educationLevel,
    studyPeriod: data.studyPeriod,
    awardedDegree: data.awardedDegree,
    majorBrief: data.majorBrief,
    majorKey: data.majorKey,
    opportunityScore: data.opportunityScore,
    academicDevelopmentScore: data.academicDevelopmentScore,
    careerDevelopmentScore: data.careerDevelopmentScore,
    growthPotentialScore: data.growthPotentialScore,
    industryProspectsScore: data.industryProspectsScore,
    academicDevelopmentTag: data.academicDevelopmentTag,
    careerDevelopmentTag: data.careerDevelopmentTag,
    growthPotentialTag: data.growthPotentialTag,
    industryProspectsTag: data.industryProspectsTag,
    studyContent: data.studyContent,
    seniorTalk: data.seniorTalk,
    academicDevelopment: data.academicDevelopment,
    careerDevelopment: data.careerDevelopment,
    industryProspects: data.industryProspects,
    growthPotential: data.growthPotential,
  };

  // 创建完整视图模型
  return {
    ...baseViewModel, 
    major: {
      name: data.major.name,
      code: data.major.code,
      eduLevel: data.major.eduLevel,
      level: data.major.level,
      score: data.major.score,
      lexueScore: data.major.lexueScore,
      shanxueScore: data.major.shanxueScore,
      yanxueDeduction: data.major.yanxueDeduction,
      tiaozhanDeduction: data.major.tiaozhanDeduction,
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
      group:school.group,
      averageRank:school.averageRank,
      rankDiffPercentage: school.rankDiffPercentage,
      historyScores: Array.isArray(school.historyScores) 
        ? school.historyScores.map((score: any) => ({
            // schoolMajorId: score.schoolMajorId,
            province: score.province,
            subjectType: score.subjectType,
            batch: score.batch,
            subjectSelection: score.subjectSelection,
            planMajorName: score.planMajorName,
            // planNum: score.planNum,
            studyPeriod: score.studyPeriod,
            tuition: score.tuition,
            historyScore: score.historyScore,
            // year: score.year
          }))
        : []
    })) : [],
    majorElementAnalyses: Array.isArray(data.majorElementAnalyses) ? data.majorElementAnalyses.map((analysis: any) => ({
      id: analysis.id,
      type: analysis.type,
      summary: analysis.summary,
      matchReason: analysis.matchReason,
      theoryBasis: analysis.theoryBasis,
      rawInput: analysis.rawInput,
      potentialConversionReason: analysis.potentialConversionReason,
      potentialConversionValue: analysis.potentialConversionValue,
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