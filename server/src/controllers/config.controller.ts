import { GAOKAO_SUBJECT_CONFIG } from '../config/gaokao-subjects';
import { Get, JsonController } from 'routing-controllers';
import { Service } from 'typedi';

/**
 * 配置控制器类
 */
@JsonController("/config")
@Service()
export class ConfigController {
  /**
   * 获取高考科目配置信息
   * @param req 请求对象
   * @param res 响应对象
   * @returns 返回所有省份的高考科目配置信息
   */
  @Get("/gaokao")
  async getGaoKaoConfig() {
    try {
      return  GAOKAO_SUBJECT_CONFIG ;
    } catch (error) {
      throw new Error('获取高考配置信息失败');
    }
  }
}
