import { Intention } from '../entities/Intention';

/**
 * 专业意向视图模型
 */
export interface IntentionViewModel {
  id: number;
  majorCode: string;
  majorName?: string;  // 从专业详情中获取
  province?: string;
  // score?: number;
  rank?: number;
  preferredSubjects?: string;
  secondarySubjects?: string;
  group0?: number;
  group1?: number;
  group2?: number;
  group3?: number;
  // createdAt: Date;
  // updatedAt: Date;
  // 专业匹配总分
  score?: number;
  lexueScore?: number;
  shanxueScore?: number;
  yanxueDeduction?: number;
  tiaozhanDeduction?: number;
  opportunityScore?: number;
  academicDevelopmentScore?: number;
  careerDevelopmentScore?: number;
  growthPotentialScore?: number;
  industryProspectsScore?: number;
  developmentPotential?: number;

}

/**
 * 将意向实体转换为视图模型
 * @param intention 意向实体
 * @param majorName 专业名称（可选）
 * @param matchScore 专业匹配总分（可选）
 * @param scores 专业评分数据（可选）
 * @returns 意向视图模型
 */
export function toIntentionViewModel(
  intention: Intention, 
  majorName?: string,
  matchScore?: number,
  scores?: {
    lexueScore?: number;
    shanxueScore?: number;
    yanxueDeduction?: number;
    tiaozhanDeduction?: number;
    opportunityScore?: number;
    academicDevelopmentScore?: number;
    careerDevelopmentScore?: number;
    growthPotentialScore?: number;
    industryProspectsScore?: number;
    developmentPotential?: number;
  }
): IntentionViewModel {
  return {
    id: intention.id,
    majorCode: intention.majorCode,
    majorName: majorName,
    province: intention.province,
    // score: intention.score,
    rank: intention.rank,
    preferredSubjects: intention.preferredSubjects,
    secondarySubjects: intention.secondarySubjects,
    group0: intention.group0,
    group1: intention.group1,
    group2: intention.group2,
    group3: intention.group3,
    // createdAt: intention.createdAt,
    // updatedAt: intention.updatedAt,
    score: matchScore,
    lexueScore: scores?.lexueScore,
    shanxueScore: scores?.shanxueScore,
    yanxueDeduction: scores?.yanxueDeduction,
    tiaozhanDeduction: scores?.tiaozhanDeduction,
    opportunityScore: scores?.opportunityScore,
    academicDevelopmentScore: scores?.academicDevelopmentScore,
    careerDevelopmentScore: scores?.careerDevelopmentScore,
    growthPotentialScore: scores?.growthPotentialScore,
    industryProspectsScore: scores?.industryProspectsScore,
    developmentPotential: scores?.developmentPotential
  };
}

/**
 * 批量转换意向实体为视图模型
 * @param intentions 意向实体数组
 * @param majorNames 专业代码到专业名称的映射
 * @param majorScores 专业代码到分数的映射
 * @param majorScoreDetails 专业代码到详细评分数据的映射
 * @returns 意向视图模型数组
 */
export function toIntentionViewModels(
  intentions: Intention[], 
  majorNames: Record<string, string> = {},
  majorScores: Record<string, number> = {},
  majorScoreDetails: Record<string, {
    lexueScore?: number;
    shanxueScore?: number;
    yanxueDeduction?: number;
    tiaozhanDeduction?: number;
    opportunityScore?: number;
    academicDevelopmentScore?: number;
    careerDevelopmentScore?: number;
    growthPotentialScore?: number;
    industryProspectsScore?: number;
    developmentPotential?: number;
  }> = {}
): IntentionViewModel[] {
  return intentions.map(intention => 
    toIntentionViewModel(
      intention, 
      majorNames[intention.majorCode], 
      majorScores[intention.majorCode],
      majorScoreDetails[intention.majorCode]
    )
  );
}
