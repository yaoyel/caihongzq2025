-- 查询喜欢的天赋、对应天赋元素、各类题目及得分
WITH LikeElements AS (
    SELECT e1.id as like_id, e1.name as like_name, 
           e2.id as talent_id, e2.name as talent_name,
           e1.dimension
    FROM elements e1
    LEFT JOIN elements e2 ON e1.correspondingElementId = e2.id
    WHERE e1.type = 'like'
)
SELECT 
    le.like_name as "喜欢的天赋",
    le.talent_name as "对应天赋的元素",
    like_pos.content as "喜欢的正向题",
    like_neg.content as "喜欢的反向题",
    talent_pos.content as "天赋的正向题",
    talent_neg.content as "天赋的反向题",
    COALESCE(AVG(CASE 
        WHEN like_pos.id = sa.scaleId THEN sa.score
        END), 0) as "喜欢正向题得分",
    COALESCE(AVG(CASE 
        WHEN talent_pos.id = sa.scaleId THEN sa.score
        END), 0) as "天赋正向题得分",
    le.dimension as "维度名称"
FROM LikeElements le
LEFT JOIN scales like_pos ON le.like_id = like_pos.elementId 
    AND like_pos.type = 'like' AND like_pos.direction = 'positive'
LEFT JOIN scales like_neg ON le.like_id = like_neg.elementId 
    AND like_neg.type = 'like' AND like_neg.direction = 'negative'
LEFT JOIN scales talent_pos ON le.talent_id = talent_pos.elementId 
    AND talent_pos.type = 'talent' AND talent_pos.direction = 'positive'
LEFT JOIN scales talent_neg ON le.talent_id = talent_neg.elementId 
    AND talent_neg.type = 'talent' AND talent_neg.direction = 'negative'
LEFT JOIN scale_answers sa ON sa.scaleId IN (
    like_pos.id, talent_pos.id
)
GROUP BY 
    le.like_name,
    le.talent_name,
    like_pos.content,
    like_neg.content,
    talent_pos.content,
    talent_neg.content,
    le.dimension
ORDER BY le.dimension;