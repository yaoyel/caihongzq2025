import winston from 'winston';
import path from 'path';
import fs from 'fs';

// 确保 logs 目录存在并可写
const logsDir = path.join(process.cwd(), 'logs');
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  // 测试写入权限
  fs.accessSync(logsDir, fs.constants.W_OK);
} catch (error) {
  console.error('创建日志目录失败:', error);
  process.exit(1);
}

// 定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...rest }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (Object.keys(rest).length > 0) {
      log += ` ${JSON.stringify(rest)}`;
    }
    return log;
  })
);

// 创建 logger 实例
export const logger = winston.createLogger({
  level: 'info', // 设置默认日志级别
  format: logFormat,
  transports: [
    // 错误日志
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // info和debug日志
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      level: 'info',  // 设置日志级别为 info，这样只会记录 info 和 debug 级别的日志
    }),
    // 开发环境下同时输出到控制台
    ...(process.env.NODE_ENV !== 'production' 
      ? [new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })]
      : [])
  ]
});

// 添加未捕获异常的处理
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的 Promise 拒绝:', { reason, promise });
});