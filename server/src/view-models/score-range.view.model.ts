/**
 * 分数范围视图模型
 * 用于API响应中的分数范围数据展示
 */
export class ScoreRangeViewModel {
  /**
   * 人数
   */
  num: number;

  /**
   * 总人数
   */
  total: number;

  /**
   * 排名范围
   */
  rankRange: string;

  /**
   * 批次名称
   */
  batchName: string;

  /**
   * 控制分数线
   */
  controlScore: number;
}



