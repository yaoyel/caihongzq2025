import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Container } from 'typedi';
import { User } from './entities/User';
import { Element } from './entities/Element';
import { Scale } from './entities/Scale';
import { ScaleAnswer } from './entities/ScaleAnswer';
import { Question } from './entities/Question';
import { QuestionAnswer } from './entities/QuestionAnswer';
import { ChatSession } from './entities/ChatSession';
import { ChatMessage } from './entities/ChatMessage';
import { logger } from './config/logger';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'chrdwvr450G',
    database: 'rbridge',
    synchronize: true,
    logging: false,
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
        
        return dataSource;
    } catch (error) {
        logger.error('Error during Data Source initialization:', error);
        throw error;
    }
};  