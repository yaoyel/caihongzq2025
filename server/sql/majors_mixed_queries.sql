-- 本科和专科专业混合查询示例
-- =====================================

-- 1. 查询所有教育层次的专业统计
SELECT 
    CASE 
        WHEN edu_level = 'ben' THEN '本科'
        WHEN edu_level = 'zhuan' THEN '专科'
        ELSE edu_level
    END AS 教育层次,
    CASE 
        WHEN level = 1 THEN '门类/大类'
        WHEN level = 2 THEN '专业类'
        WHEN level = 3 THEN '具体专业'
        ELSE '未知'
    END AS 层级,
    COUNT(*) AS 数量
FROM majors 
GROUP BY edu_level, level 
ORDER BY edu_level, level;

-- 2. 查询特定名称的本科和专科专业对比
SELECT 
    name AS 专业名称,
    code AS 专业代码,
    CASE 
        WHEN edu_level = 'ben' THEN '本科'
        WHEN edu_level = 'zhuan' THEN '专科'
        ELSE edu_level
    END AS 教育层次,
    level AS 层级
FROM majors 
WHERE name LIKE '%计算机%' 
ORDER BY name, edu_level;

-- 3. 查询本科和专科都有的相同名称专业
SELECT 
    m1.name AS 专业名称,
    m1.code AS 本科代码,
    m2.code AS 专科代码,
    m1.level AS 层级
FROM majors m1
INNER JOIN majors m2 ON m1.name = m2.name 
WHERE m1.edu_level = 'ben' 
  AND m2.edu_level = 'zhuan'
ORDER BY m1.name;

-- 4. 查询各教育层次的顶级分类（门类/大类）
SELECT 
    CASE 
        WHEN edu_level = 'ben' THEN '本科'
        WHEN edu_level = 'zhuan' THEN '专科'
        ELSE edu_level
    END AS 教育层次,
    name AS 门类名称,
    code AS 门类代码,
    (SELECT COUNT(*) FROM majors c WHERE c.parent_id = m.id) AS 直接子类数量
FROM majors m
WHERE level = 1 
ORDER BY edu_level, code;

-- 5. 查询特定领域的本科和专科专业对比（如：工程技术类）
SELECT 
    CASE 
        WHEN edu_level = 'ben' THEN '本科'
        WHEN edu_level = 'zhuan' THEN '专科'
        ELSE edu_level
    END AS 教育层次,
    name AS 专业名称,
    code AS 专业代码,
    level AS 层级
FROM majors 
WHERE (name LIKE '%工程%' OR name LIKE '%技术%')
  AND level = 3
ORDER BY name, edu_level;

-- 6. 递归查询：获取指定本科门类对应的专科大类的完整专业树
WITH RECURSIVE major_tree AS (
    -- 查找本科"工学"对应的专科大类
    SELECT id, name, code, edu_level, level, parent_id, 0 AS depth,
           CAST(name AS TEXT) AS path
    FROM majors 
    WHERE name LIKE '%工程%' AND level = 1 AND edu_level = 'zhuan'
    
    UNION ALL
    
    -- 递归查找子专业
    SELECT m.id, m.name, m.code, m.edu_level, m.level, m.parent_id, 
           mt.depth + 1,
           CAST(mt.path || ' > ' || m.name AS TEXT) AS path
    FROM majors m
    INNER JOIN major_tree mt ON m.parent_id = mt.id
)
SELECT 
    depth AS 层次深度,
    name AS 专业名称,
    code AS 专业代码,
    level AS 层级,
    path AS 完整路径
FROM major_tree 
ORDER BY depth, code;

-- 7. 查询教育层次对应关系分析
SELECT 
    '数据概览' AS 类别,
    '本科门类数' AS 项目,
    COUNT(*) AS 数值
FROM majors 
WHERE edu_level = 'ben' AND level = 1
UNION ALL
SELECT 
    '数据概览' AS 类别,
    '专科大类数' AS 项目,
    COUNT(*) AS 数值
FROM majors 
WHERE edu_level = 'zhuan' AND level = 1
UNION ALL
SELECT 
    '数据概览' AS 类别,
    '本科具体专业数' AS 项目,
    COUNT(*) AS 数值
FROM majors 
WHERE edu_level = 'ben' AND level = 3
UNION ALL
SELECT 
    '数据概览' AS 类别,
    '专科具体专业数' AS 项目,
    COUNT(*) AS 数值
FROM majors 
WHERE edu_level = 'zhuan' AND level = 3;

-- 8. 按专业代码规律分析本科和专科差异
SELECT 
    CASE 
        WHEN edu_level = 'ben' THEN '本科'
        WHEN edu_level = 'zhuan' THEN '专科'
        ELSE edu_level
    END AS 教育层次,
    LEFT(code, 2) AS 代码前缀,
    COUNT(*) AS 数量,
    STRING_AGG(DISTINCT name, ', ' ORDER BY name) AS 代表专业
FROM majors 
WHERE level = 1
GROUP BY edu_level, LEFT(code, 2)
ORDER BY 代码前缀, edu_level;

-- 9. 查询跨教育层次的专业名称匹配度
SELECT 
    similarity,
    COUNT(*) AS 匹配数量
FROM (
    SELECT 
        CASE 
            WHEN m1.name = m2.name THEN '完全匹配'
            WHEN m1.name LIKE '%' || m2.name || '%' OR m2.name LIKE '%' || m1.name || '%' THEN '部分匹配'
            ELSE '不匹配'
        END AS similarity
    FROM majors m1
    CROSS JOIN majors m2
    WHERE m1.edu_level = 'ben' 
      AND m2.edu_level = 'zhuan'
      AND m1.level = 3 
      AND m2.level = 3
      AND (m1.name = m2.name OR m1.name LIKE '%' || m2.name || '%' OR m2.name LIKE '%' || m1.name || '%')
) matches
GROUP BY similarity;

-- 10. 数据完整性检查
SELECT 
    '数据完整性检查' AS 检查类型,
    '孤儿记录' AS 检查项目,
    COUNT(*) AS 问题数量
FROM majors m1
WHERE m1.parent_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM majors m2 WHERE m2.id = m1.parent_id)
UNION ALL
SELECT 
    '数据完整性检查' AS 检查类型,
    '重复代码' AS 检查项目,
    COUNT(*) AS 问题数量
FROM (
    SELECT code 
    FROM majors 
    GROUP BY code 
    HAVING COUNT(*) > 1
) duplicates; 