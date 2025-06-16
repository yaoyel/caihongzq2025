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
   * @returns 专业得分列表，包含总分和潜力值得分
   */
  async calculateMajorScores(userId: string): Promise<MajorScore[]> {
    // 使用原生SQL查询提升性能
    const result = await this.majorDetailRepository.query(`
      WITH user_answers AS (
        SELECT 
          s.id as scale_id,
          sa.score as score
        FROM scales s
        INNER JOIN scale_answers sa ON sa.scale_id = s.id
        WHERE sa.user_id = $1 and sa.scale_id > 112
      )
      SELECT 
        md.code as "majorCode",
        m.name as "majorName",
        m.edu_level as "eduLevel",
        SUM(CASE WHEN ua.score IS NULL THEN 0 ELSE ua.score * mea.weight END) as total_score,
        SUM(mea.weight) as weighted_count,
        SUM(mea.weight * 2) as weighted_denominator,
        ROUND(
          COALESCE(
            CAST(SUM(CASE WHEN ua.score IS NULL THEN 0 ELSE ua.score * mea.weight END) AS NUMERIC) / 
            NULLIF(CAST(SUM(mea.weight * 2) AS NUMERIC), 0),
            0
          )::NUMERIC, 
          2
        )::FLOAT as score,
        ROUND(
          COALESCE(
            CAST(SUM(CASE WHEN ua.score IS NULL OR s.action != 'potential' THEN 0 ELSE ua.score * mea.weight END) AS NUMERIC) / 
            NULLIF(CAST(SUM(CASE WHEN s.action = 'potential' THEN mea.weight * 2 ELSE 0 END) AS NUMERIC), 0),
            0
          )::NUMERIC, 
          2
        )::FLOAT as "potentialScore"
      FROM major_details md
      INNER JOIN majors m ON m.code = md.code
      INNER JOIN major_element_analysis mea ON mea.major_id = md.id
      INNER JOIN elements e ON e.id = mea.element_id
      INNER JOIN scales s ON s.element_id = e.id
      LEFT JOIN user_answers ua ON ua.scale_id = s.id
      where s.id > 112
      GROUP BY md.code, m.name, m.edu_level
      ORDER BY score DESC
    `, [userId]);

    return result;
  }
}