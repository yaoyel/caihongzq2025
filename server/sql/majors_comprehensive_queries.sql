-- 专业数据综合查询示例 SQL 脚本
-- 包含本科、专科、高职本科三个教育层次的查询示例
-- 生成时间: 2025年6月9日

-- =============================================================================
-- 1. 基础统计查询
-- =============================================================================

-- 1.1 总体数据概览
SELECT 
    '总计' as category,
    COUNT(*) as total_count,
    COUNT(CASE WHEN level = 1 THEN 1 END) as level1_count,
    COUNT(CASE WHEN level = 2 THEN 1 END) as level2_count,
    COUNT(CASE WHEN level = 3 THEN 1 END) as level3_count
FROM majors
UNION ALL
SELECT 
    CASE 
        WHEN edu_level = 'ben' THEN '本科专业'
        WHEN edu_level = 'zhuan' THEN '专科专业'
        WHEN edu_level = 'gao_ben' THEN '高职本科'
    END as category,
    COUNT(*) as total_count,
    COUNT(CASE WHEN level = 1 THEN 1 END) as level1_count,
    COUNT(CASE WHEN level = 2 THEN 1 END) as level2_count,
    COUNT(CASE WHEN level = 3 THEN 1 END) as level3_count
FROM majors
GROUP BY edu_level
ORDER BY category;

-- 1.2 各教育层次专业大类对比
SELECT 
    m1.name as major_category,
    m1.code,
    COUNT(CASE WHEN m2.edu_level = 'ben' THEN 1 END) as ben_count,
    COUNT(CASE WHEN m2.edu_level = 'zhuan' THEN 1 END) as zhuan_count,
    COUNT(CASE WHEN m2.edu_level = 'gao_ben' THEN 1 END) as gao_ben_count,
    COUNT(*) as total_count
FROM majors m1
LEFT JOIN majors m2 ON (m1.id = m2.parent_id OR m1.id = m2.id)
WHERE m1.level = 1
GROUP BY m1.id, m1.name, m1.code
ORDER BY m1.code;

-- =============================================================================
-- 2. 专业代码体系分析
-- =============================================================================

-- 2.1 专业代码分布分析
SELECT 
    edu_level,
    CASE 
        WHEN edu_level = 'ben' THEN '本科 (01-13)'
        WHEN edu_level = 'zhuan' THEN '专科 (41-59)'  
        WHEN edu_level = 'gao_ben' THEN '高职本科 (21-39)'
    END as code_range,
    MIN(code) as min_code,
    MAX(code) as max_code,
    COUNT(*) as count
FROM majors 
WHERE level = 1
GROUP BY edu_level
ORDER BY edu_level;

-- 2.2 专业代码重叠分析（查找同名但不同层次的专业）
SELECT 
    name,
    COUNT(DISTINCT edu_level) as edu_level_count,
    STRING_AGG(DISTINCT edu_level, ', ') as edu_levels,
    STRING_AGG(DISTINCT code, ', ') as codes
FROM majors
GROUP BY name
HAVING COUNT(DISTINCT edu_level) > 1
ORDER BY name;

-- =============================================================================
-- 3. 层级结构查询
-- =============================================================================

-- 3.1 完整三级专业树结构示例（以计算机相关专业为例）
WITH RECURSIVE major_tree AS (
    -- 根节点：查找包含"计算机"或"电子信息"的一级分类
    SELECT 
        id, name, code, edu_level, level, parent_id,
        name as root_name,
        1 as depth,
        CAST(name as TEXT) as path
    FROM majors 
    WHERE level = 1 
    AND (name LIKE '%计算机%' OR name LIKE '%电子%' OR name LIKE '%信息%')
    
    UNION ALL
    
    -- 递归查找子节点
    SELECT 
        m.id, m.name, m.code, m.edu_level, m.level, m.parent_id,
        mt.root_name,
        mt.depth + 1,
        mt.path || ' > ' || m.name
    FROM majors m
    INNER JOIN major_tree mt ON m.parent_id = mt.id
)
SELECT 
    edu_level,
    CASE 
        WHEN edu_level = 'ben' THEN '本科'
        WHEN edu_level = 'zhuan' THEN '专科'  
        WHEN edu_level = 'gao_ben' THEN '高职本科'
    END as education_type,
    level,
    REPEAT('  ', depth - 1) || name as indented_name,
    code,
    path
FROM major_tree
ORDER BY edu_level, id;

-- 3.2 查询各层次最大的专业类别（按专业数量）
SELECT 
    edu_level,
    parent.name as category_name,
    parent.code as category_code,
    COUNT(child.id) as major_count
FROM majors parent
LEFT JOIN majors child ON parent.id = child.parent_id
WHERE parent.level = 1
GROUP BY edu_level, parent.id, parent.name, parent.code
ORDER BY edu_level, major_count DESC;

-- =============================================================================
-- 4. 交叉分析查询
-- =============================================================================

-- 4.1 三个层次都有的专业大类
SELECT 
    name,
    STRING_AGG(DISTINCT code ORDER BY code) as codes,
    STRING_AGG(DISTINCT edu_level ORDER BY edu_level) as edu_levels
FROM majors
WHERE level = 1
GROUP BY name
HAVING COUNT(DISTINCT edu_level) = 3
ORDER BY name;

-- 4.2 只在某个教育层次存在的专业大类
SELECT 
    edu_level,
    CASE 
        WHEN edu_level = 'ben' THEN '仅本科'
        WHEN edu_level = 'zhuan' THEN '仅专科'
        WHEN edu_level = 'gao_ben' THEN '仅高职本科'
    END as unique_to,
    name,
    code
FROM majors
WHERE level = 1
AND name NOT IN (
    SELECT name 
    FROM majors 
    WHERE level = 1
    GROUP BY name 
    HAVING COUNT(DISTINCT edu_level) > 1
)
ORDER BY edu_level, name;

-- =============================================================================
-- 5. 实用查询示例
-- =============================================================================

-- 5.1 搜索专业（模糊匹配）
-- 使用示例：搜索包含"计算机"的专业
SELECT 
    edu_level,
    CASE 
        WHEN edu_level = 'ben' THEN '本科'
        WHEN edu_level = 'zhuan' THEN '专科'
        WHEN edu_level = 'gao_ben' THEN '高职本科'
    END as education_type,
    level,
    name,
    code,
    CASE 
        WHEN parent_id IS NULL THEN '专业大类'
        ELSE (SELECT name FROM majors p WHERE p.id = majors.parent_id)
    END as parent_category
FROM majors
WHERE name LIKE '%计算机%'
ORDER BY edu_level, level, name;

-- 5.2 按专业代码查询完整路径
-- 使用示例：查询代码为 '080901' 的专业路径
WITH RECURSIVE major_path AS (
    SELECT 
        id, name, code, level, parent_id,
        name as path,
        1 as depth
    FROM majors 
    WHERE code = '080901'  -- 可替换为任意专业代码
    
    UNION ALL
    
    SELECT 
        p.id, p.name, p.code, p.level, p.parent_id,
        p.name || ' > ' || mp.path,
        mp.depth + 1
    FROM majors p
    INNER JOIN major_path mp ON p.id = mp.parent_id
)
SELECT 
    path as full_path,
    code as target_code
FROM major_path
ORDER BY depth DESC
LIMIT 1;

-- 5.3 查询某个专业类下的所有具体专业
-- 使用示例：查询"计算机类"下的所有专业
SELECT 
    parent.edu_level,
    parent.name as category_name,
    child.name as major_name,
    child.code as major_code
FROM majors parent
JOIN majors child ON parent.id = child.parent_id
WHERE parent.name LIKE '%计算机类%'
AND child.level = 3
ORDER BY parent.edu_level, child.name;

-- =============================================================================
-- 6. 数据质量检查查询
-- =============================================================================

-- 6.1 检查ID连续性
SELECT 
    edu_level,
    MIN(id) as min_id,
    MAX(id) as max_id,
    COUNT(*) as actual_count,
    MAX(id) - MIN(id) + 1 as expected_count,
    CASE 
        WHEN COUNT(*) = MAX(id) - MIN(id) + 1 THEN '连续'
        ELSE '不连续'
    END as continuity_status
FROM majors
GROUP BY edu_level
ORDER BY min_id;

-- 6.2 检查编码规范性
SELECT 
    edu_level,
    level,
    code,
    name,
    CASE 
        WHEN level = 1 AND LENGTH(code) != 2 THEN '一级代码长度异常'
        WHEN level = 2 AND LENGTH(code) != 4 THEN '二级代码长度异常'
        WHEN level = 3 AND LENGTH(code) != 6 THEN '三级代码长度异常'
        ELSE 'OK'
    END as code_validation
FROM majors
WHERE CASE 
    WHEN level = 1 AND LENGTH(code) != 2 THEN TRUE
    WHEN level = 2 AND LENGTH(code) != 4 THEN TRUE
    WHEN level = 3 AND LENGTH(code) != 6 THEN TRUE
    ELSE FALSE
END
ORDER BY edu_level, level, code;

-- 6.3 统计各层级专业数量分布
SELECT 
    edu_level,
    level,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM majors
GROUP BY edu_level, level
ORDER BY edu_level, level; 