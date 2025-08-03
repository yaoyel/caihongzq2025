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
  yanxueDeduction: number;
  tiaozhanDeduction: number;
  score: number;
  lexueScore: number;
  shanxueScore: number;
  // 新增字段：专业详情信息
  majorBrief: string | null;
  opportunityScore: number | null;
  academicDevelopmentScore: number | null;
  careerDevelopmentScore: number | null;
  growthPotentialScore: number | null;
  industryProspectsScore: number | null;
  // 新增字段：学校专业数量
  schoolCount: number;
  // 新增字段：发展潜力得分
  developmentPotential: number;
  // 新增字段：是否与用户选科要求匹配
  isMatching?: boolean;
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
        WHERE sa.user_id = $1   and sa.scale_id > 112
      ),
      major_base_data AS (
        SELECT 
          md.code as major_code, 
          m.name as major_name,
          m.edu_level as edu_level,
          md.major_brief, 
          md.academic_development_score,
          md.career_development_score,
          md.growth_potential_score,
          md.industry_prospects_score,
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
        WHERE s.id > 112 AND m.edu_level = 'zhuan'
      ),
      school_majors_count AS (
        SELECT 
          md.code as major_code,
          COUNT(sm.id) as school_majors_count
        FROM major_details md
        LEFT JOIN school_majors sm ON sm.major_code = md.code
        GROUP BY md.code
      ),
      type_scores AS (
        SELECT 
          major_code,
          major_name,
          edu_level,
          major_brief,
          academic_development_score,
          career_development_score,
          growth_potential_score,
          industry_prospects_score,
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
        GROUP BY major_code, major_name, edu_level, major_brief, academic_development_score, career_development_score, growth_potential_score, industry_prospects_score, type, potential_conversion_value
      ),
      study_scores AS (
        SELECT 
          major_code,
          major_name,
          edu_level,
          major_brief, 
          academic_development_score,
          career_development_score,
          growth_potential_score,
          industry_prospects_score,
          ROUND(
            CAST(SUM(CASE WHEN type = 'lexue' THEN weighted_score ELSE 0 END) AS NUMERIC) /
            NULLIF(CAST(SUM(CASE WHEN type = 'lexue' THEN total_possible_score ELSE 0 END) AS NUMERIC), 0) * 0.5,
            2
          )::NUMERIC as lexue_score,
          ROUND(
            CAST(SUM(CASE WHEN type = 'shanxue' THEN weighted_score ELSE 0 END) AS NUMERIC) /
            NULLIF(CAST(SUM(CASE WHEN type = 'shanxue' THEN total_possible_score ELSE 0 END) AS NUMERIC), 0) * 0.5,
            2
          )::NUMERIC as shanxue_score 
        FROM major_base_data
        GROUP BY major_code, major_name, edu_level, major_brief, academic_development_score, career_development_score, growth_potential_score, industry_prospects_score
      ),
      deduction_scores AS (
        SELECT 
          ts.major_code,
          ROUND(MAX(CASE WHEN ts.type = 'tiaozhan' AND ts.type_score > 0 THEN 
            CASE 
              WHEN ts.potential_conversion_value = 'medium' THEN ts.type_ratio * 0.5 * 0.25
              WHEN ts.potential_conversion_value = 'low' THEN ts.type_ratio * 0.25
              ELSE 0 
            END 
          ELSE 0 END),2) ::NUMERIC as tiaozhan_deduction,
         ROUND( MAX(CASE WHEN ts.type = 'yanxue' AND ts.type_score > 0 THEN 
            CASE 
              WHEN ts.potential_conversion_value = 'medium' THEN ts.type_ratio * 0.5 * 0.25
              WHEN ts.potential_conversion_value = 'low' THEN ts.type_ratio *0.25
              ELSE 0 
            END 
          ELSE 0 END),2) :: NUMERIC  as yanxue_deduction
        FROM type_scores ts
        GROUP BY ts.major_code
      ),
      final_scores AS (
        SELECT 
          ss.major_code,
          ss.major_name,
          ss.edu_level,  
		  ss.major_brief, 
          ss.academic_development_score,
          ss.career_development_score,
          ss.growth_potential_score,
          ss.industry_prospects_score,
          COALESCE(ss.lexue_score, 0) as lexue_score,
          COALESCE(ss.shanxue_score, 0) as shanxue_score,
          COALESCE(ds.yanxue_deduction, 0) as yanxue_deduction,
          COALESCE(ds.tiaozhan_deduction, 0) as tiaozhan_deduction,
          COALESCE(smc.school_majors_count, 0) as school_count,
          -- 计算基础得分
          COALESCE(ss.lexue_score, 0) + COALESCE(ss.shanxue_score, 0) - (COALESCE(ds.tiaozhan_deduction, 0) + COALESCE(ds.yanxue_deduction, 0)) as base_score,
          -- 计算学术发展得分（取整数）
          ROUND(((COALESCE(ss.lexue_score, 0)  + COALESCE(ss.shanxue_score, 0) )  * 25 * 0.5) + (COALESCE(ss.academic_development_score, 0) / 100 * 25 * 0.5)) as academic_development_raw,
          -- 计算职业发展得分（取整数）
          ROUND((COALESCE(ss.lexue_score, 0) + COALESCE(ss.shanxue_score, 0) - (COALESCE(ds.tiaozhan_deduction, 0) + COALESCE(ds.yanxue_deduction, 0))) * 25 * 0.5 + COALESCE(ss.career_development_score, 0) / 100 * 25 * 0.5) as career_development_raw,

          -- 计算成长潜力得分（取整数）
          ROUND((COALESCE(ss.lexue_score, 0) + COALESCE(ss.shanxue_score, 0) - (COALESCE(ds.tiaozhan_deduction, 0) + COALESCE(ds.yanxue_deduction, 0))) * 25 * 0.5 + COALESCE(ss.growth_potential_score, 0) / 100 * 25 * 0.5) as growth_potential_raw
        FROM study_scores ss
        JOIN deduction_scores ds ON ds.major_code = ss.major_code
        LEFT JOIN school_majors_count smc ON smc.major_code = ss.major_code
      )
      SELECT 
        fs.major_code as "majorCode",
        fs.major_name as "majorName",
		fs.major_brief as "majorBrief",
        fs.edu_level as "eduLevel",
        fs.yanxue_deduction as "yanxueDeduction",
        fs.tiaozhan_deduction as "tiaozhanDeduction",
        ROUND(CAST(fs.base_score AS NUMERIC), 2)::NUMERIC as score,
        fs.lexue_score as "lexueScore",
        fs.shanxue_score as "shanxueScore", 
        fs.school_count as "schoolCount",
       -- 计算行业前景得分（取整数）
        ROUND((COALESCE(fs.career_development_raw, 0) + COALESCE(fs.growth_potential_raw, 0)) /50 * 25 * 0.5 + COALESCE(fs.industry_prospects_score, 0) / 100 * 25 * 0.5) as "industryProspectsScore",
        -- 发展潜力得分（取整数）
        ROUND(CAST(fs.academic_development_raw + fs.career_development_raw  +
		    ROUND((COALESCE(fs.career_development_raw, 0) + COALESCE(fs.growth_potential_raw, 0)) /50 * 25 * 0.5 + COALESCE(fs.industry_prospects_score, 0) / 100 * 25 * 0.5)
		        +  fs.growth_potential_raw AS NUMERIC))::NUMERIC as "opportunityScore",
        -- 机会得分（取整数）
        ROUND(CAST((fs.academic_development_raw + fs.career_development_raw +
		    ROUND((COALESCE(fs.career_development_raw, 0) + COALESCE(fs.growth_potential_raw, 0)) /50 * 25 * 0.5 + COALESCE(fs.industry_prospects_score, 0) / 100 * 25 * 0.5)
		   + fs.growth_potential_raw) / 2 + fs.base_score * 100 / 2 AS NUMERIC))::NUMERIC as "developmentPotential",       
        -- 各项得分（取整数）
        ROUND(CAST(fs.academic_development_raw AS NUMERIC))::NUMERIC as "academicDevelopmentScore",
        ROUND(CAST(fs.career_development_raw AS NUMERIC))::NUMERIC as "careerDevelopmentScore", 
        ROUND(CAST(fs.growth_potential_raw AS NUMERIC))::NUMERIC as "growthPotentialScore"
      FROM final_scores fs
      ORDER BY score DESC
    `, [userId]);

    return result;
  }

  /**
   * 计算指定专业代码列表的匹配得分
   * @param userId 用户ID
   * @param majorCodes 专业代码数组
   * @returns 专业得分列表，包含总分和各项分数
   */
  async calculateMajorScoresByCode(userId: string, majorCodes: string[]): Promise<MajorScore[]> {
    const result = await this.majorDetailRepository.query(`
       WITH user_answers AS (
        SELECT 
          s.id as scale_id,
          sa.score as score,
          s.action
        FROM scales s
        INNER JOIN scale_answers sa ON sa.scale_id = s.id
        WHERE sa.user_id = $1   and sa.scale_id > 112
      ),
      major_base_data AS (
        SELECT 
          md.code as major_code, 
          m.name as major_name,
          m.edu_level as edu_level,
          md.major_brief, 
          md.academic_development_score,
          md.career_development_score,
          md.growth_potential_score,
          md.industry_prospects_score,
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
        WHERE s.id > 112 AND md.code = ANY($2)
      ),
      school_majors_count AS (
        SELECT 
          md.code as major_code,
          COUNT(sm.id) as school_majors_count
        FROM major_details md
        LEFT JOIN school_majors sm ON sm.major_code = md.code
	    WHERE md.code = ANY($2)
        GROUP BY md.code
      ),
      type_scores AS (
        SELECT 
          major_code,
          major_name,
          edu_level,
          major_brief,
          academic_development_score,
          career_development_score,
          growth_potential_score,
          industry_prospects_score,
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
        GROUP BY major_code, major_name, edu_level, major_brief, academic_development_score, career_development_score, growth_potential_score, industry_prospects_score, type, potential_conversion_value
      ),
      study_scores AS (
        SELECT 
          major_code,
          major_name,
          edu_level,
          major_brief, 
          academic_development_score,
          career_development_score,
          growth_potential_score,
          industry_prospects_score,
          ROUND(
            CAST(SUM(CASE WHEN type = 'lexue' THEN weighted_score ELSE 0 END) AS NUMERIC) /
            NULLIF(CAST(SUM(CASE WHEN type = 'lexue' THEN total_possible_score ELSE 0 END) AS NUMERIC), 0) * 0.5,
            2
          )::NUMERIC as lexue_score,
          ROUND(
            CAST(SUM(CASE WHEN type = 'shanxue' THEN weighted_score ELSE 0 END) AS NUMERIC) /
            NULLIF(CAST(SUM(CASE WHEN type = 'shanxue' THEN total_possible_score ELSE 0 END) AS NUMERIC), 0) * 0.5,
            2
          )::NUMERIC as shanxue_score 
        FROM major_base_data
        GROUP BY major_code, major_name, edu_level, major_brief, academic_development_score, career_development_score, growth_potential_score, industry_prospects_score
      ),
      deduction_scores AS (
        SELECT 
          ts.major_code,
          ROUND(MAX(CASE WHEN ts.type = 'tiaozhan' AND ts.type_score > 0 THEN 
            CASE 
              WHEN ts.potential_conversion_value = 'medium' THEN ts.type_ratio * 0.5 * 0.25
              WHEN ts.potential_conversion_value = 'low' THEN ts.type_ratio * 0.25
              ELSE 0 
            END 
          ELSE 0 END),2) ::NUMERIC as tiaozhan_deduction,
         ROUND( MAX(CASE WHEN ts.type = 'yanxue' AND ts.type_score > 0 THEN 
            CASE 
              WHEN ts.potential_conversion_value = 'medium' THEN ts.type_ratio * 0.5 * 0.25
              WHEN ts.potential_conversion_value = 'low' THEN ts.type_ratio *0.25
              ELSE 0 
            END 
          ELSE 0 END),2) :: NUMERIC  as yanxue_deduction
        FROM type_scores ts
        GROUP BY ts.major_code
      ),
      final_scores AS (
        SELECT 
          ss.major_code,
          ss.major_name,
          ss.edu_level,  
		  ss.major_brief, 
          ss.academic_development_score,
          ss.career_development_score,
          ss.growth_potential_score,
          ss.industry_prospects_score,
          COALESCE(ss.lexue_score, 0) as lexue_score,
          COALESCE(ss.shanxue_score, 0) as shanxue_score,
          COALESCE(ds.yanxue_deduction, 0) as yanxue_deduction,
          COALESCE(ds.tiaozhan_deduction, 0) as tiaozhan_deduction,
          COALESCE(smc.school_majors_count, 0) as school_count,
          -- 计算基础得分
          COALESCE(ss.lexue_score, 0) + COALESCE(ss.shanxue_score, 0) - (COALESCE(ds.tiaozhan_deduction, 0) + COALESCE(ds.yanxue_deduction, 0)) as base_score,
          -- 计算学术发展得分（取整数）
          ROUND(((COALESCE(ss.lexue_score, 0)  + COALESCE(ss.shanxue_score, 0) )  * 25 * 0.5) + (COALESCE(ss.academic_development_score, 0) / 100 * 25 * 0.5)) as academic_development_raw,
          -- 计算职业发展得分（取整数）
          ROUND((COALESCE(ss.lexue_score, 0) + COALESCE(ss.shanxue_score, 0) - (COALESCE(ds.tiaozhan_deduction, 0) + COALESCE(ds.yanxue_deduction, 0))) * 25 * 0.5 + COALESCE(ss.career_development_score, 0) / 100 * 25 * 0.5) as career_development_raw,

          -- 计算成长潜力得分（取整数）
          ROUND((COALESCE(ss.lexue_score, 0) + COALESCE(ss.shanxue_score, 0) - (COALESCE(ds.tiaozhan_deduction, 0) + COALESCE(ds.yanxue_deduction, 0))) * 25 * 0.5 + COALESCE(ss.growth_potential_score, 0) / 100 * 25 * 0.5) as growth_potential_raw
        FROM study_scores ss
        JOIN deduction_scores ds ON ds.major_code = ss.major_code
        LEFT JOIN school_majors_count smc ON smc.major_code = ss.major_code
      )
      SELECT 
        fs.major_code as "majorCode",
        fs.major_name as "majorName",
	     	fs.major_brief as "majorBrief",
        fs.edu_level as "eduLevel",
        fs.yanxue_deduction as "yanxueDeduction",
        fs.tiaozhan_deduction as "tiaozhanDeduction",
        ROUND(CAST(fs.base_score AS NUMERIC), 2)::NUMERIC as score,
        fs.lexue_score as "lexueScore",
        fs.shanxue_score as "shanxueScore", 
        fs.school_count as "schoolCount",
      -- 计算行业前景得分（取整数）
        ROUND((COALESCE(fs.career_development_raw, 0) + COALESCE(fs.growth_potential_raw, 0)) /50 * 25 * 0.5 + COALESCE(fs.industry_prospects_score, 0) / 100 * 25 * 0.5) as "industryProspectsScore",
        -- 发展潜力得分（取整数）
        ROUND(CAST(fs.academic_development_raw + fs.career_development_raw  +
		    ROUND((COALESCE(fs.career_development_raw, 0) + COALESCE(fs.growth_potential_raw, 0)) /50 * 25 * 0.5 + COALESCE(fs.industry_prospects_score, 0) / 100 * 25 * 0.5)
		   +  fs.growth_potential_raw AS NUMERIC))::NUMERIC as "opportunityScore",
        -- 机会得分（取整数）
        ROUND(CAST((fs.academic_development_raw + fs.career_development_raw +
	     	ROUND((COALESCE(fs.career_development_raw, 0) + COALESCE(fs.growth_potential_raw, 0)) /50 * 25 * 0.5 + COALESCE(fs.industry_prospects_score, 0) / 100 * 25 * 0.5)
		    + fs.growth_potential_raw) / 2 + fs.base_score * 100 / 2 AS NUMERIC))::NUMERIC as "developmentPotential",        
        -- 各项得分（取整数）
        ROUND(CAST(fs.academic_development_raw AS NUMERIC))::NUMERIC as "academicDevelopmentScore",
        ROUND(CAST(fs.career_development_raw AS NUMERIC))::NUMERIC as "careerDevelopmentScore", 
        ROUND(CAST(fs.growth_potential_raw AS NUMERIC))::NUMERIC as "growthPotentialScore"
      FROM final_scores fs
      ORDER BY score DESC
    `, [userId, majorCodes]);

    return result;
  }
  
  /**
   * 获取前20%发展潜力最高的专业代码和得分
   * @param userId 用户ID
   * @returns 专业代码和发展潜力得分列表（按得分从高到低排序）
   */
  async getTopDevelopmentPotentialMajors(userId: string): Promise<{majorCode: string, developmentpotential: number,lexue_score:number}[]> {
    // 使用优化的SQL查询，只获取必要的字段
    const result = await this.majorDetailRepository.query(`
         WITH user_answers AS (
        SELECT 
          s.id as scale_id,
          sa.score as score,
          s.action
        FROM scales s
        INNER JOIN scale_answers sa ON sa.scale_id = s.id
        WHERE sa.user_id = $1   and sa.scale_id > 112
      ),
      major_base_data AS (
        SELECT 
          md.code as major_code, 
          m.name as major_name,
          m.edu_level as edu_level,
          md.major_brief, 
          md.academic_development_score,
          md.career_development_score,
          md.growth_potential_score,
          md.industry_prospects_score,
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
        WHERE s.id > 112 AND m.edu_level = 'zhuan'
      ),
      school_majors_count AS (
        SELECT 
          md.code as major_code,
          COUNT(sm.id) as school_majors_count
        FROM major_details md
        LEFT JOIN school_majors sm ON sm.major_code = md.code
        GROUP BY md.code
      ),
      type_scores AS (
        SELECT 
          major_code,
          major_name,
          edu_level,
          major_brief,
          academic_development_score,
          career_development_score,
          growth_potential_score,
          industry_prospects_score,
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
        GROUP BY major_code, major_name, edu_level, major_brief, academic_development_score, career_development_score, growth_potential_score, industry_prospects_score, type, potential_conversion_value
      ),
      study_scores AS (
        SELECT 
          major_code,
          major_name,
          edu_level,
          major_brief, 
          academic_development_score,
          career_development_score,
          growth_potential_score,
          industry_prospects_score,
          ROUND(
            CAST(SUM(CASE WHEN type = 'lexue' THEN weighted_score ELSE 0 END) AS NUMERIC) /
            NULLIF(CAST(SUM(CASE WHEN type = 'lexue' THEN total_possible_score ELSE 0 END) AS NUMERIC), 0) * 0.5,
            2
          )::NUMERIC as lexue_score,
          ROUND(
            CAST(SUM(CASE WHEN type = 'shanxue' THEN weighted_score ELSE 0 END) AS NUMERIC) /
            NULLIF(CAST(SUM(CASE WHEN type = 'shanxue' THEN total_possible_score ELSE 0 END) AS NUMERIC), 0) * 0.5,
            2
          )::NUMERIC as shanxue_score 
        FROM major_base_data
        GROUP BY major_code, major_name, edu_level, major_brief, academic_development_score, career_development_score, growth_potential_score, industry_prospects_score
      ),
      deduction_scores AS (
        SELECT 
          ts.major_code,
          ROUND(MAX(CASE WHEN ts.type = 'tiaozhan' AND ts.type_score > 0 THEN 
            CASE 
              WHEN ts.potential_conversion_value = 'medium' THEN ts.type_ratio * 0.5 * 0.25
              WHEN ts.potential_conversion_value = 'low' THEN ts.type_ratio * 0.25
              ELSE 0 
            END 
          ELSE 0 END),2) ::NUMERIC as tiaozhan_deduction,
         ROUND( MAX(CASE WHEN ts.type = 'yanxue' AND ts.type_score > 0 THEN 
            CASE 
              WHEN ts.potential_conversion_value = 'medium' THEN ts.type_ratio * 0.5 * 0.25
              WHEN ts.potential_conversion_value = 'low' THEN ts.type_ratio *0.25
              ELSE 0 
            END 
          ELSE 0 END),2) :: NUMERIC  as yanxue_deduction
        FROM type_scores ts
        GROUP BY ts.major_code
      ),
      final_scores AS (
        SELECT 
          ss.major_code,
          ss.major_name,
          ss.edu_level,  
		      ss.major_brief, 
          ss.academic_development_score,
          ss.career_development_score,
          ss.growth_potential_score,
          ss.industry_prospects_score,
          COALESCE(ss.lexue_score, 0) as lexue_score,
          COALESCE(ss.shanxue_score, 0) as shanxue_score,
          COALESCE(ds.yanxue_deduction, 0) as yanxue_deduction,
          COALESCE(ds.tiaozhan_deduction, 0) as tiaozhan_deduction,
          COALESCE(smc.school_majors_count, 0) as school_count,
          -- 计算基础得分
          COALESCE(ss.lexue_score, 0) + COALESCE(ss.shanxue_score, 0) - (COALESCE(ds.tiaozhan_deduction, 0) + COALESCE(ds.yanxue_deduction, 0)) as base_score,
          -- 计算学术发展得分（取整数）
          ROUND(((COALESCE(ss.lexue_score, 0)  + COALESCE(ss.shanxue_score, 0) )  * 25 * 0.5) + (COALESCE(ss.academic_development_score, 0) / 100 * 25 * 0.5)) as academic_development_raw,
          -- 计算职业发展得分（取整数）
          ROUND((COALESCE(ss.lexue_score, 0) + COALESCE(ss.shanxue_score, 0) - (COALESCE(ds.tiaozhan_deduction, 0) + COALESCE(ds.yanxue_deduction, 0))) * 25 * 0.5 + COALESCE(ss.career_development_score, 0) / 100 * 25 * 0.5) as career_development_raw,

          -- 计算成长潜力得分（取整数）
          ROUND((COALESCE(ss.lexue_score, 0) + COALESCE(ss.shanxue_score, 0) - (COALESCE(ds.tiaozhan_deduction, 0) + COALESCE(ds.yanxue_deduction, 0))) * 25 * 0.5 + COALESCE(ss.growth_potential_score, 0) / 100 * 25 * 0.5) as growth_potential_raw
        FROM study_scores ss
        JOIN deduction_scores ds ON ds.major_code = ss.major_code
        LEFT JOIN school_majors_count smc ON smc.major_code = ss.major_code
      )
      SELECT 
         fs.lexue_score,
         fs.major_code as "majorCode",
         ROUND(CAST((fs.academic_development_raw + fs.career_development_raw +
	     	ROUND((COALESCE(fs.career_development_raw, 0) + COALESCE(fs.growth_potential_raw, 0)) /50 * 25 * 0.5 + COALESCE(fs.industry_prospects_score, 0) / 100 * 25 * 0.5)
		       + fs.growth_potential_raw) / 2 + fs.base_score * 100 / 2 AS NUMERIC))::NUMERIC as developmentPotential
        
      FROM final_scores fs 
      ORDER BY developmentPotential DESC
      LIMIT 154
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