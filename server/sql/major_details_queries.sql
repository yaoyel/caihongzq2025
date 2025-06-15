-- 专业详情表查询示例 SQL 脚本
-- 创建时间: 2025年6月9日

-- =============================================================================
-- 1. 基础查询示例
-- =============================================================================

-- 1.1 查询所有专业详情
SELECT 
    md.id,
    md.code,
    m.name as major_name,
    md.education_level,
    md.study_period,
    md.awarded_degree,
    md.gender_ratio
FROM major_details md
JOIN majors m ON md.code = m.code
ORDER BY md.code;

-- 1.2 根据专业代码查询详情
SELECT 
    m.name as major_name,
    m.level,
    md.*
FROM major_details md
JOIN majors m ON md.code = m.code
WHERE md.code = '080901';  -- 替换为具体的专业代码

-- 1.3 查询本科专业的详情
SELECT 
    m.name as major_name,
    md.education_level,
    md.study_period,
    md.awarded_degree,
    LEFT(md.introduction, 100) as introduction_preview
FROM major_details md
JOIN majors m ON md.code = m.code
WHERE m.edu_level = 'ben'
AND m.level = 3  -- 具体专业
ORDER BY m.name;

-- =============================================================================
-- 2. 统计分析查询
-- =============================================================================

-- 2.1 按学历层次统计专业详情数量
SELECT 
    md.education_level,
    COUNT(*) as detail_count,
    COUNT(md.introduction) as has_introduction,
    COUNT(md.training_objective) as has_training_objective,
    COUNT(md.main_courses) as has_main_courses
FROM major_details md
GROUP BY md.education_level
ORDER BY detail_count DESC;

-- 2.2 按修业年限统计
SELECT 
    md.study_period,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM major_details), 2) as percentage
FROM major_details md
WHERE md.study_period IS NOT NULL
GROUP BY md.study_period
ORDER BY count DESC;

-- 2.3 按授予学位统计
SELECT 
    md.awarded_degree,
    COUNT(*) as count
FROM major_details md
WHERE md.awarded_degree IS NOT NULL
GROUP BY md.awarded_degree
ORDER BY count DESC;

-- =============================================================================
-- 3. 数据完整性查询
-- =============================================================================

-- 3.1 查询信息完整度高的专业
SELECT 
    m.name as major_name,
    md.code,
    CASE 
        WHEN md.education_level IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN md.study_period IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN md.awarded_degree IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN md.gender_ratio IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN md.introduction IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN md.training_objective IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN md.training_requirements IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN md.subject_requirements IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN md.knowledge_ability IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN md.postgraduate_direction IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN md.main_courses IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN md.famous_people IS NOT NULL THEN 1 ELSE 0 END as completeness_score
FROM major_details md
JOIN majors m ON md.code = m.code
ORDER BY completeness_score DESC, m.name;

-- 3.2 查询缺少关键信息的专业
SELECT 
    m.name as major_name,
    md.code,
    CASE WHEN md.introduction IS NULL THEN '缺少专业介绍' END as missing_introduction,
    CASE WHEN md.training_objective IS NULL THEN '缺少培养目标' END as missing_training_objective,
    CASE WHEN md.main_courses IS NULL THEN '缺少主要课程' END as missing_main_courses
FROM major_details md
JOIN majors m ON md.code = m.code
WHERE md.introduction IS NULL 
   OR md.training_objective IS NULL 
   OR md.main_courses IS NULL
ORDER BY m.name;

-- =============================================================================
-- 4. 关联查询示例
-- =============================================================================

-- 4.1 查询专业的完整层级信息和详情
WITH major_hierarchy AS (
    -- 查询专业的完整层级路径
    SELECT 
        m3.id,
        m3.code,
        m3.name as major_name,
        m2.name as category_name,
        m1.name as discipline_name,
        m3.edu_level
    FROM majors m3
    LEFT JOIN majors m2 ON m3.parent_id = m2.id
    LEFT JOIN majors m1 ON m2.parent_id = m1.id
    WHERE m3.level = 3  -- 具体专业
)
SELECT 
    mh.discipline_name,
    mh.category_name,
    mh.major_name,
    mh.edu_level,
    md.education_level,
    md.study_period,
    md.awarded_degree,
    LEFT(md.introduction, 150) as introduction_preview
FROM major_hierarchy mh
LEFT JOIN major_details md ON mh.code = md.code
ORDER BY mh.discipline_name, mh.category_name, mh.major_name;

-- 4.2 查询同一专业类别下的专业详情对比
SELECT 
    parent.name as category_name,
    child.name as major_name,
    child.code,
    md.education_level,
    md.study_period,
    md.awarded_degree,
    CASE WHEN md.id IS NOT NULL THEN '有详情' ELSE '无详情' END as has_details
FROM majors parent
JOIN majors child ON parent.id = child.parent_id
LEFT JOIN major_details md ON child.code = md.code
WHERE parent.name LIKE '%计算机%'  -- 可替换为其他专业类别
AND child.level = 3
ORDER BY parent.name, child.name;

-- =============================================================================
-- 5. 搜索查询示例
-- =============================================================================

-- 5.1 按专业名称搜索详情
SELECT 
    m.name as major_name,
    m.code,
    md.education_level,
    md.study_period,
    md.awarded_degree,
    LEFT(md.introduction, 200) as introduction_preview
FROM majors m
LEFT JOIN major_details md ON m.code = md.code
WHERE m.name LIKE '%计算机%'  -- 替换搜索关键词
AND m.level = 3
ORDER BY m.name;

-- 5.2 按专业内容搜索
SELECT 
    m.name as major_name,
    md.code,
    md.education_level,
    '专业介绍' as match_field
FROM major_details md
JOIN majors m ON md.code = m.code
WHERE md.introduction LIKE '%计算机%'
UNION ALL
SELECT 
    m.name as major_name,
    md.code,
    md.education_level,
    '培养目标' as match_field
FROM major_details md
JOIN majors m ON md.code = m.code
WHERE md.training_objective LIKE '%计算机%'
UNION ALL
SELECT 
    m.name as major_name,
    md.code,
    md.education_level,
    '主要课程' as match_field
FROM major_details md
JOIN majors m ON md.code = m.code
WHERE md.main_courses LIKE '%计算机%'
ORDER BY major_name;

-- =============================================================================
-- 6. 维护查询示例
-- =============================================================================

-- 6.1 查找没有详情的专业
SELECT 
    m.name as major_name,
    m.code,
    m.edu_level,
    CASE 
        WHEN m.edu_level = 'ben' THEN '本科'
        WHEN m.edu_level = 'zhuan' THEN '专科'
        WHEN m.edu_level = 'gao_ben' THEN '高职本科'
    END as education_type
FROM majors m
LEFT JOIN major_details md ON m.code = md.code
WHERE m.level = 3  -- 具体专业
AND md.id IS NULL
ORDER BY m.edu_level, m.name;

-- 6.2 查询最近更新的专业详情
SELECT 
    m.name as major_name,
    md.code,
    md.education_level,
    md.created_at,
    md.updated_at,
    CASE 
        WHEN md.created_at = md.updated_at THEN '新创建'
        ELSE '已更新'
    END as status
FROM major_details md
JOIN majors m ON md.code = m.code
ORDER BY md.updated_at DESC
LIMIT 20; 