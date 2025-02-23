import { Service } from 'typedi';
import { AppDataSource } from '../data-source';

@Service()
export class ReportRepository {
    async getElementAnalysis(userId: number) {
        const query = `
WITH user_scores AS (
  -- 获取用户在每个量表上的得分
  SELECT 
    s.element_Id,
    s.direction,
    sa.user_Id,
    sa.score
  FROM scales s
  JOIN scale_answers sa ON s.id = sa.scale_id and user_id=$1
),

element_scores AS (
  -- 计算每个元素的正向和反向得分
  SELECT 
    element_Id,
    user_Id,
    MAX(CASE WHEN direction = 'positive' THEN 
      CASE WHEN score IN (1, 2) THEN 1 ELSE 0 END
    END) as positive_low,
    MAX(CASE WHEN direction = 'positive' THEN
      CASE WHEN score IN (3, 4, 5) THEN 1 ELSE 0 END
    END) as positive_high,
    MAX(CASE WHEN direction = 'negative' THEN
      CASE WHEN score IN (1, 2) THEN 1 ELSE 0 END
    END) as negative_low,
    MAX(CASE WHEN direction = 'negative' THEN
      CASE WHEN score IN (3, 4, 5) THEN 1 ELSE 0 END
    END) as negative_high
  FROM user_scores
  GROUP BY element_Id, user_Id
),

element_analysis AS (
  -- 分析每个元素是否喜欢/有天赋
  SELECT
    e.id as element_id,
    e.name as element_name,
	e.type,
	e.status,
    e.type as element_type,
    e.dimension,
    e.corresponding_Element_Id,
    es.user_Id,
    CASE 
      WHEN e.type = 'like' AND es.positive_low = 1 AND es.negative_high = 1 THEN 'like'
      WHEN e.type = 'like' AND es.positive_high = 1 AND es.negative_low = 1 THEN 'dislike'
      WHEN e.type = 'talent' AND es.positive_low = 1 AND es.negative_high = 1 THEN 'talented'
      WHEN e.type = 'talent' AND es.positive_high = 1 AND es.negative_low = 1 THEN 'not_talented'
      ELSE 'undefined'
    END as analysis_result
  FROM elements e
  LEFT JOIN element_scores es ON e.id = es.element_Id
),

paired_analysis AS (
  -- 将喜欢和天赋配对分析
  SELECT
    l.element_id,
	l.corresponding_Element_Id,
	l.type,
	l.status as like_status, 
    l.element_name as like_element,
    t.element_name as talent_element,
    l.dimension,
    l.user_Id,
    l.analysis_result as like_result,
    t.analysis_result as talent_result,
	t.status as talent_status 
  FROM element_analysis l
  JOIN element_analysis t ON l.corresponding_Element_Id = t.element_id
  WHERE l.element_type = 'like' AND t.element_type = 'talent'
)

-- 最终输出五种分类结果
SELECT
  element_id,
  corresponding_Element_Id,
  user_Id,
  like_status,
  talent_status,
  type,
  dimension,
  like_element,
  talent_element,
  CASE
    WHEN like_result = 'like' AND talent_result = 'talented' THEN '有喜欢有天赋'
    WHEN like_result = 'dislike' AND talent_result = 'not_talented' THEN '没喜欢没天赋'
    WHEN like_result = 'like' AND talent_result != 'talented' THEN '有喜欢没天赋'
    WHEN like_result != 'like' AND talent_result = 'talented' THEN '有天赋没喜欢'
    ELSE '待确认'
  END as category
FROM paired_analysis
ORDER BY 
  CASE
    WHEN like_result = 'like' AND talent_result = 'talented' THEN 1
    WHEN like_result = 'dislike' AND talent_result = 'not_talented' THEN 2
    WHEN like_result = 'like' AND talent_result != 'talented' THEN 3
    WHEN like_result != 'like' AND talent_result = 'talented' THEN 4
    ELSE 5
  END,
  dimension,
  like_element;
        `;

        return await AppDataSource.query(query, [userId]);
    }
}