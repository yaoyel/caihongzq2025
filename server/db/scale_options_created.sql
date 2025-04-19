-- 创建量表选项表
CREATE TABLE scale_options (
  id SERIAL PRIMARY KEY,                  -- 选项ID，自增主键
  scale_id INTEGER NOT NULL,              -- 关联的量表ID
  option_name VARCHAR(100) NOT NULL,      -- 选项名称
  option_value INTEGER NOT NULL,          -- 选项分值
  display_order INTEGER,         -- 显示顺序
  additional_info VARCHAR(255),                   -- 附加信息/描述
  is_default BOOLEAN DEFAULT FALSE,       -- 是否为默认选项
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
  
  -- 外键约束
  CONSTRAINT fk_scale_options_scale_id FOREIGN KEY (scale_id) REFERENCES scales(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_scale_options_scale_id ON scale_options(scale_id);

 
-- 添加注释
COMMENT ON TABLE scale_options IS '量表选项表，存储每个量表题目的选项信息';
COMMENT ON COLUMN scale_options.id IS '选项ID，自增主键';
COMMENT ON COLUMN scale_options.scale_id IS '关联的量表ID，外键引用scales表';
COMMENT ON COLUMN scale_options.option_name IS '选项名称，如"非常符合"、"比较符合"等';
COMMENT ON COLUMN scale_options.option_value IS '选项对应的分值，用于计算结果';
COMMENT ON COLUMN scale_options.display_order IS '选项的显示顺序';
COMMENT ON COLUMN scale_options.additional_info IS '选项的附加信息或详细描述';
COMMENT ON COLUMN scale_options.is_default IS '是否为默认选项'; 