import 'reflect-metadata';
import { DataSource, DefaultNamingStrategy } from 'typeorm';
import { Container } from 'typedi';
import { useContainer as typeormUseContainer } from 'typeorm';
import { User } from './entities/User';
import { Element } from './entities/Element';
import { Scale } from './entities/Scale';
import { ScaleAnswer } from './entities/ScaleAnswer';
import { Question } from './entities/Question';
import { QuestionAnswer } from './entities/QuestionAnswer';
import { ChatSession } from './entities/ChatSession';
import { ChatMessage } from './entities/ChatMessage';
import { logger } from './config/logger';
import { config } from 'dotenv'; 
// 加载环境变量
config();

// 设置 TypeORM 容器
typeormUseContainer(Container);

export const AppDataSource = new DataSource({
    name: 'default', // 设置默认连接名
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'chrdwvr450G',
    database: process.env.DB_NAME || 'rbridge',
    // synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    namingStrategy: new class extends DefaultNamingStrategy {
        columnName(propertyName: string, customName: string): string {
            return customName || propertyName;
        }
    },
    entities: [
        User,
        Element,
        Scale,
        ScaleAnswer,
        Question,
        QuestionAnswer,
        ChatSession,
        ChatMessage
    ],
    migrations: [],
    subscribers: []
});

export const initializeDataSource = async () => {
    try {
        
        const dataSource = await AppDataSource.initialize();
        logger.info('Database connection established');
        
        // 将 DataSource 实例注册到容器
        Container.set(DataSource, dataSource);
        Container.set('connection.default', dataSource); // 注册为默认连接
        
        return dataSource;
    } catch (error) {
        logger.error('Error during Data Source initialization:', error);
        throw error;
    }
};