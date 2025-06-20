import 'reflect-metadata';
import { DataSource, DefaultNamingStrategy } from 'typeorm';
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
import { DoubleEdgedInfo } from './entities/DoubleEdgedInfo';
import { DoubleEdgedScale } from './entities/DoubleEdgedScale';
import { DoubleEdgedAnswer } from './entities/DoubleEdgedAnswer';
import { ScaleOption } from './entities/ScaleOption';
import { MajorDetail } from './entities/MajorDetail';
import { Major } from './entities/Major';
import { SchoolMajor } from './entities/SchoolMajor';
import { School } from './entities/School';
import { MajorElementAnalysis } from './entities/MajorAnalysis';
import { SchoolDetail } from './entities/SchoolDetail'; 
import { Order } from './entities/Order';   

// 加载环境变量
config();

export const AppDataSource = new DataSource({
    name: 'default', // 设置默认连接名
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'rbridge',
    password: process.env.DB_PASSWORD || 'chrdwvr450G',
    database: process.env.DB_NAME || 'caihongzq-8088',
    // synchronize: false, // 生产环境不要打开
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
        ChatMessage,
        DoubleEdgedInfo,
        DoubleEdgedScale,
        DoubleEdgedAnswer,
        ScaleOption,
        School,
        Major,
        SchoolMajor,
        MajorDetail,
        MajorElementAnalysis,
        SchoolDetail,
        Order
    ],
    migrations: [
      //  __dirname + '/migrations/*.ts'  // 使用绝对路径
    ],
    // migrationsTableName: "migrations",  // 添加这行
    subscribers: []
});

export const initializeDataSource = async () => {
    try {
        
        const dataSource = await AppDataSource.initialize();
        logger.info('Database connection established');
        
        return dataSource;
    } catch (error) {
        logger.error('Error during Data Source initialization:', error);
        throw error;
    }
};