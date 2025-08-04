/**
 * 学校基础视图模型接口
 * 只包含学校基本信息
 */
export interface SchoolViewModel {
  schoolCode: string;
  name: string;
  schoolNature: string;
  level: string;
  belong: string;
  categories: string;
  schoolFeature: string;
  provinceName: string;
  cityName: string;
  rankingOfRK: number | null;
  rankingOfXYH: number | null;
}

/**
 * 将数据转换为学校基础视图模型
 * @param data 原始数据
 * @returns SchoolViewModel
 */
export function toSchoolViewModel(data: any): SchoolViewModel {
  return {
    schoolCode: data.code,
    name: data.name,
    schoolNature: data.nature,
    level: data.level,
    belong: data.belong,
    categories: data.categories,
    schoolFeature: data.features,
    provinceName: data.provinceName,
    cityName: data.cityName,
    rankingOfRK: data.rankingOfRK || null,
    rankingOfXYH: data.rankingOfXYH || null
  };
}

/**
 * 批量转换为学校基础视图模型
 * @param dataList 原始数据列表
 * @returns SchoolViewModel[]
 */
export function toSchoolViewModelList(dataList: any[]): SchoolViewModel[] {
  return dataList.map(data => toSchoolViewModel(data));
} 