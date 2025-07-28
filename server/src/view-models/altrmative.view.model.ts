/**
 * 备选方案视图模型接口
 * 用于前端展示的备选专业和学校信息
 */
export interface AlternativeViewModel {
  id: number;
  majorCode: string;
  majorName: string;
  schoolCode: string;
  schoolName: string;
  schoolFeature: string;
  group: number;
  historyScore: object;
  selected?: boolean;
  enrollmentRate?: number;
  employmentRate?: number;
  majorGroupId?: number;
  majorGroupName?: string;
  Rankdiff?: number;
  RankdiffPer?: number;
  score?: number;
  developmentPotential?: number; 
}

/**
 * 将实体对象转换为视图模型
 * @param alternative 备选方案实体对象
 * @returns 备选方案视图模型
 */
export function toAlternativeViewModel(alternative: any): AlternativeViewModel {
  return {
    id: alternative.id,
    majorCode: alternative.majorCode,
    majorName: alternative.majorName,
    schoolCode: alternative.schoolCode,
    schoolName: alternative.schoolName,
    schoolFeature: alternative.schoolNature,
    group: alternative.group,
    historyScore: alternative.historyScore,
    selected: alternative.selected,
    enrollmentRate: alternative.enrollmentRate || 0,
    employmentRate: alternative.employmentRate || 0,
    majorGroupId: alternative.majorGroupId || 0,
    majorGroupName: alternative.majorGroupName || '',
    Rankdiff: alternative.rankDiff || 0,
    RankdiffPer: Number((alternative.rankDiffPer || 0).toFixed(2)),
    score: alternative.score || 0,
    developmentPotential: alternative.developmentPotential || 0 
  };
}

/**
 * 将实体对象数组转换为视图模型数组
 * @param alternatives 备选方案实体对象数组
 * @returns 备选方案视图模型数组
 */
export function toAlternativeViewModels(alternatives: any[]): AlternativeViewModel[] {
  return alternatives.map(alternative => toAlternativeViewModel(alternative));
}
