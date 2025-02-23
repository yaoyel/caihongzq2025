"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDataSource = exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const typedi_1 = require("typedi");
const typeorm_2 = require("typeorm");
const User_1 = require("./entities/User");
const Element_1 = require("./entities/Element");
const Scale_1 = require("./entities/Scale");
const ScaleAnswer_1 = require("./entities/ScaleAnswer");
const Question_1 = require("./entities/Question");
const QuestionAnswer_1 = require("./entities/QuestionAnswer");
const ChatSession_1 = require("./entities/ChatSession");
const ChatMessage_1 = require("./entities/ChatMessage");
const logger_1 = require("./config/logger");
const dotenv_1 = require("dotenv");
// 加载环境变量
(0, dotenv_1.config)();
// 设置 TypeORM 容器
(0, typeorm_2.useContainer)(typedi_1.Container);
exports.AppDataSource = new typeorm_1.DataSource({
    name: 'default', // 设置默认连接名
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'chrdwvr450G',
    database: process.env.DB_NAME || 'rbridge',
    // synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    namingStrategy: new class extends typeorm_1.DefaultNamingStrategy {
        columnName(propertyName, customName) {
            return customName || propertyName;
        }
    },
    entities: [
        User_1.User,
        Element_1.Element,
        Scale_1.Scale,
        ScaleAnswer_1.ScaleAnswer,
        Question_1.Question,
        QuestionAnswer_1.QuestionAnswer,
        ChatSession_1.ChatSession,
        ChatMessage_1.ChatMessage
    ],
    migrations: [],
    subscribers: []
});
const initializeDataSource = async () => {
    try {
        const dataSource = await exports.AppDataSource.initialize();
        logger_1.logger.info('Database connection established');
        // 将 DataSource 实例注册到容器
        typedi_1.Container.set(typeorm_1.DataSource, dataSource);
        typedi_1.Container.set('connection.default', dataSource); // 注册为默认连接
        return dataSource;
    }
    catch (error) {
        logger_1.logger.error('Error during Data Source initialization:', error);
        throw error;
    }
};
exports.initializeDataSource = initializeDataSource;
