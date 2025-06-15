import winston from 'winston';
import path from 'path';
import fs from 'fs';

// 确保 logs 目录存在
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// 定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 创建 logger 实例
export const logger = winston.createLogger({
  format: logFormat,
  transports: [
    // 错误日志
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // 所有日志
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // // 开发环境下同时输出到控制台
    // ...(process.env.NODE_ENV !== 'production' 
    //   ? [new winston.transports.Console({
    //       format: winston.format.combine(
    //         winston.format.colorize(),
    //         winston.format.simple()
    //       )
    //     })]
    //   : [])
  ]
});