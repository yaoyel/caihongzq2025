import { Service } from 'typedi'; 
import { Repository } from 'typeorm';
import { MajorDetail } from '../entities/MajorDetail';
import { AppDataSource } from '../data-source';

/**
 * 专业得分结果接口
 */
export interface MajorScore {
  majorCode: string;
  majorName: string;
  eduLevel: string;
  score: number;
  lexueScore: number;  // 乐学得分
  shanxueScore: number;  // 善学得分
  potentialScore: number; // 潜力值得分
}

/**
 * 专业得分服务
 */
@Service()
export class MajorScoreService {
  private majorDetailRepository: Repository<MajorDetail>;
  constructor() { 
    this.majorDetailRepository = AppDataSource.getRepository(MajorDetail); 
  }

  /**
   * 计算专业匹配得分
   * @param userId 用户ID
   * @returns 专业得分列表，包含总分、乐学得分、善学得分和潜力值得分（仅本科专业）
   */
  async calculateMajorScores(userId: string): Promise<MajorScore[]> {
    // 使用原生SQL查询提升性能
    const result = await this.majorDetailRepository.query(`
     WITH user_answers AS (
        SELECT 
          s.id as scale_id,
          sa.score as score,
          s.action
        FROM scales s
        INNER JOIN scale_answers sa ON sa.scale_id = s.id
        WHERE sa.user_id = $1 and sa.scale_id > 112
      ),
      major_base_data AS (
        SELECT 
          md.code as major_code,
          m.name as major_name,
          m.edu_level as edu_level,
          mea.type,
          mea.potential_conversion_value,
          mea.weight,
          ua.score,
          ua.action,
          CASE WHEN ua.score IS NULL THEN 0 ELSE ua.score * mea.weight END as weighted_score,
          mea.weight * 2 as total_possible_score
        FROM major_details md
        INNER JOIN majors m ON m.code = md.code
        INNER JOIN major_element_analysis mea ON mea.major_id = md.id
        INNER JOIN elements e ON e.id = mea.element_id
        INNER JOIN scales s ON s.element_id = e.id
        LEFT JOIN user_answers ua ON ua.scale_id = s.id
        WHERE s.id > 112 AND m.edu_level = 'ben'
      ),
      type_scores AS (
        SELECT 
          major_code,
          major_name,
          edu_level,
          type,
          potential_conversion_value,
          SUM(weighted_score) as type_score,
          SUM(total_possible_score) as type_total_score,
          ROUND(
            COALESCE(
              CAST(SUM(weighted_score) AS NUMERIC) / 
              NULLIF(CAST(SUM(total_possible_score) AS NUMERIC), 0),
              0
            )::NUMERIC, 
            2
          )::NUMERIC as type_ratio
        FROM major_base_data
        GROUP BY major_code, major_name, edu_level, type, potential_conversion_value
      ),
      study_scores AS (
        SELECT 
          major_code,
          major_name,
          edu_level,
          ROUND(
            CAST(SUM(CASE WHEN type = 'lexue' THEN weighted_score ELSE 0 END) AS NUMERIC) /
            NULLIF(CAST(SUM(CASE WHEN type = 'lexue' THEN total_possible_score ELSE 0 END) AS NUMERIC), 0) * 0.5,
            2
          )::NUMERIC as lexue_score,
          ROUND(
            CAST(SUM(CASE WHEN type = 'shanxue' THEN weighted_score ELSE 0 END) AS NUMERIC) /
            NULLIF(CAST(SUM(CASE WHEN type = 'shanxue' THEN total_possible_score ELSE 0 END) AS NUMERIC), 0) * 0.5,
            2
          )::NUMERIC as shanxue_score,
          ROUND(
            CAST(SUM(CASE WHEN type IN ('lexue', 'shanxue') THEN weighted_score ELSE 0 END) AS NUMERIC) /
            NULLIF(CAST(SUM(CASE WHEN type IN ('lexue', 'shanxue') THEN total_possible_score ELSE 0 END) AS NUMERIC), 0),
            2
          )::NUMERIC as base_score
        FROM major_base_data
        GROUP BY major_code, major_name, edu_level
      ),
      deduction_scores AS (
        SELECT 
          ts.major_code,
          ROUND(MAX(CASE WHEN ts.type = 'tiaozhan' AND ts.type_score > 0 THEN 
            CASE 
              WHEN ts.potential_conversion_value = 'medium' THEN ts.type_ratio * 0.5 * 025 *0.5
              WHEN ts.potential_conversion_value = 'low' THEN ts.type_ratio * 0.25 * 0.5
              ELSE 0 
            END 
          ELSE 0 END),2) ::NUMERIC as tiaozhan_deduction,
         ROUND( MAX(CASE WHEN ts.type = 'yanxue' AND ts.type_score > 0 THEN 
            CASE 
              WHEN ts.potential_conversion_value = 'medium' THEN ts.type_ratio * 0.5 * 0.25 * 0.5 
              WHEN ts.potential_conversion_value = 'low' THEN ts.type_ratio *0.25 * 0.5
              ELSE 0 
            END 
          ELSE 0 END),2) :: NUMERIC  as yanxue_deduction
        FROM type_scores ts
        GROUP BY ts.major_code
      )
      SELECT 
        ss.major_code as "majorCode",
        ss.major_name as "majorName",
        ss.edu_level as "eduLevel",
        ds.yanxue_deduction as "yanxueDeduction",
        ds.tiaozhan_deduction as "tiaozhanDeduction",
        ROUND(
          CAST(
            ss.base_score - (COALESCE(ds.tiaozhan_deduction, 0) + COALESCE(ds.yanxue_deduction, 0))
          AS NUMERIC),
          2
        )::NUMERIC as score,
        ss.lexue_score as "lexueScore",
        ss.shanxue_score as "shanxueScore"
      FROM study_scores ss
      JOIN deduction_scores ds ON ds.major_code = ss.major_code
      ORDER BY score DESC
    `, [userId]);

    return result;
  }

  /**
   * 计算专业简单匹配得分（仅总分）
   * @param userId 用户ID
   * @returns 专业得分列表，仅包含总分（仅本科专业）
   */
  /**
   * 计算指定专业代码列表的匹配得分
   * @param userId 用户ID
   * @param majorCodes 专业代码数组
   * @returns 专业得分列表，仅包含总分
   */
  async calculateMajorScoresByCode(userId: string, majorCodes: string[]): Promise<{ majorCode: string; score: number }[]> {
    const result = await this.majorDetailRepository.query(`
    WITH user_answers AS (
        SELECT 
          s.id as scale_id,
          sa.score as score,
          s.action
        FROM scales s
        INNER JOIN scale_answers sa ON sa.scale_id = s.id
        WHERE sa.user_id = $1 and sa.scale_id > 112
      ),
      major_base_data AS (
        SELECT 
          md.code as major_code,
          m.name as major_name,
          m.edu_level as edu_level,
          mea.type,
          mea.potential_conversion_value,
          mea.weight,
          ua.score,
          ua.action,
          CASE WHEN ua.score IS NULL THEN 0 ELSE ua.score * mea.weight END as weighted_score,
          mea.weight * 2 as total_possible_score
        FROM major_details md
        INNER JOIN majors m ON m.code = md.code
        INNER JOIN major_element_analysis mea ON mea.major_id = md.id
        INNER JOIN elements e ON e.id = mea.element_id
        INNER JOIN scales s ON s.element_id = e.id
        LEFT JOIN user_answers ua ON ua.scale_id = s.id
        WHERE s.id > 112 AND m.edu_level = 'ben'
      ),
      type_scores AS (
        SELECT 
          major_code,
          major_name,
          edu_level,
          type,
          potential_conversion_value,
          SUM(weighted_score) as type_score,
          SUM(total_possible_score) as type_total_score,
          ROUND(
            COALESCE(
              CAST(SUM(weighted_score) AS NUMERIC) / 
              NULLIF(CAST(SUM(total_possible_score) AS NUMERIC), 0),
              0
            )::NUMERIC, 
            2
          )::NUMERIC as type_ratio
        FROM major_base_data
        GROUP BY major_code, major_name, edu_level, type, potential_conversion_value
      ),
      study_scores AS (
        SELECT 
          major_code,
          major_name,
          edu_level,
          ROUND(
            CAST(SUM(CASE WHEN type = 'lexue' THEN weighted_score ELSE 0 END) AS NUMERIC) /
            NULLIF(CAST(SUM(CASE WHEN type = 'lexue' THEN total_possible_score ELSE 0 END) AS NUMERIC), 0) * 0.5,
            2
          )::NUMERIC as lexue_score,
          ROUND(
            CAST(SUM(CASE WHEN type = 'shanxue' THEN weighted_score ELSE 0 END) AS NUMERIC) /
            NULLIF(CAST(SUM(CASE WHEN type = 'shanxue' THEN total_possible_score ELSE 0 END) AS NUMERIC), 0) * 0.5,
            2
          )::NUMERIC as shanxue_score,
          ROUND(
            CAST(SUM(CASE WHEN type IN ('lexue', 'shanxue') THEN weighted_score ELSE 0 END) AS NUMERIC) /
            NULLIF(CAST(SUM(CASE WHEN type IN ('lexue', 'shanxue') THEN total_possible_score ELSE 0 END) AS NUMERIC), 0),
            2
          )::NUMERIC as base_score
        FROM major_base_data
        GROUP BY major_code, major_name, edu_level
      ),
      deduction_scores AS (
        SELECT 
          ts.major_code,
          ROUND(MAX(CASE WHEN ts.type = 'tiaozhan' AND ts.type_score > 0 THEN 
            CASE 
              WHEN ts.potential_conversion_value = 'medium' THEN ts.type_ratio * 0.5 * 025 *0.5
              WHEN ts.potential_conversion_value = 'low' THEN ts.type_ratio * 0.25 * 0.5
              ELSE 0 
            END 
          ELSE 0 END),2) ::NUMERIC as tiaozhan_deduction,
         ROUND( MAX(CASE WHEN ts.type = 'yanxue' AND ts.type_score > 0 THEN 
            CASE 
              WHEN ts.potential_conversion_value = 'medium' THEN ts.type_ratio * 0.5 * 0.25 * 0.5 
              WHEN ts.potential_conversion_value = 'low' THEN ts.type_ratio *0.25 * 0.5
              ELSE 0 
            END 
          ELSE 0 END),2) :: NUMERIC  as yanxue_deduction
        FROM type_scores ts
        GROUP BY ts.major_code
      )
      SELECT 
        ss.major_code as "majorCode",
        ss.major_name as "majorName",
        ss.edu_level as "eduLevel", 
        ds.tiaozhan_deduction as "tiaozhanDeduction",
        ROUND(
          CAST(
            ss.base_score - (COALESCE(ds.tiaozhan_deduction, 0) + COALESCE(ds.yanxue_deduction, 0))
          AS NUMERIC),
          2
        )::NUMERIC as score  
      FROM study_scores ss
      JOIN deduction_scores ds ON ds.major_code = ss.major_code
      ORDER BY score DESC
    `, [userId]);

    return result;
  }
  
}

     // potential_scores AS (
      //   SELECT 
      //     major_code,
      //     ROUND(
      //       COALESCE(
      //         CAST(SUM(CASE WHEN action = 'potential' THEN weighted_score ELSE 0 END) AS NUMERIC) / 
      //         NULLIF(CAST(SUM(CASE WHEN action = 'potential' THEN total_possible_score ELSE 0 END) AS NUMERIC), 0),
      //         0
      //       )::NUMERIC, 
      //       2
      //     )::NUMERIC as potential_score
      //   FROM major_base_data
      //   GROUP BY major_code
      // ),