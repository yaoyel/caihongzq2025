import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entity/User';
import { Element } from './entity/Element';
import { Scale } from './entity/Scale';
import { ScaleAnswer } from './entity/ScaleAnswer';
import { Question } from './entity/Question';
import { QuestionAnswer } from './entity/QuestionAnswer';
import dotenv from 'dotenv';
import { ChatMessage } from './entity/ChatMessage';
import { ChatSession } from './entity/ChatSession';
import { CreateChatTables1703664000000 } from './migration/1703664000000-CreateChatTables';

// 加载环境变量
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_DATABASE || 'talent_assessment',
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
  migrations: [
    CreateChatTables1703664000000
  ],
  subscribers: [],
});