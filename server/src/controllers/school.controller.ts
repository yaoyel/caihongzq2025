import { Controller, Get, JsonController, Param } from 'routing-controllers'; 
import { SchoolRedisService } from '../services/school.redis.services';
import { SchoolViewModel,toSchoolViewModelList } from '../view-models/base.school.view.model';
import { SchoolDetailViewModel, toSchoolDetailViewModel } from '../view-models/school.view.model';
import { Service } from 'typedi';
 
@JsonController('/schools')
@Service()
export class SchoolController {
  /**
   * 获取所有学校的基本信息
   * @returns Promise<BaseSchoolViewModel[]>
   */
  @Get() 
  async getAllSchools(): Promise<SchoolViewModel[]> {
    // 从Redis获取原始数据
    const schools = await SchoolRedisService.getAllSchools();
    // 转换为基础视图模型
    return toSchoolViewModelList(schools);
  }

  /**
   * 获取指定学校的详细信息
   * @param code 学校代码
   * @returns Promise<SchoolViewModel>
   */
  @Get('/:code') 
  async getSchoolByCode(@Param('code') code: string): Promise<SchoolDetailViewModel | {}> { 
    // 获取学校详细信息
    const school = await SchoolRedisService.getSchool(code);
    if (!school) {
      return {};
    }
    // 转换为完整视图模型
    return  toSchoolDetailViewModel(school);
  }
}
