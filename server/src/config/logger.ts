import pino from 'pino';
import path from 'path';

// 确保logs目录存在
import fs from 'fs';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    targets: [
      // 控制台美化输出
      {
        target: 'pino-pretty',
        level: 'info',
        options: {
          colorize: true
        }
      },
      // 文件输出
      {
        target: 'pino/file',
        level: 'info',
        options: {
          destination: path.join(logsDir, 'app.log'),
          mkdir: true,
          sync: false
        }
      }
    ]
  }
});