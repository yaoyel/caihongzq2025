-- 完整专业数据导入脚本
-- 包含本科专业（ID: 1-950）和专科专业（ID: 951-1837）
-- 总计: 1837条专业记录
-- 自动生成于: 2025年6月9日

-- 开始事务（确保数据一致性）
BEGIN;

-- 1. 创建专业表（如果不存在）
-- CREATE TABLE IF NOT EXISTS majors (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(100) NOT NULL,
--     code VARCHAR(10) NOT NULL UNIQUE,
--     edu_level VARCHAR(10) NOT NULL DEFAULT 'ben',
--     level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
--     parent_id INTEGER NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- 2. 清空现有数据（可选，谨慎使用）
-- TRUNCATE TABLE majors RESTART IDENTITY CASCADE;

-- 3. 导入本科专业数据
\echo '开始导入本科专业数据...'
\i insert_majors_data.sql

\echo '本科专业数据导入完成！'

-- 4. 导入专科专业数据
\echo '开始导入专科专业数据...'
\i insert_zhuanke_majors_data.sql

\echo '专科专业数据导入完成！'

-- 5. 数据验证和统计
\echo '========== 数据导入统计 =========='

-- 按教育层次和层级统计
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

-- 总体统计
SELECT 
    '总计' AS 统计项目,
    COUNT(*) AS 数量
FROM majors
UNION ALL
SELECT 
    '本科专业' AS 统计项目,
    COUNT(*) AS 数量
FROM majors 
WHERE edu_level = 'ben'
UNION ALL
SELECT 
    '专科专业' AS 统计项目,
    COUNT(*) AS 数量
FROM majors 
WHERE edu_level = 'zhuan';

-- 验证父子关系数据完整性
SELECT 
    '孤儿记录数量' AS 检查项目,
    COUNT(*) AS 数量
FROM majors m1
WHERE m1.parent_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM majors m2 WHERE m2.id = m1.parent_id
  );

-- 验证专业代码唯一性
SELECT 
    '重复代码数量' AS 检查项目,
    COUNT(*) AS 数量
FROM (
    SELECT code 
    FROM majors 
    GROUP BY code 
    HAVING COUNT(*) > 1
) duplicates;

-- 提交事务
COMMIT;

\echo '========== 数据导入完成 =========='
\echo '请检查上述统计信息确认数据导入是否成功！' 