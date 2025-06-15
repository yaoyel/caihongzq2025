-- 创建专业表（自关联父子表结构）
-- 基于 ben_major.json 数据结构设计

CREATE TABLE majors (
    id SERIAL PRIMARY KEY,                         -- 专业ID（自增长）
    name VARCHAR(100) NOT NULL,                    -- 专业名称
    code VARCHAR(10) NOT NULL UNIQUE,             -- 专业代码
    edu_level VARCHAR(10) NOT NULL DEFAULT 'ben', -- 教育层次（ben: 本科）
    level INTEGER NOT NULL CHECK (level IN (1, 2, 3)), -- 层级（1:学科门类, 2:专业类, 3:具体专业）
    parent_id INTEGER NULL,                        -- 父级专业ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    
    -- 外键约束：parent_id 引用同表的 id
    CONSTRAINT fk_major_parent FOREIGN KEY (parent_id) REFERENCES majors(id) ON DELETE CASCADE,
    
    -- 唯一约束：确保同一层级下的代码不重复
    CONSTRAINT uk_major_code_level UNIQUE (code, level)
);

-- 创建索引优化查询性能
CREATE INDEX idx_majors_parent_id ON majors(parent_id);
CREATE INDEX idx_majors_level ON majors(level);
CREATE INDEX idx_majors_code ON majors(code);
CREATE INDEX idx_majors_name ON majors(name);

-- 创建更新时间自动更新的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_majors_updated_at 
    BEFORE UPDATE ON majors 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 添加表注释
COMMENT ON TABLE majors IS '专业信息表 - 支持三级分类的父子表结构';
COMMENT ON COLUMN majors.id IS '专业唯一标识符（自增长）';
COMMENT ON COLUMN majors.name IS '专业名称';
COMMENT ON COLUMN majors.code IS '专业代码';

COMMENT ON COLUMN majors.edu_level IS '教育层次（ben:本科）';
COMMENT ON COLUMN majors.level IS '层级：1=学科门类，2=专业类，3=具体专业';
COMMENT ON COLUMN majors.parent_id IS '父级专业ID，为空表示顶级';
COMMENT ON COLUMN majors.created_at IS '记录创建时间';
COMMENT ON COLUMN majors.updated_at IS '记录最后更新时间'; 