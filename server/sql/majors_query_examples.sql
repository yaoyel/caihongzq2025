-- 专业表常用查询示例
-- =====================================

-- 1. 查询所有学科门类（一级分类）
SELECT id, name, code, edu_level, level, parent_id, created_at, updated_at
FROM majors 
WHERE level = 1 
ORDER BY code;

-- 2. 查询指定学科门类下的专业类（二级分类）
SELECT id, name, code, type, edu_level, level, parent_id, created_at, updated_at
FROM majors 
WHERE level = 2 AND parent_id = 1 -- 哲学门类（假设ID为1）
ORDER BY code;

-- 3. 查询指定专业类下的具体专业（三级分类）
SELECT id, name, code, type, edu_level, level, parent_id, created_at, updated_at
FROM majors 
WHERE level = 3 AND parent_id = 2 -- 哲学类（假设ID为2）
ORDER BY code;

-- 4. 获取每个专业的子专业数量（动态计算）
SELECT 
    p.id,
    p.name,
    p.code,
    p.level,
    COUNT(c.id) AS child_count
FROM majors p
LEFT JOIN majors c ON p.id = c.parent_id
GROUP BY p.id, p.name, p.code, p.level
ORDER BY p.level, p.code;

-- 5. 查询完整的专业层级结构（三级联查）
SELECT 
    l1.name AS level1_name,
    l1.code AS level1_code,
    l2.name AS level2_name,
    l2.code AS level2_code,
    l3.name AS level3_name,
    l3.code AS level3_code,
    l3.id AS major_id
FROM majors l1
LEFT JOIN majors l2 ON l1.id = l2.parent_id
LEFT JOIN majors l3 ON l2.id = l3.parent_id
WHERE l1.level = 1
ORDER BY l1.code, l2.code, l3.code;

-- 6. 递归查询：获取指定专业的所有子专业（包括孙子专业）
WITH RECURSIVE major_tree AS (
    -- 起始条件：指定的父专业
    SELECT id, name, code, level, parent_id, 0 AS depth
    FROM majors 
    WHERE id = '5fd9813c4fdf9a6f416eb15c' -- 哲学门类
    
    UNION ALL
    
    -- 递归部分：查找子专业
    SELECT m.id, m.name, m.code, m.level, m.parent_id, mt.depth + 1
    FROM majors m
    INNER JOIN major_tree mt ON m.parent_id = mt.id
)
SELECT * FROM major_tree ORDER BY depth, code;

-- 7. 查询专业的完整路径（从根到叶子节点）
WITH RECURSIVE major_path AS (
    -- 起始条件：叶子节点
    SELECT id, name, code, level, parent_id, 
           CAST(name AS TEXT) AS path,
           CAST(code AS TEXT) AS code_path
    FROM majors 
    WHERE id = '5fd9813c4fdf9a6f416eb15e' -- 哲学专业
    
    UNION ALL
    
    -- 递归部分：向上查找父专业
    SELECT m.id, m.name, m.code, m.level, m.parent_id,
           CAST(m.name || ' > ' || mp.path AS TEXT) AS path,
           CAST(m.code || ' > ' || mp.code_path AS TEXT) AS code_path
    FROM majors m
    INNER JOIN major_path mp ON m.id = mp.parent_id
)
SELECT * FROM major_path WHERE parent_id IS NULL;

-- 8. 按专业名称进行模糊搜索（支持中文）
SELECT id, name, code, level, parent_id
FROM majors 
WHERE name LIKE '%经济%'
ORDER BY level, code;

-- 9. 查询没有子专业的专业（叶子节点）
SELECT m.id, m.name, m.code, m.level
FROM majors m
LEFT JOIN majors c ON m.id = c.parent_id
WHERE c.id IS NULL
ORDER BY m.level, m.code;

-- 10. 查询每个层级的专业数量统计
SELECT 
    level,
    CASE 
        WHEN level = 1 THEN '学科门类'
        WHEN level = 2 THEN '专业类'
        WHEN level = 3 THEN '具体专业'
        ELSE '未知层级'
    END AS level_name,
    COUNT(*) AS count
FROM majors
GROUP BY level
ORDER BY level; 