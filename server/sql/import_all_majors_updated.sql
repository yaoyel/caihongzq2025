-- 完整专业数据导入脚本
-- 包含本科专业（ID: 1-950）、专科专业（ID: 951-1837）和高职本科专业（ID: 1838-2246）
-- 总计: 2246条专业记录
-- 自动生成于: 2025年6月9日

BEGIN;

-- 1. 插入本科专业数据（ID: 1-950）
\i insert_majors_data.sql

-- 2. 插入专科专业数据（ID: 951-1837）  
\i insert_zhuanke_majors_data.sql

-- 3. 插入高职本科专业数据（ID: 1838-2246）
\i insert_gaoben_majors_data.sql

-- 数据验证和统计查询
DO $$
BEGIN
    RAISE NOTICE '===== 专业数据导入统计 =====';
    
    -- 总体统计
    RAISE NOTICE '总记录数: %', (SELECT COUNT(*) FROM majors);
    
    -- 按教育层次统计
    RAISE NOTICE '===== 教育层次统计 =====';
    RAISE NOTICE '本科专业 (ben): %', (SELECT COUNT(*) FROM majors WHERE edu_level = 'ben');
    RAISE NOTICE '专科专业 (zhuan): %', (SELECT COUNT(*) FROM majors WHERE edu_level = 'zhuan');  
    RAISE NOTICE '高职本科 (gao_ben): %', (SELECT COUNT(*) FROM majors WHERE edu_level = 'gao_ben');
    
    -- 按层级统计
    RAISE NOTICE '===== 层级统计 =====';
    RAISE NOTICE '一级分类 (level=1): %', (SELECT COUNT(*) FROM majors WHERE level = 1);
    RAISE NOTICE '二级分类 (level=2): %', (SELECT COUNT(*) FROM majors WHERE level = 2);
    RAISE NOTICE '三级分类 (level=3): %', (SELECT COUNT(*) FROM majors WHERE level = 3);
    
    -- ID范围验证
    RAISE NOTICE '===== ID范围验证 =====';
    RAISE NOTICE '本科专业ID范围: % - %', 
        (SELECT MIN(id) FROM majors WHERE edu_level = 'ben'),
        (SELECT MAX(id) FROM majors WHERE edu_level = 'ben');
    RAISE NOTICE '专科专业ID范围: % - %',
        (SELECT MIN(id) FROM majors WHERE edu_level = 'zhuan'),
        (SELECT MAX(id) FROM majors WHERE edu_level = 'zhuan');
    RAISE NOTICE '高职本科ID范围: % - %',
        (SELECT MIN(id) FROM majors WHERE edu_level = 'gao_ben'),
        (SELECT MAX(id) FROM majors WHERE edu_level = 'gao_ben');
    
    -- 数据完整性检查
    RAISE NOTICE '===== 数据完整性检查 =====';
    
    -- 检查是否有ID重复
    IF EXISTS (
        SELECT id FROM majors 
        GROUP BY id 
        HAVING COUNT(*) > 1
    ) THEN
        RAISE WARNING '发现重复的ID！';
    ELSE
        RAISE NOTICE '✓ ID唯一性检查通过';
    END IF;
    
    -- 检查父子关系完整性
    IF EXISTS (
        SELECT m.id 
        FROM majors m 
        WHERE m.parent_id IS NOT NULL 
        AND NOT EXISTS (
            SELECT 1 FROM majors p WHERE p.id = m.parent_id
        )
    ) THEN
        RAISE WARNING '发现无效的父级关系！';
    ELSE
        RAISE NOTICE '✓ 父子关系完整性检查通过';
    END IF;
    
    -- 检查层级关系一致性  
    IF EXISTS (
        SELECT m.id
        FROM majors m
        JOIN majors p ON m.parent_id = p.id
        WHERE m.level != p.level + 1
    ) THEN
        RAISE WARNING '发现层级关系不一致！';
    ELSE
        RAISE NOTICE '✓ 层级关系一致性检查通过';
    END IF;
    
    RAISE NOTICE '===== 导入完成 =====';
END $$;

-- 常用查询示例
-- 查询各教育层次的专业数量分布
SELECT 
    edu_level,
    CASE 
        WHEN edu_level = 'ben' THEN '本科'
        WHEN edu_level = 'zhuan' THEN '专科'
        WHEN edu_level = 'gao_ben' THEN '高职本科'
    END as education_type,
    level,
    CASE 
        WHEN level = 1 THEN '专业大类'
        WHEN level = 2 THEN '专业类'
        WHEN level = 3 THEN '具体专业'
    END as level_type,
    COUNT(*) as count
FROM majors 
GROUP BY edu_level, level 
ORDER BY edu_level, level;

-- 查询ID分布情况
SELECT 
    edu_level,
    MIN(id) as min_id,
    MAX(id) as max_id,
    COUNT(*) as total_count
FROM majors 
GROUP BY edu_level 
ORDER BY min_id;

COMMIT; 