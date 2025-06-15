/**
 * 学校基础视图模型接口
 * 只包含学校基本信息
 */
export interface SchoolViewModel {
  code: string;
  name: string;
  nature: string;
  level: string;
  belong: string;
  categories: string;
  features: string;
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
    code: data.code,
    name: data.name,
    nature: data.nature,
    level: data.level,
    belong: data.belong,
    categories: data.categories,
    features: data.features,
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