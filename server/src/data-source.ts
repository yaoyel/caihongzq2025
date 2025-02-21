import 'reflect-metadata';
import { DataSource, Logger } from 'typeorm';
import { User } from './entities/User';
import { Element } from './entities/Element';
import { Scale } from './entities/Scale';
import { ScaleAnswer } from './entities/ScaleAnswer';
import { Question } from './entities/Question';
import { QuestionAnswer } from './entities/QuestionAnswer';
import { ChatMessage } from './entities/ChatMessage';
import { ChatSession } from './entities/ChatSession';
import { CreateChatTables1703664000000 } from './migration/1703664000000-CreateChatTables';
import { logger } from './config/logger';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 创建自定义 logger
class CustomLogger implements Logger {
    log(level: 'log' | 'info' | 'warn', message: any) {
        logger.info(`DB ${level}: ${message}`);
    }

    logQuery(query: string, parameters?: any[]) {
        logger.info('DB Query:', { query, parameters });
    }

    logQueryError(error: string | Error, query: string, parameters?: any[]) {
        // 添加更详细的错误信息
        const errorDetails = error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
            ...(error as any)
        } : error;

        logger.error('DB Query Error:', { error: errorDetails, query, parameters });
    }

    logQuerySlow(time: number, query: string, parameters?: any[]) {
        logger.warn('DB Slow Query:', { time, query, parameters });
    }

    logMigration(message: string) {
        logger.info('DB Migration:', message);
    }

    logSchemaBuild(message: string) {
        logger.info('DB Schema Build:', message);
    }

    logError(error: string | Error) {
        logger.error('DB Error:', error);
    }
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'chrdwvr450G',
  database: process.env.DB_NAME || 'rbridge',
  synchronize: true,
  logging: true,
  entities: [
    User,
    Element,
    Scale,
    ScaleAnswer,
    Question,
    QuestionAnswer,
    ChatMessage,
    ChatSession
  ],
  subscribers: [],
  ssl: false,
  extra: {
    max: 20,
    connectionTimeoutMillis: 5000,
  },
  schema: 'public',
  logger: new CustomLogger()
});

// 打印完整配置（只保留一次）
logger.info('Database configuration:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    entities: AppDataSource.options.entities?.length,
    synchronize: AppDataSource.options.synchronize,
    schema: 'public'
});  