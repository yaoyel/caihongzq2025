/**
 * 专业得分视图模型
 */
export interface MajorScoreViewModel {
  /**
   * 专业代码
   */
  majorCode: string;

  /**
   * 专业名称
   */
  majorName: string;

  /**
   * 教育层次
   */
  eduLevel: string;

  /**
   * 匹配得分
   */
  score: number;

  /**
   * 潜力值得分
   */
  potentialScore: number;
}

/**
 * 用户专业得分结果视图模型
 */
export interface UserMajorScoresViewModel {
  /**
   * 用户ID
   */
  userId: string;

  /**
   * 专业得分列表
   */
  scores: MajorScoreViewModel[];

  /**
   * 计算时间
   */
  calculatedAt: string;
}

/**
 * 将服务层的专业得分数据转换为视图模型
 * @param userId 用户ID
 * @param scores 专业得分列表
 * @returns 用户专业得分结果视图模型
 */
export function toUserMajorScoresViewModel(
  userId: string, 
  scores: MajorScoreViewModel[]
): UserMajorScoresViewModel {
  return {
    userId,
    scores,
    calculatedAt: new Date().toISOString()
  };
}
