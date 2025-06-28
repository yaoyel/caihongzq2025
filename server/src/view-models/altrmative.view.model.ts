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
    selected: alternative.selected
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
