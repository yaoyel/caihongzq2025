-- 创建订单表
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  mchid VARCHAR(32) NOT NULL,
  appid VARCHAR(32) NOT NULL,
  out_trade_no VARCHAR(32) NOT NULL,
  transaction_id VARCHAR(32),
  trade_type VARCHAR(16) NOT NULL,
  trade_state VARCHAR(32) NOT NULL,
  trade_state_desc VARCHAR(256) NOT NULL,
  bank_type VARCHAR(32) NOT NULL,
  attach VARCHAR(128),
  success_time TIMESTAMP WITH TIME ZONE NOT NULL,
  openid VARCHAR(128) NOT NULL,
  total_amount INTEGER NOT NULL,
  payer_total INTEGER NOT NULL,
  currency VARCHAR(16) DEFAULT 'CNY' NOT NULL,
  payer_currency VARCHAR(16) DEFAULT 'CNY' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 添加注释
COMMENT ON TABLE orders IS '支付订单表';
COMMENT ON COLUMN orders.id IS '主键ID';
COMMENT ON COLUMN orders.mchid IS '商户号';
COMMENT ON COLUMN orders.appid IS '应用ID';
COMMENT ON COLUMN orders.out_trade_no IS '商户订单号';
COMMENT ON COLUMN orders.transaction_id IS '微信支付订单号';
COMMENT ON COLUMN orders.trade_type IS '交易类型';
COMMENT ON COLUMN orders.trade_state IS '交易状态';
COMMENT ON COLUMN orders.trade_state_desc IS '交易状态描述';
COMMENT ON COLUMN orders.bank_type IS '付款银行';
COMMENT ON COLUMN orders.attach IS '附加数据';
COMMENT ON COLUMN orders.success_time IS '支付成功时间';
COMMENT ON COLUMN orders.openid IS '用户标识';
COMMENT ON COLUMN orders.total_amount IS '订单金额(分)';
COMMENT ON COLUMN orders.payer_total IS '用户支付金额(分)';
COMMENT ON COLUMN orders.currency IS '货币类型';
COMMENT ON COLUMN orders.payer_currency IS '用户支付币种';
COMMENT ON COLUMN orders.created_at IS '创建时间';
COMMENT ON COLUMN orders.updated_at IS '更新时间';

-- 创建索引
CREATE INDEX idx_orders_openid ON orders(openid);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 