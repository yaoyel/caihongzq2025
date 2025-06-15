-- 专业详情表建表脚本
-- 表名: major_details
-- 创建时间: 2025年6月9日

-- 删除现有表（如果存在）
DROP TABLE IF EXISTS major_details CASCADE;

-- 创建专业详情表
CREATE TABLE major_details (
    -- 主键字段
    id SERIAL PRIMARY KEY,
    
    -- 关联字段
    code VARCHAR(10) UNIQUE NOT NULL,
    
    -- 基本信息字段
    education_level VARCHAR(20),
    study_period VARCHAR(20),
    awarded_degree VARCHAR(50),
    gender_ratio VARCHAR(30),
    
    -- 详情信息字段
    introduction TEXT,
    training_objective TEXT,
    training_requirements TEXT,
    subject_requirements TEXT,
    knowledge_ability TEXT,
    postgraduate_direction TEXT,
    main_courses TEXT,
    famous_people TEXT,
    
    -- 时间戳字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 添加字段注释
COMMENT ON TABLE major_details IS '专业详情表 - 存储专业的详细信息';
COMMENT ON COLUMN major_details.id IS '专业详情唯一标识符';
COMMENT ON COLUMN major_details.code IS '专业代码，关联专业表的code字段';
COMMENT ON COLUMN major_details.education_level IS '学历层次（如：本科、专科、高职本科）';
COMMENT ON COLUMN major_details.study_period IS '修业年限（如：四年、三年、两年）';
COMMENT ON COLUMN major_details.awarded_degree IS '授予学位（如：工学学士、理学学士）';
COMMENT ON COLUMN major_details.gender_ratio IS '男女比例（如：6:4、5:5）';
COMMENT ON COLUMN major_details.introduction IS '专业介绍和基本概述';
COMMENT ON COLUMN major_details.training_objective IS '专业培养目标';
COMMENT ON COLUMN major_details.training_requirements IS '专业培养要求和标准';
COMMENT ON COLUMN major_details.subject_requirements IS '学科基础要求';
COMMENT ON COLUMN major_details.knowledge_ability IS '应掌握的知识和能力';
COMMENT ON COLUMN major_details.postgraduate_direction IS '主要考研升学方向';
COMMENT ON COLUMN major_details.main_courses IS '主要专业课程设置';
COMMENT ON COLUMN major_details.famous_people IS '该专业的知名校友或行业名人';
COMMENT ON COLUMN major_details.created_at IS '记录创建时间';
COMMENT ON COLUMN major_details.updated_at IS '记录最后更新时间';

-- 创建索引
CREATE INDEX idx_major_details_code ON major_details(code);
CREATE INDEX idx_major_details_education_level ON major_details(education_level);

-- 添加外键约束（关联专业表）
ALTER TABLE major_details 
ADD CONSTRAINT fk_major_details_code 
FOREIGN KEY (code) REFERENCES majors(code) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- 创建触发器函数，自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_major_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_update_major_details_updated_at
    BEFORE UPDATE ON major_details
    FOR EACH ROW
    EXECUTE FUNCTION update_major_details_updated_at();

-- 显示创建结果
SELECT 
    'major_details' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'major_details';

-- 检查约束
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'major_details'
ORDER BY constraint_type, constraint_name; 