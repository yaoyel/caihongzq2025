"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const User_1 = require("./entities/User");
const Element_1 = require("./entities/Element");
const Scale_1 = require("./entities/Scale");
const ScaleAnswer_1 = require("./entities/ScaleAnswer");
const Question_1 = require("./entities/Question");
const QuestionAnswer_1 = require("./entities/QuestionAnswer");
const ChatMessage_1 = require("./entities/ChatMessage");
const ChatSession_1 = require("./entities/ChatSession");
const logger_1 = require("./config/logger");
const dotenv_1 = __importDefault(require("dotenv"));
const typedi_1 = require("typedi");
// 加载环境变量
dotenv_1.default.config();
// 创建自定义 logger
class CustomLogger {
    log(level, message) {
        logger_1.logger.info(`DB ${level}: ${message}`);
    }
    logQuery(query, parameters) {
        logger_1.logger.info('DB Query:', { query, parameters });
    }
    logQueryError(error, query, parameters) {
        // 添加更详细的错误信息
        const errorDetails = error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
            ...error
        } : error;
        logger_1.logger.error('DB Query Error:', { error: errorDetails, query, parameters });
    }
    logQuerySlow(time, query, parameters) {
        logger_1.logger.warn('DB Slow Query:', { time, query, parameters });
    }
    logMigration(message) {
        logger_1.logger.info('DB Migration:', message);
    }
    logSchemaBuild(message) {
        logger_1.logger.info('DB Schema Build:', message);
    }
    logError(error) {
        logger_1.logger.error('DB Error:', error);
    }
}
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'chrdwvr450G',
    database: process.env.DB_NAME || 'rbridge',
    synchronize: true,
    logging: true,
    entities: [
        User_1.User,
        Element_1.Element,
        Scale_1.Scale,
        ScaleAnswer_1.ScaleAnswer,
        Question_1.Question,
        QuestionAnswer_1.QuestionAnswer,
        ChatMessage_1.ChatMessage,
        ChatSession_1.ChatSession
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
// 将 AppDataSource 添加到容器中
typedi_1.Container.set(typeorm_1.DataSource, exports.AppDataSource);
// 打印完整配置（只保留一次）
logger_1.logger.info('Database configuration:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    entities: exports.AppDataSource.options.entities?.length,
    synchronize: exports.AppDataSource.options.synchronize,
    schema: 'public'
});
