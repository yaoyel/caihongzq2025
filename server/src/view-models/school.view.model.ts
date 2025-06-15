import { SchoolDetail } from '../entities/SchoolDetail';
import { MajorViewModel } from './major.view.model';
import { SchoolViewModel, toSchoolViewModel } from './base.school.view.model';

/**
 * 学校完整视图模型接口
 * 包含学校基本信息、详情和专业列表
 */
export interface SchoolDetailViewModel extends SchoolViewModel {
  schoolDetail: SchoolDetail | null;
  majors: MajorViewModel[];
}

/**
 * 将数据转换为学校完整视图模型
 * @param data 原始数据
 * @returns SchoolDetailViewModel
 */
export function toSchoolDetailViewModel(data: any): SchoolDetailViewModel {
  return {
    ...toSchoolViewModel(data),
    schoolDetail: data.schoolDetail || null,
    majors: data.majors ? MajorViewModel.fromEntityList(data.majors) : []
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
